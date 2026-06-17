'use client';

import { useCallback, useEffect, useState } from 'react';

interface User {
  id: string;
  email: string | null;
  role: 'admin' | 'staff';
  created_at: string;
  last_sign_in_at: string | null;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'staff'>('staff');
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<{ email: string; tempPassword: string } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/users');
    const json = await res.json();
    if (!res.ok) setError(json.error ?? 'Failed to load users.');
    else setUsers(json.users);
    setLoading(false);
  }, []);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  async function addUser(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreated(null);
    setBusy(true);
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, role }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(json.error ?? 'Failed to create user.');
      return;
    }
    setCreated({ email: json.user.email, tempPassword: json.tempPassword });
    setEmail('');
    setRole('staff');
    void load();
  }

  async function setUserRole(u: User, next: 'admin' | 'staff') {
    setError(null);
    const res = await fetch(`/api/admin/users/${u.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ role: next }),
    });
    const json = await res.json();
    if (!res.ok) setError(json.error ?? 'Failed to update role.');
    else void load();
  }

  async function removeUser(u: User) {
    if (!confirm(`Remove ${u.email}? This deletes their account.`)) return;
    setError(null);
    const res = await fetch(`/api/admin/users/${u.id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok) setError(json.error ?? 'Failed to remove user.');
    else void load();
  }

  async function resetPw(u: User) {
    if (!confirm(`Reset password for ${u.email}? You'll get a new temporary password to share.`)) return;
    setError(null);
    setCreated(null);
    const res = await fetch(`/api/admin/users/${u.id}/reset-password`, { method: 'POST' });
    const json = await res.json();
    if (!res.ok) setError(json.error ?? 'Failed to reset password.');
    else setCreated({ email: u.email ?? '', tempPassword: json.tempPassword });
  }

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Users</h1>

      <form onSubmit={addUser} className="mt-4 flex flex-wrap items-end gap-2">
        <label className="flex-1 min-w-48">
          <span className="text-xs text-zinc-500">Email</span>
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="new.staff@withkinna.com"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
          />
        </label>
        <label>
          <span className="text-xs text-zinc-500">Role</span>
          <select value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'staff')}
            className="mt-1 block rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none">
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <button type="submit" disabled={busy}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50">
          {busy ? 'Adding…' : 'Add user'}
        </button>
      </form>

      {created && (
        <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          <strong>{created.email}</strong> — temporary password (shown once; share securely over a
          trusted channel): <code className="font-mono">{created.tempPassword}</code>
        </div>
      )}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-6 overflow-hidden rounded-md border border-zinc-200">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
            <tr>
              <th className="px-3 py-2 font-medium">Email</th>
              <th className="px-3 py-2 font-medium">Role</th>
              <th className="px-3 py-2 font-medium">Last sign-in</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading ? (
              <tr><td className="px-3 py-3 text-zinc-400" colSpan={4}>Loading…</td></tr>
            ) : users.length === 0 ? (
              <tr><td className="px-3 py-3 text-zinc-400" colSpan={4}>No users.</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td className="px-3 py-2 text-zinc-800">{u.email}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded px-2 py-0.5 text-xs ${u.role === 'admin' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' : 'bg-zinc-100 text-zinc-600'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-zinc-500">
                    {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    {u.role === 'admin' ? (
                      <button onClick={() => setUserRole(u, 'staff')} className="text-xs text-zinc-500 hover:text-zinc-900">Make staff</button>
                    ) : (
                      <button onClick={() => setUserRole(u, 'admin')} className="text-xs text-zinc-500 hover:text-zinc-900">Make admin</button>
                    )}
                    <button onClick={() => resetPw(u)} className="ml-3 text-xs text-zinc-500 hover:text-zinc-900">Reset PW</button>
                    <button onClick={() => removeUser(u)} className="ml-3 text-xs text-red-500 hover:text-red-700">Remove</button>
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
