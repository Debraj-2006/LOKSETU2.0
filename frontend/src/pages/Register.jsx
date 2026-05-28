import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2, Shield, User } from 'lucide-react';

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

export default function Register() {
  const { signIn, fetchProfile } = useAuth();
  const navigate = useNavigate();
  const [registerType, setRegisterType] = useState('citizen'); // 'citizen' or 'admin'
  const [form, setForm] = useState({ name: '', phone: '', area: '', email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { 
      toast.error('Password must be at least 6 characters'); 
      return; 
    }
    
    let role = 'citizen';
    if (registerType === 'admin') {
      if (!form.area) {
        toast.error('Please select an assigned district first');
        return;
      }
      const baseSecret = 'loksetu-admin-2024';
      const derivedCode = `${baseSecret}-${form.area.toLowerCase().replace(/\s+/g, '')}`;
      const enteredPassword = form.password.trim();
      
      if (enteredPassword !== baseSecret && enteredPassword !== derivedCode) {
        toast.error(`Invalid admin password. You must use the official admin code for ${form.area}.`);
        return;
      }
      role = 'admin';
    }
    
    setLoading(true);

    try {
      // Direct Firebase Client Auth
      const { createUserWithEmailAndPassword } = await import('firebase/auth');
      const { doc, setDoc } = await import('firebase/firestore');
      const { auth, db } = await import('../utils/firebaseClient');

      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      
      // Update Firestore profile
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: form.name,
        phone: form.phone,
        area: form.area,
        role: role,
        created_at: new Date().toISOString()
      });

      // Force profile fetch in context
      await fetchProfile(userCredential.user.uid);

      toast.success(role === 'admin' ? 'Welcome Admin! Dashboard ready. 🎉' : 'Welcome to LokSetu! 🎉');
      navigate(role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } catch (err) {
      console.error('Registration error:', err);
      let message = err.message;
      if (err.code === 'auth/email-already-in-use') {
        message = 'This email is already registered. Please sign in instead.';
      }
      toast.error(message || 'Registration failed');
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
            Create your account
          </h1>
          <p className="text-white/40 text-sm mt-2 font-medium">Join LokSetu to raise and track civic complaints</p>
        </div>

        <div className="glass p-8 rounded-3xl border border-white/10 shadow-2xl relative">
          
          {/* Top border highlight based on registration type */}
          <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-3xl transition-all duration-500 ${registerType === 'admin' ? 'bg-gradient-to-r from-red-500 via-orange-400 to-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-gradient-to-r from-primary-500 to-amber-400 shadow-[0_0_15px_rgba(249,115,22,0.3)]'}`} />

          {/* Gorgeous Switch Tabs */}
          <div className="grid grid-cols-2 p-1 bg-white/5 border border-white/5 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => { setRegisterType('citizen'); set('adminCode', ''); }}
              className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${registerType === 'citizen' ? 'bg-primary-500 text-white shadow-md' : 'text-white/40 hover:text-white/60'}`}
            >
              <User size={13} />
              Citizen signup
            </button>
            <button
              type="button"
              onClick={() => setRegisterType('admin')}
              className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${registerType === 'admin' ? 'bg-red-500 text-white shadow-md' : 'text-white/40 hover:text-white/60'}`}
            >
              <Shield size={13} />
              Admin signup
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name field */}
            <div>
              <label className="label">Full Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                className="input"
                placeholder="Ramesh Kumar"
              />
            </div>

            {/* Phone Number field */}
            <div>
              <label className="label">Phone Number</label>
              <input
                required
                type="tel"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                className="input"
                placeholder="9876543210"
                pattern="[0-9]{10}"
              />
            </div>

            {/* Area/District selector */}
            <div>
              <label className="label">
                {registerType === 'admin' ? 'Assigned District / Area' : 'Home Area / District'}
              </label>
              <select
                required
                value={form.area}
                onChange={(e) => set('area', e.target.value)}
                className="input"
              >
                <option value="" className="bg-dark-800">Select area/district</option>
                {AREAS.map((a) => (
                  <option key={a} value={a} className="bg-dark-800">
                    {a}
                  </option>
                ))}
              </select>
            </div>

            {/* Email Address field */}
            <div>
              <label className="label">Email Address</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                className="input"
                placeholder="you@example.com"
              />
            </div>

            {/* Password field */}
            <div>
              <label className="label">
                {registerType === 'admin' ? 'Admin Password (District Code)' : 'Password'}
              </label>
              <div className="relative">
                <input
                  required
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  className="input pr-10"
                  placeholder={registerType === 'admin' ? 'Enter district admin code (e.g. loksetu-admin-2024-...)' : 'Min. 6 characters'}
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 py-3 mt-2 font-bold tracking-wide uppercase transition-all duration-300 ${registerType === 'admin' ? 'btn-danger bg-red-600 hover:bg-red-500 text-white rounded-2xl shadow-lg shadow-red-600/20' : 'btn-primary'}`}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating account…
                </>
              ) : (
                'Create Account'
              )}
            </button>

          </form>

          <p className="text-center text-white/40 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">
              Sign in
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}
