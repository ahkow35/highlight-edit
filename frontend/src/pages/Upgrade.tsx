import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CHECK_ICON = (
    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15l-4.121-4.121a1 1 0 011.414-1.414L8.414 12.172l7.879-7.879a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
);

const FREE_FEATURES = [
    '5 documents per month',
    'Basic highlight editing',
    'Word & PDF export',
];

const PRO_FEATURES = [
    'Unlimited documents',
    'Save unlimited templates',
    'Reuse templates instantly',
    'Priority support',
];

const UpgradePage: React.FC = () => {
    const { upgrade, user } = useAuth();
    const navigate = useNavigate();
    const [upgradeError, setUpgradeError] = useState('');
    const [upgradeSuccess, setUpgradeSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleUpgrade = async () => {
        setUpgradeError('');
        setUpgradeSuccess('');
        setLoading(true);
        try {
            await upgrade();
            setUpgradeSuccess('Upgrade successful! You can now save templates.');
            setTimeout(() => navigate('/'), 1500);
        } catch (error) {
            console.error(error);
            setUpgradeError('Upgrade failed to process. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (user?.is_paid) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] px-4">
                <div className="text-center">
                    <div className="w-14 h-14 bg-[#F0FDF4] rounded-xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-7 h-7 text-[#16A34A]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-semibold text-[#09090B] tracking-tight mb-2">You're already on Pro</h1>
                    <p className="text-sm text-[#71717A] mb-5">All features are unlocked for your account.</p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-4 py-2.5 bg-[#18181B] hover:bg-[#27272A] text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAFAFA] py-12 px-4">
            <div className="max-w-3xl mx-auto">

                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-2xl font-semibold text-[#09090B] tracking-tight mb-2">
                        Upgrade to Pro
                    </h1>
                    <p className="text-sm text-[#71717A]">
                        Unlock unlimited documents and save reusable templates.
                    </p>
                </div>

                {/* Toast-style feedback */}
                {upgradeError && (
                    <div className="flex items-start gap-3 px-4 py-3 bg-[#FEF2F2] border border-[#FECACA] rounded-lg mb-6 max-w-md mx-auto">
                        <svg className="w-4 h-4 text-[#EF4444] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm text-[#EF4444]">{upgradeError}</p>
                    </div>
                )}

                {upgradeSuccess && (
                    <div className="flex items-start gap-3 px-4 py-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg mb-6 max-w-md mx-auto">
                        <svg className="w-4 h-4 text-[#16A34A] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm text-[#16A34A]">{upgradeSuccess}</p>
                    </div>
                )}

                {/* Pricing cards — Pro first on mobile via order */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">

                    {/* Pro card — visually primary */}
                    <div className="order-first md:order-last bg-[#18181B] rounded-xl p-7 relative">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            <span className="px-3 py-1 bg-[#FFE033] text-[#18181B] text-xs font-semibold rounded-full">
                                Recommended
                            </span>
                        </div>
                        <h2 className="text-lg font-semibold text-white mb-1">Pro</h2>
                        <div className="flex items-baseline gap-1 mb-1">
                            <span className="text-3xl font-bold text-white">$9.99</span>
                            <span className="text-sm text-[#A1A1AA]">/month</span>
                        </div>
                        <p className="text-xs text-[#71717A] mb-6">Cancel anytime</p>
                        <ul className="space-y-3 mb-7">
                            {PRO_FEATURES.map((f) => (
                                <li key={f} className="flex items-center gap-2.5 text-sm text-[#D4D4D8]">
                                    <span className="text-[#FFE033]">{CHECK_ICON}</span>
                                    {f}
                                </li>
                            ))}
                        </ul>
                        <button
                            onClick={handleUpgrade}
                            disabled={loading}
                            className="w-full py-2.5 px-4 bg-[#FFE033] hover:bg-[#F5D800] disabled:opacity-50 text-[#18181B] text-sm font-semibold rounded-lg transition-colors"
                        >
                            {loading ? 'Processing...' : 'Upgrade Now'}
                        </button>
                    </div>

                    {/* Free card */}
                    <div className="order-last md:order-first bg-white border border-[#E4E4E7] rounded-xl p-7 card-highlight">
                        <h2 className="text-lg font-semibold text-[#09090B] mb-1">Free</h2>
                        <div className="flex items-baseline gap-1 mb-1">
                            <span className="text-3xl font-bold text-[#09090B]">$0</span>
                        </div>
                        <p className="text-xs text-[#71717A] mb-6">Forever free</p>
                        <ul className="space-y-3 mb-7">
                            {FREE_FEATURES.map((f) => (
                                <li key={f} className="flex items-center gap-2.5 text-sm text-[#71717A]">
                                    <span className="text-[#CA8A04]">{CHECK_ICON}</span>
                                    {f}
                                </li>
                            ))}
                        </ul>
                        <button
                            onClick={() => navigate('/')}
                            className="w-full py-2.5 px-4 bg-white hover:bg-[#FAFAFA] border border-[#E4E4E7] hover:border-[#CA8A04] text-[#71717A] text-sm font-medium rounded-lg transition-colors"
                        >
                            Continue with Free
                        </button>
                    </div>

                </div>

                <div className="text-center">
                    <button
                        onClick={() => navigate('/')}
                        className="text-xs text-[#71717A] hover:text-[#09090B] transition-colors"
                    >
                        No thanks, maybe later
                    </button>
                </div>

            </div>
        </div>
    );
};

export default UpgradePage;
