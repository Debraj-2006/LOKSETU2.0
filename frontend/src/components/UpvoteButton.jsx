import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, runTransaction, increment } from 'firebase/firestore';
import { db } from '../utils/firebaseClient';
import toast from 'react-hot-toast';
import { Heart } from 'lucide-react';

export default function UpvoteButton({ complaintId, initialCount = 0, initialUpvoted = false, size = 'default' }) {
  const { profile } = useAuth();
  const [count, setCount]     = useState(initialCount);
  const [upvoted, setUpvoted] = useState(initialUpvoted);
  const [loading, setLoading] = useState(false);

  const handleUpvote = async (e) => {
    e.preventDefault();
    if (!profile?.id) { toast.error('Login to support issues'); return; }
    if (loading) return;
    setLoading(true);

    const upvoteDocRef = doc(db, 'upvotes', `${profile.id}_${complaintId}`);
    const complaintDocRef = doc(db, 'complaints', complaintId);

    try {
      let isUpvoting = !upvoted;

      await runTransaction(db, async (transaction) => {
        const upvoteSnap = await transaction.get(upvoteDocRef);
        const alreadyUpvoted = upvoteSnap.exists();

        if (alreadyUpvoted) {
          isUpvoting = false;
          transaction.delete(upvoteDocRef);
          transaction.update(complaintDocRef, {
            upvote_count: increment(-1)
          });
        } else {
          isUpvoting = true;
          transaction.set(upvoteDocRef, {
            citizen_id: profile.id,
            complaint_id: complaintId,
            created_at: new Date().toISOString()
          });
          transaction.update(complaintDocRef, {
            upvote_count: increment(1)
          });
        }
      });

      setUpvoted(isUpvoting);
      setCount((c) => isUpvoting ? c + 1 : c - 1);

      // Determine petition status based on new count
      const updatedSnap = await getDoc(complaintDocRef);
      if (updatedSnap.exists()) {
        const compData = updatedSnap.data();
        const currentCount = compData.upvote_count || 0;
        if (currentCount >= 5 && !compData.is_petition) {
          await runTransaction(db, async (t) => {
            t.update(complaintDocRef, { is_petition: true });
          });
        } else if (currentCount < 5 && compData.is_petition) {
          await runTransaction(db, async (t) => {
            t.update(complaintDocRef, { is_petition: false });
          });
        }
      }

      if (isUpvoting) {
        toast.success('You supported this issue!');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to support issue');
    } finally {
      setLoading(false);
    }
  };

  const isLarge = size === 'large';

  return (
    <button
      onClick={handleUpvote}
      disabled={loading}
      className={`group relative inline-flex items-center justify-center gap-2 transition-all duration-300 font-bold overflow-hidden ${
        isLarge ? 'px-6 py-3 rounded-2xl text-sm w-full sm:w-auto' : 'px-4 py-2 rounded-xl text-xs'
      } ${
        upvoted
          ? 'bg-gradient-to-r from-red-500/20 to-rose-500/10 text-rose-400 border border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.15)] hover:shadow-[0_0_30px_rgba(244,63,94,0.25)]'
          : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20'
      }`}
    >
      {/* Shine effect when upvoted */}
      {upvoted && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[150%] skew-x-[-15deg] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out pointer-events-none" />
      )}
      
      <Heart 
        size={isLarge ? 18 : 14} 
        className={`transition-all duration-300 ${upvoted ? 'fill-rose-500 text-rose-500 scale-110 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]' : 'text-white/40 group-hover:text-white/80'}`} 
      />
      
      <span className="tracking-wide">
        {upvoted ? 'Supported' : 'Support Issue'} <span className={`ml-1.5 px-2 py-0.5 rounded-md ${upvoted ? 'bg-rose-500/20 text-rose-300' : 'bg-white/10 text-white/50'}`}>{count}</span>
      </span>
    </button>
  );
}
