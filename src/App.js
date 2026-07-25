import { useState, useEffect, useRef, useCallback } from "react";
import { PERSONAS, FRAUD_SCENARIOS, MARKET } from "./data/personas";
import { C } from "./utils/helpers";
import Navbar from "./components/Navbar";
import Toast from "./components/Toast";
import Dashboard from "./components/Dashboard";
import Goals from "./components/Goals";
import NetWorth from "./components/Networth";
import Portfolio from "./components/Portfolio";
import Chat from "./components/Chat";
import Alerts from "./components/Alerts";
import Login from "./pages/Login";
import OTP from "./pages/OTP";
import Register1 from "./pages/Register1";
import Register2 from "./pages/Register2";
import Register3 from "./pages/Register3";
import axios from 'axios';
import { Dot } from "./utils/helpers";

// Configure global axios interceptor for emotional context and last action caching
axios.interceptors.request.use((config) => {
  if (config.url && config.url.includes('/api/action/execute')) {
    localStorage.setItem('last_action_payload', JSON.stringify(config.data || {}));

    const lastLoss = localStorage.getItem('last_loss_view_timestamp');
    if (lastLoss) {
      const elapsed = (Date.now() - Number(lastLoss)) / 1000;
      if (elapsed < 90) {
        if (!config.data) config.data = {};
        config.data.emotional_context = "post_loss_view";
      }
    }
  }
  return config;
}, (err) => Promise.reject(err));

// ─── PULSE STRIP ──────────────────────────────────────────────────────────────


function PulseStrip() {
  const [tick, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick(x => x + 1), 3000); return () => clearInterval(t); }, []);
  const items = [
    { label: "Gold", val: `₹${(MARKET.gold + (tick % 3) * 12).toLocaleString("en-IN")}/10g`, up: true },
    { label: "Nifty 50", val: (MARKET.nifty + (tick % 2) * 8).toLocaleString("en-IN"), up: tick % 4 !== 3 },
    { label: "FD rate", val: `${MARKET.fd}%`, up: false },
    { label: "Inflation", val: `${MARKET.inflation}%`, up: false },
    { label: "USD/INR", val: `₹${(83.42 + (tick % 3) * 0.04).toFixed(2)}`, up: tick % 3 === 0 },
  ];
  return (
    <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "7px 24px", display: "flex", gap: 28, alignItems: "center", fontSize: 12, overflowX: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, display: "inline-block" }} />
        <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 500 }}>Live</span>
      </div>
      {items.map(it => (
        <span key={it.label} style={{ display: "flex", gap: 7, alignItems: "center", whiteSpace: "nowrap" }}>
          <span style={{ color: C.textMuted }}>{it.label}</span>
          <span style={{ color: it.up ? C.green : C.red, fontWeight: 500 }}>{it.val}</span>
        </span>
      ))}
    </div>
  );
}

// ─── FRAUD MODAL ──────────────────────────────────────────────────────────────
function FraudModal({ scenario, onClose }) {
  const [count, setCount] = useState(30);
  const [unlocked, setUnlocked] = useState(scenario.level !== "warn");
  useEffect(() => {
    if (scenario.level !== "warn") return;
    const t = setInterval(() => setCount(c => { if (c <= 1) { setUnlocked(true); clearInterval(t); return 0; } return c - 1; }), 1000);
    return () => clearInterval(t);
  }, [scenario.level]);



  const palette = {
    allow: { text: C.green, bg: C.greenLight, border: C.greenBorder, title: "Transaction cleared" },
    warn: { text: C.amber, bg: C.amberLight, border: C.amberBorder, title: "Suspicious activity" },
    block: { text: C.red, bg: C.redLight, border: C.redBorder, title: "Transaction blocked" },
  }[scenario.level];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.25)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: 400, background: C.surface, border: `1px solid ${palette.border}`, borderRadius: C.rLg, overflow: "hidden", boxShadow: "0 16px 48px rgba(0,0,0,0.10)" }}>
        <div style={{ background: palette.bg, padding: "16px 20px", borderBottom: `1px solid ${palette.border}` }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: palette.text }}>{palette.title}</div>
          <div style={{ fontSize: 12, color: C.textSub, marginTop: 3 }}>{scenario.action} · {scenario.device}</div>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ textAlign: "center", padding: "14px 0", background: C.bg, borderRadius: C.r, marginBottom: 16, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 40, fontWeight: 700, color: palette.text, letterSpacing: "-1px", lineHeight: 1 }}>{scenario.score}</div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>Risk score · {scenario.level} zone</div>
          </div>
          <div style={{ marginBottom: 16 }}>
            {scenario.signals.map((s, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < scenario.signals.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Dot variant={scenario.level === "allow" ? "ok" : scenario.level} />
                  <span style={{ fontSize: 13, color: C.text }}>{s.label}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 500, color: palette.text }}>+{s.pts}</span>
              </div>
            ))}
          </div>
          {scenario.level === "warn" && !unlocked && (
            <div style={{ textAlign: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 30, fontWeight: 700, color: C.amber, letterSpacing: "-1px" }}>{count}s</div>
              <div style={{ fontSize: 11, color: C.textMuted }}>Cooling-off period</div>
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            {scenario.level !== "block" ? (
              <button onClick={onClose} disabled={!unlocked} style={{
                flex: 1, padding: "10px", borderRadius: C.r, border: `1px solid ${unlocked ? palette.text : C.border}`,
                background: unlocked ? palette.text : C.bg, color: unlocked ? "#fff" : C.textFaint,
                fontWeight: 500, cursor: unlocked ? "pointer" : "not-allowed", fontSize: 13, fontFamily: "inherit"
              }}>
                {unlocked ? "Proceed" : `Wait ${count}s`}
              </button>
            ) : (
              <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: C.r, border: `1px solid ${C.redBorder}`, background: C.redLight, color: C.red, fontWeight: 500, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
                Call helpline
              </button>
            )}
            <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: C.r, border: `1px solid ${C.border}`, background: C.bg, color: C.textSub, fontWeight: 500, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── COMMAND PALETTE ──────────────────────────────────────────────────────────
function CommandPalette({ onClose, onNav, onRisk }) {
  const [q, setQ] = useState("");
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);
  const cmds = [
    { label: "Dashboard", action: () => onNav("dashboard") },
    { label: "Goals", action: () => onNav("goals") },
    { label: "Net worth", action: () => onNav("networth") },
    { label: "Portfolio", action: () => onNav("portfolio") },
    { label: "AI coach", action: () => onNav("chat") },
    { label: "Fraud alerts", action: () => onNav("alerts") },
    { label: "Demo: allow gate", action: () => onRisk(FRAUD_SCENARIOS[2]) },
    { label: "Demo: warn gate (30s timer)", action: () => onRisk(FRAUD_SCENARIOS[1]) },
    { label: "Demo: block gate", action: () => onRisk(FRAUD_SCENARIOS[0]) },
    { label: "Switch to Priya", action: () => onNav("dashboard", "priya") },
    { label: "Switch to Ramesh", action: () => onNav("dashboard", "ramesh") },
    { label: "Switch to Arjun", action: () => onNav("dashboard", "arjun") },
  ];
  const filtered = cmds.filter(c => c.label.toLowerCase().includes(q.toLowerCase()));
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.2)", backdropFilter: "blur(3px)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 300, paddingTop: 80 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: 500, background: C.surface, border: `1px solid ${C.border}`, borderRadius: C.rLg, overflow: "hidden", boxShadow: "0 16px 48px rgba(0,0,0,0.10)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: `1px solid ${C.border}` }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke={C.textMuted} strokeWidth="1.2" />
            <path d="M9.5 9.5L12 12" stroke={C.textMuted} strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <input ref={ref} value={q} onChange={e => setQ(e.target.value)}
            placeholder="Search commands..."
            style={{ flex: 1, border: "none", outline: "none", fontSize: 14, color: C.text, fontFamily: "inherit", background: "transparent" }}
            onKeyDown={e => { if (e.key === "Escape") onClose(); if (e.key === "Enter" && filtered[0]) { filtered[0].action(); onClose(); } }} />
          <span style={{ fontSize: 11, background: C.bg, padding: "2px 6px", borderRadius: 4, color: C.textMuted, border: `1px solid ${C.border}` }}>ESC</span>
        </div>
        <div style={{ maxHeight: 300, overflowY: "auto" }}>
          {filtered.map((c, i) => (
            <div key={i} onClick={() => { c.action(); onClose(); }}
              style={{ padding: "10px 16px", cursor: "pointer", fontSize: 13, color: C.text, borderBottom: `1px solid ${C.border}`, transition: "background 0.1s" }}
              onMouseEnter={e => e.currentTarget.style.background = C.bg}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              {c.label}
            </div>
          ))}
          {!filtered.length && <div style={{ padding: 20, textAlign: "center", color: C.textFaint, fontSize: 13 }}>No results</div>}
        </div>
        <div style={{ padding: "7px 16px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 14, fontSize: 11, color: C.textFaint }}>
          <span>↵ select</span><span>ESC close</span>
        </div>
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [step, setStep] = useState("login");
  const [page, setPage] = useState("dashboard");
  const [pKey, setPKey] = useState(null);
  const [fraud, setFraud] = useState(null);
  const [cmd, setCmd] = useState(false);
  const [toastError, setToastError] = useState(null);
  const [toastSuccess, setToastSuccess] = useState(null);
  const [showAmberBanner, setShowAmberBanner] = useState(false);

  useEffect(() => {
    const handleApiError = (e) => {
      setToastError(e.detail || "Unable to reach server. Please check your connection.");
    };
    const handleApiSuccess = (e) => {
      setToastSuccess(e.detail || "Success!");
    };
    window.addEventListener('swt_api_error', handleApiError);
    window.addEventListener('swt_api_success', handleApiSuccess);
    return () => {
      window.removeEventListener('swt_api_error', handleApiError);
      window.removeEventListener('swt_api_success', handleApiSuccess);
    };
  }, []);

  useEffect(() => {
    const checkServices = async () => {
      try {
        await axios.get('http://localhost:8000/api/health/all');
        setShowAmberBanner(false);
      } catch (err) {
        if (!err.response) {
          // Gateway itself is unreachable
          setShowAmberBanner(true);
        } else {
          // Gateway is reachable, but returned 503 degraded status
          setShowAmberBanner(false);
        }
      }
    };
    checkServices();
    const interval = setInterval(checkServices, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (page === "portfolio" || page === "dashboard" || page === "networth") {
      localStorage.setItem("last_loss_view_timestamp", Date.now().toString());
    }
  }, [page]);
  const [language, setLanguage] = useState(
    () => localStorage.getItem("preferred_language") || "en"
  );
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("dark_mode") === "true"
  );


  const p = PERSONAS[pKey] || PERSONAS["priya"];

  const toggleDark = () => setDarkMode(d => {
    const next = !d;
    localStorage.setItem("dark_mode", next);
    return next;
  });

  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setCmd(c => !c); }
      if (e.key === "Escape") { setCmd(false); setFraud(null); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const handleNav = useCallback((pg, persona) => {
    setPage(pg); if (persona) setPKey(persona);
  }, []);

  if (step === "login")
    return (
      <Login
        onLogin={(user) => {
          console.log("Logged in user:", user);
          // map userId → persona key
          const map = {
            1: "arjun",
            2: "priya",
            3: "ramesh",
            4: "priya"
          };
          const key = map[user.userId] || "priya";
          setPKey(key);
          setStep("otp");
        }}
        onRegister={() => setStep("register")}
        onNext={() => setStep("register2")}
      />
    );

  if (step === "otp")
    return (
      <OTP
        onVerify={() => setStep("app")}  // ✅ go to app after OTP
      />
    );

  if (step === "register") {   // ✅ ADD HERE
    return <Register1 onBack={() => setStep("login")} onNext={() => setStep("register2")} />;

  }

  if (step === "register2") {
    return <Register2 onNext={() => setStep("register3")} />;
  }

  if (step === "register3") {
    return <Register3 onComplete={() => setStep("app")} />;
  }

  // In the main app return, replace the old layout with:
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      {showAmberBanner && (
        <div style={{
          background: '#d97706',
          color: 'white',
          padding: '8px 24px',
          textAlign: 'center',
          fontSize: '13px',
          fontWeight: '600',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          ⚠️ Some services are unavailable. Demo mode active.
        </div>
      )}

      {toastError && (
        <Toast 
          message={toastError} 
          type="error" 
          onDone={() => setToastError(null)} 
        />
      )}

      {toastSuccess && (
        <Toast 
          message={toastSuccess} 
          type="success" 
          onDone={() => setToastSuccess(null)} 
        />
      )}

      <div className={`dashboard-container${darkMode ? " dark" : ""}`} style={{ display: "flex", fontFamily: "'Segoe UI', Arial, sans-serif" }}>

      {/* ✅ SIDEBAR (GLOBAL FOR ALL PAGES) */}
      <Navbar
        page={page}
        setPage={setPage}
        language={language}
        onLanguageChange={setLanguage}
        darkMode={darkMode}
        onDarkModeToggle={toggleDark}
      />

      {/* ✅ MAIN CONTENT AREA */}
      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>

        <main key={page} style={{ background: darkMode ? "#0f172a" : "#f0f7f3", minHeight: "100vh", animation: "fadeInPage 0.3s ease" }}>

          {page === "dashboard" && (
            <Dashboard p={p} onRisk={setFraud} language={language} />
          )}

          {page === "goals" && <Goals p={p} language={language} />}

          {page === "networth" && <NetWorth p={p} language={language} />}

          {page === "portfolio" && (
            <Portfolio p={p} onRisk={setFraud} language={language} />
          )}

          {page === "chat" && <Chat p={p} language={language} />}

          {page === "alerts" && (
            <Alerts onRisk={setFraud} language={language} />
          )}

        </main>

      </div>

      {/* MODALS */}
      {fraud && (
        <FraudModal
          scenario={fraud}
          onClose={() => setFraud(null)}
        />
      )}

      {cmd && (
        <CommandPalette
          onClose={() => setCmd(false)}
          onNav={handleNav}
          onRisk={(s) => {
            setFraud(s);
            setCmd(false);
          }}
        />
      )}

    </div>
  </div>
  );
}