import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import Logo from '../components/Logo';

const ResetPasswordPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [token, setToken] = useState(searchParams.get('token') || '');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const urlToken = searchParams.get('token');
        if (urlToken) setToken(urlToken);
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        setLoading(true);
        try {
            await authApi.resetPassword(token, newPassword);
            setMessage('Password successfully reset! Redirecting to login...');
            setTimeout(() => navigate('/auth'), 2000);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to reset password');
            setLoading(false);
        }
    };

    const inputClass = "w-full px-4 py-3 bg-white border border-[#E4E4E7] rounded-lg text-sm text-[#09090B] placeholder-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#FFE033]/40 focus:border-[#CA8A04] hover:border-[#CA8A04] transition-colors";

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] py-12 px-4">
            <div className="w-full max-w-md">
                <div className="bg-white border border-[#E4E4E7] rounded-xl p-8 card-highlight">
                    <div className="flex justify-center mb-6">
                        <Logo size={48} />
                    </div>

                    <div className="text-center mb-6">
                        <h1 className="text-xl font-semibold text-[#09090B] tracking-tight">Set new password</h1>
                    </div>

                    {error && (
                        <div className="flex items-start gap-3 px-4 py-3 bg-[#FEF2F2] border border-[#FECACA] rounded-lg mb-5">
                            <svg className="w-4 h-4 text-[#EF4444] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <p className="text-sm text-[#EF4444]">{error}</p>
                        </div>
                    )}

                    {message && (
                        <div className="flex items-start gap-3 px-4 py-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg mb-5">
                            <svg className="w-4 h-4 text-[#16A34A] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <p className="text-sm text-[#16A34A]">{message}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!token && (
                            <div>
                                <label htmlFor="token" className="block text-xs font-medium text-[#71717A] mb-1.5">
                                    Reset token
                                </label>
                                <input
                                    id="token"
                                    type="text"
                                    required
                                    className={inputClass}
                                    placeholder="Paste reset token here"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                />
                            </div>
                        )}

                        <div>
                            <label htmlFor="new_password" className="block text-xs font-medium text-[#71717A] mb-1.5">
                                New password
                            </label>
                            <input
                                id="new_password"
                                type="password"
                                required
                                className={inputClass}
                                placeholder="••••••••"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                        </div>

                        <div>
                            <label htmlFor="confirm_password" className="block text-xs font-medium text-[#71717A] mb-1.5">
                                Confirm password
                            </label>
                            <input
                                id="confirm_password"
                                type="password"
                                required
                                className={inputClass}
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !token}
                            className="w-full py-2.5 px-4 bg-[#18181B] hover:bg-[#27272A] disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#FFE033]/40"
                        >
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                </div>

                <p className="text-center text-sm text-[#71717A] mt-4">
                    <Link to="/auth" className="font-medium text-[#CA8A04] hover:text-[#A16207] transition-colors">
                        ← Back to Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
