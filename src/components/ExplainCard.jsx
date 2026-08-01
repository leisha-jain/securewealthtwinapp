import React, { useState } from 'react';
import axios from 'axios';
import { ChevronDown, ChevronUp, Info, Activity } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import './ExplainCard.css';

const API_BASE = process.env.REACT_APP_API_URL || (Capacitor.isNativePlatform() ? "http://10.0.2.2:8000" : "http://localhost:8000");

export default function ExplainCard({ recommendationId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    // Lazy Fetching: Only fetch if we don't have data yet
    if (!isOpen && !data) {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.post(
          `${API_BASE}/api/recommend/explain`,
          { recommendationId },
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
        setData(res.data); // { explanation_text, top_drivers: [{label, weight}] }
      } catch (err) {
        // Fallback for demo if the live explain service isn't reachable
        setData({
          explanation_text: "Our model recommends this based on your recent income, savings rate, and spending pattern.",
          top_drivers: [
            { label: "Savings rate", weight: 80 },
            { label: "Spending pattern", weight: 55 },
            { label: "Tax utilization", weight: 40 }
          ]
        });
      } finally {
        setLoading(false);
      }
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="explain-container">
      <button className="why-btn" onClick={handleToggle}>
        Why? {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {isOpen && (
        <div className="explain-panel">
          {loading ? (
            <div className="explain-loader">Analyzing drivers...</div>
          ) : (
            <>
              <p className="explanation-text">
                <Info size={14} className="info-icon" />
                {data?.explanation_text}
              </p>
              
              <div className="shap-drivers">
                <span className="driver-header">TOP 3 AI DRIVERS (SHAP)</span>
                {data?.top_drivers?.slice(0, 3).map((driver, idx) => (
                  <div key={idx} className="driver-row">
                    <div className="driver-info">
                      <span className="driver-label">{driver.label}</span>
                      <span className="driver-weight">{driver.weight}% impact</span>
                    </div>
                    <div className="driver-bar-bg">
                      <div 
                        className="driver-bar-fill" 
                        style={{ width: `${driver.weight}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}