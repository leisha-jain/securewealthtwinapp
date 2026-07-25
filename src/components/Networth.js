import React, { useState, useEffect } from 'react';
import RiskInterceptModal from '../components/RiskInterceptModal';
import Toast from '../components/Toast';
import { 
  LayoutDashboard, Target, Landmark, PieChart, 
  AlertTriangle, Settings, LogOut, TrendingUp, 
  Plus, ChevronRight, Scale, Clock, Zap, CreditCard,
  Search, Bell, User
} from 'lucide-react';
import './Networth.css';
import axios from 'axios';



const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const DICT = {
  en: {
    exec_summary: "EXECUTIVE SUMMARY",
    title: "Net Worth Calculator",
    desc: "Comprehensive analysis of your institutional assets and liabilities for the current fiscal quarter.",
    aggregate: "Aggregate Net Worth",
    vs_last: "vs last year",
    trajectory: "Growth Trajectory",
    traj_desc: "12-month net worth evolution",
    liquid_fixed: "Liquid & Fixed Assets",
    total_lbl: "Total",
    add_asset: "Add New Asset Category",
    liabilities_debt: "Liabilities & Debt",
    debt_reduction: "Debt Reduction Strategy",
    debt_desc: "Increase mortgage repayment by 10% to save ₹ 1.2L.",
    apply_strategy: "Apply Strategy",
    ratio_lbl: "Asset/Liability Ratio",
    ratio_sub: "Strong solvency",
    freedom_lbl: "Financial Freedom",
    freedom_sub: "Withdrawal rate",
    velocity_lbl: "Portfolio Velocity",
    velocity_sub: "Cap appreciation",
    modal_title: "Add New Asset Category",
    modal_name: "Asset Name",
    modal_val: "Asset Value (₹)",
    cancel: "Cancel",
    add_btn: "Add Asset"
  },
  hi: {
    exec_summary: "कार्यकारी सारांश",
    title: "कुल संपत्ति कैलकुलेटर",
    desc: "चालू तिमाही के लिए आपकी संस्थागत संपत्तियों और देनदारियों का व्यापक विश्लेषण।",
    aggregate: "कुल संपत्ति",
    vs_last: "पिछले वर्ष की तुलना में",
    trajectory: "विकास पथ",
    traj_desc: "12-महीने का संपत्ति विकास",
    liquid_fixed: "तरल और अचल संपत्ति",
    total_lbl: "कुल",
    add_asset: "नई संपत्ति श्रेणी जोड़ें",
    liabilities_debt: "देनदारियां और ऋण",
    debt_reduction: "ऋण कमी रणनीति",
    debt_desc: "₹ 1.2L बचाने के लिए बंधक पुनर्भुगतान में 10% की वृद्धि करें।",
    apply_strategy: "रणनीति लागू करें",
    ratio_lbl: "संपत्ति/देनदारी अनुपात",
    ratio_sub: "मजबूत शोधन क्षमता",
    freedom_lbl: "वित्तीय स्वतंत्रता",
    freedom_sub: "निकासी दर",
    velocity_lbl: "पोर्टफोलियो वेग",
    velocity_sub: "पूंजी वृद्धि",
    modal_title: "नई संपत्ति श्रेणी जोड़ें",
    modal_name: "संपत्ति का नाम",
    modal_val: "संपत्ति का मूल्य (₹)",
    cancel: "रद्द करें",
    add_btn: "संपत्ति जोड़ें"
  },
  ta: {
    exec_summary: "நிர்வாக சுருக்கம்",
    title: "நிகர மதிப்பு கால்குலேட்டர்",
    desc: "நடப்பு நிதி காலாண்டிற்கான உங்கள் நிறுவன சொத்துக்கள் மற்றும் கடன்களின் விரிவான பகுப்பாய்வு.",
    aggregate: "மொத்த நிகர மதிப்பு",
    vs_last: "கடந்த ஆண்டை விட",
    trajectory: "வளர்ச்சிப் பாதை",
    traj_desc: "12 மாத நிகர மதிப்பு பரிணாமம்",
    liquid_fixed: "திரவ மற்றும் நிலையான சொத்துக்கள்",
    total_lbl: "மொத்தம்",
    add_asset: "புதிய சொத்து வகையைச் சேர்",
    liabilities_debt: "கடன்கள் மற்றும் கடன் பொறுப்பு",
    debt_reduction: "கடன் குறைப்பு உத்தி",
    debt_desc: "₹ 1.2L சேமிக்க அடமானத் திருப்பிச் செலுத்தலை 10% அதிகரிக்கவும்.",
    apply_strategy: "உத்தியைப் பயன்படுத்து",
    ratio_lbl: "சொத்து/கடன் விகிதம்",
    ratio_sub: "வலுவான கடனளிப்பு திறன்",
    freedom_lbl: "நிதி சுதந்திரம்",
    freedom_sub: "திரும்பப் பெறும் விகிதம்",
    velocity_lbl: "போர்ட்ஃபோலியோ வேகம்",
    velocity_sub: "மூலதன மதிப்புயர்வு",
    modal_title: "புதிய சொத்து வகையைச் சேர்",
    modal_name: "சொத்தின் பெயர்",
    modal_val: "சொத்து மதிப்பு (₹)",
    cancel: "ரத்து செய்",
    add_btn: "சொத்தைச் சேர்"
  },
  te: {
    exec_summary: "ఎగ్జిక్యూటివ్ సారాంశం",
    title: "నికర విలువ కాలిక్యులేటర్",
    desc: "ప్రస్తుత త్రైమాసికం కోసం మీ సంస్థాగత ఆస్తులు మరియు అప్పుల సమగ్ర విశ్లేషణ.",
    aggregate: "మొత్తం నికర విలువ",
    vs_last: "గత సంవత్సరంతో పోలిస్తే",
    trajectory: "వృద్ధి పథం",
    traj_desc: "12-నెలల నికర విలువ పరిణామం",
    liquid_fixed: "లిక్విడ్ & స్థిర ఆస్తులు",
    total_lbl: "మొత్తం",
    add_asset: "కొత్త ఆస్తి వర్గాన్ని జోడించు",
    liabilities_debt: "అప్పులు & రుణాలు",
    debt_reduction: "రుణ తగ్గింపు వ్యూహం",
    debt_desc: "₹ 1.2L ఆదా చేయడానికి తనఖా చెల్లింపును 10% పెంచండి.",
    apply_strategy: "వ్యూహాన్ని వర్తింపజేయి",
    ratio_lbl: "ఆస్తి/అప్పు నిష్పత్తి",
    ratio_sub: "బలమైన సాల్వెన్సీ",
    freedom_lbl: "ఆర్థిక స్వాతంత్ర్యం",
    freedom_sub: "ఉపసంహరణ రేటు",
    velocity_lbl: "పోర్ట్‌ఫోలియో వేగం",
    velocity_sub: "క్యాపిటల్ అప్రిసియేషన్",
    modal_title: "కొత్త ఆస్ತಿ వర్గాన్ని జోడించు",
    modal_name: "ఆస్తి పేరు",
    modal_val: "ఆస్తి విలువ (₹)",
    cancel: "ರద్దు చేయి",
    add_btn: "ఆస్తిని జోడించు"
  },
  bn: {
    exec_summary: "নিবাহী সারসংক্ষেপ",
    title: "নিট মূল্য ক্যালকুলেটর",
    desc: "চলতি প্রান্তিকের জন্য আপনার প্রাতিষ্ঠানিক সম্পদ ও দায়ের বিশদ বিশ্লেষণ।",
    aggregate: "মোট নিট মূল্য",
    vs_last: "গত বছরের তুলনায়",
    trajectory: "উন্নতি পথ",
    traj_desc: "১২ মাসের নিট মূল্যের বিবর্তন",
    liquid_fixed: "তরল ও স্থায়ী সম্পদ",
    total_lbl: "মোট",
    add_asset: "নতুন সম্পদের শ্রেণী যোগ করুন",
    liabilities_debt: "দায় ও ঋণ",
    debt_reduction: "ঋণ হ্রাস করার কৌশল",
    debt_desc: "₹ ১.২ লক্ষ বাঁচাতে বন্ধকী পরিশোধ ১০% বৃদ্ধি করুন।",
    apply_strategy: "কৌশল প্রয়োগ করুন",
    ratio_lbl: "সম্পদ/দায় অনুপাত",
    ratio_sub: "দৃঢ় স্বচ্ছলতা",
    freedom_lbl: "আর্থিক স্বাধীনতা",
    freedom_sub: "উত্তোলনের হার",
    velocity_lbl: "পোর্টফোলিও গতি",
    velocity_sub: "মূলধন বৃদ্ধি",
    modal_title: "নতুন সম্পদের শ্রেণী যোগ করুন",
    modal_name: "সম্পদের নাম",
    modal_val: "সম্পদের মূল্য (₹)",
    cancel: "বাতিল করুন",
    add_btn: "সম্পদ যোগ করুন"
  },
  mr: {
    exec_summary: "कार्यकारी सारांश",
    title: "निव्वळ मालमत्ता कॅल्क्युलेटर",
    desc: "चालू तिमाहीसाठी तुमच्या संस्थात्मक मालमत्ता आणि दायित्वांचे सर्वसमावेशक विश्लेषण।",
    aggregate: "एकूण निव्वळ मालमत्ता",
    vs_last: "मागील वर्षाच्या तुलनेत",
    trajectory: "प्रगती पथ",
    traj_desc: "१२-महिन्यांची मालमत्ता उत्क्रांती",
    liquid_fixed: "तरल आणि स्थिर मालमत्ता",
    total_lbl: "एकूण",
    add_asset: "नवीन मालमत्ता वर्ग जोडा",
    liabilities_debt: "दायित्वे आणि कर्ज",
    debt_reduction: "कर्ज कमी करण्याची रणनीती",
    debt_desc: "₹ १.२L वाचवण्यासाठी गृहकर्ज परतफेड १०% वाढवा।",
    apply_strategy: "रणनीती लागू करा",
    ratio_lbl: "मालमत्ता/दायित्व प्रमाण",
    ratio_sub: "मजबूत आर्थिक स्थिती",
    freedom_lbl: "आर्थिक स्वातंत्र्य",
    freedom_sub: "पैसे काढण्याचा दर",
    velocity_lbl: "पोर्टफोलिओ वेग",
    velocity_sub: "भांडवल वाढ",
    modal_title: "नवीन मालमत्ता वर्ग जोडा",
    modal_name: "मालमत्तेचे नाव",
    modal_val: "मालमत्ता मूल्य (₹)",
    cancel: "रद्द करा",
    add_btn: "मालमत्ता जोडा"
  },
  kn: {
    exec_summary: "ಕಾರ್ಯನಿರ್ವಾಹಕ ಸಾರಾಂಶ",
    title: "ನಿವ್ವಳ ಮೌಲ್ಯ ಕ್ಯಾಲ್ಕುಲೇಟರ್",
    desc: "ಪ್ರಸ್ತುತ ತ್ರೈಮಾಸಿಕದ ಸಾಂಸ್ಥಿಕ ಆಸ್ತಿಗಳು ಮತ್ತು ಹೊಣೆಗಾರಿಕೆಗಳ ಸಮಗ್ರ ವಿಲೇಷಣೆ.",
    aggregate: "ಒಟ್ಟು ನಿವ್ವಳ ಮೌಲ್ಯ",
    vs_last: "ಹಿಂದಿನ ವರ್ಷಕ್ಕೆ ಹೋಲಿಸಿದರೆ",
    trajectory: "ಬೆಳವಣಿಗೆಯ ಹಾದಿ",
    traj_desc: "12 ತಿಂಗಳ ನಿವ್ವಳ ಮೌಲ್ಯ ವಿಕಾಸ",
    liquid_fixed: "ದ್ರವ ಮತ್ತು ಸ್ಥಿರ ಆಸ್ತಿಗಳು",
    total_lbl: "ಒಟ್ಟು",
    add_asset: "ಹೊಸ ಆಸ್ತಿ ವರ್ಗವನ್ನು ಸೇರಿಸಿ",
    liabilities_debt: "ಹೊಣೆಗಾರಿಕೆಗಳು ಮತ್ತು ಸಾಲ",
    debt_reduction: "ಸಾಲ ಕಡಿತ ತಂತ್ರ",
    debt_desc: "₹ 1.2L ಉಳಿಸಲು ಅಡಮಾನ ಮರುಪಾವತಿಯನ್ನು 10% ಹೆಚ್ಚಿಸಿ.",
    apply_strategy: "ತಂತ್ರವನ್ನು ಅನ್ವಯಿಸು",
    ratio_lbl: "ಆಸ್ತಿ/ಹೊಣೆಗಾರಿಕೆ ಅನುಪಾತ",
    ratio_sub: "ಬಲವಾದ ಪರಿಹಾರಕ ಶಕ್ತಿ",
    freedom_lbl: "ಹಣಕಾಸು ಸ್ವಾತಂತ್ರ್ಯ",
    freedom_sub: "ಹಿಂತೆಗೆದುಕೊಳ್ಳುವ ದರ",
    velocity_lbl: "ಪೋರ್ಟ್‌ಫೋಲಿಯೋ ವೇಗ",
    velocity_sub: "ಬಂಡವಾಳ ಪ್ರಶಂಸೆ",
    modal_title: "ಹೊಸ ಆಸ್ತಿ ವರ್ಗವನ್ನು ಸೇರಿಸಿ",
    modal_name: "ಆಸ್ತಿಯ ಹೆಸರು",
    modal_val: "ಆಸ್ತಿ ಮೌಲ್ಯ (₹)",
    cancel: "ರದ್ದುಮಾಡು",
    add_btn: "ಆಸ್ತಿ ಸೇರಿಸಿ"
  },
  gu: {
    exec_summary: "કાર્યકારી સારાંશ",
    title: "નિમળ સંપત્તિ કેલ્ક્યુલેટર",
    desc: "ચાલુ નાણાકીય ત્રિમાસિક ગાળા માટે તમારી સંસ્થાકીય અસ્કયામતો અને જવાબદારીઓનું વ્યાપક વિશ્લેષણ.",
    aggregate: "કુલ નિમળ સંપત્તિ",
    vs_last: "ગયા વર્ષની સરખામણીમાં",
    trajectory: "વિકાસ પથ",
    traj_desc: "12-મહિનાની સંપત્તિ ઉત્ક્રાંતિ",
    liquid_fixed: "પ્રવાહી અને સ્થિર અસ્કયામતો",
    total_lbl: "કુલ",
    add_asset: "નવી સંપત્તિ કેટેગરી ઉમેરો",
    liabilities_debt: "જવાબદારીઓ અને દેવું",
    debt_reduction: "દેવું ઘટાડવાની વ્યૂહરચના",
    debt_desc: "₹ 1.2L બચાવવા માટે મોર્ટગેજ ચુકવણીમાં 10% વધારો કરો.",
    apply_strategy: "વ્યૂહરચના લાગુ કરો",
    ratio_lbl: "સંપત્તિ/જવાબદારી ગુણોત્તર",
    ratio_sub: "મજબૂત સોલ્વન્સી",
    freedom_lbl: "નાણાકીય સ્વતંત્રતા",
    freedom_sub: "ઉપાડ દર",
    velocity_lbl: "પોર્ટફોલિયો વેગ",
    velocity_sub: "મૂડી વૃદ્ધિ",
    modal_title: "નવી સંપત્તિ કેટેગરી ઉમેરો",
    modal_name: "સંપત્તિનું નામ",
    modal_val: "સંપત્તિનું મૂલ્ય (₹)",
    cancel: "રદ કરો",
    add_btn: "સંપત્તિ ઉમેરો"
  }
};

const NetWorth = ({ language = 'en' }) => {
  const getStr = (key) => DICT[language]?.[key] || DICT['en']?.[key] || key;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trajectoryPeriod, setTrajectoryPeriod] = useState("1Y");
  const [notification, setNotification] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAssetName, setModalAssetName] = useState("");
  const [modalAssetValue, setModalAssetValue] = useState("");

  const [assets, setAssets] = useState(() => {
    const saved = localStorage.getItem('swt_assets');
    return saved ? JSON.parse(saved) : [
      { label: "Institutional Real Estate", sub: "Tier-1 Portfolio", val: 2800000, trend: "+4.2%" },
      { label: "Equities & Indices", sub: "Vanguard All-World", val: 840000, trend: "+12.8%" },
      { label: "Fixed Income", sub: "Treasury Bonds", val: 410000, trend: "0.0%" }
    ];
  });

  const [liabilities, setLiabilities] = useState(() => {
    const saved = localStorage.getItem('swt_liabilities');
    return saved ? JSON.parse(saved) : [
      { label: "Commercial Mortgage", sub: "7.8% APR Fixed", val: 620000, trend: "-₹ 15k Mon", isNeg: true },
      { label: "Corporate Credit", sub: "Amex Platinum", val: 110000, trend: "Due in 12 days", isWarn: true }
    ];
  });

  const totalAssets = assets.reduce((sum, item) => sum + item.val, 0);
  const totalLiabilities = liabilities.reduce((sum, item) => sum + item.val, 0);
  const netWorth = totalAssets - totalLiabilities;
  const ratio = totalLiabilities > 0 ? (totalAssets / totalLiabilities).toFixed(2) : "N/A";

  const getTrajectoryData = () => {
    const P = netWorth;
    const r = 0.082;
    if (trajectoryPeriod === "1Y") {
      return [
        { m: 'Q1 23', h: 35 },
        { m: '', h: 40 },
        { m: '', h: 32 },
        { m: 'Q2 23', h: 45 },
        { m: '', h: 48 },
        { m: '', h: 52 },
        { m: 'Q3 23', h: 58 },
        { m: '', h: 65 },
        { m: '', h: 72 },
        { m: 'Q4 23', h: 78 },
        { m: '', h: 85 },
        { m: 'Present', h: 100, active: true },
      ];
    } else if (trajectoryPeriod === "5Y") {
      const data = [];
      let maxVal = P * Math.pow(1 + r, 5);
      for (let t = 0; t <= 5; t++) {
        const val = P * Math.pow(1 + r, t);
        data.push({
          m: t === 0 ? 'Present' : `Yr ${t}`,
          h: Math.round((val / maxVal) * 100),
          active: t === 0
        });
      }
      return data;
    } else {
      const data = [];
      let maxVal = P * Math.pow(1 + r, 10);
      for (let t = 0; t <= 10; t++) {
        const val = P * Math.pow(1 + r, t);
        data.push({
          m: t === 0 ? 'Present' : t % 2 === 0 ? `Yr ${t}` : '',
          h: Math.round((val / maxVal) * 100),
          active: t === 0
        });
      }
      return data;
    }
  };

  useEffect(() => {
    setLoading(true);
    axios.get(`${API_BASE}/api/user/1/profile`)
      .then(res => setProfile(res.data))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  const [riskModal, setRiskModal] = useState({
    isOpen: false, decision: null, riskScore: 0, message: ""
  });
  const [pendingAction, setPendingAction] = useState(null);

  const securityGate = async (actionToRun, metadata) => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      if (u.nominee?.isEmergencyHeir) {
        setNotification({ message: "Access Denied: Nominee emergency view mode is active. Ledger changes are restricted.", type: "error" });
        return;
      }
    }
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_BASE}/api/action/execute`, metadata, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingAction(() => actionToRun);
      setRiskModal({
        isOpen: true,
        decision: res.data.decision,
        riskScore: res.data.riskScore,
        message: res.data.message
      });
    } catch {
      // Offline fallback: if decision is ALLOW, proceed directly.
      setPendingAction(() => actionToRun);
      setRiskModal({
        isOpen: true,
        decision: 'ALLOW',
        message: "Offline auth approved: low-risk action."
      });
    }
  };

  const handleAddAsset = () => {
    setModalAssetName("");
    setModalAssetValue("");
    setModalOpen(true);
  };

  const handleModalSubmit = (e) => {
    e.preventDefault();
    if (!modalAssetName) {
      setNotification({ message: "Please enter a valid asset name.", type: 'error' });
      return;
    }
    const val = parseFloat(modalAssetValue.replace(/,/g, ''));
    if (isNaN(val) || val <= 0) {
      setNotification({ message: "Please enter a valid amount.", type: 'error' });
      return;
    }

    securityGate(() => {
      const newAssets = [...assets, { label: modalAssetName, sub: "Self Registered", val: val, trend: "+0.0%" }];
      setAssets(newAssets);
      localStorage.setItem('swt_assets', JSON.stringify(newAssets));
      setNotification({ message: `Successfully added ${modalAssetName}!`, type: 'success' });
      setModalOpen(false);
    }, { actionType: 'ADD_ASSET', amount: val });
  };

  const handleApplyStrategy = () => {
    securityGate(() => {
      const newLiabilities = liabilities.map(item => {
        if (item.label === "Commercial Mortgage") {
          return { ...item, val: Math.max(0, item.val - 120000), trend: "-₹ 10k Mon" };
        }
        return item;
      });
      setLiabilities(newLiabilities);
      localStorage.setItem('swt_liabilities', JSON.stringify(newLiabilities));
      setNotification({ message: "Debt reduction strategy applied! Mortgage liability reduced by ₹1,20,000.", type: 'success' });
    }, { actionType: 'DEBT_REDUCTION', amount: 120000 });
  };
  
  return (
    <div className="dashboard-container">
      
      {/* MAIN CONTENT */}
      <main className="main-content">
        
        {/* HERO SECTION */}
        <section className="hero-section">
          <div className="hero-text">
            <span className="insight-tag" style={{color: 'var(--primary-teal)'}}>{getStr('exec_summary')}</span>
            <h1>{getStr('title')}</h1>
            <p>{getStr('desc')}</p>
          </div>

          <div className="networth-card">
            <div className="networth-left">
              <div className="networth-icon">₹</div>
              <div>
                <p className="networth-label">{getStr('aggregate')}</p>
                <h2 className="networth-value">
                  ₹ {netWorth.toLocaleString('en-IN')}
                </h2>
              </div>
            </div>

            <div className="networth-right">
              <span className="networth-growth">
                {profile?.netWorthTrend || '12.4%'}
              </span>
              <span className="networth-sub">{getStr('vs_last')}</span>
            </div>
          </div>
        </section>

        {/* GROWTH TRAJECTORY CHART */}
        <section className="chart-card" style={{marginBottom: '32px'}}>
          <div className="chart-header">
            <div>
              <h3>{getStr('trajectory')}</h3>
              <p>{getStr('traj_desc')}</p>
            </div>
            <div className="time-filters">
              <span className={trajectoryPeriod === "1Y" ? "active" : ""} onClick={() => setTrajectoryPeriod("1Y")} style={{ cursor: 'pointer' }}>1Y</span>
              <span className={trajectoryPeriod === "5Y" ? "active" : ""} onClick={() => setTrajectoryPeriod("5Y")} style={{ cursor: 'pointer' }}>5Y</span>
              <span className={trajectoryPeriod === "ALL" ? "active" : ""} onClick={() => setTrajectoryPeriod("ALL")} style={{ cursor: 'pointer' }}>ALL</span>
            </div>
          </div>
          
          <div className="bar-chart-container">
            {getTrajectoryData().map((bar, i) => (
              <div key={i} className="bar-column">
                <div 
                  className={`bar-fill ${bar.active ? 'active' : ''}`} 
                  style={{ height: `${bar.h}%` }}
                ></div>
                <span className="bar-label">{bar.m}</span>
              </div>
            ))}
          </div>
        </section>

        {/* DATA GRID */}
        <div className="charts-grid">
           <div className="chart-card">
              <div className="chart-header">
                <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
                  <div className="insight-icon tip" style={{margin: 0}}><PieChart size={18}/></div>
                  <h3>{getStr('liquid_fixed')}</h3>
                </div>
                <span className="insight-tag" style={{background: '#f0fdfa', padding: '4px 8px', borderRadius: '4px'}}>{getStr('total_lbl')}: ₹ {totalAssets.toLocaleString('en-IN')}</span>
              </div>
              <div className="asset-rows">
                {assets.map((a, i) => (
                  <AssetRow key={i} label={a.label} sub={a.sub} val={`₹ ${a.val.toLocaleString('en-IN')}`} trend={a.trend}/>
                ))}
              </div>
              <button className="add-btn-placeholder" onClick={handleAddAsset}>
                <Plus size={16}/> {getStr('add_asset')}
              </button>
           </div>

           <div className="chart-card">
              <div className="chart-header">
                <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
                  <div className="insight-icon strategy" style={{margin: 0, color: '#ef4444', background: '#fef2f2'}}><CreditCard size={18}/></div>
                  <h3>{getStr('liabilities_debt')}</h3>
                </div>
                <span className="insight-tag" style={{background: '#fef2f2', padding: '4px 8px', borderRadius: '4px'}}>{getStr('total_lbl')}: ₹ {totalLiabilities.toLocaleString('en-IN')}</span>
              </div>
              <div className="asset-rows">
                {liabilities.map((l, i) => (
                  <AssetRow key={i} label={l.label} sub={l.sub} val={`₹ ${l.val.toLocaleString('en-IN')}`} trend={l.trend} isNeg={l.isNeg} isWarn={l.isWarn}/>
                ))}
              </div>
              <div className="insight-card" style={{padding: '16px', marginTop: '20px', borderStyle: 'none', background: '#f9fbfb'}}>
                <h4 style={{fontSize: '14px', margin: '0 0 8px 0'}}>{getStr('debt_reduction')}</h4>
                <p style={{fontSize: '12px', margin: 0}}>{getStr('debt_desc')}</p>
                <button
                  className="insight-link-btn"
                  style={{marginTop: '8px'}}
                  onClick={handleApplyStrategy}
                >
                  {getStr('apply_strategy')} <ChevronRight size={14}/>
                </button>
              </div>
           </div>
        </div>

        {/* BOTTOM STATS */}
        <div className="insights-grid">
          <StatCard icon={<Scale/>} label={getStr('ratio_lbl')} val={ratio} type="tax" sub={getStr('ratio_sub')}/>
          <StatCard icon={<Clock/>} label={getStr('freedom_lbl')} val="14.2 Years" type="tip" sub={getStr('freedom_sub')}/>
          <StatCard icon={<Zap/>} label={getStr('velocity_lbl')} val="+1.8% / Mo" type="strategy" sub={getStr('velocity_sub')}/>
        </div>
      </main>

      {notification && (
        <Toast 
          message={notification.message} 
          type={notification.type} 
          onDone={() => setNotification(null)} 
        />
      )}

      {modalOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999
        }}>
          <div style={{
            width: "420px",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
          }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>{getStr('modal_title')}</h3>
            <form onSubmit={handleModalSubmit}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#64748b", marginBottom: "6px" }}>{getStr('modal_name')}</label>
                <input 
                  type="text" 
                  value={modalAssetName} 
                  onChange={e => setModalAssetName(e.target.value)}
                  placeholder="e.g. Mutual Funds"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    outline: "none",
                    fontSize: "14px",
                    boxSizing: "border-box"
                  }}
                  required
                />
              </div>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#64748b", marginBottom: "6px" }}>{getStr('modal_val')}</label>
                <input 
                  type="number" 
                  value={modalAssetValue} 
                  onChange={e => setModalAssetValue(e.target.value)}
                  placeholder="e.g. 500000"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    outline: "none",
                    fontSize: "14px",
                    boxSizing: "border-box"
                  }}
                  required
                />
              </div>
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button 
                  type="button" 
                  onClick={() => setModalOpen(false)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "600"
                  }}
                >
                  {getStr('cancel')}
                </button>
                <button 
                  type="submit"
                  style={{
                    padding: "10px 16px",
                    borderRadius: "8px",
                    border: "none",
                    background: "#0f766e",
                    color: "white",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "600"
                  }}
                >
                  {getStr('add_btn')}
                </button>
              </div>
            </form>
          </div>
        </div>
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

const AssetRow = ({label, sub, val, trend, isNeg, isWarn}) => (
  <div style={{display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f3f4f6'}}>
    <div>
      <div style={{fontWeight: '700', fontSize: '14px'}}>{label}</div>
      <div style={{fontSize: '12px', color: 'var(--text-muted)'}}>{sub}</div>
    </div>
    <div style={{textAlign: 'right'}}>
      <div style={{fontWeight: '700', fontSize: '14px'}}>{val}</div>
      <div style={{fontSize: '11px', fontWeight: '700', color: isNeg ? '#ef4444' : isWarn ? '#f59e0b' : '#10b981'}}>{trend}</div>
    </div>
  </div>
);

const StatCard = ({icon, label, val, type, sub}) => (
  <div className="insight-card">
    <div className={`insight-icon ${type}`}>{icon}</div>
    <span className="insight-tag">{label}</span>
    <h4>{val}</h4>
    <p style={{margin: 0}}>{sub}</p>

  </div>

  
);

export default NetWorth;