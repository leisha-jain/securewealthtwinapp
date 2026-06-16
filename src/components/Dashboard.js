import React, { useState, useEffect } from 'react';
import axios from "axios";
import './Dashboard.css';
import ExplainCard from '../components/ExplainCard';
import RiskInterceptModal from "../components/RiskInterceptModal";
import HealthScoreBadge from '../components/HealthScoreBadge';
import { 
  LayoutDashboard, Target, Landmark, PieChart as PieIcon, 
  AlertTriangle, Settings, LifeBuoy, Moon, Sun, Bell, 
  ChevronRight, Zap, TrendingUp, BookOpen, Bot, X, Maximize2, Minimize2 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts';

// Mock Data for Savings Velocity
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

// Mock Data for Capital Outflow
const outflowData = [
  { name: 'Housing & Equity', value: 40, color: '#005f52' },
  { name: 'Lifestyle & Tech', value: 25, color: '#14b8a6' },
  { name: 'Risk Management', value: 15, color: '#f59e0b' },
  { name: 'Other', value: 20, color: '#e5e7eb' },
];

const Dashboard = () => {
  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";
  
  const [chatInput, setChatInput] = useState('');
const [chatMessages, setChatMessages] = useState([]);

  const [loading, setLoading] = useState(true);

  const [chatOpen, setChatOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const toggleFullScreen = () => setIsFullScreen(!isFullScreen);
  const [profile, setProfile] = useState(null);
  
  // ✅ ADD THESE TWO LINES HERE
  const [goals, setGoals] = useState([]);
  const [newGoal, setNewGoal] = useState("");

  // Replace your current decision state with this:
const [riskModal, setRiskModal] = useState({
  isOpen: false,
  decision: null, // 'ALLOW', 'WARN', 'BLOCK'
  riskScore: 0,
  message: ""
});

const [pendingAction, setPendingAction] = useState(null);

const sendChat = async () => {
  if (!chatInput.trim()) return;

  const msg = chatInput;
  setChatInput('');
  setChatMessages(prev => [...prev, { role: 'user', text: msg }]);

  try {
    const user = JSON.parse(localStorage.getItem("user"));

    const res = await axios.post(
      `${API_BASE}/api/chat/message`,
      {
        userId: user?.userId || 1,
        message: msg,
        history: []
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      }
    );

    setChatMessages(prev => [
      ...prev,
      { role: 'bot', text: res.data.reply }
    ]);

  } catch (err) {
    console.error(err);
    setChatMessages(prev => [
      ...prev,
      { role: 'bot', text: "AI service unavailable." }
    ]);
  }
};

const securityGate = async (actionToRun, metadata) => {
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
  if (!newGoal.trim()) {
    alert("Enter a goal");
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
        velocityData: velocityData, // keep UI same
        outflowData: outflowData
      });
      
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

  if (loading) return <div className="loading-screen">Loading...</div>;

  return (
    <div className={`app-container ${darkMode ? "dark" : ""}`}>
      
      {/* MAIN CONTENT */}
      <main className="main-content">
        <header className="top-header">
          <div className="user-profile">
            <img src="https://i.pravatar.cc/150?u=priya" alt="Priya" className="avatar" />
            <div className="user-info">
              <span className="user-name">{profile?.name || "Loading..."}</span>
              <span className="user-status">PREMIUM MEMBER</span>
            </div>
          </div>
          <div className="header-actions">
            
            <div className="notification-bell">
               <Bell size={20} className="header-icon" />
               <span className="bell-dot"></span>
            </div>
          </div>
        </header>

        <section className="hero-section">
          <div className="hero-text">
            <h1>Your wealth <em>intelligence</em> <br /> overview.</h1>
            <p>Institutional-grade analysis shows a 4.2% efficiency gain in your portfolio allocation compared to last quarter.</p>
          </div>
          
          
            <div className="health-score-card">
  {/* The new component handles the ring, color, and number automatically */}
  <HealthScoreBadge score={profile?.score || 0} />
  
  <div className="score-details-right">
    <span className="label-tiny">HEALTH SCORE</span>
    <div className="score-trend">
      <TrendingUp size={14} /> +5.2% from Sept
    </div>
  </div>
</div>
            
          
        </section>

        <div className="charts-grid">
          {/* Savings Velocity Bar Chart */}
          <div className="chart-card velocity-chart">
            <div className="chart-header">
              <div>
                <h3>Savings Velocity</h3>
                <p>Cumulative liquid growth over 12 months</p>
              </div>
              <div className="time-filters">
                <span>1M</span>
                <span className="active">6M</span>
                <span>1Y</span>
              </div>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={profile?.velocityData || velocityData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" hide />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#999'}} ticks={[0, 50000, 100000, 150000]} tickFormatter={(val) => `${val/1000}k`} />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="amt" radius={[4, 4, 0, 0]}>
                    {(profile?.velocityData || velocityData).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.isCurrent ? '#005f52' : '#ccf2ed'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Capital Outflow Donut Chart */}
          <div className="chart-card outflow-chart">
            <div className="chart-header">
              <h3>Capital Outflow</h3>
              <p>Allocation by priority sector</p>
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
                <span className="total-label">TOTAL</span>
                <span className="total-amount">₹11,70,488</span>
              </div>
            </div>
            <div className="legend">
              {outflowData.slice(0, 3).map((item) => (
                <div className="legend-item" key={item.name}>
                  <span className="dot" style={{ backgroundColor: item.color }}></span>
                  <span className="name">{item.name}</span>
                  <span className="value">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

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
    () => alert("Optimization Executed!"), // The real logic
    { actionType: 'REBALANCE', amount: 1200 } // Data for the AI
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
    () => alert("Sector rotation initiated!"),
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
            <p>You have ₹42,205
               in unrealized losses that could offset Q4 capital gains if liquidated before October 31st.</p>
            <button
  className="insight-link-btn"
  onClick={() => securityGate(
    () => alert("Tax harvest simulated!"),
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
      </main>

      {/* FLOATING AI COACH POPUP */}
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
            <button className="chat-close-btn" onClick={() => {setChatOpen(false); setIsFullScreen(false);}}>
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

      {/* FLOATING ROBOT BUTTON */}
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
      
      {/* Replace your previous RiskInterceptModal call at the bottom */}
<RiskInterceptModal
        isOpen={riskModal.isOpen}
        decision={riskModal.decision}
        riskScore={riskModal.riskScore}
        message={riskModal.message}
        onCancel={() => {
          setRiskModal({ ...riskModal, isOpen: false });
          setPendingAction(null);
        }}
        onAllow={() => {
          // This only runs if the user clicks "Proceed" in ALLOW or WARN states
          if (pendingAction) pendingAction(); 
          setRiskModal({ ...riskModal, isOpen: false });
          setPendingAction(null);
        }}
      />
    </div>

    
  );
  
};

export default Dashboard;