import { expect, test } from 'bun:test';
import { mkdir, mkdtemp, readFile, readdir, rm, stat, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { createRotatingLog } from '../scripts/dev-memory.cjs';

test('memory log retains recent valid records within its two-file disk budget', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dev-memory-'));
  try {
    const file = join(root, 'memory.jsonl');
    const write = createRotatingLog(file, 512);
    for (let i = 0; i < 40; i++) write({ sequence: i, memory: { rss: 1000000000 }, padding: 'x'.repeat(40) });
    const files = await readdir(root);
    expect(files).toHaveLength(2);
    let bytes = 0;
    for (const name of files) {
      bytes += (await stat(join(root, name))).size;
      for (const line of (await readFile(join(root, name), 'utf8')).trim().split('\n')) expect(JSON.parse(line).sequence).toBeGreaterThanOrEqual(0);
    }
    expect(bytes).toBeLessThanOrEqual(1024);
    expect(JSON.parse((await readFile(file, 'utf8')).trim().split('\n').at(-1)!)).toMatchObject({ sequence: 39 });
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('server logging reports real memory and completed requests without query strings or headers', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dev-memory-'));
  try {
    const script = resolve('scripts/dev-memory.cjs');
    const child = spawnSync('node', ['-e', `
      process.argv[1]='/diagnostic/next/dist/server/lib/start-server.js';
      require(${JSON.stringify(script)});
      const http=require('node:http');
      const server=http.createServer((req,res)=>res.end('ok'));
      server.listen(0,'127.0.0.1',()=>http.get({host:'127.0.0.1',port:server.address().port,path:'/p/example?token=private-value',headers:{authorization:'secret-header'}},res=>{res.resume();res.on('end',()=>server.close());}));
    `], { cwd: root, env: { ...process.env, NODE_ENV: 'development' }, encoding: 'utf8', timeout: 10000 });
    expect(child.status).toBe(0);
    const source = await readFile(join(root, '.content-studio/logs/dev-memory.jsonl'), 'utf8');
    expect(source).not.toContain('private-value');
    expect(source).not.toContain('secret-header');
    const records = source.trim().split('\n').map(line => JSON.parse(line));
    expect(records[0]).toMatchObject({ event: 'start', pid: child.pid });
    const end = records.at(-1);
    expect(end.event).toBe('exit');
    expect(end.memory.rss).toBeGreaterThan(0);
    expect(end.memory.heapUsed).toBeGreaterThan(0);
    expect(end.requests).toMatchObject({ active: 0, completed: 1, recent: { '/p/example': 1 } });
  } finally { await rm(root, { recursive: true, force: true }); }
});


test('development launcher applies the heap safeguard to the actual Next child', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dev-memory-launch-'));
  let child: ReturnType<typeof spawn> | undefined;
  try {
    await mkdir(join(root, 'app'));
    await writeFile(join(root, 'app/page.js'), 'export default function Page(){return <p>probe</p>}');
    await writeFile(join(root, 'app/layout.js'), 'export default function Layout({children}){return <html><body>{children}</body></html>}');
    await writeFile(join(root, 'package.json'), '{}');
    await symlink(resolve('node_modules'), join(root, 'node_modules'));
    child = spawn('node', [resolve('scripts/dev-site.mjs'), '--port', '0', '--hostname', '127.0.0.1'], {
      cwd: root, detached: true, stdio: 'ignore',
      env: { ...process.env, NODE_ENV: 'development', NODE_OPTIONS: '', NEXT_TELEMETRY_DISABLED: '1' },
    });
    let start;
    for (let attempt = 0; attempt < 80; attempt++) {
      try {
        const source = await readFile(join(root, '.content-studio/logs/dev-memory.jsonl'), 'utf8');
        start = source.trim().split('\n').map(line => JSON.parse(line)).find(row => row.event === 'start');
        if (start) break;
      } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
      if (child.exitCode !== null) throw new Error(`Next exited before logging: ${child.exitCode}`);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    expect(start).toBeDefined();
    expect(start.pid).not.toBe(child.pid);
    expect(start.heapLimit).toBeGreaterThan(3 * 1024 ** 3);
    expect(start.heapLimit).toBeLessThan(5 * 1024 ** 3);
  } finally {
    if (child?.pid) {
      const running = child;
      const exited = new Promise(resolve => running.once('exit', resolve));
      try { process.kill(-child.pid, 'SIGTERM'); } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ESRCH') throw error; }
      await Promise.race([exited, new Promise(resolve => setTimeout(resolve, 2000))]);
      try { process.kill(-child.pid, 'SIGKILL'); } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ESRCH') throw error; }
    }
    await rm(root, { recursive: true, force: true });
  }
}, 15000);
