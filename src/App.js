import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { 
  Search, Map as MapIcon, Shield, X, LogOut, CheckCircle, AlertCircle, 
  ClipboardList, UserPlus, History, ChevronRight, User, 
  BarChart2, Calendar, PlusCircle, Edit2, Save, ArrowRight, 
  TrendingUp, Target, Activity, AlertTriangle, FileText
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ==========================================
// 1. CONFIGURATION
// ==========================================
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw5JxCupI52bftlLMTvQtw3cdCdgb8_FKzyifm9w-MzI2crT0Nk6SsdH0haapPv0Heq/exec"; 

// 10 SDO Jurisdictions (Pre-defined for Admin Mapping)
const SDO_JURISDICTIONS = [
    "Coimbatore Sub-Division",
    "Trichy Sub-Division",
    "Madurai Sub-Division", 
    "Thanjavur Sub-Division",
    "Salem Sub-Division",
    "Erode Sub-Division",
    "Karur Sub-Division",
    "Tirunelveli Sub-Division",
    "Vellore Sub-Division",
    "Dharmapuri Sub-Division"
];

// ==========================================
// 2. STYLING & ANIMATIONS
// ==========================================
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap');

  body { margin: 0; font-family: 'Inter', sans-serif; overflow: hidden; background: #f8fafc; color: #1e293b; }
  
  /* UTILS */
  .glass-panel { background: rgba(255, 255, 255, 0.98); backdrop-filter: blur(20px); border-top: 1px solid rgba(0,0,0,0.05); box-shadow: 0 -10px 40px rgba(0,0,0,0.1); border-radius: 24px 24px 0 0; }
  .modern-input { width: 100%; padding: 12px 16px; border-radius: 8px; border: 1px solid #cbd5e1; background: #f8fafc; outline: none; transition: all 0.2s; font-size: 14px; color: #334155; }
  .modern-input:focus { border-color: #2563eb; background: white; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }
  .status-badge { padding: 4px 10px; border-radius: 20px; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
  
  /* SPLASH SCREEN */
  .splash-container { height: 100vh; width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: #0f172a; background-image: radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(225,39%,30%,1) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(339,49%,30%,1) 0, transparent 50%); background-size: cover; position: relative; padding: 20px; box-sizing: border-box; }
  .splash-container::before { content: ""; position: absolute; inset: 0; background-image: linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px); background-size: 40px 40px; pointer-events: none; }
  .splash-card { background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.15); box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5); border-radius: 24px; padding: 60px 40px; text-align: center; z-index: 10; max-width: 500px; width: 100%; color: white; animation: fadeInUp 0.8s ease-out forwards; }
  
  /* LOGO FIX */
  .logo-container { 
    background: white; 
    width: 110px; 
    height: 110px; 
    border-radius: 50%; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    margin: 0 auto 30px; 
    box-shadow: 0 10px 30px rgba(0,0,0,0.3), inset 0 0 20px rgba(0,0,0,0.05);
    border: 4px solid rgba(255,255,255,0.2);
  }
  .splash-btn { background: #3b82f6; color: white; padding: 16px 0; width: 100%; border-radius: 12px; border: none; font-weight: 700; font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: all 0.2s; margin-top: 30px; text-transform: uppercase; letter-spacing: 1px; }
  
  /* DASHBOARD CREATIVE */
  .dash-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-bottom: 24px; }
  .dash-card { background: white; padding: 20px; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); border: 1px solid #f1f5f9; position: relative; overflow: hidden; }
  .dash-card::after { content: ''; position: absolute; top: 0; right: 0; width: 80px; height: 80px; background: linear-gradient(135deg, transparent 50%, rgba(59, 130, 246, 0.05) 50%); border-radius: 0 0 0 100%; }
  
  .officer-row { display: flex; align-items: center; padding: 16px; margin-bottom: 12px; background: white; border-radius: 16px; border: 1px solid #f1f5f9; transition: transform 0.2s; }
  .officer-row:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.03); border-color: #e2e8f0; }
  
  .progress-track { width: 100%; height: 6px; background: #f1f5f9; border-radius: 3px; margin-top: 8px; overflow: hidden; }
  .progress-fill { height: 100%; border-radius: 3px; transition: width 1s cubic-bezier(0.4, 0, 0.2, 1); }

  /* ANIMATIONS */
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
  
  /* SCROLLBAR */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  .filter-select { padding: 8px 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 13px; font-weight: 600; outline: none; color: #334155; background: white; }
  .user-list-item { display: flex; align-items: center; justify-content: space-between; padding: 12px; border-bottom: 1px solid #f1f5f9; background: white; }
  .edit-btn { background: #eff6ff; color: #2563eb; border: none; padding: 8px; borderRadius: 8px; cursor: pointer; }
  .map-search { position: absolute; top: 20px; left: 20px; right: 20px; z-index: 500; }
`;

// Leaflet Fixes
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});
const createPin = (color) => L.divIcon({
  html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.3);"></div>`,
  className: 'custom-pin',
  iconSize: [24, 24], iconAnchor: [12, 12]
});

// ==========================================
// 3. WORKFLOW ENGINE
// ==========================================

const getRank = (role) => {
    if(role === 'SDO') return 1;
    if(role === 'EE') return 2;
    if(role === 'SE') return 3;
    if(role === 'CE') return 4;
    return 0; 
};

// --- LOGIC: SDO compiles ALL -> EE -> SE -> CE ---
const getNextStatus = (currentStatus, inspectorRole) => {
    if(currentStatus === 'Pending Compliance') return 'Pending EE';
    if(currentStatus === 'Pending EE') {
        const inspectorRank = getRank(inspectorRole);
        if(inspectorRank <= 2) return 'Closed'; 
        return 'Pending SE';
    }
    if(currentStatus === 'Pending SE') {
        const inspectorRank = getRank(inspectorRole);
        if(inspectorRank <= 3) return 'Closed';
        return 'Pending CE';
    }
    if(currentStatus === 'Pending CE') {
        return 'Closed';
    }
    return currentStatus;
};

// ==========================================
// 4. COMPONENTS
// ==========================================

const MapController = ({ center }) => {
  const map = useMap();
  useEffect(() => { if (center) map.flyTo(center, 12, { duration: 1.5 }); }, [center, map]);
  return null;
};

const Header = ({ user, onLogout }) => (
  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', padding: '12px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
      <div style={{ background: 'white', padding: '4px', borderRadius: '50%', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
          <img src="https://cwc.gov.in/sites/default/files/cwc-logo.png" alt="CWC" style={{ width: '40px', height: '40px', objectFit: 'contain' }} onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/40?text=CWC'; }} />
      </div>
      <div><div style={{ fontSize: '15px', fontWeight: '900', color: '#1e3a8a', lineHeight: 1.1 }}>Central Water Commission</div><div style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cauvery & Southern Rivers Org.</div></div>
    </div>
    <button onClick={onLogout} style={{ background: '#f1f5f9', border: 'none', padding: '10px', borderRadius: '50%', cursor: 'pointer', transition: 'background 0.2s' }}><LogOut size={18} color="#64748b" /></button>
  </div>
);

// --- DASHBOARD ---
const Dashboard = ({ data }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const monthlyReports = useMemo(() => {
    return data.reports.filter(r => {
        const d = new Date(r.date);
        return d.getFullYear() === parseInt(selectedYear) && d.getMonth() === parseInt(selectedMonth);
    });
  }, [data.reports, selectedYear, selectedMonth]);

  const officerStats = useMemo(() => {
     if(!data.officers) return [];
     return data.officers
        .filter(o => o.level !== 'ADMIN')
        .map(o => {
            const myReports = monthlyReports.filter(r => r.officer === o.name);
            const totalSites = data.sites.length; 
            
            let targetMin = 0;
            let targetLabel = "";
            
            if(o.level === 'EE') { targetMin = 3; targetLabel = "Target: 3-5"; } 
            else if (o.level === 'SE') { targetMin = 3; targetLabel = "Target: 3-4"; } 
            else if (o.level === 'SDO' || o.level === 'AEE') { targetMin = Math.ceil(totalSites * 0.33); targetLabel = `Target: ~${targetMin} (33%)`; } 
            else if (o.level === 'JE') { targetMin = totalSites; targetLabel = `Target: ${totalSites} (100%)`; } 
            else { targetLabel = "As Required"; }

            const percentage = targetMin > 0 ? Math.min(100, (myReports.length / targetMin) * 100) : 100;
            let color = percentage >= 100 ? "#10b981" : percentage >= 50 ? "#f59e0b" : "#ef4444";

            return { name: o.name, desig: o.designation, level: o.level, count: myReports.length, targetLabel, percentage, color };
        })
        .sort((a,b) => b.percentage - a.percentage); 
  }, [data.officers, monthlyReports, data.sites.length]);

  return (
    <div style={{ padding: '24px', paddingBottom: '100px', height: '100%', overflowY: 'auto', background: '#f8fafc' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#1e293b', margin: 0 }}>Inspection Analytics</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                  <select className="filter-select" value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)}>{months.map((m, i) => <option key={i} value={i}>{m}</option>)}</select>
                  <select className="filter-select" value={selectedYear} onChange={e=>setSelectedYear(e.target.value)}><option value="2025">2025</option><option value="2026">2026</option></select>
              </div>
          </div>
      </div>
      <div className="dash-grid">
          <div className="dash-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div><div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Inspections</div><div style={{ fontSize: '28px', fontWeight: '900', color: '#1e293b', marginTop: '4px' }}>{monthlyReports.length}</div></div>
                  <div style={{ background: '#eff6ff', padding: '8px', borderRadius: '50%', color: '#3b82f6' }}><Activity size={20}/></div>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '8px' }}>In {months[selectedMonth]}</div>
          </div>
          <div className="dash-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div><div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Active Sites</div><div style={{ fontSize: '28px', fontWeight: '900', color: '#1e293b', marginTop: '4px' }}>{new Set(monthlyReports.map(r => r.site)).size}</div></div>
                  <div style={{ background: '#ecfdf5', padding: '8px', borderRadius: '50%', color: '#10b981' }}><Target size={20}/></div>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '8px' }}>Unique locations visited</div>
          </div>
          <div className="dash-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div><div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Pending</div><div style={{ fontSize: '28px', fontWeight: '900', color: '#f59e0b', marginTop: '4px' }}>{monthlyReports.filter(r => r.status !== 'Closed').length}</div></div>
                  <div style={{ background: '#fffbeb', padding: '8px', borderRadius: '50%', color: '#f59e0b' }}><AlertTriangle size={20}/></div>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '8px' }}>Need Compliance</div>
          </div>
      </div>
      <div>
          <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#334155', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}><TrendingUp size={18} className="text-blue-600"/> Officer Performance vs Norms</h3>
          {officerStats.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', background: 'white', borderRadius: '16px' }}>No inspections recorded for this period.</div>}
          {officerStats.map((o, i) => (
              <div key={i} className="officer-row">
                  <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${o.color}15`, color: o.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '13px' }}>{o.name.charAt(0)}</div>
                              <div><div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{o.name}</div><div style={{ fontSize: '11px', color: '#64748b' }}>{o.desig}</div></div>
                          </div>
                          <div style={{ textAlign: 'right' }}><span style={{ fontSize: '14px', fontWeight: '800', color: o.color }}>{o.count}</span><span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '4px' }}>Visits</span></div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="progress-track"><div className="progress-fill" style={{ width: `${o.percentage}%`, background: `linear-gradient(90deg, ${o.color}, ${o.color}dd)` }}></div></div>
                          <div style={{ fontSize: '10px', fontWeight: '600', color: '#64748b', whiteSpace: 'nowrap', minWidth: '80px', textAlign: 'right' }}>{o.targetLabel}</div>
                      </div>
                  </div>
              </div>
          ))}
      </div>
      <div style={{ marginTop: '20px', padding: '16px', background: '#f0f9ff', borderRadius: '12px', border: '1px solid #bae6fd', display: 'flex', gap: '10px', alignItems: 'start' }}>
          <div style={{ color: '#0284c7' }}><FileText size={18}/></div>
          <div style={{ fontSize: '11px', color: '#0c4a6e', lineHeight: '1.5' }}><strong>Norms Reference:</strong><br/>• <strong>SE:</strong> 3-4 visits/month (Circle dependent).<br/>• <strong>EE:</strong> 3-5 visits/month.<br/>• <strong>SDE/AEE:</strong> 33% sites/month (100% quarterly).<br/>• <strong>JE:</strong> 100% sites/month.</div>
      </div>
    </div>
  );
};

// ==========================================
// 5. MAIN APP
// ==========================================

export default function App() {
  const [view, setView] = useState('SPLASH'); 
  const [activeTab, setActiveTab] = useState('HOME');
  const [data, setData] = useState({ sites: [], officers: [], reports: [] });
  const [user, setUser] = useState(null);
  const [selectedSite, setSelectedSite] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loginSearch, setLoginSearch] = useState('');
  
  // Admin State
  const [jurisdictionInput, setJurisdictionInput] = useState('');
  const [selectedRole, setSelectedRole] = useState('SDO'); // New state to track role for dropdown
  const [isEditing, setIsEditing] = useState(false);
  const [originalName, setOriginalName] = useState('');

  useEffect(() => {
    const styleTag = document.createElement("style");
    styleTag.textContent = GLOBAL_STYLES;
    document.head.appendChild(styleTag);
    const init = async () => {
      try {
        const res = await fetch(GOOGLE_SCRIPT_URL);
        const d = await res.json();
        if(d.status === 'success') setData(d);
        else throw new Error("Invalid");
      } catch (e) {
        console.warn("Using Fallback");
        setData(FALLBACK_DATA);
      } finally {
        const saved = localStorage.getItem('cwc_v26_user');
        if(saved) {
          const u = JSON.parse(saved);
          setUser(u);
          setView('APP');
          setActiveTab(u.level === 'ADMIN' ? 'ADMIN' : 'HOME');
        } 
      }
    };
    init();
  }, []);

  const handleLogin = (u, p) => {
    if(String(u.password).trim() === String(p).trim()) {
      setUser(u);
      localStorage.setItem('cwc_v26_user', JSON.stringify(u));
      setView('APP');
      setActiveTab(u.level === 'ADMIN' ? 'ADMIN' : 'HOME');
    } else {
      alert("Invalid Password");
    }
  };

  const submitObservation = async (remarks) => {
    if(!remarks) return alert("Enter remarks");
    const newRep = { 
        id: Date.now(),
        date: new Date(), 
        officer: user.name, 
        inspectorRole: user.level, 
        site: selectedSite.name, 
        remarks, 
        status: 'Pending Compliance'
    };
    try {
        await fetch(GOOGLE_SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ action: 'SUBMIT', ...newRep }) });
        alert("Observation Logged. Assigned to SDO for Compliance.");
        setData(prev => ({ ...prev, reports: [...prev.reports, newRep] }));
        setSelectedSite(null);
    } catch(e) { alert("Offline mode"); setData(prev => ({ ...prev, reports: [...prev.reports, newRep] })); setSelectedSite(null); }
  };

  const handleWorkflowAction = async (report, actionType, complianceNote) => {
      let nextStatus = '';
      
      if(actionType === 'COMPLY') {
          // SDO Action: Always goes to EE first
          nextStatus = 'Pending EE';
      } else if (actionType === 'APPROVE') {
          // EE/SE/CE Action: Follows hierarchy
          nextStatus = getNextStatus(report.status, report.inspectorRole);
      }

      try {
          await fetch(GOOGLE_SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ action: 'UPDATE_STATUS', rowId: report.id, status: nextStatus, note: complianceNote }) });
          alert(`Status Updated to: ${nextStatus}`);
          setData(prev => ({
              ...prev,
              reports: prev.reports.map(r => r.id === report.id ? { ...r, status: nextStatus } : r)
          }));
      } catch(e) { alert("Error updating status"); }
  };

  const addOrUpdateUser = async (e) => {
    e.preventDefault();
    const f = e.target;
    const payload = { 
        action: isEditing ? 'UPDATE_USER' : 'ADD_USER',
        oldName: originalName,
        name: f.n.value, designation: f.d.value, office: f.o.value, level: f.l.value, password: f.p.value, jurisdiction: jurisdictionInput 
    };
    try {
      await fetch(GOOGLE_SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) });
      alert(isEditing ? "User Updated" : "User Added"); 
      f.reset(); setJurisdictionInput(''); setIsEditing(false); setOriginalName('');
    } catch(err) { alert("Failed"); }
  };

  const handleEditClick = (officer) => {
      setIsEditing(true);
      setOriginalName(officer.name);
      setJurisdictionInput(officer.jurisdiction);
      setSelectedRole(officer.level);
      setTimeout(() => {
          if(document.getElementsByName('n')[0]) {
              document.getElementsByName('n')[0].value = officer.name;
              document.getElementsByName('d')[0].value = officer.designation;
              document.getElementsByName('o')[0].value = officer.office;
              document.getElementsByName('l')[0].value = officer.level;
              document.getElementsByName('p')[0].value = officer.password;
          }
      }, 100);
  };

  const handleJurisdictionAdd = (val) => {
    if (!val) return;
    if (jurisdictionInput.includes(val)) return;
    const newVal = jurisdictionInput ? `${jurisdictionInput}, ${val}` : val;
    setJurisdictionInput(newVal);
  };

  // --- FILTER LOGIC ---
  const filteredSites = useMemo(() => {
    if(!user || !data.sites) return [];
    const rawJuris = user.jurisdiction || 'ALL';
    const allowed = rawJuris.toUpperCase().split(',').map(d => d.trim());
    const isBoss = ['ADMIN','CE','SE'].includes(user.level) || allowed.includes('ALL');
    return data.sites.filter(s => {
       const siteName = (s.name || '').toUpperCase();
       const districtName = (s.district || '').toUpperCase();
       const matchSearch = (siteName + districtName).includes(searchTerm.toUpperCase());
       const matchJuris = isBoss || allowed.some(a => districtName.includes(a) || siteName.includes(a));
       return matchSearch && matchJuris;
    });
  }, [data.sites, searchTerm, user]);

  const sortedOfficers = useMemo(() => {
     if(!data.officers) return [];
     return data.officers
        .filter(o => o.name.toLowerCase().includes(loginSearch.toLowerCase()))
        .sort((a, b) => getRank(b.level) - getRank(a.level));
  }, [data.officers, loginSearch]);

  const uniqueLocations = useMemo(() => {
      const dists = [...new Set(data.sites.map(s => s.district).filter(Boolean))];
      const sites = data.sites.map(s => s.name).filter(Boolean);
      return [...dists, ...sites].sort();
  }, [data.sites]);

  // --- VIEWS ---

  if (view === 'SPLASH') return (
    <div className="splash-container">
      <div className="splash-card">
          <div className="logo-container">
              <img src="https://cwc.gov.in/sites/default/files/cwc-logo.png" alt="CWC Logo" style={{ width: '80px' }} />
          </div>
          <div style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase', opacity: 0.7, marginBottom: '8px' }}>Government of India</div>
          <h1 style={{ fontSize: '28px', fontWeight: '900', margin: '0 0 10px 0', lineHeight: 1.3, fontFamily: 'Playfair Display' }}>Central Water Commission</h1>
          <div style={{ fontSize: '16px', fontWeight: '400', opacity: 0.9, marginBottom: '20px' }}>Cauvery & Southern Rivers Organisation</div>
          <div style={{ width: '40px', height: '4px', background: '#3b82f6', borderRadius: '2px', margin: '20px auto', opacity: 0.8 }}></div>
          <p style={{ fontSize: '13px', opacity: 0.7, maxWidth: '80%', margin: '0 auto' }}>Official Inspection & Monitoring System</p>
          <button onClick={() => setView('LOGIN')} className="splash-btn">Access Portal <ArrowRight size={18}/></button>
      </div>
    </div>
  );

  if (view === 'LOGIN') return (
    <div style={{ height: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <img src="https://cwc.gov.in/sites/default/files/cwc-logo.png" style={{ height: '70px', marginBottom: '15px' }} alt="Logo" />
      <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#1e3a8a', marginBottom: '30px' }}>Inspection Login</h2>
      <div style={{ width: '100%', maxWidth: '400px', background: 'white', borderRadius: '24px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)', overflow: 'hidden', maxHeight: '60vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9' }}>
           <input className="modern-input" placeholder="Search officer..." value={loginSearch} onChange={e => setLoginSearch(e.target.value)} />
        </div>
        <div style={{ overflowY: 'auto', padding: '10px' }}>
          {sortedOfficers.map((o, i) => (
            <div key={i} onClick={() => { const p = prompt(`Password for ${o.name}`); if(p) handleLogin(o,p); }} 
                 style={{ padding: '15px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', marginBottom: '5px' }}
                 onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                 onMouseOut={(e) => e.currentTarget.style.background = 'white'}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ width: '40px', height: '40px', background: o.level==='ADMIN'?'#1e293b':'#eff6ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: o.level==='ADMIN'?'white':'#2563eb', fontWeight: 'bold', fontSize: '12px' }}>{o.level}</div>
                <div><div style={{ fontWeight: '700', color: '#334155' }}>{o.name}</div><div style={{ fontSize: '12px', color: '#64748b' }}>{o.designation}</div></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <Header user={user} onLogout={() => { localStorage.removeItem('cwc_v26_user'); setView('LOGIN'); }} />
      <div style={{ flex: 1, position: 'relative', marginTop: '65px' }}>
        {activeTab === 'DASHBOARD' && <Dashboard data={data} />}
        
        {/* MAP TAB */}
        <div style={{ position: 'absolute', inset: 0, opacity: activeTab==='HOME'?1:0, pointerEvents: activeTab==='HOME'?'auto':'none' }}>
           <MapContainer center={[11.0, 78.0]} zoom={7} zoomControl={false} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
              <MapController center={selectedSite ? [selectedSite.lat, selectedSite.lng] : null} />
              {filteredSites.map(site => (
                <Marker key={site.id} position={[site.lat, site.lng]} icon={createPin(site.status === 'Inspected' ? '#10b981' : '#3b82f6')} eventHandlers={{ click: () => setSelectedSite(site) }} />
              ))}
           </MapContainer>
           <div className="map-search" style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', zIndex: 500 }}>
              <div style={{ background: 'white', borderRadius: '16px', padding: '10px 16px', boxShadow: '0 8px 20px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                 <Search size={20} color="#94a3b8"/><input className="modern-input" style={{ border: 'none', background: 'transparent', padding: '5px 0', fontSize: '16px' }} placeholder="Search sites..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} />
              </div>
           </div>
           {selectedSite && (
             <div className="glass-panel animate-slide-up" style={{ position: 'absolute', bottom: 0, width: '100%', zIndex: 800, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between' }}>
                   <div><h2 style={{ fontSize: '22px', fontWeight: '800', margin: 0 }}>{selectedSite.name}</h2><div style={{ color: '#64748b' }}>{selectedSite.district}</div></div>
                   <button onClick={()=>setSelectedSite(null)} style={{ background: '#f1f5f9', border: 'none', padding: '8px', borderRadius: '50%' }}><X size={20}/></button>
                </div>
                <div style={{ padding: '0 24px 24px', overflowY: 'auto' }}>
                   <div style={{ marginBottom: '20px' }}>
                      <h4 style={{ fontSize: '12px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '10px' }}>Inspection History</h4>
                      {data.reports.filter(r => r.site === selectedSite.name).map((r, i) => (
                         <div key={i} style={{ background: 'white', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ fontWeight: '700', fontSize: '13px' }}>{r.officer} <span style={{ opacity: 0.5 }}>({r.inspectorRole})</span></span>
                                <span className="status-badge" style={{ background: r.status==='Closed'?'#dcfce7':'#fef3c7', color: r.status==='Closed'?'#166534':'#d97706' }}>{r.status}</span>
                            </div>
                            <div style={{ fontSize: '13px', color: '#475569' }}>"{r.remarks}"</div>
                         </div>
                      ))}
                   </div>
                   {user.level !== 'ADMIN' && (
                      <div><textarea id="obs" className="modern-input" placeholder="Add new observation..." style={{ height: '80px', resize: 'none', marginBottom: '10px' }}></textarea><button onClick={() => submitObservation(document.getElementById('obs').value)} style={{ width: '100%', padding: '14px', background: '#1e3a8a', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>Submit Observation</button></div>
                   )}
                </div>
             </div>
           )}
        </div>

        {/* TASKS TAB (Updated Logic for 10 SDOs) */}
        {activeTab === 'APPROVALS' && (
           <div style={{ padding: '20px', height: '100%', overflowY: 'auto' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '20px' }}>Pending Actions</h2>
              {data.reports.map((r, i) => {
                 
                 // *** UPDATED SDO LOGIC: Check Jurisdiction ***
                 const userJurisdiction = (user.jurisdiction || "").toLowerCase();
                 const reportSite = (r.site || "").toLowerCase();
                 const isSiteInJurisdiction = userJurisdiction === 'all' || userJurisdiction.includes(reportSite);

                 // FILTER: Only show what this user needs to act on
                 const showSDO = user.level === 'SDO' && r.status === 'Pending Compliance' && isSiteInJurisdiction;
                 const showEE  = user.level === 'EE' && r.status === 'Pending EE';
                 const showSE  = user.level === 'SE' && r.status === 'Pending SE';
                 const showCE  = user.level === 'CE' && r.status === 'Pending CE';
                 
                 if (!showSDO && !showEE && !showSE && !showCE) return null;

                 return (
                    <div key={i} style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', marginBottom: '15px' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                           <span style={{ fontWeight: '800', fontSize: '16px' }}>{r.site}</span>
                           <span className="status-badge" style={{ background: '#e0f2fe', color: '#0369a1' }}>{r.status}</span>
                       </div>
                       <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '15px' }}>
                           <div><strong>Observation by {r.inspectorRole}:</strong> "{r.remarks}"</div>
                       </div>
                       
                       {/* SDO: SUBMIT COMPLIANCE */}
                       {showSDO && (
                           <div>
                               <textarea id={`comp-${r.id}`} className="modern-input" placeholder="Enter compliance details..." style={{ height: '60px', marginBottom: '10px' }}></textarea>
                               <button onClick={()=>handleWorkflowAction(r, 'COMPLY', document.getElementById(`comp-${r.id}`).value)} style={{ width: '100%', padding: '10px', background: '#2563eb', color: 'white', borderRadius: '8px', fontWeight: '700', border:'none' }}>Submit Compliance</button>
                           </div>
                       )}

                       {/* EE/SE/CE: APPROVE/FORWARD */}
                       {(showEE || showSE || showCE) && (
                           <button onClick={()=>handleWorkflowAction(r, 'APPROVE')} style={{ width: '100%', padding: '12px', background: '#059669', color: 'white', borderRadius: '8px', fontWeight: '700', border:'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                               <CheckCircle size={16}/> Verify & Approve
                           </button>
                       )}
                    </div>
                 );
              })}
              <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '20px', fontSize: '12px' }}>No further pending tasks.</div>
           </div>
        )}

        {/* ADMIN TAB (Updated with 10 SDOs) */}
        {activeTab === 'ADMIN' && (
           <div style={{ padding: '20px', height: '100%', overflowY: 'auto' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '20px' }}>User Management</h2>
              <div style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <UserPlus size={20} className="text-blue-600"/>
                          <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>{isEditing ? `Editing ${originalName}` : "Add New Officer"}</h3>
                      </div>
                      {isEditing && <button onClick={()=>{setIsEditing(false); setOriginalName(''); setJurisdictionInput('');}} style={{fontSize:'12px', color:'#ef4444', background:'none', border:'none', cursor:'pointer'}}>Cancel Edit</button>}
                  </div>
                  <form onSubmit={addOrUpdateUser} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <input name="n" placeholder="Full Name" className="modern-input" required/>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                         <input name="d" placeholder="Designation" className="modern-input" required/>
                         <input name="o" placeholder="Office" className="modern-input" required/>
                      </div>
                      
                      {/* JURISDICTION HELPER */}
                      <div>
                          <input name="j" placeholder="Jurisdiction (Type or Select below)" className="modern-input" required value={jurisdictionInput} onChange={(e) => setJurisdictionInput(e.target.value)}/>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                             <PlusCircle size={16} color="#64748b" />
                             <select className="filter-select" style={{ width: '100%' }} onChange={(e) => handleJurisdictionAdd(e.target.value)}>
                                 <option value="">Quick Add Location...</option>
                                 {/* CONDITIONAL DROPDOWN CONTENT */}
                                 {selectedRole === 'SDO' ? (
                                     <>
                                        <option disabled>--- 10 SDO Jurisdictions ---</option>
                                        {SDO_JURISDICTIONS.map((loc, i) => <option key={i} value={loc}>{loc}</option>)}
                                     </>
                                 ) : (
                                     <>
                                        <option value="ALL">ALL (Admin/Chief)</option>
                                        <option disabled>--- Sites & Districts ---</option>
                                        {uniqueLocations.map((loc, i) => <option key={i} value={loc}>{loc}</option>)}
                                     </>
                                 )}
                             </select>
                          </div>
                      </div>

                      <select name="l" className="modern-input" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                          <option value="SDO">SDO (Compliance)</option>
                          <option value="EE">EE (Executive Eng.)</option>
                          <option value="SE">SE (Superintending Eng.)</option>
                          <option value="CE">CE (Chief Eng.)</option>
                          <option value="ADMIN">Admin</option>
                      </select>
                      
                      <input name="p" placeholder="Set Password" className="modern-input" required/>
                      <button style={{ padding: '12px', background: isEditing?'#f59e0b':'#1e3a8a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>{isEditing ? <Save size={16}/> : <UserPlus size={16}/>}{isEditing ? "Update Account" : "Create Account"}</button>
                  </form>
              </div>
              <div>
                  <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase' }}>Existing Officers</h3>
                  <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                      {sortedOfficers.map((o, i) => (
                          <div key={i} className="user-list-item">
                              <div><div style={{ fontWeight: '700', color: '#1e293b' }}>{o.name}</div><div style={{ fontSize: '11px', color: '#64748b' }}>{o.designation} • {o.level}</div></div>
                              <button className="edit-btn" onClick={() => handleEditClick(o)}><Edit2 size={16}/></button>
                          </div>
                      ))}
                  </div>
              </div>
           </div>
        )}
      </div>
      <div style={{ height: '70px', background: 'white', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 2000 }}>
         {user?.level !== 'SDO' && <NavBtn icon={<BarChart2 size={24}/>} label="Stats" active={activeTab==='DASHBOARD'} onClick={()=>setActiveTab('DASHBOARD')} />}
         <NavBtn icon={<MapIcon size={24}/>} label="Map" active={activeTab==='HOME'} onClick={()=>setActiveTab('HOME')} />
         {user?.level !== 'ADMIN' && <NavBtn icon={<ClipboardList size={24}/>} label="Tasks" active={activeTab==='APPROVALS'} onClick={()=>setActiveTab('APPROVALS')} />}
         {user?.level === 'ADMIN' && <NavBtn icon={<Shield size={24}/>} label="Admin" active={activeTab==='ADMIN'} onClick={()=>setActiveTab('ADMIN')} />}
      </div>
    </div>
  );
}

const NavBtn = ({ icon, label, active, onClick }) => (
    <button onClick={onClick} style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', color: active ? '#2563eb' : '#94a3b8', transition: 'all 0.2s', transform: active ? 'scale(1.1)' : 'scale(1)' }}>{icon}<span style={{ fontSize: '10px', fontWeight: '700' }}>{label}</span></button>
);

const FALLBACK_DATA = { 
    sites: [{id:1, name:'Hogenakkal', district:'Dharmapuri', lat:12.1208, lng:77.7855}, {id:2, name:'Musiri', district:'Trichy', lat:10.95, lng:78.44}, {id:3, name:'Kodumudi', district:'Erode', lat:11.17, lng:77.88}], 
    officers: [{name:'Admin', designation:'IT Head', level:'ADMIN', password:'123'}, {name:'Chief Engineer', designation:'CE (SRO)', level:'CE', password:'123'}, {name:'Sup. Engineer', designation:'SE (Trichy)', level:'SE', password:'123'}, {name:'Exec. Engineer', designation:'EE (Trichy)', level:'EE', password:'123'}, {name:'SDO Trichy', designation:'Sub-Div Officer', level:'SDO', jurisdiction:'Trichy, Hogenakkal', password:'123'}], 
    reports: [{id: 101, date: new Date(), officer: 'Exec. Engineer', inspectorRole: 'EE', site: 'Musiri', remarks: 'Gauge post repainting needed', status: 'Pending Compliance'}] 
};
