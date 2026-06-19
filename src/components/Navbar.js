import React, { useState } from "react";
import "./Navbar.css";
import {
  LayoutDashboard,
  Target,
  Landmark,
  PieChart as PieIcon,
  AlertTriangle,
  Globe,
  ChevronDown,
} from "lucide-react";
import { LANGUAGES } from "../utils/languageStrings";

export default function Navbar({ page, setPage, language, onLanguageChange }) {
  const [langOpen, setLangOpen] = useState(false);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { id: "goals", label: "Goals", icon: <Target size={20} /> },
    { id: "networth", label: "Net Worth", icon: <Landmark size={20} /> },
    { id: "portfolio", label: "Portfolio", icon: <PieIcon size={20} /> },
    { id: "alerts", label: "Alerts & Risk", icon: <AlertTriangle size={20} /> },
  ];

  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2>SecureWealth Twin</h2>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-group">
          {navItems.map((item) => (
            <div
              key={item.id}
              className={`nav-item ${page === item.id ? "active" : ""}`}
              onClick={() => setPage(item.id)}
            >
              {item.icon}
              {item.label}
            </div>
          ))}
        </div>
      </nav>

      {/* Language Selector */}
      <div className="lang-selector-wrap">
        <button
          className="lang-selector-btn"
          onClick={() => setLangOpen((o) => !o)}
        >
          <Globe size={15} />
          <span className="lang-flag">{currentLang.flag}</span>
          <span className="lang-label">{currentLang.label}</span>
          <ChevronDown size={13} className={`lang-chevron ${langOpen ? "open" : ""}`} />
        </button>

        {langOpen && (
          <div className="lang-dropdown">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                className={`lang-option ${l.code === language ? "active" : ""}`}
                onClick={() => {
                  onLanguageChange(l.code);
                  localStorage.setItem("preferred_language", l.code);
                  setLangOpen(false);
                }}
              >
                <span>{l.flag}</span>
                <span>{l.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mobile bottom nav */}
      <nav className="mobile-bottom-nav">
        {navItems.map((item) => (
          <div
            key={item.id}
            className={`mobile-nav-item ${page === item.id ? "active" : ""}`}
            onClick={() => setPage(item.id)}
          >
            {item.icon}
            <span className="mobile-nav-label">{item.label}</span>
          </div>
        ))}
      </nav>
    </aside>
  );
}
