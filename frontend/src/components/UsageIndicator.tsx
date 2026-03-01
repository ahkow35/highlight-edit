import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const FREE_MONTHLY_LIMIT = 5;

export default function UsageIndicator() {
    const { user } = useAuth();

    // Only show for logged-in free users
    if (!user || user.is_paid) return null;

    const used = user.usage_count || 0;
    const limit = FREE_MONTHLY_LIMIT;
    const pct = Math.min((used / limit) * 100, 100);

    let barColor = 'bg-green-500';
    if (pct >= 80) barColor = 'bg-red-500';
    else if (pct >= 60) barColor = 'bg-yellow-500';

    return (
        <div className="bg-slate-800/60 border border-slate-700 rounded-lg px-4 py-3 text-sm">
            <div className="flex items-center justify-between mb-1.5">
                <span className="text-slate-400">
                    📊 Usage: <span className="text-white font-medium">{used}</span> / {limit} documents this month
                </span>
                <Link to="/upgrade" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                    Upgrade to Pro →
                </Link>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-1.5">
                <div
                    className={`${barColor} h-1.5 rounded-full transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}
