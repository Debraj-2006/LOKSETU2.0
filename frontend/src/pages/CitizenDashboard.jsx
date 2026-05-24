import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../utils/firebaseClient';
import ComplaintCard from '../components/ComplaintCard';
import StatsCard from '../components/StatsCard';
import FilterBar from '../components/FilterBar';
import { PlusCircle, Loader2, MapPin, List, Globe, Navigation, ExternalLink, ArrowRight, Activity, HelpCircle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import toast from 'react-hot-toast';

// Fix default Leaflet marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const CATEGORY_ICONS = { electricity: '⚡', road: '🛣️', water: '💧', sanitation: '🚽', health_safety: '🏥', other: '📝' };
const STATUS_COLORS = {
  pending: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  in_progress: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  resolved: 'bg-green-500/20 text-green-300 border-green-500/30',
  cancelled: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
};

const getGreeting = () => {
  const hr = new Date().getHours();
  if (hr < 12) return 'Good morning';
  if (hr < 17) return 'Good afternoon';
  return 'Good evening';
};

export default function CitizenDashboard() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('my-complaints'); // 'my-complaints' or 'community-map'
  const [allComplaints, setAllComplaints] = useState([]);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [mapMode, setMapMode] = useState('pins'); // 'pins' or 'heatmap'
  
  // Dashboard view toggle state
  const [showGrievances, setShowGrievances] = useState(false);
  const grievancesSectionRef = useRef(null);

  // Realtime complaints fetch of ALL complaints in Firestore
  useEffect(() => {
    if (!profile) return;
    setLoading(true);

    const q = query(collection(db, 'complaints'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      // Sort by created_at desc in memory
      list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setAllComplaints(list);
      setLoading(false);
    }, (error) => {
      console.error('Realtime complaints fetch error:', error);
      setAllComplaints([]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  // Filter complaints based on the selected tab and filters
  const getFilteredComplaints = () => {
    let list = [...allComplaints];

    // Tab filtering
    if (activeTab === 'my-complaints') {
      list = list.filter((c) => c.citizen_id === profile?.id);
    } else {
      // Localized community feed: show complaints only in the citizen's registered district area
      const userArea = profile?.area || '';
      list = list.filter((c) => c.area && c.area.toLowerCase() === userArea.toLowerCase());
    }

    // Filter bar filtering
    if (filters.category) {
      list = list.filter((c) => c.category === filters.category);
    }
    if (filters.status) {
      list = list.filter((c) => c.status === filters.status);
    }

    return list;
  };

  const filteredComplaints = getFilteredComplaints();

  // Compute stats based on citizen's own complaints
  const myComplaints = allComplaints.filter((c) => c.citizen_id === profile?.id);
  const stats = {
    total:       myComplaints.length,
    pending:     myComplaints.filter((c) => c.status === 'pending').length,
    in_progress: myComplaints.filter((c) => c.status === 'in_progress').length,
    resolved:    myComplaints.filter((c) => c.status === 'resolved').length,
  };

  // Center coordinates for community map (fallback to Kolkata default or user's first complaint)
  const mapCenter = [22.5726, 88.3639];
  const complaintsWithLatLng = filteredComplaints.filter(c => c.latitude && c.longitude);

  // Dynamic Avatar Initials
  const initial = profile?.name ? profile.name.charAt(0).toUpperCase() : 'C';

  // Smooth scroll handler
  const handleViewGrievances = () => {
    setShowGrievances(true);
    setTimeout(() => {
      grievancesSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Route to the deployed Bill Analyzer application (dynamic: localhost in dev, firebase in prod)
  const analyzerUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5174'
    : 'https://wbsedcl-bill-analyzer.web.app';

  const handleGoToAnalyzer = async (e) => {
    e.preventDefault();
    const email = profile?.email || user?.email;
    if (!email) {
      toast.error('Ensure you are logged in with a valid email.');
      return;
    }
    const name = profile?.name || 'Citizen';
    const phone = profile?.phone || user?.phoneNumber || '';
    const timestamp = new Date().toISOString();
    const secret = "loksetu-shared-secret-key-2026";
    
    // Generate SHA-256 hash using browser's native Web Crypto API
    const msg = `${email}:${name}:${phone}:${timestamp}:${secret}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(msg);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    const ssoUrl = `${analyzerUrl}/sso?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}&timestamp=${encodeURIComponent(timestamp)}&hash=${hashHex}`;
    window.open(ssoUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="page-container relative animate-fade-in overflow-visible">
      {/* Absolute Ambient Glow Backdrops */}
      <div className="absolute top-[-10%] right-[-5%] w-[450px] h-[450px] bg-primary-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-[20%] left-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Modern Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 pb-6 border-b border-white/5">
        <div className="flex items-center gap-4 animate-slide-up">
          {/* Neon avatar container */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-amber-500 p-[1px] shadow-lg shadow-primary-500/20 hover:scale-105 transition-all duration-300">
            <div className="w-full h-full bg-dark-900 rounded-2xl flex items-center justify-center text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-amber-300" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {initial}
            </div>
          </div>
          <div>
            <h1 className="page-title leading-tight flex items-center gap-2">
              {getGreeting()}, {profile?.name || 'Citizen'}
            </h1>
            <p className="text-white/40 text-sm font-medium tracking-wide flex items-center gap-1.5 mt-0.5">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-ping shrink-0" />
              Active in <span className="text-white/70 font-semibold">{profile?.area || 'Kolkata'}</span>
            </p>
          </div>
        </div>

        {/* Premium administrative SLA Resolution metric card */}
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl py-2.5 px-4 flex items-center gap-3 backdrop-blur-md hover:border-primary-500/20 transition-all duration-300 animate-slide-up" style={{ animationDelay: '50ms' }}>
          <div className="w-9 h-9 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 font-extrabold select-none text-sm">
            ✓
          </div>
          <div className="text-left">
            <p className="text-white/40 text-[9px] font-black uppercase tracking-widest">Resolution Rate</p>
            <p className="text-xs font-bold text-white tracking-wide">94.8% SLA Target Met</p>
          </div>
        </div>
      </div>

      {/* Choice Hub Section */}
      <div className="mb-14 text-center max-w-4xl mx-auto space-y-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Where would you like to proceed today?
          </h2>
          <p className="text-white/40 text-sm mt-1.5">Select a digital console below to launch active services</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          {/* Card 1: Grievance Redressal (LokSetu) */}
          <div className="group relative glass p-6 sm:p-8 rounded-[2rem] border border-white/10 hover:border-primary-500/30 bg-gradient-to-br from-white/[0.01] to-white/[0.03] hover:bg-gradient-to-br hover:from-primary-500/[0.03] hover:to-transparent transition-all duration-500 hover:shadow-[0_20px_50px_rgba(249,115,22,0.08)] flex flex-col justify-between min-h-[300px]">
            {/* Corner amber neon spot */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-primary-500/25 transition-all duration-500" />
            
            <div className="space-y-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-3xl shadow-lg">
                🏛️
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-primary-300 transition-colors">
                Raise / Manage Complaints
              </h3>
              <p className="text-white/50 text-sm leading-relaxed">
                Report local issues such as power cuts, potholed roads, drainage leaks, or sanitation blocks. Monitor live resolutions, view public district reports, and collaborate on solutions.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-6 border-t border-white/5 relative z-10">
              <Link 
                to="/complaint/new" 
                className="btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-5 text-sm font-extrabold shadow-lg shadow-primary-500/20 active:scale-95 transition-all duration-300"
              >
                <PlusCircle size={15} /> Raise Complaint
              </Link>
              <button 
                onClick={handleViewGrievances}
                className="btn-secondary w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-5 text-sm font-extrabold active:scale-95 transition-all duration-300"
              >
                Track Grievances <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Card 2: Bill Analyzer */}
          <div className="group relative glass p-6 sm:p-8 rounded-[2rem] border border-white/10 hover:border-blue-500/30 bg-gradient-to-br from-white/[0.01] to-white/[0.03] hover:bg-gradient-to-br hover:from-blue-500/[0.03] hover:to-transparent transition-all duration-500 hover:shadow-[0_20px_50px_rgba(59,130,246,0.08)] flex flex-col justify-between min-h-[300px]">
            {/* Corner blue neon spot */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-blue-500/25 transition-all duration-500" />
            
            <div className="space-y-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-3xl shadow-lg">
                ⚡
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-blue-300 transition-colors">
                Go to Bill Analyzer
              </h3>
              <p className="text-white/50 text-sm leading-relaxed">
                Unlock deep insights into your electricity bills. Upload utility bills to simulate progressive tariff slabs, test local appliance loads, verify costs, and receive automated savings recommendations.
              </p>
            </div>

            <div className="pt-6 border-t border-white/5 relative z-10">
              <button 
                onClick={handleGoToAnalyzer}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 text-sm font-extrabold rounded-2xl border text-white transition-all duration-300 active:scale-95 bg-blue-600/20 border-blue-500/40 hover:bg-blue-600/30 hover:border-blue-500/60 shadow-lg shadow-blue-500/10 cursor-pointer"
              >
                Go to Bill Analyzer <ExternalLink size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conditionally Render Grievance Section */}
      {showGrievances && (
        <div ref={grievancesSectionRef} className="space-y-6 pt-10 border-t border-white/5 animate-fade-in">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-2xl font-black text-white flex items-center gap-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                🎯 Grievance Tracking Console
              </h3>
              <p className="text-white/40 text-xs mt-0.5">Manage filed petitions, verify timeline resolutions, or track public district feeds</p>
            </div>

            <button 
              onClick={() => setShowGrievances(false)}
              className="text-xs text-white/40 hover:text-white border border-white/10 hover:border-white/20 py-2 px-4 rounded-xl transition-all"
            >
              Hide Tracking Console
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard label="My Total"       value={stats.total}       icon="📋" color="primary" />
            <StatsCard label="Pending"     value={stats.pending}     icon="🟡" color="amber" />
            <StatsCard label="In Progress" value={stats.in_progress} icon="🔵" color="blue" />
            <StatsCard label="Resolved"    value={stats.resolved}    icon="🟢" color="green" />
          </div>

          {/* Premium Sliding Tabs Switcher */}
          <div className="flex flex-col sm:flex-row bg-slate-950/40 backdrop-blur-xl border border-white/5 rounded-[22px] p-1.5 w-full max-w-xl shadow-2xl">
            <button
              onClick={() => setActiveTab('my-complaints')}
              className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-[18px] text-xs sm:text-sm font-extrabold tracking-wide uppercase transition-all duration-300 whitespace-nowrap ${
                activeTab === 'my-complaints'
                  ? 'bg-gradient-to-r from-primary-500/20 via-primary-500/10 to-transparent border border-primary-500/30 text-primary-400 shadow-[0_8px_25px_rgba(249,115,22,0.12)]'
                  : 'text-white/40 hover:text-white/80 hover:bg-white/5 border border-transparent'
              }`}
            >
              <List size={16} className={activeTab === 'my-complaints' ? 'text-primary-400' : 'text-white/40'} />
              My Complaints ({myComplaints.length})
            </button>
            <button
              onClick={() => setActiveTab('community-map')}
              className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-[18px] text-xs sm:text-sm font-extrabold tracking-wide uppercase transition-all duration-300 whitespace-nowrap ${
                activeTab === 'community-map'
                  ? 'bg-gradient-to-r from-primary-500/20 via-primary-500/10 to-transparent border border-primary-500/30 text-primary-400 shadow-[0_8px_25px_rgba(249,115,22,0.12)]'
                  : 'text-white/40 hover:text-white/80 hover:bg-white/5 border border-transparent'
              }`}
            >
              <Globe size={16} className={activeTab === 'community-map' ? 'text-primary-400' : 'text-white/40'} />
              {profile?.area || 'District'} Feed & Map
            </button>
          </div>

          {/* Filters */}
          <div>
            <FilterBar filters={filters} onChange={setFilters} />
          </div>

          {/* Main Content Area */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 size={32} className="animate-spin text-primary-500" />
            </div>
          ) : activeTab === 'community-map' ? (
            <div className="space-y-6">
              {/* Community Map View */}
              <div className="glass rounded-3xl p-4 border border-white/10 overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 px-2">
                  <div>
                    <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                      📍 {profile?.area || 'District'} Grievance Map
                    </h3>
                    <p className="text-white/40 text-xs mt-0.5">Explore issues reported by fellow citizens in {profile?.area || 'your district'}</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    {/* Heatmap Toggle Selector */}
                    <div className="flex bg-slate-900 border border-white/5 rounded-xl p-1 shadow-inner self-end sm:self-auto">
                      <button
                        onClick={() => setMapMode('pins')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${mapMode === 'pins' ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20' : 'text-white/50 hover:text-white'}`}
                      >
                        📍 Standard Pins
                      </button>
                      <button
                        onClick={() => setMapMode('heatmap')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${mapMode === 'heatmap' ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' : 'text-white/50 hover:text-white'}`}
                      >
                        🔥 Density Heatmap
                      </button>
                    </div>
                    
                    <span className="text-xs px-2.5 py-2 rounded-xl bg-white/5 border border-white/5 text-white/60">
                      {complaintsWithLatLng.length} locations mapped
                    </span>
                  </div>
                </div>

                <div className="h-[450px] rounded-2xl overflow-hidden border border-white/10">
                  <MapContainer
                    center={mapCenter}
                    zoom={12}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='© <a href="https://openstreetmap.org">OpenStreetMap</a>'
                    />
                    {mapMode === 'pins' ? (
                      complaintsWithLatLng.map((c) => (
                        <Marker key={c.id} position={[c.latitude, c.longitude]}>
                          <Popup className="custom-leaflet-popup">
                            <div className="p-1 space-y-2 text-white max-w-[200px]">
                              <div className="flex items-center gap-1.5 font-bold text-sm">
                                <span className="text-lg">{CATEGORY_ICONS[c.category] || '📋'}</span>
                                <span className="capitalize">{c.category}</span>
                              </div>
                              <p className="text-xs text-white/70 line-clamp-3 leading-relaxed">
                                {c.description}
                              </p>
                              <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold capitalize ${STATUS_COLORS[c.status] || 'bg-white/10 text-white/60 border-white/20'}`}>
                                  {c.status.replace('_', ' ')}
                                </span>
                                <Link
                                  to={`/complaint/${c.id}`}
                                  className="text-xs text-primary-400 hover:text-primary-300 font-bold hover:underline"
                                >
                                  View Details →
                                </Link>
                              </div>
                            </div>
                          </Popup>
                        </Marker>
                      ))
                    ) : (
                      complaintsWithLatLng.map((c) => {
                        const upvotes = c.upvote_count || 0;
                        const radius = 50 + Math.min(upvotes * 15, 450);
                        const opacity = 0.25 + Math.min(upvotes * 0.02, 0.4);
                        
                        let strokeColor = '#4f46e5'; // primary/indigo
                        if (c.is_escalated) {
                          strokeColor = '#ef4444'; // red
                        } else if (c.is_petition) {
                          strokeColor = '#f59e0b'; // amber/gold
                        }

                        return (
                          <Circle
                            key={c.id}
                            center={[c.latitude, c.longitude]}
                            radius={radius}
                            pathOptions={{
                              color: strokeColor,
                              fillColor: strokeColor,
                              fillOpacity: opacity,
                              weight: 1,
                            }}
                          >
                            <Popup className="custom-leaflet-popup">
                              <div className="p-1 space-y-2 text-white max-w-[200px]">
                                <div className="flex items-center gap-1.5 font-bold text-sm">
                                  <span className="text-lg">{CATEGORY_ICONS[c.category] || '📋'}</span>
                                  <span className="capitalize text-amber-300 font-extrabold flex items-center gap-1">
                                    {upvotes} Support Density
                                  </span>
                                </div>
                                <p className="text-xs text-white/70 line-clamp-2 leading-relaxed">
                                  {c.description}
                                </p>
                                <div className="text-[10px] text-white/40 flex items-center gap-1">
                                  <span>📍 Radius: {radius}m</span>
                                  <span>•</span>
                                  <span>🔥 Density weight: {Math.round(opacity * 100)}%</span>
                                </div>
                                <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10">
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded-md border font-bold capitalize ${STATUS_COLORS[c.status] || 'bg-white/10 text-white/60 border-white/20'}`}>
                                    {c.status.replace('_', ' ')}
                                  </span>
                                  <Link
                                    to={`/complaint/${c.id}`}
                                    className="text-xs text-primary-400 hover:text-primary-300 font-bold hover:underline"
                                  >
                                    Details →
                                  </Link>
                                </div>
                              </div>
                            </Popup>
                          </Circle>
                        );
                      })
                    )}
                  </MapContainer>
                </div>
              </div>

              {/* List of Community Feed under Map */}
              <div>
                <h3 className="text-white font-semibold text-lg mb-4 px-2 flex items-center gap-2">
                  📣 Public Feed: {profile?.area || 'District'} Grievances
                </h3>
                {filteredComplaints.length === 0 ? (
                  <div className="glass rounded-3xl py-12 text-center">
                    <p className="text-white/40">No community complaints match your filter criteria</p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {filteredComplaints.map((c) => (
                      <ComplaintCard key={c.id} complaint={c} linkTo={`/complaint/${c.id}`} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* My Complaints Tab */
            filteredComplaints.length === 0 ? (
              <div className="glass rounded-3xl py-20 text-center">
                <p className="text-5xl mb-4">📭</p>
                <p className="text-white/50 font-medium">No complaints found</p>
                <p className="text-white/30 text-sm mt-1 mb-6">
                  {Object.keys(filters).length > 0 ? 'Try adjusting your filters' : 'Raise your first complaint to get started'}
                </p>
                {Object.keys(filters).length === 0 && (
                  <Link to="/complaint/new" className="btn-primary inline-flex items-center gap-2">
                    <PlusCircle size={15} /> Raise Complaint
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredComplaints.map((c) => (
                  <ComplaintCard key={c.id} complaint={c} linkTo={`/complaint/${c.id}`} />
                ))}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
