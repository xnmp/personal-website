/* eslint-disable @typescript-eslint/no-require-imports -- Node --require preload must load synchronously before the Next server. */
const fs = require('node:fs');
const path = require('node:path');
const v8 = require('node:v8');
const { PerformanceObserver } = require('node:perf_hooks');
const { channel } = require('node:diagnostics_channel');

/** Keep the current and previous JSONL files; never retain request bodies or credentials. */
function createRotatingLog(filename, maxBytes = 1024 * 1024) {
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  return (record) => {
    const line = JSON.stringify(record) + '\n';
    if (Buffer.byteLength(line) > maxBytes) throw new Error('Memory log record exceeds file budget');
    let size = 0;
    try { size = fs.statSync(filename).size; } catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (size + Buffer.byteLength(line) > maxBytes) {
      try { fs.renameSync(filename, filename + '.previous'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
    fs.appendFileSync(filename, line, { mode: 0o600 });
  };
}

function monitorServer() {
  const filename = path.join(process.cwd(), '.content-studio/logs/dev-memory.jsonl');
  let write;
  let disabled = false;
  const emit = (record) => {
    if (disabled) return;
    try {
      write ??= createRotatingLog(filename);
      write({ time: new Date().toISOString(), pid: process.pid, ...record });
    } catch (error) {
      disabled = true;
      console.warn('[dev-memory] Logging disabled:', error.message);
    }
  };
  const heapLimit = v8.getHeapStatistics().heap_size_limit;
  let gc = { count: 0, durationMs: 0, major: 0 };
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      gc.count++;
      gc.durationMs += entry.duration;
      if (entry.detail.kind === 4) gc.major++;
    }
  });
  observer.observe({ entryTypes: ['gc'] });
  let activeRequests = 0;
  let completedRequests = 0;
  let lastRequest;
  const requestCounts = new Map();
  channel('http.server.request.start').subscribe(({ request, response }) => {
    // Strip query strings (including RSC tokens) and cap both path length and distinct paths.
    const route = String(request.url ?? '/').split('?')[0].slice(0, 160);
    const key = requestCounts.has(route) || requestCounts.size < 24 ? route : '(other)';
    requestCounts.set(key, (requestCounts.get(key) ?? 0) + 1);
    lastRequest = { method: request.method, path: route };
    activeRequests++;
    const finish = () => {
      response.removeListener('finish', finish);
      response.removeListener('close', finish);
      activeRequests--;
      completedRequests++;
    };
    response.once('finish', finish);
    response.once('close', finish);
  });
  let previousMemory = process.memoryUsage();
  let previousCpu = process.cpuUsage();
  let previousTime = Date.now();
  let lastWarning = 0;
  function sample(event) {
    const memory = process.memoryUsage();
    const now = Date.now();
    const cpu = process.cpuUsage();
    const elapsedMs = Math.max(1, now - previousTime);
    const growth = memory.rss - previousMemory.rss;
    const warning = memory.rss >= 2 * 1024 ** 3 || memory.heapUsed >= heapLimit * .75 || growth >= 256 * 1024 ** 2;
    emit({ event, uptimeSeconds: process.uptime(), memory, heapLimit,
      rssGrowthBytes: growth, heapGrowthBytes: memory.heapUsed - previousMemory.heapUsed, maxRssBytes: process.resourceUsage().maxRSS * 1024, cpuPercent: ((cpu.user - previousCpu.user) + (cpu.system - previousCpu.system)) / (elapsedMs * 10),
      gc, requests: { active: activeRequests, completed: completedRequests, recent: Object.fromEntries(requestCounts), last: lastRequest }, warning });
    if (warning && now - lastWarning >= 60000) {
      lastWarning = now;
      console.warn(`[dev-memory] RSS ${(memory.rss / 1024 ** 3).toFixed(2)} GiB, JS heap ${(memory.heapUsed / 1024 ** 3).toFixed(2)} GiB. Details: ${filename}`);
    }
    gc = { count: 0, durationMs: 0, major: 0 };
    requestCounts.clear();
    previousMemory = memory;
    previousCpu = cpu;
    previousTime = now;
  }
  emit({ event: 'start', node: process.version, next: require('next/package.json').version, heapLimit, memory: process.memoryUsage(), ppid: process.ppid });
  console.log(`[dev-memory] Logging server memory every 10s: ${filename} (two files, 2 MiB total)`);
  setInterval(() => sample('sample'), 10000).unref();
  process.once('exit', () => sample('exit'));
}

// Next forks its server and propagates --require. Do not monitor the CLI or compiler workers.
if (process.env.NODE_ENV !== 'production' && /[/\\]next[/\\]dist[/\\]server[/\\]lib[/\\]start-server\.js$/.test(process.argv[1] ?? '')) monitorServer();
module.exports = { createRotatingLog };
