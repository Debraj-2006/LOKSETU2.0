import { useState, useEffect, useRef } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../utils/firebaseClient';
import { useAuth } from '../contexts/AuthContext';

export default function NotificationBell() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef();

  const unread = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    if (!profile) return;

    // Listen directly to Firestore notifications in real-time
    const q = query(
      collection(db, 'notifications'),
      where('citizen_id', '==', profile.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort in JS to prevent index errors
      list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setNotifications(list);
    }, (error) => {
      console.error('Notifications snapshot error:', error);
    });

    return () => unsubscribe();
  }, [profile]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markRead = async (id) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { is_read: true });
    } catch (err) {
      console.error('Mark read failed:', err);
    }
  };

  const markAllRead = async () => {
    try {
      const batch = writeBatch(db);
      notifications.filter(n => !n.is_read).forEach((n) => {
        const docRef = doc(db, 'notifications', n.id);
        batch.update(docRef, { is_read: true });
      });
      await batch.commit();
    } catch (err) {
      console.error('Mark all read failed:', err);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 glass border border-white/10 rounded-2xl shadow-2xl z-50 animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="font-semibold text-sm">Notifications</span>
            <div className="flex items-center gap-2">
              {unread > 0 && <button onClick={markAllRead} className="text-xs text-primary-400 hover:text-primary-300">Mark all read</button>}
              <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white"><X size={14} /></button>
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-white/30 text-sm">No notifications yet</div>
            ) : notifications.map((n) => (
              <div key={n.id} className={`px-4 py-3 border-b border-white/5 flex items-start gap-3 hover:bg-white/5 transition-colors ${!n.is_read ? 'bg-white/5' : ''}`}>
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.is_read ? 'bg-primary-400' : 'bg-white/20'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/70">{n.message}</p>
                  <p className="text-xs text-white/30 mt-0.5">{new Date(n.created_at).toLocaleString('en-IN')}</p>
                </div>
                {!n.is_read && (
                  <button onClick={() => markRead(n.id)} className="text-white/30 hover:text-green-400 shrink-0"><Check size={12} /></button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
