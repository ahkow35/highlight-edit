import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useCallback } from 'react';
import TemplateEditor from './pages/TemplateEditor';
import AuthPage from './pages/Auth';
import UpgradePage from './pages/Upgrade';
import TemplatesList from './pages/TemplatesList';
import ForgotPasswordPage from './pages/ForgotPassword';
import ResetPasswordPage from './pages/ResetPassword';
import AdminPage from './pages/Admin';
import AnalyticsPage from './pages/Analytics';
import { useAuth } from './context/AuthContext';
import Logo from './components/Logo';
import MobileNav from './components/MobileNav';

// Admin email for conditional navbar link
const ADMIN_EMAIL = 'nyanyk@gmail.com';

interface HeaderProps {
    onLogoClick: () => void;
}

function Header({ onLogoClick }: HeaderProps) {
    const { user, logout, isAuthenticated } = useAuth();
    const location = useLocation();
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    const isAdmin = user?.email === ADMIN_EMAIL;
    const isActive = (path: string) => location.pathname === path;

    const navLinkClass = (path: string) =>
        `text-sm font-medium pb-0.5 transition-colors ${
            isActive(path)
                ? 'text-[#09090B] border-b-2 border-[#FFE033]'
                : 'text-[#71717A] hover:text-[#09090B]'
        }`;

    return (
        <header className="sticky top-0 z-30 bg-white border-b border-[#E4E4E7]">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">

                {/* Logo */}
                <button
                    onClick={onLogoClick}
                    className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity"
                >
                    <Logo size={28} />
                    <span className="text-sm font-semibold text-[#09090B] tracking-tight">
                        Highlight<span className="text-[#CA8A04]">Edit</span>
                    </span>
                </button>

                {/* Desktop nav */}
                <nav className="hidden lg:flex items-center gap-6">
                    {isAuthenticated && (
                        <Link to="/templates" className={navLinkClass('/templates')}>
                            My Templates
                        </Link>
                    )}
                    {isAdmin && (
                        <Link to="/admin" className={`text-sm font-medium pb-0.5 transition-colors text-purple-600 hover:text-purple-700 ${isActive('/admin') ? 'border-b-2 border-purple-400' : ''}`}>
                            Admin
                        </Link>
                    )}
                    {isAdmin && (
                        <Link to="/analytics" className={`text-sm font-medium pb-0.5 transition-colors text-cyan-600 hover:text-cyan-700 ${isActive('/analytics') ? 'border-b-2 border-cyan-400' : ''}`}>
                            Analytics
                        </Link>
                    )}
                </nav>

                {/* Desktop right actions */}
                <div className="hidden lg:flex items-center gap-3">
                    {isAuthenticated ? (
                        <>
                            {/* User avatar + email */}
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-[#FFE033] flex items-center justify-center flex-shrink-0">
                                    <span className="text-xs font-bold text-[#09090B]">
                                        {user?.email?.[0]?.toUpperCase() ?? 'U'}
                                    </span>
                                </div>
                                {user?.is_paid && (
                                    <span className="text-xs bg-[#F0FDF4] text-[#16A34A] px-1.5 py-0.5 rounded font-medium">PRO</span>
                                )}
                                <button
                                    onClick={() => void logout()}
                                    className="text-sm text-[#71717A] hover:text-[#09090B] transition-colors"
                                >
                                    Sign out
                                </button>
                            </div>
                            <button
                                onClick={onLogoClick}
                                className="px-3 py-2 bg-[#18181B] hover:bg-[#27272A] text-white text-sm font-medium rounded-md transition-colors"
                            >
                                Upload New File
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/auth"
                                className="text-sm font-medium text-[#71717A] hover:text-[#09090B] transition-colors"
                            >
                                Sign In
                            </Link>
                            <button
                                onClick={onLogoClick}
                                className="px-3 py-2 bg-[#18181B] hover:bg-[#27272A] text-white text-sm font-medium rounded-md transition-colors"
                            >
                                Upload New File
                            </button>
                        </>
                    )}
                </div>

                {/* Mobile: hamburger */}
                <button
                    className="lg:hidden p-2 text-[#71717A] hover:text-[#09090B] transition-colors"
                    onClick={() => setMobileNavOpen(true)}
                    aria-label="Open menu"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </div>

            <MobileNav
                isOpen={mobileNavOpen}
                onClose={() => setMobileNavOpen(false)}
                isLoggedIn={isAuthenticated}
                userEmail={user?.email}
                isPro={user?.is_paid}
                isAdmin={isAdmin}
                onLogout={() => void logout()}
                onUploadClick={onLogoClick}
            />
        </header>
    );
}

import ErrorBoundary from './components/ErrorBoundary';

function AppContent() {
    const [editorKey, setEditorKey] = useState(0);
    const navigate = useNavigate();

    const handleLogoClick = useCallback(() => {
        setEditorKey(k => k + 1);
        navigate('/');
    }, [navigate]);

    return (
        <div className="min-h-screen bg-[#FAFAFA]">
            <Header onLogoClick={handleLogoClick} />
            {/* Main Content */}
            <main className="py-8">
                <Routes>
                    <Route path="/" element={<ErrorBoundary><TemplateEditor key={editorKey} /></ErrorBoundary>} />
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/upgrade" element={<UpgradePage />} />
                    <Route path="/templates" element={<TemplatesList />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/admin" element={<AdminPage />} />
                    <Route path="/analytics" element={<AnalyticsPage />} />
                </Routes>
            </main>
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AppContent />
        </BrowserRouter>
    );
}

export default App;
