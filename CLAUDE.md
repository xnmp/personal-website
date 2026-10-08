@AGENTS.md

## Original mocks: the art-direction targets

Each art direction (`data-style`, `src/app/styles/<style>.css`) must match its
**original exploration mock** to high fidelity. These are the Codex image
generations from 2026-10-07 that the directions were chosen from (issue #1),
kept in `art/originals/`:

| file | what it is |
|---|---|
| `board-10-directions.webp` | ten candidate directions as small home pages |
| `paper.webp`, `solarpunk.webp`, `sumi.webp`, `cyanotype.webp`, `garden.webp` | home pages at 1672x941: Paper Diorama, Solarpunk, Sumi-e Ink, Cyanotype, Natural Garden (the garden one has the cat on the ledge) |
| `ligne-tile.webp`, `atlas-tile.webp` | Ligne Claire (#6) and Celestial Atlas (#9), which exist only as tiles on the board |
| `ligne.webp`, `atlas.webp` | their full home pages at 1672x941, generated from the tiles (2026-10-09; prompts in `art/prompts/<style>/original-full.txt`) in the same layout and content as the other five |
| `<style>-project.webp`, `<style>-launch.webp`, `<style>-phone.webp` | a project page, the Tauri Explorer launch page and the phone home, where they exist (paper, cyanotype, solarpunk) |

`art/raw/<style>/concept-*` are later re-imaginings generated during the kit
build. They are **not** the target; never judge a style against them. The
full-resolution PNGs are in `art/raw/originals/` (gitignored) and under
`~/.codex/generated_images/`.

How to match one:
- List the original's signature devices in `art/briefs/<style>.md` as
  requirements (composition, type, materials, ornaments, scene); a missing
  device is a defect, not a simplification.
- Capture the live page at the mock's own size and compare side by side
  before every review; the reviewer goes through the devices one by one.
- The site's real content (longer copy, more cards, live screens) replaces
  the mock's placeholder text; everything else is the target.
