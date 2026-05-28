import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from './NotificationBell';
import { LogOut, LayoutDashboard, PlusCircle, ShieldCheck, Menu, X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  if (location.pathname === '/') return null;
  if (location.pathname.startsWith('/admin')) return null; // admin uses its own AdminLayout nav

  return (
    <nav className="sticky top-0 z-50 bg-dark-900/80 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={user ? (profile?.role === 'admin' ? '/admin' : '/dashboard') : '/'} className="flex items-center gap-2 group">
            <span className="text-2xl">🏛️</span>
            <div>
              <span className="text-lg font-bold text-white">LokSetu</span>
              <span className="block text-xs text-white/40 -mt-1">लोक सेतु</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-2">
            {user && profile?.role === 'citizen' && (
              <>
                <Link to="/dashboard" className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/dashboard') ? 'bg-primary-500/20 text-primary-400' : 'text-white/60 hover:text-white hover:bg-white/10'}`}>
                  <LayoutDashboard size={15} /> My Complaints
                </Link>
                <Link to="/complaint/new" className="btn-primary flex items-center gap-1.5 text-sm py-2">
                  <PlusCircle size={15} /> Raise Complaint
                </Link>
              </>
            )}
            {user && profile?.role === 'admin' && (
              <Link to="/admin" className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/admin') ? 'bg-primary-500/20 text-primary-400' : 'text-white/60 hover:text-white hover:bg-white/10'}`}>
                <ShieldCheck size={15} /> Admin Panel
              </Link>
            )}
            {user && (
              <>
                <Link to="/helplines" className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/helplines') ? 'bg-primary-500/20 text-primary-400' : 'text-white/60 hover:text-white hover:bg-white/10'}`}>
                  📞 Helplines
                </Link>
                <Link to="/schemes" className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/schemes') ? 'bg-primary-500/20 text-primary-400' : 'text-white/60 hover:text-white hover:bg-white/10'}`}>
                  🏛️ Schemes
                </Link>

                <NotificationBell />
                <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                  <Link to="/profile" className="w-8 h-8 rounded-full bg-primary-500/20 hover:bg-primary-500/30 border border-primary-500/30 hover:border-primary-500/50 flex items-center justify-center text-sm font-bold text-primary-400 transition-all hover:scale-105 duration-300 shadow-md shadow-primary-500/5" title="My Profile">
                    {profile?.name?.[0]?.toUpperCase() || 'U'}
                  </Link>
                  <button onClick={handleSignOut} className="text-white/50 hover:text-red-400 transition-colors p-1" title="Sign out">
                    <LogOut size={16} />
                  </button>
                </div>
              </>
            )}
            {!user && (
              <div className="flex gap-2">
                <Link to="/login" className="btn-secondary text-sm py-2">Login</Link>
                <Link to="/register" className="btn-primary text-sm py-2">Register</Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="sm:hidden p-2 text-white/60 hover:text-white" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="sm:hidden pb-4 space-y-2 animate-fade-in">
            {user && (
              <>
                <Link to="/profile" className={`block px-3 py-2 rounded-lg font-medium transition-colors ${isActive('/profile') ? 'bg-primary-500/20 text-primary-400' : 'text-white/70 hover:bg-white/10'}`} onClick={() => setMenuOpen(false)}>👤 My Profile</Link>
                <Link to="/schemes" className={`block px-3 py-2 rounded-lg font-medium transition-colors ${isActive('/schemes') ? 'bg-primary-500/20 text-primary-400' : 'text-white/70 hover:bg-white/10'}`} onClick={() => setMenuOpen(false)}>🏛️ Govt Schemes</Link>
                <Link to="/helplines" className={`block px-3 py-2 rounded-lg font-medium transition-colors ${isActive('/helplines') ? 'bg-primary-500/20 text-primary-400' : 'text-white/70 hover:bg-white/10'}`} onClick={() => setMenuOpen(false)}>📞 Helpline Numbers</Link>
              </>
            )}
            {user && profile?.role === 'citizen' && (
              <>
                <Link to="/dashboard" className="block px-3 py-2 rounded-lg text-white/70 hover:bg-white/10" onClick={() => setMenuOpen(false)}>My Complaints</Link>
                <Link to="/complaint/new" className="block px-3 py-2 rounded-lg text-primary-400 hover:bg-white/10" onClick={() => setMenuOpen(false)}>Raise Complaint</Link>
              </>
            )}
            {user && profile?.role === 'admin' && (
              <Link to="/admin" className="block px-3 py-2 rounded-lg text-white/70 hover:bg-white/10" onClick={() => setMenuOpen(false)}>Admin Panel</Link>
            )}
            {user && <button onClick={handleSignOut} className="block w-full text-left px-3 py-2 rounded-lg text-red-400 hover:bg-white/10">Sign Out</button>}
            {!user && (
              <>
                <Link to="/login" className="block px-3 py-2 rounded-lg text-white/70 hover:bg-white/10" onClick={() => setMenuOpen(false)}>Login</Link>
                <Link to="/register" className="block px-3 py-2 rounded-lg text-primary-400 hover:bg-white/10" onClick={() => setMenuOpen(false)}>Register</Link>
              </>
            )}
          </div>
        )}
      </div>

    </nav>
  );
}
