import { Link } from 'react-router-dom';
import { ShieldCheck, Bell, ThumbsUp, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

const features = [
  { icon: '📋', title: 'Raise Complaints', desc: 'File issues about electricity, roads, water, or sanitation with photo and location.' },
  { icon: '📍', title: 'Track in Real-Time', desc: 'Get live status updates — Pending, In Progress, or Resolved.' },
  { icon: '🔔', title: 'Stay Notified', desc: 'Receive instant notifications whenever your complaint status changes.' },
  { icon: '👍', title: 'Community Upvotes', desc: 'Upvote shared issues so high-priority problems get resolved first.' },
  { icon: '🔴', title: 'Auto-Escalation', desc: 'Complaints unresolved for 7 days are automatically escalated to admin.' },
  { icon: '🏛️', title: 'Government Portal', desc: 'Admins manage, respond, and resolve complaints with full visibility.' },
];

const categories = [
  { icon: '⚡', label: 'Electricity', color: 'from-yellow-500/25 to-yellow-600/5 border-yellow-500/25', text: 'text-yellow-400', shadow: 'hover:shadow-[0_0_30px_rgba(234,179,8,0.15)] hover:border-yellow-400/40' },
  { icon: '🛣️', label: 'Roads',       color: 'from-blue-500/25   to-blue-600/5   border-blue-500/25', text: 'text-blue-400', shadow: 'hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] hover:border-blue-400/40' },
  { icon: '💧', label: 'Water',       color: 'from-cyan-500/25   to-cyan-600/5   border-cyan-500/25', text: 'text-cyan-400', shadow: 'hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] hover:border-cyan-400/40' },
  { icon: '🚽', label: 'Sanitation',  color: 'from-green-500/25  to-green-600/5  border-green-500/25', text: 'text-green-400', shadow: 'hover:shadow-[0_0_30px_rgba(34,197,94,0.15)] hover:border-green-400/40' },
  { icon: '🏥', label: 'Health & Safety', color: 'from-rose-500/25 to-rose-600/5 border-rose-500/25', text: 'text-rose-400', shadow: 'hover:shadow-[0_0_30px_rgba(244,63,94,0.15)] hover:border-rose-400/40' },
  { icon: '📝', label: 'Custom / Other',  color: 'from-purple-500/25 to-purple-600/5 border-purple-500/25', text: 'text-purple-400', shadow: 'hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] hover:border-purple-400/40', desc: 'We solve any problem you face!' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-dark-900 overflow-x-hidden relative">
      
      {/* Premium ambient glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary-500/5 rounded-full blur-[140px] pointer-events-none -z-10 animate-glow-1" />
      <div className="absolute bottom-1/3 right-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[160px] pointer-events-none -z-10 animate-glow-2" />

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-dark-900/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <span className="text-3xl filter drop-shadow-md">🏛️</span>
            <div>
              <span className="text-lg font-black tracking-tight text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>LokSetu</span>
              <span className="block text-[10px] text-white/40 tracking-wider font-semibold -mt-1">लोक सेतु • লোক সেতু</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Link to="/login" className="btn-secondary text-xs py-2 px-4 border-white/10 hover:bg-white/5">Login</Link>
            <Link to="/register" className="btn-primary text-xs py-2 px-5 shadow-lg shadow-primary-500/10 hover:shadow-primary-500/20">Register</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative py-20 lg:py-32 px-4 overflow-visible">
        <div className="relative max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-16">
          
          {/* Left Column: Text & CTA */}
          <div className="flex-1 text-center lg:text-left flex flex-col items-center lg:items-start z-10">
            <div className="inline-flex px-4 py-1.5 rounded-full bg-primary-500/10 text-primary-400 text-xs font-bold tracking-widest mb-6 border border-primary-500/20 shadow-sm uppercase reveal-item delay-100">
              🇮🇳 Citizen • Government Redressal Bridge
            </div>

            <div className="reveal-item delay-200 mb-6">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white logo-title-glow tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                LokSetu
              </h1>
              <p className="text-[10px] sm:text-xs text-white/50 uppercase tracking-[0.25em] font-black logo-subtitle-spaced mt-2.5">
                Civic Grievance Redressal
              </p>
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight tracking-tight drop-shadow-sm reveal-item delay-400" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Your voice, <br />
              <span className="shimmer-text drop-shadow-md">
                their responsibility
              </span>
            </h2>

            <p className="text-base sm:text-lg text-white/60 mb-10 max-w-lg font-medium leading-relaxed reveal-item delay-600">
              LokSetu directly bridges citizens with local district administrators to address power grid failures, damaged roads, water shortages, and public hygiene.
            </p>

            <div className="flex flex-wrap justify-center lg:justify-start gap-4 reveal-item delay-800">
              <Link 
                to="/register" 
                className="btn-primary text-base px-8 py-3.5 shadow-xl shadow-primary-500/20 hover:shadow-primary-500/35 hover:scale-[1.02] active:scale-95 transition-all duration-300"
              >
                Get Started →
              </Link>
              <Link 
                to="/login" 
                className="btn-secondary text-base px-8 py-3.5 border-white/10 hover:bg-white/5 hover:scale-[1.02] active:scale-95 transition-all duration-300"
              >
                Access Dashboard
              </Link>
            </div>
          </div>

          {/* Right Column: 3D Logo / Visual */}
          <div className="flex-1 flex justify-center lg:justify-end w-full relative reveal-item delay-300 mt-12 lg:mt-0">
            {/* Ambient Background Glow for Logo */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/20 to-orange-500/20 rounded-full blur-[100px] -z-10 animate-pulse" />
            
            <div className="premium-logo-wrapper transform scale-125 sm:scale-150 lg:scale-[2] xl:scale-[2.2] translate-y-8 lg:translate-y-0 lg:-translate-x-12">
              <div className="premium-logo-container">
                <span className="premium-logo-emblem select-none">🏛️</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* High-Fidelity Interactive Dashboard Preview Mockup */}
      <section className="relative px-4 pb-16">
        <div className="relative max-w-5xl mx-auto reveal-zoom-in delay-1000">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/20 via-purple-500/10 to-blue-500/20 rounded-3xl blur-3xl opacity-30 -z-10" />
          
          <div className="glass rounded-[32px] border border-white/10 p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
            
            {/* Windows Chrome Bar */}
            <div className="flex items-center justify-between border-b border-white/5 pb-5 mb-6">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-red-500/60" />
                <span className="w-3.5 h-3.5 rounded-full bg-yellow-500/60" />
                <span className="w-3.5 h-3.5 rounded-full bg-green-500/60" />
                <span className="text-xs text-white/30 ml-4 font-mono select-none">loksetu.gov.in/portal/live</span>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-green-500/10 text-green-400 font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping shrink-0" />
                Live Network Status
              </span>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white/5 rounded-2xl p-5 border border-white/5 hover:border-primary-500/20 transition-all duration-300 text-left">
                <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Total Grievances Filed</p>
                <h3 className="text-3xl font-extrabold text-white mt-1 tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>12,840</h3>
                <span className="text-[10px] text-green-400 font-semibold block mt-1.5">↑ 14.8% Registered Resolves</span>
              </div>
              
              <div className="bg-white/5 rounded-2xl p-5 border border-white/5 hover:border-green-500/20 transition-all duration-300 text-left">
                <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Average Resolve Rate</p>
                <h3 className="text-3xl font-extrabold text-green-400 mt-1 tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>94.2%</h3>
                <span className="text-[10px] text-white/40 font-medium block mt-1.5">Top performing platform in Bengal</span>
              </div>

              <div className="bg-white/5 rounded-2xl p-5 border border-white/5 hover:border-blue-500/20 transition-all duration-300 text-left">
                <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Average Turnaround</p>
                <h3 className="text-3xl font-extrabold text-blue-400 mt-1 tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>&lt; 36 Hrs</h3>
                <span className="text-[10px] text-white/40 font-medium block mt-1.5">Supervised by Managing District Office</span>
              </div>
            </div>

            {/* Micro Live Map View block */}
            <div className="bg-dark-900/60 rounded-2xl border border-white/5 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
              <div className="flex items-center gap-3">
                <span className="text-3xl filter drop-shadow-md animate-bounce shrink-0 select-none">📍</span>
                <div>
                  <h4 className="text-sm font-bold text-white">Interactive District-Locking Enabled</h4>
                  <p className="text-xs text-white/40">Automatically synchronizes complaints to the 23 administrative West Bengal divisions.</p>
                </div>
              </div>
              <Link to="/register" className="text-xs font-bold text-primary-400 hover:text-primary-300 transition-colors whitespace-nowrap">
                Join Community Map →
              </Link>
            </div>
            
          </div>
        </div>
      </section>

      {/* Complaint Categories */}
      <section className="py-16 px-4 relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-block px-3 py-1 rounded-full bg-white/5 text-white/40 text-[10px] font-black tracking-widest uppercase mb-3">
              Scoped Infrastructure Areas
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Covering key public domains
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((c) => (
              <div 
                key={c.label} 
                className={`glass bg-gradient-to-br ${c.color} border p-6 rounded-2xl flex flex-col items-center justify-between text-center cursor-pointer transform duration-300 ${c.shadow} hover:-translate-y-1.5`}
              >
                <div className="text-5xl mb-4 filter drop-shadow-md select-none">{c.icon}</div>
                <div>
                  <p className={`font-bold text-sm tracking-wide uppercase ${c.text}`}>{c.label}</p>
                  {c.desc && <p className="text-[10px] text-white/50 mt-2 font-medium leading-relaxed">{c.desc}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Features Grid */}
      <section className="py-20 px-4 border-t border-white/5 relative bg-white/[0.01]">
        <div className="max-w-5xl mx-auto">
          
          <div className="text-center mb-16">
            <span className="inline-block px-3 py-1 rounded-full bg-primary-500/10 text-primary-400 text-[10px] font-black tracking-widest uppercase mb-3">
              Designed for impact
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
              State of the art civic tools
            </h2>
            <p className="text-sm text-white/40 mt-2 max-w-md mx-auto">
              Empowering local citizens with transparency and strict SLA management.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div 
                key={f.title} 
                className="glass p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-300 text-left hover:-translate-y-1 group"
              >
                <div className="text-4xl mb-4 bg-white/5 w-12 h-12 rounded-xl flex items-center justify-center border border-white/5 group-hover:scale-110 duration-300 select-none">
                  {f.icon}
                </div>
                <h3 className="font-bold text-white mb-2 tracking-wide text-base">{f.title}</h3>
                <p className="text-white/50 text-xs leading-relaxed font-medium">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modern Stats Banner */}
      <section className="py-16 px-4 border-t border-white/5 relative">
        <div className="max-w-4xl mx-auto">
          <div className="glass p-8 rounded-3xl border border-white/10 shadow-xl grid grid-cols-1 sm:grid-cols-3 gap-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 via-transparent to-blue-500/5 rounded-3xl -z-10" />
            
            {[['10K+', 'Active Citizens'], ['92.4%', 'Complaints Resolved'], ['< 24h', 'Response Speed']].map(([val, label]) => (
              <div key={label} className="flex flex-col justify-center py-2 sm:py-0">
                <p className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-amber-300 tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  {val}
                </p>
                <p className="text-[11px] font-black text-white/40 tracking-wider uppercase mt-1.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to action with glows */}
      <section className="py-24 px-4 text-center relative">
        <div className="max-w-2xl mx-auto glass p-12 rounded-[36px] border border-white/10 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <h2 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 mb-4 tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Ready to make a difference?
          </h2>
          <p className="text-white/50 mb-8 text-base max-w-md mx-auto leading-relaxed">
            Report issues, coordinate with other neighborhood upvotes, and monitor live official responses.
          </p>
          <Link 
            to="/register" 
            className="btn-primary text-base px-10 py-4 shadow-xl shadow-primary-500/20 hover:shadow-primary-500/35 inline-block hover:scale-[1.02] active:scale-95 transition-all duration-300"
          >
            Create Your Account →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 text-center text-white/30 text-xs font-medium tracking-wide">
        <p>© 2024 LokSetu · लोक सेतु · লোক সেতু · Supporting Digital India 🇮🇳</p>
      </footer>

    </div>
  );
}
