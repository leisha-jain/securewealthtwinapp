import React, { useState, useEffect } from 'react';
import './Login.css';
import { AtSign, Lock, RefreshCw } from 'lucide-react';
import Toast from '../components/Toast';

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

  const refreshCaptcha = () => {
    setCaptcha(generateCaptcha());
    setCaptchaInput('');
    setSpinning(true);
    setTimeout(() => setSpinning(false), 400);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // 🔐 CAPTCHA check
    if (captchaInput !== captcha.code) {
      setErrorMsg("Invalid CAPTCHA ❌");
      return;
    }
  
    try {
      const res = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: Number(username),   // IMPORTANT: userId must be number
          password: password,
          deviceId: "web-browser"     // simple device id for demo
        })
      });
  
      const data = await res.json();
  
      console.log("LOGIN RESPONSE:", data);

      if (res.status !== 200) {
        setErrorMsg(data.error || "Login failed ❌");
        return;
      }

      if (!data.token || !data.user) {
        setErrorMsg("Invalid server response ❌");
        return;
      }
  
      // ✅ SAVE TOKEN + USER
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
  
      // ✅ CALL APP LOGIN
      onLogin(data.user);
  
    } catch (err) {
      console.error(err);
      setErrorMsg("Server error ❌");
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