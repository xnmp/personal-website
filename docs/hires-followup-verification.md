# Hires follow-up verification

Builds on HEAD `49207e1`; no commits, network access, real-output writes, or
shared-cache writes. Operator pipeline runs used `--dry`. Unit tests exercise
publication only inside isolated temporary fixtures.

## Contracts

- New publications record registered-v3/residual-v5. Named previous recipes and
  the older implicit-auto variant remain valid only when their recomputed recipe,
  corresponding derivation digest, source, settings, request identity, canonical
  dependency, output bytes/geometry, and membership still match. Paid tile keys
  retain the historical recipe namespace.
- Derivation uses intended-change support; registration keeps the exact visible
  difference mask. Canonical equality outside that exact mask remains mandatory.
- Derived candidates inherit alignment from their valid locked canonical. Their
  stats record the canonical and inheritance reason; no displacement/reliable-
  block gates are rerun. Colour MAE, suppression, reproduction, and exterior
  equality still apply. Generated candidates keep every gate.
- Auto routes unavailable providers to a gated residual candidate, records
  `stateDerivation.method` and `fallbackReason`, and preserves its generated
  request identity for pending validation. This includes mixed provider/candidate
  tile failures and unavailable external tiles. Filesystem/programming errors
  are not reclassified. Explicit generate retains its existing failure behavior.

## Noise method and evidence

Offline method review used the existing separable Gaussian implementation and
linear-filter noise propagation; no online research was possible or attempted.
A conventional isotropic morphological opening would remove the required
one-pixel ring, so the implementation filters **signed premultiplied RGBA deltas**
with a sigma-1 Gaussian instead. High-frequency residual MAD is scaled by 1.4826;
its filtered noise estimate uses `||G||2 / ||I-G||2 = 0.28228 / 0.87252`.
The noise floor is `max(8, 3 * estimated filtered sigma)` in /255 code units.
The fixed floor is an empirical quantisation/weak-paint tolerance, not a claim
that every low-amplitude change is random noise.

The reproduction threshold is `max(noiseFloor, min(24, filteredPeak / 2))`.
At least 90% of selected pixels must retain the sign and half the magnitude of
every selected channel. The intended support includes three source pixels around
coherent evidence and is intersected with exact source differences. This support
is shared by derivation and suppression; reproduction measures its above-threshold
filtered evidence. Trimming at the threshold contour itself would remove source
samples that contribute to the measurement during resampling.

For a noise-only source, the gate measures the low-passed **output minus canonical**
over the whole image and requires its maximum to stay inside the same noise floor.
It does not use an empty denominator as acceptance. Unit fixtures verify exact
canonical copying and reject both tint and shifted-edge outputs, including when
conformance is waived.

Across all 12 cyanotype flats, filtered RGB peaks at 7.216/255, below the
8/255 floor; high-frequency RGB MAD sigma is 0.624–0.817/255. The +23 ring's
filtered red is 9.178–10.314/255, above the floor at all 348 source pixels.
For sheet-day-flat, the exact footprint has 55,559 pixels; intended support has
365 (99.34% excluded), and filtered RGB/alpha peaks are 6.544/9.076. Full measured
values are in [hires-followup-noise.jsonl](hires-followup-noise.jsonl).

The actual cyanotype flat sources contain coherent alpha changes as well as RGB
speckle. They are not completely noise-only: the ten previously rejected flats
retain 32–101 evidence pixels, with reproduction 93.75–100%. Their filtered alpha
peaks are roughly 9/255. Noise-only footprints outside this coherent support retain
the canonical exactly. The +23 red ring retains all 348 pixels of evidence;
missing output fails, exact and resampled-derived output pass.

## Diagnosis requested without a fix

A HEAD-isolated ablation used the real canonical outputs and the old reproduction
gate. Most failures arise from the translucent branch's absolute `U(state)`
replacement. The canonical already differs in colour/alpha from source normal,
so absolute replacement can lose or reverse the intended delta. Resampling also
spreads this mismatch into adjacent opaque pixels.

| State | HEAD reproduction | Failed opaque / translucent pixels | Additive in both regions, diagnostic only |
| --- | ---: | ---: | ---: |
| atlas sheet-day-hover | 2154/2771 = 77.73% | 290 / 327 | 97.51% |
| atlas sheet-night-pressed | 4746/6682 = 71.03% | 1 / 1935 | 99.16% |
| sumi tile-night-pressed | 2074/3376 = 61.43% | 0 / 1302 | 100% |

Opaque high-resolution clipping counts are 2363, 3, and 0 respectively. For atlas
day, changing only the translucent branch recovers 236/290 failed opaque pixels,
which isolates downsample contamination as a major cause. A sumi example has an
intended red delta of -25.20, but source normal red is 71.51 and canonical red is
already 42.79. Absolute replacement produces 43.87: observed delta +1.07, the
wrong sign.

A principled follow-up is premultiplied additive transfer in translucent regions
with valid-RGBA projection and all existing non-alignment gates. This needs its
own edge/gamut review: the atlas-night ablation recovers 1934 translucent failures
but adds 54 opaque boundary failures. No such fix is included here. Full numeric
ablations are in [hires-followup-diagnosis.jsonl](hires-followup-diagnosis.jsonl).

## Verification scope

The calibration uses the exact previous 118-state cohort, source/canonical hashes,
and read-only generated cache. Its baseline is the **after** run of the six-defect
fix. Missing generated-cache evidence remains unknown; it is not treated as a
passing generated output or proof that an API provider is unavailable.

The live real tree at verification has 359 locks, including 128 states (the prompt
listed 104 states). The old saved snapshot contains 325 locks including those 104
states. Neither real tree nor shared cache was modified. Preview backfill reports
359 eligible, 0 rejected. A scratch copy migrated using HEAD keeps 359 valid skips
under both HEAD and this change. The unbackfilled dev tree skips 0 under both:
its locks have no settings digest. The saved 104-state snapshot likewise keeps
325 valid skips before and after on its migrated scratch copy. This is independent of recipe grandfathering.

The requested dev dry plan adds 10 derivation routes, taking the missing-dev-state
count from 98 to 108 of 145. Of the 64 states currently missing in the real tree,
27 now plan derivation (previously 17). API request estimate remains 34; external
tile estimate drops from 19 to 4. API availability is unknown during a dry run;
provider failures at execution can yield further derivations with the same gates.

## Checks

- `bun test`: 480 passed, 0 failed; 78,193 assertions across 27 files.
- `bun run lint`: exit 0. `bunx tsc --noEmit`: exit 0.
- Independent adversarial reviewer: no remaining blocking findings; focused
  follow-up contracts 6 passed, 0 failed, 53 assertions.
- New coverage includes paired historical/current digests, invalidated inputs,
  noise-only absence checks, the 348-pixel ring, alignment inheritance, provider
  auto/generate behavior, and mixed provider/candidate/infrastructure failures.
- Existing small-delta fixtures were moved above the new noise floor where their
  contract requires a visible change; sub-floor fixtures now assert canonical
  preservation and explicit absence checks.

## Fixed-cohort calibration results

All 118 states completed without errors; source/canonical proofs and all five
available generated-candidate hashes are unchanged from the last run.

| Gate | Last run | Current |
| --- | ---: | ---: |
| Residual reproduction | 106/118 | 118/118 |
| Residual conformance | 107/118 | 118/118 |
| Both residual gates | 95/118 | 118/118 |
| Generated reproduction (available candidates) | 4/5 | 5/5 |
| Generated all gates | 0/5 | 0/5 |

23 states improve at least one gate verdict, with no regressions. Twelve improve
reproduction (ten cyanotype flats, atlas sheet-day-hover, sumi tile-night-pressed);
eleven improve conformance. Final routing changes from 71 residual / 17 rejected /
30 generation-unchecked to 88 residual / 0 rejected / 30 generation-unchecked.
All 118 residual candidates pass, including fallbacks for those 30 unobserved
generation routes. This does not claim their generated candidates pass.

Every per-state verdict change, share, reason and input hash is recorded in
[hires-followup-calibration.json](hires-followup-calibration.json).

| Changed state under public/kit | Gate improved | Reproduction before → after |
| --- | --- | ---: |
| `atlas/sheet-day-hover.webp` | change | 77.73% → 99.54% |
| `cyanotype/sheet-day-c-flat.webp` | change | 73.53% → 96.67% |
| `cyanotype/sheet-day-d-flat.webp` | change | 74.49% → 100.00% |
| `cyanotype/sheet-day-flat.webp` | change | 77.14% → 93.75% |
| `cyanotype/sheet-day-w-b-flat.webp` | change | 79.12% → 100.00% |
| `cyanotype/sheet-day-w-c-flat.webp` | change | 78.29% → 95.12% |
| `cyanotype/sheet-night-c-flat.webp` | change | 73.56% → 96.08% |
| `cyanotype/sheet-night-d-flat.webp` | change | 74.60% → 100.00% |
| `cyanotype/sheet-night-flat.webp` | change | 73.97% → 100.00% |
| `cyanotype/sheet-night-w-b-flat.webp` | change | 79.03% → 100.00% |
| `cyanotype/sheet-night-w-c-flat.webp` | change | 78.33% → 96.04% |
| `garden/sheet-night-flat.webp` | conformance | 96.52% → 100.00% |
| `ligne/sheet-day-flat.webp` | conformance | 99.99% → 99.99% |
| `ligne/sheet-day-hover.webp` | conformance | 99.93% → 99.99% |
| `solarpunk/sheet-day-flat.webp` | conformance | 91.56% → 99.36% |
| `solarpunk/sheet-day-focus.webp` | conformance | 93.27% → 97.60% |
| `solarpunk/sheet-day-hover.webp` | conformance | 99.93% → 100.00% |
| `solarpunk/sheet-day-pressed.webp` | conformance | 96.16% → 99.93% |
| `solarpunk/sheet-night-flat.webp` | conformance | 92.03% → 99.36% |
| `solarpunk/sheet-night-hover.webp` | conformance | 99.93% → 100.00% |
| `solarpunk/sheet-night-pressed.webp` | conformance | 93.99% → 99.69% |
| `solarpunk/tile-pill-green-hover.webp` | conformance | 98.04% → 99.87% |
| `sumi/tile-night-pressed.webp` | change | 61.43% → 94.54% |
