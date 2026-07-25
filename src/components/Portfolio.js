import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RiskInterceptModal from '../components/RiskInterceptModal';
import Toast from './Toast';
import './Portfolio.css';



const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const DICT = {
  en: {
    title: "Portfolio Strategy",
    desc: "Your twin portfolio is optimized for institutional growth with a calculated risk profile.",
    export: "Export Ledger",
    rebalance: "Execute Rebalance",
    core_holdings: "Core Holdings",
    filter_placeholder: "Filter funds...",
    review_adj: "Review Adjustment",
    curr_alloc: "CURRENT ALLOCATION",
    target_alloc: "TARGET",
    inst_title: "Institutional Oversight for Individual Wealth",
    inst_desc: "We leverage the same AI-driven liquidity analysis tools used by tier-one investment banks to protect your capital."
  },
  hi: {
    title: "पोर्टफोलियो रणनीति",
    desc: "आपका ट्विन पोर्टफोलियो एक परिकलित जोखिम प्रोफाइल के साथ संस्थागत विकास के लिए अनुकूलित है।",
    export: "बहीखाता निर्यात करें",
    rebalance: "संतुलन निष्पादित करें",
    core_holdings: "मुख्य होल्डिंग्स",
    filter_placeholder: "फंड छानें...",
    review_adj: "समीक्षा समायोजन",
    curr_alloc: "वर्तमान आवंटन",
    target_alloc: "लक्ष्य आवंटन",
    inst_title: "व्यक्तिगत धन के लिए संस्थागत निरीक्षण",
    inst_desc: "हम आपकी पूंजी की सुरक्षा के लिए टियर-वन निवेश बैंकों द्वारा उपयोग किए जाने वाले समान एआई-संचालित तरलता विश्लेषण टूल का लाभ उठाते हैं।"
  },
  ta: {
    title: "போர்ட்ஃபோலியோ உத்தி",
    desc: "உங்கள் இரட்டை போர்ட்ஃபோலியோ கணக்கிடப்பட்ட அபாய சுயவிவரத்துடன் நிறுவன வளர்ச்சிக்கு உகந்ததாக உள்ளது.",
    export: "பேரேட்டை ஏற்றுமதி செய்",
    rebalance: "மறுசீரமைப்பைச் செயல்படுத்து",
    core_holdings: "முக்கிய முதலீடுகள்",
    filter_placeholder: "நிதிகளை வடிகட்டு...",
    review_adj: "சரிசெய்தலை மதிப்பாய்வு செய்",
    curr_alloc: "தற்போதைய ஒதுக்கீடு",
    target_alloc: "இலக்கு ஒதுக்கீடு",
    inst_title: "தனிநபர் செல்வத்திற்கான நிறுவன மேற்பாவையை",
    inst_desc: "உங்கள் மூலதனத்தைப் பாதுகாக்க முதல் நிலை முதலீட்டு வங்கிகளால் பயன்படுத்தப்படும் அதே AI-உந்துதல் திரவத்தன்மை பகுப்பாய்வுக் கருவிகளை நாங்கள் பயன்படுத்துகிறோம்."
  },
  te: {
    title: "పోర్ట్‌ఫోలియో వ్యూహం",
    desc: "మీ జంట పోర్ట్‌ఫోలియో లెక్కించబడిన రిస్క్ ప్రొఫైల్‌తో సంస్థాగత వృద్ధికి అనుకూలంగా ఉంటుంది.",
    export: "లెడ్జర్‌ను ఎగుమతి చేయి",
    rebalance: "రీబ్యాలెన్స్‌ను అమలు చేయి",
    core_holdings: "కోర్ హోల్డింగ్స్",
    filter_placeholder: "ఫండ్లను వడపోయు...",
    review_adj: "సర్దుబాటును సమీక్షించు",
    curr_alloc: "ప్రస్తుత కేటాయింపు",
    target_alloc: "లક્ષ్య కేటాయింపు",
    inst_title: "వ్యక్తిగత సంపద కోసం సంస్థాగత పర్యవేక్షణ",
    inst_desc: "మీ మూಲధనాన్ని రక్షించడానికి టైర్-వన్ ఇన్వెస్ట్‌మెంట్ బ్యాంకులు ఉపయోగించే అదే AI-ఆధారిత లిక్విడిటీ విశ్లేషణ సాధనాలను మేము ఉపయోగిస్తాము."
  },
  bn: {
    title: "পোর্টফোলিও কৌশল",
    desc: "আপনার টুইন পোর্টফোলিও একটি গণনাকৃত ঝুঁকি প্রোফাইলের সাথে প্রাতিষ্ঠানিক বৃদ্ধির জন্য অপ্টিমাইজ করা হয়েছে।",
    export: "খতিয়ান রপ্তানি করুন",
    rebalance: "পুনঃভারসাম্য কার্যকর করুন",
    core_holdings: "মূল হোল্ডিংস",
    filter_placeholder: "তহবিল ফিল্টার করুন...",
    review_adj: "সমন্বয় পর্যালোচনা করুন",
    curr_alloc: "বর্তমান বরাদ্দ",
    target_alloc: "লক্ষ্য বরাদ্দ",
    inst_title: "ব্যক্তিগত সম্পদের জন্য প্রাতিষ্ঠানিক তদারকি",
    inst_desc: "আমরা আপনার মূলধন রক্ষা করতে টায়ার-ওয়ান ইনভেস্টমেন্ট ব্যাঙ্কগুলির দ্বারা ব্যবহৃত একই এআই-চালিত তারল্য বিশ্লেষণ সরঞ্জামগুলি ব্যবহার করি।"
  },
  mr: {
    title: "पोर्टफोलिओ रणनीती",
    desc: "तुमचा ट्विन पोर्टफोलिओ एका परिकलित जोखीम प्रोफाइलसह संस्थात्मक वाढीसाठी अनुकूल केला आहे।",
    export: "वहीखाते निर्यात करा",
    rebalance: "पुन्हा संतुलित करा",
    core_holdings: "मुख्य होल्डिंग्स",
    filter_placeholder: "फंड फिल्टर करा...",
    review_adj: "समायोजनाचे पुनरावलोकन करा",
    curr_alloc: "सध्याचे वाटप",
    target_alloc: "लक्ष्य वाटप",
    inst_title: "वैयक्तिक संपत्तीसाठी संस्थात्मक देखरेख",
    inst_desc: "आम्ही तुमच्या भांडवलाचे संरक्षण करण्यासाठी टियर-वन गुंतवणूक बँकांद्वारे वापरली जाणारी एआय-चालित तरलता विश्लेषण साधने वापरतो।"
  },
  kn: {
    title: "ಪೋರ್ಟ್‌ಫೋಲಿಯೋ ತಂತ್ರ",
    desc: "ನಿಮ್ಮ ಅವಳಿ ಪೋರ್ಟ್‌ಫೋಲಿಯೊವನ್ನು ಲೆಕ್ಕಹಾಕಿದ ಅಪಾಯದ ಪ್ರೊಫೈಲ್‌ನೊಂದಿಗೆ ಸಾಂಸ್ಥಿಕ ಬೆಳವಣಿಗೆಗೆ ಹೊಂದುವಂತೆ ಮಾಡಲಾಗಿದೆ.",
    export: "ಖಾತಾವಹಿಯನ್ನು ರಫ್ತು ಮಾಡಿ",
    rebalance: "ಮರುಸಮತೋಲನಗೊಳಿಸು",
    core_holdings: "ಪ್ರಮುಖ ಹೂಡಿಕೆಗಳು",
    filter_placeholder: "ನಿಧಿಗಳನ್ನು ಫಿಲ್ಟರ್ ಮಾಡಿ...",
    review_adj: "ಹೊಂದಾಣಿಕೆಯನ್ನು ಪರಿಶೀಲಿಸಿ",
    curr_alloc: "ಪ್ರಸ್ತುತ ಹಂಚಿಕೆ",
    target_alloc: "ಗುರಿ ಹಂಚಿಕೆ",
    inst_title: "ವೈಯಕ್ತಿಕ ಸಂಪತ್ತಿಗೆ ಸಾಂಸ್ಥಿಕ ಮೇಲ್ವಿಚಾರಣೆ",
    inst_desc: "ನಿಮ್ಮ ಬಂಡವಾಳವನ್ನು ರಕ್ಷಿಸಲು ಶ್ರೇಣಿ-ಒಂದು ಹೂಡಿಕೆ ಬ್ಯಾಂಕುಗಳು ಬಳಸುವ ಅದೇ AI-ಚಾಲಿತ ದ್ರವತೆ ವಿಲೇಷಣಾ ಸಾಧನಗಳನ್ನು ನಾವು ಬಳಸಿಕೊಳ್ಳುತ್ತೇವೆ."
  },
  gu: {
    title: "પોર્ટફોલિયો વ્યૂહરચના",
    desc: "તમારો ટ્વીન પોર્ટફોલિયો ગણતરી કરેલ જોખમ પ્રોફાઇલ સાથે સંસ્થાકીય વૃદ્ધિ માટે શ્રેષ્ઠ બનાવેલ છે.",
    export: "લેજર નિકાસ કરો",
    rebalance: "રીબેલેન્સ લાગુ કરો",
    core_holdings: "મુખ્ય હોલ્ડિંગ્સ",
    filter_placeholder: "ફંડ્સ ફિલ્ટર કરો...",
    review_adj: "સમાયોજનની સમીક્ષા કરો",
    curr_alloc: "વર્તમાન ફાળવણી",
    target_alloc: "લક્ષ્ય ફાળવણી",
    inst_title: "વ્યક્તિગત સંપત્તિ માટે સંस्थाકીય દેખરેખ",
    inst_desc: "અમે તમારી મૂડીનું રક્ષણ કરવા માટે ટાયર-વન ઇન્વેસ્ટમેન્ટ બેંકો દ્વારા ઉપયોગમાં લેવાતા સમાન એઆઇ-આધારિત લિક્વિડિટી વિશ્લેષણ સાધનોનો લાભ લઈએ છીએ."
  }
};

const Portfolio = ({ language = 'en' }) => {
  const getStr = (key) => DICT[language]?.[key] || DICT['en']?.[key] || key;
  const [notification, setNotification] = useState(null);
  // Keep these as fallback defaults
  const [chartData, setChartData] = useState([
    { month: 'JAN', height: '30%' },
    { month: 'FEB', height: '45%' },
    { month: 'MAR', height: '35%' },
    { month: 'APR', height: '55%' },
    { month: 'MAY', height: '50%' },
    { month: 'JUN', height: '70%' },
    { month: 'JUL', height: '85%' },
  ]);

  const [holdings, setHoldings] = useState([
    { id: 'GS', name: 'Global Sustain Equities', code: 'GSSE-882-LQ', type: 'Equity ESG', value: '₹842,000.00', return: '+18.2%', status: 'OPTIMIZED', statusClass: 'blue' },
    { id: 'TR', name: 'T.Rowe Price Growth', code: 'TRPG-612-BL', type: 'Growth Tech', value: '₹512,450.00', return: '+24.5%', status: 'OVERWEIGHT', statusClass: 'orange' },
    { id: 'VB', name: 'Vanguard Bond Mkt', code: 'VBMX-001-FI', type: 'Fixed Income', value: '₹320,100.00', return: '-2.1%', status: 'STABLE', statusClass: 'gray' },
    { id: 'PL', name: 'Private Liquidity Pool', code: 'LP-ALPH-99', type: 'Alternative', value: '₹808,350.00', return: '+9.4%', status: 'OPTIMIZED', statusClass: 'blue' },
  ]);

  const [totalAssets, setTotalAssets] = useState('₹24,482,900.00');
  const [loading, setLoading] = useState(true);

  // Risk modal state
  const [riskModal, setRiskModal] = useState({
    isOpen: false, decision: null, riskScore: 0, message: ""
  });
  const [pendingAction, setPendingAction] = useState(null);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API_BASE}/api/portfolio/1/history`)
      .then(res => {
        if (res.data?.chartData) setChartData(res.data.chartData);
        if (res.data?.holdings) setHoldings(res.data.holdings);
        if (res.data?.totalAssets) setTotalAssets(res.data.totalAssets);
      })
      .catch(() => {
        // fallback data already in state, do nothing
      })
      .finally(() => setLoading(false));
  }, []);

  const securityGate = async (actionToRun, metadata) => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      if (u.nominee?.isEmergencyHeir) {
        setNotification({ message: "Access Denied: Nominee emergency view mode is active. Portfolio actions are restricted.", type: "error" });
        return;
      }
    }
    try {
      const res = await axios.post(`${API_BASE}/api/action/execute`, metadata);
      setPendingAction(() => actionToRun);
      setRiskModal({
        isOpen: true,
        decision: res.data.decision,
        riskScore: res.data.riskScore,
        message: res.data.message
      });
    } catch {
      setRiskModal({
        isOpen: true,
        decision: 'BLOCK',
        message: "Security protocols offline. Wealth actions restricted."
      });
    }
  };

  return (
    <div className="main-content">
      {/* Header Section */}
      <header className="page-header-alt">
        <div className="title-block">
          
          <h1>{getStr('title')}</h1>
          <p className="subtext">{getStr('desc')}</p>
        </div>
        <div className="header-actions">
          <button
  className="btn-secondary"
  onClick={() => securityGate(
    () => setNotification({ message: "Ledger exported!", type: "success" }),
    { actionType: 'EXPORT', amount: 0 }
  )}
>
  {getStr('export')}
</button>

          <button
  className="btn-primary"
  onClick={() => securityGate(
    () => setNotification({ message: "Rebalance executed!", type: "success" }),
    { actionType: 'REBALANCE', amount: 248290 }
  )}
>
  <span className="icon">⇄</span> {getStr('rebalance')}
</button>
        </div>
      </header>

      {/* Top Grid: Assets & Rebalancing */}
      <div className="dashboard-grid-alt">
        <div className="content-card asset-main-card">
          <div className="card-top">
            <div>
              <span className="kpi-label">TOTAL ASSETS UNDER MANAGEMENT</span>
              <h2 className="huge-amount">{totalAssets}</h2>
            </div>
            <span className="badge-growth">+12.4%</span>
          </div>
          
          <div className="chart-wrapper">
            <div className="bar-chart-grid">
              {chartData.map((item, i) => (
                <div key={i} className="bar-column">
                  <div className="bar-fill" style={{ height: item.height }}></div>
                  <span className="bar-label">{item.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="content-card rebalance-card">
          <div className="rebalance-header">
            <span className="warn-icon">⚠️</span>
            <span className="warn-title">REBALANCING SUGGESTION</span>
          </div>
          <p className="warn-text">
            Your exposure to <strong>Emerging Markets Tech</strong> has drifted 8.4% above target threshold.
          </p>
          <div className="allocation-stats">
            <div className="stat-split">
              <span>{getStr('curr_alloc')}</span>
              <span>{getStr('target_alloc')}</span>
            </div>
            <div className="allocation-bar-container">
              <div className="bar-current" style={{ width: '75%' }}></div>
              <div className="bar-target-marker" style={{ left: '60%' }}></div>
            </div>
            <div className="stat-values">
              <strong>38.4%</strong>
              <strong>30.0%</strong>
            </div>
          </div>
          <button
  className="btn-orange"
  onClick={() => securityGate(
    () => setNotification({ message: "Rebalancing adjustment applied!", type: "success" }),
    { actionType: 'REBALANCE', amount: 84000 }
  )}
>
  {getStr('review_adj')}
</button>
        </div>
      </div>

      {/* Core Holdings Table */}
      <div className="content-card table-card">
        <div className="card-header-flex">
          <h3>{getStr('core_holdings')}</h3>
          <div className="search-box">
            <input type="text" placeholder={getStr('filter_placeholder')} />
          </div>
        </div>
        
        <div className="table-container">
          <div className="table-header-row">
            <span>FUND</span>
            <span>TYPE</span>
            <span>VALUE</span>
            <span>RETURN</span>
            <span>STATUS</span>
          </div>
          {holdings.map((item) => (
            <div key={item.id} className="table-data-row">
              <div className="fund-cell">
                <div className={`fund-icon icon-${item.id}`}>{item.id}</div>
                <div>
                  <div className="row-title">{item.name}</div>
                  <div className="row-sub">{item.code}</div>
                </div>
              </div>
              <div className="type-cell">{item.type}</div>
              <div className="val-cell"><strong>{item.value}</strong></div>
              <div className={`return-cell ${item.return.startsWith('-') ? 'red' : 'green'}`}>
                {item.return}
              </div>
              <div className="status-cell">
                <span className={`status-badge ${item.statusClass}`}>{item.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Banner */}
      <div className="institutional-banner">
        <div className="banner-content">
          <h2>{getStr('inst_title')}</h2>
          <p>{getStr('inst_desc')}</p>
          <a href="#report" className="text-link">Read Intelligence Report →</a>
        </div>
      </div>
      
      {notification && (
        <Toast 
          message={notification.message} 
          type={notification.type} 
          onDone={() => setNotification(null)} 
        />
      )}
      
      <RiskInterceptModal
        isOpen={riskModal.isOpen}
        decision={riskModal.decision}
        riskScore={riskModal.riskScore}
        message={riskModal.message}
        onCancel={() => {
          setRiskModal({ ...riskModal, isOpen: false });
          setPendingAction(null);
        }}
        onAllow={() => {
          if (pendingAction) pendingAction();
          setRiskModal({ ...riskModal, isOpen: false });
          setPendingAction(null);
        }}
      />
    </div>
  );
};

export default Portfolio;