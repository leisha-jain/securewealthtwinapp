import React, { useState, useEffect } from 'react';
import axios from "axios";
import './Dashboard.css';
import { useCountUp } from '../utils/helpers';
import ExplainCard from '../components/ExplainCard';
import RiskInterceptModal from "../components/RiskInterceptModal";
import { t } from '../utils/languageStrings';
import { Capacitor } from '@capacitor/core';
import HealthScoreBadge from '../components/HealthScoreBadge';
import {
  LayoutDashboard, Target, Landmark, PieChart as PieIcon,
  AlertTriangle, Settings, LifeBuoy, Moon, Sun, Bell,
  ChevronRight, Zap, TrendingUp, TrendingDown, BookOpen, Bot, X, Maximize2, Minimize2,
  CheckCircle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const velocityData = [
  { name: 'Jan', amt: 55000 },
  { name: 'Feb', amt: 65000 },
  { name: 'Mar', amt: 90000 },
  { name: 'Apr', amt: 70000 },
  { name: 'May', amt: 85000 },
  { name: 'Jun', amt: 110000 },
  { name: 'Jul', amt: 120000 },
  { name: 'Aug', amt: 135000, isCurrent: true },
];

const outflowData = [
  { name: 'Housing & Equity', value: 40, color: '#005f52' },
  { name: 'Lifestyle & Tech', value: 25, color: '#14b8a6' },
  { name: 'Risk Management', value: 15, color: '#f59e0b' },
  { name: 'Other', value: 20, color: '#e5e7eb' },
];

const MOCK_NEWS = [
  {
    category: "MARKET",
    headline: "Nifty 50 hits all-time high as FII inflows surge ₹12,400 Cr this week",
    time: "2h ago",
    impact: "positive",
    tag: "Bullish",
  },
  {
    category: "RBI",
    headline: "RBI keeps repo rate at 6.5% for 7th consecutive meeting — EMIs unchanged",
    time: "5h ago",
    impact: "neutral",
    tag: "Neutral",
  },
  {
    category: "GOLD",
    headline: "Gold surges to ₹76,450/10g on global uncertainty — analysts target ₹82,000",
    time: "8h ago",
    impact: "positive",
    tag: "Watch",
  },
  {
    category: "TAX",
    headline: "SEBI tightens F&O rules: new margin requirements from Nov 1 — review your positions",
    time: "1d ago",
    impact: "negative",
    tag: "Action needed",
  },
  {
    category: "SIP",
    headline: "Mutual fund SIP inflows cross ₹21,000 Cr milestone for third straight month",
    time: "1d ago",
    impact: "positive",
    tag: "Bullish",
  },
  {
    category: "BUDGET",
    headline: "Finance Ministry hints at higher 80C limit in upcoming Union Budget 2026",
    time: "2d ago",
    impact: "positive",
    tag: "Opportunity",
  },
];

const MOCK_TICKER = [
  { label: 'HDFCBANK', val: '+1.4%', up: true },
  { label: 'NIFTY 50', val: '22,456', up: true },
  { label: 'GOLDBEES', val: '+0.9%', up: true },
  { label: 'RELIANCE', val: '+3.2%', up: true },
  { label: 'RBI Repo', val: '6.5%', up: false },
  { label: 'INFY', val: '-0.6%', up: false },
  { label: 'CPI Inflation', val: '5.8%', up: false },
  { label: 'TCS', val: '+0.3%', up: true },
  { label: 'SUNPHARMA', val: '+1.1%', up: true },
  { label: 'Gold ₹/10g', val: '₹76,450', up: true },
];

const MOCK_TRENDING = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', change_pct: 3.2, sector: 'Energy', inPortfolio: true },
  { symbol: 'GOLDBEES', name: 'Gold BeES ETF', change_pct: 0.9, sector: 'Gold', inPortfolio: true },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', change_pct: 1.4, sector: 'Banking', inPortfolio: false },
  { symbol: 'TCS', name: 'Tata Consultancy', change_pct: 0.3, sector: 'Tech', inPortfolio: false },
  { symbol: 'INFY', name: 'Infosys', change_pct: -0.6, sector: 'Tech', inPortfolio: false },
];

const MOCK_NUDGES = [
  'Gold up 13% — consider booking ₹20,000 profit this week.',
  'You have ₹48,000 unused 80C space before March 31.',
  'You overspent ₹3,200 on dining this month — review budget.',
];

// Skeleton loading card
function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-line w60" />
      <div className="skeleton-line w100" />
      <div className="skeleton-line w80" />
    </div>
  );
}

// Toast notification
function Toast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="toast-notification">
      <CheckCircle size={16} color="#059669" />
      {message}
    </div>
  );
}

// Market news ticker
function NewsTicker({ items }) {
  return (
    <div className="ticker-wrap">
      <div className="ticker">
        {[...items, ...items].map((item, i) => (
          <span key={i} className="ticker-item">
            <span className="ticker-label">{item.label}</span>
            <span className={`ticker-val ${item.up ? 'up' : 'down'}`}>{item.val}</span>
            <span className="ticker-sep">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// Market News section
function MarketNews({ news, language }) {
  const impactColor = { positive: '#059669', negative: '#dc2626', neutral: '#d97706' };
  const tagBg = { positive: '#d1fae5', negative: '#fee2e2', neutral: '#fef3c7' };
  return (
    <div className="market-news-section">
      <h4 className="market-news-title">
        <BookOpen size={15} /> {t(language, 'market_news')}
      </h4>
      <div className="market-news-list">
        {news.map((item, i) => (
          <div key={i} className="news-row">
            <div className="news-category-badge">{item.category}</div>
            <div className="news-body">
              <p className="news-headline">{item.headline}</p>
              <span className="news-time">{item.time}</span>
            </div>
            <span className="news-tag" style={{ background: tagBg[item.impact], color: impactColor[item.impact] }}>
              {item.tag}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Trending stocks panel
function TrendingStocks({ stocks, language }) {
  return (
    <div className="trending-panel">
      <h4 className="trending-title">
        <TrendingUp size={15} /> {t(language, 'trending_stocks')}
      </h4>
      {stocks.map((s) => (
        <div key={s.symbol} className="trending-row">
          <div className="trending-left">
            <span className="trending-symbol">{s.symbol}</span>
            <span className="trending-name">{s.name}</span>
          </div>
          <div className="trending-right">
            <span className={`trending-change ${s.change_pct >= 0 ? 'up' : 'down'}`}>
              {s.change_pct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {s.change_pct > 0 ? '+' : ''}{s.change_pct}%
            </span>
            {s.inPortfolio && <span className="portfolio-badge">{t(language, 'in_portfolio')}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

const getCategoryTranslation = (name, lang) => {
  const n = name.toLowerCase();
  if (n.includes("housing") || n.includes("equity")) return t(lang, 'housing_equity');
  if (n.includes("lifestyle") || n.includes("tech")) return t(lang, 'lifestyle_tech');
  if (n.includes("risk") || n.includes("management")) return t(lang, 'risk_management_cat');
  return t(lang, 'other');
};

const Dashboard = ({ language = 'en' }) => {
  const API_BASE = process.env.REACT_APP_API_URL || (Capacitor.isNativePlatform() ? "http://10.0.2.2:8000" : "http://localhost:8000");
  const CHAT_BASE = process.env.REACT_APP_CHAT_URL || "http://localhost:8003";

  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Advanced hackathon feature states
  const [screenSharingDetected, setScreenSharingDetected] = useState(false);
  const [sleepPending, setSleepPending] = useState(null);
  const [emergencyHeirMode, setEmergencyHeirMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [nightLock, setNightLock] = useState({ enabled: false, start: "22:00", end: "07:00" });
  const [nomineeInput, setNomineeInput] = useState({ name: "Sunita Mehta", phone: "+919876543210", relation: "Spouse", isEmergencyHeir: false });

  // 1. Screen sharing warning logic
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      setScreenSharingDetected(true);
    }
  }, []);

  // 2. Sleep On It banner state
  useEffect(() => {
    const pending = localStorage.getItem('sleep_on_it_pending');
    if (pending) {
      setSleepPending(JSON.parse(pending));
    }
  }, []);

  // 3. Load user configurations from backend
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await axios.get(`${API_BASE}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data?.user) {
          const u = res.data.user;
          setNightLock({
            enabled: !!u.night_lock_enabled,
            start: u.night_lock_start || "22:00",
            end: u.night_lock_end || "07:00"
          });
          if (u.nominee) {
            setNomineeInput(u.nominee);
            if (u.nominee.isEmergencyHeir) {
              setEmergencyHeirMode(true);
            }
          }
        }
      } catch (e) {
        console.warn("[Profile settings load] failed");
      }
    };
    loadProfile();
  }, []);

  const saveNightLock = async (enabled, start, end) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE}/api/auth/settings/night-lock`, { enabled, start, end }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNightLock({ enabled, start, end });
    } catch (e) {
      console.error(e);
    }
  };

  const saveNominee = async (nom) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE}/api/auth/settings/nominee`, nom, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNomineeInput(nom);
      if (nom.isEmergencyHeir) {
        setEmergencyHeirMode(true);
      } else {
        setEmergencyHeirMode(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const [profile, setProfile] = useState({
    name: "Priya Sharma",
    score: 72,
    velocityData,
    outflowData,
  });

  const [dashboardData, setDashboardData] = useState(null);
  const [velocityPeriod, setVelocityPeriod] = useState("6M");

  const getVelocityChartData = () => {
    const txs = dashboardData?.transactions || [];
    if (!txs || txs.length === 0) {
      return velocityData;
    }
    
    const sortedTxs = [...txs].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    if (velocityPeriod === '1M') {
      const lastDateStr = sortedTxs[sortedTxs.length - 1]?.date || new Date().toISOString();
      const lastDate = new Date(lastDateStr);
      const startDate = new Date(lastDate);
      startDate.setDate(startDate.getDate() - 30);
      
      const last30DaysTxs = sortedTxs.filter(t => {
        const d = new Date(t.date);
        return d >= startDate && d <= lastDate;
      });
      
      const weeks = [
        { name: 'Week 1', amt: 0 },
        { name: 'Week 2', amt: 0 },
        { name: 'Week 3', amt: 0 },
        { name: 'Week 4', amt: 0 }
      ];
      
      last30DaysTxs.forEach(t => {
        const d = new Date(t.date);
        const diffDays = Math.floor((d - startDate) / (1000 * 60 * 60 * 24));
        const weekIndex = Math.min(3, Math.floor(diffDays / 7.5));
        weeks[weekIndex].amt += t.amount;
      });
      
      return weeks;
    } else if (velocityPeriod === '6M') {
      const lastDateStr = sortedTxs[sortedTxs.length - 1]?.date || new Date().toISOString();
      const lastDate = new Date(lastDateStr);
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(lastDate.getFullYear(), lastDate.getMonth() - i, 1);
        months.push({
          year: d.getFullYear(),
          month: d.getMonth(),
          name: d.toLocaleString('en-IN', { month: 'short' }),
          amt: 0
        });
      }
      
      txs.forEach(t => {
        const td = new Date(t.date);
        const match = months.find(m => m.year === td.getFullYear() && m.month === td.getMonth());
        if (match) {
          match.amt += t.amount;
        }
      });
      
      return months.map(m => ({ name: m.name, amt: m.amt }));
    } else {
      const lastDateStr = sortedTxs[sortedTxs.length - 1]?.date || new Date().toISOString();
      const lastDate = new Date(lastDateStr);
      const months = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(lastDate.getFullYear(), lastDate.getMonth() - i, 1);
        months.push({
          year: d.getFullYear(),
          month: d.getMonth(),
          name: d.toLocaleString('en-IN', { month: 'short' }),
          amt: 0
        });
      }
      
      txs.forEach(t => {
        const td = new Date(t.date);
        const match = months.find(m => m.year === td.getFullYear() && m.month === td.getMonth());
        if (match) {
          match.amt += t.amount;
        }
      });
      
      return months.map(m => ({ name: m.name, amt: m.amt }));
    }
  };

  const [goals, setGoals] = useState([]);
  const [newGoal, setNewGoal] = useState("");
  const [toast, setToast] = useState(null);
  const [nudges, setNudges] = useState(MOCK_NUDGES);
  const [trendingStocks] = useState(MOCK_TRENDING);
  const [tickerItems] = useState(MOCK_TICKER);
  const [scoreAnimated, setScoreAnimated] = useState(0);
  const liabilitiesList = (() => {
    const saved = localStorage.getItem('swt_liabilities');
    return saved ? JSON.parse(saved) : [
      { label: "Commercial Mortgage", val: 620000 },
      { label: "Corporate Credit", val: 110000 }
    ];
  })();
  const totalOutflowVal = liabilitiesList.reduce((sum, item) => sum + item.val, 0);
  const animatedTotal = useCountUp(totalOutflowVal, 1200);

  const [riskModal, setRiskModal] = useState({
    isOpen: false,
    decision: null,
    riskScore: 0,
    message: ""
  });

  const [pendingAction, setPendingAction] = useState(null);

  const toggleFullScreen = () => setIsFullScreen(!isFullScreen);

  const sendChat = async () => {
    if (!chatInput.trim()) return;

    const msg = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: msg }]);

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const sessionAssets = JSON.parse(localStorage.getItem('swt_assets') || '[]');
    const sessionLiabilities = JSON.parse(localStorage.getItem('swt_liabilities') || '[]');
    const sessionGoals = JSON.parse(localStorage.getItem('swt_goals') || '[]');

    const mergedProfile = {
      ...user,
      assets: sessionAssets,
      liabilities: sessionLiabilities,
      goals: sessionGoals,
    };

    const history = chatMessages.slice(-10).map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.text
    }));

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_BASE}/api/chat/message`, {
        userId: user.userId || 'demo-user',
        message: msg,
        history,
        language,
        profile: mergedProfile,
        user_profile: mergedProfile,
        sessionUpdates: {
          assets: sessionAssets,
          liabilities: sessionLiabilities,
          goals: sessionGoals
        },
        userAdditions: {
          assets: sessionAssets,
          liabilities: sessionLiabilities,
          goals: sessionGoals
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const reply = res.data.reply || res.data.response || "No response.";
      setChatMessages(prev => [...prev, { role: 'bot', text: reply }]);
    } catch (err) {
      console.warn("[Dashboard Chat API Failed]:", err.message);
      const errMsg = `Error: ${err.response?.data?.error || err.message}`;
      setChatMessages(prev => [...prev, { role: 'bot', text: errMsg }]);
    }
  };

  const securityGate = async (actionToRun, metadata) => {
    if (emergencyHeirMode) {
      setToast("Access Denied: Nominee emergency view mode is active. Outbound transactions and portfolio changes are restricted.");
      return;
    }
    try {
      const res = await axios.post(
        `${API_BASE}/api/action/execute`,
        metadata,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      const reasons = res.data.triggered_signals
        ?.filter(s => s.triggered)
        .map(s => s.reason)
        .join("\n• ");

      setPendingAction(() => actionToRun);

      setRiskModal({
        isOpen: true,
        decision: res.data.decision,
        riskScore: res.data.risk_score,
        message: reasons ? "• " + reasons : "No major risk signals detected."
      });

    } catch (err) {
      setRiskModal({
        isOpen: true,
        decision: 'BLOCK',
        riskScore: 0,
        message: "Security protocols offline. Wealth actions restricted."
      });
    }
  };

  const handleAddGoal = async () => {
    if (emergencyHeirMode) {
      setToast("Access Denied: Nominee emergency view mode is active. Adding goals is restricted.");
      return;
    }
    if (!newGoal.trim()) {
      setToast("Please enter a valid goal title.");
      return;
    }

    const user = JSON.parse(localStorage.getItem("user"));

    try {
      const res = await axios.post(
        `${API_BASE}/api/user/${user.userId}/goals`,
        {
          title: newGoal,
          targetAmount: 100000,
          deadline: "2026-12-31"
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      setGoals(prev => [...prev, res.data]);
      setNewGoal("");
      setToast('Goal added successfully');
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user) return;
        const res = await axios.get(`${API_BASE}/api/user/${user.userId}/dashboard`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        });

        setProfile({
          name: res.data.user?.name,
          score: res.data.user?.health_score,
          velocityData: velocityData,
          outflowData: outflowData
        });
        setDashboardData(res.data);

        const goalsRes = await axios.get(
          `${API_BASE}/api/user/${user.userId}/goals`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`
            }
          }
        );

        setGoals(goalsRes.data);
      } catch (err) {
        setProfile({
          name: "Priya Sharma",
          score: 72,
          velocityData: velocityData,
          outflowData: outflowData
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Animate health score counter from 0 to actual value
  useEffect(() => {
    if (!loading && profile?.score) {
      let current = 0;
      const target = profile.score;
      const step = Math.ceil(target / 30);
      const t = setInterval(() => {
        current = Math.min(current + step, target);
        setScoreAnimated(current);
        if (current >= target) clearInterval(t);
      }, 40);
      return () => clearInterval(t);
    }
  }, [loading, profile?.score]);

  if (loading) {
    return (
      <div className="app-container">
        <main className="main-content">
          <div className="skeleton-header" />
          <div className="charts-grid">
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <div className="insights-grid">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      {/* Market News Ticker */}
      <NewsTicker items={tickerItems} />

      {/* ── Feature 3: Sleep On It Banner ── */}
      {sleepPending && (
        <div className="custom-banner sleep-banner" style={{ background: '#fffbeb', borderBottom: '1px solid #fef3c7', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: '#92400e' }}>
          <span>💤 <strong>Sleep On It Active</strong>: Yesterday you wanted to invest ₹{Number(sleepPending.amount || 25000).toLocaleString()} in {sleepPending.actionType || 'Axis Small Cap'}. Markets are up 0.8% since then. Still want to proceed?</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ padding: '4px 12px', background: '#d97706', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }} onClick={() => { localStorage.removeItem('sleep_on_it_pending'); setSleepPending(null); setToast('Transaction resumed!'); }}>Proceed</button>
            <button style={{ padding: '4px 12px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 4, cursor: 'pointer' }} onClick={() => { localStorage.removeItem('sleep_on_it_pending'); setSleepPending(null); }}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── Feature 7: Screen Sharing Warning Banner ── */}
      {screenSharingDetected && (
        <div className="custom-banner screenshare-banner" style={{ background: '#fff7ed', borderBottom: '1px solid #ffedd5', padding: '10px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#ea580c', fontWeight: '500' }}>
          <span>⚠️ <strong>Screen Sharing Warning</strong>: SecureWealth never asks you to share your screen. If anyone has asked you to install AnyDesk or TeamViewer, disconnect the call immediately.</span>
          <button onClick={() => setScreenSharingDetected(false)} style={{ background: 'none', border: 'none', color: '#ea580c', cursor: 'pointer', fontSize: 14, fontWeight: 'bold', padding: '0 4px' }} title="Dismiss warning">×</button>
        </div>
      )}

      {/* ── Feature 12: Nominee Emergency Mode Alert ── */}
      {emergencyHeirMode && (
        <div className="custom-banner emergency-banner" style={{ background: '#fef2f2', borderBottom: '1px solid #fee2e2', padding: '10px 24px', fontSize: 13, color: '#dc2626', fontWeight: 'bold' }}>
          ⚠️ <strong>Nominee emergency view active</strong>: Read-only access enabled for designated heir. Wealth actions and outbound transfers are restricted.
        </div>
      )}

      <div style={{ padding: '24px 32px', width: '100%', boxSizing: 'border-box' }}>
        <header className="top-header">
          <div className="user-profile">
            <img src="https://i.pravatar.cc/150?u=priya" alt="Priya" className="avatar" />
            <div className="user-info">
              <span className="user-name">{profile?.name || "Loading..."}</span>
              <span className="user-status">{emergencyHeirMode ? "NOMINEE ACCESS" : "PREMIUM MEMBER"}</span>
            </div>
          </div>
          <div className="header-actions" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button className="settings-btn-toggle" onClick={() => setShowSettings(!showSettings)} style={{ background: 'none', border: 'none', cursor: 'pointer', outline: 'none' }}>
              <Settings size={20} className="header-icon" style={{ color: showSettings ? '#005f52' : '#64748b' }} />
            </button>
            <div className="notification-bell">
              <Bell size={20} className="header-icon" />
              <span className="bell-dot"></span>
            </div>
          </div>
        </header>

        {/* ── Settings Panel Card ── */}
        {showSettings && (
          <div className="settings-panel-card" style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 16 }}>Advanced Deception &amp; Security Settings</h3>
            <div className="settings-grid" style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              
              {/* Night Lock Settings */}
              <div className="settings-section" style={{ flex: 1, minWidth: 250 }}>
                <h4 style={{ fontSize: 14, fontWeight: 'bold', color: '#0f172a', marginBottom: 8 }}>🌙 Transaction Lullaby (Night Lock)</h4>
                <p className="setting-desc" style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>Enforce auto-review for any transactions placed during sleep hours.</p>
                <div className="setting-row">
                  <label style={{ fontSize: 13, fontWeight: '600', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input 
                      type="checkbox" 
                      checked={nightLock.enabled} 
                      onChange={(e) => saveNightLock(e.target.checked, nightLock.start, nightLock.end)} 
                    />
                    Enable Night Lock
                  </label>
                </div>
                <div className="setting-row" style={{ marginTop: 10 }}>
                  <label style={{ fontSize: 13 }}>Lock Hours: </label>
                  <input 
                    type="text" 
                    value={nightLock.start} 
                    onChange={(e) => saveNightLock(nightLock.enabled, e.target.value, nightLock.end)} 
                    style={{ width: 60, padding: 4, marginLeft: 8, border: '1px solid #cbd5e1', borderRadius: 4, textAlign: 'center' }}
                  />
                  <span style={{ margin: '0 8px', fontSize: 13 }}>to</span>
                  <input 
                    type="text" 
                    value={nightLock.end} 
                    onChange={(e) => saveNightLock(nightLock.enabled, nightLock.start, e.target.value)} 
                    style={{ width: 60, padding: 4, border: '1px solid #cbd5e1', borderRadius: 4, textAlign: 'center' }}
                  />
                </div>
              </div>

              {/* Nominee Settings */}
              <div className="settings-section" style={{ flex: 1, minWidth: 250 }}>
                <h4 style={{ fontSize: 14, fontWeight: 'bold', color: '#0f172a', marginBottom: 8 }}>👁️ Trusted Contact (Second Pair of Eyes)</h4>
                <p className="setting-desc" style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>Nominate a spouse or family member to approve high-risk wealth actions.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input 
                    type="text" 
                    placeholder="Contact Name" 
                    value={nomineeInput.name} 
                    onChange={(e) => setNomineeInput({ ...nomineeInput, name: e.target.value })} 
                    style={{ padding: 6, borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 13 }}
                  />
                  <input 
                    type="text" 
                    placeholder="Phone (+919876543210)" 
                    value={nomineeInput.phone} 
                    onChange={(e) => setNomineeInput({ ...nomineeInput, phone: e.target.value })} 
                    style={{ padding: 6, borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 13 }}
                  />
                  <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input 
                      type="checkbox" 
                      checked={nomineeInput.isEmergencyHeir} 
                      onChange={(e) => setNomineeInput({ ...nomineeInput, isEmergencyHeir: e.target.checked })} 
                    />
                    Enable Nominee Mode (Emergency Heir read-only access)
                  </label>
                  <button onClick={() => saveNominee(nomineeInput)} style={{ padding: '8px 12px', background: '#005f52', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', fontSize: 13 }}>
                    Save Trusted Partner Settings
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* AI Nudge Cards */}
        <div className="nudge-strip">
          {nudges.map((n, i) => (
            <div key={i} className={`nudge-chip nudge-color-${i}`}>
              <Zap size={13} />
              {n}
            </div>
          ))}
        </div>

        <section className="hero-section">
          <div className="hero-text">
            <h1>
              {language === 'hi' ? <>आपकी संपत्ति <em>बुद्धिमत्ता</em> <br /> का अवलोकन।</> :
               language === 'ta' ? <>உங்கள் செல்வ <em>நுண்ணறிவு</em> <br /> கண்ணோட்டம்.</> :
               language === 'te' ? <>మీ సంపద <em>మేధస్సు</em> <br /> అవలోకనం.</> :
               language === 'bn' ? <>আপনার সম্পদ <em>বুদ্ধিমত্তার</em> <br /> সংক্ষিপ্ত বিবরণ।</> :
               language === 'mr' ? <>तुमचा संपत्ती <em>बुद्धिमत्ता</em> <br /> आढावा.</> :
               language === 'kn' ? <>ನಿಮ್ಮ ಸಂಪತ್ತು <em>ಬುದ್ಧಿವಂತಿಕೆಯ</em> <br /> ಅವಲೋಕನ.</> :
               language === 'gu' ? <>તમારી સંપત્તિ <em>બુદ્ધિની</em> <br /> ઝાંખી.</> :
               <>Your wealth <em>intelligence</em> <br /> overview.</>}
            </h1>
            <p>Institutional-grade analysis shows a 4.2% efficiency gain in your portfolio allocation compared to last quarter.</p>
          </div>

          <div className="health-score-card">
            <HealthScoreBadge score={scoreAnimated} />
            <div className="score-details-right">
              <span className="label-tiny">{t(language, 'health_score')}</span>
              <div className="score-trend">
                <TrendingUp size={14} /> +5.2% from Sept
              </div>
            </div>
          </div>
        </section>

        <div className="dashboard-main-grid">
          <div className="charts-and-insights">
            <div className="charts-grid">
              {/* Savings Velocity Bar Chart */}
              <div className="chart-card velocity-chart">
                <div className="chart-header">
                  <div>
                    <h3>{t(language, 'savings_velocity')}</h3>
                    <p>{t(language, 'cumulative_growth')}</p>
                  </div>
                  <div className="time-filters">
                    <span className={velocityPeriod === "1M" ? "active" : ""} onClick={() => setVelocityPeriod("1M")} style={{ cursor: 'pointer' }}>1M</span>
                    <span className={velocityPeriod === "6M" ? "active" : ""} onClick={() => setVelocityPeriod("6M")} style={{ cursor: 'pointer' }}>6M</span>
                    <span className={velocityPeriod === "1Y" ? "active" : ""} onClick={() => setVelocityPeriod("1Y")} style={{ cursor: 'pointer' }}>1Y</span>
                  </div>
                </div>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={getVelocityChartData()}>
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.9} />
                          <stop offset="100%" stopColor="#ccf2ed" stopOpacity={0.4} />
                        </linearGradient>
                        <linearGradient id="barGradientActive" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#005f52" stopOpacity={1} />
                          <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.8} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" hide />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#999' }} ticks={[0, 50000, 100000, 150000]} tickFormatter={(val) => `${val / 1000}k`} />
                      <Tooltip cursor={{ fill: 'rgba(0,95,82,0.05)' }} />
                      <Bar dataKey="amt" radius={[6, 6, 0, 0]}>
                        {getVelocityChartData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.isCurrent ? 'url(#barGradientActive)' : 'url(#barGradient)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Capital Outflow Donut Chart */}
              <div className="chart-card outflow-chart">
                <div className="chart-header">
                  <h3>{t(language, 'capital_outflow')}</h3>
                  <p>{t(language, 'allocation_priority')}</p>
                </div>
                <div className="donut-wrapper">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={profile?.outflowData || outflowData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {(profile?.outflowData || outflowData).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="donut-center">
                    <span className="total-label">{t(language, 'total')}</span>
                    <span className="total-amount">₹{animatedTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <div className="legend">
                  {(profile?.outflowData || outflowData).slice(0, 4).map((item) => (
                    <div className="legend-item" key={item.name}>
                      <span className="dot" style={{ backgroundColor: item.color }}></span>
                      <span className="name">{getCategoryTranslation(item.name, language)}</span>
                      <span className="value">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <MarketNews news={MOCK_NEWS} language={language} />

            <div className="insights-grid">
              <div className="insight-card">
                <div className="insight-icon tip"><Zap size={18} /></div>
                <span className="insight-tag">OPTIMIZATION TIP</span>
                <h4>Emergency Buffer Alert</h4>
                <p>Based on your recent outflow, we recommend moving $1,200 to your High-Yield Ledger to maintain 6-month liquidity.</p>
                <ExplainCard recommendationId="opt_emergency_buffer_001" />
                <button
                  className="insight-link-btn"
                  onClick={() => securityGate(
                    () => setToast('SIP started successfully'),
                    { actionType: 'REBALANCE', amount: 1200 }
                  )}
                >
                  Execute Optimization <ChevronRight size={16} />
                </button>
              </div>

              <div className="insight-card">
                <div className="insight-icon strategy"><TrendingUp size={18} /></div>
                <span className="insight-tag">INVESTMENT STRATEGY</span>
                <h4>Sector Rotation Imminent</h4>
                <p>Tech allocation is hitting resistance levels. Historical twins are pivoting 4% to Emerging Markets this week.</p>
                <button
                  className="insight-link-btn"
                  onClick={() => securityGate(
                    () => setToast('Sector rotation initiated!'),
                    { actionType: 'REBALANCE', amount: 5000 }
                  )}
                >
                  Review Analysis <ChevronRight size={16} />
                </button>
              </div>

              <div className="insight-card">
                <div className="insight-icon tax"><BookOpen size={18} /></div>
                <span className="insight-tag">TAX INTELLIGENCE</span>
                <h4>Harvesting Opportunity</h4>
                <p>You have ₹42,205 in unrealized losses that could offset Q4 capital gains if liquidated before October 31st.</p>
                <button
                  className="insight-link-btn"
                  onClick={() => securityGate(
                    () => setToast('Tax harvest simulated!'),
                    { actionType: 'LIQUIDATE', amount: 450 }
                  )}
                >
                  Simulate Impact <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* ───────────── GOALS SECTION ───────────── */}
            <div className="insight-card">
              <h3>Your Goals</h3>

              {/* Input Row */}
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <input
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  placeholder="Add a goal (e.g. Buy House)"
                  style={{
                    flex: 1,
                    padding: 8,
                    borderRadius: 6,
                    border: "1px solid #ccc"
                  }}
                />
                <button
                  onClick={handleAddGoal}
                  style={{
                    padding: "8px 12px",
                    background: "#005f52",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer"
                  }}
                >
                  Add
                </button>
              </div>

              {/* Empty State */}
              {goals.length === 0 && (
                <p style={{ color: "#888" }}>No goals yet</p>
              )}

              {/* Goals List */}
              {goals.map(goal => (
                <div key={goal.id} style={{ marginBottom: 10 }}>
                  <strong>{goal.title}</strong>
                  <div style={{ fontSize: 12, color: "#666" }}>
                    ₹{goal.targetAmount}
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Trending Stocks Side Panel */}
          <TrendingStocks stocks={trendingStocks} language={language} />
        </div>
      </div>

      {/* Floating AI Chat */}
      <div className={`chat-popup ${chatOpen ? 'open' : ''} ${isFullScreen ? 'fullscreen' : ''}`}>
        <div className="chat-popup-header">
          <div className="chat-popup-title">
            <div className="chat-avatar-dot"></div>
            <div>
              <span className="chat-title">AI Coach</span>
              <span className="chat-subtitle">Always online</span>
            </div>
          </div>
          <div className="chat-header-actions">
            <button className="chat-action-btn" onClick={toggleFullScreen} title="Toggle Fullscreen">
              {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button className="chat-close-btn" onClick={() => { setChatOpen(false); setIsFullScreen(false); }}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="chat-popup-body">
          <div className="chat-bubble bot">
            👋 Hi {profile?.name || "User"}! I'm your AI Wealth Coach. Ask me anything.
          </div>
          {chatMessages.map((m, i) => (
            <div key={i} className={`chat-bubble ${m.role}`}>{m.text}</div>
          ))}
        </div>

        <div className="chat-popup-input">
          <input
            type="text"
            placeholder="Ask your AI coach..."
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendChat()}
          />
          <button className="chat-send-btn" onClick={sendChat}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {!isFullScreen && (
        <button
          className={`floating-chat-btn ${chatOpen ? 'active' : ''}`}
          onClick={() => setChatOpen(!chatOpen)}
          title="Open AI Coach"
        >
          {chatOpen ? <X size={24} /> : <Bot size={24} />}
          {!chatOpen && <span className="chat-badge">1</span>}
        </button>
      )}

      <RiskInterceptModal
        isOpen={riskModal.isOpen}
        decision={riskModal.decision}
        riskScore={riskModal.riskScore}
        message={riskModal.message}
        language={language}
        onCancel={() => {
          setRiskModal({ ...riskModal, isOpen: false });
          setPendingAction(null);
        }}
        onAllow={() => {
          if (pendingAction) pendingAction();
          setRiskModal({ ...riskModal, isOpen: false });
          setPendingAction(null);
        }}
      />
    </div>
  );
};

export default Dashboard;
