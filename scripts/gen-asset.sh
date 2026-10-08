#!/usr/bin/env bash
# Generate one raster asset with Codex's built-in image tool (native alpha).
#   scripts/gen-asset.sh <dir> [ref.png]
# <dir> is art/raw/<style>/<name>; it must hold prompt.txt (copied from
# art/prompts/<style>/<name>.txt). The reference, if given, is copied in as
# ref.png and passed as a style reference. Writes <dir>/<name>.png, the
# transcript (codex.log) and Codex's reply (result.txt). Runs one Codex
# session; several can run side by side.
set -euo pipefail
dir=${1:?usage: gen-asset.sh <dir> [ref.png]}
name=$(basename "$dir")
[[ -f $dir/prompt.txt ]] || { echo "no $dir/prompt.txt" >&2; exit 2; }
if [[ -n ${2:-} ]]; then cp "$2" "$dir/ref.png"; fi
refline="There is no reference image."
[[ -f $dir/ref.png ]] && refline="Look at \`ref.png\` in the current working directory and pass it to the image tool as a style reference input if the tool supports reference images."
cat > "$dir/task.md" <<TASK
Generate exactly one image with your built-in image generation tool. $refline Use the prompt in \`prompt.txt\` verbatim. Use the aspect named in the prompt at the highest resolution available. If the prompt allows a transparent background and the tool supports transparency, request it.
Then copy the resulting image into the current working directory as \`$name.png\`. Do not modify any other files. Do not generate more than one image unless the first attempt errors outright.
Reply with: the absolute path of the png, its pixel dimensions, whether the reference was passed, and whether the background is transparent or magenta.
TASK
~/.claude/skills/codex-subagent/scripts/codex-run.sh -m "${CODEX_MODEL:-gpt-6.1-sol}" -e low -s workspace-write \
  -C "$(realpath "$dir")" -l "$(realpath "$dir")/codex.log" -t 1200 < "$dir/task.md" > "$dir/result.txt"
[[ -f $dir/$name.png ]] || { echo "$name: no image (see $dir/codex.log)" >&2; exit 1; }
echo "$name: $(identify -format '%wx%h %[channels]' "$dir/$name.png" 2>/dev/null || echo ok)"
