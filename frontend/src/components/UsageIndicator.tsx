import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const FREE_MONTHLY_LIMIT = 5;

export default function UsageIndicator() {
    const { user } = useAuth();

    if (!user || user.is_paid) return null;

    const used = user.usage_count || 0;
    const limit = FREE_MONTHLY_LIMIT;
    const pct = Math.min((used / limit) * 100, 100);

    const barColor =
        pct >= 80 ? 'bg-[#EF4444]' : pct >= 60 ? 'bg-[#F59E0B]' : 'bg-[#FFE033]';

    return (
        <div className="bg-white border border-[#E4E4E7] rounded-lg px-4 py-3">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#71717A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="text-xs text-[#71717A]">
                        <span className="font-semibold text-[#09090B]">{used}</span> / {limit} documents this month
                    </span>
                </div>
                <Link
                    to="/upgrade"
                    className="text-xs font-medium text-[#CA8A04] hover:text-[#A16207] transition-colors"
                >
                    Upgrade to Pro →
                </Link>
            </div>
            <div className="w-full bg-[#E4E4E7] rounded-full h-1.5">
                <div
                    className={`${barColor} h-1.5 rounded-full transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}
