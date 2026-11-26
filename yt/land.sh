#!/usr/bin/env bash
# reels yt v1.4.0: turns one portrait Studio segment (1080x1920) into a landscape piece (1920x1080, 30 fps):
# the chamber on the left, logo, counter and progress on the right, 1 s fade in and out, loudness -16 LUFS.
# usage: land.sh in.mp4 out.mp4
set -euo pipefail
in="$1"; out="$2"
d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$in")
fo=$(python3 -c "print(max(0.0, $d - 1.0))"); ao=$(python3 -c "print(max(0.0, $d - 0.8))")
ffmpeg -v error -y -i "$in" -filter_complex "\
color=c=0x0B0C0E:s=1920x1080:r=30[bg];[0:v]fps=30,split=4[a][b][c][d];\
[a]crop=1080:1000:0:440[ch];[b]crop=340:70:690:168[lg];[c]crop=620:180:230:264[ct];[d]crop=840:100:120:1438,scale=620:-2[br];\
[bg][ch]overlay=150:40:shortest=1[v1];[v1][lg]overlay=1520:40[v2];[v2][ct]overlay=1250:380[v3];[v3][br]overlay=1250:580,\
fade=t=in:st=0:d=1,fade=t=out:st=$fo:d=1,format=yuv420p[v]" \
  -map "[v]" -map 0:a -af "afade=t=in:st=0:d=0.8,afade=t=out:st=$ao:d=0.8,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000" \
  -c:v libx264 -preset veryfast -crf 24 -maxrate 2500k -bufsize 5000k -g 60 -r 30 -c:a aac -b:a 160k -ac 2 -t "$d" -movflags +faststart "$out"
