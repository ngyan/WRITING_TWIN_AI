import * as esbuild from 'esbuild';
import { copyFileSync, mkdirSync, statSync } from 'fs';

const isProd = process.argv.includes('--prod');
const outdir = 'dist';

// GOOGLE_CLIENT_ID is public (appears in redirect URLs) — safe to embed in extension JS.
// Set via env var or leave empty for local dev without Google OAuth.
const googleClientId = process.env.GOOGLE_CLIENT_ID ?? '';

mkdirSync(outdir, { recursive: true });
mkdirSync(`${outdir}/content`, { recursive: true });
mkdirSync(`${outdir}/popup`, { recursive: true });
mkdirSync(`${outdir}/icons`, { recursive: true });

await esbuild.build({
  entryPoints: {
    'background':       'src/background.ts',
    'content/gmail':    'src/content/gmail.ts',
    'content/outlook':  'src/content/outlook.ts',
    'popup/popup':      'src/popup/popup.ts',
  },
  bundle: true,
  outdir,
  format: 'iife',
  target: 'chrome120',
  minify: isProd,
  sourcemap: !isProd ? 'inline' : false,
  define: {
    '__GOOGLE_CLIENT_ID__': JSON.stringify(googleClientId),
  },
});

copyFileSync('manifest.json', `${outdir}/manifest.json`);
copyFileSync('src/popup/popup.html', `${outdir}/popup/popup.html`);
copyFileSync('src/popup/popup.css', `${outdir}/popup/popup.css`);
for (const size of [16, 32, 48, 128]) {
  copyFileSync(`icons/icon${size}.png`, `${outdir}/icons/icon${size}.png`);
}

// Print bundle sizes
const files = [
  `${outdir}/background.js`,
  `${outdir}/content/gmail.js`,
  `${outdir}/content/outlook.js`,
  `${outdir}/popup/popup.js`,
];
let total = 0;
for (const f of files) {
  try {
    const size = statSync(f).size;
    total += size;
    console.log(`  ${f.padEnd(32)} ${(size / 1024).toFixed(1)} KB`);
  } catch {}
}
console.log(`  ${'TOTAL'.padEnd(32)} ${(total / 1024).toFixed(1)} KB`);
console.log(isProd ? '✓ Production build → dist/' : '✓ Dev build → dist/');
