import React, { useState, useEffect } from 'react'; // ✅ added useEffect
import './Alerts.css';
import { fraudAPI } from '../services/api';
import RiskInterceptModal from '../components/RiskInterceptModal';

const Alerts = () => {
  const [isSimulating, setIsSimulating] = useState(false);

  // ✅ MODAL STATE
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState({});

  // ✅ AUTO SIMULATION (STEP 1)
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      const types = ["block", "warn", "allow"];
      const randomType = types[Math.floor(Math.random() * 3)];
      triggerFraud(randomType);
    }, 6000);

    return () => clearInterval(interval);
  }, [isSimulating]);

  // ✅ TRIGGER FUNCTION
  const triggerFraud = async (type) => {
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

      // ✅ EXTRACT REASONS
      const reasons = res.data.triggered_signals
        ? res.data.triggered_signals
            .filter(signal => signal.triggered)
            .map(signal => signal.reason)
        : [];

      // ✅ STEP 3 — WEALTH SUGGESTIONS
      let extraMessage = "";

      if (res.data.decision === "ALLOW") {
        extraMessage = "\n\n💡 Suggestion: Consider investing in ELSS for tax savings.";
      }

      if (res.data.decision === "WARN") {
        extraMessage = "\n\n⚠️ Suggestion: Try a smaller amount or verify your device.";
      }

      if (res.data.decision === "BLOCK") {
        extraMessage = "\n\n🚫 Suggestion: Please verify your identity before proceeding.";
      }

      // ✅ SHOW MODAL
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
      alert("Error connecting to backend");
    }
  };

  const signalWeights = [
    { label: 'New/untrusted device', weight: '+20', color: 'orange' },
    { label: 'Action < 10s after login', weight: '+15', color: 'orange' },
    { label: 'Amount > 2.5× 90-day avg', weight: '+25', color: 'red' },
    { label: 'OTP retry > 2 attempts', weight: '+20', color: 'orange' },
    { label: 'First-time fund type', weight: '+15', color: 'orange' },
    { label: 'Cancel-retry loop > 3×', weight: '+10', color: 'green' },
    { label: 'Night transfer > ₹50k', weight: '+10', color: 'green' },
  ];

  const recentEvaluations = [
    { desc: 'SIP ₹3k · Priya', score: 12, status: 'allow' },
    { desc: 'Transfer ₹1.2L · Arjun', score: 72, status: 'block' },
    { desc: 'ELSS ₹25k · Ramesh', score: 40, status: 'warn' },
    { desc: 'Gold buy · Priya', score: 8, status: 'allow' },
    { desc: 'NPS ₹5k · Neha', score: 20, status: 'allow' },
  ];

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

      {/* Header */}
      <header className="fraud-header">
        <div className="title-block">
          <h1>Fraud intercept</h1>
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

      {/* Grid */}
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

        {/* Recent Evaluations */}
        <div className="content-card">
          <h3 className="card-inner-title">Recent evaluations</h3>
          <div className="eval-list">
            {recentEvaluations.map((item, index) => (
              <div key={index} className="eval-row">
                <span className="eval-desc">{item.desc}</span>
                <div className="eval-right">
                  <span className="eval-score">Score {item.score}</span>
                  <span className={`status-pill ${item.status}`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Demo Triggers */}
      <div className="content-card demo-card">
        <h3 className="card-inner-title">Demo triggers</h3>
        <div className="trigger-buttons">

          <button 
            className="trigger-btn block"
            onClick={() => triggerFraud("block")}
          >
            block gate · score 72
          </button>

          <button 
            className="trigger-btn warn"
            onClick={() => triggerFraud("warn")}
          >
            warn gate · score 40
          </button>

          <button 
            className="trigger-btn allow"
            onClick={() => triggerFraud("allow")}
          >
            allow gate · score 8
          </button>

        </div>

        <div className="info-box">
          Toggle the live simulation switch above to auto-trigger scenarios every 6 seconds.
        </div>
      </div>
    </div>
  );
};

export default Alerts;