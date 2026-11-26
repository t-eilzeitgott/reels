#!/usr/bin/env bash
# reels yt v1.4.0: puts a large video on the branch yt-drop in parts of at most 90 MB (GitHub allows 100 MB per file).
# The branch is replaced every time. Prints a JSON line with the raw URLs (pinned to the commit), size and sha256.
# usage: drop.sh file.mp4 name.mp4
set -euo pipefail
src="$1"; name="$2"; repo="$(cd "$(dirname "$0")/.." && pwd)"; tmp="$(mktemp -d)"
git -C "$tmp" init -q -b yt-drop && cd "$tmp"
split -b 90M -d -a 2 "$src" "$name.part"
sha=$(sha256sum "$src" | cut -d' ' -f1); size=$(stat -c %s "$src")
git add . && git -c user.name=Claude -c user.email=noreply@anthropic.com commit -qm "yt-drop: $name"
git remote add origin "$(git -C "$repo" remote get-url origin)"
git -c push.negotiate=false push -q -f origin yt-drop
c=$(git rev-parse HEAD)
python3 -c "
import json, glob
parts = sorted(glob.glob('$name.part*'))
print(json.dumps({'name': '$name', 'size': $size, 'sha256': '$sha', 'parts': ['https://raw.githubusercontent.com/t-eilzeitgott/reels/$c/' + p for p in parts]}))"
rm -rf "$tmp"
