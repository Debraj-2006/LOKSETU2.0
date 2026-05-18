import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import UpvoteButton from './UpvoteButton';
import { MapPin, Clock, AlertTriangle } from 'lucide-react';

const CATEGORY_ICONS = {
  electricity: '⚡',
  road: '🛣️',
  water: '💧',
  sanitation: '🚽',
  health_safety: '🏥',
  other: '📝',
};

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function ComplaintCard({ complaint, linkTo, showUpvote = true, adminView = false }) {
  const icon = CATEGORY_ICONS[complaint.category] || '📋';
  const isEscalated = complaint.is_escalated && !['resolved','cancelled'].includes(complaint.status);
  const isPetition = complaint.is_petition;

  let cardStyle = 'bg-white/[0.03] hover:bg-white/[0.06] border-white/10 hover:border-white/20 hover:shadow-white/10';
  if (isEscalated) {
    cardStyle = 'bg-red-500/5 border-red-500/30 hover:border-red-500/50 hover:shadow-red-500/20';
  } else if (isPetition) {
    cardStyle = 'bg-amber-500/5 border-amber-500/30 hover:border-amber-500/50 hover:shadow-amber-500/20';
  }

  return (
    <div className={`group relative p-6 rounded-3xl overflow-hidden transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl backdrop-blur-xl border ${cardStyle}`}>
      
      {/* Dynamic Shine effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 -translate-x-[150%] skew-x-[-15deg] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out pointer-events-none" />

      {/* Top Glow Bar */}
      {isEscalated && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 animate-gradient-x shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
      )}
      {!isEscalated && isPetition && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500 animate-gradient-x shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
      )}

      <div className="flex items-start gap-5 relative z-10">
        {/* Glowing Icon Container */}
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center text-3xl shrink-0 shadow-inner group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500 ${isEscalated ? 'shadow-red-500/20 group-hover:shadow-red-500/40' : isPetition ? 'shadow-amber-500/20 group-hover:shadow-amber-500/40' : ''}`}>
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2.5">
            <div>
              <span className="text-xs font-bold text-primary-400 uppercase tracking-widest">{complaint.category}</span>
              {isEscalated && (
                <span className="ml-3 inline-flex items-center gap-1.5 text-xs font-bold text-red-400 animate-pulse bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">
                  <AlertTriangle size={12} /> ESCALATED
                </span>
              )}
              {!isEscalated && isPetition && (
                <span className="ml-3 inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 animate-pulse bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                  📢 PETITION
                </span>
              )}
            </div>
            <StatusBadge status={complaint.status} />
          </div>

          <p className="text-white/90 text-sm mb-4 leading-relaxed line-clamp-2 font-medium">{complaint.description}</p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-white/50">
            {complaint.assigned_department && (
              <span className="flex items-center gap-1.5 bg-primary-500/10 text-primary-400 px-2.5 py-1 rounded-md border border-primary-500/20 font-bold tracking-wide uppercase text-[10px]">{complaint.assigned_department}</span>
            )}
            {complaint.area && (
              <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-md border border-white/5"><MapPin size={12} className="text-white/40"/> {complaint.area}</span>
            )}
            <span className="flex items-center gap-1.5"><Clock size={12} className="text-white/40"/> {formatDate(complaint.created_at)}</span>
            {adminView && complaint.profiles && (
              <span className="text-white/40 ml-auto bg-dark-800/50 px-2.5 py-1 rounded-md">by <span className="text-white/70 font-bold">{complaint.profiles.name}</span></span>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/10 relative z-10">
        {showUpvote ? (
          <UpvoteButton
            complaintId={complaint.id}
            initialCount={complaint.upvote_count}
            initialUpvoted={complaint.hasUpvoted}
          />
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-bold text-white/40 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">👍 {complaint.upvote_count} Upvotes</span>
        )}
        {linkTo && (
          <Link to={linkTo} className="group/link flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 font-bold transition-colors">
            <span>View Details</span>
            <span className="group-hover/link:translate-x-1 transition-transform">→</span>
          </Link>
        )}
      </div>
    </div>
  );
}
