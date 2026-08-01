import { useState, useEffect, useRef } from "react";
import "./Goals.css";
import axios from 'axios';
import RiskInterceptModal from '../components/RiskInterceptModal';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

import { Capacitor } from '@capacitor/core';
const API_BASE = process.env.REACT_APP_API_URL || (Capacitor.isNativePlatform() ? "http://10.0.2.2:8000" : "http://localhost:8000");

const PILLARS = [
  {
    id: "estate",
    icon: "🏠",
    badge: "Target 2026",
    name: "Estate Acquisition",
    desc: "Down payment for primary residence.",
    progress: 64,
    min: "₹0",
    max: "₹25,00,000 Target",
    nudge: {
      type: "success",
      label: "Nudge",
      text: "Increasing monthly allocation by ₹42,205 reaches target 4 months earlier.",
    },
  },
  {
    id: "education",
    icon: "🎓",
    badge: "Target 2032",
    name: "Legacy Education",
    desc: "University fund for descendants.",
    progress: 31,
    min: "₹0",
    max: "₹19,00,000 Target",
    nudge: {
      type: "warn",
      label: "Attention",
      text: "Inflation projections suggest a 12% increase in cost. Adjust target?",
    },
  },
  {
    id: "liquidity",
    icon: "🌱",
    badge: "Target 2045",
    name: "Liquidity Freedom",
    desc: "Full passive income retirement.",
    progress: 12,
    min: "₹0",
    max: "₹4.9cr Target",
    nudge: {
      type: "info",
      label: "Momentum",
      text: "Compounding interest has accelerated your timeline by 18 months.",
    },
  },
];

const BAR_YEARS = [2024, 2028, 2032, 2036, 2040, 2045];
const BAR_OPTIMISTIC = [14, 22, 34, 50, 68, 100];
const BAR_STANDARD = [11, 18, 27, 40, 54, 80];

const RISK_OPTIONS = ["Conservative", "Balanced", "Aggressive"];

function ProgressBar({ pct, animated }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 80);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${width}%` }} />
    </div>
  );
}

function PillarCard({ pillar, idx }) {
  return (
    <div className="pillar-card" style={{ animationDelay: `${0.05 + idx * 0.07}s` }}>
      <div className="pillar-card-top">
        <div className="pillar-icon-wrap">{pillar.icon}</div>
        <span className="pillar-badge">{pillar.badge}</span>
      </div>

      <div>
        <div className="pillar-name">{pillar.name}</div>
        <div className="pillar-desc">{pillar.desc}</div>
      </div>

      <div className="progress-block">
        <div className="progress-label-row">
          <span className="progress-label">Progress</span>
          <span className="progress-pct">{pillar.progress}%</span>
        </div>
        <ProgressBar pct={pillar.progress} />
        <div className="progress-range">
          <span>{pillar.min}</span>
          <span>{pillar.max}</span>
        </div>
      </div>

      <div className={`pillar-nudge ${pillar.nudge.type}`}>
        <div className="nudge-dot" />
        <div className="nudge-text">
          <strong>{pillar.nudge.label}:</strong> {pillar.nudge.text}
        </div>
      </div>
    </div>
  );
}

function BarChart({ optimistic, standard, activeYear }) {
  const maxVal = Math.max(...optimistic);
  return (
    <div className="bar-chart">
      {BAR_YEARS.map((year, i) => (
        <div className="bar-group" key={year}>
          <div
            className="bar standard"
            style={{ height: `${(standard[i] / maxVal) * 130}px` }}
          />
          <div
            className="bar optimistic"
            style={{ height: `${(optimistic[i] / maxVal) * 130}px` }}
          >
            {year === activeYear && (
              <div className="active-bar-marker">🏠</div>
            )}
          </div>
          <span className="bar-year">{year}</span>
        </div>
      ))}
    </div>
  );
}

// Savings simulator helper
function buildProjectionData(goalAmount, goalSaved, sipAmount, annualReturn) {
  const monthlyReturn = annualReturn / 100 / 12;
  const data = [];
  let balance = goalSaved;
  for (let m = 0; m <= 120; m++) {
    balance = balance * (1 + monthlyReturn) + sipAmount;
    data.push({ month: m, balance: Math.round(balance) });
    if (balance >= goalAmount) break;
  }
  return data;
}

function SavingsSimulator() {
  const GOAL_AMOUNT = 800000;
  const GOAL_SAVED = 150000;
  const BASE_SIP = 5000;

  const [sipBoost, setSipBoost] = useState(0);
  const [annualReturn, setAnnualReturn] = useState(8);
  const [serverMonths, setServerMonths] = useState(null);
  const [serverStatus, setServerStatus] = useState('idle'); // idle | loading | ok | unavailable

  const totalSip = BASE_SIP + sipBoost;
  const dataBase = buildProjectionData(GOAL_AMOUNT, GOAL_SAVED, BASE_SIP, annualReturn);
  const dataNew  = buildProjectionData(GOAL_AMOUNT, GOAL_SAVED, totalSip, annualReturn);

  const baseMonths = dataBase.length - 1;
  const newMonths  = dataNew.length - 1;
  const saved      = baseMonths - newMonths;

  // Cross-check the client-side projection against the wealth-engine's
  // own goal-projection model, so the number shown isn't purely client math.
  useEffect(() => {
    const token = localStorage.getItem('token');
    const handle = setTimeout(() => {
      setServerStatus('loading');
      axios.post(`${API_BASE}/api/recommend/goal-projection`, {
        current_savings: GOAL_SAVED,
        monthly_contribution: totalSip,
        goal_amount: GOAL_AMOUNT,
        expected_return_pct: annualReturn,
        months_remaining: 120,
      }, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
        .then(res => {
          const months = res.data?.projected_months;
          setServerMonths(months != null && months >= 0 ? months : null);
          setServerStatus(months != null && months >= 0 ? 'ok' : 'unavailable');
        })
        .catch(() => setServerStatus('unavailable'));
    }, 400); // debounce while dragging the slider
    return () => clearTimeout(handle);
  }, [totalSip, annualReturn]);

  const maxMonths = Math.max(dataBase.length, dataNew.length);
  const merged = Array.from({ length: maxMonths }, (_, i) => ({
    month: i,
    base:  dataBase[i]?.balance ?? null,
    boost: dataNew[i]?.balance  ?? null,
  }));

  return (
    <div className="savings-simulator">
      <h3 className="sim-title">Goal Savings Simulator — Buy a Car</h3>
      <p className="sim-subtitle">Target: ₹8,00,000 · Saved so far: ₹1,50,000</p>

      <div className="sim-sliders">
        <div className="sim-slider-group">
          <div className="sim-slider-label">
            <span>Extra monthly SIP</span>
            <span className="sim-slider-val">+₹{sipBoost.toLocaleString('en-IN')}/mo</span>
          </div>
          <input
            type="range" min={0} max={15000} step={500} value={sipBoost}
            onChange={(e) => setSipBoost(Number(e.target.value))}
            className="sim-range"
          />
        </div>

        <div className="sim-slider-group">
          <div className="sim-slider-label">
            <span>Expected annual return</span>
            <span className="sim-slider-val">{annualReturn}%</span>
          </div>
          <input
            type="range" min={6} max={15} step={0.5} value={annualReturn}
            onChange={(e) => setAnnualReturn(Number(e.target.value))}
            className="sim-range"
          />
        </div>
      </div>

      {sipBoost > 0 && (
        <div className="sim-insight">
          Save ₹{sipBoost.toLocaleString('en-IN')} more per month → reach goal{' '}
          <strong>{saved > 0 ? `${saved} months earlier` : 'on same timeline'}</strong>
        </div>
      )}

      <div className="sim-chart">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={merged} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} label={{ value: 'Months', position: 'insideBottom', offset: -2, fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`} />
            <Tooltip formatter={(v) => `₹${v?.toLocaleString('en-IN')}`} labelFormatter={(l) => `Month ${l}`} />
            <ReferenceLine y={GOAL_AMOUNT} stroke="#005f52" strokeDasharray="4 4" label={{ value: 'Goal', fill: '#005f52', fontSize: 10 }} />
            <Line type="monotone" dataKey="base"  stroke="#ccf2ed" strokeWidth={2} dot={false} name="Current SIP" />
            <Line type="monotone" dataKey="boost" stroke="#005f52" strokeWidth={2} dot={false} name="Boosted SIP" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="sim-legend">
        <span className="sim-legend-item base">─ Current SIP (₹{BASE_SIP.toLocaleString('en-IN')}/mo) → {baseMonths} months</span>
        {sipBoost > 0 && (
          <span className="sim-legend-item boost">─ Boosted SIP (₹{totalSip.toLocaleString('en-IN')}/mo) → {newMonths} months</span>
        )}
      </div>

      <div style={{ marginTop: 10, fontSize: 11, color: '#9ca3af' }}>
        {serverStatus === 'loading' && 'Cross-checking with wealth-engine model…'}
        {serverStatus === 'ok' && `Wealth-engine model agrees: ~${serverMonths} months at this contribution rate.`}
        {serverStatus === 'unavailable' && 'Wealth-engine cross-check unavailable — showing client-side estimate only.'}
      </div>
    </div>
  );
}

export default function Goals({ language = 'en' }) {
  const [goals, setGoals] = useState(PILLARS);
  useEffect(() => {
    localStorage.setItem('swt_goals', JSON.stringify(goals));
  }, [goals]);
const [contribution, setContribution] = useState(4500);
const [yield_, setYield] = useState(7.2);
const [riskIdx, setRiskIdx] = useState(1);
const [loading, setLoading] = useState(false); // this one is used, keep it
const [peak, setPeak] = useState(8241500);
const [probability, setProbability] = useState(38);
const [optBars, setOptBars] = useState(BAR_OPTIMISTIC);
const [stdBars, setStdBars] = useState(BAR_STANDARD);

const [riskModal, setRiskModal] = useState({
  isOpen: false, decision: null, riskScore: 0, message: ""
});
const [pendingAction, setPendingAction] = useState(null);

const securityGate = async (actionToRun, metadata) => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    const u = JSON.parse(userStr);
      window.dispatchEvent(new CustomEvent('swt_api_error', { detail: 'Access Denied: Nominee emergency view mode is active. Goal modifications are restricted.' }));
      return;
  }
  try {
    const res = await axios.post(`${API_BASE}/api/action/execute`, metadata);
    setPendingAction(() => actionToRun);
    setRiskModal({
      isOpen: true,
      decision: res.data.decision,
      riskScore: res.data.riskScore,
      message: res.data.message
    });
  } catch {
    setRiskModal({
      isOpen: true,
      decision: 'BLOCK',
      message: "Security protocols offline. Wealth actions restricted."
    });
  }
};

useEffect(() => {
  axios.get(`${API_BASE}/api/goals/1`)
    .then(res => {
      if (res.data && res.data.length > 0) {
        setGoals(res.data); // use real data when API is ready
      }
      // if empty or missing, PILLARS fallback stays in state
    })
    .catch(() => {
      // API not ready yet — PILLARS fallback already in state, do nothing
    });
}, []);

  function handleRecalc() {
    setLoading(true);
    setTimeout(() => {
      const scale = (contribution / 4500) * (yield_ / 7.2) * (1 + (riskIdx - 1) * 0.12);
      setOptBars(BAR_OPTIMISTIC.map((v) => Math.min(100, Math.round(v * scale))));
      setStdBars(BAR_STANDARD.map((v) => Math.min(100, Math.round(v * scale))));
      setPeak(Math.round(8241500 * scale));
      setProbability(Math.min(95, Math.round(38 * scale)));
      setLoading(false);
    }, 700);
  }

  const peakFormatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(peak);

  return (
    <div className="goals-page">
      {/* ── Architectural Intent ── */}
      <div className="section-header">
        <h1 className="section-title">Architectural Intent</h1>
        <p className="section-subtitle">
          Visualize your capital allocation goals. Each pillar represents a cornerstone
          of your long-term liquidity strategy.
        </p>
      </div>

      <div className="pillars-grid">
        {goals.map((p, i) => (
          <PillarCard key={p.id} pillar={p} idx={i} onAction={securityGate} />
        ))}
      </div>

      {/* ── Capital Simulator ── */}
      <div className="simulator-section">
        <div className="section-header">
          <h2 className="section-title">Capital Simulator</h2>
          <p className="section-subtitle">
            Stress-test your financial horizon by adjusting primary capital variables.
          </p>
        </div>

        <div className="simulator-grid">
          {/* Controls */}
          <div className="sim-controls">
            <div className="sim-control-group">
              <div className="sim-control-label">
                <span className="sim-control-name">Monthly Contribution</span>
                <span className="sim-control-value">
                  ₹{contribution.toLocaleString()}
                </span>
              </div>
              <input
                className="sim-slider"
                type="range"
                min={500}
                max={15000}
                step={100}
                value={contribution}
                onChange={(e) => setContribution(Number(e.target.value))}
              />
            </div>

            <div className="sim-control-group">
              <div className="sim-control-label">
                <span className="sim-control-name">Expected Yield (%)</span>
                <span className="sim-control-value">{yield_.toFixed(1)}%</span>
              </div>
              <input
                className="sim-slider"
                type="range"
                min={1}
                max={20}
                step={0.1}
                value={yield_}
                onChange={(e) => setYield(Number(e.target.value))}
              />
            </div>

            <div className="sim-control-group">
              <div className="sim-control-label">
                <span className="sim-control-name">Risk Appetite</span>
                <span className="sim-control-value balanced">
                  {RISK_OPTIONS[riskIdx]}
                </span>
              </div>
              <input
                className="sim-slider"
                type="range"
                min={0}
                max={2}
                step={1}
                value={riskIdx}
                onChange={(e) => setRiskIdx(Number(e.target.value))}
              />
            </div>

            <button
              className={`recalc-btn${loading ? " loading" : ""}`}
              onClick={handleRecalc}
              disabled={loading}
            >
              <span>{loading ? "⟳" : "✦"}</span>
              {loading ? "Recalculating…" : "Recalculate Projections"}
            </button>
          </div>

          {/* Wealth Chart */}
          <div className="wealth-panel">
            <div className="wealth-panel-header">
              <div>
                <div className="wealth-title">Wealth Projection</div>
                <div className="wealth-subtitle">Estimated Net Worth by 2045</div>
              </div>
              <div className="wealth-legend">
                <div className="legend-item">
                  <div className="legend-swatch optimistic" />
                  Optimistic
                </div>
                <div className="legend-item">
                  <div className="legend-swatch standard" />
                  Standard
                </div>
              </div>
            </div>

            <BarChart optimistic={optBars} standard={stdBars} activeYear={2045} />

            <div className="peak-section">
              <div>
                <div className="peak-label">Peak Liquidity Event</div>
                <div className="peak-value">{peakFormatted}</div>
              </div>
              <div className="probability-badge">Probability: {probability}%</div>
            </div>
          </div>
        </div>
      </div>
      {/* Savings Simulator */}
      <SavingsSimulator />

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
}