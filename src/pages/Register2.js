import React, { useState } from 'react';
import './Register2.css';
import { 
  ChevronLeft, 
  ArrowRight, 
  Landmark, 
  UserCircle, 
  ShieldCheck 
} from 'lucide-react';

const Registration2 = ({onNext}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    dob: '',
    mobile: '',
    email: ''
  });

  return (
    <div className="register-page">
      {/* Multi-step Progress Header (Same as Page 1) */}
      <div className="onboarding-steps">
        <div className="step completed">
          <div className="step-icon-box">
            <Landmark size={20} />
          </div>
          <span className="step-label">VERIFICATION</span>
        </div>
        
        <div className="step-divider active"></div>

        <div className="step active">
          <div className="step-icon-box">
            <UserCircle size={20} />
          </div>
          <span className="step-label">DETAILS</span>
        </div>

        <div className="step-divider"></div>

        <div className="step disabled">
          <div className="step-icon-box">
            <ShieldCheck size={20} />
          </div>
          <span className="step-label">FINANCIAL DETAILS</span>
        </div>
      </div>

      {/* Identity Information Card */}
      <div className="identity-card">
        <h1 className="auth-title">Identity Information</h1>
        <p className="auth-subtitle">
          Please provide your legal details as they appear on your tax documents.
        </p>

        <form className="identity-form">
          <div className="form-group full-width">
            <label className="input-label">FULL NAME (AS PER PAN)</label>
            <input 
              type="text" 
              placeholder="e.g. ALEXANDER HAMILTON" 
              className="styled-input"
            />
          </div>

          <div className="form-row">
            <div className="form-group half-width">
              <label className="input-label">DATE OF BIRTH</label>
              <input 
                type="date" 
                className="styled-input date-input"
              />
            </div>

            <div className="form-group half-width">
              <label className="input-label">MOBILE NUMBER</label>
              <div className="mobile-wrapper">
                <span className="country-code">+91</span>
                <input 
                  type="tel" 
                  placeholder="98765 43210" 
                  className="styled-input mobile-input"
                />
              </div>
            </div>
          </div>

          <div className="form-group full-width">
            <label className="input-label">EMAIL ADDRESS</label>
            <input 
              type="email" 
              placeholder="alexander@institutional.com" 
              className="styled-input"
            />
          </div>

          <div className="form-footer">
            
            <button type="button" className="btn-continue-teal" onClick={onNext}>
              Continue <ArrowRight size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Registration2;