import { cache } from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseContent } from "./content";

/** Files are read at build time for static pages, and on refresh in development. */
export const readContent = cache(function readContent(name: string) {
  if (!/^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/.test(name))
    throw new Error(`Invalid content path: ${name}`);
  const filename = `content/${name}.md`;
  return parseContent(
    readFileSync(join(process.cwd(), filename), "utf8"),
    filename,
  );
});
