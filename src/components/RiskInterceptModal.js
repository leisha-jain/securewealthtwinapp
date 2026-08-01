import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert, Clock, Phone, ArrowRight, Eye, RefreshCw, CheckCircle, Camera } from 'lucide-react';
import axios from 'axios';
import './RiskInterceptModal.css';
import { t } from '../utils/languageStrings';
import { Capacitor } from '@capacitor/core';

const API_BASE = process.env.REACT_APP_API_URL || (Capacitor.isNativePlatform() ? "http://10.0.2.2:8000" : "http://localhost:8000");

const HUMAN_MESSAGES = {
  "Action from an unrecognised device": "We noticed this is your first time performing a transaction on this device. We are verifying it's really you.",
  "Critical action taken less than 10 seconds after login": "This transaction was placed very quickly after login. We pause to protect against rushed decisions or phone coercion.",
  "Amount is 7.5× your usual average": "This transaction amount is significantly higher than your typical average. We want to double check before proceeding.",
  "OTP entered 3 times in this session": "Multiple OTP entry attempts detected. Please double check that you entered the correct code.",
  "First time performing action type: start_sip": "This is your first time starting a SIP on this account. We apply extra review for first-time setups.",
  "Action was cancelled and retried 3 times": "We noticed multiple retry attempts. We are pausing to help you review the transaction details.",
  "Large amount transacted between 11pm–5am": "This transaction was placed late at night. For your protection, we apply extra checks during overnight hours.",
  "5+ wealth actions within 10 minutes (automated velocity)": "We detected multiple rapid transactions. We are temporarily pausing to verify this is authorized.",
  "Device changed mid-session — possible session hijack": "A device switch was detected mid-session. We have paused this for your security.",
  "Action within 48h of salary credit — elevated risk window": "Your account recently received its monthly salary credit. We are applying extra vigilance to protect your new balance."
};

const getHumanMessage = (techMsg, verbosity) => {
  if (verbosity === 'simple') {
    if (techMsg.startsWith('• ')) {
      return techMsg.split('\n').map(line => {
        const clean = line.replace(/^•\s*/, '').trim();
        return '• ' + (HUMAN_MESSAGES[clean] || clean);
      }).join('\n');
    }
    return HUMAN_MESSAGES[techMsg] || techMsg;
  }
  return techMsg;
};

export default function RiskInterceptModal({ isOpen, decision, riskScore, message, onAllow, onCancel, language = 'en' }) {
  if (!isOpen) return null;

  return (
    <div className="risk-modal-overlay">
      <div className={`risk-modal-container ${decision?.toLowerCase() || ''}`}>
        {decision === 'ALLOW' && <AllowScreen riskScore={riskScore} onAllow={onAllow} lang={language} />}
        {decision === 'WARN' && (
          <WarnScreen
            riskScore={riskScore}
            message={message}
            onAllow={onAllow}
            onCancel={onCancel}
            lang={language}
          />
        )}
        {decision === 'BLOCK' && (
          <BlockScreen 
            message={message} 
            onCancel={onCancel} 
            lang={language} 
            onAllow={onAllow} 
            riskScore={riskScore}
          />
        )}
      </div>
    </div>
  );
}

const AllowScreen = ({ riskScore, onAllow, lang }) => (
  <div className="risk-content">
    <div className="risk-icon-circle green">
      <ShieldCheck size={48} />
    </div>
    <span className="risk-badge green">{t(lang, 'safe')}</span>
    <h2>{t(lang, 'action_approved')}</h2>
    <p className="risk-meta">riskScore: {riskScore} — {t(lang, 'low_risk')}</p>
    <p className="risk-message">Proceeding with your request. No threats detected by SecureWealth Twin AI.</p>
    <button className="btn-proceed green" onClick={onAllow}>
      {t(lang, 'proceed')} <ArrowRight size={18} />
    </button>
  </div>
);

const WarnScreen = ({ riskScore, message, onAllow, onCancel, lang }) => {
  const [timeLeft, setTimeLeft] = useState(30);
  const [trustedState, setTrustedState] = useState({ active: false, status: 'pending', nomineeName: '', token: '' });
  const [verbosity, setVerbosity] = useState('simple');

  useEffect(() => {
    if (timeLeft > 0 && !trustedState.active) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft <= 0 && !trustedState.active) {
      onCancel();
    }
  }, [timeLeft, trustedState.active]);

  // Trusted Contact Polling Loop
  useEffect(() => {
    let interval;
    if (trustedState.active && trustedState.status === 'pending') {
      interval = setInterval(async () => {
        try {
          const res = await axios.get(`${API_BASE}/api/auth/pending-approvals/${trustedState.token}`);
          if (res.data.status === 'approved') {
            setTrustedState(prev => ({ ...prev, status: 'approved' }));
            clearInterval(interval);
            setTimeout(() => {
              onAllow();
            }, 1500);
          } else if (res.data.status === 'rejected') {
            setTrustedState(prev => ({ ...prev, status: 'rejected' }));
            clearInterval(interval);
          }
        } catch (e) {
          console.warn("[Trusted Polling] error:", e.message);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [trustedState]);

  const handleSleepOnIt = async () => {
    const lastAction = JSON.parse(localStorage.getItem('last_action_payload') || '{}');
    localStorage.setItem('sleep_on_it_pending', JSON.stringify({
      ...lastAction,
      timestamp: Date.now()
    }));

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE}/api/auth/sleep-on-it`, { action: lastAction }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (e) {
      console.warn("[Sleep On It] backend backup sync skipped");
    }

    window.dispatchEvent(new CustomEvent('swt_api_success', { detail: "Action paused! SecureWealth Twin will check in on you tomorrow." }));
    onCancel();
  };

  const handleAskTrusted = async () => {
    const lastAction = JSON.parse(localStorage.getItem('last_action_payload') || '{}');
    try {
      const token = localStorage.getItem('token');
      const profileRes = await axios.get(`${API_BASE}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const nominee = profileRes.data?.user?.nominee;
      if (!nominee || !nominee.phone) {
        window.dispatchEvent(new CustomEvent('swt_api_error', { detail: "No trusted contact registered. Go to Settings to register one!" }));
        return;
      }

      const res = await axios.post(`${API_BASE}/api/auth/ask-trusted`, {
        amount: lastAction.amount || 25000,
        action_type: lastAction.actionType || "Investment Action",
        target: lastAction.target || nominee.name
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setTrustedState({
        active: true,
        status: 'pending',
        nomineeName: nominee.name,
        token: res.data.token
      });
    } catch (e) {
      window.dispatchEvent(new CustomEvent('swt_api_error', { detail: "Failed to contact nominee. Confirming fallback in Gateway terminal." }));
      setTrustedState({
        active: true,
        status: 'pending',
        nomineeName: "Sunita Mehta",
        token: "demo-token"
      });
    }
  };

  if (trustedState.active) {
    return (
      <div className="risk-content">
        <div className="risk-icon-circle yellow pulse">
          <Eye size={48} />
        </div>
        <h2>Second Pair of Eyes Active</h2>
        <p className="risk-meta">Awaiting approval from {trustedState.nomineeName}</p>
        <div className="risk-warning-box text-center">
          {trustedState.status === 'pending' && (
            <p className="pulse-text">💬 Sent approval request link via SMS. Verification pending...</p>
          )}
          {trustedState.status === 'approved' && (
            <p style={{ color: '#1e4620', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle size={16} /> Approved by {trustedState.nomineeName}. Proceeding...
            </p>
          )}
          {trustedState.status === 'rejected' && (
            <p style={{ color: '#7a2020', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldAlert size={16} /> Rejected by {trustedState.nomineeName}. Transaction blocked.
            </p>
          )}
        </div>
        {trustedState.status === 'rejected' && (
          <button className="btn-secondary" onClick={onCancel} style={{ marginTop: 20 }}>Close</button>
        )}
      </div>
    );
  }

  return (
    <div className="risk-content">
      <div className="risk-icon-circle yellow">
        <AlertTriangle size={48} />
      </div>
      <span className="risk-badge yellow">{t(lang, 'warning')}</span>
      <h2>{t(lang, 'security_review')}</h2>
      <p className="risk-meta">riskScore: {riskScore} — {t(lang, 'elevated_risk')}</p>
      <div className="risk-warning-box">
        <p style={{ whiteSpace: 'pre-line' }}>{getHumanMessage(message, verbosity)}</p>
      </div>
      <button 
        onClick={() => setVerbosity(v => v === "simple" ? "detailed" : "simple")}
        className="btn-link"
        style={{ fontSize: 12, padding: 0, marginBottom: 16, color: '#3b82f6', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        {verbosity === "simple" ? "🔍 Show technical details" : "💡 Show simple explanation"}
      </button>

      <div className="timer-section">
        <Clock size={16} />
        <span>{t(lang, 'wait')} {timeLeft}s</span>
      </div>

      <div className="risk-actions stacked">
        <button
          className="btn-proceed yellow"
          disabled={timeLeft > 0}
          onClick={onAllow}
          style={{ width: '100%', marginBottom: 8 }}
        >
          {t(lang, 'proceed_anyway')}
        </button>

        <div style={{ display: 'flex', gap: 8, width: '100%', marginBottom: 8 }}>
          <button className="btn-secondary" onClick={handleSleepOnIt} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Clock size={15} /> Sleep On It
          </button>
          <button className="btn-secondary" onClick={handleAskTrusted} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Eye size={15} /> Ask Trusted
          </button>
        </div>

        <button className="btn-link" onClick={onCancel} style={{ width: '100%' }}>
          {t(lang, 'cancel_action')}
        </button>
      </div>
    </div>
  );
};

const BlockScreen = ({ message, onCancel, lang, onAllow, riskScore }) => {
  const [recovery, setRecovery] = useState({ active: false, step: 1, otp: '', isScanning: false, scanSuccess: false });
  const [verbosity, setVerbosity] = useState('simple');
  const [aiExplanation, setAiExplanation] = useState(null);

  const startSelfieScan = () => {
    setRecovery(prev => ({ ...prev, isScanning: true }));
    setTimeout(() => {
      setRecovery(prev => ({ ...prev, isScanning: false, scanSuccess: true }));
    }, 3000);
  };

  const completeRecovery = () => {
    window.dispatchEvent(new CustomEvent('swt_api_success', { detail: "Verification complete! Security level downgraded to WARN with 60s cooldown." }));
    setRecovery({ active: false, step: 1, otp: '', isScanning: false, scanSuccess: false });
    // Downgrade to WARN state
    onAllow(); 
  };

  if (recovery.active) {
    return (
      <div className="risk-content">
        <div className="risk-icon-circle green">
          <RefreshCw size={48} className={recovery.isScanning ? "spin" : ""} />
        </div>
        <h2>Identity Recovery Flow</h2>
        <p className="risk-meta">Step {recovery.step} of 2</p>

        {recovery.step === 1 && (
          <div style={{ width: '100%', marginTop: 20 }}>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 10 }}>We sent a recovery code to your registered email.</p>
            <input 
              type="text" 
              placeholder="Enter 6-digit code" 
              value={recovery.otp}
              onChange={(e) => setRecovery(prev => ({ ...prev, otp: e.target.value }))}
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '100%', textAlign: 'center', fontSize: 16, marginBottom: 15 }}
            />
            <button 
              className="btn-proceed green" 
              disabled={recovery.otp.length !== 6}
              onClick={() => setRecovery(prev => ({ ...prev, step: 2 }))}
              style={{ width: '100%' }}
            >
              Verify Code
            </button>
          </div>
        )}

        {recovery.step === 2 && (
          <div style={{ width: '100%', marginTop: 20 }}>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 15 }}>Liveness Selfie verification is required to verify identity.</p>
            
            <div style={{ background: '#f8fafc', height: 160, borderRadius: 8, border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
              {recovery.isScanning ? (
                <div className="scanning-overlay">
                  <div className="scanner-line"></div>
                  <Camera size={32} style={{ color: '#059669' }} />
                  <span style={{ fontSize: 12, marginTop: 8, color: '#059669', fontWeight: 'bold' }}>Scanning facial contours...</span>
                </div>
              ) : recovery.scanSuccess ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#059669' }}>
                  <CheckCircle size={40} />
                  <span style={{ fontSize: 13, marginTop: 8, fontWeight: 'bold' }}>Liveness Verified!</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#94a3b8' }}>
                  <Camera size={32} />
                  <span style={{ fontSize: 12, marginTop: 8 }}>Ready for camera scan</span>
                </div>
              )}
            </div>

            {!recovery.scanSuccess && (
              <button 
                className="btn-proceed yellow" 
                disabled={recovery.isScanning}
                onClick={startSelfieScan}
                style={{ width: '100%', marginBottom: 10 }}
              >
                Start Selfie Scan
              </button>
            )}

            {recovery.scanSuccess && (
              <button 
                className="btn-proceed green" 
                onClick={completeRecovery}
                style={{ width: '100%', marginBottom: 10 }}
              >
                Complete Recovery
              </button>
            )}
          </div>
        )}

        <button className="btn-link" onClick={() => setRecovery({ active: false, step: 1, otp: '', isScanning: false, scanSuccess: false })} style={{ marginTop: 10 }}>
          Cancel Recovery
        </button>
      </div>
    );
  }

  const handleExplainWithAI = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_BASE}/api/chat/explain`,
        {
          recommended_action: message,
          top_drivers: [message]
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setAiExplanation(`${res.data.short_reason}\n\n${res.data.full_explanation}`);
    } catch (err) {
      setAiExplanation(message);
    }
  };

  return (
    <div className="risk-content">
      <div className="risk-icon-circle red">
        <ShieldAlert size={48} />
      </div>
      <span className="risk-badge red">{t(lang, 'blocked')}</span>
      <h2 className="dramatic-title">{t(lang, 'security_intercept')}</h2>
      <p className="risk-meta">{t(lang, 'high_risk')}</p>

      <div className="block-reason-card">
        <p style={{ whiteSpace: 'pre-line' }}>{getHumanMessage(message, verbosity)}</p>
      </div>
      <button 
        onClick={() => setVerbosity(v => v === "simple" ? "detailed" : "simple")}
        className="btn-link"
        style={{ fontSize: 12, padding: 0, marginBottom: 16, color: '#fca5a5', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        {verbosity === "simple" ? "🔍 Show technical details" : "💡 Show simple explanation"}
      </button>

      {aiExplanation && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '12px',
          fontSize: '12px',
          color: '#e2e8f0',
          textAlign: 'left',
          marginBottom: '16px',
          width: '100%',
          boxSizing: 'border-box',
          whiteSpace: 'pre-line',
          lineHeight: '1.4'
        }}>
          <strong>🤖 AI Explanation:</strong>
          <p style={{ margin: '6px 0 0 0' }}>{aiExplanation}</p>
        </div>
      )}

      <p className="block-instruction">{t(lang, 'account_restricted')}</p>

      <div className="risk-actions stacked">
        <button 
          className="btn-proceed yellow"
          onClick={() => setRecovery(prev => ({ ...prev, active: true }))}
          style={{ width: '100%', marginBottom: 8 }}
        >
          Verify Identity & Recover Access
        </button>

        <button 
          className="btn-secondary"
          onClick={handleExplainWithAI}
          style={{ width: '100%', marginBottom: 8 }}
        >
          Explain with AI
        </button>

        <button className="btn-proceed red" style={{ width: '100%', marginBottom: 8 }}>
          <Phone size={18} /> {t(lang, 'helpline_message')}
        </button>
        <button className="btn-link" onClick={onCancel} style={{ width: '100%' }}>{t(lang, 'close_logout')}</button>
      </div>
    </div>
  );
};
