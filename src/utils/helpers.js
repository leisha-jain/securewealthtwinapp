import { useState, useEffect } from "react";

export function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!target) return;
    let current = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      setValue(Math.round(current));
      if (current >= target) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return value;
}

export const C = {
  bg:           "#f5f4f0",
  surface:      "#ffffff",
  surfaceAlt:   "#faf9f7",
  border:       "#e6e3dd",
  borderDark:   "#d4d0c8",
  text:         "#1c1c1c",
  textSub:      "#666",
  textMuted:    "#999",
  textFaint:    "#bbb",
  green:        "#16a34a",
  greenLight:   "#f0fdf4",
  greenBorder:  "#bbf7d0",
  amber:        "#92400e",
  amberLight:   "#fffbeb",
  amberBorder:  "#fde68a",
  red:          "#b91c1c",
  redLight:     "#fef2f2",
  redBorder:    "#fecaca",
  ink:          "#1c1c1c",
  r:            "10px",
  rLg:          "14px",
  shadow:       "0 1px 3px rgba(0,0,0,0.06)",
};

export const fmt = (n) =>
  n >= 10000000 ? `₹${(n / 10000000).toFixed(1)}Cr`
  : n >= 100000 ? `₹${(n / 100000).toFixed(1)}L`
  : `₹${n.toLocaleString("en-IN")}`;

export const pct = (saved, target) => Math.round((saved / target) * 100);

export const personaKey = (p, PERSONAS) =>
  Object.keys(PERSONAS).find(k => PERSONAS[k] === p) || "priya";

// Shared primitive components
export function Card({ children, style = {} }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: C.rLg, padding: 20, boxShadow: C.shadow, ...style }}>
      {children}
    </div>
  );
}

export function Tag({ children, variant = "neutral" }) {
  const v = {
    ok:      { bg: C.greenLight,  color: C.green,  border: C.greenBorder  },
    warn:    { bg: C.amberLight,  color: C.amber,  border: C.amberBorder  },
    block:   { bg: C.redLight,    color: C.red,    border: C.redBorder    },
    neutral: { bg: C.surfaceAlt,  color: C.textSub,border: C.border       },
  }[variant] || { bg: C.surfaceAlt, color: C.textSub, border: C.border };
  return (
    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, fontWeight: 500, background: v.bg, color: v.color, border: `1px solid ${v.border}`, display: "inline-block", whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

export function Dot({ variant = "ok" }) {
  const colors = { ok: C.green, warn: "#d97706", block: C.red };
  return <span style={{ width: 6, height: 6, borderRadius: "50%", background: colors[variant] || colors.ok, display: "inline-block", flexShrink: 0 }} />;
}

export function Bar({ value, color = C.green, height = 5 }) {
  return (
    <div style={{ height, background: "#ede9e4", borderRadius: 99, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${Math.min(value, 100)}%`, background: color, borderRadius: 99, transition: "width 0.7s ease" }} />
    </div>
  );
}

export function ScoreRing({ score, label }) {
  const r = 40, circ = 2 * Math.PI * r;
  const off = circ - (score / 100) * circ;
  const color = score >= 70 ? C.green : score >= 55 ? "#d97706" : C.red;
  return (
    <div style={{ position: "relative", width: 96, height: 96 }}>
      <svg width={96} height={96} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={48} cy={48} r={r} fill="none" stroke="#ede9e4" strokeWidth={7}/>
        <circle cx={48} cy={48} r={r} fill="none" stroke={color} strokeWidth={7}
          strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }}/>
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 20, fontWeight: 600, color, letterSpacing: "-0.5px" }}>{score}</span>
        <span style={{ fontSize: 9, color: C.textMuted, marginTop: 1 }}>{label}</span>
      </div>
    </div>
  );
}

export function MiniBar({ data, color = C.green }) {
  const max = Math.max(...data);
  const labels = ["J","J","A","S","O","N","D","J","F","M","A","M"];

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 56 }}>
      {data.map((v, i) => {
        const isActive = i === data.length - 1;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <div style={{
              width: "100%",
              borderRadius: "2px 2px 0 0",
              minHeight: 3,
              height: `${(v / max) * 100}%`,
              background: isActive ? color : `${color}40`,
              outline: isActive ? `2px solid ${color}` : "none",  /* makes it visible even if color fails */
              transition: "height 0.5s ease",
            }}/>
            {i % 3 === 0 && (
              <span style={{ fontSize: 8, color: C.textFaint }}>{labels[i]}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function Donut({ slices, size = 116 }) {
  const total = slices.reduce((a, b) => a + b.val, 0);
  let off = 0;
  const r = size * 0.36, circ = 2 * Math.PI * r;
  const cx = size / 2, cy = size / 2;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#ede9e4" strokeWidth={12}/>
      {slices.map((s, i) => {
        const len = (s.val / total) * circ - 2;
        const el = <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color}
          strokeWidth={12} strokeDasharray={`${len} ${circ}`} strokeDashoffset={-off}/>;
        off += len + 2;
        return el;
      })}
    </svg>
  );
}