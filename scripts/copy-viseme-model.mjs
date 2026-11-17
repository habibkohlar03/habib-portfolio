// Copies the SDK's lip-sync model into public/sdk so it is served from your own
// domain (the Talking Avatar SDK docs: copy dist/viseme-model.bin to public/sdk/
// and set modelUrl to /sdk/viseme-model.bin).
//
// Runs automatically after `npm install` (see "postinstall" in package.json),
// and manually with `npm run sync-sdk`. It never fails the install: if the SDK
// is not installed yet it prints a notice and exits cleanly.
import { copyFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, 'node_modules/@interviewflowai/talking-avatar/dist/viseme-model.bin');
const target = resolve(root, 'public/sdk/viseme-model.bin');

if (!existsSync(source)) {
  console.warn(
    '[sync-sdk] Skipped: node_modules/@interviewflowai/talking-avatar/dist/viseme-model.bin was not found.\n' +
      '           Run `npm install`, then `npm run sync-sdk`.',
  );
  process.exit(0);
}

try {
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(source, target);
  const kb = Math.round(statSync(target).size / 1024);
  console.log(`[sync-sdk] Copied viseme-model.bin (${kb} KB) to public/sdk/. Commit this file to Git.`);
} catch (error) {
  console.warn('[sync-sdk] Could not copy viseme-model.bin:', error.message);
}
