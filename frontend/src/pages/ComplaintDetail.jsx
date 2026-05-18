import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, collection, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../utils/firebaseClient';
import { useAuth } from '../contexts/AuthContext';
import StatusBadge from '../components/StatusBadge';
import UpvoteButton from '../components/UpvoteButton';
import { MapPin, Clock, ChevronLeft, Loader2, AlertTriangle, Send, MessageSquare } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import api from '../utils/api';
import toast from 'react-hot-toast';
import BeforeAfterSlider from '../components/BeforeAfterSlider';

const CATEGORY_ICONS = { electricity: '⚡', road: '🛣️', water: '💧', sanitation: '🚽', other: '📝' };

const formatDate = (iso) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function ComplaintDetail() {
  const { id } = useParams();
  const { profile } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (submittingComment) return;
    
    setSubmittingComment(true);
    try {
      const commentData = {
        citizen_id: profile.id,
        citizen_name: profile.name || 'Anonymous',
        text: newComment.trim(),
        created_at: new Date().toISOString(),
      };
      await addDoc(collection(db, 'complaints', id, 'comments'), commentData);
      setNewComment('');
      toast.success('Comment posted successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  useEffect(() => {
    if (!profile) return;
    setLoading(true);

    const docRef = doc(db, 'complaints', id);
    const updatesRef = collection(db, 'complaints', id, 'updates');
    const commentsRef = collection(db, 'complaints', id, 'comments');
    const upvoteRef = doc(db, 'upvotes', `${profile.id}_${id}`);

    let complaintData = null;
    let hasUpvoted = false;
    let updatesList = [];
    let commentsList = [];

    const updateState = () => {
      if (complaintData) {
        setComplaint({
          id,
          ...complaintData,
          hasUpvoted,
          complaint_updates: updatesList,
          comments: commentsList,
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
      } else {
        complaintData = null;
      }
      updateState();
    }, (err) => console.error(err));

    const unsubUpvote = onSnapshot(upvoteRef, (snap) => {
      hasUpvoted = snap.exists();
      updateState();
    });

    const unsubUpdates = onSnapshot(updatesRef, (snap) => {
      updatesList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      updatesList.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      updateState();
    });

    const unsubComments = onSnapshot(commentsRef, (snap) => {
      commentsList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      commentsList.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      updateState();
    });

    return () => {
      unsubComplaint();
      unsubUpvote();
      unsubUpdates();
      unsubComments();
    };
  }, [id, profile]);

  if (loading) return (
    <div className="flex justify-center py-32"><Loader2 size={36} className="animate-spin text-primary-500" /></div>
  );
  if (!complaint) return (
    <div className="page-container text-center py-20">
      <p className="text-5xl mb-4">🔍</p>
      <p className="text-white/50">Complaint not found</p>
      <Link to="/dashboard" className="btn-secondary mt-4 inline-block">← Back to Dashboard</Link>
    </div>
  );

  const updates = complaint.complaint_updates || [];

  return (
    <div className="page-container max-w-3xl animate-fade-in">
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-white/40 hover:text-white text-sm mb-6 transition-colors">
        <ChevronLeft size={15} /> Back to Dashboard
      </Link>

      {/* Escalation alert */}
      {complaint.is_escalated && !['resolved','cancelled'].includes(complaint.status) && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 mb-5">
          <AlertTriangle size={18} className="text-red-400 shrink-0" />
          <div>
            <p className="text-red-400 font-semibold text-sm">This complaint has been escalated</p>
            <p className="text-red-400/60 text-xs mt-0.5">Unresolved for over 7 days — flagged for urgent attention</p>
          </div>
        </div>
      )}

      {/* Main card */}
      <div className="glass rounded-3xl p-6 sm:p-8 mb-5">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-3xl shrink-0">
            {CATEGORY_ICONS[complaint.category] || '📋'}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-bold text-primary-400 uppercase tracking-wide">{complaint.category}</span>
              <StatusBadge status={complaint.status} escalated={complaint.is_escalated} />
            </div>
            <p className="text-white/80 leading-relaxed">{complaint.description}</p>
          </div>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-4 text-sm text-white/40 border-t border-white/10 pt-4">
          {complaint.area && <span className="flex items-center gap-1.5"><MapPin size={13} />{complaint.area}</span>}
          {complaint.location_name && <span className="flex items-center gap-1.5"><MapPin size={13} className="text-primary-400" />{complaint.location_name}</span>}
          <span className="flex items-center gap-1.5"><Clock size={13} />Filed {formatDate(complaint.created_at)}</span>
        </div>

        {/* Support Issue Button */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row items-center gap-4">
          <UpvoteButton complaintId={complaint.id} initialCount={complaint.upvote_count} initialUpvoted={complaint.hasUpvoted} size="large" />
          <div className="text-sm text-white/50 text-center sm:text-left">
            <span className="font-bold text-white/80">Are you facing this too?</span>
            <br />Support this issue to increase its priority for district administrators.
          </div>
        </div>
      </div>

      {/* Photo / Before & After Slider */}
      {complaint.photo_url && (
        <div className="mb-5">
          {complaint.status === 'resolved' && complaint.resolved_image ? (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-white/40 tracking-wider uppercase pl-2 flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                Resolution Slider (Drag to inspect)
              </h3>
              <BeforeAfterSlider
                beforeImage={complaint.photo_url}
                afterImage={complaint.resolved_image}
              />
            </div>
          ) : (
            <div className="glass rounded-3xl overflow-hidden">
              <img src={complaint.photo_url} alt="Complaint photo" className="w-full max-h-72 object-cover" />
            </div>
          )}
        </div>
      )}

      {/* Map */}
      {complaint.latitude && complaint.longitude && (
        <div className="mb-5 h-48 rounded-3xl overflow-hidden border border-white/10">
          <MapContainer center={[complaint.latitude, complaint.longitude]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[complaint.latitude, complaint.longitude]} />
          </MapContainer>
        </div>
      )}

      {/* Status timeline */}
      <div className="glass rounded-3xl p-6">
        <h2 className="section-title mb-5">Status History</h2>
        {updates.length === 0 ? (
          <div className="text-center py-6 text-white/30 text-sm">No updates yet — your complaint is under review</div>
        ) : (
          <div className="relative space-y-0">
            {updates.map((u, i) => (
              <div key={u.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-primary-500 border-2 border-primary-400 shrink-0 mt-1" />
                  {i < updates.length - 1 && <div className="w-px flex-1 bg-white/10 my-1" />}
                </div>
                <div className="pb-5 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={u.new_status} />
                    <span className="text-xs text-white/30">{formatDate(u.created_at)}</span>
                  </div>
                  {u.remark && <p className="text-white/60 text-sm bg-white/5 rounded-xl px-3 py-2 mt-2">{u.remark}</p>}
                </div>
              </div>
            ))}
            {/* Filed event */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-white/20 border-2 border-white/10 shrink-0 mt-1" />
              </div>
              <div className="pb-2">
                <span className="text-xs text-white/30">Complaint filed — {formatDate(complaint.created_at)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Comments Section */}
      <div className="glass rounded-3xl p-6 mt-5 mb-10">
        <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
          <div className="w-10 h-10 rounded-xl bg-primary-500/20 text-primary-400 flex items-center justify-center">
            <MessageSquare size={20} />
          </div>
          <h2 className="section-title !mb-0">Community Discussion</h2>
          <span className="bg-white/10 text-white/60 px-2.5 py-0.5 rounded-full text-xs font-bold ml-auto">
            {complaint.comments?.length || 0} Comments
          </span>
        </div>

        {/* Comments List */}
        <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
          {(!complaint.comments || complaint.comments.length === 0) ? (
            <div className="text-center py-8 bg-white/5 rounded-2xl border border-white/5 border-dashed">
              <MessageSquare size={24} className="text-white/20 mx-auto mb-3" />
              <p className="text-white/40 text-sm font-medium">No comments yet.</p>
              <p className="text-white/30 text-xs mt-1">Be the first to share your thoughts or updates.</p>
            </div>
          ) : (
            complaint.comments.map((comment) => (
              <div key={comment.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-primary-300">
                    {comment.citizen_id === profile.id ? 'You' : comment.citizen_name}
                  </span>
                  <span className="text-xs text-white/30">{formatDate(comment.created_at)}</span>
                </div>
                <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">{comment.text}</p>
              </div>
            ))
          )}
        </div>

        {/* Comment Input Box */}
        <form onSubmit={handleCommentSubmit} className="relative">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment... (visible to your district)"
            className="w-full bg-dark-900/50 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 resize-none min-h-[100px] transition-all"
            disabled={submittingComment}
          />
          <button
            type="submit"
            disabled={submittingComment || !newComment.trim()}
            className="absolute bottom-4 right-4 bg-primary-500 hover:bg-primary-400 text-white p-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 shadow-lg shadow-primary-500/20"
          >
            {submittingComment ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="translate-x-[1px] translate-y-[-1px]" />}
          </button>
        </form>
      </div>
    </div>
  );
}
