const CATEGORIES = ['', 'electricity', 'road', 'water', 'sanitation', 'health_safety', 'other'];
const STATUSES   = ['', 'pending', 'in_progress', 'resolved', 'cancelled'];

const CATEGORY_LABELS = {
  '': 'All Categories',
  electricity: '⚡ Electricity',
  road: '🛣️ Road',
  water: '💧 Water',
  sanitation: '🚽 Sanitation',
  health_safety: '🏥 Health & Safety',
  other: '📝 Other / Custom',
};
const STATUS_LABELS = {
  '': 'All Statuses',
  pending: '🟡 Pending',
  in_progress: '🔵 In Progress',
  resolved: '🟢 Resolved',
  cancelled: '⚫ Cancelled',
};

export default function FilterBar({ filters, onChange, showEscalated = false }) {
  const set = (key, val) => onChange({ ...filters, [key]: val });

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative group">
        <select
          value={filters.category || ''}
          onChange={(e) => set('category', e.target.value)}
          className="appearance-none bg-white/5 backdrop-blur-md border border-white/10 hover:border-primary-500/50 hover:bg-white/10 focus:ring-2 focus:ring-primary-500/50 rounded-2xl py-2.5 pl-4 pr-10 text-sm text-white/90 font-medium cursor-pointer transition-all duration-300 shadow-sm outline-none"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c} className="bg-slate-900 text-white">{CATEGORY_LABELS[c]}</option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/40 group-hover:text-primary-400 transition-colors">▼</div>
      </div>

      <div className="relative group">
        <select
          value={filters.status || ''}
          onChange={(e) => set('status', e.target.value)}
          className="appearance-none bg-white/5 backdrop-blur-md border border-white/10 hover:border-primary-500/50 hover:bg-white/10 focus:ring-2 focus:ring-primary-500/50 rounded-2xl py-2.5 pl-4 pr-10 text-sm text-white/90 font-medium cursor-pointer transition-all duration-300 shadow-sm outline-none"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s} className="bg-slate-900 text-white">{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/40 group-hover:text-primary-400 transition-colors">▼</div>
      </div>

      {showEscalated && (
        <label className="flex items-center gap-2.5 px-4 py-2.5 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/40 rounded-2xl cursor-pointer text-sm font-bold text-red-400 transition-all duration-300 shadow-sm shadow-red-500/5">
          <input
            type="checkbox"
            checked={filters.escalated || false}
            onChange={(e) => set('escalated', e.target.checked)}
            className="w-4 h-4 rounded bg-dark-800 border-red-500/50 text-red-500 focus:ring-red-500/30 accent-red-500 cursor-pointer"
          />
          <span className="flex items-center gap-1.5">
            <span className="animate-pulse">🔴</span> Escalated Only
          </span>
        </label>
      )}

      {(filters.category || filters.status || filters.escalated) && (
        <button
          onClick={() => onChange({})}
          className="text-xs font-bold tracking-wide uppercase text-white/40 hover:text-white px-4 py-2.5 rounded-2xl hover:bg-white/10 transition-all duration-300 border border-transparent hover:border-white/10"
        >
          ✕ Clear Filters
        </button>
      )}
    </div>
  );
}
