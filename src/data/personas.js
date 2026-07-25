export const PERSONAS = {
  priya: {
    name: "Priya S.", age: 27, kyc: true, score: 62, scoreLabel: "Growing",
    savings: 8400, invested: 240000, networth: 980000,
    savingsTrend: [4200,5800,3900,6100,7200,5500,8100,7600,9200,8800,10400,8400],
    spending: [{ label:"Rent", val:35, color:"#6366f1" },{ label:"Food", val:25, color:"#22c55e" },{ label:"Shopping", val:20, color:"#f59e0b" },{ label:"Dining", val:12, color:"#ef4444" },{ label:"Other", val:8, color:"#cbd5e1" }],
    goals: [
      { title:"Dream home", target:1500000, saved:570000, monthly:8000, deadline:"Dec 2027", status:"warn" },
      { title:"Education fund", target:800000, saved:496000, monthly:5000, deadline:"Jun 2030", status:"ok" },
      { title:"Retirement", target:25000000, saved:200000, monthly:3000, deadline:"2058", status:"ok" }
    ],
    holdings: [
      { name:"HDFC Mid Cap", type:"Equity SIP", value:124000, gain:18.4, sip:3000 },
      { name:"Axis ELSS", type:"Tax saver", value:78000, gain:12.1, sip:0 },
      { name:"SBI Liquid", type:"Debt", value:50000, gain:6.8, sip:0 },
      { name:"NPS Tier I", type:"Retirement", value:200000, gain:9.3, sip:2000 },
      { name:"Digital Gold", type:"Commodity", value:46000, gain:11.2, sip:0 }
    ],
    assets: [{ label:"Bank", val:660000, color:"#6366f1" },{ label:"Investments", val:440000, color:"#22c55e" },{ label:"Gold", val:210000, color:"#f59e0b" },{ label:"Vehicle", val:110000, color:"#cbd5e1" }],
    liabilities: 480000
  },
  ramesh: {
    name: "Ramesh K.", age: 45, kyc: true, score: 78, scoreLabel: "Excellent",
    savings: 22000, invested: 1850000, networth: 4520000,
    savingsTrend: [18000,20000,21000,19000,22000,23000,21500,22000,24000,22000,23000,22000],
    spending: [{ label:"EMI", val:40, color:"#6366f1" },{ label:"Groceries", val:20, color:"#22c55e" },{ label:"Medical", val:18, color:"#f59e0b" },{ label:"Utilities", val:12, color:"#ef4444" },{ label:"Other", val:10, color:"#cbd5e1" }],
    goals: [
      { title:"Retirement", target:30000000, saved:4200000, monthly:50000, deadline:"2034", status:"ok" },
      { title:"Son's education", target:2000000, saved:1200000, monthly:15000, deadline:"2028", status:"ok" },
      { title:"Vacation home", target:5000000, saved:800000, monthly:20000, deadline:"2030", status:"warn" }
    ],
    holdings: [
      { name:"HDFC Balanced Adv", type:"Hybrid", value:650000, gain:11.2, sip:20000 },
      { name:"SBI Fixed Deposit", type:"FD 7.2%", value:500000, gain:7.2, sip:0 },
      { name:"PPF Account", type:"Govt scheme", value:480000, gain:7.1, sip:10000 },
      { name:"NPS Tier I", type:"Retirement", value:220000, gain:9.8, sip:20000 }
    ],
    assets: [{ label:"Real estate", val:2800000, color:"#6366f1" },{ label:"Investments", val:1850000, color:"#22c55e" },{ label:"Bank", val:1200000, color:"#f59e0b" }],
    liabilities: 1330000
  },
  arjun: {
    name: "Arjun M.", age: 38, kyc: true, score: 55, scoreLabel: "At risk",
    savings: 31000, invested: 5200000, networth: 8700000,
    savingsTrend: [28000,35000,22000,40000,31000,28000,45000,29000,33000,38000,30000,31000],
    spending: [{ label:"Investments", val:45, color:"#6366f1" },{ label:"Lifestyle", val:25, color:"#ef4444" },{ label:"Food", val:15, color:"#22c55e" },{ label:"Travel", val:10, color:"#f59e0b" },{ label:"Other", val:5, color:"#cbd5e1" }],
    goals: [
      { title:"Wealth target", target:20000000, saved:8700000, monthly:80000, deadline:"2030", status:"warn" },
      { title:"Early retirement", target:50000000, saved:8700000, monthly:80000, deadline:"2040", status:"ok" }
    ],
    holdings: [
      { name:"Mirae Asset Large Cap", type:"Equity", value:1800000, gain:-8.2, sip:30000 },
      { name:"Axis Small Cap", type:"Equity", value:1200000, gain:-12.4, sip:20000 },
      { name:"US Tech ETF", type:"Intl equity", value:900000, gain:22.1, sip:15000 },
      { name:"ICICI Value Discovery", type:"Equity", value:1300000, gain:4.2, sip:15000 }
    ],
    assets: [{ label:"Equity", val:5200000, color:"#ef4444" },{ label:"Real estate", val:2800000, color:"#6366f1" },{ label:"Cash", val:700000, color:"#22c55e" }],
    liabilities: 0
  }
};

export const MARKET = { gold: 92400, nifty: 24180, fd: 7.2, inflation: 5.8 };

export const FRAUD_SCENARIOS = [
  { user:"Arjun", action:"Transfer ₹1,20,000", device:"New device (iPhone 15)", score:72, level:"block",
    signals:[{label:"New device",pts:20},{label:"Amount 3.1× avg",pts:25},{label:"OTP retry",pts:20},{label:"Night action",pts:10}] },
  { user:"Priya", action:"Start SIP ₹25,000 in new fund", device:"Known device", score:40, level:"warn",
    signals:[{label:"First-time fund",pts:15},{label:"Amount 1.8× avg",pts:15},{label:"Fast action",pts:10}] },
  { user:"Ramesh", action:"SIP ₹5,000 HDFC Bluechip", device:"Known device", score:8, level:"allow",
    signals:[{label:"Trusted device",pts:0},{label:"Regular amount",pts:8}] }
];

export const NUDGES = {
  priya: [
    { tag:"High impact", msg:"Cut dining by ₹2,000/month and hit your home goal 3 months early.", why:"You spent ₹5,100 on dining in Sep — 2.4× your 3-month average. Redirecting saves ₹24k/year." },
    { tag:"Tax saving", msg:"Start an ELSS SIP and save ₹46,800 in taxes this year.", why:"Section 80C gap of ₹1,50,000 unused. At 30% bracket, maxing ELSS returns 30% tax benefit + 12–15% equity growth." },
    { tag:"Market signal", msg:"Gold up 11% YTD — consider booking 30% profits now.", why:"Gold at ₹92,000/10g near 52-week high. Booking profits and rotating to a balanced fund reduces concentration risk." }
  ],
  ramesh: [
    { tag:"Protection", msg:"Increase term insurance cover to ₹2Cr.", why:"Your current cover of ₹75L is 3× income — experts recommend 10–15×. Gap could leave family exposed." },
    { tag:"Rebalance", msg:"Debt at 58% — equity is too low for your horizon.", why:"With 9 years to retirement, increasing equity to 50% adds ₹18L expected corpus at 12% CAGR." },
    { tag:"FD maturity", msg:"₹5L FD matures next month — reinvest at a higher rate.", why:"Current FD rate 7.2%. Bajaj Finance offers 7.85% for 15 months. That's ₹3,250 extra per year." }
  ],
  arjun: [
    { tag:"Risk alert", msg:"Equity at 82% — rebalance ₹85,000 to debt now.", why:"Recent market correction exposed 17% above your risk profile target of 65%. Rebalancing acts as a volatility buffer." },
    { tag:"Diversify", msg:"Consider REITs for real estate exposure without illiquidity.", why:"Your real estate is 32% of NW but illiquid. Embassy REIT yields 6.2% with full liquidity." },
    { tag:"Loss review", msg:"Axis Small Cap down 12.4% — review your exit strategy.", why:"Small cap underperformance vs benchmark for 3 quarters. Consider switching to a momentum-based mid cap fund." }
  ]
};