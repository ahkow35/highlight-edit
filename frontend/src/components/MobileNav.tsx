import { Link, useLocation } from 'react-router-dom';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  userEmail?: string;
  isPro?: boolean;
  isAdmin?: boolean;
  onLogout: () => void;
  onUploadClick: () => void;
}

export default function MobileNav({ isOpen, onClose, isLoggedIn, userEmail, isPro, isAdmin, onLogout, onUploadClick }: MobileNavProps) {
  const location = useLocation();

  if (!isOpen) return null;

  const isActive = (path: string) => location.pathname === path;

  const navLinkClass = (path: string) =>
    `flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
      isActive(path)
        ? 'bg-[#FAFAFA] text-[#09090B] border-l-2 border-[#FFE033] pl-[10px]'
        : 'text-[#71717A] hover:text-[#09090B] hover:bg-[#FAFAFA]'
    }`;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 z-50 h-full w-64 bg-white shadow-xl border-l border-[#E4E4E7] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E4E4E7]">
          <span className="text-sm font-semibold text-[#09090B] tracking-tight">Menu</span>
          <button
            onClick={onClose}
            className="text-[#71717A] hover:text-[#09090B] transition-colors p-1"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-4 py-5 space-y-1">
          <button
            onClick={() => { onUploadClick(); onClose(); }}
            className={`w-full text-left flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
              isActive('/') ? 'bg-[#FAFAFA] text-[#09090B] border-l-2 border-[#FFE033] pl-[10px]' : 'text-[#71717A] hover:text-[#09090B] hover:bg-[#FAFAFA]'
            }`}
          >
            Upload New File
          </button>
          {isLoggedIn && (
            <Link to="/templates" onClick={onClose} className={navLinkClass('/templates')}>
              My Templates
            </Link>
          )}
          {isLoggedIn && !isPro && (
            <Link to="/upgrade" onClick={onClose} className={navLinkClass('/upgrade')}>
              Upgrade to Pro
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin" onClick={onClose} className="flex items-center px-3 py-2.5 rounded-md text-sm font-medium text-purple-600 hover:bg-purple-50 transition-colors">
              Admin
            </Link>
          )}
          {isAdmin && (
            <Link to="/analytics" onClick={onClose} className="flex items-center px-3 py-2.5 rounded-md text-sm font-medium text-cyan-600 hover:bg-cyan-50 transition-colors">
              Analytics
            </Link>
          )}
        </nav>

        {/* Auth section */}
        <div className="px-4 py-5 border-t border-[#E4E4E7]">
          {isLoggedIn ? (
            <div className="space-y-3">
              {userEmail && (
                <p className="text-xs text-[#71717A] truncate px-1">{userEmail}</p>
              )}
              <button
                onClick={() => { onLogout(); onClose(); }}
                className="w-full px-3 py-2.5 text-sm font-medium text-[#71717A] hover:text-[#09090B] hover:bg-[#FAFAFA] rounded-md transition-colors text-left"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              onClick={onClose}
              className="block w-full px-4 py-2.5 bg-[#18181B] hover:bg-[#27272A] text-white text-sm font-medium rounded-md text-center transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
