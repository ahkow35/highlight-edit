import { useEffect, useState, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    analyticsApi,
    AnalyticsOverview,
    EventSeriesPoint,
    AnalyticsUser,
    UserDetail,
} from '../services/api';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const ADMIN_EMAIL = 'nyanyk@gmail.com';

// --- Stat Card Component ---
function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
    return (
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <p className="text-sm text-slate-400 mb-1">{label}</p>
            <p className="text-3xl font-bold text-white">{value}</p>
            {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        </div>
    );
}

// --- Plan Badge ---
function PlanBadge({ plan }: { plan: string }) {
    const colors: Record<string, string> = {
        pro: 'bg-green-900 text-green-300',
        team: 'bg-blue-900 text-blue-300',
        free: 'bg-slate-700 text-slate-300',
    };
    return (
        <span className={`text-xs px-2 py-0.5 rounded font-medium ${colors[plan] || colors.free}`}>
            {plan.toUpperCase()}
        </span>
    );
}

export default function AnalyticsPage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
    const [series, setSeries] = useState<EventSeriesPoint[]>([]);
    const [topUsers, setTopUsers] = useState<AnalyticsUser[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
    const [timeRange, setTimeRange] = useState(30);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Auth guard
    useEffect(() => {
        if (user && user.email !== ADMIN_EMAIL) {
            navigate('/');
        }
    }, [user, navigate]);

    // Fetch overview + top users
    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const [ov, users] = await Promise.all([
                    analyticsApi.getOverview(),
                    analyticsApi.getTopUsers(20),
                ]);
                setOverview(ov);
                setTopUsers(users.users);
            } catch (e: any) {
                setError(e?.response?.data?.detail || 'Failed to load analytics');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // Fetch time-series when range changes
    useEffect(() => {
        const load = async () => {
            try {
                const data = await analyticsApi.getEvents(timeRange);
                setSeries(data.series);
            } catch {
                // silent
            }
        };
        load();
    }, [timeRange]);

    const handleUserClick = async (userId: number) => {
        if (selectedUser?.user.id === userId) {
            setSelectedUser(null);
            return;
        }
        try {
            const detail = await analyticsApi.getUserDetail(userId);
            setSelectedUser(detail);
        } catch {
            // silent
        }
    };

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-12 text-center">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-12 text-center text-red-400">{error}</div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8">
            <h1 className="text-2xl font-bold text-white">📊 Analytics Dashboard</h1>

            {/* Overview Cards */}
            {overview && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Total Users" value={overview.total_users}
                        sub={Object.entries(overview.plan_distribution).map(([k, v]) => `${v} ${k}`).join(' · ')} />
                    <StatCard label="Active Today" value={overview.active_users_today}
                        sub={`${overview.active_users_this_week} this week · ${overview.active_users_this_month} this month`} />
                    <StatCard label="Documents Generated" value={overview.total_documents_generated} />
                    <StatCard label="Events Today" value={overview.total_events_today}
                        sub={`${overview.signups_this_week} signups this week`} />
                </div>
            )}

            {/* Usage Over Time */}
            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white">Usage Over Time</h2>
                    <div className="flex gap-2">
                        {[7, 30, 90].map((d) => (
                            <button
                                key={d}
                                onClick={() => setTimeRange(d)}
                                className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                                    timeRange === d
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                                }`}
                            >
                                {d}d
                            </button>
                        ))}
                    </div>
                </div>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={series}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                            <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                labelStyle={{ color: '#e2e8f0' }}
                                itemStyle={{ color: '#94a3b8' }}
                            />
                            <Legend />
                            <Area type="monotone" dataKey="template_create" stackId="1" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} name="Uploads" />
                            <Area type="monotone" dataKey="export_docx" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} name="DOCX Exports" />
                            <Area type="monotone" dataKey="export_pdf" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} name="PDF Exports" />
                            <Area type="monotone" dataKey="login" stackId="1" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.2} name="Logins" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Top Users */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-700">
                    <h2 className="text-lg font-semibold text-white">Top Users</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-slate-400 text-xs uppercase border-b border-slate-700">
                                <th className="px-5 py-3 text-left">Email</th>
                                <th className="px-5 py-3 text-left">Plan</th>
                                <th className="px-5 py-3 text-right">Docs</th>
                                <th className="px-5 py-3 text-right">Events</th>
                                <th className="px-5 py-3 text-right">Last Active</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topUsers.map((u) => (
                                <Fragment key={u.id}>
                                    <tr
                                        onClick={() => handleUserClick(u.id)}
                                        className="border-b border-slate-700/50 hover:bg-slate-700/30 cursor-pointer transition-colors"
                                    >
                                        <td className="px-5 py-3 text-white">{u.email}</td>
                                        <td className="px-5 py-3"><PlanBadge plan={u.plan} /></td>
                                        <td className="px-5 py-3 text-right text-slate-300">{u.documents_generated}</td>
                                        <td className="px-5 py-3 text-right text-slate-300">{u.total_events}</td>
                                        <td className="px-5 py-3 text-right text-slate-500 text-xs">
                                            {u.last_active ? new Date(u.last_active).toLocaleDateString() : '—'}
                                        </td>
                                    </tr>
                                    {/* Expanded detail row */}
                                    {selectedUser?.user.id === u.id && (
                                        <tr>
                                            <td colSpan={5} className="bg-slate-900 px-5 py-4">
                                                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-4">
                                                    <div><span className="text-xs text-slate-500">Events (Month)</span><p className="text-white font-semibold">{selectedUser.stats.events_this_month}</p></div>
                                                    <div><span className="text-xs text-slate-500">Docs</span><p className="text-white font-semibold">{selectedUser.stats.documents_generated}</p></div>
                                                    <div><span className="text-xs text-slate-500">Templates</span><p className="text-white font-semibold">{selectedUser.stats.templates_saved}</p></div>
                                                    <div><span className="text-xs text-slate-500">Limit Hits</span><p className="text-orange-400 font-semibold">{selectedUser.stats.limit_hits}</p></div>
                                                    <div><span className="text-xs text-slate-500">Total Events</span><p className="text-white font-semibold">{selectedUser.stats.total_events}</p></div>
                                                </div>
                                                <p className="text-xs text-slate-400 mb-2">Recent Activity</p>
                                                <div className="space-y-1 max-h-48 overflow-y-auto">
                                                    {selectedUser.recent_events.slice(0, 15).map((ev, i) => (
                                                        <div key={i} className="flex items-center gap-3 text-xs text-slate-400 py-1">
                                                            <span className="w-24 text-right text-slate-600 shrink-0">
                                                                {new Date(ev.created_at).toLocaleString()}
                                                            </span>
                                                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">{ev.event_type}</span>
                                                            {ev.metadata && Object.keys(ev.metadata).length > 0 && (
                                                                <span className="text-slate-600 truncate">{JSON.stringify(ev.metadata)}</span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Limit Hits Panel */}
            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
                <h2 className="text-lg font-semibold text-white mb-3">🚫 Recent Limit Hits <span className="text-xs text-slate-500 font-normal">(upgrade candidates)</span></h2>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                    {topUsers
                        .filter((u) => u.plan === 'free')
                        .slice(0, 10)
                        .map((u) => (
                            <div key={u.id} className="flex items-center justify-between text-sm text-slate-400 py-1 border-b border-slate-700/30">
                                <span className="text-slate-300">{u.email}</span>
                                <span className="text-xs">{u.total_events} events · {u.documents_generated} docs</span>
                            </div>
                        ))
                    }
                    {topUsers.filter((u) => u.plan === 'free').length === 0 && (
                        <p className="text-slate-500 text-sm">No free-tier users with activity yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
