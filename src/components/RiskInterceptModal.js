import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert, Clock, Phone, ArrowRight } from 'lucide-react';
import './RiskInterceptModal.css';

export default function RiskInterceptModal({ isOpen, decision, riskScore, message, onAllow, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="risk-modal-overlay">
      <div className={`risk-modal-container ${decision?.toLowerCase() || ''}`}>
        {decision === 'ALLOW' && <AllowScreen riskScore={riskScore} onAllow={onAllow} />}
        {decision === 'WARN' && (
          <WarnScreen 
            riskScore={riskScore} 
            message={message} 
            onAllow={onAllow} 
            onCancel={onCancel} 
          />
        )}
        {decision === 'BLOCK' && <BlockScreen message={message} onCancel={onCancel} />}
      </div>
    </div>
  );
}

/* --- ALLOW STATE --- */
const AllowScreen = ({ riskScore, onAllow }) => (
  <div className="risk-content">
    <div className="risk-icon-circle green">
      <ShieldCheck size={48} />
    </div>
    <span className="risk-badge green">SAFE ACTION</span>
    <h2>Transaction Approved</h2>
    <p className="risk-meta">riskScore: {riskScore} — Low Risk</p>
    <p className="risk-message">
      Proceeding with your request. No threats detected by SecureWealth Twin AI.
    </p>
    <button className="btn-proceed green" onClick={onAllow}>
      Proceed <ArrowRight size={18} />
    </button>
  </div>
);

/* --- WARN STATE --- */
const WarnScreen = ({ riskScore, message, onAllow, onCancel }) => {
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      onCancel();
    }
  }, [timeLeft]);

  return (
    <div className="risk-content">
      <div className="risk-icon-circle yellow">
        <AlertTriangle size={48} />
      </div>
      <span className="risk-badge yellow">CAUTION REQUIRED</span>
      <h2>Security Verification</h2>
      <p className="risk-meta">riskScore: {riskScore} — Elevated Risk</p>

      <div className="risk-warning-box">
        <p>{message}</p>
      </div>

      <div className="timer-section">
        <Clock size={16} />
        <span>Wait {timeLeft}s to override</span>
      </div>

      <div className="risk-actions">
        <button className="btn-secondary" onClick={onCancel}>
          Cancel Action
        </button>
        <button 
          className="btn-proceed yellow" 
          disabled={timeLeft > 0} 
          onClick={onAllow}
        >
          Proceed Anyway
        </button>
      </div>
    </div>
  );
};

/* --- BLOCK STATE --- */
const BlockScreen = ({ message, onCancel }) => (
  <div className="risk-content">
    <div className="risk-icon-circle red">
      <ShieldAlert size={48} />
    </div>
    <span className="risk-badge red">ACTION BLOCKED</span>
    <h2 className="dramatic-title">Security Intercept</h2>
    <p className="risk-meta">High Probability Fraud Detected</p>
    
    <div className="block-reason-card">
      <p>{message}</p>
    </div>

    <p className="block-instruction">
      Your account has been temporarily restricted to prevent unauthorized movement of funds.
    </p>

    {/* ✅ UPDATED ACTIONS WITH AI BUTTON */}
    <div className="risk-actions stacked">

      <button 
        className="btn-secondary"
        onClick={() => alert(" AI Explanation:\n\n" + message)}
      >
        Explain with AI
      </button>

      <button className="btn-proceed red">
        <Phone size={18} /> Contact Your Private Banker
      </button>

      <button className="btn-link" onClick={onCancel}>
        Close and Logout
      </button>

    </div>
  </div>
);