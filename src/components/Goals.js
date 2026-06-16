import { useState, useEffect, useRef } from "react";
import "./Goals.css";
import axios from 'axios';
import RiskInterceptModal from '../components/RiskInterceptModal';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

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

export default function Goals() {
 const [goals, setGoals] = useState(PILLARS); // PILLARS as fallback
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
    if (pendingAction) pendingAction();
    setRiskModal({ ...riskModal, isOpen: false });
    setPendingAction(null);
  }}
/>
    </div>
  );
}