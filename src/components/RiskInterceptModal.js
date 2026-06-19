import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert, Clock, X, Phone, ArrowRight } from 'lucide-react';
import './RiskInterceptModal.css';
import { t } from '../utils/languageStrings';

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
        {decision === 'BLOCK' && <BlockScreen message={message} onCancel={onCancel} lang={language} />}
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
      <span className="risk-badge yellow">{t(lang, 'warning')}</span>
      <h2>{t(lang, 'security_review')}</h2>
      <p className="risk-meta">riskScore: {riskScore} — {t(lang, 'elevated_risk')}</p>
      <div className="risk-warning-box">
        <p>{message}</p>
      </div>

      <div className="timer-section">
        <Clock size={16} />
        <span>{t(lang, 'wait')} {timeLeft}s</span>
      </div>

      <div className="risk-actions">
        <button className="btn-secondary" onClick={onCancel}>{t(lang, 'cancel_action')}</button>
        <button
          className="btn-proceed yellow"
          disabled={timeLeft > 0}
          onClick={onAllow}
        >
          {t(lang, 'proceed_anyway')}
        </button>
      </div>
    </div>
  );
};

const BlockScreen = ({ message, onCancel, lang }) => (
  <div className="risk-content">
    <div className="risk-icon-circle red">
      <ShieldAlert size={48} />
    </div>
    <span className="risk-badge red">{t(lang, 'blocked')}</span>
    <h2 className="dramatic-title">{t(lang, 'security_intercept')}</h2>
    <p className="risk-meta">{t(lang, 'high_risk')}</p>

    <div className="block-reason-card">
      <p>{message}</p>
    </div>

    <p className="block-instruction">{t(lang, 'account_restricted')}</p>

    <div className="risk-actions stacked">
      <button className="btn-proceed red">
        <Phone size={18} /> {t(lang, 'helpline_message')}
      </button>
      <button className="btn-link" onClick={onCancel}>{t(lang, 'close_logout')}</button>
    </div>
  </div>
);
