import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import CitizenDashboard from './pages/CitizenDashboard';
import RaiseComplaint from './pages/RaiseComplaint';
import ComplaintDetail from './pages/ComplaintDetail';
import AdminDashboard from './pages/AdminDashboard';
import AdminComplaintDetail from './pages/AdminComplaintDetail';
import Profile from './pages/Profile';
import Helplines from './pages/Helplines';
import GovtSchemes from './pages/GovtSchemes';
import SSORedirect from './pages/SSORedirect';
import SSOSilent from './pages/SSOSilent';

const Spinner = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#070B14] overflow-hidden font-sans">
      <style>
        {`
          @keyframes shimmer-sweep {
            0% { transform: translateX(-150%) skewX(-20deg); }
            100% { transform: translateX(200%) skewX(-20deg); }
          }
          @keyframes progress-loading {
            0% { width: 0%; opacity: 1; }
            80% { width: 100%; opacity: 1; }
            100% { width: 100%; opacity: 0.2; }
          }
          @keyframes pulse-ring {
            0% { transform: scale(0.8) rotateX(60deg); opacity: 0.8; border-color: rgba(249, 115, 22, 0.6); }
            100% { transform: scale(2.5) rotateX(60deg); opacity: 0; border-color: rgba(249, 115, 22, 0); }
          }
          @keyframes float-logo {
            0%, 100% { transform: translateY(0px) scale(1); filter: drop-shadow(0 0 20px rgba(249,115,22,0.3)); }
            50% { transform: translateY(-12px) scale(1.05); filter: drop-shadow(0 0 40px rgba(249,115,22,0.6)); }
          }
          @keyframes grid-move {
            0% { transform: translateY(0); }
            100% { transform: translateY(50px); }
          }
          @keyframes text-glitch {
            0%, 100% { text-shadow: 0 0 10px rgba(255,255,255,0.2); }
            33% { text-shadow: 2px 0 20px rgba(249,115,22,0.6), -2px 0 10px rgba(59,130,246,0.4); }
            66% { text-shadow: -2px 0 15px rgba(249,115,22,0.4), 2px 0 20px rgba(59,130,246,0.6); }
          }
          @keyframes reveal-up {
            from { opacity: 0; transform: translateY(30px) scale(0.95); filter: blur(10px); }
            to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
          }
          @keyframes scanline {
            0% { transform: translateY(-100vh); }
            100% { transform: translateY(100vh); }
          }
        `}
      </style>
      
      {/* Immersive Deep Glow Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.12)_0%,rgba(15,23,42,0)_70%)]" />
      
      {/* Animated Perspective Grid */}
      <div className="absolute inset-0 perspective-[1000px] overflow-hidden opacity-20 pointer-events-none mix-blend-screen">
        <div className="absolute bottom-0 left-[-50%] right-[-50%] h-[200vh] border-t border-primary-500/30" 
             style={{ 
               backgroundImage: 'linear-gradient(rgba(249,115,22,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.2) 1px, transparent 1px)', 
               backgroundSize: '50px 50px',
               transform: 'rotateX(75deg) translateY(0)',
               transformOrigin: 'bottom center',
               animation: 'grid-move 3s linear infinite'
             }} />
      </div>

      {/* Cyber Scanline */}
      <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'linear-gradient(to bottom, transparent 50%, rgba(255,255,255,0.05) 51%, transparent 51%)', backgroundSize: '100% 4px' }} />
      <div className="absolute inset-0 w-full h-[200px] bg-gradient-to-b from-transparent via-primary-500/10 to-transparent pointer-events-none opacity-50" style={{ animation: 'scanline 4s linear infinite' }} />

      <div className="relative flex flex-col items-center">
        {/* Core Logo with Float and 3D Outer Rings */}
        <div className="relative mb-10 flex justify-center items-center perspective-[1000px]">
          <div className="absolute inset-0 border-[2px] rounded-full" style={{ animation: 'pulse-ring 2.5s cubic-bezier(0.16, 1, 0.3, 1) infinite' }} />
          <div className="absolute inset-0 border-[1px] rounded-full" style={{ animation: 'pulse-ring 2.5s cubic-bezier(0.16, 1, 0.3, 1) infinite 1.25s' }} />
          
          <div className="relative flex items-center justify-center w-32 h-32 bg-gradient-to-br from-slate-800/80 to-slate-900/90 border border-white/20 rounded-[2rem] shadow-[0_0_60px_rgba(249,115,22,0.25)] backdrop-blur-2xl overflow-hidden group" style={{ animation: 'float-logo 4s ease-in-out infinite' }}>
            {/* Supercharged Shimmer sweep */}
            <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" style={{ animation: 'shimmer-sweep 2.5s infinite ease-in-out' }} />
            <span className="text-6xl filter drop-shadow-2xl translate-z-10 relative z-10">🏛️</span>
            {/* Inner glow */}
            <div className="absolute inset-0 bg-primary-500/20 blur-xl rounded-full scale-50" />
          </div>
        </div>

        {/* Brand Header */}
        <div style={{ animation: 'reveal-up 1s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both' }} className="text-center">
          <h1 className="text-5xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40 tracking-tighter drop-shadow-2xl mb-1" style={{ fontFamily: "'Outfit', sans-serif", animation: 'text-glitch 4s infinite' }}>
            LOK<span className="text-primary-400">SETU</span>
          </h1>
          {/* Subtitle */}
          <div className="flex items-center gap-4 justify-center mb-12 opacity-60">
            <div className="w-8 h-px bg-gradient-to-r from-transparent to-white/50" />
            <p className="text-white text-[10px] font-bold tracking-[0.3em] uppercase">
              System Initialization
            </p>
            <div className="w-8 h-px bg-gradient-to-l from-transparent to-white/50" />
          </div>
        </div>

        {/* High-tech Loading Progress */}
        <div className="flex flex-col items-center gap-4 w-full max-w-sm" style={{ animation: 'reveal-up 1s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both' }}>
          
          {/* Text Spinner */}
          <div className="flex justify-between w-full text-[10px] font-bold tracking-widest uppercase text-white/50 mb-1">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
              Connecting...
            </span>
            <span className="font-mono text-primary-400 animate-pulse">v2.0.4</span>
          </div>

          {/* Glowing Progress Track */}
          <div className="relative w-full h-1.5 bg-white/5 rounded-full overflow-hidden shadow-inner border border-white/5 backdrop-blur-md">
            <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary-600 via-amber-400 to-white rounded-full shadow-[0_0_15px_rgba(249,115,22,1)]" style={{ animation: 'progress-loading 2.5s cubic-bezier(0.65, 0, 0.35, 1) infinite' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children, adminOnly = false, citizenOnly = false }) => {
  const { user, profile } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && profile?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  if (citizenOnly && profile?.role !== 'citizen') return <Navigate to="/admin" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, profile } = useAuth();
  if (user && profile) return <Navigate to={profile.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  return children;
};

function AppRoutes() {
  const { loading } = useAuth();

  if (loading) {
    return <Spinner />;
  }

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/sso-redirect" element={<SSORedirect />} />
        <Route path="/sso-silent" element={<SSOSilent />} />
        <Route path="/dashboard"       element={<ProtectedRoute citizenOnly><CitizenDashboard /></ProtectedRoute>} />
        <Route path="/complaint/new"   element={<ProtectedRoute citizenOnly><RaiseComplaint /></ProtectedRoute>} />
        <Route path="/complaint/:id"   element={<ProtectedRoute><ComplaintDetail /></ProtectedRoute>} />
        <Route path="/admin"           element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/complaint/:id" element={<ProtectedRoute adminOnly><AdminComplaintDetail /></ProtectedRoute>} />
        <Route path="/profile"         element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/helplines"       element={<ProtectedRoute><Helplines /></ProtectedRoute>} />
        <Route path="/schemes"         element={<ProtectedRoute><GovtSchemes /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1E293B',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
