# Hires settings provenance migration

The one-time `settingsDigest` backfill has been applied to features:
**359 migrated, 0 rejected**. The completed migration script and its tests have
been removed; current pipeline publications record settings digests directly.
The script lived at commit `6d46688` and can be inspected with
`git show 6d46688:scripts/hires/backfill-settings.mjs`.

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
The script refused a different manifest so later settings could not be silently
asserted against legacy outputs. That pinned hash no longer matches the live
manifest by design; the migration is complete and no further backfill is needed.

The script validated source, recipe, request key, decoded output hash/dimensions
and transitive dependencies before stamping entries, without regenerating images
or touching paid caches. It preserved existing digests, used the publication
`.writing` guard, and atomically replaced only the lock in dependency order.

## Durable policy

See [the hires architecture](architecture.md) for settings provenance,
state noise/gating, v5 state derivation, provider fallback and accepted historical
generations. This document records only the one-time migration and its audit.
