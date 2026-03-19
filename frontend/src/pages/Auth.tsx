import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

const AuthPage: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [rememberEmail, setRememberEmail] = useState(false);
    const [error, setError] = useState('');
    const { login, signup } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const savedEmail = localStorage.getItem('saved_email');
        if (savedEmail) {
            setEmail(savedEmail);
            setRememberEmail(true);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            if (isLogin) {
                if (rememberEmail) {
                    localStorage.setItem('saved_email', email);
                } else {
                    localStorage.removeItem('saved_email');
                }
                await login(email, password);
            } else {
                await signup(email, password, inviteCode);
            }
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Authentication failed');
        }
    };

    const inputClass = "w-full px-4 py-3 bg-white border border-[#E4E4E7] rounded-lg text-sm text-[#09090B] placeholder-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#FFE033]/40 focus:border-[#CA8A04] hover:border-[#CA8A04] transition-colors";

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] py-12 px-4">
            <div className="w-full max-w-md">
                {/* Card */}
                <div className="bg-white border border-[#E4E4E7] rounded-xl p-8 card-highlight">
                    {/* Logo */}
                    <div className="flex justify-center mb-6">
                        <Logo size={48} />
                    </div>

                    {/* Heading */}
                    <div className="text-center mb-6">
                        <h1 className="text-xl font-semibold text-[#09090B] tracking-tight">
                            {isLogin ? 'Sign in to HighlightEdit' : 'Create your account'}
                        </h1>
                        {!isLogin && (
                            <p className="mt-1.5 text-sm text-[#71717A]">
                                Beta access requires an invite code
                            </p>
                        )}
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="flex items-start gap-3 px-4 py-3 bg-[#FEF2F2] border border-[#FECACA] rounded-lg mb-5">
                            <svg className="w-4 h-4 text-[#EF4444] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <p className="text-sm text-[#EF4444]">{error}</p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-xs font-medium text-[#71717A] mb-1.5">
                                Email address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className={inputClass}
                                placeholder="you@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-xs font-medium text-[#71717A] mb-1.5">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete={isLogin ? 'current-password' : 'new-password'}
                                required
                                className={inputClass}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        {/* Invite code (signup only) */}
                        {!isLogin && (
                            <div>
                                <label htmlFor="invite_code" className="block text-xs font-medium text-[#71717A] mb-1.5">
                                    Invite code
                                </label>
                                <input
                                    id="invite_code"
                                    type="text"
                                    required
                                    className={inputClass}
                                    placeholder="Enter your invite code"
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value)}
                                />
                            </div>
                        )}

                        {/* Remember me + Forgot password */}
                        {isLogin && (
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        id="remember_me"
                                        name="remember_me"
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-[#E4E4E7] text-[#CA8A04] focus:ring-[#FFE033]/40"
                                        checked={rememberEmail}
                                        onChange={(e) => setRememberEmail(e.target.checked)}
                                    />
                                    <span className="text-xs text-[#71717A]">Remember my email</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => navigate('/forgot-password')}
                                    className="text-xs font-medium text-[#CA8A04] hover:text-[#A16207] transition-colors"
                                >
                                    Forgot password?
                                </button>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            className="w-full py-2.5 px-4 bg-[#18181B] hover:bg-[#27272A] text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#FFE033]/40"
                        >
                            {isLogin ? 'Sign in' : 'Create account'}
                        </button>
                    </form>
                </div>

                {/* Toggle */}
                <p className="text-center text-sm text-[#71717A] mt-4">
                    {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
                    <button
                        onClick={() => { setIsLogin(!isLogin); setError(''); }}
                        className="font-medium text-[#CA8A04] hover:text-[#A16207] transition-colors"
                    >
                        {isLogin ? 'Sign up' : 'Sign in'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default AuthPage;
