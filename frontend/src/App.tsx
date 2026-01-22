import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import TemplateEditor from './pages/TemplateEditor';
import AuthPage from './pages/Auth';
import UpgradePage from './pages/Upgrade';
import TemplatesList from './pages/TemplatesList';
import ForgotPasswordPage from './pages/ForgotPassword';
import ResetPasswordPage from './pages/ResetPassword';
import AdminPage from './pages/Admin';
import { useAuth } from './context/AuthContext';

// Admin email for conditional navbar link
const ADMIN_EMAIL = 'nyanyk@gmail.com';

function Header() {
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    return (
        <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
            <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm font-bold">H</span>
                    </div>
                    <span className="text-lg font-semibold text-white tracking-tight">
                        Highlight<span className="text-blue-400">Edit</span>
                    </span>
                </Link>

                {/* Secondary Actions */}
                <div className="flex items-center gap-4">
                    {isAuthenticated ? (
                        <>
                            {user?.email === ADMIN_EMAIL && (
                                <Link to="/admin" className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors mr-2">
                                    Admin
                                </Link>
                            )}
                            <Link to="/templates" className="text-sm font-medium text-slate-300 hover:text-white transition-colors mr-2">
                                My Templates
                            </Link>
                            <span className="text-sm text-slate-400">
                                {user?.email} {user?.is_paid && <span className="text-xs bg-green-900 text-green-300 px-1.5 py-0.5 rounded ml-1">PRO</span>}
                            </span>
                            <button
                                onClick={logout}
                                className="text-sm text-slate-400 hover:text-white transition-colors"
                            >
                                Sign Out
                            </button>
                        </>
                    ) : (
                        <Link
                            to="/auth"
                            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
                        >
                            Sign In
                        </Link>
                    )}

                    <button
                        onClick={() => navigate('/')}
                        className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
                    >
                        Upload New File
                    </button>
                </div>
            </div>
        </header>
    );
}

import ErrorBoundary from './components/ErrorBoundary';

function App() {
    return (
        <BrowserRouter>
            <div className="min-h-screen bg-slate-950">
                <Header />
                {/* Main Content */}
                <main className="py-8">
                    <Routes>
                        <Route path="/" element={<ErrorBoundary><TemplateEditor /></ErrorBoundary>} />
                        <Route path="/auth" element={<AuthPage />} />
                        <Route path="/upgrade" element={<UpgradePage />} />
                        <Route path="/templates" element={<TemplatesList />} />
                        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                        <Route path="/reset-password" element={<ResetPasswordPage />} />
                        <Route path="/admin" element={<AdminPage />} />
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    );
}

export default App;
