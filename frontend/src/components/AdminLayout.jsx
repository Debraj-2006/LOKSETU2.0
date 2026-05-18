import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from './NotificationBell';
import { LogOut, ShieldCheck, LayoutDashboard, Menu, X, Radio } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function AdminLayout({ children }) {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    navigate('/');
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="min-h-screen" style={{
      background: '#0B0F19',
      backgroundImage: `
        radial-gradient(circle at 10% 20%, rgba(220, 38, 38, 0.07), transparent 450px),
        radial-gradient(circle at 90% 80%, rgba(239, 68, 68, 0.05), transparent 500px),
        radial-gradient(circle at 50% 50%, rgba(185, 28, 28, 0.03), transparent 600px)
      `,
      backgroundAttachment: 'fixed',
    }}>
      {/* Admin Navbar — same structure as citizen Navbar but red-accented */}
      <nav className="sticky top-0 z-50 bg-dark-900/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link to="/admin" className="flex items-center gap-2 group">
              <span className="text-2xl">🏛️</span>
              <div>
                <span className="text-lg font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>LokSetu</span>
                <span className="block text-xs text-white/40 -mt-1">लोक सेतु</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden sm:flex items-center gap-2">
              {/* Admin mode badge */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold uppercase tracking-wider mr-1"
                style={{ background: 'rgba(220,38,38,0.08)', borderColor: 'rgba(220,38,38,0.2)', color: '#f87171' }}>
                <Radio size={10} className="animate-pulse" />
                Admin Panel
              </div>

              <Link to="/admin"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/admin')
                    ? 'bg-red-500/20 text-red-400'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}>
                <LayoutDashboard size={15} /> Dashboard
              </Link>

              <Link to="/schemes"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/schemes')
                    ? 'bg-red-500/20 text-red-400'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}>
                🏛️ Schemes
              </Link>

              <Link to="/helplines"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/helplines')
                    ? 'bg-red-500/20 text-red-400'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}>
                📞 Helplines
              </Link>

              {user && (
                <>
                  <NotificationBell />
                  <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                    <Link to="/profile"
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-red-400 transition-all hover:scale-105 duration-300"
                      style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)' }}
                      title="My Profile">
                      {profile?.name?.[0]?.toUpperCase() || 'A'}
                    </Link>
                    <button onClick={handleSignOut}
                      className="text-white/50 hover:text-red-400 transition-colors p-1"
                      title="Sign out">
                      <LogOut size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button className="sm:hidden p-2 text-white/60 hover:text-white" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Mobile menu */}
          {menuOpen && (
            <div className="sm:hidden pb-4 space-y-2">
              <Link to="/admin" className={`block px-3 py-2 rounded-lg font-medium transition-colors ${isActive('/admin') ? 'bg-red-500/20 text-red-400' : 'text-white/70 hover:bg-white/10'}`} onClick={() => setMenuOpen(false)}>
                🏛️ Dashboard
              </Link>
              <Link to="/schemes" className={`block px-3 py-2 rounded-lg font-medium transition-colors ${isActive('/schemes') ? 'bg-red-500/20 text-red-400' : 'text-white/70 hover:bg-white/10'}`} onClick={() => setMenuOpen(false)}>
                🏛️ Govt Schemes
              </Link>
              <Link to="/helplines" className={`block px-3 py-2 rounded-lg font-medium transition-colors ${isActive('/helplines') ? 'bg-red-500/20 text-red-400' : 'text-white/70 hover:bg-white/10'}`} onClick={() => setMenuOpen(false)}>
                📞 Helplines
              </Link>
              <Link to="/profile" className="block px-3 py-2 rounded-lg text-white/70 hover:bg-white/10" onClick={() => setMenuOpen(false)}>
                👤 My Profile
              </Link>
              {user && (
                <button onClick={handleSignOut} className="block w-full text-left px-3 py-2 rounded-lg text-red-400 hover:bg-white/10">
                  Sign Out
                </button>
              )}
            </div>
          )}
        </div>

        {/* Admin identity strip — thin red accent bar below navbar */}
        <div className="flex items-center gap-2 px-4 sm:px-8 py-1.5 border-t"
          style={{ background: 'rgba(220,38,38,0.04)', borderColor: 'rgba(220,38,38,0.1)' }}>
          <ShieldCheck size={11} style={{ color: 'rgba(248,113,113,0.5)' }} />
          <p className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: 'rgba(252,165,165,0.35)' }}>
            Authorized Admin · <span style={{ color: 'rgba(252,165,165,0.55)' }}>{profile?.area || 'District'}</span> · Real-time civic monitoring
          </p>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[9px] text-green-400/50 font-bold uppercase tracking-wider">Live</span>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main>
        {children}
      </main>
    </div>
  );
}
