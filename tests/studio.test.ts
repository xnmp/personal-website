import { recoverStudioLock } from "../scripts/studio-lock.mjs";
import {
  recordPublication,
  studioBase,
  studioRuntime,
} from "../src/lib/studio/runtime.server";
import { afterEach, describe, expect, test } from "bun:test";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { contentBlock, parseContent } from "../src/lib/content";
import { editDocument, previewRoute, validateDocument } from "../src/lib/studio/document";
import {
  authorizeStudio,
  studioEnabled,
} from "../src/lib/studio/security.server";
import {
  contentIds,
  readDocument,
  saveDocument,
  withStudioLock,
} from "../src/lib/studio/store.server";
import {
  command,
  publicationChanges,
  publishContent,
} from "../src/lib/studio/publish.server";

const roots: string[] = [];

test("editor document routes follow the landing page and project directory", () => {
  expect(previewRoute("about")).toBe("/");
  expect(previewRoute("home")).toBe("/projects");
  expect(previewRoute("project-groups")).toBe("/projects");
  expect(previewRoute("projects/tauri-explorer")).toBe("/p/tauri-explorer");
  expect(previewRoute("zheng-shang-you-play")).toBe("/p/zheng-shang-you/play");
  expect(previewRoute("tableau-frog")).toBe("/tableau-frog");
});
const fixture = async () => {
  const root = await mkdtemp(join(tmpdir(), "studio-test-"));
  roots.push(root);
  await cp("content", join(root, "content"), { recursive: true });
  return root;
};
afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe("source editing", () => {
  test("patches quoted, folded, literal, nested and sequence scalars without touching surrounding bytes", () => {
    const source =
      '---\ntitle: "Hello: world" # keep\nfolded: >-\n  first line\n  second line\nliteral: |\n  multiline\n  value\nitems:\n  - label: old # same\n---\n<!-- block: intro -->\nOld **copy**.\n\n<!-- block: end -->\nUntouched.\n';
    const edits = {
      'field:["folded"]': "New\ncopy",
      'field:["items",0,"label"]': "Changed: value",
      "block:intro": "New [link](/about).",
    };
    const result = editDocument(source, edits);
    expect(result).toContain('title: "Hello: world" # keep');
    expect(result).toContain("literal: |\n  multiline\n  value\n");
    expect(result).toContain('label: "Changed: value" # same');
    expect(result).toContain("<!-- block: end -->\nUntouched.\n");
    expect(parseContent(result).data.folded).toBe("New\ncopy");
    expect(contentBlock(parseContent(result), "intro")).toBe(
      "New [link](/about).",
    );
  });

  test("can clear and then re-edit an empty Markdown block without moving its neighbors", () => {
    const source =
      "<!-- block: intro -->\nHello.\n\n<!-- block: end -->\nUnchanged.\n";
    const cleared = editDocument(source, { "block:intro": "" });
    expect(contentBlock(parseContent(cleared), "intro")).toBe("");
    expect(editDocument(cleared, { "block:intro": "Restored." })).toBe(
      source.replace("Hello.", "Restored."),
    );
  });

  test("supports CRLF and preserves all existing metadata when editing a block", () => {
    const source =
      "---\r\ntitle: Notes\r\n---\r\n<!-- block: intro -->\r\nHello.\r\n\r\n<!-- block: footer -->\r\nBye.\r\n";
    expect(editDocument(source, { "block:intro": "Edited." })).toBe(
      source.replace("Hello.", "Edited."),
    );
  });

  test("repeated saves after clearing a boundary paragraph do not accumulate blank lines", () => {
    for (const eol of ["\n", "\r\n"]) {
      const source = ["<!-- block: intro -->", "First.", "", "Second.", "", "<!-- block: end -->", "Unchanged.", ""].join(eol);
      const cleared = editDocument(source, { "block:intro": `${eol}${eol}Second.${eol}${eol}` });
      expect(cleared).toBe(source.replace(`First.${eol}${eol}`, ""));
      const edited = editDocument(cleared, { "block:intro": `${eol}${eol}Second. More.${eol}${eol}` });
      expect(edited).toBe(cleared.replace("Second.", "Second. More."));
      expect(editDocument(edited, { "block:intro": `${eol}${eol}Second. More.${eol}${eol}` })).toBe(edited);
    }
  });

  test("rejects unknown slots, malformed values, structural injection and invalid project metadata", async () => {
    const source = await readFile("content/projects/scrivo.md", "utf8");
    expect(() => editDocument(source, { unknown: "x" })).toThrow("Unknown");
    expect(() =>
      editDocument(source, { "block:headline": "<!-- block: stolen -->\nHi" }),
    ).toThrow("markers");
    expect(() =>
      editDocument(source, { 'field:["order"]': "Infinity" }),
    ).toThrow("finite");
    expect(() =>
      validateDocument(
        "projects/scrivo",
        editDocument(source, { 'field:["slug"]': "different" }),
        source,
      ),
    ).toThrow("href");
    expect(() =>
      validateDocument(
        "projects/scrivo",
        source.replace(/<!-- block: headline -->/, "<!-- block: replaced -->"),
        source,
      ),
    ).toThrow("identities");
    expect(() => validateDocument("home", "x".repeat(1_000_001))).toThrow(
      "1 MB",
    );
  });

  test("enumerates every authored text slot and leaves no-op edits byte-identical", async () => {
    const root = await fixture();
    for (const id of await contentIds(root)) {
      const document = await readDocument(root, id);
      expect(document.slots.length).toBeGreaterThan(0);
      expect(editDocument(document.source, {})).toBe(document.source);
      for (const slot of document.slots) {
        const next = editDocument(document.source, { [slot.id]: slot.value });
        expect(parseContent(next).data).toEqual(
          parseContent(document.source).data,
        );
        expect(parseContent(next).blocks).toEqual(
          parseContent(document.source).blocks,
        );
      }
    }
  });
});

describe("local persistence and authorization", () => {
  test("saves actual Markdown, rejects stale tabs and invalid cross-page references without losing disk content", async () => {
    const root = await fixture();
    const before = await readDocument(root, "home");
    const saved = await saveDocument(root, {
      id: "home",
      revision: before.revision,
      edits: { "block:margin-intro": "A newly edited private garden." },
    });
    expect(
      contentBlock(
        parseContent(await readFile(join(root, "content/home.md"), "utf8")),
        "margin-intro",
      ),
    ).toBe("A newly edited private garden.");
    await expect(
      saveDocument(root, {
        id: "home",
        revision: before.revision,
        edits: { "block:margin-intro": "Stale text" },
      }),
    ).rejects.toThrow("changed outside");
    await expect(
      saveDocument(root, {
        id: "home",
        revision: saved.revision,
        edits: { 'field:["flagship"]': "missing-project" },
      }),
    ).rejects.toThrow("must exist");
    expect((await readDocument(root, "home")).source).toBe(saved.source);
    for (const [id, edits] of [
      ["project-groups", { 'field:["sections",0,"projects",0]': "missing-project" }],
      ["about", { 'field:["sections",0,"heading"]': "" }],
    ] as const) {
      const original = await readDocument(root, id);
      await expect(saveDocument(root, { id, revision: original.revision, edits })).rejects.toThrow("content/project-groups.md:");
      expect((await readDocument(root, id)).source).toBe(original.source);
    }
    await expect(readDocument(root, "../package")).rejects.toThrow("Unknown");
  });

  test("serializes save/deploy operations and releases its lock after an error", async () => {
    const root = await fixture();
    await expect(
      withStudioLock(root, async () => {
        await expect(withStudioLock(root, async () => true)).rejects.toThrow(
          "Another",
        );
        throw new Error("fail");
      }),
    ).rejects.toThrow("fail");
    expect(await withStudioLock(root, async () => "available")).toBe(
      "available",
    );
  });

  test("recovers an abandoned process lock at startup but never removes a live process lock", async () => {
    const root = await fixture();
    await mkdir(join(root, ".content-studio"));
    const lock = join(root, ".content-studio/operation.lock");
    await writeFile(lock, "999999999");
    expect(await recoverStudioLock(root)).toBe(true);
    expect(await withStudioLock(root, async () => true)).toBe(true);
    await writeFile(lock, String(process.pid));
    expect(await recoverStudioLock(root)).toBe(false);
    expect(await readFile(lock, "utf8")).toBe(String(process.pid));
  });

  test("requires development, explicit local opt-in, exact origin/host and token; Vercel is always disabled", () => {
    const env = {
      NODE_ENV: "development",
      CONTENT_STUDIO: "1",
      CONTENT_STUDIO_TOKEN: "secret",
      CONTENT_STUDIO_ORIGIN: "http://127.0.0.1:3210",
    } as NodeJS.ProcessEnv;
    const request = (
      overrides: Record<string, string> = {},
      url = env.CONTENT_STUDIO_ORIGIN!,
    ) =>
      new Request(`${url}/api/studio`, {
        method: "POST",
        headers: {
          host: "127.0.0.1:3210",
          origin: env.CONTENT_STUDIO_ORIGIN!,
          "x-studio-token": "secret",
          ...overrides,
        },
      });
    expect(() => authorizeStudio(request(), env)).not.toThrow();
    for (const headers of [
      { origin: "https://evil.example" },
      { host: "evil.example" },
      { "x-studio-token": "bad" },
      { "sec-fetch-site": "cross-site" },
    ] as Record<string, string>[])
      expect(() => authorizeStudio(request(headers), env)).toThrow();
    expect(studioEnabled({ ...env, NODE_ENV: "production" })).toBe(false);
    expect(studioEnabled({ ...env, VERCEL: "1" })).toBe(false);
    expect(studioEnabled({ ...env, CONTENT_STUDIO_TOKEN: "" })).toBe(false);
  });
});

describe("content-only publishing", () => {
  test("detects remote conflicts while allowing unchanged files and already-published content", () => {
    expect([
      ...publicationChanges(
        new Map([
          ["a", "old"],
          ["b", "old"],
        ]),
        new Map([
          ["a", "old"],
          ["b", "remote"],
        ]),
        new Map([
          ["a", "new"],
          ["b", "old"],
        ]),
      ),
    ]).toEqual([["a", "new"]]);
    expect(
      publicationChanges(
        new Map([["a", "old"]]),
        new Map([["a", "new"]]),
        new Map([["a", "new"]]),
      ).size,
    ).toBe(0);
    expect(() =>
      publicationChanges(
        new Map([["a", "old"]]),
        new Map([["a", "remote"]]),
        new Map([["a", "local"]]),
      ),
    ).toThrow("changed on main");
  });

  test("publishes only content from an isolated main worktree, supports another edit/deploy and keeps WIP untouched", async () => {
    const root = await fixture();
    const bare = join(root, "remote.git");
    await command(root, ["git", "init", "--bare", bare]);
    await command(root, ["git", "init", "-b", "main"]);
    await command(root, ["git", "config", "user.name", "Studio Test"]);
    await command(root, [
      "git",
      "config",
      "user.email",
      "studio@example.invalid",
    ]);
    await writeFile(join(root, "code.txt"), "published code\n");
    await command(root, ["git", "add", "content", "code.txt"]);
    await command(root, ["git", "commit", "-m", "Initial"]);
    await command(root, ["git", "remote", "add", "origin", bare]);
    await command(root, ["git", "push", "-u", "origin", "main"]);
    let head = await command(root, ["git", "rev-parse", "HEAD"]);
    const remoteEdit = async (copy: string) => {
      const worktree = join(root, `remote-edit-${copy.length}`);
      await command(root, ["git", "fetch", "origin", "main"]);
      await command(root, [
        "git",
        "worktree",
        "add",
        "--detach",
        worktree,
        "origin/main",
      ]);
      const file = join(worktree, "content/about.md");
      const source = await readFile(file, "utf8");
      await writeFile(file, editDocument(source, { "block:intro": copy }));
      await command(worktree, ["git", "add", "content/about.md"]);
      await command(worktree, ["git", "commit", "-m", "Remote edit"]);
      await command(worktree, ["git", "push", "origin", "HEAD:main"]);
      await command(root, ["git", "worktree", "remove", "--force", worktree]);
    };
    await remoteEdit("Remote-only About copy.");
    studioRuntime.base = undefined;
    studioRuntime.baselines = {};
    expect(await studioBase(root)).toBe(head); // origin/main is newer than the local checkout
    let base = await studioBase(root);
    await writeFile(join(root, "code.txt"), "unrelated WIP\n");
    const beforeFailure = await readDocument(root, "home");
    await saveDocument(root, {
      id: "home",
      revision: beforeFailure.revision,
      edits: {
        "block:margin-intro": "A build failure keeps this local draft.",
      },
    });
    const remoteBeforeFailure = await command(root, [
      "git",
      "--git-dir",
      bare,
      "rev-parse",
      "main",
    ]);
    await expect(
      publishContent({
        root,
        base,
        progress: () => {},
        build: async () => {
          throw new Error("Intentional validation failure");
        },
        ready: async () => {},
      }),
    ).rejects.toThrow("Intentional validation failure");
    expect(
      await command(root, ["git", "--git-dir", bare, "rev-parse", "main"]),
    ).toBe(remoteBeforeFailure);
    expect((await readDocument(root, "home")).source).toContain(
      "A build failure keeps this local draft.",
    );
    const phases: string[] = [];
    for (const text of [
      "First publication.",
      "Second publication.",
      "Third publication.",
    ]) {
      const before = await readDocument(root, "home");
      await saveDocument(root, {
        id: "home",
        revision: before.revision,
        edits: { "block:margin-intro": text },
      });
      const commit = await publishContent({
        root,
        base,
        baselines: studioRuntime.baselines,
        published: (commit, ids) => recordPublication(root, commit, ids),
        progress: (job) => phases.push(job.phase),
        build: async (checkout) => {
          expect(await readFile(join(checkout, "code.txt"), "utf8")).toBe(
            "published code\n",
          );
          expect(
            contentBlock(
              parseContent(
                await readFile(join(checkout, "content/home.md"), "utf8"),
              ),
              "margin-intro",
            ),
          ).toBe(text);
          await writeFile(
            join(checkout, "build-unrelated.txt"),
            "never commit this",
          );
        },
        ready: async (commit, progress) => {
          progress({ phase: "live", message: "Fake deployment ready", commit });
        },
      });
      expect(
        await command(root, ["git", "--git-dir", bare, "rev-parse", "main"]),
      ).toBe(commit);
      expect(
        await command(root, [
          "git",
          "diff-tree",
          "--no-commit-id",
          "--name-only",
          "-r",
          commit,
        ]),
      ).toBe("content/home.md");
      const remoteAbout = await command(
        root,
        ["git", "--git-dir", bare, "show", "main:content/about.md"],
        false,
      );
      expect(contentBlock(parseContent(remoteAbout), "intro")).toBe(
        text === "Third publication."
          ? "Remote-only About copy, updated again."
          : "Remote-only About copy.",
      );
      if (text === "First publication.") {
        // An unrelated code commit must not discard the acknowledged content baseline.
        await writeFile(join(root, "code.txt"), "code-only commit\n");
        await command(root, ["git", "add", "code.txt"]);
        await command(root, ["git", "commit", "-m", "Code only"]);
        head = await command(root, ["git", "rev-parse", "HEAD"]);
        await writeFile(join(root, "code.txt"), "unrelated WIP\n");
      }
      // A process restart reloads per-document acknowledgements without treating stale About as an edit.
      studioRuntime.base = undefined;
      studioRuntime.baselines = {};
      base = await studioBase(root);
      expect(base).toBe(head);
      expect(studioRuntime.baselines.home).toBe(commit);
      expect(studioRuntime.baselines.about).toBeUndefined();
      if (text === "Second publication.") {
        await remoteEdit("Remote-only About copy, updated again.");
        await publishContent({
          root,
          base,
          baselines: studioRuntime.baselines,
          published: (commit, ids) => recordPublication(root, commit, ids),
          progress: (job) => phases.push(job.phase),
          build: async () => {
            throw new Error("No-change deploy must not build");
          },
          ready: async () => {},
        });
      }
    }
    expect(await readFile(join(root, "code.txt"), "utf8")).toBe(
      "unrelated WIP\n",
    );
    expect(phases).toContain("building");
    expect(phases).toContain("live");
    expect(
      await command(root, ["git", "worktree", "list", "--porcelain"]),
    ).not.toContain("content-studio-");
  }, 30_000);
});
