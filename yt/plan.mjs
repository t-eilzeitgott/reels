// reels yt v1.4.0: picks the scenes of one long video until the target length is reached.
// usage: node plan.mjs <studio index.html> <out plan.json> [targetSeconds=3630] [seed]
// Exact lengths come from the Studio itself. No scene twice in a row, no machine three times in a row, a strong scene first.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const [, , htmlPath, outPath, targetArg, seedArg] = process.argv;
const here = path.dirname(fileURLToPath(import.meta.url));
const POOL = JSON.parse(fs.readFileSync(path.join(here, 'pool.json'), 'utf8')), target = Number(targetArg || 3630);
let rs = Number(seedArg || Date.now() % 2147483647) || 1; const rnd = () => (rs = (rs * 48271) % 2147483647) / 2147483647;
const browser = await chromium.launch({ executablePath: fs.existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined, headless: true, args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
const page = await browser.newPage();
page.on('pageerror', e => console.error('pageerror:', e.message));
await page.goto('file://' + path.resolve(htmlPath));
await page.waitForFunction(() => window.__studio && window.__studio.state() && !window.__studio.broken(), null, { timeout: 120000 });
const known = await page.evaluate(() => window.__studio.presets().map(p => p.id));
const scenes = POOL.scenes.filter(s => known.includes(s.preset)), missing = POOL.scenes.filter(s => !known.includes(s.preset)).map(s => s.preset);
if (missing.length) console.log('not in this Studio, skipped:', missing.join(','));
const pick = list => { const t = list.reduce((a, s) => a + s.w, 0); let r = rnd() * t; for (const s of list) if ((r -= s.w) < 0) return s; return list[0]; };
const segs = []; let total = 0, n = 0;
while (total < target && n < 400) {
  const prev = segs[segs.length - 1], prev2 = segs[segs.length - 2];
  let cand = scenes.filter(s => (!prev || s.preset !== prev.preset));
  if (!segs.length) cand = cand.filter(s => s.hook);
  if (prev && prev2 && prev.machine === prev2.machine) cand = cand.filter(s => s.machine !== prev.machine || !s.machine);
  const sc = pick(cand), pal = POOL.palettes[Math.floor(rnd() * POOL.palettes.length)], seed = 1 + Math.floor(rnd() * 99998);
  const set = Object.assign({ contour: false, c1: pal[0], c2: pal[1], c3: pal[2] }, sc.set || {});
  const info = await page.evaluate(async ({ preset, set, seed }) => {
    const s = window.__studio; await s.preset(preset); await s.set(Object.assign({ seed }, set));
    const S = s.sim(); return { seconds: S.TL.TOT / 60, machine: s.state().machine };
  }, { preset: sc.preset, set, seed });
  sc.machine = info.machine;
  n++; segs.push({ id: 's' + String(n).padStart(3, '0'), preset: sc.preset, name: sc.name, machine: info.machine, seed, set, seconds: Math.round(info.seconds * 100) / 100 });
  total += info.seconds;
}
await browser.close();
fs.writeFileSync(outPath, JSON.stringify({ created: new Date().toISOString(), target, total: Math.round(total), segments: segs }, null, 2));
console.log('planned', segs.length, 'segments,', Math.round(total), 's');
