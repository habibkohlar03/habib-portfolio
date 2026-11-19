// Captures real homepage screenshots of the live project sites -> public/images/projects/<id>.webp (1600x1000).
// Run by .github/workflows/project-screenshots.yml. Sites that fail are skipped (the card keeps its branded panel).
import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir, readFile, access } from 'node:fs/promises';

const src = await readFile(new URL('../src/data/projects.js', import.meta.url), 'utf8');
const items = [...src.matchAll(/id:\s*'([^']+)',[\s\S]*?url:\s*(null|'([^']+)')/g)].filter((m) => m[3]).map((m) => ({ id: m[1], url: m[3] }));
await mkdir('public/images/projects', { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const exists = (f) => access(f).then(() => true, () => false);
for (const { id, url } of items) {
  // Existing screenshots are kept (set FORCE=1 to retake all).
  if (!process.env.FORCE && (await exists(`public/images/projects/${id}.webp`))) {
    console.log('keep', id);
    continue;
  }
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => page.goto(url, { waitUntil: 'load', timeout: 45000 }));
    await page.waitForTimeout(2500);
    const png = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1440, height: 900 } });
    await sharp(png).resize(1600, 1000, { fit: 'cover', position: 'top' }).webp({ quality: 80 }).toFile(`public/images/projects/${id}.webp`);
    console.log('ok', id);
  } catch (e) {
    console.log('skip', id, e.message);
  }
}
await browser.close();
