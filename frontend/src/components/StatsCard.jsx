export default function StatsCard({ label, value, icon, color = 'primary', sub }) {
  const styles = {
    primary: { bg: 'from-primary-500/10 to-primary-600/5', border: 'border-primary-500/20 group-hover:border-primary-500/40', text: 'text-primary-400', shadow: 'group-hover:shadow-primary-500/20' },
    blue:    { bg: 'from-blue-500/10 to-blue-600/5',       border: 'border-blue-500/20 group-hover:border-blue-500/40',       text: 'text-blue-400',    shadow: 'group-hover:shadow-blue-500/20' },
    green:   { bg: 'from-green-500/10 to-green-600/5',     border: 'border-green-500/20 group-hover:border-green-500/40',     text: 'text-green-400',   shadow: 'group-hover:shadow-green-500/20' },
    amber:   { bg: 'from-amber-500/10 to-amber-600/5',     border: 'border-amber-500/20 group-hover:border-amber-500/40',     text: 'text-amber-400',   shadow: 'group-hover:shadow-amber-500/20' },
    red:     { bg: 'from-red-500/10 to-red-600/5',         border: 'border-red-500/20 group-hover:border-red-500/40',         text: 'text-red-400',     shadow: 'group-hover:shadow-red-500/20' },
    gray:    { bg: 'from-gray-500/10 to-gray-600/5',       border: 'border-gray-500/20 group-hover:border-gray-500/40',       text: 'text-gray-400',    shadow: 'group-hover:shadow-gray-500/20' },
  };

  const theme = styles[color] || styles.primary;

  return (
    <div className={`relative group overflow-hidden bg-gradient-to-br ${theme.bg} border ${theme.border} p-6 rounded-3xl animate-slide-up transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl ${theme.shadow} backdrop-blur-xl`}>
      {/* Shine effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 -translate-x-[150%] skew-x-[-15deg] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out pointer-events-none" />
      
      <div className="flex items-start justify-between relative z-10">
        <div className="flex flex-col h-full justify-between">
          <p className="text-xs font-bold tracking-widest text-white/40 mb-2 uppercase">{label}</p>
          <p className={`text-4xl font-extrabold tracking-tight ${theme.text} drop-shadow-sm`} style={{ fontFamily: "'Outfit', sans-serif" }}>{value}</p>
          {sub && (
            <p className="text-xs font-semibold text-white/50 mt-2.5 flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${theme.text.replace('text', 'bg')} animate-pulse`} /> 
              {sub}
            </p>
          )}
        </div>
        <div className="w-14 h-14 flex items-center justify-center text-3xl bg-white/5 rounded-2xl group-hover:scale-110 group-hover:-rotate-12 group-hover:bg-white/10 transition-all duration-500 shadow-inner border border-white/5 shrink-0">
          {icon}
        </div>
      </div>
    </div>
  );
}
