import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc, collection, addDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../utils/firebaseClient';
import AdminLayout from '../components/AdminLayout';
import StatusBadge from '../components/StatusBadge';
import BeforeAfterSlider from '../components/BeforeAfterSlider';
import { MapPin, Clock, ChevronLeft, Loader2, AlertTriangle, Send, Upload, User, ThumbsUp, Building2, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';

const CATEGORY_ICONS = { electricity: '⚡', road: '🛣️', water: '💧', sanitation: '🚽', other: '📝' };

const STATUSES = [
  { value: 'pending',     label: '🟡 Pending'     },
  { value: 'in_progress', label: '🔵 In Progress'  },
  { value: 'resolved',   label: '🟢 Resolved'     },
  { value: 'cancelled',  label: '⚫ Cancelled'    },
];

const STATUS_COLORS = {
  pending:     { text: 'text-amber-400', bg: 'bg-amber-500/10',  border: 'border-amber-500/20',  glow: 'rgba(245,158,11,0.2)'  },
  in_progress: { text: 'text-blue-400',  bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   glow: 'rgba(59,130,246,0.2)'  },
  resolved:    { text: 'text-green-400', bg: 'bg-green-500/10',  border: 'border-green-500/20',  glow: 'rgba(34,197,94,0.2)'   },
  cancelled:   { text: 'text-white/40',  bg: 'bg-white/5',       border: 'border-white/10',      glow: 'transparent'           },
};

const formatDate = (iso) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function AdminComplaintDetail() {
  const { id } = useParams();
  const { profile } = useAuth();
  const [complaint, setComplaint]   = useState(null);
  const [loading, setLoading]       = useState(true);
  const [updateForm, setUpdateForm] = useState({ status: '', remark: '' });
  const [resolvedFile, setResolvedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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

  useEffect(() => {
    if (!profile) return;
    setLoading(true);

    const docRef = doc(db, 'complaints', id);
    const updatesRef = collection(db, 'complaints', id, 'updates');

    let complaintData = null;
    let updatesList = [];

    const updateState = () => {
      if (complaintData) {
        setComplaint({
          id,
          ...complaintData,
          profiles: {
            name: complaintData.citizen_name,
            phone: complaintData.citizen_phone,
            area: complaintData.area
          },
          complaint_updates: updatesList,
        });
        setLoading(false);
      } else {
        setComplaint(null);
        setLoading(false);
      }
    };

    const unsubComplaint = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        complaintData = docSnap.data();
        setUpdateForm(f => ({ ...f, status: docSnap.data().status }));
      } else {
        complaintData = null;
      }
      updateState();
    }, (err) => {
      console.error('Error fetching complaint details:', err);
      setComplaint(null);
      setLoading(false);
    });

    const unsubUpdates = onSnapshot(updatesRef, (snap) => {
      updatesList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      updatesList.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      updateState();
    }, (err) => {
      console.error('Error fetching complaint updates:', err);
    });

    return () => {
      unsubComplaint();
      unsubUpdates();
    };
  }, [id, profile]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!updateForm.status) { toast.error('Select a status'); return; }
    if (updateForm.status === 'resolved' && !resolvedFile) {
      toast.error('Please upload a proof photo when marking as Resolved');
      return;
    }
    setSubmitting(true);
    try {
      let resolvedImageUrl = null;
      if (updateForm.status === 'resolved' && resolvedFile) {
        resolvedImageUrl = await compressImageToBase64(resolvedFile);
      }

      // 1. Update complaint status in Firestore
      const complaintRef = doc(db, 'complaints', id);
      const updateData = {
        status: updateForm.status,
        updated_at: new Date().toISOString(),
      };
      if (resolvedImageUrl) {
        updateData.resolved_image = resolvedImageUrl;
      }
      await updateDoc(complaintRef, updateData);

      // 2. Add update log in subcollection
      await addDoc(collection(db, 'complaints', id, 'updates'), {
        admin_id: profile.id,
        admin_name: profile.name || 'Admin',
        new_status: updateForm.status,
        remark: updateForm.remark || null,
        created_at: new Date().toISOString(),
      });

      // 3. Create notification for citizen in 'notifications' collection
      if (complaint?.citizen_id) {
        await addDoc(collection(db, 'notifications'), {
          citizen_id: complaint.citizen_id,
          complaint_id: id,
          message: `Your complaint status has been updated to "${updateForm.status}"${updateForm.remark ? `. Remark: ${updateForm.remark}` : '.'}`,
          is_read: false,
          created_at: new Date().toISOString(),
        });
      }

      toast.success('Status updated & citizen notified ✅');
      setUpdateForm(f => ({ ...f, remark: '' }));
      setResolvedFile(null);
    } catch (err) {
      console.error(err);
      toast.error('Update failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const updates     = complaint?.complaint_updates || [];
  const isEscalated = complaint?.is_escalated && !['resolved', 'cancelled'].includes(complaint?.status);
  const isPetition  = complaint?.is_petition   && !['resolved', 'cancelled'].includes(complaint?.status);

  if (loading) return (
    <AdminLayout>
      <div className="page-container flex justify-center items-center py-32">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={36} className="animate-spin" style={{ color: '#ef4444' }} />
          <p className="text-white/40 text-sm">Loading complaint details...</p>
        </div>
      </div>
    </AdminLayout>
  );

  if (!complaint) return (
    <AdminLayout>
      <div className="page-container text-center py-20">
        <p className="text-white/40 text-lg">Complaint not found</p>
        <Link to="/admin" className="btn-secondary mt-4 inline-flex">← Back to Dashboard</Link>
      </div>
    </AdminLayout>
  );

  const statusCol = STATUS_COLORS[complaint.status] || STATUS_COLORS.cancelled;

  return (
    <AdminLayout>
      <div className="page-container relative animate-fade-in">

        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full blur-[120px] pointer-events-none -z-10"
          style={{ background: 'rgba(220,38,38,0.05)' }} />

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-sm">
          <Link to="/admin" className="flex items-center gap-1.5 text-white/40 hover:text-red-400 transition-colors font-medium">
            <ChevronLeft size={16} /> Dashboard
          </Link>
          <span className="text-white/20">/</span>
          <span className="text-white/50">Complaint #{id.slice(0, 8)}…</span>
        </div>

        {/* Alert banners */}
        {isEscalated && (
          <div className="flex items-center gap-3 p-4 rounded-2xl mb-6"
            style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}>
            <AlertTriangle size={18} className="animate-pulse shrink-0" style={{ color: '#f87171' }} />
            <div>
              <p className="font-bold text-sm" style={{ color: '#f87171' }}>Escalated — Immediate action required</p>
              <p className="text-xs text-white/40 mt-0.5">Unresolved for 7+ days · Citizen is waiting</p>
            </div>
          </div>
        )}
        {isPetition && !isEscalated && (
          <div className="flex items-center gap-3 p-4 rounded-2xl mb-6"
            style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.15)' }}>
            <span className="text-xl shrink-0">📢</span>
            <div>
              <p className="font-bold text-sm text-amber-400">Public Petition — Community Backed</p>
              <p className="text-xs text-white/40 mt-0.5">{complaint.upvote_count}+ citizens flagged this as a critical issue</p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left: Complaint Info */}
          <div className="lg:col-span-3 space-y-5">
            {/* Main complaint glass card */}
            <div className="glass rounded-3xl p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl shrink-0">
                  {CATEGORY_ICONS[complaint.category] || '📋'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <StatusBadge status={complaint.status} escalated={complaint.is_escalated} />
                    {complaint.assigned_department && (
                      <span className="badge bg-white/5 border-white/10 text-white/50 flex items-center gap-1">
                        <Building2 size={10} /> {complaint.assigned_department}
                      </span>
                    )}
                    {complaint.upvote_count > 0 && (
                      <span className="badge bg-amber-500/10 border-amber-500/20 text-amber-400">
                        👍 {complaint.upvote_count} support
                      </span>
                    )}
                  </div>
                  <p className="text-white/80 leading-relaxed text-sm">{complaint.description}</p>
                </div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4 pt-5 border-t border-white/5">
                {complaint.profiles && (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <User size={14} className="text-white/40" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Filed By</p>
                      <p className="text-sm font-semibold text-white/80">{complaint.profiles.name}</p>
                      <p className="text-xs text-white/40">{complaint.profiles.phone}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <MapPin size={14} className="text-white/40" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Location</p>
                    <p className="text-sm font-semibold text-white/80">{complaint.area}</p>
                    {complaint.location_name && <p className="text-xs text-white/40">{complaint.location_name}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <Clock size={14} className="text-white/40" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Filed On</p>
                    <p className="text-sm font-semibold text-white/80">{formatDate(complaint.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <ThumbsUp size={14} className="text-white/40" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Community Support</p>
                    <p className="text-sm font-extrabold text-amber-400">{complaint.upvote_count || 0} upvotes</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Photo / Before-After */}
            {(complaint.photo_url || complaint.resolved_image) && (
              <div className="glass rounded-3xl p-5">
                <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                  📸 Evidence Photo
                </h3>
                {complaint.status === 'resolved' && complaint.resolved_image && complaint.photo_url ? (
                  <div className="space-y-2">
                    <p className="text-xs text-white/30 font-medium">Before & After — Drag to compare</p>
                    <BeforeAfterSlider beforeImage={complaint.photo_url} afterImage={complaint.resolved_image} />
                  </div>
                ) : complaint.status === 'resolved' && complaint.resolved_image && !complaint.photo_url ? (
                  <div>
                    <p className="text-xs text-white/30 font-medium mb-2">Resolution Proof Photo</p>
                    <div className="rounded-2xl overflow-hidden border border-white/10">
                      <img src={complaint.resolved_image} alt="Resolution proof" className="w-full max-h-72 object-cover" />
                    </div>
                  </div>
                ) : complaint.photo_url ? (
                  <div className="rounded-2xl overflow-hidden border border-white/10">
                    <img src={complaint.photo_url} alt="Complaint evidence" className="w-full max-h-72 object-cover" />
                  </div>
                ) : null}
              </div>
            )}

            {/* Map */}
            {complaint.latitude && complaint.longitude && (
              <div className="glass rounded-3xl p-5">
                <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                  📍 GPS Location
                </h3>
                <div className="h-48 rounded-2xl overflow-hidden border border-white/10">
                  <MapContainer center={[complaint.latitude, complaint.longitude]} zoom={15}
                    style={{ height: '100%', width: '100%' }} zoomControl={false}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[complaint.latitude, complaint.longitude]} />
                  </MapContainer>
                </div>
              </div>
            )}
          </div>

          {/* Right: Update Form + Timeline */}
          <div className="lg:col-span-2 space-y-5">
            {/* Status Update Card */}
            <div className="glass rounded-3xl p-6">
              <h3 className="text-white font-bold text-base mb-5 flex items-center gap-2">
                <ShieldCheck size={16} style={{ color: '#f87171' }} /> Update Status
              </h3>
              <form onSubmit={handleUpdate} className="space-y-4">
                {/* Status selector */}
                <div>
                  <label className="label">New Status</label>
                  <div className="grid grid-cols-2 gap-2">
                    {STATUSES.map(s => {
                      const col = STATUS_COLORS[s.value];
                      const isSelected = updateForm.status === s.value;
                      return (
                        <button type="button" key={s.value}
                          onClick={() => setUpdateForm({ ...updateForm, status: s.value })}
                          className={`p-2.5 rounded-2xl text-sm font-bold text-left transition-all duration-200 border ${
                            isSelected ? `${col.bg} ${col.border} ${col.text}` : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                          }`}
                          style={isSelected ? { boxShadow: `0 4px 16px ${col.glow}` } : {}}>
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Remark */}
                <div>
                  <label className="label">
                    Remark <span className="text-white/30 normal-case tracking-normal font-normal">(optional)</span>
                  </label>
                  <textarea rows={3} value={updateForm.remark}
                    onChange={e => setUpdateForm({ ...updateForm, remark: e.target.value })}
                    className="input resize-none"
                    placeholder="e.g. Repair team dispatched, expected completion 2 days..." />
                </div>

                {/* Proof upload — only for Resolved */}
                {updateForm.status === 'resolved' && (
                  <div>
                    <label className="label">
                      Resolution Proof Photo <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input type="file" accept="image/*"
                        onChange={e => setResolvedFile(e.target.files[0])}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                      <div className={`input flex items-center justify-between border-dashed ${
                        resolvedFile ? 'border-green-500/40' : 'border-red-500/20'
                      }`}>
                        <span className="flex items-center gap-2 text-white/40 text-sm">
                          <Upload size={14} />
                          {resolvedFile ? resolvedFile.name : 'Upload after-repair photo…'}
                        </span>
                        <span className="text-xs font-bold px-3 py-1 rounded-xl"
                          style={{ background: 'rgba(220,38,38,0.1)', color: '#f87171', border: '1px solid rgba(220,38,38,0.2)' }}>
                          Browse
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit */}
                <button type="submit" disabled={submitting}
                  className="w-full py-3.5 rounded-2xl font-extrabold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                    boxShadow: '0 8px 20px rgba(220,38,38,0.3)',
                    border: '1px solid rgba(220,38,38,0.3)'
                  }}>
                  {submitting
                    ? <><Loader2 size={15} className="animate-spin" /> Processing...</>
                    : <><Send size={15} /> Update & Notify Citizen</>
                  }
                </button>
              </form>
            </div>

            {/* Status Timeline */}
            <div className="glass rounded-3xl p-6">
              <h3 className="text-white font-bold text-base mb-5">📋 Status Timeline</h3>
              {updates.length === 0 ? (
                <p className="text-white/30 text-sm text-center py-6">No updates logged yet</p>
              ) : (
                <div className="space-y-4">
                  {updates.map((u, i) => (
                    <div key={u.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                          style={{ background: '#dc2626', boxShadow: '0 0 6px rgba(220,38,38,0.5)' }} />
                        {i < updates.length - 1 && (
                          <div className="w-px flex-1 my-1 bg-white/5" />
                        )}
                      </div>
                      <div className="pb-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <StatusBadge status={u.new_status} />
                          <span className="text-[11px] text-white/30">{formatDate(u.created_at)}</span>
                        </div>
                        {u.remark && (
                          <p className="text-xs text-white/50 leading-relaxed bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                            {u.remark}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  {/* Original filed marker */}
                  <div className="flex gap-3">
                    <div className="w-2 h-2 rounded-full mt-1.5 bg-white/20 shrink-0" />
                    <p className="text-xs text-white/30">Complaint filed — {formatDate(complaint.created_at)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
