#!/usr/bin/env bash
# reels yt v1.4.0: renders all segments of a plan with two workers in parallel, then builds the long video.
# usage: run.sh <studio index.html> <plan.json> <workdir>     (resumable: call again after an interruption)
# progress goes to <workdir>/run.log; at the end the log says "BUILD OK" or "BUILD FAILED".
set -uo pipefail
here="$(cd "$(dirname "$0")" && pwd)"; html="$1"; plan="$2"; work="$3"; mkdir -p "$work"
log="$work/run.log"; echo "start $(date +%T)" >> "$log"
for w in 0 1; do WORKERS=2 WORKER=$w node "$here/segments.mjs" "$html" "$plan" "$work/seg" >> "$work/w$w.log" 2>&1 & done
wait
n=$(python3 -c "import json; print(len(json.load(open('$plan'))['segments']))"); have=$(ls "$work/seg"/*.mp4 2>/dev/null | wc -l)
echo "segments $have/$n $(date +%T)" >> "$log"
if "$here/build.sh" "$plan" "$work/seg" "$work/out" >> "$log" 2>&1; then echo "BUILD OK $(date +%T)" >> "$log"; else echo "BUILD FAILED $(date +%T)" >> "$log"; fi
