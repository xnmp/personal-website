import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { command, type PublishJob } from "./publish.server";
import { studioDirectory } from "./store.server";

export type StudioRuntime = {
  base?: string;
  baselines: Record<string, string>;
  job: PublishJob;
};
const globalStudio = globalThis as typeof globalThis & {
  contentStudioRuntime?: StudioRuntime;
};
export const studioRuntime = (globalStudio.contentStudioRuntime ??= {
  baselines: {},
  job: { phase: "idle", message: "Saved locally. Deploy when you’re ready." },
});

export async function studioBase(root: string): Promise<string> {
  if (studioRuntime.base) return studioRuntime.base;
  const head = await command(root, ["git", "rev-parse", "HEAD"]);
  try {
    const saved = JSON.parse(
      await readFile(join(studioDirectory(root), "published.json"), "utf8"),
    );
    if (
      typeof saved.head === "string" &&
      /^[a-f0-9]{40}$/.test(saved.head) &&
      saved.baselines &&
      typeof saved.baselines === "object" &&
      Object.entries(saved.baselines).every(
        ([id, value]) =>
          /^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/.test(id) &&
          typeof value === "string" &&
          /^[a-f0-9]{40}$/.test(value),
      )
    ) {
      const changed =
        saved.head === head
          ? []
          : (
              await command(root, [
                "git",
                "diff",
                "--name-only",
                saved.head,
                head,
                "--",
                "content/",
              ])
            ).split("\n");
      const changedIds = new Set(
        changed.map((path) =>
          path.replace(/^content\//, "").replace(/\.md$/, ""),
        ),
      );
      studioRuntime.baselines = Object.fromEntries(
        Object.entries(saved.baselines).filter(([id]) => !changedIds.has(id)),
      ) as Record<string, string>;
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  studioRuntime.base = head;
  return head;
}

/** Advance only the published files: untouched local files may intentionally trail main. */
export async function recordPublication(
  root: string,
  commit: string,
  ids: readonly string[],
): Promise<void> {
  const baselines = {
    ...studioRuntime.baselines,
    ...Object.fromEntries(ids.map((id) => [id, commit])),
  };
  await mkdir(studioDirectory(root), { recursive: true });
  const path = join(studioDirectory(root), "published.json");
  await writeFile(
    `${path}.tmp`,
    JSON.stringify({ head: studioRuntime.base, baselines }),
    { mode: 0o600 },
  );
  await rename(`${path}.tmp`, path);
  studioRuntime.baselines = baselines;
}
