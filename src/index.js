import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// CSS's `dvh` unit (used to keep full-height layouts sized correctly when the
// on-screen keyboard opens) isn't supported on older Android WebViews — it's
// silently ignored there, leaving the old broken `vh` behavior in place. This
// sets an actual pixel-based --vh custom property instead, which works on
// every WebView version. Used as calc(var(--vh, 1vh) * 100) etc. in CSS.
function setViewportHeightVar() {
  document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
}
setViewportHeightVar();
window.addEventListener('resize', setViewportHeightVar);
window.visualViewport?.addEventListener('resize', setViewportHeightVar);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
