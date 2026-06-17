import Link from 'next/link';

export default function AdminHome() {
  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Admin</h1>
      <p className="mt-1 text-sm text-zinc-500">Manage staff access and review usage.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Link href="/admin/templates" className="yellow-bar rounded-md border border-zinc-200 px-4 py-3 hover:border-zinc-300">
          <div className="font-medium text-zinc-900">Documents</div>
          <div className="mt-0.5 text-xs text-zinc-500">Add new templates from highlighted Word files</div>
        </Link>
        <Link href="/admin/users" className="yellow-bar rounded-md border border-zinc-200 px-4 py-3 hover:border-zinc-300">
          <div className="font-medium text-zinc-900">Users</div>
          <div className="mt-0.5 text-xs text-zinc-500">Add / remove staff and sub-admins</div>
        </Link>
        <Link href="/admin/usage" className="yellow-bar rounded-md border border-zinc-200 px-4 py-3 hover:border-zinc-300">
          <div className="font-medium text-zinc-900">Usage</div>
          <div className="mt-0.5 text-xs text-zinc-500">Documents generated, by template + user</div>
        </Link>
      </div>
    </div>
  );
}
