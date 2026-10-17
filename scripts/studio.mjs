import { randomBytes } from "node:crypto";
import { recoverStudioLock } from "./studio-lock.mjs";
import { spawn } from "node:child_process";

if (await recoverStudioLock(process.cwd()))
  console.log("Recovered the previous editor’s interrupted operation.");

const port = process.env.STUDIO_PORT ?? "3210";
if (!/^\d+$/.test(port) || Number(port) < 1024 || Number(port) > 65535)
  throw new Error("STUDIO_PORT must be between 1024 and 65535");
const origin = `http://127.0.0.1:${port}`;
console.log(`\nContent editor: ${origin}/studio\n`);
const child = spawn(
  "bun",
  ["run", "dev", "--hostname", "127.0.0.1", "--port", port],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_ENV: "development",
      CONTENT_STUDIO: "1",
      CONTENT_STUDIO_TOKEN: randomBytes(32).toString("hex"),
      CONTENT_STUDIO_ORIGIN: origin,
      NEXT_DIST_DIR: ".next-studio",
    },
  },
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 1));
