'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { tokeniseHighlights } from '@/lib/merge/highlight-tokenise';
import type { FieldDef, FieldType } from '@/lib/merge/types';

const TYPES: FieldType[] = ['text', 'textarea', 'date', 'nric', 'currency', 'number'];

async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

export default function NewTemplate() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [jurisdiction, setJurisdiction] = useState('NONE');
  const [ocr, setOcr] = useState(false);
  const [filenamePattern, setFilenamePattern] = useState('');
  const [fields, setFields] = useState<FieldDef[]>([]);
  const [docxB64, setDocxB64] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(file: File) {
    setError(null);
    setFields([]);
    setDocxB64('');
    try {
      const buf = await file.arrayBuffer();
      const { blob, fields } = tokeniseHighlights(buf);
      if (!fields.length) {
        setError('No yellow-highlighted blanks were found. Highlight each variable spot in yellow and re-upload.');
        return;
      }
      setFields(fields);
      setDocxB64(await blobToBase64(blob));
      if (!title) setTitle(file.name.replace(/\.docx$/i, ''));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that .docx.');
    }
  }

  function updateField(i: number, patch: Partial<FieldDef>) {
    setFields((prev) => prev.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  }

  async function save() {
    setError(null);
    if (!title.trim()) return setError('Give the document a title.');
    if (!docxB64) return setError('Upload a highlighted .docx first.');
    setBusy(true);
    const res = await fetch('/api/admin/templates', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title, jurisdiction, ocr, filenamePattern: filenamePattern || null, fields, docxBase64: docxB64 }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) return setError(json.error ?? 'Failed to save.');
    router.push(`/t/${json.id}`);
  }

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Add a document</h1>
      <p className="mt-1 text-sm text-zinc-500 max-w-lg">
        Upload a Word <code>.docx</code> with each variable spot <mark className="bg-yellow-200">highlighted in yellow</mark>.
        Each highlight becomes a form field. The document is tokenised in your browser; only the blank
        template (no personal data) is saved.
      </p>

      <input
        type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="mt-4 block w-full text-sm"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f); }}
      />

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {fields.length > 0 && (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs text-zinc-500">Title</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none" />
            </label>
            <label className="block">
              <span className="text-xs text-zinc-500">Jurisdiction</span>
              <select value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)}
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none">
                <option value="NONE">None</option>
                <option value="SG">Singapore</option>
                <option value="MY">Malaysia</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-zinc-500">Filename pattern (optional)</span>
              <input value={filenamePattern} onChange={(e) => setFilenamePattern(e.target.value)}
                placeholder="e.g. Offer Letter - {field_1}"
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none" />
            </label>
            <label className="flex items-center gap-2 mt-5 text-sm text-zinc-700">
              <input type="checkbox" checked={ocr} onChange={(e) => setOcr(e.target.checked)} />
              Offer ID-card OCR (for templates with name/NRIC)
            </label>
          </div>

          <h2 className="mt-6 text-sm font-medium text-zinc-700">
            Detected fields ({fields.length}) — edit labels &amp; types
          </h2>
          <div className="mt-2 space-y-2">
            {fields.map((f, i) => (
              <div key={f.id} className="flex flex-wrap items-center gap-2 rounded-md border border-zinc-200 px-3 py-2">
                <code className="text-xs text-zinc-400 w-16">{f.id}</code>
                <input value={f.label} onChange={(e) => updateField(i, { label: e.target.value })}
                  className="flex-1 min-w-40 rounded-md border border-zinc-300 px-2 py-1 text-sm focus:border-zinc-900 focus:outline-none" />
                <select value={f.type} onChange={(e) => updateField(i, { type: e.target.value as FieldType })}
                  className="rounded-md border border-zinc-300 px-2 py-1 text-sm focus:border-zinc-900 focus:outline-none">
                  {TYPES.map((tp) => <option key={tp} value={tp}>{tp}</option>)}
                </select>
                {ocr && (
                  <select value={f.ocrSource ?? ''} onChange={(e) => updateField(i, { ocrSource: (e.target.value || undefined) as FieldDef['ocrSource'] })}
                    className="rounded-md border border-zinc-300 px-2 py-1 text-sm focus:border-zinc-900 focus:outline-none">
                    <option value="">no OCR</option>
                    <option value="name">name</option>
                    <option value="nric">nric</option>
                    <option value="address">address</option>
                  </select>
                )}
                <label className="flex items-center gap-1 text-xs text-zinc-500">
                  <input type="checkbox" checked={f.required !== false} onChange={(e) => updateField(i, { required: e.target.checked })} />
                  required
                </label>
              </div>
            ))}
          </div>

          <button onClick={save} disabled={busy}
            className="yellow-bar mt-6 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50">
            {busy ? 'Saving…' : 'Save document'}
          </button>
        </>
      )}
    </div>
  );
}
