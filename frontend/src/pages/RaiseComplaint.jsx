import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../utils/firebaseClient';
import PhotoUpload from '../components/PhotoUpload';
import LocationPicker from '../components/LocationPicker';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, Send, Loader2 } from 'lucide-react';

const CATEGORIES = [
  { id: 'electricity',   icon: '⚡', label: 'Electricity',   desc: 'Power outages, faulty wiring, streetlights' },
  { id: 'road',          icon: '🛣️', label: 'Road',          desc: 'Potholes, broken roads, drainage issues' },
  { id: 'water',         icon: '💧', label: 'Water',         desc: 'Supply shortage, contamination, pipe leaks' },
  { id: 'sanitation',    icon: '🚽', label: 'Sanitation',    desc: 'Garbage, blocked drains, public toilets' },
  { id: 'health_safety', icon: '🏥', label: 'Health & Safety', desc: 'Primary health centers, clinics, local safety' },
  { id: 'other',         icon: '📝', label: 'Custom / Other',  desc: 'Any issue you face — we can solve it all!' },
];

const STEPS = ['Category', 'Description', 'Photo', 'Location'];

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

export default function RaiseComplaint() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ category: '', description: '', photo: null, location: null, area: profile?.area || '' });
  const [loading, setLoading] = useState(false);

  const canNext = [
    form.category,
    form.description.trim().length >= 20,
    true, // photo optional
    true, // location optional
  ];

  const compressImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 600;
          const MAX_HEIGHT = 600;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7); // Compress to 70% quality JPEG
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let photoUrl = null;
      if (form.photo) {
        photoUrl = await compressImageToBase64(form.photo);
      }

      const complaintData = {
        citizen_id: profile.id,
        citizen_name: profile.name || 'Citizen',
        citizen_phone: profile.phone || '',
        category: form.category,
        description: form.description,
        area: form.area || profile?.area,
        status: 'pending',
        upvote_count: 0,
        is_escalated: false,
        is_petition: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (photoUrl) {
        complaintData.photo_url = photoUrl;
      }

      if (form.location) {
        complaintData.latitude = form.location.lat;
        complaintData.longitude = form.location.lng;
        complaintData.location_name = form.location.address;
      }

      const complaintsCol = collection(db, 'complaints');
      const docRef = await addDoc(complaintsCol, complaintData);
      
      toast.success('Complaint submitted successfully! 🎉');
      navigate(`/complaint/${docRef.id}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit complaint: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container max-w-2xl animate-fade-in">
      <div className="mb-8">
        <h1 className="page-title">Raise a Complaint</h1>
        <p className="text-white/40 text-sm mt-1">Tell us about your local issue and we'll ensure it gets resolved</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all duration-300 ${
              i < step ? 'bg-primary-500 text-white' : i === step ? 'bg-primary-500/30 text-primary-400 border border-primary-500' : 'bg-white/10 text-white/30'
            }`}>
              {i < step ? '✓' : i + 1}
            </div>
            <div className="flex-1 mx-1">
              {i < STEPS.length - 1 && <div className={`h-px transition-all duration-300 ${i < step ? 'bg-primary-500' : 'bg-white/10'}`} />}
            </div>
          </div>
        ))}
      </div>

      <div className="glass rounded-3xl p-6 sm:p-8 min-h-72">
        {/* Step 0: Category */}
        {step === 0 && (
          <div className="animate-fade-in">
            <h2 className="section-title mb-5">Select Category</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {CATEGORIES.map((c) => (
                <button key={c.id} type="button" onClick={() => setForm({ ...form, category: c.id })}
                  className={`p-5 rounded-2xl border text-left transition-all duration-200 hover:scale-[1.02] ${
                    form.category === c.id
                      ? 'border-primary-500 bg-primary-500/20 shadow-lg shadow-primary-500/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}>
                  <span className="text-3xl block mb-2">{c.icon}</span>
                  <p className="font-semibold text-white text-sm">{c.label}</p>
                  <p className="text-white/40 text-xs mt-1">{c.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Description */}
        {step === 1 && (
          <div className="animate-fade-in space-y-4">
            <h2 className="section-title">Describe the Issue</h2>
            <div>
              <label className="label">Description <span className="text-white/30">(min. 20 characters)</span></label>
              <textarea rows={6} value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input resize-none" placeholder="Describe the issue in detail — what happened, since when, and how it's affecting you..." />
              <p className={`text-xs mt-1 ${form.description.length >= 20 ? 'text-green-400' : 'text-white/30'}`}>
                {form.description.length} characters {form.description.length < 20 ? `(${20 - form.description.length} more needed)` : '✓'}
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Photo */}
        {step === 2 && (
          <div className="animate-fade-in">
            <h2 className="section-title mb-2">Upload a Photo <span className="text-white/30 font-normal text-sm">(optional)</span></h2>
            <p className="text-white/40 text-sm mb-5">A photo helps admins verify and prioritize your complaint faster.</p>
            <PhotoUpload onFileChange={(file) => setForm({ ...form, photo: file })} />
          </div>
        )}

        {/* Step 3: Location */}
        {step === 3 && (
          <div className="animate-fade-in">
            <h2 className="section-title mb-2">Mark Location <span className="text-white/30 font-normal text-sm">(optional)</span></h2>
            <p className="text-white/40 text-sm mb-5">Pin the exact location on the map for faster dispatch.</p>
            <LocationPicker onLocationChange={(loc) => setForm({ ...form, location: loc })} />
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <button onClick={() => step > 0 && setStep(step - 1)} disabled={step === 0}
          className="btn-secondary flex items-center gap-2 disabled:opacity-30">
          <ChevronLeft size={16} /> Back
        </button>

        {step < STEPS.length - 1 ? (
          <button onClick={() => setStep(step + 1)} disabled={!canNext[step]}
            className="btn-primary flex items-center gap-2 disabled:opacity-50">
            Next <ChevronRight size={16} />
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={loading}
            className="btn-primary flex items-center gap-2">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Submitting…</> : <><Send size={15} /> Submit Complaint</>}
          </button>
        )}
      </div>
    </div>
  );
}
