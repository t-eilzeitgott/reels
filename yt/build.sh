#!/usr/bin/env bash
# reels yt v1.4.0: builds the long video from the rendered segments of a plan.
# usage: build.sh plan.json segdir outdir   -> outdir/long.mp4, outdir/meta.json (title, description with chapters, tags)
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"; plan="$1"; seg="$2"; out="$3"
mkdir -p "$out/land"; : > "$out/list.txt"
for id in $(python3 -c "import json,sys; print(' '.join(s['id'] for s in json.load(open('$plan'))['segments']))"); do
  [ -f "$seg/$id.mp4" ] || { echo "missing $id, skipped"; continue; }
  [ -f "$out/land/$id.mp4" ] || "$here/land.sh" "$seg/$id.mp4" "$out/land/$id.mp4"
  echo "file 'land/$id.mp4'" >> "$out/list.txt"
done
(cd "$out" && ffmpeg -v error -y -f concat -safe 0 -i list.txt -c copy -movflags +faststart long.mp4)
python3 "$here/meta.py" "$plan" "$out"
ls -la "$out/long.mp4"
