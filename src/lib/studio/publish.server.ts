import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import {
  contentIds,
  documentPath,
  studioDirectory,
  validateCollection,
  withStudioLock,
} from "./store.server";
import { StudioError } from "./security.server";

const execute = promisify(execFile);
export const REPOSITORY = "xnmp/personal-website";
export const PUBLIC_URL = "https://personal-website-eight-tan-11.vercel.app";
export type PublishJob = {
  phase:
    | "idle"
    | "validating"
    | "building"
    | "pushing"
    | "deploying"
    | "live"
    | "error";
  message: string;
  commit?: string;
  url?: string;
  startedAt?: number;
};
export const busyJob = (job: PublishJob) =>
  ["validating", "building", "pushing", "deploying"].includes(job.phase);
export const command = async (
  cwd: string,
  args: readonly string[],
  trim = true,
  environment: Partial<NodeJS.ProcessEnv> = {},
) => {
  try {
    const output = (
      await execute(args[0], args.slice(1), {
        cwd,
        timeout: 10 * 60_000,
        maxBuffer: 2_000_000,
        env: {
          ...process.env,
          CONTENT_STUDIO: "0",
          CONTENT_STUDIO_TOKEN: "",
          NEXT_DIST_DIR: ".next-studio-build",
          ...environment,
        },
      })
    ).stdout;
    return trim ? output.trim() : output;
  } catch (error) {
    const failure = error as Error & { stderr?: string; stdout?: string };
    throw new Error(
      `${args[0]} ${args[1] ?? ""} failed: ${(failure.stderr || failure.stdout || failure.message).slice(-10_000)}`,
    );
  }
};

/** Real dependencies stay within Turbopack's filesystem root; build uses production semantics. */
export async function validateProductionBuild(checkout: string): Promise<void> {
  await command(checkout, ["bun", "install", "--frozen-lockfile"], true, {
    NODE_ENV: "development",
    BUN_TMPDIR: tmpdir(),
  });
  await command(checkout, ["bun", "run", "build"], true, {
    NODE_ENV: "production",
  });
}

export async function assertPublishRemote(root: string): Promise<void> {
  const remote = await command(root, ["git", "remote", "get-url", "origin"]);
  if (
    ![
      "https://github.com/xnmp/personal-website",
      "https://github.com/xnmp/personal-website.git",
      "git@github.com:xnmp/personal-website.git",
      "ssh://git@github.com/xnmp/personal-website.git",
    ].includes(remote)
  )
    throw new StudioError(
      400,
      "Deploy is configured for xnmp/personal-website only",
    );
}

/** A remote edit never gets silently overwritten by a local document snapshot. */
export function publicationChanges(
  base: ReadonlyMap<string, string>,
  remote: ReadonlyMap<string, string>,
  local: ReadonlyMap<string, string>,
): Map<string, string> {
  const changed = new Map<string, string>();
  for (const [id, source] of local) {
    if (source === base.get(id) || source === remote.get(id)) continue;
    if (remote.get(id) !== base.get(id))
      throw new StudioError(
        409,
        `${id}.md changed on main. Your local draft is safe; reconcile that file before deploying.`,
      );
    changed.set(id, source);
  }
  return changed;
}

const sourcesAt = async (
  root: string,
  ref: string,
  ids: readonly string[],
  baselines: Readonly<Record<string, string>> = {},
) => {
  // Absence is part of the three-way comparison, distinct from an empty file.
  // Enumerate each revision first so missing documents are skipped without
  // masking invalid revisions or other Git failures.
  const trees = new Map(
    await Promise.all(
      [...new Set(ids.map((id) => baselines[id] ?? ref))].map(async (revision) =>
        [revision, new Set((await command(root, [
          "git", "ls-tree", "-r", "--name-only", "-z", revision, "--", "content/",
        ], false)).split("\0"))] as const,
      ),
    ),
  );
  const present = ids.filter((id) =>
    trees.get(baselines[id] ?? ref)!.has(`content/${id}.md`),
  );
  return new Map(
    await Promise.all(
      present.map(
        async (id) =>
          [
            id,
            await command(
              root,
              ["git", "show", `${baselines[id] ?? ref}:content/${id}.md`],
              false,
            ),
          ] as const,
      ),
    ),
  );
};

/** The isolated worktree contains main + content only, irrespective of local code/index/WIP. */
export async function publishContent(options: {
  root: string;
  base: string;
  baselines?: Readonly<Record<string, string>>;
  published?: (commit: string, ids: readonly string[]) => Promise<void>;
  progress: (job: PublishJob) => void;
  build?: (directory: string) => Promise<void>;
  ready?: (
    commit: string,
    progress: (job: PublishJob) => void,
  ) => Promise<void>;
}): Promise<string> {
  const { root, base, progress } = options;
  return withStudioLock(root, async () => {
    progress({
      phase: "validating",
      message: "Checking content and the latest main…",
    });
    await validateCollection(root);
    const ids = await contentIds(root);
    const local = new Map(
      await Promise.all(
        ids.map(
          async (id) =>
            [id, await readFile(await documentPath(root, id), "utf8")] as const,
        ),
      ),
    );
    const original = await sourcesAt(root, base, ids, options.baselines);
    await command(root, ["git", "fetch", "origin", "main"]);
    const target = await command(root, ["git", "rev-parse", "FETCH_HEAD"]);
    const remote = await sourcesAt(root, target, ids);
    const changes = publicationChanges(original, remote, local);
    const acknowledged = ids.filter(
      (id) =>
        local.get(id) !== original.get(id) && local.get(id) === remote.get(id),
    );
    if (!changes.size) {
      await options.published?.(target, acknowledged);
      progress({
        phase: "deploying",
        message: "Saved content is already on main. Checking production…",
        commit: target,
      });
      if (options.ready) await options.ready(target, progress);
      else await waitForVercel(root, target, progress);
      return target;
    }
    const builds = join(studioDirectory(root), "builds");
    await mkdir(builds, { recursive: true });
    const temp = await mkdtemp(join(builds, "deploy-"));
    const checkout = join(temp, "site");
    let added = false;
    try {
      await command(root, [
        "git",
        "worktree",
        "add",
        "--detach",
        checkout,
        target,
      ]);
      added = true;
      for (const [id, source] of changes)
        await writeFile(join(checkout, "content", `${id}.md`), source, "utf8");
      await validateCollection(checkout);
      progress({
        phase: "building",
        message: `Building ${changes.size} changed ${changes.size === 1 ? "file" : "files"} against main…`,
      });
      if (options.build) await options.build(checkout);
      else {
        await validateProductionBuild(checkout);
      }
      await command(checkout, [
        "git",
        "add",
        "--",
        ...[...changes.keys()].map((id) => `content/${id}.md`),
      ]);
      await command(checkout, [
        "git",
        "commit",
        "-m",
        "Update website content from local editor",
      ]);
      const commit = await command(checkout, ["git", "rev-parse", "HEAD"]);
      progress({
        phase: "pushing",
        message: "Publishing the validated content commit…",
        commit,
      });
      await command(checkout, [
        "git",
        "push",
        "origin",
        "HEAD:refs/heads/main",
      ]);
      await options.published?.(commit, [...changes.keys(), ...acknowledged]);
      progress({
        phase: "deploying",
        message: "Content is on main. Waiting for Vercel…",
        commit,
      });
      if (options.ready) await options.ready(commit, progress);
      else await waitForVercel(root, commit, progress);
      return commit;
    } finally {
      if (added)
        await command(root, ["git", "worktree", "remove", "--force", checkout]);
      await rm(temp, { recursive: true, force: true });
    }
  });
}

export async function waitForVercel(
  root: string,
  commit: string,
  progress: (job: PublishJob) => void,
): Promise<void> {
  const deadline = Date.now() + 15 * 60_000;
  while (Date.now() < deadline) {
    const payload = JSON.parse(
      await command(root, [
        "gh",
        "api",
        `repos/${REPOSITORY}/commits/${commit}/status`,
      ]),
    );
    const status = payload.statuses?.find(
      (entry: { context: string }) => entry.context === "Vercel",
    );
    if (["error", "failure"].includes(status?.state))
      throw new Error(
        `Vercel deployment failed. Content commit ${commit.slice(0, 7)} is preserved on main. ${status.target_url ?? ""}`,
      );
    if (status?.state === "success") {
      const deployments = JSON.parse(
        await command(root, [
          "gh",
          "api",
          `repos/${REPOSITORY}/deployments?sha=${commit}&environment=Production`,
        ]),
      );
      for (const deployment of deployments) {
        const statuses = JSON.parse(
          await command(root, [
            "gh",
            "api",
            `repos/${REPOSITORY}/deployments/${deployment.id}/statuses`,
          ]),
        );
        if (statuses[0]?.state === "success") {
          progress({
            phase: "live",
            message: "Your changes are live.",
            commit,
            url: PUBLIC_URL,
          });
          return;
        }
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  throw new Error(
    `Content commit ${commit.slice(0, 7)} is on main; Vercel has not confirmed production yet. Check GitHub deployment status before retrying.`,
  );
}
