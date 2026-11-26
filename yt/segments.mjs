// reels yt v1.4.0: renders the portrait segments of a long YouTube video, one after the other, resumable.
// usage: [WORKERS=2 WORKER=0] node segments.mjs <studio index.html> <plan.json> <outdir> [maxSeconds]
// plan.json: { "segments": [ { "id": "s01", "preset": "ecken", "seed": 123, "set": { ... } }, ... ] }
// Every finished segment is <outdir>/<id>.mp4 plus <id>.json; existing ones are skipped. The script stops cleanly
// before starting a new segment once maxSeconds have passed, so it can be called again until all are done.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const [, , htmlPath, planPath, outDir, maxArg] = process.argv;
if (!htmlPath || !planPath || !outDir) { console.error('usage: node segments.mjs index.html plan.json outdir [maxSeconds]'); process.exit(2); }
const plan = JSON.parse(fs.readFileSync(planPath, 'utf8')), maxS = Number(maxArg || 1e9), t0 = Date.now();
fs.mkdirSync(outDir, { recursive: true });
const W = Number(process.env.WORKERS || 1), WI = Number(process.env.WORKER || 0);
const todo = plan.segments.filter((s, i) => i % W === WI && !fs.existsSync(path.join(outDir, s.id + '.mp4')));
console.log('segments', plan.segments.length, 'todo', todo.length);
if (!todo.length) { console.log('ALL DONE'); process.exit(0); }

const browser = await chromium.launch({
  executablePath: fs.existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined, headless: true,
  args: process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(' ') : ['--autoplay-policy=no-user-gesture-required', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist']
});
for (const seg of todo) {
  if ((Date.now() - t0) / 1000 > maxS) { console.log('TIME UP, call again'); break; }
  const page = await browser.newPage({ viewport: { width: 1280, height: 1400 } });
  page.on('pageerror', e => console.error('pageerror:', e.message));
  await page.goto('file://' + path.resolve(htmlPath));
  await page.waitForFunction(() => window.__studio && window.__studio.state() && !window.__studio.broken(), null, { timeout: 120000 });
  const t1 = Date.now();
  const chosen = await page.evaluate(async seg => {
    const s = window.__studio;
    await s.preset(seg.preset);
    await s.set(Object.assign({ seed: seg.seed, sound: true, logo: true, contour: false, res: 1080, fps: 30, quality: 'high' }, seg.set || {}));
    const st = s.state(), S = s.sim();
    const until = !S ? null : S.MACH === 'ropes' ? (S.rope.until || S.rope.total * 2) : S.custom ? null : Math.round(S.CAP * (S.hudScale || 1));
    return { preset: seg.preset, seed: st.seed, machine: st.machine, colors: [st.c1, st.c2, st.c3], until };
  }, seg);
  const res = await page.evaluate(async () => window.__studio.exportVideo());
  if (!res) { const msg = await page.evaluate(() => (document.getElementById('status') || {}).textContent || ''); console.error('FAILED', seg.id, msg); await page.close(); continue; }
  const size = await page.evaluate(() => window.__studio.blob().size), tmp = path.join(outDir, seg.id + '.part'), fd = fs.openSync(tmp, 'w'), CH = 4 * 1024 * 1024;
  for (let off = 0; off < size; off += CH) {
    const b64 = await page.evaluate(async ({ off, CH }) => {
      const buf = new Uint8Array(await window.__studio.blob().slice(off, off + CH).arrayBuffer());
      let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
      return btoa(s);
    }, { off, CH });
    fs.writeSync(fd, Buffer.from(b64, 'base64'));
  }
  fs.closeSync(fd);
  fs.writeFileSync(path.join(outDir, seg.id + '.json'), JSON.stringify({ ...seg, ...chosen, ...res }, null, 2));
  fs.renameSync(tmp, path.join(outDir, seg.id + '.mp4'));
  console.log('done', seg.id, seg.preset, Math.round(res.seconds) + 's video in', Math.round((Date.now() - t1) / 1000) + 's');
  await page.close();
}
await browser.close();
