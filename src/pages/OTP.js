import React, { useState, useRef, useEffect, useCallback } from "react";
import "./OTP.css";
import { Capacitor } from '@capacitor/core';

const OTP_LENGTH = 6;
const COUNTDOWN_SECONDS = 29;

export default function OTP({ onVerify }) {
  const [values, setValues] = useState(Array(OTP_LENGTH).fill(""));
  const [status, setStatus] = useState("idle"); // idle | verifying | success | error
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const [resendLabel, setResendLabel] = useState("Resend OTP");
  const inputRefs = useRef([]);
  const timerRef = useRef(null);

  /* ─── Timer ───────────────────────────────────────────── */
  const startTimer = useCallback(() => {
    clearInterval(timerRef.current);
    setSecondsLeft(COUNTDOWN_SECONDS);
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    startTimer();
    inputRefs.current[0]?.focus();
    return () => clearInterval(timerRef.current);
  }, [startTimer]);

  const formatTime = (s) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const isExpired = secondsLeft === 0;
  const isComplete = values.every((v) => v !== "");

  /* ─── Input Handlers ──────────────────────────────────── */
  const handleKeyDown = (e, idx) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (values[idx]) {
        const next = [...values];
        next[idx] = "";
        setValues(next);
      } else if (idx > 0) {
        const next = [...values];
        next[idx - 1] = "";
        setValues(next);
        inputRefs.current[idx - 1]?.focus();
      }
    }
    if (e.key === "ArrowLeft" && idx > 0)  inputRefs.current[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < OTP_LENGTH - 1) inputRefs.current[idx + 1]?.focus();
  };

  const handleChange = (e, idx) => {
    const digit = e.target.value.replace(/\D/g, "").slice(-1);
    const next = [...values];
    next[idx] = digit;
    setValues(next);
    if (digit && idx < OTP_LENGTH - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData)
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    const next = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((char, i) => { next[i] = char; });
    setValues(next);
    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();
  };

  /* ─── Confirm ─────────────────────────────────────────── */
  const handleConfirm = async () => {
    if (!isComplete || status === "verifying") return;
    setStatus("verifying");

    const code = values.join("");

    // Offline demo session: no server-issued OTP exists to verify against,
    // so accept any complete code rather than dead-ending the login.
    const isDemoSession = (localStorage.getItem("token") || "").startsWith("demo-token-");
    if (isDemoSession) {
      setStatus("success");
      clearInterval(timerRef.current);
      setTimeout(() => onVerify?.(), 900);
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = user.userId;
      const API_URL = process.env.REACT_APP_API_URL || (Capacitor.isNativePlatform() ? "http://10.0.2.2:8000" : "http://localhost:8000");
      const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, code })
      });
      const data = await res.json();
      if (res.status === 200 && data.success) {
        setStatus("success");
        clearInterval(timerRef.current);
        setTimeout(() => onVerify?.(), 1500);
      } else {
        setStatus("error");
        setValues(Array(OTP_LENGTH).fill(""));
        setTimeout(() => {
          setStatus("idle");
          inputRefs.current[0]?.focus();
        }, 600);
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
      setValues(Array(OTP_LENGTH).fill(""));
      setTimeout(() => {
        setStatus("idle");
        inputRefs.current[0]?.focus();
      }, 600);
    }
  };

  /* ─── Resend ──────────────────────────────────────────── */
  const handleResend = () => {
    if (!isExpired) return;
    setValues(Array(OTP_LENGTH).fill(""));
    setStatus("idle");
    startTimer();
    setResendLabel("Code sent!");
    setTimeout(() => setResendLabel("Resend OTP"), 2000);
    inputRefs.current[0]?.focus();
  };

  /* ─── Render ──────────────────────────────────────────── */
  if (status === "success") {
    return (
      <div className="otp-page">
      <div className="card">
        <div className="success-overlay visible">
          <div className="success-checkmark">✓</div>
          <p className="success-title">Identity Verified</p>
          <p className="success-subtitle">You're all set. Redirecting…</p>
        </div>
      </div>
      </div>
    );
  }

  return (
    <div className="otp-page">
    <div className="card">
      <h1 className="card__title">Verify Identity</h1>
      <p className="card__subtitle">Code sent to +91 ••••• ••942</p>

      {/* OTP Inputs */}
      <div className="otp-inputs">
        {values.map((val, idx) => (
          <input
            key={idx}
            ref={(el) => (inputRefs.current[idx] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={val}
            className={[
              "otp-input",
              val ? "filled" : "",
              status === "error" ? "error" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-label={`OTP digit ${idx + 1}`}
            autoComplete={idx === 0 ? "one-time-code" : "off"}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            onChange={(e) => handleChange(e, idx)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
          />
        ))}
      </div>

      {/* Confirm Button */}
      <button
        className="btn-confirm"
        disabled={!isComplete || status === "verifying"}
        onClick={handleConfirm}
      >
        {status === "verifying" ? "Verifying…" : "Confirm & Authorize "}
      </button>

      {/* Footer */}
      <div className="footer-row">
        <div className={`timer${isExpired ? " expired" : ""}`}>
          <svg className="timer__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {isExpired ? (
            <span className="timer__text">Expired</span>
          ) : (
            <span className="timer__text">Expires in {formatTime(secondsLeft)}</span>
          )}
        </div>
        <button className="btn-resend" disabled={!isExpired} onClick={handleResend}>
          {resendLabel}
        </button>
      </div>

      {/* Security Notice */}
      <div className="notice">
        <span className="notice__icon">ⓘ</span>
        <p className="notice__text">
          Never share your OTP with anyone, including bank officials.{" "}
          <strong>SecureWealth Twin will never ask for your code over a phone call or email.</strong>
        </p>
      </div>
    </div>
    </div>
  );
}
