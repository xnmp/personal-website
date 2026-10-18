import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
// Next 16.2 reads the inherited option when choosing its child server's heap limit.
const child = spawn(process.execPath, [
  '--require', fileURLToPath(new URL('./dev-memory.cjs', import.meta.url)),
  require.resolve('next/dist/bin/next'), 'dev', '--webpack', ...process.argv.slice(2),
], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_OPTIONS: [process.env.NODE_OPTIONS, '--max-old-space-size=4096'].filter(Boolean).join(' '),
  },
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.once('error', error => { console.error(error.message); process.exitCode = 1; });
child.once('exit', code => process.exit(code ?? 1));
