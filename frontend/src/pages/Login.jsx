import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2, Shield, User } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../utils/firebaseClient';

const AREAS = [
  'Alipurduar',
  'Bankura',
  'Birbhum',
  'Cooch Behar',
  'Dakshin Dinajpur',
  'Darjeeling',
  'Hooghly',
  'Howrah',
  'Jalpaiguri',
  'Jhargram',
  'Kalimpong',
  'Kolkata',
  'Malda',
  'Murshidabad',
  'Nadia',
  'North 24 Parganas',
  'Paschim Bardhaman',
  'Paschim Medinipur',
  'Purba Bardhaman',
  'Purba Medinipur',
  'Purulia',
  'South 24 Parganas',
  'Uttar Dinajpur'
];

export default function Login() {
  const { signIn, fetchProfile } = useAuth();
  const navigate = useNavigate();
  const [loginType, setLoginType] = useState('citizen'); // 'citizen' or 'admin'
  const [form, setForm] = useState({ email: '', password: '', district: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loginType === 'admin' && !form.district) {
      toast.error('Please select your assigned district');
      return;
    }
    setLoading(true);
    try {
      const userCredential = await signIn(form.email, form.password);
      
      // Retrieve profile directly to navigate immediately without race conditions
      const docRef = doc(db, 'users', userCredential.user.uid);
      const docSnap = await getDoc(docRef);
      let role = 'citizen';
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        role = data.role;
        
        // Validation check: If citizen attempts to log in via Admin tab
        if (loginType === 'admin' && role !== 'admin') {
          toast.error('Access Denied: You do not have administrator permissions.');
          setLoading(false);
          return;
        }

        // If admin logged in and selected a specific district, set/update it in Firestore!
        if (role === 'admin' && loginType === 'admin' && form.district) {
          await updateDoc(docRef, { area: form.district });
          await fetchProfile(userCredential.user.uid);
        }
      } else if (loginType === 'admin') {
        // Fallback or self-provisioning check
        toast.error('Admin profile not found. Access denied.');
        setLoading(false);
        return;
      }

      toast.success(role === 'admin' ? `Admin session started for ${form.district || 'District'}! 🏛️` : 'Welcome back!');
      const ssoReturnUrl = sessionStorage.getItem('sso_return_url');
      if (ssoReturnUrl) {
        sessionStorage.removeItem('sso_return_url');
        navigate('/sso-redirect?return_url=' + encodeURIComponent(ssoReturnUrl), { replace: true });
      } else {
        navigate(role === 'admin' ? '/admin' : '/dashboard', { replace: true });
      }
    } catch (error) {
      let message = error.message;
      if (error.code === 'auth/invalid-credential') {
        message = 'Invalid email or password';
      } else if (error.code === 'auth/user-not-found') {
        message = 'User not found';
      }
      toast.error(message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      
      {/* Background ambient glow bubbles */}
      <div className="absolute top-[-10%] right-[-5%] w-[450px] h-[450px] bg-primary-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-[10%] left-[-5%] w-[450px] h-[450px] bg-red-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="w-full max-w-md animate-slide-up relative z-10">
        
        {/* Logo and Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-500/20 to-primary-600/5 border border-primary-500/20 mb-6 shadow-[0_0_40px_rgba(249,115,22,0.15)]">
            <span className="text-4xl filter drop-shadow-md">🏛️</span>
          </div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 tracking-tight drop-shadow-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Welcome to LokSetu
          </h1>
          <p className="text-white/40 text-sm mt-2 font-medium">Civic Grievance Redressal Portal</p>
        </div>

        <div className="glass p-8 rounded-3xl border border-white/10 shadow-2xl relative">
          
          {/* Top border highlight based on login type */}
          <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-3xl transition-all duration-500 ${loginType === 'admin' ? 'bg-gradient-to-r from-red-500 via-orange-400 to-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-gradient-to-r from-primary-500 to-amber-400 shadow-[0_0_15px_rgba(249,115,22,0.3)]'}`} />

          {/* Gorgeous Switch Tabs */}
          <div className="grid grid-cols-2 p-1 bg-white/5 border border-white/5 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => { setLoginType('citizen'); setForm({ ...form, district: '' }); }}
              className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${loginType === 'citizen' ? 'bg-primary-500 text-white shadow-md' : 'text-white/40 hover:text-white/60'}`}
            >
              <User size={13} />
              Citizen Login
            </button>
            <button
              type="button"
              onClick={() => setLoginType('admin')}
              className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${loginType === 'admin' ? 'bg-red-500 text-white shadow-md' : 'text-white/40 hover:text-white/60'}`}
            >
              <Shield size={13} />
              Admin Login
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email field */}
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input"
                placeholder="you@example.com"
              />
            </div>

            {/* Password field */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Admin District Selection Dropdown */}
            {loginType === 'admin' && (
              <div className="animate-slide-up">
                <label className="label text-red-400 font-bold">Assigned District / Area</label>
                <select
                  required
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                  className="input border-red-500/20 focus:border-red-500 focus:ring-red-500/20"
                >
                  <option value="" className="bg-dark-800">Select your district</option>
                  {AREAS.map((d) => (
                    <option key={d} value={d} className="bg-dark-800">
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 py-3 mt-2 font-bold tracking-wide uppercase transition-all duration-300 ${loginType === 'admin' ? 'btn-danger bg-red-600 hover:bg-red-500 text-white rounded-2xl shadow-lg shadow-red-600/20' : 'btn-primary'}`}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </button>

          </form>

          <p className="text-center text-white/40 text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium">
              Register here
            </Link>
          </p>

          {/* District Admin Indicator */}
          {loginType === 'admin' && (
            <div className="mt-6 p-3 rounded-xl bg-red-500/5 border border-red-500/10 text-xs text-red-400/70 text-center font-semibold">
              🔒 Admin overriding uses your registered district credentials.
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
