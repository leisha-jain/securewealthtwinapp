import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import { C, Card } from "../utils/helpers";
import { Capacitor } from '@capacitor/core';
import { AlertTriangle } from 'lucide-react';

const API_BASE = process.env.REACT_APP_CHAT_URL || process.env.REACT_APP_API_URL || "http://localhost:8003";
const DEMO_MODE = process.env.REACT_APP_DEMO_MODE === "true";

// Fallback tips shown when AI service is unavailable
const FALLBACK_TIPS = [
  "Maintain an emergency fund covering 6 months of expenses before investing.",
  "Maximize your 80C deductions (up to ₹1.5L) through ELSS, PPF, or NPS before March 31.",
  "Review your SIP amount annually — increase by 10% each year to beat inflation.",
];

const FALLBACK_MSG = "Our AI advisor is temporarily unavailable. Here are general tips based on your profile:";

const GATEWAY_URL = process.env.REACT_APP_API_URL || (Capacitor.isNativePlatform() ? "http://10.0.2.2:8000" : "http://localhost:8000");

export default function Chat({ p, language = "en" }) {
  const firstName = p?.name?.split(" ")[0] || "there";
  const [msgs, setMsgs] = useState([
    {
      role: "ai",
      text: `Hi ${firstName}, I'm your SecureWealth coach. Your health score is ${p?.score || 72}/100. What would you like to work on today?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [apiDown, setApiDown] = useState(false);
  const endRef = useRef();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, typing]);

  const speak = (text) => {
    const s = new SpeechSynthesisUtterance(text);
    s.lang = "en-IN";
    s.rate = 1;
    s.pitch = 1;
    window.speechSynthesis.speak(s);
  };

  const send = useCallback(
    async (text) => {
      if (!text.trim()) return;

      const newMsg = { role: "user", text };
      setMsgs((m) => [...m, newMsg]);
      setInput("");
      setTyping(true);

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const sessionAssets = JSON.parse(localStorage.getItem('swt_assets') || '[]');
      const sessionLiabilities = JSON.parse(localStorage.getItem('swt_liabilities') || '[]');
      const sessionGoals = JSON.parse(localStorage.getItem('swt_goals') || '[]');

      const mergedProfile = {
        ...user,
        assets: sessionAssets,
        liabilities: sessionLiabilities,
        goals: sessionGoals,
      };

      const history = msgs.slice(-10).map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      try {
        const token = localStorage.getItem('token');
        const res = await axios.post(`${GATEWAY_URL}/api/chat/message`, {
          userId: user.userId || 'demo-user',
          message: text,
          history,
          language,
          profile: mergedProfile,
          user_profile: mergedProfile,
          sessionUpdates: {
            assets: sessionAssets,
            liabilities: sessionLiabilities,
            goals: sessionGoals
          },
          userAdditions: {
            assets: sessionAssets,
            liabilities: sessionLiabilities,
            goals: sessionGoals
          }
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTyping(false);
        const reply = res.data.reply || res.data.response || "";
        // Service reachable but no LLM key configured — fall back rather than
        // surfacing the raw setup instruction to the user.
        if (!reply || /not configured|GROQ_API_KEY/i.test(reply)) {
          setApiDown(true);
          const tip = FALLBACK_TIPS[Math.floor(Math.random() * FALLBACK_TIPS.length)];
          setMsgs((m) => [...m, { role: "ai", text: `${FALLBACK_MSG}\n\n${tip}` }]);
          return;
        }
        setMsgs((m) => [...m, { role: "ai", text: reply }]);
        speak(reply);
      } catch (err) {
        console.warn("[Chat API Failed]:", err.message);
        setTyping(false);
        if (err.response?.status === 401 || err.response?.status === 403) {
          // Not a connectivity problem — the session token itself is invalid.
          // Retrying won't help; the user needs to log back in.
          setMsgs((m) => [...m, {
            role: "ai",
            text: "Your session has expired. Please log out and log back in to continue chatting.",
          }]);
          return;
        }
        setApiDown(true);
        const tip = FALLBACK_TIPS[Math.floor(Math.random() * FALLBACK_TIPS.length)];
        const fallbackReply = `${FALLBACK_MSG}\n\n${tip}`;
        setMsgs((m) => [...m, { role: "ai", text: fallbackReply }]);
      }
    },
    [language, msgs]
  );

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      window.dispatchEvent(new CustomEvent('swt_api_error', { detail: 'Speech Recognition not supported in this browser.' }));
      return;
    }
    const r = new SR();
    r.lang = "en-IN";
    r.start();
    r.onresult = (e) => {
      const t = e.results[0][0].transcript;
      setInput(t);
      send(t);
    };
  };

  const starters = [
    "What is my biggest financial risk?",
    "How can I reach my goal faster?",
    "Should I continue SIPs in this market?",
    "How to maximise 80C tax savings?",
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: C.text, letterSpacing: "-0.3px" }}>
          AI wealth coach
        </h2>
        <p style={{ fontSize: 13, color: C.textMuted, marginTop: 3 }}>SecureWealth advisor</p>
      </div>

      {/* API down warning banner */}
      {apiDown && (
        <div style={{
          background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8,
          padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#92400e",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <AlertTriangle size={14} style={{ flexShrink: 0 }} /> AI service offline — showing general tips. Connect the backend to enable live AI.
        </div>
      )}

      {/* Starter prompts */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        {starters.map((s, i) => (
          <button
            key={i}
            onClick={() => send(s)}
            style={{
              padding: "6px 12px", borderRadius: C.r, background: C.surface,
              border: `1px solid ${C.border}`, color: C.textSub, fontSize: 12,
              cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.ink; e.currentTarget.style.color = C.text; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSub; }}
          >
            {s}
          </button>
        ))}
      </div>

      <Card style={{ display: "flex", flexDirection: "column", height: 420 }}>
        <div style={{ flex: 1, overflowY: "auto", paddingBottom: 8 }}>
          {msgs.map((m, i) => (
            <div
              key={i}
              style={{
                display: "flex", gap: 10, marginBottom: 12,
                flexDirection: m.role === "user" ? "row-reverse" : "row",
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                background: m.role === "ai" ? C.ink : C.bg,
                border: `1px solid ${C.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 600, color: m.role === "ai" ? "#fff" : C.textSub,
              }}>
                {m.role === "ai" ? "W" : (p?.name?.[0] || "U")}
              </div>
              <div style={{
                maxWidth: "74%", padding: "9px 13px", borderRadius: 10, fontSize: 13,
                lineHeight: 1.55, whiteSpace: "pre-line",
                background: m.isFallback ? "#fffbeb" : m.role === "ai" ? C.bg : C.ink,
                border: m.isFallback ? "1px solid #fde68a" : `1px solid ${C.border}`,
                color: m.isFallback ? "#92400e" : m.role === "ai" ? C.text : "#fff",
              }}>
                {m.text}
              </div>
            </div>
          ))}

          {typing && (
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", background: C.ink,
                border: `1px solid ${C.border}`, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 11, fontWeight: 600, color: "#fff",
              }}>W</div>
              <div style={{
                padding: "9px 13px", borderRadius: 10, background: C.bg,
                border: `1px solid ${C.border}`, display: "flex", gap: 4, alignItems: "center",
              }}>
                {[0, 1, 2].map((i) => (
                  <span key={i} style={{
                    width: 5, height: 5, borderRadius: "50%", background: C.borderDark,
                    display: "inline-block", animation: `bounce 1s ${i * 0.15}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12, display: "flex", gap: 8 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send(input))}
            placeholder="Ask anything..."
            style={{
              flex: 1, background: C.bg, border: `1px solid ${C.border}`,
              borderRadius: C.r, padding: "9px 13px", color: C.text,
              fontSize: 13, outline: "none", fontFamily: "inherit",
            }}
          />
          <button
            onClick={startListening}
            style={{
              width: 38, height: 38, borderRadius: C.r, background: C.bg,
              border: `1px solid ${C.border}`, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="4.5" y="1" width="5" height="7" rx="2.5" stroke={C.textSub} strokeWidth="1.2" />
              <path d="M2 7a5 5 0 0010 0" stroke={C.textSub} strokeWidth="1.2" strokeLinecap="round" />
              <line x1="7" y1="12" x2="7" y2="14" stroke={C.textSub} strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </button>
          <button
            onClick={() => send(input)}
            style={{
              width: 38, height: 38, borderRadius: C.r, background: C.ink,
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 12L12 7L2 2V6L9 7L2 8V12Z" fill="white" />
            </svg>
          </button>
        </div>
      </Card>
    </div>
  );
}
