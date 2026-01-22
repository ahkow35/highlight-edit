import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminApi, AdminUser } from '../services/api';

// Admin email - should match backend
const ADMIN_EMAIL = 'nyanyk@gmail.com';

export default function AdminPage() {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    // Redirect non-admin users
    useEffect(() => {
        if (!isAuthenticated || (user && user.email !== ADMIN_EMAIL)) {
            navigate('/');
        }
    }, [isAuthenticated, user, navigate]);

    // Load users on mount
    useEffect(() => {
        const loadUsers = async () => {
            if (!isAuthenticated || user?.email !== ADMIN_EMAIL) return;

            try {
                setLoading(true);
                const data = await adminApi.listUsers();
                setUsers(data);
            } catch (err: any) {
                setError(err.response?.data?.detail || 'Failed to load users');
            } finally {
                setLoading(false);
            }
        };
        loadUsers();
    }, [isAuthenticated, user]);

    const handleTogglePro = async (userId: number) => {
        try {
            setActionLoading(userId);
            const result = await adminApi.toggleUserPro(userId);
            // Update local state
            setUsers(users.map(u =>
                u.id === userId ? { ...u, is_paid: result.is_paid } : u
            ));
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed to toggle Pro status');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteUser = async (userId: number, email: string) => {
        if (!confirm(`Are you sure you want to delete user ${email}? This cannot be undone.`)) {
            return;
        }

        try {
            setActionLoading(userId);
            await adminApi.deleteUser(userId);
            setUsers(users.filter(u => u.id !== userId));
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed to delete user');
        } finally {
            setActionLoading(null);
        }
    };

    // Only render for admin
    if (!isAuthenticated || user?.email !== ADMIN_EMAIL) {
        return null;
    }

    return (
        <div className="max-w-6xl mx-auto px-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
                <p className="text-slate-400">Manage beta users and subscriptions</p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-red-400">{error}</p>
                </div>
            )}

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading users...</p>
                </div>
            ) : (
                <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/80">
                        <h2 className="text-lg font-semibold text-white">
                            All Users ({users.length})
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-800 text-left text-sm font-medium text-slate-400">
                                    <th className="px-6 py-4">ID</th>
                                    <th className="px-6 py-4">Email</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Usage Today</th>
                                    <th className="px-6 py-4">Created</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr
                                        key={u.id}
                                        className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                                    >
                                        <td className="px-6 py-4 text-slate-400 text-sm">
                                            #{u.id}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-white font-medium">{u.email}</span>
                                            {u.email === ADMIN_EMAIL && (
                                                <span className="ml-2 text-xs bg-purple-900 text-purple-300 px-1.5 py-0.5 rounded">
                                                    Admin
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {u.is_paid ? (
                                                <span className="text-xs bg-green-900 text-green-300 px-2 py-1 rounded-full">
                                                    Pro
                                                </span>
                                            ) : (
                                                <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded-full">
                                                    Free
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-400 text-sm">
                                            {u.usage_count || 0}
                                        </td>
                                        <td className="px-6 py-4 text-slate-400 text-sm">
                                            {new Date(u.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleTogglePro(u.id)}
                                                    disabled={actionLoading === u.id}
                                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${u.is_paid
                                                            ? 'bg-orange-900/50 text-orange-300 hover:bg-orange-900'
                                                            : 'bg-green-900/50 text-green-300 hover:bg-green-900'
                                                        } ${actionLoading === u.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    {actionLoading === u.id ? '...' : u.is_paid ? 'Revoke Pro' : 'Make Pro'}
                                                </button>

                                                {u.email !== ADMIN_EMAIL && (
                                                    <button
                                                        onClick={() => handleDeleteUser(u.id, u.email)}
                                                        disabled={actionLoading === u.id}
                                                        className={`px-3 py-1.5 text-xs font-medium bg-red-900/50 text-red-300 hover:bg-red-900 rounded-lg transition-colors ${actionLoading === u.id ? 'opacity-50 cursor-not-allowed' : ''
                                                            }`}
                                                    >
                                                        {actionLoading === u.id ? '...' : 'Delete'}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {users.length === 0 && (
                        <div className="text-center py-12 text-slate-400">
                            No users found
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
