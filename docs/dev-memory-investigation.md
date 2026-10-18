# Development-server memory investigation

Investigated 2026-10-18, Next 16.2.3 / Node 25.6.0.

## Confirmed incident

The retained `.next-studio/dev/trace` records a peak of **23.25 GiB RSS** and
**17.96 GiB JS heap**. Its startup heap ceiling was **31.5 GiB** on a 64 GiB
machine. This was process memory, not merely a filesystem cache. Several
sessions grew steeply; the trace alone cannot identify retaining objects.
Request URLs in samples identify measurement times, not culpable routes.

## Heap-limit correction

Installed Next's `server/lib/utils.js:getMaxOldSpaceSize` reads `NODE_OPTIONS`,
not Node's CLI arguments. `cli/next-dev.js` sets the child to half system RAM
when that function returns no limit. Consequently, the earlier CLI-only
`--max-old-space-size=4096` safeguard did **not** bound the actual Next child.

`scripts/dev-site.mjs` now appends the explicit limit to `NODE_OPTIONS` while
preserving other inherited options. It resolves the logger preload absolutely,
so subprocesses in a temporary publishing checkout do not resolve it relative
to the wrong directory. The logger records the effective child heap limit. A real `bun run dev:site`
smoke check verified **4,496,293,888 bytes (4.19 GiB)** in the Next child;
its 4 GiB old space is accompanied by V8's other heap spaces.
The limit bounds V8 old space, not total RSS or all native allocations.

## Bounded reproduction

Disposable source copies used an independent process-group RSS watchdog
(3 GiB) and a 110-second deadline. No owner content was edited. Profiling used
allocation sampling, not a full heap snapshot. A diagnostic-only preload exposed
the installed Next debug-channel map and React pending-operation map; it did
not modify installed dependency files.

One Turbopack run fully drained 100 additional HTML responses and made six
source edits, requesting the recompiled page after each. Samples below followed
two diagnostic full GCs. The production logger never forces GC.

| Phase | JS heap (MiB) | Orphan debug channels | Pending operations |
| --- | ---: | ---: | ---: |
| Baseline | 131.0 | 2 | 12,991 |
| 100 additional HTTP loads | 184.0 | 102 | 16,720 |
| Six source edits | 183.6 | 108 | 14,861 |
| Clear only orphan channels | 179.4 | 0 | 2,017 |

Clearing channels released roughly 24 MiB of array buffers, but only a few MiB
of JS heap. This confirms retained channels, **not** the cause of the historical
18 GiB heap. The small run did not reproduce catastrophic growth.

Next's `server/dev/debug-channel.js` has a global map and an explicit TODO to
clean it up when a client never connects, including curl clients. HTTP-only
page sweeps are therefore a poor choice for a long-running owner's editor.

Retained allocation samples also grew at React Flight's async-hook `init`
(~30 MiB) and `WeakRef` (~7 MiB) sites. Installed React tracks asynchronous
ancestry through `previous`/`awaited` chains. Allocation stacks establish
where objects were allocated, **not** why they remain reachable. The matching
[upstream report](https://github.com/react/react/issues/36836) is unconfirmed;
it is a useful hypothesis, not a diagnosis. Both bundled Webpack and Turbopack
React runtimes contain that mechanism, so switching bundlers cannot establish
that it is fixed.

An instrumented Webpack comparison encountered runtime errors and is not a
valid stability comparison. The actual launcher is verified separately without
the diagnostic dependency hooks: 11 HTTP requests completed successfully,
peak RSS was about 1.71 GiB and dropped to 1.48 GiB afterward. This was a
short smoke check. No overnight memory soak has been completed.

## Next recurrence

Preserve `.content-studio/logs/dev-memory.jsonl`, its `.previous` file, and
`.next-studio/dev/trace`. Compare heap versus external/buffer growth, major GC
activity, CPU, recent routes and effective heap limit before increasing load.
The logs are bounded; request bodies, headers and query strings are excluded.

If retained JS heap continues growing after major collections, a further
bounded allocation/retainer investigation is warranted. Do not take a heap
snapshot near machine exhaustion: it can require substantial additional RAM.
Next 16.3's [development memory eviction](https://nextjs.org/blog/next-16-3#less-memory-usage-in-dev)
is an upgrade candidate, but primarily addresses compiler retention; it does
not by itself explain this incident's dominant JS heap.
