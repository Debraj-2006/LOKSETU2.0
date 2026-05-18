import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from './NotificationBell';
import { LogOut, LayoutDashboard, PlusCircle, ShieldCheck, Menu, X, Share2, Copy, Check, Mail } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    navigate('/');
  };

  const handleCopyLink = () => {
    const shareUrl = window.location.origin;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Website link copied to clipboard! 🔗');
    setTimeout(() => setCopied(false), 2000);
  };

  const isActive = (path) => location.pathname === path;

  const shareUrl = window.location.origin;
  const shareText = `Hey! Check out LokSetu - our digital hub for civic grievances, state welfare schemes, and electricity bill analytics! Try it here: ${shareUrl}`;

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
                <button
                  onClick={() => setShareOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  title="Share Website"
                >
                  <Share2 size={15} /> Share
                </button>
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
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setShareOpen(true);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-lg font-medium text-white/70 hover:bg-white/10 transition-colors"
                >
                  🔗 Share Website
                </button>
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

      {/* Global Share Modal Overlay */}
      {shareOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          {/* Main Modal Box */}
          <div className="relative w-full max-w-md bg-dark-950/95 border border-white/10 rounded-[2.5rem] p-6 sm:p-8 shadow-[0_20px_50px_rgba(249,115,22,0.15)] space-y-6 overflow-hidden">
            {/* Background Halo Glow */}
            <div className="absolute top-[-10%] right-[-10%] w-40 h-40 bg-primary-500/10 rounded-full blur-[80px] pointer-events-none" />
            
            {/* Close Button */}
            <button
              onClick={() => setShareOpen(false)}
              className="absolute top-4 right-4 p-2 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all duration-200"
            >
              <X size={16} />
            </button>

            {/* Modal Title */}
            <div className="text-center space-y-2 mt-2">
              <div className="w-14 h-14 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-3xl mx-auto shadow-md">
                🔗
              </div>
              <h3 className="text-2xl font-black text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Share LokSetu 2.0
              </h3>
              <p className="text-white/50 text-xs px-2 leading-relaxed">
                Empower your neighborhood! Invite friends and family to log complaints, view local welfare schemes, and analyze electricity bills.
              </p>
            </div>

            {/* Copy Link Container */}
            <div className="space-y-2">
              <label className="text-white/40 text-[10px] font-black uppercase tracking-wider pl-1">Shareable Link</label>
              <div className="flex bg-slate-900/60 border border-white/5 rounded-2xl p-1.5 items-center">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-transparent text-xs text-white/70 font-semibold px-3 py-2 outline-none select-all"
                />
                <button
                  onClick={handleCopyLink}
                  className={`flex items-center gap-1.5 py-2 px-4 rounded-xl text-xs font-extrabold transition-all duration-300 ${
                    copied
                      ? 'bg-green-500/20 border border-green-500/40 text-green-400'
                      : 'bg-primary-500 text-white hover:bg-primary-600 shadow-md shadow-primary-500/20 active:scale-95'
                  }`}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Social Share Grid */}
            <div className="grid grid-cols-3 gap-3">
              {/* WhatsApp */}
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center py-3 px-2 rounded-2xl border border-white/5 hover:border-green-500/30 bg-white/[0.01] hover:bg-green-500/[0.04] transition-all group"
              >
                <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">💬</span>
                <span className="text-[10px] font-bold text-white/50 group-hover:text-white transition-colors">WhatsApp</span>
              </a>

              {/* Twitter / X */}
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center py-3 px-2 rounded-2xl border border-white/5 hover:border-blue-400/30 bg-white/[0.01] hover:bg-blue-400/[0.04] transition-all group"
              >
                <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">🐦</span>
                <span className="text-[10px] font-bold text-white/50 group-hover:text-white transition-colors">Twitter / X</span>
              </a>

              {/* Email */}
              <a
                href={`mailto:?subject=${encodeURIComponent('Empower our community with LokSetu')}&body=${encodeURIComponent(shareText)}`}
                className="flex flex-col items-center justify-center py-3 px-2 rounded-2xl border border-white/5 hover:border-primary-500/30 bg-white/[0.01] hover:bg-primary-500/[0.04] transition-all group"
              >
                <Mail size={20} className="text-white/60 mb-1.5 group-hover:scale-110 transition-transform group-hover:text-primary-400" />
                <span className="text-[10px] font-bold text-white/50 group-hover:text-white transition-colors">Email</span>
              </a>
            </div>

            {/* QR Code Container Mockup */}
            <div className="p-4 bg-slate-900/40 border border-white/5 rounded-3xl flex flex-col items-center text-center space-y-3">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Scan QR to Access on Mobile</p>
              
              {/* Premium CSS Mock QR Code */}
              <div className="w-32 h-32 bg-white rounded-2xl p-2.5 flex items-center justify-center shadow-inner relative group-hover:scale-105 transition-all">
                <div className="w-full h-full relative grid grid-cols-5 grid-rows-5 gap-1.5 p-1 bg-white">
                  {/* Outer corner squares */}
                  <div className="border-[3px] border-dark-950 rounded bg-transparent col-start-1 row-start-1" />
                  <div className="border-[3px] border-dark-950 rounded bg-transparent col-start-5 row-start-1" />
                  <div className="border-[3px] border-dark-950 rounded bg-transparent col-start-1 row-start-5" />
                  
                  {/* Decorative QR code matrix patterns */}
                  <div className="bg-dark-950 rounded-sm col-start-2 row-start-2" />
                  <div className="bg-dark-950 rounded-sm col-start-4 row-start-2" />
                  <div className="bg-dark-950 rounded-sm col-start-3 row-start-3" />
                  <div className="bg-dark-950 rounded-sm col-start-2 row-start-4" />
                  <div className="bg-dark-950 rounded-sm col-start-4 row-start-4" />
                  <div className="bg-dark-950 rounded-sm col-start-3 row-start-1" />
                  <div className="bg-dark-950 rounded-sm col-start-3 row-start-5" />
                  
                  {/* Inner neon glow center spot */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 rounded bg-primary-500 flex items-center justify-center shadow-md shadow-primary-500/30 text-[10px]">
                      🏛️
                    </div>
                  </div>
                </div>
              </div>
              <span className="text-[9px] text-white/30 font-medium">Auto-generated for your local instance</span>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
