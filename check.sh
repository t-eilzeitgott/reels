#!/usr/bin/env bash
# reels check v1.0.0: checks a rendered video for Instagram, shrinks it if needed, writes a contact sheet.
# usage: ./check.sh in.mp4 out.mp4   (exit 0 = ok)
set -euo pipefail
in="$1"; out="$2"
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$in")
v=$(ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height -of csv=p=0 "$in")
a=$(ffprobe -v error -select_streams a:0 -show_entries stream=codec_name -of csv=p=0 "$in" || true)
echo "duration=$dur video=$v audio=${a:-none}"
awk -v d="$dur" 'BEGIN{exit !(d>=5 && d<=90)}' || { echo "FAIL: duration $dur"; exit 1; }
[[ "$v" == h264,1080,1920 ]] || { echo "FAIL: video stream $v"; exit 1; }
[[ "$a" == aac ]] || { echo "FAIL: no aac audio"; exit 1; }
ffmpeg -v error -xerror -i "$in" -f null - || { echo "FAIL: decode error"; exit 1; }
vol=$(ffmpeg -v info -i "$in" -af volumedetect -vn -f null - 2>&1 | sed -n 's/.*max_volume: \(-\?[0-9.]*\) dB/\1/p')
echo "max_volume=${vol}dB"
awk -v m="$vol" 'BEGIN{exit !(m>-40)}' || { echo "FAIL: silent audio"; exit 1; }
size=$(stat -c %s "$in")
if (( size > 90*1024*1024 )); then
  echo "shrinking ($size bytes)"
  ffmpeg -v error -y -i "$in" -c:v libx264 -preset veryfast -crf 19 -maxrate 14M -bufsize 28M -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart "$out"
else
  ffmpeg -v error -y -i "$in" -c copy -movflags +faststart "$out"
fi
ffmpeg -v error -y -i "$out" -vf "fps=8/$dur,scale=270:-1,tile=4x2" -frames:v 1 "${out%.mp4}-sheet.jpg"
echo "OK $(stat -c %s "$out") bytes, sheet ${out%.mp4}-sheet.jpg"
