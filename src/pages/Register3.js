import React from 'react';
import './Register3.css';
import { 
  Landmark, Coins, TrendingUp, Car, Home, 
  Info, ShieldCheck, Plus, Trash2, ChevronLeft, 
  ArrowRight, Briefcase, GraduationCap, Calculator
} from 'lucide-react';

const Register3 = ({onComplete}) => {
  return (
    <div className="onboarding-container">
      
      {/* SECTION 1: ASSET DECLARATION */}
      <section className="registration-section">
        <div className="section-header">
          <h1 className="section-title">Asset Declaration</h1>
          <p className="section-desc">
            Please provide a comprehensive list of your current holdings. This information ensures we tailor our risk assessment and investment strategies to your existing net worth.
          </p>
        </div>

        <div className="asset-grid">
          {/* Bank Balance Card */}
          <div className="asset-card">
            <div className="asset-card-header">
              <div className="asset-icon bank"><Landmark size={20} /></div>
              <div className="header-text">
                <h3>Bank Balance</h3>
                <span>Savings and checking accounts</span>
              </div>
              <button className="add-link"><Plus size={14} /> Add Account</button>
            </div>
            <div className="asset-form-row">
              <div className="input-box">
                <label>INSTITUTION NAME</label>
                <input type="text" placeholder="e.g. HDFC Bank" />
              </div>
              <div className="input-box">
                <label>CURRENT BALANCE</label>
                <div className="currency-input">
                  <span>₹</span>
                  <input type="text" placeholder="0.00" />
                </div>
              </div>
            </div>
          </div>

          {/* Gold Card - Empty State */}
          <div className="asset-card">
            <div className="asset-card-header">
              <div className="asset-icon gold"><Coins size={20} /></div>
              <div className="header-text">
                <h3>Gold & Bullion</h3>
                <span>Precious metals</span>
              </div>
              <button className="add-link"><Plus size={14} /> Add</button>
            </div>
            <div className="empty-dashed-box">
              No gold assets listed yet.
            </div>
          </div>

          {/* Investments Card */}
          <div className="asset-card">
            <div className="asset-card-header">
              <div className="asset-icon invest"><TrendingUp size={20} /></div>
              <div className="header-text">
                <h3>Investments</h3>
                <span>Stocks, bonds, and mutual funds</span>
              </div>
              <button className="add-link"><Plus size={14} /> Add Investment</button>
            </div>
            <div className="asset-form-row">
              <div className="input-box">
                <label>INVESTMENT TYPE</label>
                <select>
                  <option>Public Equity (Stocks)</option>
                  <option>Mutual Funds</option>
                </select>
              </div>
              <div className="input-box">
                <label>MARKET VALUE</label>
                <div className="currency-input">
                  <span>₹</span>
                  <input type="text" placeholder="0.00" />
                </div>
              </div>
            </div>
          </div>

          {/* Vehicles Card - Filled State */}
          <div className="asset-card">
            <div className="asset-card-header">
              <div className="asset-icon vehicle"><Car size={20} /></div>
              <div className="header-text">
                <h3>Vehicles</h3>
                <span>Automobiles and luxury transport</span>
              </div>
              <button className="add-link"><Plus size={14} /> Add</button>
            </div>
            <div className="filled-asset-item">
              <div>
                <strong>Model X Plaid</strong>
                <p>Estimated Value: ₹8,50,000</p>
              </div>
              <button className="delete-btn"><Trash2 size={16} /></button>
            </div>
          </div>

          {/* Property Card */}
          <div className="asset-card">
            <div className="asset-card-header">
              <div className="asset-icon property"><Home size={20} /></div>
              <div className="header-text">
                <h3>Property</h3>
                <span>Real estate and land assets</span>
              </div>
              <button className="add-link"><Plus size={14} /> Add Property</button>
            </div>
            <div className="property-form">
              <div className="input-box full">
                <label>ADDRESS / IDENTIFIER</label>
                <input type="text" placeholder="Full street address or plot number" />
              </div>
              <div className="asset-form-row">
                <div className="input-box">
                  <label>ESTIMATED VALUE</label>
                  <div className="currency-input"><span>₹</span><input type="text" placeholder="0.00" /></div>
                </div>
                <div className="input-box">
                  <label>OWNERSHIP %</label>
                  <input type="text" placeholder="100" />
                </div>
              </div>
            </div>
          </div>

          {/* Safety Banner Card */}
          
        </div>
      </section>

      {/* SECTION 2: FINANCIAL COMMITMENTS (LIABILITIES) */}
      <section className="registration-section bg-wash">
        <div className="section-header">
          <h1 className="section-title">Tell us about your <span className="teal-text">financial commitments.</span></h1>
          <p className="section-desc">To build a comprehensive wealth strategy, we need to understand your current debts. This ensures our recommendations are balanced against your obligations.</p>
        </div>

        <div className="liability-container">
          <div className="liability-main">
            <div className="liability-form-card">
              <div className="asset-card-header">
                <h3>Existing Liabilities</h3>
                <button className="add-link"><Plus size={14} /> Add Another Loan</button>
              </div>
              <div className="asset-form-row">
                <div className="input-box">
                  <label>LOAN TYPE</label>
                  <select><option>Home Loan</option></select>
                </div>
                <div className="input-box">
                  <label>LENDER NAME</label>
                  <input type="text" placeholder="e.g. SBI Home Loans" />
                </div>
              </div>
              <div className="asset-form-row">
                <div className="input-box">
                  <label>OUTSTANDING AMOUNT</label>
                  <div className="currency-input"><span>₹</span><input type="text" placeholder="0.00" /></div>
                </div>
                <div className="input-box">
                  <label>INTEREST RATE (P.A.)</label>
                  <div className="percent-input"><input type="text" placeholder="4.5" /><span>%</span></div>
                </div>
              </div>
            </div>
            
            <div className="add-dashed-card">
              <div className="plus-circle"><Plus size={20} /></div>
              <strong>Add another liability</strong>
              <p>Include credit cards, car loans, or overdrafts</p>
            </div>
          </div>

          <aside className="liability-sidebar">
            <div className="info-callout">
              <div className="info-header"><Info size={16} /> Why disclose liabilities?</div>
              <p>Your net worth is Assets minus Liabilities. Knowing your debt structures allows us to prioritize debt reduction.</p>
              <div className="encrypted-tag"><ShieldCheck size={14} /> ENCRYPTED & PRIVATE</div>
            </div>

            <div className="analysis-card">
              <span className="label-sm">REAL-TIME ANALYSIS</span>
              <div className="dti-row">
                <div>
                  <p>ESTIMATED DEBT-TO-INCOME</p>
                  <h2>12.4%</h2>
                </div>
                <span className="status-pill-green">HEALTHY</span>
              </div>
              <div className="progress-bar-bg"><div className="progress-fill" style={{width: '12.4%'}}></div></div>
              <div className="analysis-stats">
                <div className="stat-box">
                  <span>TOTAL LIABILITIES</span>
                  <strong>₹42,50,000</strong>
                </div>
                <div className="stat-box">
                  <span>AVG. INTEREST</span>
                  <strong>3.8%</strong>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* SECTION 3: FINANCIAL GOALS */}
      <section className="registration-section">
        <div className="section-header">
          <h1 className="section-title">Define Your <span className="teal-text">Financial Goals.</span></h1>
          <p className="section-desc">Personalize your investment strategy by sharing your long-term aspirations. We'll use these to curate assets that align with your timeline.</p>
        </div>

        <div className="goals-grid">
          {[
            { icon: <Home size={20}/>, title: "Home Purchase", desc: "Savings for your future residence or real estate investment." },
            { icon: <Briefcase size={20}/>, title: "Retirement", desc: "Ensuring financial freedom and comfort for your later years." },
            { icon: <GraduationCap size={20}/>, title: "Child Education", desc: "Strategic savings for university tuition and future costs." }
          ].map((goal, i) => (
            <div key={i} className="goal-card">
              <div className="goal-icon-box">{goal.icon}</div>
              <h3>{goal.title}</h3>
              <p>{goal.desc}</p>
              <div className="input-box">
                <label>TARGET AMOUNT</label>
                <div className="currency-input-white"><span>₹</span><input type="text" placeholder="250,000" /></div>
              </div>
              <div className="input-box">
                <label>TARGET DATE</label>
                <input type="text" placeholder="----------, ----" className="date-display" />
              </div>
            </div>
          ))}
        </div>

        <div className="goals-footer">
          <div className="custom-goal-btn">
            <div className="plus-btn-sm"><Plus size={16}/></div>
            <div>
              <strong>Add custom goal</strong>
              
            </div>
          </div>
          <div className="footer-actions">
            <button className="btn-text">Skip for now</button>
            <button className="btn-primary-teal" onClick={onComplete}>Complete Profile</button>
          </div>
        </div>

        {/* Investment Calculator Footer */}
        
      </section>

      
    </div>
  );
};

export default Register3;