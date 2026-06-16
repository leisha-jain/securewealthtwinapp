import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RiskInterceptModal from '../components/RiskInterceptModal';
import './Portfolio.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const Portfolio = () => {
  // Keep these as fallback defaults
  const [chartData, setChartData] = useState([
    { month: 'JAN', height: '30%' },
    { month: 'FEB', height: '45%' },
    { month: 'MAR', height: '35%' },
    { month: 'APR', height: '55%' },
    { month: 'MAY', height: '50%' },
    { month: 'JUN', height: '70%' },
    { month: 'JUL', height: '85%' },
  ]);

  const [holdings, setHoldings] = useState([
    { id: 'GS', name: 'Global Sustain Equities', code: 'GSSE-882-LQ', type: 'Equity ESG', value: '₹842,000.00', return: '+18.2%', status: 'OPTIMIZED', statusClass: 'blue' },
    { id: 'TR', name: 'T.Rowe Price Growth', code: 'TRPG-612-BL', type: 'Growth Tech', value: '₹512,450.00', return: '+24.5%', status: 'OVERWEIGHT', statusClass: 'orange' },
    { id: 'VB', name: 'Vanguard Bond Mkt', code: 'VBMX-001-FI', type: 'Fixed Income', value: '₹320,100.00', return: '-2.1%', status: 'STABLE', statusClass: 'gray' },
    { id: 'PL', name: 'Private Liquidity Pool', code: 'LP-ALPH-99', type: 'Alternative', value: '₹808,350.00', return: '+9.4%', status: 'OPTIMIZED', statusClass: 'blue' },
  ]);

  const [totalAssets, setTotalAssets] = useState('₹24,482,900.00');
  const [loading, setLoading] = useState(true);

  // Risk modal state
  const [riskModal, setRiskModal] = useState({
    isOpen: false, decision: null, riskScore: 0, message: ""
  });
  const [pendingAction, setPendingAction] = useState(null);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API_BASE}/api/portfolio/1/history`)
      .then(res => {
        if (res.data?.chartData) setChartData(res.data.chartData);
        if (res.data?.holdings) setHoldings(res.data.holdings);
        if (res.data?.totalAssets) setTotalAssets(res.data.totalAssets);
      })
      .catch(() => {
        // fallback data already in state, do nothing
      })
      .finally(() => setLoading(false));
  }, []);

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

  return (
    <div className="main-content">
      {/* Header Section */}
      <header className="page-header-alt">
        <div className="title-block">
          
          <h1>Portfolio Strategy</h1>
          <p className="subtext">Your twin portfolio is optimized for institutional growth with a calculated risk profile.</p>
        </div>
        <div className="header-actions">
          <button
  className="btn-secondary"
  onClick={() => securityGate(
    () => alert("Ledger exported!"),
    { actionType: 'EXPORT', amount: 0 }
  )}
>
  Export Ledger
</button>

          <button
  className="btn-primary"
  onClick={() => securityGate(
    () => alert("Rebalance executed!"),
    { actionType: 'REBALANCE', amount: 248290 }
  )}
>
  <span className="icon">⇄</span> Execute Rebalance
</button>
        </div>
      </header>

      {/* Top Grid: Assets & Rebalancing */}
      <div className="dashboard-grid-alt">
        <div className="content-card asset-main-card">
          <div className="card-top">
            <div>
              <span className="kpi-label">TOTAL ASSETS UNDER MANAGEMENT</span>
              <h2 className="huge-amount">{totalAssets}</h2>
            </div>
            <span className="badge-growth">+12.4%</span>
          </div>
          
          <div className="chart-wrapper">
            <div className="bar-chart-grid">
              {chartData.map((item, i) => (
                <div key={i} className="bar-column">
                  <div className="bar-fill" style={{ height: item.height }}></div>
                  <span className="bar-label">{item.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="content-card rebalance-card">
          <div className="rebalance-header">
            <span className="warn-icon">⚠️</span>
            <span className="warn-title">REBALANCING SUGGESTION</span>
          </div>
          <p className="warn-text">
            Your exposure to <strong>Emerging Markets Tech</strong> has drifted 8.4% above target threshold.
          </p>
          <div className="allocation-stats">
            <div className="stat-split">
              <span>CURRENT ALLOCATION</span>
              <span>TARGET</span>
            </div>
            <div className="allocation-bar-container">
              <div className="bar-current" style={{ width: '75%' }}></div>
              <div className="bar-target-marker" style={{ left: '60%' }}></div>
            </div>
            <div className="stat-values">
              <strong>38.4%</strong>
              <strong>30.0%</strong>
            </div>
          </div>
          <button
  className="btn-orange"
  onClick={() => securityGate(
    () => alert("Rebalancing adjustment applied!"),
    { actionType: 'REBALANCE', amount: 84000 }
  )}
>
  Review Adjustment
</button>
        </div>
      </div>

      {/* Core Holdings Table */}
      <div className="content-card table-card">
        <div className="card-header-flex">
          <h3>Core Holdings</h3>
          <div className="search-box">
            <input type="text" placeholder="Filter funds..." />
          </div>
        </div>
        
        <div className="table-container">
          <div className="table-header-row">
            <span>FUND</span>
            <span>TYPE</span>
            <span>VALUE</span>
            <span>RETURN</span>
            <span>STATUS</span>
          </div>
          {holdings.map((item) => (
            <div key={item.id} className="table-data-row">
              <div className="fund-cell">
                <div className={`fund-icon icon-${item.id}`}>{item.id}</div>
                <div>
                  <div className="row-title">{item.name}</div>
                  <div className="row-sub">{item.code}</div>
                </div>
              </div>
              <div className="type-cell">{item.type}</div>
              <div className="val-cell"><strong>{item.value}</strong></div>
              <div className={`return-cell ${item.return.startsWith('-') ? 'red' : 'green'}`}>
                {item.return}
              </div>
              <div className="status-cell">
                <span className={`status-badge ${item.statusClass}`}>{item.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Banner */}
      <div className="institutional-banner">
        <div className="banner-content">
          <h2>Institutional Oversight for Individual Wealth</h2>
          <p>We leverage the same AI-driven liquidity analysis tools used by tier-one investment banks to protect your capital.</p>
          <a href="#report" className="text-link">Read Intelligence Report →</a>
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
};

export default Portfolio;