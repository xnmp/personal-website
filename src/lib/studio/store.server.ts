import { createHash } from "node:crypto";
import {
  lstat,
  mkdir,
  open,
  readFile,
  readdir,
  rename,
  rm,
} from "node:fs/promises";
import { join } from "node:path";
import { parseContent, contentBlock } from "../content";
import { groupProjects } from "../project-groups";
import {
  documentSlots,
  editDocument,
  previewRoute,
  validateDocument,
  type StudioDocument,
} from "./document";
import { StudioError } from "./security.server";

export const revision = (source: string) =>
  createHash("sha256").update(source).digest("hex");
export const studioDirectory = (root: string) => join(root, ".content-studio");

export async function contentIds(root: string): Promise<string[]> {
  const walk = async (folder: string, prefix: string): Promise<string[]> => {
    const entries = await readdir(folder, { withFileTypes: true });
    return (
      await Promise.all(
        entries.map((entry) =>
          entry.isSymbolicLink()
            ? []
            : entry.isDirectory()
              ? walk(join(folder, entry.name), `${prefix}${entry.name}/`)
              : entry.isFile() && /^[a-z0-9-]+\.md$/.test(entry.name)
                ? [`${prefix}${entry.name.slice(0, -3)}`]
                : [],
        ),
      )
    ).flat();
  };
  return (await walk(join(root, "content"), "")).sort((a, b) =>
    a === "home"
      ? -1
      : b === "home"
        ? 1
        : a === "about"
          ? -1
          : b === "about"
            ? 1
            : a.localeCompare(b),
  );
}

export async function documentPath(root: string, id: string): Promise<string> {
  if (
    !/^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/.test(id) ||
    !(await contentIds(root)).includes(id)
  )
    throw new StudioError(404, "Unknown content document");
  const path = join(root, "content", `${id}.md`);
  if (!(await lstat(path)).isFile())
    throw new StudioError(400, "Content must be a regular file");
  return path;
}

export async function readDocument(
  root: string,
  id: string,
): Promise<StudioDocument> {
  const source = await readFile(await documentPath(root, id), "utf8");
  const document = parseContent(source, id);
  return {
    id,
    title: String(
      document.data.title ??
        (id === "home"
          ? "Projects"
          : id === "about"
            ? "About"
            : id.replace(/^projects\//, "").replace(/-/g, " ")),
    ),
    route: previewRoute(id),
    source,
    revision: revision(source),
    slots: documentSlots(source),
  };
}

/** No partial writes or interleaved saves/deploy snapshots, including other tabs/processes. */
export async function withStudioLock<T>(
  root: string,
  action: () => Promise<T>,
): Promise<T> {
  await mkdir(studioDirectory(root), { recursive: true });
  const path = join(studioDirectory(root), "operation.lock");
  let lock;
  try {
    lock = await open(path, "wx", 0o600);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    throw new StudioError(
      409,
      "Another save or deployment is running. Wait for it to finish.",
    );
  }
  try {
    await lock.writeFile(String(process.pid));
    return await action();
  } finally {
    await lock.close();
    await rm(path, { force: true });
  }
}

export async function validateCollection(
  root: string,
  update?: { id: string; source: string },
): Promise<void> {
  const ids = await contentIds(root);
  const documents = new Map(
    await Promise.all(
      ids.map(async (id) => {
        const source =
          id === update?.id
            ? update.source
            : await readFile(await documentPath(root, id), "utf8");
        validateDocument(id, source);
        return [id, parseContent(source, id)] as const;
      }),
    ),
  );
  const home = documents.get("home")!;
  const referenced = [home.data.flagship, ...(home.data.featured as string[])];
  if (
    referenced.some(
      (slug) => typeof slug !== "string" || !documents.has(`projects/${slug}`),
    ) ||
    new Set(referenced).size !== referenced.length
  )
    throw new Error(
      "Home's flagship and featured projects must exist and be unique",
    );
  const about = documents.get("about")!;
  contentBlock(about, String(about.data.intro));
  for (const section of about.data.sections as { body: string }[])
    contentBlock(about, section.body);
  const grouping = documents.get("project-groups");
  if (!grouping) throw new Error("Missing content/project-groups.md");
  groupProjects(
    ids.filter(id => id.startsWith("projects/")).map(id => ({ slug: id.slice(9) })),
    about.data.sections as { body: string; heading: string }[],
    grouping.data,
  );
}

export async function saveDocument(
  root: string,
  input: {
    id: string;
    revision: string;
    edits: Readonly<Record<string, string>>;
  },
): Promise<StudioDocument> {
  return withStudioLock(root, async () => {
    const current = await readDocument(root, input.id);
    if (current.revision !== input.revision)
      throw new StudioError(
        409,
        "This file changed outside your editor. Your draft is intact. Reload the file before saving again.",
      );
    const source = editDocument(current.source, input.edits);
    validateDocument(input.id, source, current.source);
    await validateCollection(root, { id: input.id, source });
    const path = await documentPath(root, input.id);
    const temporary = `${path}.studio-${process.pid}`;
    try {
      await (await open(temporary, "wx", 0o600)).close();
      await import("node:fs/promises").then((fs) =>
        fs.writeFile(temporary, source, "utf8"),
      );
      await rename(temporary, path);
    } finally {
      await rm(temporary, { force: true });
    }
    return readDocument(root, input.id);
  });
}
