#!/usr/bin/env bash
# reels drop v1.0.0: force-pushes one video as the only file on the orphan branch "drop" and prints its public raw URL.
# usage: ./drop.sh video.mp4 name.mp4   (run inside a clone of t-eilzeitgott/reels)
set -euo pipefail
src="$(realpath "$1")"; name="$2"; repo="$(git rev-parse --show-toplevel)"
tmp="$(mktemp -d)"; git -C "$tmp" init -q -b drop; cp "$src" "$tmp/$name"
git -C "$tmp" -c user.name="talfahrt reels" -c user.email="noreply@anthropic.com" add "$name"
git -C "$tmp" -c user.name="talfahrt reels" -c user.email="noreply@anthropic.com" commit -qm "drop: $name"
sha=$(git -C "$tmp" rev-parse HEAD)
url=$(git -C "$repo" remote get-url origin)
git -C "$tmp" push -q --force "$url" drop:drop
echo "https://raw.githubusercontent.com/t-eilzeitgott/reels/$sha/$name"
