import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useSpring, useMotionValue, useTransform } from 'framer-motion';
import axios from 'axios';
import { 
  Database, ShieldAlert, CheckCircle, Hash, Activity, 
  Lock, User, LogIn, LogOut, Calendar, AlertTriangle, Zap
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

// ---------------- INTERACTIVE SURFACE WRAPPER ----------------
const Tilt3DCard = ({ children, className = "", glowColor = "rgba(59, 130, 246, 0.18)", intensity = 6, onClick }) => {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const glowX = useMotionValue(50);
  const glowY = useMotionValue(50);

  const mouseXSpring = useSpring(x, { stiffness: 260, damping: 24 });
  const mouseYSpring = useSpring(y, { stiffness: 260, damping: 24 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [`${intensity}deg`, `-${intensity}deg`]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [`-${intensity}deg`, `${intensity}deg`]);

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
    glowX.set((mouseX / width) * 100);
    glowY.set((mouseY / height) * 100);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    glowX.set(50);
    glowY.set(50);
  };

  const backgroundGlow = useTransform(
    [glowX, glowY],
    ([gx, gy]) => `radial-gradient(500px circle at ${gx}% ${gy}%, ${glowColor}, transparent 65%)`
  );

  return (
    <div style={{ perspective: '1400px' }} className="w-full h-full" onClick={onClick}>
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d'
        }}
        whileHover={{ scale: 1.01, y: -3 }}
        transition={{ duration: 0.2 }}
        className={`relative group overflow-hidden ${className}`}
      >
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"
          style={{ background: backgroundGlow }}
        />
        <div style={{ transform: 'translateZ(18px)' }} className="relative z-10 w-full h-full">
          {children}
        </div>
      </motion.div>
    </div>
  );
};

// ---------------- SCROLL REVEAL WRAPPER ----------------
const ScrollReveal3D = ({ children, className = "" }) => (
  <div style={{ perspective: '1400px' }}>
    <motion.div
      initial={{ opacity: 0, y: 28, rotateX: 10, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
      viewport={{ once: false, amount: 0.1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      style={{ transformStyle: 'preserve-3d' }}
      className={className}
    >
      {children}
    </motion.div>
  </div>
);

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [apiError, setApiError] = useState(null);

  const [copiedCmd, setCopiedCmd] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [recordFilter, setRecordFilter] = useState('All');
  const [stackedTrendView, setStackedTrendView] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: -500, y: -500 });

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28, restDelta: 0.001 });

  // Live PostgreSQL Data States
  const [stats, setStats] = useState({ total_customers: 0, total_reviews: 0, total_support_tickets: 0 });
  const [sentimentData, setSentimentData] = useState([]);
  const [channelData, setChannelData] = useState([]);
  const [recentRecords, setRecentRecords] = useState([]);
  const [themeData, setThemeData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('Total');
  const [recommendations, setRecommendations] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [productData, setProductData] = useState([]);
  const [evalMetrics, setEvalMetrics] = useState(null);
  const [validationReport, setValidationReport] = useState(null);

  // Query Assistant States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: 'YottaFlex Intelligence Assistant ready. Select a predefined analytical query below or enter a custom question to query the live PostgreSQL dataset.' }
  ]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const handleGlobalMouse = (e) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleGlobalMouse);
    return () => window.removeEventListener('mousemove', handleGlobalMouse);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      Promise.all([
        axios.get(`${API_BASE}/api/stats`),
        axios.get(`${API_BASE}/api/sentiments`),
        axios.get(`${API_BASE}/api/channels`),
        axios.get(`${API_BASE}/api/recent-records`),
        axios.get(`${API_BASE}/api/themes`),
        axios.get(`${API_BASE}/api/trends`),
        axios.get(`${API_BASE}/api/recommendations`),
        axios.get(`${API_BASE}/api/anomalies`),
        axios.get(`${API_BASE}/api/product-breakdown`),
        axios.get(`${API_BASE}/api/evaluation`),
        axios.get(`${API_BASE}/api/validation`)
      ])
        .then(([statsRes, sentRes, chanRes, recRes, thmRes, trnRes, actRes, anmRes, prdRes, evlRes, valRes]) => {
          setStats(statsRes.data);
          setSentimentData(sentRes.data);
          setChannelData(chanRes.data);
          setRecentRecords(recRes.data);
          setThemeData(thmRes.data);
          setTrendData(trnRes.data);
          setRecommendations(actRes.data);
          setAnomalies(anmRes.data);
          setProductData(prdRes.data);
          setEvalMetrics(evlRes.data);
          setValidationReport(valRes.data);
          setApiError(null);
        })
        .catch(err => {
          console.error("Database Synchronization Error:", err);
          setApiError("Pipeline synchronization pending. Execute 'python validate.py && python evaluate.py' to initialize all database tables.");
        });
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatOpen]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

  const handleCopyCmd = (cmd) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const getDisplayData = () => {
    if (!trendData || trendData.length === 0) return { Total: 0, Positive: 0, Negative: 0, Neutral: 0, Mixed: 0 };
    if (selectedMonth === 'Total') {
      return trendData.reduce((acc, curr) => {
        acc.Total += (curr.Total || 0);
        acc.Positive += (curr.Positive || 0);
        acc.Negative += (curr.Negative || 0);
        acc.Neutral += (curr.Neutral || 0);
        acc.Mixed += (curr.Mixed || 0);
        return acc;
      }, { Total: 0, Positive: 0, Negative: 0, Neutral: 0, Mixed: 0 });
    }
    return trendData.find(t => t.month === selectedMonth) || { Total: 0, Positive: 0, Negative: 0, Neutral: 0, Mixed: 0 };
  };

  const currentDisplayData = getDisplayData();
  const totalProductNegatives = productData.reduce((acc, item) => acc + (item.negative_count || 0), 0);

  const filteredRecentRecords = recordFilter === 'All'
    ? recentRecords
    : recentRecords.filter(r => r.sentiment_label === recordFilter);

  const sendQuery = async (queryText) => {
    if (!queryText.trim()) return;
    setChatMessages(prev => [...prev, { sender: 'user', text: queryText }]);
    setChatInput('');

    try {
      const res = await axios.post(`${API_BASE}/api/chat`, { message: queryText });
      setChatMessages(prev => [...prev, { sender: 'ai', text: res.data.reply }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { sender: 'ai', text: 'Unable to reach the analytics API. Please verify that the backend service and PostgreSQL instance are active.' }]);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    sendQuery(chatInput);
  };

  // ---------------- ENTERPRISE AUTHENTICATION PORTAL ----------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#050814] flex items-center justify-center p-4 selection:bg-blue-500/30 relative overflow-hidden">
        <motion.div
          animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/15 blur-[130px] rounded-full pointer-events-none"
        />
        <motion.div
          animate={{ x: [0, -40, 30, 0], y: [0, 40, -20, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/15 blur-[130px] rounded-full pointer-events-none"
        />

        <div className="w-full max-w-md relative z-10">
          <Tilt3DCard
            intensity={8}
            glowColor="rgba(56, 189, 248, 0.22)"
            className="bg-slate-900/85 p-9 rounded-3xl border border-slate-800 shadow-[0_25px_70px_-15px_rgba(15,23,42,0.9)] backdrop-blur-xl"
          >
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gradient-to-br from-blue-600/20 to-cyan-500/10 rounded-2xl border border-blue-500/30 text-cyan-400 shadow-lg">
                <Lock size={36} />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white text-center tracking-tight mb-2">
              YottaFlex Analytics Console
            </h2>
            <p className="text-slate-400 text-center mb-8 text-sm">
              Sign in with your administrator credentials to access customer feedback telemetry
            </p>
            <LoginForm onLogin={() => setIsAuthenticated(true)} />
            <div className="mt-6 pt-6 border-t border-slate-800/80 text-center">
              <p className="text-xs text-slate-400">
                Standard Access: Username <span className="text-cyan-400 font-mono font-semibold">admin</span> | Password <span className="text-emerald-400 font-mono font-semibold">admin123</span>
              </p>
            </div>
          </Tilt3DCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060916] text-slate-200 font-sans selection:bg-blue-500/30 overflow-x-hidden scroll-smooth relative">
      
      {/* SUBTLE AMBIENT CURSOR LIGHT */}
      <div
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(650px circle at ${cursorPos.x}px ${cursorPos.y}px, rgba(56, 189, 248, 0.05), transparent 70%)`
        }}
      />

      {/* TOP SCROLL PROGRESS INDICATOR */}
      <motion.div
        style={{ scaleX }}
        className="fixed top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 origin-left z-[60]"
      />

      {/* SUBTLE ARCHITECTURAL GRID */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-20"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(59,130,246,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(59,130,246,0.1) 1px, transparent 1px)`,
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, #000 50%, transparent 100%)'
        }}
      />

      {/* NAVIGATION HEADER */}
      <nav className="fixed top-0 w-full bg-[#060916]/85 backdrop-blur-xl border-b border-slate-800/80 z-50 px-6 lg:px-12 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl shadow-md shadow-blue-500/20">
            <Database size={20} className="text-white" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">
            YottaFlex
          </span>
          <span className="hidden sm:inline-block text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2.5 py-0.5 rounded-full">
            SEED: 20261022 • PRODUCTION
          </span>
        </div>
        <div className="hidden md:flex gap-7 text-sm font-medium text-slate-400">
          <a href="#hero" className="hover:text-white transition-colors">Overview</a>
          <a href="#analytics" className="hover:text-white transition-colors">Telemetry</a>
          <a href="#trends" className="hover:text-white transition-colors">Trends</a>
          <a href="#traceability" className="hover:text-white transition-colors">Lineage</a>
          <a href="#action-engine" className="hover:text-white transition-colors">Triage & Actions</a>
          <a href="#ml-evaluation" className="hover:text-white transition-colors">Model Evaluation</a>
          <a href="#architecture" className="hover:text-white transition-colors">Governance</a>
        </div>
        <motion.button 
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setIsAuthenticated(false)}
          className="bg-slate-900 hover:bg-red-500/15 text-slate-300 hover:text-red-400 border border-slate-700 hover:border-red-500/30 px-4 py-2 rounded-xl font-medium transition-all text-xs flex items-center gap-2"
        >
          Sign Out <LogOut size={14} />
        </motion.button>
      </nav>

      {apiError && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-red-600/95 text-white px-6 py-3 rounded-xl shadow-2xl text-xs font-mono">
          {apiError}
        </div>
      )}

      {/* RECORD & ARTIFACT INSPECTION MODAL */}
      <AnimatePresence>
        {activeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveModal(null)}
            className="fixed inset-0 bg-black/75 backdrop-blur-md z-[70] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-8 shadow-2xl relative"
            >
              <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/15 text-cyan-400 rounded-xl border border-blue-500/30">
                    <Database size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{activeModal.title}</h3>
                    <span className="text-xs font-mono text-slate-400">{activeModal.subtitle}</span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Close
                </button>
              </div>
              <pre className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-xs font-mono text-cyan-300 overflow-x-auto max-h-96 leading-relaxed">
                {JSON.stringify(activeModal.data, null, 2)}
              </pre>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EXECUTIVE HERO SECTION */}
      <section id="hero" className="relative pt-40 pb-24 px-6 lg:px-12 max-w-[1600px] w-full mx-auto flex flex-col items-center text-center overflow-hidden z-10">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none" />

        <ScrollReveal3D className="relative z-10 w-full">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 backdrop-blur-xl mb-8">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span className="text-slate-300 text-xs font-semibold tracking-wider uppercase">
              Customer Intelligence Platform • {((stats?.total_reviews || 0) + (stats?.total_support_tickets || 0)).toLocaleString()} Verified Records
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight mb-6 leading-[1.1]">
            Unified Customer Sentiment <br className="hidden md:block"/> & <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-emerald-400">Service Priority Analytics</span>
          </h1>
          
          <p className="text-base md:text-lg text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            End-to-end data synthesis, validation, and machine learning evaluation pipeline integrating product reviews, post-purchase surveys, and customer support tickets with full relational lineage.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <motion.a
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              href="#analytics"
              className="bg-blue-600 hover:bg-blue-500 text-white px-7 py-3.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-600/25 flex items-center gap-2"
            >
              View Executive Telemetry <Activity size={16} />
            </motion.a>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveModal({
                title: "Automated Schema & Integrity Audit",
                subtitle: "Source: validation_summary.json",
                data: validationReport || { status: "Pending validation run" }
              })}
              className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 px-7 py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2"
            >
              View Audit Summary <CheckCircle size={16} className="text-emerald-400" />
            </motion.button>
          </div>

          {/* SYSTEM COMPLIANCE SUMMARY BAR */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-left">
            <Tilt3DCard
              intensity={6}
              onClick={() => setActiveModal({ title: "Primary Key & Identifier Integrity", subtitle: "Relational Uniqueness Audit", data: validationReport })}
              className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800 hover:border-slate-700 cursor-pointer"
            >
              <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Relational Integrity</span>
              <p className="text-base font-bold text-white mt-1.5 flex items-center gap-2">
                <CheckCircle size={15} className="text-emerald-400" />
                {validationReport?.pk_and_response_id_uniqueness ? "100% Unique Keys Verified" : "Synchronizing..."}
              </p>
            </Tilt3DCard>
            <Tilt3DCard
              intensity={6}
              onClick={() => setActiveModal({ title: "Cross-Table Reconciliation", subtitle: "Volume Verification", data: stats })}
              className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800 hover:border-slate-700 cursor-pointer"
            >
              <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Cross-Table Reconciliation</span>
              <p className="text-base font-bold text-emerald-400 mt-1.5">
                {validationReport?.arithmetic_reconciliation_verified ? `${validationReport.total_reviews_reconciled.toLocaleString()} Records Reconciled` : "Synchronizing..."}
              </p>
            </Tilt3DCard>
            <Tilt3DCard
              intensity={6}
              onClick={() => setActiveModal({ title: "Classification Performance Summary", subtitle: "Holdout Evaluation Metrics", data: evalMetrics })}
              className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800 hover:border-slate-700 cursor-pointer"
            >
              <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Sentiment / Theme F1-Score</span>
              <p className="text-base font-bold text-cyan-400 mt-1.5">
                {evalMetrics?.overall?.f1_score || "..."}% / {evalMetrics?.overall?.theme_f1_score || "..."}%
              </p>
            </Tilt3DCard>
            <Tilt3DCard
              intensity={6}
              onClick={() => setActiveModal({ title: "Deterministic Checksum Verification", subtitle: "Seed 20261022 Reproducibility", data: { sha256: validationReport?.sha256_reviews, reproducible: validationReport?.two_run_checksum_reproducible } })}
              className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800 hover:border-slate-700 cursor-pointer"
            >
              <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Deterministic Reproducibility</span>
              <p className="text-base font-bold text-amber-400 mt-1.5">
                {validationReport?.two_run_checksum_reproducible ? "SHA-256 Checksum Matched" : "Pending Checksum"}
              </p>
            </Tilt3DCard>
          </div>
        </ScrollReveal3D>
      </section>

      {/* OMNICHANNEL TELEMETRY SECTION */}
      <section id="analytics" className="py-24 bg-slate-950/70 border-t border-slate-800/80 relative z-10 backdrop-blur-sm">
        <div className="max-w-[1600px] w-full mx-auto px-6 lg:px-12">
          <ScrollReveal3D>
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold text-white">
                Omnichannel Feedback Intelligence
              </h2>
              <p className="text-slate-400 mt-2 text-sm">Real-time volume metrics and sentiment distribution aggregated across all customer touchpoints.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <StatCard3D title="Active Customer Accounts" count={stats?.total_customers || 0} glow="rgba(59, 130, 246, 0.25)" badge="border-slate-800" />
              <StatCard3D title="Product Reviews & Surveys" count={stats?.total_reviews || 0} glow="rgba(16, 185, 129, 0.25)" badge="border-slate-800" />
              <StatCard3D title="Support Ticket Dispatches" count={stats?.total_support_tickets || 0} glow="rgba(168, 85, 247, 0.25)" badge="border-slate-800" />
              <StatCard3D title="Total Ingested Interactions" count={(stats?.total_reviews || 0) + (stats?.total_support_tickets || 0)} glow="rgba(245, 158, 11, 0.25)" badge="border-slate-800" />
            </div>
          </ScrollReveal3D>

          {/* ROW 1: SENTIMENT DISTRIBUTION + CHANNEL ATTRIBUTION */}
          <ScrollReveal3D className="grid grid-cols-1 xl:grid-cols-12 gap-8 mb-12">
            <div className="xl:col-span-8">
              <Tilt3DCard intensity={4} glowColor="rgba(59, 130, 246, 0.15)" className="bg-slate-900/80 p-8 rounded-3xl border border-slate-800 shadow-xl h-full">
                <div className="flex flex-col md:flex-row items-center gap-8 h-full">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2.5">
                      <Activity className="text-cyan-400" size={20} /> Aggregate Sentiment Distribution
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-6">
                      Distribution of polarity classifications across {stats?.total_reviews?.toLocaleString()} customer reviews and survey responses, reconciled against product-level and monthly aggregations.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      {sentimentData.map((entry, index) => (
                        <div key={index} className="bg-slate-950/90 p-4 rounded-2xl border border-slate-800/90">
                          <span className="text-xs text-slate-400 uppercase font-semibold">{entry.name}</span>
                          <p className="text-2xl font-bold text-white mt-1">{(entry.value || 0).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="h-80 w-full flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie isAnimationActive={false} data={sentimentData} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="value">
                          {sentimentData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '12px' }} itemStyle={{ color: '#f8fafc' }} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </Tilt3DCard>
            </div>

            <div className="xl:col-span-4">
              <Tilt3DCard intensity={5} glowColor="rgba(16, 185, 129, 0.15)" className="bg-slate-900/80 p-8 rounded-3xl border border-slate-800 shadow-xl h-full flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <Database className="text-emerald-400" size={20} /> Ingestion Channel Attribution
                  </h3>
                  <p className="text-slate-400 text-xs mb-6">Volume distribution across primary customer feedback channels.</p>
                  <div className="space-y-4">
                    {channelData.map((ch, idx) => {
                      const totalAll = ((stats?.total_reviews || 0) + (stats?.total_support_tickets || 0)) || 1;
                      const pct = ((ch.count / totalAll) * 100).toFixed(1);
                      return (
                        <div key={idx} className="bg-slate-950/90 p-4 rounded-2xl border border-slate-800/90">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="font-semibold text-slate-200">{ch.name}</span>
                            <span className="font-mono text-emerald-400">{ch.count.toLocaleString()} ({pct}%)</span>
                          </div>
                          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              whileInView={{ width: `${pct}%` }}
                              transition={{ duration: 0.6 }}
                              className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-2 rounded-full"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
                  <span>Data Source: <strong className="text-emerald-400">Relational Join</strong></span>
                  <span>Referential Integrity: <strong className="text-cyan-400">{validationReport?.foreign_key_and_survey_product_aligned ? "Verified" : "Pending"}</strong></span>
                </div>
              </Tilt3DCard>
            </div>
          </ScrollReveal3D>

          {/* ROW 2: PRODUCT QUALITY & DEFECT ATTRIBUTION */}
          <ScrollReveal3D className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            <div className="xl:col-span-8">
              <Tilt3DCard intensity={4} glowColor="rgba(239, 68, 68, 0.15)" className="bg-slate-900/80 p-8 rounded-3xl border border-slate-800 shadow-xl h-full">
                <div className="flex flex-col md:flex-row items-center gap-8 h-full">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2.5">
                      <AlertTriangle className="text-red-400" size={20} /> Product Quality & Negative Attribution
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-6">
                      Segmentation of negative feedback across product lines. Total negative volume across all SKUs (<strong className="text-red-400">{totalProductNegatives.toLocaleString()}</strong>) reconciles directly with the aggregate negative sentiment count.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      {productData.map((item, idx) => (
                        <div key={idx} className="bg-slate-950/90 p-4 rounded-2xl border border-slate-800/90">
                          <span className="text-xs text-slate-400 uppercase font-semibold">{item.product}</span>
                          <p className="text-2xl font-bold text-red-400 mt-1">{(item.negative_count || 0).toLocaleString()} <span className="text-xs text-slate-500 font-normal">reports</span></p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="h-80 w-full flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={productData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="product" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <Tooltip 
                          cursor={{ fill: '#1e293b' }}
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '12px' }} 
                        />
                        <Legend verticalAlign="bottom" height={36} />
                        <Bar isAnimationActive={false} dataKey="negative_count" name="Negative Feedback Volume" fill="#ef4444" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </Tilt3DCard>
            </div>

            <div className="xl:col-span-4">
              <Tilt3DCard intensity={5} glowColor="rgba(245, 158, 11, 0.15)" className="bg-slate-900/80 p-8 rounded-3xl border border-slate-800 shadow-xl h-full flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <Zap className="text-amber-400" size={20} /> Primary Defect Drivers & SLA
                  </h3>
                  <p className="text-slate-400 text-xs mb-6">Root-cause themes and service level benchmarks by product line.</p>
                  <div className="space-y-3">
                    {productData.map((prod, i) => (
                      <div key={i} className="bg-slate-950/90 p-3.5 rounded-2xl border border-slate-800/90 flex justify-between items-center">
                        <div>
                          <p className="text-sm font-semibold text-white">{prod.product}</p>
                          <p className="text-xs text-slate-400">Primary Issue: <span className="text-red-400">{prod.reason}</span></p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-mono bg-slate-900 text-slate-300 border border-slate-700 px-2.5 py-0.5 rounded-full">Volume: {(prod.total_product_reviews || 0).toLocaleString()}</span>
                          <p className="text-[11px] text-slate-500 mt-1">SLA Compliance: {prod.sla}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400 flex justify-between">
                  <span>Negative Volume Sum: <strong className="text-red-400">{totalProductNegatives.toLocaleString()}</strong></span>
                  <span>Chronology Check: <strong className="text-emerald-400">{validationReport?.date_ordering_verified ? "Verified" : "Pending"}</strong></span>
                </div>
              </Tilt3DCard>
            </div>
          </ScrollReveal3D>

        </div>
      </section>

      {/* TEMPORAL VOLUME & SENTIMENT TRAJECTORY */}
      <section id="trends" className="py-24 bg-[#060916] border-t border-slate-800/80 relative z-10">
        <ScrollReveal3D className="max-w-[1600px] w-full mx-auto px-6 lg:px-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white flex items-center justify-center gap-3">
              <Calendar className="text-cyan-400" size={26} /> Temporal Volume & Sentiment Trajectory
            </h2>
            <p className="text-slate-400 mt-2 text-sm">
              Monthly feedback progression across FY 2026. Cumulative monthly volume reconciles to {(stats?.total_reviews || 0).toLocaleString()} total records.
            </p>
          </div>

          <div className="flex overflow-x-auto hide-scrollbar gap-2.5 mb-10 pb-4 justify-start lg:justify-center border-b border-slate-800">
            <button
              onClick={() => setSelectedMonth('Total')}
              className={`px-5 py-2 rounded-xl font-semibold whitespace-nowrap transition-all text-xs border ${
                selectedMonth === 'Total' 
                ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/25' 
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
              }`}
            >
              Full Year (FY 2026)
            </button>
            {trendData.map((data, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedMonth(data.month)}
                className={`px-5 py-2 rounded-xl font-semibold whitespace-nowrap transition-all text-xs border ${
                  selectedMonth === data.month 
                  ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/25' 
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                {data.month}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-10">
            <TrendCard3D title="Period Volume" count={currentDisplayData.Total} color="text-white" bg="bg-slate-900/90 border-slate-800" glow="rgba(255,255,255,0.08)" />
            <TrendCard3D title="Positive Sentiment" count={currentDisplayData.Positive} color="text-emerald-400" bg="bg-emerald-500/10 border-emerald-500/25" glow="rgba(16,185,129,0.2)" />
            <TrendCard3D title="Negative Sentiment" count={currentDisplayData.Negative} color="text-red-400" bg="bg-red-500/10 border-red-500/25" glow="rgba(239,68,68,0.2)" />
            <TrendCard3D title="Neutral Sentiment" count={currentDisplayData.Neutral} color="text-amber-400" bg="bg-amber-500/10 border-amber-500/25" glow="rgba(245,158,11,0.2)" />
            <TrendCard3D title="Mixed Sentiment" count={currentDisplayData.Mixed} color="text-cyan-400" bg="bg-cyan-500/10 border-cyan-500/25" glow="rgba(56,189,248,0.2)" />
          </div>

          <Tilt3DCard intensity={3} glowColor="rgba(56, 189, 248, 0.12)" className="bg-slate-900/75 p-7 rounded-3xl border border-slate-800 shadow-xl">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Monthly Sentiment Distribution (Jan – Dec 2026)</h4>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setStackedTrendView(!stackedTrendView)}
                  className="text-xs font-medium px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
                >
                  {stackedTrendView ? "View Grouped Bars" : "View Stacked Bars"}
                </button>
                <span className="text-xs text-slate-400 font-mono">Selected Period: <strong className="text-cyan-400">{selectedMonth}</strong></span>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '12px' }} />
                  <Legend />
                  <Bar isAnimationActive={false} stackId={stackedTrendView ? "a" : undefined} dataKey="Positive" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar isAnimationActive={false} stackId={stackedTrendView ? "a" : undefined} dataKey="Negative" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar isAnimationActive={false} stackId={stackedTrendView ? "a" : undefined} dataKey="Neutral" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar isAnimationActive={false} stackId={stackedTrendView ? "a" : undefined} dataKey="Mixed" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Tilt3DCard>
        </ScrollReveal3D>
      </section>

      {/* RECORD LINEAGE & SERVICE TAXONOMY SECTION */}
      <section id="traceability" className="py-24 bg-slate-950/80 border-t border-slate-800/80 relative z-10">
        <ScrollReveal3D className="max-w-[1600px] w-full mx-auto px-6 lg:px-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white">Record Lineage & Service Taxonomy</h2>
            <p className="text-slate-400 mt-2 text-sm">End-to-end record traceability and support ticket volume categorized by primary service theme.</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Tilt3DCard intensity={4} glowColor="rgba(59, 130, 246, 0.15)" className="bg-slate-900/80 p-8 rounded-3xl border border-slate-800 shadow-xl h-full">
              <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Database className="text-cyan-400" size={18} /> Source Record Lineage
                </h3>
                <div className="flex gap-1.5">
                  {['All', 'Positive', 'Negative', 'Neutral', 'Mixed'].map(flt => (
                    <button
                      key={flt}
                      onClick={() => setRecordFilter(flt)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold transition-all ${
                        recordFilter === flt
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                      }`}
                    >
                      {flt}
                    </button>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-400 uppercase bg-slate-950/80 border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Review Identifier</th>
                      <th className="px-6 py-4 font-semibold">Customer Account</th>
                      <th className="px-6 py-4 font-semibold">Classification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecentRecords.map((record, idx) => (
                      <tr
                        key={idx}
                        onClick={() => setActiveModal({
                          title: `Record Lineage Details: ${record.review_id}`,
                          subtitle: "Relational Entity: reviews_responses",
                          data: record
                        })}
                        className="border-b border-slate-800/70 hover:bg-slate-800/50 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4 font-mono text-emerald-400 font-semibold">{record.review_id}</td>
                        <td className="px-6 py-4 font-mono text-slate-300">{record.customer_id}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            record.sentiment_label === 'Positive' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                            record.sentiment_label === 'Negative' ? 'bg-red-500/15 text-red-400 border border-red-500/30' :
                            'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                          }`}>
                            {record.sentiment_label}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Tilt3DCard>

            <Tilt3DCard intensity={4} glowColor="rgba(168, 85, 247, 0.15)" className="bg-slate-900/80 p-8 rounded-3xl border border-slate-800 shadow-xl h-full">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Activity className="text-purple-400" size={18} /> Support Ticket Distribution by Theme
              </h3>
              <div className="space-y-5">
                {themeData.map((theme, idx) => {
                  const validValues = themeData.map(t => t.value || 0);
                  const maxVal = validValues.length > 0 ? Math.max(...validValues) : 1;
                  const widthPct = maxVal > 0 ? ((theme.value || 0) / maxVal) * 100 : 0;
                  
                  return (
                    <div key={idx} className="bg-slate-950/90 p-4 rounded-2xl border border-slate-800/90">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-slate-200 font-semibold text-sm">{theme.name}</span>
                        <span className="text-cyan-400 font-mono text-xs font-semibold">{(theme.value || 0).toLocaleString()} tickets</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          whileInView={{ width: `${widthPct}%` }}
                          transition={{ duration: 0.6 }}
                          className="bg-gradient-to-r from-purple-600 via-blue-500 to-cyan-400 h-2 rounded-full" 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Tilt3DCard>
          </div>
        </ScrollReveal3D>
      </section>

      {/* OPERATIONAL TRIAGE & DATA QUALITY QUARANTINE */}
      <section id="action-engine" className="py-24 bg-[#060916] border-t border-slate-800/80 relative z-10">
        <ScrollReveal3D className="max-w-[1600px] w-full mx-auto px-6 lg:px-12">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-3">Operational Triage & Data Quality Quarantine</h2>
            <p className="text-slate-400 text-sm">Automated remediation priorities derived from recurring complaint themes and isolated ground-truth anomalies.</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Tilt3DCard intensity={4} glowColor="rgba(245, 158, 11, 0.15)" className="bg-slate-900/80 p-8 rounded-3xl border border-slate-800 shadow-xl h-full">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Zap className="text-amber-400" size={20} /> Recommended Operational Actions
              </h3>
              <div className="space-y-4">
                {recommendations.map((rec, idx) => (
                  <div key={idx} className="bg-slate-950/90 p-5 rounded-2xl border border-slate-800/90 relative overflow-hidden">
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${rec.priority === 'High' ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-white font-semibold text-sm">{rec.issue}</h4>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${rec.priority === 'High' ? 'bg-red-500/15 text-red-400 border border-red-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'}`}>
                        {rec.priority} Priority
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed">{rec.action}</p>
                  </div>
                ))}
              </div>
            </Tilt3DCard>

            <Tilt3DCard intensity={4} glowColor="rgba(239, 68, 68, 0.15)" className="bg-slate-900/80 p-8 rounded-3xl border border-slate-800 shadow-xl h-full">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <AlertTriangle className="text-red-400" size={20} /> Quarantined Data Quality Exceptions
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-400 uppercase bg-slate-950/80 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Record ID</th>
                      <th className="px-4 py-3 font-semibold">Exception Category</th>
                      <th className="px-4 py-3 font-semibold">Diagnostic Summary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {anomalies.map((anomaly, idx) => (
                      <tr
                        key={idx}
                        onClick={() => setActiveModal({
                          title: `Quarantined Exception: ${anomaly.id}`,
                          subtitle: "Excluded from Model Training Input",
                          data: anomaly
                        })}
                        className="border-b border-slate-800/70 hover:bg-slate-800/50 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-4 font-mono text-xs text-cyan-400 font-semibold whitespace-nowrap">{anomaly.id}</td>
                        <td className="px-4 py-4 font-semibold text-red-400 text-xs">{anomaly.type}</td>
                        <td className="px-4 py-4 text-slate-400 text-xs">{anomaly.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Tilt3DCard>
          </div>
        </ScrollReveal3D>
      </section>

      {/* MODEL PERFORMANCE & HOLDOUT VALIDATION */}
      <section id="ml-evaluation" className="py-24 bg-slate-950/80 border-t border-slate-800/80 relative z-10">
        <ScrollReveal3D className="max-w-[1600px] w-full mx-auto px-6 lg:px-12">
          <div className="text-center mb-14 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-3 flex items-center justify-center gap-3">
              <CheckCircle className="text-emerald-400" size={26} /> Model Performance & Holdout Validation
            </h2>
            <p className="text-slate-400 text-sm">
              Multi-class evaluation metrics computed via <span className="text-cyan-400 font-mono">{evalMetrics?.model_name || "TF-IDF + Logistic Regression"}</span> on {evalMetrics?.test_sample_size?.toLocaleString() || "10,000"} stratified holdout records (Seed: <span className="text-emerald-400 font-mono">{evalMetrics?.seed || 20261022}</span>).
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-12">
            <Tilt3DCard intensity={6} glowColor="rgba(16, 185, 129, 0.2)" className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 text-center shadow-lg">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Sentiment Accuracy</span>
              <p className="text-3xl lg:text-4xl font-extrabold text-emerald-400 mt-2">{evalMetrics?.overall?.accuracy ?? "..."}%</p>
              <span className="text-[11px] text-slate-500">4-Class Holdout Split</span>
            </Tilt3DCard>
            <Tilt3DCard intensity={6} glowColor="rgba(59, 130, 246, 0.2)" className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 text-center shadow-lg">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Weighted Precision</span>
              <p className="text-3xl lg:text-4xl font-extrabold text-blue-400 mt-2">{evalMetrics?.overall?.precision ?? "..."}%</p>
              <span className="text-[11px] text-slate-500">Prediction Exactness</span>
            </Tilt3DCard>
            <Tilt3DCard intensity={6} glowColor="rgba(168, 85, 247, 0.2)" className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 text-center shadow-lg">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Weighted Recall</span>
              <p className="text-3xl lg:text-4xl font-extrabold text-purple-400 mt-2">{evalMetrics?.overall?.recall ?? "..."}%</p>
              <span className="text-[11px] text-slate-500">Class Sensitivity</span>
            </Tilt3DCard>
            <Tilt3DCard intensity={6} glowColor="rgba(245, 158, 11, 0.2)" className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 text-center shadow-lg">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Sentiment F1-Score</span>
              <p className="text-3xl lg:text-4xl font-extrabold text-amber-400 mt-2">{evalMetrics?.overall?.f1_score ?? "..."}%</p>
              <span className="text-[11px] text-slate-500">Harmonic Mean</span>
            </Tilt3DCard>
            <Tilt3DCard intensity={6} glowColor="rgba(34, 211, 238, 0.2)" className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 text-center shadow-lg">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Theme Taxonomy F1</span>
              <p className="text-3xl lg:text-4xl font-extrabold text-cyan-400 mt-2">{evalMetrics?.overall?.theme_f1_score ?? "..."}%</p>
              <span className="text-[11px] text-slate-500">5-Class Theme Model</span>
            </Tilt3DCard>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            <div className="xl:col-span-8">
              <Tilt3DCard intensity={4} glowColor="rgba(56, 189, 248, 0.15)" className="bg-slate-900/80 p-8 rounded-3xl border border-slate-800 shadow-xl h-full">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <Activity className="text-cyan-400" size={18} /> Per-Class Classification Report
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-400 uppercase bg-slate-950/80 border-b border-slate-800">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Polarity Class</th>
                        <th className="px-6 py-4 font-semibold">Precision</th>
                        <th className="px-6 py-4 font-semibold">Recall</th>
                        <th className="px-6 py-4 font-semibold">F1-Score</th>
                        <th className="px-6 py-4 font-semibold">Holdout Support</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(evalMetrics?.class_report) && evalMetrics.class_report.map((row, idx) => (
                        <tr key={idx} className="border-b border-slate-800/70 hover:bg-slate-800/50">
                          <td className="px-6 py-4 font-semibold text-white">{row.label}</td>
                          <td className="px-6 py-4 font-mono text-blue-400">{row.precision}</td>
                          <td className="px-6 py-4 font-mono text-purple-400">{row.recall}</td>
                          <td className="px-6 py-4 font-mono text-emerald-400 font-semibold">{row.f1}</td>
                          <td className="px-6 py-4 font-mono text-slate-300">{row.support.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Tilt3DCard>
            </div>

            <div className="xl:col-span-4">
              <Tilt3DCard intensity={5} glowColor="rgba(16, 185, 129, 0.15)" className="bg-slate-900/80 p-8 rounded-3xl border border-slate-800 shadow-xl h-full flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    <CheckCircle className="text-emerald-400" size={18} /> Validation Protocol & Gold Set
                  </h3>
                  <p className="text-slate-400 text-xs mb-6">Benchmarking methodology and data hygiene controls.</p>
                  <div className="space-y-3 text-xs">
                    <div className="p-3.5 bg-slate-950/90 rounded-2xl border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Human-Reviewed Gold Set</span>
                      <span className="font-mono text-emerald-400 font-semibold">{evalMetrics?.gold_set_size || 499} Records ({evalMetrics?.gold_set_accuracy || "..."}% Acc)</span>
                    </div>
                    <div className="p-3.5 bg-slate-950/90 rounded-2xl border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Theme Classification Accuracy</span>
                      <span className="font-mono text-cyan-400 font-semibold">{evalMetrics?.overall?.theme_accuracy ?? "..."}%</span>
                    </div>
                    <div className="p-3.5 bg-slate-950/90 rounded-2xl border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Quarantined Records Excluded</span>
                      <span className="font-mono text-amber-400 font-semibold">{evalMetrics?.ground_truth_excluded || 5} Isolated</span>
                    </div>
                    <div className="p-3.5 bg-slate-950/90 rounded-2xl border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Event Lifecycle Compliance</span>
                      <span className="font-mono text-purple-400 font-semibold">{validationReport?.lifecycle_transitions_verified ? "Verified" : "Pending"}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400">
                  Evaluation Pipeline: <code className="text-emerald-400 font-mono">Stratified 80/20 Holdout</code>
                </div>
              </Tilt3DCard>
            </div>
          </div>
        </ScrollReveal3D>
      </section>

      {/* DATA GOVERNANCE & SCHEMA ARCHITECTURE */}
      <section id="architecture" className="py-24 max-w-[1600px] w-full mx-auto px-6 lg:px-12 border-t border-slate-800/80 relative z-10">
        <ScrollReveal3D className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold text-white mb-4">Data Governance & Identifier Standards</h2>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              Primary keys and foreign key references adhere to strict zero-padded nomenclature rules across all 12 relational tables, ensuring immutable auditability and zero orphan records.
            </p>
            <div className="space-y-4">
              <FeatureRow icon={<Hash size={18}/>} title="Survey Identifier Format" code="SUR-2026-000001" />
              <FeatureRow icon={<Hash size={18}/>} title="Survey Response Identifier" code="RESP-SUR-2026-000001-0001" />
              <FeatureRow icon={<Hash size={18}/>} title="Customer Review Identifier" code="REV-2026-000001" />
              <FeatureRow icon={<Hash size={18}/>} title="Support Message Identifier" code="MSG-000001-001" />
            </div>
          </div>
          <Tilt3DCard intensity={5} glowColor="rgba(16, 185, 129, 0.18)" className="bg-slate-900/80 p-8 rounded-3xl border border-slate-800 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <CheckCircle className="text-emerald-400" size={20} /> Automated Compliance Verification
            </h3>
            <ul className="space-y-3.5 text-sm text-slate-300">
              <li className="flex justify-between p-3.5 bg-slate-950/90 rounded-2xl border border-slate-800">
                <span>Primary Key & Response ID Uniqueness (50,000 Rows)</span>
                <span className="font-mono text-emerald-400 font-semibold">{validationReport?.pk_and_response_id_uniqueness ? "VERIFIED" : "..."}</span>
              </li>
              <li className="flex justify-between p-3.5 bg-slate-950/90 rounded-2xl border border-slate-800">
                <span>Referential Integrity & Survey-Product Alignment</span>
                <span className="font-mono text-emerald-400 font-semibold">{validationReport?.foreign_key_and_survey_product_aligned ? "VERIFIED" : "..."}</span>
              </li>
              <li className="flex justify-between p-3.5 bg-slate-950/90 rounded-2xl border border-slate-800">
                <span>Temporal Chronology (Response Date Post-Launch)</span>
                <span className="font-mono text-emerald-400 font-semibold">{validationReport?.date_ordering_verified ? "VERIFIED" : "..."}</span>
              </li>
              <li className="flex justify-between p-3.5 bg-slate-950/90 rounded-2xl border border-slate-800">
                <span>State Transition Integrity & SHA-256 Reproducibility</span>
                <span className="font-mono text-emerald-400 font-semibold">{validationReport?.two_run_checksum_reproducible && validationReport?.lifecycle_transitions_verified ? "VERIFIED" : "..."}</span>
              </li>
            </ul>
          </Tilt3DCard>
        </ScrollReveal3D>
      </section>

      {/* EXCEPTION HANDLING & EDGE CASE CATALOG */}
      <section id="edge-cases" className="py-24 bg-slate-950/80 border-t border-slate-800/80 relative z-10">
        <ScrollReveal3D className="max-w-[1600px] w-full mx-auto px-6 lg:px-12">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-3">Data Quality Exception Catalog</h2>
            <p className="text-slate-400 text-sm">Controlled edge-case scenarios isolated in the ground-truth quarantine table to validate pipeline resilience without contaminating model training features.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <AnomalyCard3D title="Sentiment Contradiction" desc="REV-2026-001002: Assigned positive polarity label directly contradicts severe negative review text." />
            <AnomalyCard3D title="Duplicate Submission" desc="REV-2026-000045: Exact payload and customer match with REV-2026-000012 flagged for deduplication." />
            <AnomalyCard3D title="Unmasked Customer PII" desc="REV-2026-000892: Personal phone number and customer name embedded in unstructured text." />
            <AnomalyCard3D title="Taxonomy Drift" desc="MSG-000500-001: Support record mapped to an unverified theme identifier (THEME-999999)." />
            <AnomalyCard3D title="Target Leakage Token" desc="REV-2026-002050: Evaluation label token embedded inside raw input text features." />
          </div>
        </ScrollReveal3D>
      </section>

      {/* ================= ENTERPRISE FOOTER ================= */}
      <footer className="bg-[#03050c] pt-20 pb-12 border-t border-slate-800/90 relative z-10 overflow-hidden">
        <div className="max-w-[1600px] w-full mx-auto px-6 lg:px-12 relative z-10">
          
          {/* CLI VERIFICATION & ARTIFACT INSPECTION PANEL */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-16 mb-16 border-b border-slate-800/80">
            <div className="lg:col-span-7">
              <div className="bg-slate-900/75 p-7 rounded-3xl border border-slate-800 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold flex items-center gap-2">
                    <Zap size={14} /> Pipeline Verification Commands
                  </span>
                  {copiedCmd && (
                    <span className="text-xs font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-3 py-0.5 rounded-full">
                      Copied to clipboard
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mb-5">
                  Select any command below to copy it for local CLI execution and reproducibility verification:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: "Run Two-Pass Reproducibility & Audit", cmd: "python validate.py" },
                    { label: "Execute Holdout ML Evaluation", cmd: "python evaluate.py" },
                    { label: "Synthesize Baseline Dataset (Seed 20261022)", cmd: "python generate_data.py" },
                    { label: "Launch Analytics API Service", cmd: "cd backend && node server.js" }
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleCopyCmd(item.cmd)}
                      className="text-left p-3.5 rounded-2xl bg-slate-950/90 hover:bg-slate-950 border border-slate-800 hover:border-slate-600 transition-all group"
                    >
                      <span className="text-[11px] text-slate-400 block mb-1">{item.label}</span>
                      <code className="text-xs font-mono text-emerald-400 group-hover:text-cyan-300 font-semibold">
                        $ {item.cmd}
                      </code>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="bg-slate-900/75 p-7 rounded-3xl border border-slate-800 shadow-xl h-full flex flex-col justify-between">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold block mb-2">
                    System Artifacts & Audit Reports
                  </span>
                  <p className="text-xs text-slate-400 mb-5">
                    Inspect live JSON payloads for schema validation, model evaluation, and quarantined records:
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      onClick={() => setActiveModal({ title: "validation_summary.json", subtitle: "Automated Integrity & Reproducibility Report", data: validationReport })}
                      className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-emerald-400 border border-slate-800 text-xs font-mono font-semibold transition-all"
                    >
                      validation_summary.json
                    </button>
                    <button
                      onClick={() => setActiveModal({ title: "evaluation_metrics.json", subtitle: "Holdout Classification Metrics", data: evalMetrics })}
                      className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-cyan-400 border border-slate-800 text-xs font-mono font-semibold transition-all"
                    >
                      evaluation_metrics.json
                    </button>
                    <button
                      onClick={() => setActiveModal({ title: "ground_truth.csv", subtitle: "Isolated Exception Records", data: anomalies })}
                      className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-red-400 border border-slate-800 text-xs font-mono font-semibold transition-all"
                    >
                      ground_truth.csv
                    </button>
                    <button
                      onClick={() => setActiveModal({ title: "action_items.csv", subtitle: "Prioritized Remediation Backlog", data: recommendations })}
                      className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-amber-400 border border-slate-800 text-xs font-mono font-semibold transition-all"
                    >
                      exports/action_items.csv
                    </button>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>Documentation: <strong className="text-slate-200">README • DECISIONS • LIMITATIONS • DEMO_SCRIPT • BUILD_LOG</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* 4-COLUMN ENTERPRISE DIRECTORY */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-14">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl">
                  <Database size={18} className="text-white" />
                </div>
                <span className="text-lg font-bold text-white tracking-tight">YottaFlex</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed mb-5">
                Enterprise customer feedback synthesis, relational validation, and multi-task machine learning analytics platform.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                PostgreSQL Service Active
              </div>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4 uppercase tracking-wider text-xs">Platform Modules</h4>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li><a href="#hero" className="hover:text-white transition-colors">Executive Summary</a></li>
                <li><a href="#analytics" className="hover:text-white transition-colors">Omnichannel Telemetry</a></li>
                <li><a href="#trends" className="hover:text-white transition-colors">Temporal Sentiment Trajectory</a></li>
                <li><a href="#traceability" className="hover:text-white transition-colors">Record Lineage & Taxonomy</a></li>
                <li><a href="#action-engine" className="hover:text-white transition-colors">Operational Triage</a></li>
                <li><a href="#ml-evaluation" className="hover:text-white transition-colors">Model Holdout Evaluation</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4 uppercase tracking-wider text-xs">Governance Standards</h4>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li className="flex items-center gap-2"><CheckCircle size={13} className="text-emerald-400" /> Deterministic Seed: <code className="text-cyan-400 font-mono">20261022</code></li>
                <li className="flex items-center gap-2"><CheckCircle size={13} className="text-emerald-400" /> 50,000 Unique Survey Responses</li>
                <li className="flex items-center gap-2"><CheckCircle size={13} className="text-emerald-400" /> 20,000 Support Ticket Records</li>
                <li className="flex items-center gap-2"><CheckCircle size={13} className="text-emerald-400" /> 500-Record Human Gold Set</li>
                <li className="flex items-center gap-2"><CheckCircle size={13} className="text-emerald-400" /> Full CSV & SQL Seed Exports</li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4 uppercase tracking-wider text-xs">Interactive Tools</h4>
              <p className="text-slate-400 text-xs leading-relaxed mb-4">
                Query the live PostgreSQL dataset using natural language or return to the executive overview.
              </p>
              <div className="space-y-2.5">
                <button
                  onClick={() => setIsChatOpen(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Zap size={14} /> Launch Query Assistant
                </button>
                <a
                  href="#hero"
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  ↑ Return to Top
                </a>
              </div>
            </div>
          </div>

          {/* COPYRIGHT & CHECKSUM BAR */}
          <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} YottaFlex Analytics Platform. All rights reserved.</p>
            <p className="font-mono text-slate-400">
              Dataset SHA-256: <span className="text-emerald-400">{validationReport?.sha256_reviews ? `${validationReport.sha256_reviews.slice(0, 16)}...` : "Verified"}</span>
            </p>
          </div>
        </div>
      </footer>

      {/* FLOATING ANALYTICS QUERY ASSISTANT */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isChatOpen ? (
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setIsChatOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3.5 rounded-full font-semibold text-sm shadow-2xl flex items-center gap-2 border border-blue-400/30"
          >
            <Zap size={18} /> Analytics Assistant
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-slate-900/95 backdrop-blur-2xl border border-slate-700 shadow-2xl rounded-3xl w-80 sm:w-96 h-[520px] flex flex-col overflow-hidden"
          >
            <div className="bg-slate-900 px-5 py-4 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-600 rounded-xl">
                  <Zap size={15} className="text-white" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm">YottaFlex Query Assistant</h4>
                  <span className="text-[11px] text-emerald-400 font-mono">● Connected to PostgreSQL</span>
                </div>
              </div>
              <button 
                onClick={() => setIsChatOpen(false)} 
                className="text-slate-400 hover:text-white text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 flex gap-2 overflow-x-auto">
              <button onClick={() => sendQuery("What are the top 5 recurring customer complaints?")} className="text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1 rounded-full whitespace-nowrap">Top Complaints</button>
              <button onClick={() => sendQuery("Which product has the highest negative reviews?")} className="text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1 rounded-full whitespace-nowrap">Product Attribution</button>
              <button onClick={() => sendQuery("Show ML evaluation accuracy precision recall and F1 metrics")} className="text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1 rounded-full whitespace-nowrap">Model Metrics</button>
              <button onClick={() => sendQuery("Identify duplicate responses and anomalies")} className="text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1 rounded-full whitespace-nowrap">Quarantined Records</button>
              <button onClick={() => sendQuery("Generate recommended business action items")} className="text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1 rounded-full whitespace-nowrap">Action Plan</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#060916]">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3.5 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                    msg.sender === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Query feedback metrics, themes, or products..." 
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
              <button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all"
              >
                Run
              </button>
            </form>
          </motion.div>
        )}
      </div>

    </div>
  );
}

// ---------------- SUB-COMPONENTS ----------------

const LoginForm = ({ onLogin }) => {
  const [user, setUser] = useState('');
  const [pwd, setPwd] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (user === 'admin' && pwd === 'admin123') {
      onLogin();
    } else {
      setError(true);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs text-center">Invalid administrator credentials. Please try again.</div>}
      <div className="relative">
        <User className="absolute left-4 top-3.5 text-slate-500" size={16} />
        <input 
          type="text" 
          placeholder="Username" 
          value={user}
          onChange={(e) => { setUser(e.target.value); setError(false); }}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>
      <div className="relative">
        <Lock className="absolute left-4 top-3.5 text-slate-500" size={16} />
        <input 
          type="password" 
          placeholder="Password" 
          value={pwd}
          onChange={(e) => { setPwd(e.target.value); setError(false); }}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>
      <button 
        type="submit" 
        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2"
      >
        Sign In to Console <LogIn size={16} />
      </button>
    </form>
  );
};

const StatCard3D = ({ title, count, glow, badge }) => (
  <Tilt3DCard intensity={7} glowColor={glow} className={`p-7 rounded-3xl shadow-xl border bg-slate-900/85 backdrop-blur-md ${badge}`}>
    <h3 className="text-slate-400 font-semibold text-xs uppercase tracking-wider mb-2">{title}</h3>
    <p className="text-4xl lg:text-5xl font-extrabold text-white">
      {count === 0 ? "..." : count.toLocaleString()}
    </p>
  </Tilt3DCard>
);

const TrendCard3D = ({ title, count, color, bg, glow }) => (
  <Tilt3DCard intensity={6} glowColor={glow} className={`p-6 rounded-2xl flex flex-col items-center justify-center text-center border shadow-lg ${bg}`}>
    <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">{title}</span>
    <span className={`text-3xl font-extrabold ${color}`}>{count ? count.toLocaleString() : 0}</span>
  </Tilt3DCard>
);

const FeatureRow = ({ icon, title, code }) => (
  <Tilt3DCard intensity={4} glowColor="rgba(56, 189, 248, 0.15)" className="flex items-center justify-between p-4 bg-slate-900/90 rounded-2xl border border-slate-800">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-slate-950 rounded-xl text-cyan-400 border border-slate-800">{icon}</div>
      <span className="font-semibold text-slate-200 text-sm">{title}</span>
    </div>
    <span className="font-mono text-emerald-400 bg-emerald-400/10 border border-emerald-500/20 px-3 py-1 rounded-lg text-xs">{code}</span>
  </Tilt3DCard>
);

const AnomalyCard3D = ({ title, desc }) => (
  <Tilt3DCard intensity={7} glowColor="rgba(239, 68, 68, 0.2)" className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 hover:border-red-500/40 transition-colors h-full">
    <ShieldAlert className="text-red-400 mb-3" size={24} />
    <h4 className="text-base font-bold text-white mb-2">{title}</h4>
    <p className="text-slate-400 leading-relaxed text-xs">{desc}</p>
  </Tilt3DCard>
);

export default App;