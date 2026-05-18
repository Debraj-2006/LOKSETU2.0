import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../utils/firebaseClient';
import toast from 'react-hot-toast';
import { User, Phone, MapPin, Mail, Shield, Calendar, Edit2, Check, X, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

export default function Profile() {
  const { user, profile, fetchProfile } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: profile?.name || '',
    phone: profile?.phone || '',
    area: profile?.area || '',
  });

  if (!user || !profile) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name cannot be empty');

    // Normalize phone number (strip spaces/hyphens)
    const cleanPhone = form.phone.replace(/[\s-]/g, '');

    // Allow standard Indian 10-digit numbers, with optional +91, 91, or 0 prefix
    if (!/^(?:\+91|91|0)?[6-9]\d{9}$/.test(cleanPhone)) {
      return toast.error('Please enter a valid 10-digit phone number (e.g. 9876543210)');
    }

    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        name: form.name.trim(),
        phone: cleanPhone,
        area: form.area,
      });

      await fetchProfile(user.uid);
      setIsEditing(false);
      toast.success('Profile updated successfully! ✨');
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error('Failed to update profile details.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setForm({
      name: profile.name,
      phone: profile.phone,
      area: profile.area,
    });
    setIsEditing(false);
  };

  const formattedDate = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Unknown';

  return (
    <div className="min-h-[calc(100vh-64px)] relative py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      
      {/* Background glow meshes */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-2xl mx-auto relative z-10">
        
        {/* Back navigation button */}
        <button
          onClick={() => navigate(profile.role === 'admin' ? '/admin' : '/dashboard')}
          className="flex items-center gap-2 text-sm text-white/50 hover:text-white mb-6 group transition-colors"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span>Back to Dashboard</span>
        </button>

        {/* Profile Card */}
        <div className="glass p-8 sm:p-10 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
          
          {/* Neon line decoration on top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-amber-400 to-primary-500" />
          
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-8 border-b border-white/10 mb-8">
            
            {/* Supercharged Glow Avatar */}
            <div className="relative">
              <div className="absolute inset-0 bg-primary-500/20 rounded-full blur-md" />
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary-600 to-amber-500 border border-white/20 flex items-center justify-center text-4xl font-extrabold text-white shadow-2xl relative z-10">
                {profile.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-dark-900 border border-white/10 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-primary-400 tracking-wider uppercase z-20 shadow-md">
                {profile.role}
              </div>
            </div>

            <div className="text-center sm:text-left flex-1">
              <h2 className="text-2xl sm:text-3xl font-black text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {profile.name}
              </h2>
              <p className="text-white/40 text-sm mt-1 font-semibold flex items-center justify-center sm:justify-start gap-1.5">
                <Shield size={14} className="text-primary-400/80" />
                <span>Authorized LokSetu Portal {profile.role === 'admin' ? 'Administrator' : 'Citizen'}</span>
              </p>
            </div>

            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="btn-secondary flex items-center gap-1.5 text-xs py-2 px-4 rounded-xl border border-white/10 hover:border-white/20 transition-all shrink-0"
              >
                <Edit2 size={13} />
                Edit Profile
              </button>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Full Name */}
              <div>
                <label className="label flex items-center gap-2">
                  <User size={14} className="text-white/40" />
                  <span>Full Name</span>
                </label>
                {isEditing ? (
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input w-full"
                    placeholder="Enter your name"
                  />
                ) : (
                  <div className="text-white bg-white/[0.02] border border-white/5 px-4 py-3 rounded-2xl font-medium">
                    {profile.name}
                  </div>
                )}
              </div>

              {/* Contact Phone */}
              <div>
                <label className="label flex items-center gap-2">
                  <Phone size={14} className="text-white/40" />
                  <span>Phone Number</span>
                </label>
                {isEditing ? (
                  <input
                    required
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="input w-full"
                    placeholder="Enter 10-digit mobile number"
                  />
                ) : (
                  <div className="text-white bg-white/[0.02] border border-white/5 px-4 py-3 rounded-2xl font-medium">
                    {profile.phone || 'Not Provided'}
                  </div>
                )}
              </div>

              {/* Area / Ward Locality */}
              <div>
                <label className="label flex items-center gap-2">
                  <MapPin size={14} className="text-white/40" />
                  <span>Locality Area</span>
                </label>
                {isEditing ? (
                  <select
                    required
                    value={form.area}
                    onChange={(e) => setForm({ ...form, area: e.target.value })}
                    className="input w-full"
                  >
                    {AREAS.map((a) => (
                      <option key={a} value={a} className="bg-dark-800">
                        {a}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-white bg-white/[0.02] border border-white/5 px-4 py-3 rounded-2xl font-medium">
                    📍 {profile.area || 'Other'}
                  </div>
                )}
              </div>

              {/* Email / Gmail Address */}
              <div>
                <label className="label flex items-center gap-2">
                  <Mail size={14} className="text-white/40" />
                  <span>Gmail / Email Address</span>
                </label>
                <div className="text-white/60 bg-white/[0.01] border border-white/5 px-4 py-3 rounded-2xl font-medium select-all cursor-text flex items-center gap-2">
                  <span>{user.email}</span>
                  <span className="text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded uppercase ml-auto">
                    Verified
                  </span>
                </div>
              </div>

              {/* Role Tier */}
              <div>
                <label className="label flex items-center gap-2">
                  <Shield size={14} className="text-white/40" />
                  <span>System Authority</span>
                </label>
                <div className="text-white bg-white/[0.02] border border-white/5 px-4 py-3 rounded-2xl font-medium capitalize">
                  🔐 {profile.role} account
                </div>
              </div>

              {/* Account Created Date */}
              <div>
                <label className="label flex items-center gap-2">
                  <Calendar size={14} className="text-white/40" />
                  <span>Member Since</span>
                </label>
                <div className="text-white bg-white/[0.02] border border-white/5 px-4 py-3 rounded-2xl font-medium">
                  {formattedDate}
                </div>
              </div>

            </div>

            {/* Editing Action Buttons */}
            {isEditing && (
              <div className="flex items-center gap-3 pt-6 border-t border-white/10">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 py-3"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving changes...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Save Details
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="btn-secondary flex-1 flex items-center justify-center gap-2 py-3 border border-white/10 hover:bg-white/5"
                >
                  <X size={16} />
                  Cancel
                </button>
              </div>
            )}

          </form>
        </div>

      </div>
    </div>
  );
}
