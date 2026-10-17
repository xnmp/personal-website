import { readFile, rm } from "node:fs/promises";
import { join } from "node:path";

/** Recover an interrupted operation only after the owning server process died. */
export async function recoverStudioLock(root) {
  const path = join(root, ".content-studio/operation.lock");
  try {
    const owner = Number(await readFile(path, "utf8"));
    if (!Number.isSafeInteger(owner) || owner <= 0)
      throw new Error(
        `Invalid editor lock at ${path}; inspect it before removing it.`,
      );
    try {
      process.kill(owner, 0);
    } catch (error) {
      if (error.code === "ESRCH") {
        await rm(path, { force: true });
        return true;
      }
    }
    return false;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    return false;
  }
}
