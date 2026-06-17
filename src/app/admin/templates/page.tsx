'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

interface Row {
  id: string;
  title: string;
  jurisdiction: string;
  fieldCount: number;
  ocr: boolean;
  created_at?: string;
}

export default function AdminTemplates() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/templates');
    const json = await res.json();
    if (!res.ok) setError(json.error ?? 'Failed to load.');
    else setRows(json.templates);
    setLoading(false);
  }, []);

  useEffect(() => {
    void (async () => { await load(); })();
  }, [load]);

  async function remove(r: Row) {
    if (!confirm(`Delete "${r.title}"? Existing downloaded documents are unaffected.`)) return;
    setError(null);
    const res = await fetch(`/api/admin/templates/${r.id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok) setError(json.error ?? 'Failed to delete.');
    else void load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Documents</h1>
        <Link href="/admin/templates/new"
          className="yellow-bar rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800">
          + Add document
        </Link>
      </div>
      <p className="mt-1 text-sm text-zinc-500">Templates you’ve added by uploading a highlighted Word file.</p>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-6 overflow-hidden rounded-md border border-zinc-200">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
            <tr><th className="px-3 py-2 font-medium">Title</th><th className="px-3 py-2 font-medium">Fields</th><th className="px-3 py-2" /></tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading ? (
              <tr><td className="px-3 py-3 text-zinc-400" colSpan={3}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="px-3 py-3 text-zinc-400" colSpan={3}>No added documents yet. Click “Add document”.</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-3 py-2 text-zinc-800">
                    <Link href={`/t/${r.id}`} className="hover:underline">{r.title}</Link>
                    {r.jurisdiction !== 'NONE' && <span className="ml-2 text-xs text-zinc-400">{r.jurisdiction}</span>}
                  </td>
                  <td className="px-3 py-2 text-zinc-500">{r.fieldCount}{r.ocr ? ' · OCR' : ''}</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => remove(r)} className="text-xs text-red-500 hover:text-red-700">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
