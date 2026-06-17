/* Client-only: rasterize the first page of a PDF to a PNG Blob for OCR. ID-card scans often arrive
 * as PDF. pdf.js runs in-browser with a same-origin worker — the file never leaves the device. */

export async function pdfFirstPageToBlob(file: File): Promise<Blob> {
  const pdfjs = await import('pdfjs-dist');
  // Same-origin worker (PDPA). Staged by scripts/setup-ocr.mjs.
  pdfjs.GlobalWorkerOptions.workerSrc = '/ocr/pdf.worker.min.mjs';

  const data = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data }).promise;
  const page = await pdf.getPage(1);
  // Render at ~3x (capped) → sharper raster → better OCR on small print like the name line.
  const base = page.getViewport({ scale: 1 });
  const scale = Math.min(3, 2600 / Math.max(base.width, base.height));
  const viewport = page.getViewport({ scale: Math.max(2, scale) });

  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not available for PDF rendering.');

  await page.render({ canvas, canvasContext: ctx, viewport }).promise;

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PDF render failed.'))), 'image/png');
  });
}

export function isPdf(file: File): boolean {
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
}
