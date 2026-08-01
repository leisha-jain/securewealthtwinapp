import React, { useState, useEffect, useRef } from 'react';
import './Login.css';
import { AtSign, Lock, RefreshCw } from 'lucide-react';
import Toast from '../components/Toast';
import { Capacitor } from '@capacitor/core';

const API_BASE = process.env.REACT_APP_API_URL || (Capacitor.isNativePlatform() ? "http://10.0.2.2:8000" : "http://localhost:8000");

const CAPTCHA_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCaptcha(length = 5) {
  const code = Array.from({ length }, () =>
    CAPTCHA_CHARS[Math.floor(Math.random() * CAPTCHA_CHARS.length)]
  ).join('');
  const rotations = Array.from({ length }, () =>
    parseFloat((Math.random() * 20 - 10).toFixed(1))
  );
  return { code, rotations };
}

const Login = ({onLogin, onRegister}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captcha, setCaptcha] = useState(generateCaptcha());
  const [spinning, setSpinning] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Some Android autofill/password-manager flows fill an input's visible
  // value without firing the DOM 'input' event React listens for, leaving
  // this component's state stale (e.g. empty) while the field looks filled
  // on screen. Reading straight from the DOM at submit time sidesteps that.
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);

  const refreshCaptcha = () => {
    setCaptcha(generateCaptcha());
    setCaptchaInput('');
    setSpinning(true);
    setTimeout(() => setSpinning(false), 400);
  };

  // Offline demo fallback. Passwords MUST match data/db.json so the same
  // credentials work whether or not the backend is reachable.
  const DEMO_USERS = {
    "priya":  { userId: 2, name: "Priya Sharma",  password: "1234" },
    "ramesh": { userId: 3, name: "Ramesh Kumar",  password: "1234" },
    "arjun":  { userId: 1, name: "Arjun Mehta",   password: "1234" },
    "neha":   { userId: 4, name: "Neha Sharma",   password: "1234" },
    "1":      { userId: 1, name: "Arjun Mehta",   password: "1234" },
    "2":      { userId: 2, name: "Priya Sharma",  password: "1234" },
    "3":      { userId: 3, name: "Ramesh Kumar",  password: "1234" },
    "4":      { userId: 4, name: "Neha Sharma",   password: "1234" },
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Read straight from the DOM rather than trusting React state alone —
    // some Android autofill/password-manager flows fill the visible input
    // without firing the event React needs to stay in sync.
    const liveUsername = (usernameRef.current?.value ?? username).trim();
    const livePassword = passwordRef.current?.value ?? password;

    if (captchaInput !== captcha.code) {
      setErrorMsg("Invalid CAPTCHA");
      return;
    }

    if (!liveUsername || !livePassword) {
      setErrorMsg("Enter your username and passphrase");
      return;
    }

    const knownUser = DEMO_USERS[liveUsername.toLowerCase()];
    const resolvedUserId = knownUser ? knownUser.userId : Number(liveUsername);

    // The backend is authoritative. Only fall back to the offline demo when
    // it is genuinely unreachable — never to mask a rejected password.
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: resolvedUserId,
          password: livePassword,
          deviceId: "web-browser"
        })
      });
      const data = await res.json();
      if (res.status !== 200) { setErrorMsg(data.error || "Login failed"); return; }
      if (!data.token || !data.user) { setErrorMsg("Invalid server response"); return; }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      onLogin(data.user);
    } catch {
      // Network failure — offer the offline demo session instead.
      if (knownUser && livePassword === knownUser.password) {
        localStorage.setItem("token", "demo-token-" + knownUser.userId);
        localStorage.setItem("user", JSON.stringify(knownUser));
        onLogin(knownUser);
        return;
      }
      setErrorMsg("Can't reach the server — check your connection");
    }
  };

  return (
    <div className="login-page">
      {errorMsg && (
        <Toast 
          message={errorMsg} 
          type="error" 
          onDone={() => setErrorMsg(null)} 
        />
      )}
      <div className="login-card">
        <div className="login-header">
          <span className="login-eyebrow">SECURE ACCESS</span>
          <h1 className="login-title">SecureWealth Twin</h1>
          
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          
          <div className="field-group">
            <label className="field-label">USERNAME</label>
            <div className="field-wrapper">
              <input
                ref={usernameRef}
                type="text"
                className="field-input"
                placeholder="priya"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              
            </div>
          </div>

          {/* Passphrase Field */}
          <div className="field-group">
            <div className="field-label-row">
              <label className="field-label">PASSPHRASE</label>
              <a href="#" className="forgot-link">Forgot?</a>
            </div>
            <div className="field-wrapper">
              <input
                ref={passwordRef}
                type="password"
                className="field-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span className="field-icon"><Lock size={16} /></span>
            </div>
          </div>

          {/* CAPTCHA / Security Verification */}
          <div className="captcha-block">
            <div className="captcha-header">
              <span className="captcha-label">SECURITY VERIFICATION</span>
              <button type="button" className={`captcha-refresh ${spinning ? 'spinning' : ''}`} onClick={refreshCaptcha}>
                <RefreshCw size={14} />
              </button>
            </div>
            <div className="captcha-body">
              <div className="captcha-display">
                {captcha.code.split('').map((char, i) => (
                  <span
                    key={i}
                    className="captcha-char"
                    style={{ '--rotate': `${captcha.rotations[i]}deg` }}
                  >
                    {char}
                  </span>
                ))}
              </div>
              <input
                type="text"
                className="captcha-input"
                placeholder="Type letters"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())}
                maxLength={5}
              />
            </div>
          </div>

          {/* Submit */}
          <button type="submit" className="submit-btn">
            Login <span className="btn-arrow">→</span>
          </button>
        </form>

        <div className="login-footer">
          <p>New to the platform? <span 
  className="register-link"
  onClick={onRegister}
>
  Register Now
</span></p>
        </div>
      </div>
    </div>
  );
};

export default Login;