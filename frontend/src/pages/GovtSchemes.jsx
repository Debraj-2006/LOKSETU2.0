import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../utils/firebaseClient';
import toast from 'react-hot-toast';
import { PlusCircle, Trash2, ExternalLink, Search, Loader2, BookOpen, HeartPulse, Landmark, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';

const DEPARTMENTS = [
  { id: '', label: 'All Schemes', icon: '🏛️' },
  { id: 'Education & Youth', label: 'Education & Youth', icon: '🎓' },
  { id: 'Health & Family Welfare', label: 'Health & Family', icon: '🏥' },
  { id: 'Social Welfare & Women Development', label: 'Social & Women Welfare', icon: '👩' },
  { id: 'Agriculture & Food Supply', label: 'Agriculture', icon: '🌾' },
  { id: 'Housing & Urban Infrastructure', label: 'Housing & Infrastructure', icon: '🏠' },
  { id: 'Employment & Skills', label: 'Employment & Skill', icon: '💼' },
  { id: 'Other', label: 'Other Schemes', icon: '📝' },
];

export default function GovtSchemes() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeDept, setActiveDept] = useState('');
  const [expandedScheme, setExpandedScheme] = useState(null);

  // Admin announcement modal state
  const [showModal, setShowModal] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    department: 'Education & Youth',
    eligibility: '',
    benefits: '',
    apply_link: ''
  });

  const fetchSchemes = async () => {
    setLoading(true);
    try {
      const schemesCol = collection(db, 'schemes');
      const snapshot = await getDocs(schemesCol);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setSchemes(list);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load government schemes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemes();
  }, []);

  const handleCreateScheme = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.department) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitLoading(true);
    try {
      const newScheme = {
        ...form,
        created_at: new Date().toISOString(),
      };
      const schemesCol = collection(db, 'schemes');
      const docRef = await addDoc(schemesCol, newScheme);
      
      toast.success('Scheme announced successfully! 📢');
      setSchemes([{ id: docRef.id, ...newScheme }, ...schemes]);
      setShowModal(false);
      setForm({
        title: '',
        description: '',
        department: 'Education & Youth',
        eligibility: '',
        benefits: '',
        apply_link: ''
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to announce scheme');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteScheme = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to remove this scheme?')) return;

    try {
      const schemeDocRef = doc(db, 'schemes', id);
      await deleteDoc(schemeDocRef);
      toast.success('Scheme removed successfully');
      setSchemes(schemes.filter(s => s.id !== id));
      if (expandedScheme === id) setExpandedScheme(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete scheme');
    }
  };

  const toggleExpand = (id) => {
    setExpandedScheme(expandedScheme === id ? null : id);
  };

  // Filter schemes
  const filteredSchemes = schemes.filter(s => {
    const matchSearch = s.title.toLowerCase().includes(search.toLowerCase()) || 
                        s.description.toLowerCase().includes(search.toLowerCase()) ||
                        (s.benefits && s.benefits.toLowerCase().includes(search.toLowerCase())) ||
                        (s.eligibility && s.eligibility.toLowerCase().includes(search.toLowerCase()));
    const matchDept = activeDept === '' || s.department === activeDept;
    return matchSearch && matchDept;
  });

  return (
    <div className="page-container relative animate-fade-in overflow-visible">
      {/* Glow backgrounds */}
      <div className="absolute top-[-10%] right-[-5%] w-[450px] h-[450px] bg-primary-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-[20%] left-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 pb-6 border-b border-white/5">
        <div>
          <h1 className="page-title flex items-center gap-2">
            🏛️ Government Schemes
          </h1>
          <p className="text-white/40 text-sm mt-1">Discover, read, and apply for recently announced state and district welfare schemes</p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary inline-flex items-center gap-2 self-start sm:self-auto py-2.5 px-5 shadow-lg shadow-primary-500/20"
          >
            <PlusCircle size={16} /> Announce Scheme
          </button>
        )}
      </div>

      {/* Search and Quick Filters */}
      <div className="space-y-6 mb-8">
        <div className="relative max-w-xl">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Search schemes by title, keyword, eligibility..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-12 pr-5 py-3"
          />
        </div>

        {/* Department tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 border-b border-white/5">
          {DEPARTMENTS.map(dept => (
            <button
              key={dept.id}
              onClick={() => setActiveDept(dept.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all duration-300 border ${
                activeDept === dept.id
                  ? 'text-primary-400 border-primary-500/30 bg-primary-500/10 shadow-lg shadow-primary-500/5'
                  : 'text-white/50 border-transparent hover:text-white/80 hover:bg-white/5'
              }`}
            >
              <span className="mr-1.5">{dept.icon}</span>
              {dept.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main content grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={32} className="animate-spin text-primary-500" />
        </div>
      ) : filteredSchemes.length === 0 ? (
        <div className="glass rounded-3xl py-20 text-center space-y-3">
          <p className="text-4xl">📭</p>
          <p className="text-white/40">No government schemes announced matching your criteria.</p>
          {search || activeDept ? (
            <button onClick={() => { setSearch(''); setActiveDept(''); }} className="text-sm text-primary-400 font-bold hover:underline">
              Clear all filters
            </button>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-5">
          {filteredSchemes.map((scheme) => {
            const isExpanded = expandedScheme === scheme.id;
            return (
              <div
                key={scheme.id}
                onClick={() => toggleExpand(scheme.id)}
                className={`group glass p-6 border rounded-3xl cursor-pointer transition-all duration-500 hover:shadow-2xl border-white/10 hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.05]`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-primary-500/10 text-primary-400 border border-primary-500/20 px-3 py-1 rounded-xl font-bold tracking-wide uppercase text-[10px]">
                        {scheme.department}
                      </span>
                      <span className="text-[10px] text-white/40 font-medium">
                        Announced: {new Date(scheme.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight group-hover:text-primary-300 transition-colors">
                      {scheme.title}
                    </h3>
                    <p className={`text-white/70 text-sm leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                      {scheme.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {isAdmin && (
                      <button
                        onClick={(e) => handleDeleteScheme(scheme.id, e)}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 rounded-xl transition-all duration-300"
                        title="Delete Scheme"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                    <div className="text-white/40 group-hover:text-white transition-colors">
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up text-left">
                    <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
                      <h4 className="text-sm font-bold text-primary-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        🌟 Key Benefits
                      </h4>
                      <p className="text-white/80 text-sm leading-relaxed whitespace-pre-line">
                        {scheme.benefits}
                      </p>
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
                      <h4 className="text-sm font-bold text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        📋 Eligibility Criteria
                      </h4>
                      <p className="text-white/80 text-sm leading-relaxed whitespace-pre-line">
                        {scheme.eligibility}
                      </p>
                    </div>

                    {scheme.apply_link && (
                      <div className="md:col-span-2 flex justify-end">
                        <a
                          href={scheme.apply_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="btn-primary inline-flex items-center gap-2 px-6 py-3 shadow-lg shadow-primary-500/10 hover:scale-[1.02] active:scale-95 transition-all duration-300"
                        >
                          Official Apply Portal <ExternalLink size={14} />
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Announcement Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl text-left animate-slide-up max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-white tracking-tight mb-2">📢 Announce Government Scheme</h3>
            <p className="text-white/40 text-xs mb-6">Create a scheme detailing eligibility, welfare benefits, and link official registration portals.</p>

            <form onSubmit={handleCreateScheme} className="space-y-4">
              <div>
                <label className="label">Scheme Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sabooj Sathi Cycle Distribution"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Department *</label>
                  <select
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="input py-3 pl-4 pr-10 cursor-pointer appearance-none outline-none"
                  >
                    {DEPARTMENTS.slice(1).map(dept => (
                      <option key={dept.id} value={dept.id} className="bg-slate-900 text-white">
                        {dept.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Official Apply Link (URL)</label>
                  <input
                    type="url"
                    placeholder="https://official-portal.gov.in"
                    value={form.apply_link}
                    onChange={(e) => setForm({ ...form, apply_link: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">Scheme Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Summarize the core focus, aim, and announcements of this scheme..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Key Benefits</label>
                  <textarea
                    rows={4}
                    placeholder="Provide a lists of benefits:&#10;- ₹25,000 one-time grant&#10;- High school female student stipend"
                    value={form.benefits}
                    onChange={(e) => setForm({ ...form, benefits: e.target.value })}
                    className="input resize-none"
                  />
                </div>

                <div>
                  <label className="label">Eligibility Criteria</label>
                  <textarea
                    rows={4}
                    placeholder="Describe eligibility conditions:&#10;- Unmarried girls aged 13-18&#10;- Family income less than ₹1.2 Lakhs"
                    value={form.eligibility}
                    onChange={(e) => setForm({ ...form, eligibility: e.target.value })}
                    className="input resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary py-2.5 px-5 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="btn-primary py-2.5 px-6 text-sm"
                >
                  {submitLoading ? <Loader2 size={16} className="animate-spin" /> : 'Announce'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
