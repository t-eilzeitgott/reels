// reels render v1.2.0: renders one "satisfying" video from the Talfahrt Studio page.
// usage: [VARIANT=remix] [AVOID=presse,leinen] [PREVIEW=1] node render.mjs <studio index.html> <out.mp4> [presetId] [seed]
//   VARIANT: a curated variant from variants.json (Studio preset + extra settings).
//   Without VARIANT a random preset from POOL is used (AVOID skips presets).
//   PREVIEW=1 renders 720p30 for a quick look instead of 1080p60.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const [, , htmlPath, outPath, forcePreset, forceSeed] = process.argv;
if (!htmlPath || !outPath) { console.error('usage: node render.mjs index.html out.mp4 [preset] [seed]'); process.exit(2); }

const here = path.dirname(fileURLToPath(import.meta.url));
const VARIANTS = JSON.parse(fs.readFileSync(path.join(here, 'variants.json'), 'utf8')).variants;
const variant = process.env.VARIANT ? VARIANTS.find(v => v.id === process.env.VARIANT) : null;
if (process.env.VARIANT && !variant) { console.error('unknown variant', process.env.VARIANT, 'known:', VARIANTS.map(v => v.id).join(',')); process.exit(2); }
const preview = process.env.PREVIEW === '1';

// weights: the bands did best on Instagram, the press did best on TikTok
const POOL = [
  ['leinen', 6], ['b_zeitlupe', 6], ['b_trampolin', 5], ['b_glas', 5], ['b_gummi', 4], ['b_zuend', 4],
  ['b_regen', 4], ['b_fibo', 3], ['b_drei', 3], ['b_pakete', 2],
  ['presse', 6], ['vier', 3], ['dreh', 3], ['splitter', 2],
  ['klingen', 6], ['klingen_dreh', 4], ['klingen_streifen', 3], ['klingen_graphit', 3],
  ['ringe', 3], ['ringschwarm', 2], ['wachsen', 2], ['kette', 2],
  ['sanduhr', 2], ['galton', 2], ['glockenspiel', 1], ['brunnen', 1], ['loch', 1], ['trommel', 1], ['mandala', 1]
];
const AVOID = (process.env.AVOID || '').split(',').map(x => x.trim()).filter(Boolean);
const pickWeighted = () => {
  const pool = POOL.filter(([id]) => !AVOID.includes(id)), list = pool.length ? pool : POOL;
  const t = list.reduce((a, [, w]) => a + w, 0); let r = Math.random() * t;
  for (const [id, w] of list) { if ((r -= w) < 0) return id; } return list[0][0];
};

const browser = await chromium.launch({
  executablePath: fs.existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined,
  headless: true,
  args: ['--autoplay-policy=no-user-gesture-required', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist']
});
const page = await browser.newPage({ viewport: { width: 1280, height: 1400 } });
page.on('pageerror', e => console.error('pageerror:', e.message));
await page.goto('file://' + path.resolve(htmlPath));
await page.waitForFunction(() => window.__studio && window.__studio.state() && !window.__studio.broken(), null, { timeout: 120000 });

const known = await page.evaluate(() => window.__studio.presets().map(p => p.id));
let presetId = variant ? variant.preset : forcePreset && known.includes(forcePreset) ? forcePreset : pickWeighted();
if (!known.includes(presetId)) { if (variant) { console.error('variant preset missing in Studio:', presetId); process.exit(1); } presetId = 'leinen'; }
const seed = forceSeed ? Number(forceSeed) : 1 + Math.floor(Math.random() * 99999);
const out = preview ? { res: 720, fps: 30 } : { res: 1080, fps: 60 };

const chosen = await page.evaluate(async ({ presetId, seed, extra, out }) => {
  const s = window.__studio;
  await s.preset(presetId);
  const isRopes = s.state().machine === 'ropes';
  // bands without a variant: half the time a fresh look from the dice (the dice stay with the bands)
  if (!extra && isRopes && Math.random() < 0.5) await s.dice();
  await s.set(Object.assign({}, extra || {}, { seed, sound: true, logo: true, res: out.res, fps: out.fps, quality: 'mid' }));
  const st = s.state(), S = s.sim();
  // the number behind "--until" in the picture
  const until = !S ? null : S.MACH === 'ropes' ? (S.rope.until || S.rope.total * 2) : Math.round(S.CAP * (S.hudScale || 1));
  return { preset: presetId, name: (s.presets().find(p => p.id === presetId) || {}).name, desc: (s.presets().find(p => p.id === presetId) || {}).desc, seed: st.seed, machine: st.machine, colors: [st.c1, st.c2, st.c3], grain: st.grain, title: st.title, until };
}, { presetId, seed, extra: variant ? variant.set : null, out });
if (variant) Object.assign(chosen, { variant: variant.id, name: variant.name, scene: variant.scene, tags: variant.tags });
console.log('chosen', JSON.stringify(chosen));

const t0 = Date.now();
const res = await page.evaluate(async () => window.__studio.exportVideo());
if (!res) { const msg = await page.evaluate(() => document.getElementById('status') ? document.getElementById('status').textContent : ''); console.error('export failed', msg); await browser.close(); process.exit(1); }
console.log('export', JSON.stringify(res), 'in', Math.round((Date.now() - t0) / 1000), 's');

// pull the blob out of the page in chunks
const size = await page.evaluate(() => window.__studio.blob().size);
const fd = fs.openSync(outPath, 'w');
const CH = 4 * 1024 * 1024;
for (let off = 0; off < size; off += CH) {
  const b64 = await page.evaluate(async ({ off, CH }) => {
    const buf = new Uint8Array(await window.__studio.blob().slice(off, off + CH).arrayBuffer());
    let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
    return btoa(s);
  }, { off, CH });
  fs.writeSync(fd, Buffer.from(b64, 'base64'));
}
fs.closeSync(fd);
fs.writeFileSync(outPath.replace(/\.mp4$/, '') + '.json', JSON.stringify({ ...chosen, ...res }, null, 2));
console.log('wrote', outPath, size, 'bytes');
await browser.close();
