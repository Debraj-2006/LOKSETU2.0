import { useState } from 'react';
import { Phone, Search, Copy, Check, ShieldAlert, ArrowLeft, HeartHandshake, Shield, HelpCircle, Zap, Flame, UserCheck, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const HELPLINE_CATEGORIES = [
  {
    id: 'emergency',
    title: 'Emergency Services',
    description: 'First responders and critical crisis lines',
    icon: Flame,
    color: 'from-red-500 to-rose-400',
    contacts: [
      { name: 'National Emergency Response (ERSS)', number: '112', desc: 'Unified single number for police, fire, & medical emergencies.' },
      { name: 'West Bengal Police Control', number: '100', alt: '033-22143000', desc: 'Direct state-level law enforcement helpline.' },
      { name: 'Fire & Rescue Control', number: '101', alt: '033-22141516', desc: 'State fire services and disaster extraction squads.' },
      { name: 'Ambulance Command Services', number: '102', desc: 'Instant medical transport dispatch.' },
      { name: 'Disaster Management & Relief', number: '1070', alt: '033-22143526', desc: 'Natural calamity, storm damage, and rescue operations.' }
    ]
  },
  {
    id: 'women-child',
    title: 'Women & Child Safety',
    description: 'Special protection and support lines',
    icon: Shield,
    color: 'from-pink-500 to-purple-400',
    contacts: [
      { name: 'Childline Services', number: '1098', desc: '24/7 free emergency phone service for children in need of care and protection.' },
      { name: 'Women Helpline', number: '1091', alt: '181', desc: 'Confidential reporting and guidance line for women experiencing violence or abuse.' },
      { name: 'State Commission for Women', number: '033-23595609', desc: 'Official statutory support and legal legal guidance desk.' }
    ]
  },
  {
    id: 'civic-public',
    title: 'Grievance & Administration',
    description: 'Direct communication channels to departments',
    icon: UserCheck,
    color: 'from-amber-500 to-orange-400',
    contacts: [
      { name: 'Public Grievance Helpline (CMO)', number: '18003455555', desc: 'Chief Minister Office direct grievance redressal channel.' },
      { name: 'Consumer Affairs Department', number: '18003452808', desc: 'Assistance for consumer fraud, misleading ads, and unfair practices.' },
      { name: 'LokSetu Helpdesk Support', number: 'support@loksetu.org', isEmail: true, desc: 'LokSetu 2.0 system assistance and support team.' }
    ]
  },
  {
    id: 'health',
    title: 'Health & Medical Care',
    description: 'Healthcare schemes and assistance',
    icon: Heart,
    color: 'from-emerald-500 to-teal-400',
    contacts: [
      { name: 'State Health & Welfare Desk', number: '1800313444222', desc: 'General healthcare consultation, hospital beds, and queries.' },
      { name: 'Swasthya Sathi Helpline', number: '18003455384', desc: 'Dedicated helpline for the Swasthya Sathi state health insurance card.' },
      { name: 'Tele-MANAS Mental Health', number: '14416', desc: 'Round-the-clock anonymous mental health support and counseling.' }
    ]
  },
  {
    id: 'utilities',
    title: 'Power & Public Utilities',
    description: 'Electricity, grids, and civic systems',
    icon: Zap,
    color: 'from-yellow-500 to-amber-400',
    contacts: [
      { name: 'WBSEDCL (State Power Grid)', number: '19121', desc: 'Electricity breakdown, power failures, and smart meter issues.' },
      { name: 'CESC Customer Helpline', number: '1912', alt: '033-35011912', desc: 'Electricity support for Kolkata and adjoining areas.' },
      { name: 'Water Supply Grievance Desk', number: '18003455556', desc: 'Issues regarding local municipal water distribution lines.' }
    ]
  }
];

export default function Helplines() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (val, id) => {
    navigator.clipboard.writeText(val);
    setCopiedId(id);
    toast.success('Number copied to clipboard! 📋');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter contacts based on search query
  const filteredCategories = HELPLINE_CATEGORIES.map(cat => {
    const contacts = cat.contacts.filter(contact => 
      contact.name.toLowerCase().includes(search.toLowerCase()) ||
      contact.number.toLowerCase().includes(search.toLowerCase()) ||
      (contact.desc && contact.desc.toLowerCase().includes(search.toLowerCase()))
    );
    return { ...cat, contacts };
  }).filter(cat => cat.contacts.length > 0);

  return (
    <div className="min-h-[calc(100vh-64px)] relative py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background glow meshes */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Back navigation button */}
        <button
          onClick={() => navigate(profile?.role === 'admin' ? '/admin' : '/dashboard')}
          className="flex items-center gap-2 text-sm text-white/50 hover:text-white mb-8 group transition-colors"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span>Back to Dashboard</span>
        </button>

        {/* Immersive Welcome Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-500/10 border border-primary-500/20 rounded-full text-xs font-bold text-primary-400 uppercase tracking-widest mb-4">
            <HeartHandshake size={14} className="animate-pulse" />
            <span>Emergency Directory</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Helpline Directory
          </h1>
          <p className="text-white/40 text-base mt-3 leading-relaxed">
            Instant, direct assistance. Search public administration lines, crisis support, utility helplines, and emergency responders in West Bengal.
          </p>
        </div>

        {/* Elegant Search Bar Combo */}
        <div className="max-w-md mx-auto mb-16 relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-amber-500 rounded-2xl blur-md opacity-25 group-focus-within:opacity-40 transition-opacity" />
          <div className="relative bg-dark-900 border border-white/10 rounded-2xl flex items-center px-4 py-3 shadow-2xl">
            <Search className="text-white/30 mr-3 shrink-0" size={20} />
            <input
              type="text"
              placeholder="Search helpline name, category, number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-0 text-white placeholder-white/30 text-sm focus:outline-none w-full"
            />
          </div>
        </div>

        {/* Categories & Cards Grid */}
        {filteredCategories.length === 0 ? (
          <div className="glass rounded-3xl py-20 text-center max-w-md mx-auto">
            <p className="text-4xl mb-3">🔍</p>
            <h3 className="text-white font-extrabold text-lg mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>No Helplines Found</h3>
            <p className="text-white/40 text-sm px-6">We couldn't find any results matching your search terms. Double check the spelling or search for broader keywords.</p>
          </div>
        ) : (
          <div className="space-y-16">
            {filteredCategories.map((cat) => {
              const CategoryIcon = cat.icon;
              return (
                <div key={cat.id} className="space-y-6 animate-fade-in">
                  
                  {/* Category Header */}
                  <div className="flex items-start gap-4 pb-3 border-b border-white/5">
                    <div className={`p-3 rounded-2xl bg-gradient-to-br ${cat.color} text-white shadow-lg shrink-0`}>
                      <CategoryIcon size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
                        {cat.title}
                      </h2>
                      <p className="text-white/40 text-xs font-semibold mt-0.5">{cat.description}</p>
                    </div>
                  </div>

                  {/* Helpline Cards */}
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {cat.contacts.map((contact, idx) => {
                      const id = `${cat.id}-${idx}`;
                      return (
                        <div key={id} className="glass p-6 rounded-2xl border border-white/10 hover:border-white/20 hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
                          
                          {/* Inner glowing ambient spot */}
                          <div className={`absolute -top-12 -right-12 w-24 h-24 bg-gradient-to-br ${cat.color} rounded-full blur-2xl opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none`} />

                          <div>
                            <h3 className="font-extrabold text-white text-base tracking-tight leading-snug group-hover:text-primary-400 transition-colors" style={{ fontFamily: "'Outfit', sans-serif" }}>
                              {contact.name}
                            </h3>
                            <p className="text-white/50 text-xs leading-relaxed mt-2 font-medium">
                              {contact.desc}
                            </p>
                          </div>

                          {/* Action area */}
                          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between gap-3">
                            <div className="flex flex-col">
                              <span className="text-white/30 text-[9px] font-black uppercase tracking-wider">Helpline Contact</span>
                              <a
                                href={contact.isEmail ? `mailto:${contact.number}` : `tel:${contact.number}`}
                                className="text-white font-extrabold text-lg select-all hover:underline hover:text-white transition-colors"
                              >
                                {contact.number}
                              </a>
                            </div>

                            <div className="flex gap-2">
                              {/* Copy Button */}
                              <button
                                type="button"
                                onClick={() => handleCopy(contact.number, id)}
                                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors border border-white/5"
                                title="Copy helpline number"
                              >
                                {copiedId === id ? <Check size={14} className="text-green-400 animate-pulse" /> : <Copy size={14} />}
                              </button>

                              {/* Dial Button */}
                              <a
                                href={contact.isEmail ? `mailto:${contact.number}` : `tel:${contact.number}`}
                                className={`p-2 rounded-xl bg-gradient-to-br ${cat.color} text-white shadow-md hover:shadow-lg transition-transform hover:scale-105 shrink-0 flex items-center justify-center`}
                                title={contact.isEmail ? 'Send email' : 'Call now'}
                              >
                                <Phone size={14} />
                              </a>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
