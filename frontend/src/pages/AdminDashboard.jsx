import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebaseClient';
import toast from 'react-hot-toast';
import AdminLayout from '../components/AdminLayout';
import StatsCard from '../components/StatsCard';
import StatusBadge from '../components/StatusBadge';
import FilterBar from '../components/FilterBar';
import ComplaintCard from '../components/ComplaintCard';
import { Loader2, AlertTriangle, BarChart3, ShieldCheck } from 'lucide-react';

const DEPT_TABS = [
  { id: '', label: '🏛️ All Depts' },
  { id: 'PWD Road Dept', label: '🛣️ PWD Roads' },
  { id: 'Water Supply Board', label: '💧 Water Board' },
  { id: 'Electricity Board', label: '⚡ Electricity' },
  { id: 'Sanitation Board', label: '🚮 Sanitation' },
  { id: 'General Administration', label: '📋 General Admin' },
];

const CATEGORY_META = {
  electricity:   { label: 'Electricity',     icon: '⚡', color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20' },
  road:          { label: 'Roads',           icon: '🛣️', color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20'   },
  water:         { label: 'Water',           icon: '💧', color: 'text-cyan-400',   bg: 'bg-cyan-500/10',   border: 'border-cyan-500/20'  },
  sanitation:    { label: 'Sanitation',      icon: '🚮', color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20' },
  health_safety: { label: 'Health & Safety', icon: '🏥', color: 'text-pink-400',   bg: 'bg-pink-500/10',   border: 'border-pink-500/20'  },
  other:         { label: 'Other',           icon: '📝', color: 'text-white/50',   bg: 'bg-white/5',       border: 'border-white/10'     },
};

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats]     = useState({});
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeDept, setActiveDept] = useState('');
  const [page, setPage]       = useState(1);
  const [total, setTotal]     = useState(0);
  const LIMIT = 20;

  const fetchDashboardData = async () => {
    if (!profile?.area) return;
    setLoading(true);
    try {
      // 1. Fetch ALL complaints from the 'complaints' collection
      const complaintsCol = collection(db, 'complaints');
      const snapshot = await getDocs(complaintsCol);
      const allComplaints = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // 2. Filter by Admin's district (area)
      const adminArea = profile.area;
      let localComplaints = allComplaints.filter(
        c => c.area && c.area.toLowerCase() === adminArea.toLowerCase()
      );

      // 3. Compute Stats
      const categoryCounts = { electricity: 0, road: 0, water: 0, sanitation: 0, health_safety: 0, other: 0 };
      localComplaints.forEach((c) => {
        const cat = c.category;
        if (cat && categoryCounts[cat] !== undefined) {
          categoryCounts[cat]++;
        } else if (cat) {
          categoryCounts.other++;
        }
      });

      const computedStats = {
        total: localComplaints.length,
        pending: localComplaints.filter((c) => c.status === 'pending').length,
        in_progress: localComplaints.filter((c) => c.status === 'in_progress').length,
        resolved: localComplaints.filter((c) => c.status === 'resolved').length,
        cancelled: localComplaints.filter((c) => c.status === 'cancelled').length,
        escalated: localComplaints.filter((c) => c.is_escalated).length,
        categoryCounts,
        adminArea
      };
      setStats(computedStats);

      // 4. Apply Filters (category, status, escalated, assigned_department)
      let filtered = [...localComplaints];
      if (filters.category) {
        filtered = filtered.filter(c => c.category === filters.category);
      }
      if (filters.status) {
        filtered = filtered.filter(c => c.status === filters.status);
      }
      if (filters.escalated) {
        filtered = filtered.filter(c => c.is_escalated === true);
      }
      if (activeDept) {
        filtered = filtered.filter(c => c.assigned_department === activeDept);
      }

      // 5. Sort: Escalated first, then Petitions, then Upvote count, then date desc. Resolved/Cancelled at bottom.
      filtered.sort((a, b) => {
        const aResolved = ['resolved', 'cancelled'].includes(a.status);
        const bResolved = ['resolved', 'cancelled'].includes(b.status);
        
        if (aResolved !== bResolved) {
          return aResolved ? 1 : -1;
        }

        const aEscalated = a.is_escalated && !aResolved;
        const bEscalated = b.is_escalated && !bResolved;
        if (aEscalated !== bEscalated) {
          return bEscalated ? -1 : 1;
        }

        const aPetition = a.is_petition && !aResolved;
        const bPetition = b.is_petition && !bResolved;
        if (aPetition !== bPetition) {
          return bPetition ? -1 : 1;
        }

        if ((b.upvote_count || 0) !== (a.upvote_count || 0)) {
          return (b.upvote_count || 0) - (a.upvote_count || 0);
        }

        return new Date(b.created_at) - new Date(a.created_at);
      });

      // 6. Map format to what ComplaintCard expects (profiles mapping)
      const formatted = filtered.map(c => ({
        ...c,
        profiles: {
          name: c.citizen_name,
          phone: c.citizen_phone,
          area: c.area
        }
      }));

      setTotal(formatted.length);

      // 7. Paginate
      const offset = (page - 1) * LIMIT;
      setComplaints(formatted.slice(offset, offset + LIMIT));

    } catch (error) {
      console.error('Error fetching complaints:', error);
      toast.error('Failed to load dashboard data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setPage(1); }, [filters, activeDept]);
  useEffect(() => { fetchDashboardData(); }, [profile, filters, activeDept, page]);

  const totalPages   = Math.ceil(total / LIMIT);
  const activeCounts = stats.categoryCounts || {};
  const activeTotal  = stats.total || 0;
  const topCategory  = Object.entries(activeCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  return (
    <AdminLayout>
      <div className="page-container relative animate-fade-in overflow-visible">

        {/* Ambient glow — red toned */}
        <div className="absolute top-[-10%] right-[-5%] w-[450px] h-[450px] rounded-full blur-[120px] pointer-events-none -z-10"
          style={{ background: 'rgba(220,38,38,0.06)' }} />
        <div className="absolute bottom-[20%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none -z-10"
          style={{ background: 'rgba(185,28,28,0.04)' }} />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 pb-6 border-b border-white/5">
          <div className="flex items-center gap-4">
            {/* Red admin avatar */}
            <div className="w-14 h-14 rounded-2xl p-[1px] shadow-lg hover:scale-105 transition-all duration-300"
              style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)', boxShadow: '0 8px 20px rgba(220,38,38,0.25)' }}>
              <div className="w-full h-full bg-dark-900 rounded-2xl flex items-center justify-center text-xl font-black"
                style={{ color: '#f87171', fontFamily: "'Outfit', sans-serif" }}>
                {profile?.name?.[0]?.toUpperCase() || 'A'}
              </div>
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text"
                style={{ backgroundImage: 'linear-gradient(135deg, #fff 0%, #fecaca 60%, #f87171 100%)', fontFamily: "'Outfit', sans-serif" }}>
                Admin Portal
              </h1>
              <p className="text-white/40 text-sm font-medium flex items-center gap-1.5 mt-0.5">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                District: <span className="text-white/70 font-semibold ml-1">{profile?.area || '—'}</span>
              </p>
            </div>
          </div>

          {/* Authorized badge */}
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl py-2.5 px-4 flex items-center gap-3 backdrop-blur-md transition-all duration-300 hover:border-red-500/20">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)' }}>
              <ShieldCheck size={16} style={{ color: '#f87171' }} />
            </div>
            <div className="text-left">
              <p className="text-white/40 text-[9px] font-black uppercase tracking-widest">Access Level</p>
              <p className="text-xs font-bold text-white tracking-wide">AUTHORIZED ACCESS</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-10">
          <StatsCard label="Total"       value={stats.total       ?? '—'} icon="📋" color="red"   />
          <StatsCard label="Pending"     value={stats.pending     ?? '—'} icon="🟡" color="amber" />
          <StatsCard label="In Progress" value={stats.in_progress ?? '—'} icon="🔵" color="blue"  />
          <StatsCard label="Resolved"    value={stats.resolved    ?? '—'} icon="🟢" color="green" />
          <StatsCard label="Cancelled"   value={stats.cancelled   ?? '—'} icon="⚫" color="gray"  />
          <StatsCard label="Escalated"   value={stats.escalated   ?? '—'} icon="🔴" color="red"
            sub={stats.escalated > 0 ? 'Need attention' : undefined} />
        </div>

        {/* Escalation alert banner */}
        {stats.escalated > 0 && (
          <button onClick={() => setFilters(prev => ({ ...prev, escalated: true }))}
            className="w-full flex items-center gap-3 p-4 rounded-2xl mb-6 text-left transition-all hover:-translate-y-0.5"
            style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}>
            <AlertTriangle size={18} style={{ color: '#f87171' }} className="shrink-0 animate-pulse" />
            <div className="flex-1">
              <p className="font-bold text-sm" style={{ color: '#f87171' }}>
                {stats.escalated} escalated complaint{stats.escalated > 1 ? 's' : ''} require immediate attention
              </p>
              <p className="text-xs text-white/40 mt-0.5">Click to filter and view escalated grievances →</p>
            </div>
          </button>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Complaints */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filters card */}
            <div className="glass rounded-3xl p-5">
              {/* Department tab row */}
              <div className="flex gap-2 overflow-x-auto pb-3 mb-4 border-b border-white/5">
                {DEPT_TABS.map(dept => (
                  <button key={dept.id}
                    onClick={() => setActiveDept(dept.id)}
                    className={`px-4 py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all duration-200 border ${
                      activeDept === dept.id
                        ? 'text-red-400 border-red-500/30'
                        : 'text-white/50 border-transparent hover:text-white/80 hover:bg-white/5'
                    }`}
                    style={activeDept === dept.id ? {
                      background: 'linear-gradient(to right, rgba(220,38,38,0.15), rgba(185,28,28,0.08))',
                      boxShadow: '0 4px 16px rgba(220,38,38,0.1)'
                    } : {}}>
                    {dept.label}
                  </button>
                ))}
              </div>

              <FilterBar filters={filters} onChange={setFilters} showEscalated />
            </div>

            {/* Count label */}
            <div className="flex items-center justify-between px-1">
              <p className="text-sm text-white/40 font-medium">
                <span className="text-red-400 font-bold">{total}</span> complaints in queue
              </p>
              <p className="text-xs text-white/30 uppercase tracking-wider font-bold">Priority Sorted</p>
            </div>

            {/* Complaint cards */}
            {loading ? (
              <div className="glass rounded-3xl flex justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 size={32} className="animate-spin" style={{ color: '#ef4444' }} />
                  <p className="text-sm text-white/30">Loading complaints...</p>
                </div>
              </div>
            ) : complaints.length === 0 ? (
              <div className="glass rounded-3xl py-20 text-center space-y-3">
                <p className="text-4xl">📭</p>
                <p className="text-white/40">No complaints match your filters</p>
                <button onClick={() => { setFilters({}); setActiveDept(''); }}
                  className="text-sm font-bold hover:underline" style={{ color: '#f87171' }}>
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {complaints.map(c => (
                  <Link key={c.id} to={`/admin/complaint/${c.id}`} className="block group">
                    <ComplaintCard complaint={c} isAdmin />
                  </Link>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 pt-2">
                <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
                  className="btn-secondary py-2 px-5 text-sm disabled:opacity-30">← Prev</button>
                <span className="text-sm text-white/40">Page {page} of {totalPages}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}
                  className="btn-secondary py-2 px-5 text-sm disabled:opacity-30">Next →</button>
              </div>
            )}
          </div>

          {/* Right: Grievance Poll / Category breakdown */}
          <div className="space-y-5">
            {/* District Poll Card */}
            <div className="glass rounded-3xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-white font-bold text-base">Locality Grievance Poll</h3>
                  <p className="text-white/40 text-xs mt-0.5">What type of issue is reported most?</p>
                </div>
                <span className="text-2xl">📊</span>
              </div>

              {/* District badge */}
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl mb-5"
                style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.15)' }}>
                <span className="text-red-400 text-sm">📍</span>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'rgba(252,165,165,0.5)' }}>
                    Assigned District Jurisdiction
                  </p>
                  <p className="text-sm font-bold" style={{ color: '#fca5a5' }}>
                    {stats.adminArea || profile?.area || '—'}
                  </p>
                </div>
              </div>

              {/* Category bars */}
              <div className="space-y-4">
                {Object.entries(CATEGORY_META).map(([key, meta]) => {
                  const count = activeCounts[key] || 0;
                  const pct   = activeTotal > 0 ? Math.round((count / activeTotal) * 100) : 0;
                  const isTop = key === topCategory && count > 0;
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-sm ${meta.bg} ${meta.border} border`}>
                            {meta.icon}
                          </div>
                          <span className={`text-sm font-semibold ${meta.color}`}>{meta.label}</span>
                          {isTop && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded"
                              style={{ background: 'rgba(220,38,38,0.12)', color: '#f87171', border: '1px solid rgba(220,38,38,0.2)' }}>
                              TOP
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-bold text-white/50">{count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden bg-white/5">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${pct}%`,
                            background: isTop
                              ? 'linear-gradient(90deg, #dc2626, #ef4444)'
                              : 'rgba(255,255,255,0.15)'
                          }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Resolution Metrics */}
            <div className="glass rounded-3xl p-6">
              <h3 className="text-white font-bold text-base mb-4 flex items-center gap-2">
                <BarChart3 size={16} style={{ color: '#f87171' }} /> Resolution Metrics
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Resolution Rate', value: activeTotal > 0 ? `${Math.round(((stats.resolved || 0) / activeTotal) * 100)}%` : '—', color: 'text-green-400' },
                  { label: 'Pending Ratio',   value: activeTotal > 0 ? `${Math.round(((stats.pending || 0) / activeTotal) * 100)}%` : '—',  color: 'text-amber-400' },
                  { label: 'Escalation Rate', value: activeTotal > 0 ? `${Math.round(((stats.escalated || 0) / activeTotal) * 100)}%` : '—', color: 'text-red-400'   },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-white/5">
                    <span className="text-sm text-white/50">{label}</span>
                    <span className={`text-lg font-extrabold ${color}`} style={{ fontFamily: "'Outfit', sans-serif" }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
