# Hires six-defect verification and handover

All six fixes are implemented; no commits were made. Features and shared paid
caches were only read. Pipeline invocations against real data used `--dry`.
The existing isolated fixture tests still exercise publication inside `/tmp`.
The prior API canvas-padding implementation was retained.

## Fix locations

| Defect | Change | Code |
| --- | --- | --- |
| 1 | One decoded output proof for CSS, pending, and dependencies; hash/recorded dimensions enforced with or without recipe; legacy exact-scale decoding required. | `scripts/hires/lock.mjs:27`, `scripts/hires/css.mjs:290` |
| 2 | Full weight throughout changed footprints; exterior feather clipped to keep canonical exterior exact, including translucent derivation. | `scripts/hires/states.mjs:98`, `scripts/hires/states.mjs:186` |
| 3 | Effective settings digest, API quality request identity, preserved post-processing tile identities, audited backfill. | `scripts/hires/manifest.mjs:123`, `scripts/hires/backfill-settings.mjs:14` |
| 4 | Peak-relative nonvacuous reproduction threshold and 90% footprint survival. | `scripts/hires/states.mjs:145`, `scripts/hires/states.mjs:250` |
| 5 | Glyph protection precedes canonical registration; stale derived PNG composition is no longer reused. | `scripts/hires/upscale.mjs:174` |
| 6 | Recursive validation includes state canonical locks and generator dependencies. | `scripts/hires/lock.mjs:50` |

## Tests and gates

- Initial regressions: 0 pass / 7 fail before fixes; 7 pass / 0 fail after fixes.
  The original glyph composition was also reproduced separately: 0 exterior
  differences after registration, 400 after protection, versus 0 after the fix.
- Final `bun test --timeout 120000`: 474 pass, 0 fail, 78,135 assertions, 26 files.
  The timeout permits image-heavy fixtures alongside the two calibration runs.
- `bun run lint`: exit 0, no warnings. `bunx tsc --noEmit`: exit 0.
- `git diff --check`: clean.
- Independent adversarial review: no remaining findings after fixing and testing
  migration dependency ordering. Its standalone regression run: 9 pass, 0 fail;
  the later pending-settings regression is covered by the final full suite.
- Same copied features images, manifest, lock and CSS: 89 issues before and after
  migration (40 missing CSS twins, 49 informational incomplete groups, 0 stale
  provenance issues). No CSS files were changed.
- Backfill on a scratch copy: 325 stamped, 0 rejected. Features was not migrated.
- `HIRES_CACHE=/home/chong/Repos/personal-website/art/raw/hires` with the exported
  `main(['--dry', '--pending'], {root: '/tmp/hires-defects-snapshot'})`: 325 skipped
  before and after. Remaining plan: 129 assets, 34 estimated API requests and 19
  external tiles. These were estimates only; no request was made. No corrupted
  outputs were found, so there is no exception list.

The new tests cover ordinary API/external corruption, legacy geometry, byte hash
mismatch, narrow alpha and isolated color changes, weak rings, zero delta,
sub-6-code changes, 1x1 input, undecodable output, protected state composition,
transitive stale dependencies, settings/default changes, dry pending behavior,
and safe/idempotent migration with rejected ancestors.

## Calibration

Both versions ran `audit-states.mjs --calibrate` over the same 118 source paths
from `/tmp/hires-acceptance-calibration-complete.jsonl`, using the same copied
features tree and the shared cache read-only. Source/canonical proof hashes and
available generated-candidate hashes match for every compared state. There are
no state-level audit errors. Missing generated-cache evidence remains explicitly
unknown, not counted as a passing candidate. Existing shipped locks are not
retrospectively re-gated by these prospective algorithm fixes.

| Measure | Before | After |
| --- | ---: | ---: |
| states | 118 | 118 |
| residualReproductionPass | 115 | 106 |
| residualConformancePass | 108 | 107 |
| residualBothPass | 105 | 95 |
| generatedAvailable | 5 | 5 |
| generatedReproductionPass | 4 | 4 |

Final routing: before `{"generate-unchecked": 30, "rejected": 7, "residual": 81}`; after `{"generate-unchecked": 30, "rejected": 17, "residual": 71}`.

12 states change at least one verdict; all are listed below.

| State (under public/kit) | Changed verdicts | Reproduction share before → after |
| --- | --- | --- |
| `atlas/sheet-night-hover.webp` | reproduction: False → True; finalRouting: rejected → residual; noPassingRoute: True → False | 86.1589% → 90.8272% |
| `cyanotype/sheet-day-c-flat.webp` | reproduction: True → False; finalRouting: residual → rejected; noPassingRoute: False → True | 100.0000% → 73.5302% |
| `cyanotype/sheet-day-d-flat.webp` | reproduction: True → False; finalRouting: residual → rejected; noPassingRoute: False → True | 100.0000% → 74.4932% |
| `cyanotype/sheet-day-flat.webp` | reproduction: True → False; finalRouting: residual → rejected; noPassingRoute: False → True | 100.0000% → 77.1429% |
| `cyanotype/sheet-day-w-b-flat.webp` | reproduction: True → False; finalRouting: residual → rejected; noPassingRoute: False → True | 100.0000% → 79.1199% |
| `cyanotype/sheet-day-w-c-flat.webp` | reproduction: True → False; finalRouting: residual → rejected; noPassingRoute: False → True | 100.0000% → 78.2908% |
| `cyanotype/sheet-night-c-flat.webp` | reproduction: True → False; finalRouting: residual → rejected; noPassingRoute: False → True | 100.0000% → 73.5565% |
| `cyanotype/sheet-night-d-flat.webp` | reproduction: True → False; finalRouting: residual → rejected; noPassingRoute: False → True | 100.0000% → 74.6040% |
| `cyanotype/sheet-night-flat.webp` | reproduction: True → False; finalRouting: residual → rejected; noPassingRoute: False → True | 100.0000% → 73.9730% |
| `cyanotype/sheet-night-w-b-flat.webp` | reproduction: True → False; finalRouting: residual → rejected; noPassingRoute: False → True | 100.0000% → 79.0317% |
| `cyanotype/sheet-night-w-c-flat.webp` | reproduction: True → False; finalRouting: residual → rejected; noPassingRoute: False → True | 100.0000% → 78.3255% |
| `solarpunk/sheet-day-flat.webp` | conformance: True → False; finalRouting: residual → rejected; noPassingRoute: False → True | 100.0000% → 91.5576% |

The complete compact evidence for all 118 states is in
[hires-defect-calibration.json](hires-defect-calibration.json), including hashes,
reproduction denominators, suppression shares and failure reasons. The threshold
formula and rationale are in [the migration note](hires-settings-migration.md).

## Remaining operator action

Run the documented backfill yourself after the features writing batch stops.
The manifest-history audit permits the one-time migration; no historical
newly-tracked settings changes require an exception. Preview first, then use
`--write` as documented in [hires-settings-migration.md](hires-settings-migration.md).
Do not use the old writer after migration. No image regeneration is needed for
these 325 valid locks. The 40 pre-existing missing CSS twins and incomplete groups
are outside this six-defect patch.
