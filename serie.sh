#!/usr/bin/env bash
# reels serie v1.0.0: fetches the ready-made video of a series day (plan.json "series") and checks it against its sha256.
# usage: ./serie.sh <YYYY-MM-DD> <out.mp4>   (run inside a clone of t-eilzeitgott/reels)
#   prints the day's entry from plan.json as one line of JSON.
#   exit 0 = video is there and intact, exit 3 = this date is not a series day, exit 1 = the video could not be fetched or is damaged
set -euo pipefail
d="$1"; out="$2"; here="$(cd "$(dirname "$0")" && pwd)"
field() { node -e 'const v = JSON.parse(process.argv[1])[process.argv[2]]; if (v === undefined) process.exit(1); console.log(v)' "$entry" "$1"; }
entry=$(node -e 'const p = require(process.argv[1] + "/plan.json"), e = ((p.series || {}).days || []).find(x => x.date === process.argv[2]); if (!e) process.exit(3); console.log(JSON.stringify(e))' "$here" "$d") || { echo "no series day: $d"; exit 3; }
branch=$(field branch); path=$(field path); url=$(field file); sha=$(field sha256)
ok() { [[ -s "$out" ]] && [[ "$(sha256sum "$out" | cut -d' ' -f1)" == "$sha" ]]; }
# first through git (works wherever the clone works), then the public raw URL
for try in 1 2 3; do
  if git -C "$here" fetch -q --depth 1 origin "$branch" 2>/dev/null && git -C "$here" show "FETCH_HEAD:$path" > "$out" 2>/dev/null && ok; then echo "$entry"; exit 0; fi
  if curl -fsSL --retry 2 --retry-delay 5 -o "$out" "$url" 2>/dev/null && ok; then echo "$entry"; exit 0; fi
  sleep 10
done
echo "FAIL: could not fetch $path from branch $branch (or sha256 does not match $sha)"; exit 1
