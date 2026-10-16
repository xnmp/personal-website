# Hires settings provenance migration

The six-defect fix adds mandatory `settingsDigest` provenance. Existing version-1
locks need the one-time backfill below before the updated validator treats them
as current. The script never regenerates images or touches paid caches. It stamps
only entries whose source, recipe, request key, decoded output hash/dimensions and
transitive dependencies validate. Legacy entries without an output hash must
still decode at exact scale. Existing digests are never overwritten.

## Audited history

Read-only inspection used `git log -p -- art/hires.json` in
`/home/chong/Repos/personal-website-features`, covering:

- `bdf1996`: original defaults: quality 75, sigma 4, API quality high,
  model gpt-image-2.5-sunburst, factor 2.
- `6aa1b63`, `138cd87`, `601a562`, `d531d22`, `3ba48db`, `265f348`:
  subsequent manifest changes through the current manifest.

The newly tracked ordinary settings (sigma, encode quality/lossless, apiQuality,
model and note) never changed on an existing asset in this history. Lossless
entries were introduced with that setting; family resolution also enforces
lossless. The external-size default was added in `138cd87`; it is ignored by API
assets, and external request identities already include sizes. Provider changes
are already checked directly in locks. No current asset requires invalidation
for a historical change to a newly tracked setting.

The exact audited manifest SHA-256 is
`68f1426742ff912c80d82393c266f8936217bbcdc543d675a994001e9fb26795`.
The CLI refuses a different manifest so later settings cannot be silently
asserted against legacy outputs. A future change requires another history audit.

## Operator commands

Run from the development worktree. Preview is read-only:

```sh
node scripts/hires/backfill-settings.mjs --root /home/chong/Repos/personal-website-features
```

After the writing batch has stopped, apply once:

```sh
node scripts/hires/backfill-settings.mjs --root /home/chong/Repos/personal-website-features --write
```

The script obtains the same `.writing` guard as pipeline publication, validates
in dependency order, and atomically replaces only the lock. It refuses an active
guard and releases its own guard on failure. A rejected ancestor prevents
migration of its descendants. Repeated runs do not rewrite migrated entries.
Do not run an older pipeline writer after migrating; it does not record the new
digest. The implementation was run only against scratch copies, never features.

## Setting coverage and tile identities

| Fields | Validation / cache behavior |
| --- | --- |
| src, factor, provider, model | Source hash and lock identity; request identities already cover source/factor/model/provider. |
| sigma | Settings digest on all assets; periodic recipe/halo also changes request geometry. Ordinary and non-periodic family tone changes reuse tiles. |
| quality, lossless | Settings digest; post-processing only, never changes paid tile key. |
| apiQuality | Settings digest; API request key changes for non-high quality. Historical high-quality keys remain identical; external keys are unaffected. |
| note | Settings digest and composed request prompt/key. |
| external.sizes | Settings digest and existing external request key. |
| family, reference, familyMembership, stateCrop | Recipe, membership and recursive reference proof; cropped request identity includes reference-source hash and crop. |
| stateDerivation, stateResidualMaxHf | Resolved family/asset policy in recipe; derivation changes reuse generated tiles. |
| periodic, generator (all allowed subfields), glyphs | Recipe plus generator dependency proof; periodic halo affects requests. |
| protect, protectFeather | Recipe; delivered pixels only, paid key unchanged. |
| group | Delivery grouping only; no pixel/request effect. |

Defaults and per-asset overrides resolve before hashing. The schema now permits
sigma/model/apiQuality per asset and lossless in defaults. Historical family tile
recipes retain the literal sigma-4 namespace; the settings digest tracks actual
sigma. Registration/feather fixes apply prospectively without renaming already
locked state recipes or paid tiles. Old derived PNGs are no longer reused;
protection then registration is recomputed from the candidate.

## State gates

Registration keeps weight 1 throughout the nearest-upscaled changed mask. The
smoothstep ramp lies outside the mask and is clipped by the canonical-equality
boundary, so no changed pixel is attenuated and unchanged pixels remain exact.
Translucent residual replacement uses the same weights.

Reproduction uses code-value threshold
`min(24, maxDelta, max(6, 0.5 * maxDelta))`. Half the peak makes a +23 ring
measurable; the 24 cap retains the existing strong-change ceiling. The 6 floor
avoids selecting weak noise when stronger evidence exists; the maxDelta cap
ensures every nonzero state, even +1, has evidence. Zero-delta states pass
explicitly with zero evidence. At least 90% of selected pixels must retain the
sign and half the magnitude of each selected channel. Suppression separately
requires changes in at least 90% of changed source footprints.

## Verification snapshot

The features manifest, lock, public/kit and src/app were copied to `/tmp` before
validation. Baseline and migrated checks use the same image bytes despite the
live features batch. Backfill validated 325 entries, rejected 0. CSS issue count
is unchanged at 89 (including informational incomplete groups); pending skips
remain 325. No corrupt outputs were found. Full calibration and test results are
recorded in `hires-defect-verification.md`.
