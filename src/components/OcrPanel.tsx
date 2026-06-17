'use client';

import { useRef, useState } from 'react';
import type { Jurisdiction } from '@/lib/merge/types';
import { extractFromOcrText, type OcrExtract } from '@/lib/ocr/extract';
import { recognizeImage } from '@/lib/ocr/recognize';
import { isPdf, pdfFirstPageToBlob } from '@/lib/ocr/pdf';

const ID_LABEL: Record<Jurisdiction, string> = { SG: 'NRIC card', MY: 'MyKad' };

export function OcrPanel({
  jurisdiction,
  onApply,
}: {
  jurisdiction: Jurisdiction;
  onApply: (extract: OcrExtract) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<OcrExtract | null>(null);
  const [rawText, setRawText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    setResult(null);
    setRawText('');
    setProgress(0);
    setBusy(true);
    try {
      // PDF scans are rasterised (first page) to an image first; the image is used for OCR + preview.
      const imageBlob = isPdf(file) ? await pdfFirstPageToBlob(file) : file;
      setPreview((old) => {
        if (old) URL.revokeObjectURL(old);
        return URL.createObjectURL(imageBlob);
      });
      const text = await recognizeImage(imageBlob, setProgress);
      setRawText(text);
      setResult(extractFromOcrText(text, jurisdiction));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'OCR failed.');
    } finally {
      setBusy(false);
    }
  }

  const found = result && (result.nric || result.name || result.address);

  return (
    <details className="mb-6 rounded-md border border-zinc-200 bg-zinc-50/60 px-4 py-3">
      <summary className="cursor-pointer text-sm font-medium text-zinc-800">
        📷 Scan {ID_LABEL[jurisdiction]} to pre-fill — photo or PDF (optional)
      </summary>

      <p className="mt-2 text-xs text-zinc-500">
        Upload a photo or a PDF scan. It is read on your device only — never uploaded. Always check
        the result against the card before generating; OCR is an assist, not a source of truth.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="mt-3 block w-full text-sm"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
        }}
      />

      {busy && (
        <p className="mt-3 text-xs text-zinc-500">
          Reading… {Math.round(progress * 100)}%
        </p>
      )}
      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="ID card preview" className="mt-3 max-h-40 rounded border border-zinc-200" />
      )}

      {result && (
        <div className="mt-3 space-y-1 text-sm">
          {found ? (
            <>
              <Row label="Name" value={result.name} />
              <Row label="ID no." value={result.nric} />
              <Row label="Address" value={result.address} />
              <button
                type="button"
                onClick={() => onApply(result)}
                className="mt-2 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium hover:border-zinc-900"
              >
                Apply to form (then verify each field)
              </button>
            </>
          ) : (
            <p className="text-xs text-amber-700">
              Couldn’t read the card clearly. Try a sharper, well-lit photo, or enter details manually.
            </p>
          )}
        </div>
      )}
      {rawText && (
        <details className="mt-3 text-xs text-zinc-500">
          <summary className="cursor-pointer">Show everything the scan read</summary>
          <p className="mt-1 text-zinc-400">
            If a field above is blank or wrong, copy it from here — the form fields are editable.
          </p>
          <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap rounded border border-zinc-200 bg-white p-2 text-zinc-700">
            {rawText}
          </pre>
        </details>
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
