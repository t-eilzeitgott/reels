# reels yt v1.4.0: title, description with chapters and tags for the long video, from the plan and the real segment lengths.
import json, os, subprocess, sys, random
plan, out = sys.argv[1], sys.argv[2]
P = json.load(open(plan)); here = os.path.dirname(os.path.abspath(__file__))
hist = os.path.join(here, 'history.jsonl'); n = 1 + (sum(1 for _ in open(hist)) if os.path.exists(hist) else 0)
def dur(p): return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p]).decode().strip())
t, chap, last = 0.0, [], None
for s in P['segments']:
    f = os.path.join(out, 'land', s['id'] + '.mp4')
    if not os.path.exists(f): continue
    if s['name'] != last and (not chap or t - chap[-1][0] >= 10): chap.append((t, s['name'])); last = s['name']
    t += dur(f)
def ts(x): x = int(x); return '%d:%02d:%02d' % (x // 3600, x % 3600 // 60, x % 60) if t >= 3600 else '%02d:%02d' % (x // 60, x % 60)
mins = round(t / 60)
titles = [
    f'{mins} Minutes of Oddly Satisfying Ball Simulations | Relax, Focus, Sleep',
    f'Satisfying Physics for {mins} Minutes | Balls, Ropes and Color Wars (No Talking)',
    f'{mins} Min Oddly Satisfying Marble Simulations to Relax and Fall Asleep',
    f'Relaxing Ball Simulations | {mins} Minutes of Satisfying Physics, No Ads in Between',
    f'Satisfying Ball Multiplication, Rope Breaks and Color Wars | {mins} Minutes to Relax'
]
title = titles[(n - 1) % len(titles)]
body = ['Sit back and watch: balls multiply through gates, break thousands of ropes, fight for territory and turn polygons into circles. Every scene is a real physics simulation, nothing is filmed or hand animated.', '',
        'Good for relaxing, studying, focusing or falling asleep. Satisfying sounds, no talking.', '', 'Chapters']
body += [f'{ts(a)} {b}' for a, b in chap]
body += ['', 'Made with Talfahrt Studio · talfahrt.dev', '', '#satisfying #oddlysatisfying #relaxing']
tags = ['satisfying', 'oddly satisfying', 'satisfying video', 'relaxing', 'relaxing video', 'physics simulation', 'ball simulation', 'satisfying sounds', 'asmr', 'sleep', 'study', 'focus', 'color war', 'marble', 'no talking']
meta = {'n': n, 'title': title[:100], 'description': '\n'.join(body)[:4900], 'tags': tags, 'seconds': round(t, 1), 'chapters': len(chap)}
json.dump(meta, open(os.path.join(out, 'meta.json'), 'w'), indent=2, ensure_ascii=False)
print(json.dumps({k: meta[k] for k in ('n', 'title', 'seconds', 'chapters')}))
