import { useEffect, useState } from "react";
import axios from "axios";
import { C } from "../utils/helpers";
import { Capacitor } from "@capacitor/core";

const API_BASE = process.env.REACT_APP_API_URL || (Capacitor.isNativePlatform() ? "http://10.0.2.2:8000" : "http://localhost:8000");

const FALLBACK_COMPLIANCE = {
  consent_text: "We use your financial data to provide personalised insights. No data is stored or shared.",
  data_usage_toggles: [
    { label: "Use transaction data for analysis", default: true, required: true },
    { label: "Use profile for personalised recommendations", default: true, required: true },
    { label: "Anonymous analytics to improve the product", default: false, required: false },
  ],
  privacy_summary: "All data is processed securely and used only within this app session. Not stored, not shared.",
  disclaimer: "For simulation purposes only. This is not financial advice.",
};

export default function ConsentModal({ onAccept }) {
  const [compliance, setCompliance] = useState(FALLBACK_COMPLIANCE);
  const [toggles, setToggles] = useState(FALLBACK_COMPLIANCE.data_usage_toggles.map(t => t.default));

  useEffect(() => {
    let cancelled = false;
    axios.get(`${API_BASE}/api/chat/compliance`, { timeout: 5000 })
      .then(res => {
        if (cancelled || !res.data) return;
        setCompliance(res.data);
        setToggles((res.data.data_usage_toggles || FALLBACK_COMPLIANCE.data_usage_toggles).map(t => t.default));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const requiredSatisfied = compliance.data_usage_toggles.every((t, i) => !t.required || toggles[i]);

  const handleToggle = (i) => {
    setToggles(prev => prev.map((v, idx) => (idx === i ? !v : v)));
  };

  const handleAccept = () => {
    localStorage.setItem("swt_consent_accepted", "true");
    localStorage.setItem("swt_consent_toggles", JSON.stringify(toggles));
    onAccept();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500 }}>
      <div style={{ width: 440, maxWidth: "90vw", background: C.surface, border: `1px solid ${C.border}`, borderRadius: C.rLg, overflow: "hidden", boxShadow: "0 16px 48px rgba(0,0,0,0.15)" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>Before we begin: your data, your choice</div>
        </div>
        <div style={{ padding: 20 }}>
          <p style={{ fontSize: 13, color: C.textSub, margin: "0 0 14px" }}>{compliance.consent_text}</p>

          {compliance.data_usage_toggles.map((t, i) => (
            <label key={t.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "8px 0", borderBottom: i < compliance.data_usage_toggles.length - 1 ? `1px solid ${C.border}` : "none", cursor: t.required ? "default" : "pointer" }}>
              <span style={{ fontSize: 13, color: C.text }}>
                {t.label}
                {t.required && <span style={{ fontSize: 11, color: C.textFaint, marginLeft: 6 }}>(required)</span>}
              </span>
              <input
                type="checkbox"
                checked={!!toggles[i]}
                disabled={t.required}
                onChange={() => handleToggle(i)}
              />
            </label>
          ))}

          <p style={{ fontSize: 11, color: C.textFaint, margin: "14px 0 4px" }}>{compliance.privacy_summary}</p>
          <p style={{ fontSize: 11, color: C.textFaint, margin: "4px 0 16px", fontStyle: "italic" }}>{compliance.disclaimer}</p>

          <button
            onClick={handleAccept}
            disabled={!requiredSatisfied}
            style={{
              width: "100%", padding: "10px", borderRadius: C.r, border: "none",
              background: requiredSatisfied ? C.green : C.border,
              color: requiredSatisfied ? "#fff" : C.textFaint,
              fontWeight: 500, fontSize: 13, cursor: requiredSatisfied ? "pointer" : "not-allowed", fontFamily: "inherit",
            }}
          >
            Agree and continue
          </button>
        </div>
      </div>
    </div>
  );
}
