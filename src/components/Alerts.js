import React, { useState, useEffect } from 'react';
import './Alerts.css';
import { Skull, ShieldAlert, AlertTriangle, CheckCircle, Filter } from 'lucide-react';
import { fraudAPI } from '../services/api';
import RiskInterceptModal from '../components/RiskInterceptModal';

const ALL_EVALUATIONS = [
  {
    id: 1,
    desc: 'HONEYPOT PROBE — /api/admin/users',
    score: 100,
    status: 'honeypot',
    decision: 'HONEYPOT_TRIGGERED',
    time: '10:42:31',
    tooltip: 'An automated attack probe accessed a decoy asset. Session terminated.',
    type: 'honeypot',
  },
  {
    id: 2,
    desc: 'Transfer ₹1.2L · suspicious_actor',
    score: 90,
    status: 'block',
    decision: 'BLOCK',
    time: '10:38:12',
    tooltip: 'Multiple fraud signals: new device, night transfer, amount 3x avg.',
    type: 'security',
  },
  {
    id: 3,
    desc: 'ELSS ₹25k · Ramesh',
    score: 40,
    status: 'warn',
    decision: 'WARN',
    time: '10:30:05',
    tooltip: 'First-time fund type detected.',
    type: 'security',
  },
  {
    id: 4,
    desc: 'SIP ₹3k · Priya',
    score: 12,
    status: 'allow',
    decision: 'ALLOW',
    time: '10:22:18',
    tooltip: 'No risk signals detected.',
    type: 'normal',
  },
  {
    id: 5,
    desc: 'Gold buy · Priya',
    score: 8,
    status: 'allow',
    decision: 'ALLOW',
    time: '10:15:44',
    tooltip: 'Low risk transaction.',
    type: 'normal',
  },
  {
    id: 6,
    desc: 'NPS ₹5k · Neha',
    score: 20,
    status: 'allow',
    decision: 'ALLOW',
    time: '09:58:02',
    tooltip: 'Trusted recurring contribution.',
    type: 'normal',
  },
];

const signalWeights = [
  { label: 'Honeypot triggered', weight: '+40', color: 'red' },
  { label: 'New/untrusted device', weight: '+20', color: 'orange' },
  { label: 'Action < 10s after login', weight: '+15', color: 'orange' },
  { label: 'Amount > 2.5× 90-day avg', weight: '+25', color: 'red' },
  { label: 'OTP retry > 2 attempts', weight: '+20', color: 'orange' },
  { label: 'First-time fund type', weight: '+15', color: 'orange' },
  { label: 'Cancel-retry loop > 3×', weight: '+10', color: 'green' },
  { label: 'Night transfer > ₹50k', weight: '+10', color: 'green' },
];

const FILTERS = ['All', 'Security', 'Honeypot', 'Blocked'];

export default function Alerts() {
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [expandedId, setExpandedId] = useState(null);

  // ✅ MODAL STATE
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState({});

  // ✅ LIVE AUDIT LOG (falls back to the demo mock list above if unreachable)
  const [liveEntries, setLiveEntries] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fraudAPI.getGlobalRiskHistory()
      .then((res) => {
        if (cancelled) return;
        const rows = res.data?.entries || [];
        const mapped = rows.map((e, i) => {
          const status =
            e.decision === 'HONEYPOT_TRIGGERED' ? 'honeypot' :
            e.decision === 'BLOCK' ? 'block' :
            e.decision === 'WARN' ? 'warn' : 'allow';
          return {
            id: `live-${i}-${e.timestamp}`,
            desc: `${e.action_type} ₹${(e.amount || 0).toLocaleString('en-IN')} · ${e.user_id}`,
            score: e.risk_score,
            status,
            decision: e.decision,
            time: e.timestamp ? new Date(e.timestamp).toLocaleTimeString('en-IN', { hour12: false }) : '',
            tooltip: (e.signal_reasons || []).join('; ') || 'No risk signals detected.',
            type: status === 'honeypot' ? 'honeypot' : status === 'allow' ? 'normal' : 'security',
          };
        });
        if (mapped.length) setLiveEntries(mapped);
      })
      .catch(() => { /* keep the mock demo entries as fallback */ });
    return () => { cancelled = true; };
  }, []);

  // ✅ AUTO SIMULATION
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      const types = ["block", "warn", "allow", "honeypot"];
      const randomType = types[Math.floor(Math.random() * 4)];
      triggerFraud(randomType);
    }, 6000);

    return () => clearInterval(interval);
  }, [isSimulating]);

  // ✅ TRIGGER FUNCTION
  const triggerFraud = async (type) => {
    if (type === 'honeypot') {
      setModalData({
        decision: 'BLOCK',
        riskScore: 100,
        message: '• Cyber deception system triggered.\n• Decoy user resource probe detected on route: /api/admin/users.\n• Client session terminated. Traffic redirected to simulated sandbox.'
      });
      setIsModalOpen(true);
      return;
    }

    try {
      const payload = {
        user_id: "priya",
        action_type: "large_transfer",
        amount: type === "block" ? 200000 : type === "warn" ? 50000 : 5000,
        device_id: "device_unknown",
        login_timestamp: new Date().toISOString(),
        action_timestamp: new Date().toISOString(),
        otp_attempts: type === "block" ? 4 : 1,
        retry_count: 0,
      };

      const res = await fraudAPI.executeAction(payload);

      // Extract reasons
      const reasons = res.data.triggered_signals
        ? res.data.triggered_signals
            .filter(signal => signal.triggered)
            .map(signal => signal.reason)
        : [];

      // Suggestions
      let extraMessage = "";
      if (res.data.decision === "ALLOW") {
        extraMessage = "\n\nSuggestion: Consider investing in ELSS for tax savings.";
      } else if (res.data.decision === "WARN") {
        extraMessage = "\n\nSuggestion: Try a smaller amount or verify your device.";
      } else if (res.data.decision === "BLOCK") {
        extraMessage = "\n\nSuggestion: Please verify your identity before proceeding.";
      }

      setModalData({
        decision: res.data.decision,
        riskScore: res.data.risk_score,
        message:
          (reasons.length > 0
            ? "• " + reasons.join("\n• ")
            : "AI detected unusual behavior") + extraMessage
      });
      setIsModalOpen(true);

    } catch (err) {
      console.error(err);
      window.dispatchEvent(new CustomEvent('swt_api_error', { detail: 'Error connecting to backend' }));
    }
  };

  const entries = liveEntries && liveEntries.length ? liveEntries : ALL_EVALUATIONS;
  const honeypotEntries = entries.filter((e) => e.type === 'honeypot');
  const otherEntries = entries.filter((e) => e.type !== 'honeypot');

  const filteredEntries = [
    ...honeypotEntries,
    ...otherEntries.filter((e) => {
      if (activeFilter === 'All') return true;
      if (activeFilter === 'Security') return e.type === 'security';
      if (activeFilter === 'Honeypot') return e.type === 'honeypot';
      if (activeFilter === 'Blocked') return e.status === 'block';
      return true;
    }),
  ].filter((e) => {
    if (activeFilter === 'Honeypot') return e.type === 'honeypot';
    if (activeFilter === 'Blocked') return e.status === 'block' || e.type === 'honeypot';
    if (activeFilter === 'Security') return e.type === 'security' || e.type === 'honeypot';
    return true;
  });

  return (
    <div className="main-content">
      {/* ✅ MODAL */}
      <RiskInterceptModal
        isOpen={isModalOpen}
        decision={modalData.decision}
        riskScore={modalData.riskScore}
        message={modalData.message}
        onAllow={() => setIsModalOpen(false)}
        onCancel={() => setIsModalOpen(false)}
      />

      <header className="fraud-header">
        <div className="title-block">
          <h1>Fraud Intercept</h1>
          <p className="subtext">Every wealth action passes through this gate</p>
        </div>
        <div className="simulation-toggle">
          <span className="toggle-label">Live simulation</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={isSimulating}
              onChange={() => setIsSimulating(!isSimulating)}
            />
            <span className="slider round"></span>
          </label>
        </div>
      </header>

      <div className="dashboard-grid">
        {/* Signal Weights */}
        <div className="content-card">
          <h3 className="card-inner-title">Signal weights</h3>
          <div className="signal-list">
            {signalWeights.map((item, index) => (
              <div key={index} className="signal-row">
                <div className="signal-left">
                  <span className={`dot ${item.color}`}></span>
                  <span className="signal-label">{item.label}</span>
                </div>
                <span className="weight-val">{item.weight}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Log with filters */}
        <div className="content-card">
          <div className="audit-log-header">
            <h3 className="card-inner-title">Audit log</h3>
            <div className="filter-buttons">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  className={`filter-btn ${activeFilter === f ? 'active' : ''} ${f === 'Honeypot' ? 'honeypot-filter' : ''}`}
                  onClick={() => setActiveFilter(f)}
                >
                  {f === 'Honeypot' && <Skull size={11} />}
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="eval-list">
            {filteredEntries.map((item) => (
              <div key={item.id}>
                {item.type === 'honeypot' ? (
                  <div
                    className="honeypot-row"
                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  >
                    <div className="honeypot-row-top">
                      <div className="honeypot-left">
                        <Skull size={16} className="skull-icon" />
                        <span className="honeypot-label">CYBER DECEPTION TRIGGERED</span>
                      </div>
                      <div className="honeypot-right">
                        <span className="eval-score">Score {item.score}</span>
                        <span className="honeypot-time">{item.time}</span>
                      </div>
                    </div>
                    <div className="honeypot-desc">{item.desc}</div>
                    {expandedId === item.id && (
                      <div className="honeypot-tooltip">{item.tooltip}</div>
                    )}
                  </div>
                ) : (
                  <div className="eval-row" onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}>
                    <div className="eval-desc-block">
                      <span className="eval-desc">{item.desc}</span>
                      {expandedId === item.id && (
                        <span className="eval-tooltip">{item.tooltip}</span>
                      )}
                    </div>
                    <div className="eval-right">
                      <span className="eval-score">Score {item.score}</span>
                      <span className={`status-pill ${item.status}`}>
                        {item.decision}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Demo Triggers */}
      <div className="content-card demo-card">
        <h3 className="card-inner-title">Demo triggers</h3>
        <div className="trigger-buttons">
          <button className="trigger-btn block" onClick={() => triggerFraud("block")}>block gate · score 90</button>
          <button className="trigger-btn warn" onClick={() => triggerFraud("warn")}>warn gate · score 40</button>
          <button className="trigger-btn allow" onClick={() => triggerFraud("allow")}>allow gate · score 8</button>
          <button className="trigger-btn honeypot" onClick={() => triggerFraud("honeypot")}>honeypot probe</button>
        </div>
        <div className="info-box">
          Toggle live simulation to auto-trigger scenarios every 6 seconds. Hit the honeypot probe to simulate a cyber deception event.
        </div>
      </div>
    </div>
  );
}
