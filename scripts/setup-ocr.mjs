/* Stage Tesseract OCR engine files SAME-ORIGIN under public/ocr (no CDN at runtime — PDPA).
 * Copies the worker + core wasm from node_modules and downloads the English language data.
 * Idempotent. Runs automatically before `next build` (prebuild) and via `npm run setup:ocr`. */

import { mkdirSync, copyFileSync, existsSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'ocr');
const langDir = join(outDir, 'lang');
mkdirSync(langDir, { recursive: true });

// 1. Tesseract worker.
const worker = join(root, 'node_modules/tesseract.js/dist/worker.min.js');
if (!existsSync(worker)) {
  console.error('[setup-ocr] missing tesseract.js — run `npm install` first.');
  process.exit(1);
}
copyFileSync(worker, join(outDir, 'worker.min.js'));
console.log('[setup-ocr] copied worker.min.js');

// 2. ALL core variants. v7 loads the core through the `.wasm.js` wrapper (e.g.
// tesseract-core-simd-lstm.wasm.js) chosen by SIMD support — copy every tesseract-core*
// file so whichever variant the browser picks resolves same-origin. (The missing .wasm.js
// wrappers were why OCR 404'd and silently failed.)
const coreDir = join(root, 'node_modules/tesseract.js-core');
const coreFiles = readdirSync(coreDir).filter((f) => f.startsWith('tesseract-core'));
for (const f of coreFiles) copyFileSync(join(coreDir, f), join(outDir, f));
console.log(`[setup-ocr] copied ${coreFiles.length} core files (.wasm + .wasm.js wrappers)`);

// 3. pdf.js worker (same-origin) — used to rasterize PDF scans of ID cards before OCR.
const pdfWorker = join(root, 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs');
if (existsSync(pdfWorker)) {
  copyFileSync(pdfWorker, join(outDir, 'pdf.worker.min.mjs'));
  console.log('[setup-ocr] copied pdf.worker.min.mjs');
}

const TRAINEDDATA = join(langDir, 'eng.traineddata.gz');
const TRAINEDDATA_URL = 'https://tessdata.projectnaptha.com/4.0.0/eng.traineddata.gz';
if (existsSync(TRAINEDDATA)) {
  console.log('[setup-ocr] eng.traineddata.gz already present — skipping download.');
} else {
  console.log(`[setup-ocr] downloading eng.traineddata.gz …`);
  const res = await fetch(TRAINEDDATA_URL);
  if (!res.ok) {
    console.error(`[setup-ocr] download failed (${res.status}). Place eng.traineddata.gz in public/ocr/lang/ manually.`);
    process.exit(1);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(TRAINEDDATA, buf);
  console.log(`[setup-ocr] wrote eng.traineddata.gz (${(buf.length / 1e6).toFixed(1)} MB)`);
}
console.log('[setup-ocr] done.');
