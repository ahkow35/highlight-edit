'use client';

import { useState } from 'react';
import type { Jurisdiction } from '@/lib/merge/types';
import { extractFromOcrText, type OcrExtract } from '@/lib/ocr/extract';
import { recognizeImage } from '@/lib/ocr/recognize';
import { isPdf, pdfFirstPageToBlob } from '@/lib/ocr/pdf';

const ID_LABEL: Record<Jurisdiction, string> = { SG: 'NRIC card', MY: 'MyKad' };
const MAX_FILES = 2;

export function OcrPanel({
  jurisdiction,
  onApply,
}: {
  jurisdiction: Jurisdiction;
  onApply: (extract: OcrExtract) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [previews, setPreviews] = useState<string[]>([]);
  const [result, setResult] = useState<OcrExtract | null>(null);
  const [rawText, setRawText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  function clearAll() {
    setPreviews((old) => {
      old.forEach((u) => URL.revokeObjectURL(u));
      return [];
    });
    setResult(null);
    setRawText('');
    setError(null);
    setProgress(0);
    setStage('');
  }

  async function handleFiles(list: File[]) {
    const files = list.filter((f) => f.type.startsWith('image/') || isPdf(f)).slice(0, MAX_FILES);
    if (!files.length) {
      setError('Please drop an image or PDF.');
      return;
    }
    clearAll();
    setBusy(true);
    try {
      const texts: string[] = [];
      const newPreviews: string[] = [];
      for (let i = 0; i < files.length; i++) {
        setStage(files.length > 1 ? `Reading scan ${i + 1} of ${files.length}…` : 'Reading…');
        setProgress(0);
        const imageBlob = isPdf(files[i]) ? await pdfFirstPageToBlob(files[i]) : files[i];
        newPreviews.push(URL.createObjectURL(imageBlob));
        texts.push(await recognizeImage(imageBlob, setProgress));
      }
      setPreviews(newPreviews);
      const combined = texts.join('\n'); // merge both scans (e.g. NRIC front + back)
      setRawText(combined);
      setResult(extractFromOcrText(combined, jurisdiction));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'OCR failed.');
    } finally {
      setBusy(false);
      setStage('');
    }
  }

  const found = result && (result.nric || result.name || result.address);
  const hasContent = previews.length > 0 || result !== null || error !== null;

  return (
    <details className="mb-6 rounded-md border border-zinc-200 bg-zinc-50/60 px-4 py-3">
      <summary className="cursor-pointer text-sm font-medium text-zinc-800">
        📷 Scan {ID_LABEL[jurisdiction]} to pre-fill — photo or PDF (optional)
      </summary>

      <p className="mt-2 text-xs text-zinc-500">
        Drop up to {MAX_FILES} scans (e.g. NRIC front &amp; back). Read on your device only — never
        uploaded. Always check the result against the card; OCR is an assist, not a source of truth.
      </p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); void handleFiles(Array.from(e.dataTransfer.files)); }}
        className={`mt-3 rounded-md border-2 border-dashed px-4 py-6 text-center text-sm transition-colors ${
          dragging ? 'border-zinc-900 bg-zinc-100' : 'border-zinc-300 bg-white'
        }`}
      >
        <span className="text-zinc-600">Drag &amp; drop here, or </span>
        <label className="cursor-pointer text-zinc-900 underline underline-offset-2">
          browse
          <input
            type="file" accept="image/*,application/pdf" multiple className="hidden"
            onChange={(e) => { const fs = Array.from(e.target.files ?? []); if (fs.length) void handleFiles(fs); e.target.value = ''; }}
          />
        </label>
        <div className="mt-1 text-xs text-zinc-400">Up to {MAX_FILES} files · JPG/PNG/PDF</div>
      </div>

      {busy && <p className="mt-3 text-xs text-zinc-500">{stage} {Math.round(progress * 100)}%</p>}
      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

      {previews.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {previews.map((p, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={p} alt={`scan ${i + 1}`} className="max-h-32 rounded border border-zinc-200" />
          ))}
        </div>
      )}

      {result && (
        <div className="mt-3 space-y-1 text-sm">
          {found ? (
            <>
              <Row label="Name" value={result.name} />
              <Row label="ID no." value={result.nric} />
              <Row label="Address" value={result.address} />
              <button
                type="button" onClick={() => onApply(result)}
                className="mt-2 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium hover:border-zinc-900"
              >
                Apply to form (then verify each field)
              </button>
            </>
          ) : (
            <p className="text-xs text-amber-700">
              Couldn’t read the card clearly. Try a sharper, well-lit scan, add the second side, or
              enter details manually.
            </p>
          )}
        </div>
      )}

      {rawText && (
        <details className="mt-3 text-xs text-zinc-500">
          <summary className="cursor-pointer">Show everything the scan read</summary>
          <p className="mt-1 text-zinc-400">If a field above is blank or wrong, copy it from here — the form fields are editable.</p>
          <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap rounded border border-zinc-200 bg-white p-2 text-zinc-700">
            {rawText}
          </pre>
        </details>
      )}

      {hasContent && (
        <button
          type="button" onClick={clearAll}
          className="mt-3 text-xs text-zinc-500 underline underline-offset-2 hover:text-zinc-900"
        >
          Clear scans
        </button>
      )}
    </details>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex gap-2">
      <span className="w-16 shrink-0 text-zinc-400">{label}</span>
      <span className="whitespace-pre-line text-zinc-800">{value || <em className="text-zinc-400">—</em>}</span>
    </div>
  );
}
