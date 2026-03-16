import { useState, useEffect, useRef } from "react";

// ─── Binance API Config ───
const BINANCE_BASE = "https://api.binance.com/api/v3";

const COIN_LIST = [
  { symbol: "BTCUSDT", display: "BTC", name: "Bitcoin" },
  { symbol: "ETHUSDT", display: "ETH", name: "Ethereum" },
  { symbol: "SOLUSDT", display: "SOL", name: "Solana" },
  { symbol: "XRPUSDT", display: "XRP", name: "XRP" },
  { symbol: "BNBUSDT", display: "BNB", name: "BNB" },
  { symbol: "ADAUSDT", display: "ADA", name: "Cardano" },
  { symbol: "AVAXUSDT", display: "AVAX", name: "Avalanche" },
  { symbol: "DOGEUSDT", display: "DOGE", name: "Dogecoin" },
  { symbol: "SUIUSDT", display: "SUI", name: "Sui" },
  { symbol: "TONUSDT", display: "TON", name: "Toncoin" },
];

const MEME_LIST = [
  { symbol: "DOGEUSDT", display: "DOGE", name: "Dogecoin" },
  { symbol: "SHIBUSDT", display: "SHIB", name: "Shiba Inu" },
  { symbol: "PEPEUSDT", display: "PEPE", name: "Pepe" },
  { symbol: "WIFUSDT", display: "WIF", name: "dogwifhat" },
  { symbol: "BONKUSDT", display: "BONK", name: "Bonk" },
  { symbol: "FLOKIUSDT", display: "FLOKI", name: "Floki" },
];

const SECTIONS = [
  { id: "market", label: "市場總覽", icon: "◉" },
  { id: "trending", label: "熱度排行", icon: "△" },
  { id: "news", label: "每日新聞", icon: "▤" },
  { id: "unlocks", label: "代幣釋放", icon: "◎" },
  { id: "wallets", label: "聰明錢包", icon: "◈" },
  { id: "meme", label: "迷因熱點", icon: "✦" },
  { id: "fear", label: "恐懼貪婪", icon: "◐" },
  { id: "api", label: "API 架構", icon: "⬡" },
];

// ─── Utilities ───
const fmt = (n, d = 2) => {
  if (n == null || isNaN(n)) return "—";
  const a = Math.abs(n);
  if (a >= 1e12) return (n / 1e12).toFixed(d) + "T";
  if (a >= 1e9) return (n / 1e9).toFixed(d) + "B";
  if (a >= 1e6) return (n / 1e6).toFixed(d) + "M";
  if (a >= 1e3) return (n / 1e3).toFixed(d) + "K";
  return Number(n).toFixed(d);
};

const fmtPrice = (n) => {
  if (n == null || isNaN(n)) return "—";
  const v = Number(n);
  if (v >= 1000) return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (v >= 1) return v.toFixed(4);
  if (v >= 0.0001) return v.toFixed(6);
  return v.toFixed(10);
};

const pc = (v) => (v >= 0 ? "#00ffa3" : "#ff4466");
const ps = (v) => (v == null || isNaN(v)) ? "—" : (v >= 0 ? "+" : "") + Number(v).toFixed(2) + "%";

const todayStr = () => new Date().toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric", weekday: "long" });

// ─── Binance API ───
async function fetchTicker24h(symbols) {
  const param = JSON.stringify(symbols.map(s => s.symbol));
  const r = await fetch(`${BINANCE_BASE}/ticker/24hr?symbols=${encodeURIComponent(param)}`);
  if (!r.ok) throw new Error(`Binance API ${r.status}`);
  return r.json();
}

async function fetchKlines(symbol, interval = "1h", limit = 24) {
  const r = await fetch(`${BINANCE_BASE}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
  if (!r.ok) return [];
  const d = await r.json();
  return d.map(k => parseFloat(k[4]));
}

async function fetchAllData() {
  const allSymbols = [...COIN_LIST];
  MEME_LIST.forEach(m => { if (!allSymbols.find(c => c.symbol === m.symbol)) allSymbols.push(m); });

  const tickerData = await fetchTicker24h(allSymbols);
  const tickerMap = {};
  tickerData.forEach(t => { tickerMap[t.symbol] = t; });

  // Fetch sparklines for top coins
  const sparklines = {};
  for (const coin of COIN_LIST) {
    try { sparklines[coin.symbol] = await fetchKlines(coin.symbol); } catch { sparklines[coin.symbol] = []; }
  }

  const coins = COIN_LIST.map(c => {
    const t = tickerMap[c.symbol];
    if (!t) return null;
    return {
      symbol: c.display, name: c.name, binanceSymbol: c.symbol,
      price: parseFloat(t.lastPrice), change24h: parseFloat(t.priceChangePercent),
      high24h: parseFloat(t.highPrice), low24h: parseFloat(t.lowPrice),
      volume: parseFloat(t.quoteVolume), trades: t.count,
      sparkline: sparklines[c.symbol] || [],
    };
  }).filter(Boolean);

  const memeNarratives = {
    DOGE: { narrative: "Elon Musk 再次發推暗示，永遠的迷因之王", heat: 95 },
    SHIB: { narrative: "Shibarium L2 TVL 突破新高，生態擴展加速", heat: 82 },
    PEPE: { narrative: "Coinbase 正式上架效應持續，社群爆發式增長", heat: 91 },
    WIF: { narrative: "Solana 迷因幣龍頭，NFT 聯名系列引爆話題", heat: 78 },
    BONK: { narrative: "獲利了結壓力，但 Solana 生態仍給予底部支撐", heat: 65 },
    FLOKI: { narrative: "與 Real-World 品牌合作消息不斷，跨界迷因新典範", heat: 72 },
  };

  const memeCoins = MEME_LIST.map(m => {
    const t = tickerMap[m.symbol];
    if (!t) return null;
    const n = memeNarratives[m.display] || {};
    return {
      symbol: m.display, name: m.name,
      price: parseFloat(t.lastPrice), change: parseFloat(t.priceChangePercent),
      volume: parseFloat(t.quoteVolume), trades: t.count,
      narrative: n.narrative || "", heat: n.heat || 50,
    };
  }).filter(Boolean);

  // Fear & Greed
  let fearGreed = 55;
  try {
    const fg = await fetch("https://api.alternative.me/fng/?limit=1");
    const fgd = await fg.json();
    fearGreed = parseInt(fgd.data[0].value);
  } catch {}

  return { coins, memeCoins, fearGreed };
}

// ─── Static Data ───
function getStaticData() {
  return {
    trending: [
      { rank: 1, symbol: "VIRTUAL", name: "Virtuals Protocol", change: 42.8, reason: "AI Agent 概念龍頭，與 Google Cloud 合作消息刺激買盤" },
      { rank: 2, symbol: "KAITO", name: "Kaito AI", change: 38.2, reason: "InfoFi 賽道爆發，社交數據代幣化引爆關注" },
      { rank: 3, symbol: "ENA", name: "Ethena", change: 28.5, reason: "USDe 穩定幣 TVL 突破 $8B，收益率持續吸引資金" },
      { rank: 4, symbol: "ONDO", name: "Ondo Finance", change: 24.1, reason: "RWA 賽道火熱，BlackRock 合作深化消息帶動" },
      { rank: 5, symbol: "PENDLE", name: "Pendle", change: 19.7, reason: "收益率交易需求大增，協議 TVL 新高" },
      { rank: 6, symbol: "JUP", name: "Jupiter", change: 17.3, reason: "Solana DEX 霸主地位穩固，推出 Perps V2" },
      { rank: 7, symbol: "AAVE", name: "Aave", change: 15.8, reason: "V4 升級路線圖公布，GHO 穩定幣採用率增長" },
      { rank: 8, symbol: "W", name: "Wormhole", change: 14.2, reason: "跨鏈橋交易量創新高，多鏈互通需求爆發" },
      { rank: 9, symbol: "STX", name: "Stacks", change: 12.6, reason: "Bitcoin L2 敘事升溫，Nakamoto 升級完成" },
      { rank: 10, symbol: "TIA", name: "Celestia", change: 11.4, reason: "模組化區塊鏈敘事回歸，多個 Rollup 選用" },
    ],
    news: [
      { time: "08:32", title: "BlackRock 宣布推出 Solana ETF 申請", source: "The Block", sentiment: "bullish", impact: "high", tags: ["SOL", "ETF"] },
      { time: "09:15", title: "Virtuals Protocol 與 Google Cloud 達成 AI Agent 基礎設施合作", source: "CoinDesk", sentiment: "bullish", impact: "high", tags: ["VIRTUAL", "AI"] },
      { time: "10:03", title: "美國 SEC 主席暗示可能放寬部分 DeFi 監管", source: "Reuters", sentiment: "bullish", impact: "medium", tags: ["DeFi", "監管"] },
      { time: "10:48", title: "Ethereum Pectra 升級確認將於 Q2 啟動", source: "Ethereum Foundation", sentiment: "bullish", impact: "high", tags: ["ETH", "升級"] },
      { time: "11:22", title: "日本三大銀行聯合測試 Ripple 跨境支付方案", source: "Nikkei", sentiment: "bullish", impact: "medium", tags: ["XRP", "CBDC"] },
      { time: "12:05", title: "某鯨魚錢包轉入 Binance 15,000 BTC 引發拋壓疑慮", source: "Whale Alert", sentiment: "bearish", impact: "medium", tags: ["BTC", "鯨魚"] },
      { time: "13:30", title: "Chainlink 推出跨鏈互操作協議 CCIP 2.0", source: "Chainlink Blog", sentiment: "bullish", impact: "medium", tags: ["LINK", "跨鏈"] },
      { time: "14:17", title: "韓國交易所 Upbit 因 KYC 問題暫停部分服務", source: "CryptoSlate", sentiment: "bearish", impact: "low", tags: ["監管", "韓國"] },
      { time: "15:42", title: "MakerDAO 重組為 Sky Protocol，推出新治理代幣 SKY", source: "DeFi Llama", sentiment: "neutral", impact: "medium", tags: ["MKR", "DeFi"] },
      { time: "16:08", title: "特朗普家族 DeFi 專案 WLFI 宣布推出自有穩定幣 USD1", source: "Bloomberg", sentiment: "neutral", impact: "high", tags: ["穩定幣", "政治"] },
    ],
    unlocks: [
      { date: "3/17", token: "SUI", amount: "64.19M", value: "$247M", pctSupply: 2.41, type: "Community Reserve", impact: "high" },
      { date: "3/18", token: "ARB", amount: "92.65M", value: "$98M", pctSupply: 1.85, type: "Team & Investors", impact: "high" },
      { date: "3/19", token: "APT", amount: "11.31M", value: "$102M", pctSupply: 0.93, type: "Foundation", impact: "medium" },
      { date: "3/20", token: "OP", amount: "31.34M", value: "$55M", pctSupply: 1.47, type: "Core Contributors", impact: "medium" },
      { date: "3/21", token: "STRK", amount: "64.00M", value: "$42M", pctSupply: 3.12, type: "Early Contributors", impact: "high" },
      { date: "3/22", token: "TIA", amount: "8.85M", value: "$48M", pctSupply: 0.83, type: "Series A", impact: "medium" },
      { date: "3/23", token: "SEI", amount: "55.56M", value: "$28M", pctSupply: 1.56, type: "Ecosystem", impact: "low" },
    ],
    smartWallets: [
      { rank: 1, address: "0x7a...3f2d", label: "Galaxy Digital", winRate: 87.3, pnl30d: "+$12.4M", topHolding: "ETH, SOL, VIRTUAL", style: "趨勢跟隨", trades7d: 23 },
      { rank: 2, address: "0x4b...8e1a", label: "Jump Trading", winRate: 84.1, pnl30d: "+$8.7M", topHolding: "BTC, ETH, AAVE", style: "套利為主", trades7d: 156 },
      { rank: 3, address: "0x9c...2b7f", label: "Wintermute", winRate: 81.5, pnl30d: "+$6.2M", topHolding: "ETH, USDC, PENDLE", style: "做市商", trades7d: 3420 },
      { rank: 4, address: "0x1d...5c8e", label: "Smart Degen #1", winRate: 79.8, pnl30d: "+$3.8M", topHolding: "VIRTUAL, KAITO, W", style: "敘事捕捉", trades7d: 47 },
      { rank: 5, address: "0x6f...9a4d", label: "Paradigm Fund", winRate: 78.2, pnl30d: "+$5.1M", topHolding: "ETH, UNI, BLUR", style: "長期持有", trades7d: 8 },
      { rank: 6, address: "0x3e...7d1b", label: "DeFi 大戶 Alpha", winRate: 76.9, pnl30d: "+$2.9M", topHolding: "ENA, PENDLE, EIGEN", style: "收益農場", trades7d: 34 },
      { rank: 7, address: "0x8a...4f2c", label: "鏈上狙擊手", winRate: 75.4, pnl30d: "+$1.8M", topHolding: "迷因幣為主", style: "搶先交易", trades7d: 89 },
      { rank: 8, address: "0x2c...6e9a", label: "Amber Group", winRate: 74.1, pnl30d: "+$4.3M", topHolding: "BTC, ETH, SOL", style: "量化交易", trades7d: 512 },
    ],
  };
}

// ─── Sub-Components ───
function Sparkline({ data, color = "#00ffa3", width = 120, height = 32 }) {
  if (!data || data.length < 2) return <div style={{ width, height, background: "rgba(255,255,255,0.03)", borderRadius: 4 }} />;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * (height - 4) - 2}`).join(" ");
  const gid = "g" + Math.random().toString(36).slice(2, 8);
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.3" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={pts} />
      <polygon fill={`url(#${gid})`} points={`0,${height} ${pts} ${width},${height}`} />
    </svg>
  );
}

function FearGreedGauge({ value }) {
  const angle = (value / 100) * 180 - 90;
  const label = value <= 25 ? "極度恐懼" : value <= 45 ? "恐懼" : value <= 55 ? "中性" : value <= 75 ? "貪婪" : "極度貪婪";
  const gc = value <= 25 ? "#ff4466" : value <= 45 ? "#ff8844" : value <= 55 ? "#ffcc44" : value <= 75 ? "#88dd44" : "#00ffa3";
  return (
    <div style={{ textAlign: "center", padding: "20px 0" }}>
      <svg width="240" height="140" viewBox="0 0 240 140">
        <defs><linearGradient id="gg" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#ff4466" /><stop offset="25%" stopColor="#ff8844" /><stop offset="50%" stopColor="#ffcc44" /><stop offset="75%" stopColor="#88dd44" /><stop offset="100%" stopColor="#00ffa3" /></linearGradient></defs>
        <path d="M 20 120 A 100 100 0 0 1 220 120" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="16" strokeLinecap="round" />
        <path d="M 20 120 A 100 100 0 0 1 220 120" fill="none" stroke="url(#gg)" strokeWidth="12" strokeLinecap="round" opacity="0.6" />
        <line x1="120" y1="120" x2={120 + 75 * Math.cos(angle * Math.PI / 180)} y2={120 + 75 * Math.sin(angle * Math.PI / 180)} stroke={gc} strokeWidth="3" strokeLinecap="round" />
        <circle cx="120" cy="120" r="6" fill={gc} />
        <text x="120" y="105" textAnchor="middle" fill="white" fontSize="28" fontWeight="700" fontFamily="'JetBrains Mono',monospace">{value}</text>
      </svg>
      <div style={{ fontSize: 18, fontWeight: 700, color: gc, marginTop: -4, letterSpacing: 2 }}>{label}</div>
    </div>
  );
}

function HeatBar({ value }) {
  const c = value >= 80 ? "#ff4466" : value >= 60 ? "#ff8844" : value >= 40 ? "#ffcc44" : "#555";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 60, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)" }}>
        <div style={{ width: `${value}%`, height: "100%", borderRadius: 3, background: c }} />
      </div>
      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "'JetBrains Mono',monospace" }}>{value}</span>
    </div>
  );
}

function SectionTitle({ icon, title, subtitle }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <span style={{ fontSize: 16, color: "#00ffa3" }}>{icon}</span>
        <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5 }}>{title}</h2>
      </div>
      {subtitle && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginLeft: 26 }}>{subtitle}</div>}
    </div>
  );
}

// ─── Main App ───
export default function CryptoDailyReport() {
  const [activeSection, setActiveSection] = useState("market");
  const [coins, setCoins] = useState([]);
  const [memeCoins, setMemeCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [fearGreed, setFearGreed] = useState(55);
  const sd = useRef(getStaticData());

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await fetchAllData();
      setCoins(d.coins);
      setMemeCoins(d.memeCoins);
      setFearGreed(d.fearGreed);
      setLastUpdate(new Date().toLocaleTimeString("zh-TW"));
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => { load(); const iv = setInterval(load, 60000); return () => clearInterval(iv); }, []);

  const { trending, news, unlocks, smartWallets } = sd.current;
  const totalVol = coins.reduce((s, c) => s + (c.volume || 0), 0);

  if (loading && coins.length === 0) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <div style={{ width: 48, height: 48, border: "2px solid transparent", borderTop: "2px solid #00ffa3", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2 }}>正在從 Binance 抓取即時數據...</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "white", fontFamily: "'Noto Sans TC','Inter',-apple-system,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Noto+Sans+TC:wght@300;400;500;700;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        @keyframes slideIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
      `}</style>

      {/* Header */}
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "20px 24px", position: "sticky", top: 0, zIndex: 100, background: "rgba(10,10,15,0.92)", backdropFilter: "blur(20px)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: -0.5 }}><span style={{ color: "#00ffa3" }}>₿</span> CRYPTO DAILY</span>
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "rgba(255,136,68,0.15)", color: "#ff8844", fontFamily: "'JetBrains Mono',monospace", fontWeight: 600 }}>BINANCE</span>
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "rgba(0,255,163,0.12)", color: "#00ffa3", fontFamily: "'JetBrains Mono',monospace", fontWeight: 500 }}>USDT</span>
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: "'JetBrains Mono',monospace" }}>
                {todayStr()} · 更新於 {lastUpdate || "—"}{loading && <span style={{ marginLeft: 8, color: "#ffcc44" }}>⟳ 更新中...</span>}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: error ? "#ff4466" : "#00ffa3", animation: error ? "none" : "pulse 2s ease-in-out infinite" }} />
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "'JetBrains Mono',monospace" }}>{error ? "OFFLINE" : "LIVE · 60s"}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 4, marginTop: 16, overflowX: "auto", paddingBottom: 4 }}>
            {SECTIONS.map(s => (
              <button key={s.id} onClick={() => { setActiveSection(s.id); document.getElementById(`s-${s.id}`)?.scrollIntoView({ behavior: "smooth" }); }}
                style={{ padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", whiteSpace: "nowrap", fontSize: 12, fontWeight: 500, fontFamily: "'Noto Sans TC',sans-serif", transition: "all .2s", background: activeSection === s.id ? "rgba(0,255,163,0.12)" : "transparent", color: activeSection === s.id ? "#00ffa3" : "rgba(255,255,255,0.4)" }}>
                <span style={{ marginRight: 4, fontSize: 10 }}>{s.icon}</span>{s.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 24px 80px" }}>

        {error && (
          <div style={{ margin: "0 0 24px", padding: "16px 20px", borderRadius: 12, background: "rgba(255,68,102,0.08)", border: "1px solid rgba(255,68,102,0.2)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div style={{ fontSize: 13, color: "#ff4466" }}>⚠️ {error}</div>
            <button onClick={load} style={{ padding: "6px 20px", borderRadius: 6, border: "1px solid rgba(0,255,163,0.3)", background: "rgba(0,255,163,0.1)", color: "#00ffa3", cursor: "pointer", fontSize: 12 }}>重新載入</button>
          </div>
        )}

        {/* ═══ 市場總覽 ═══ */}
        <section id="s-market" style={{ marginBottom: 48, animation: "fadeUp .5s ease" }}>
          <SectionTitle icon="◉" title="市場總覽" subtitle="Binance 即時報價 · USDT 計價 · 每 60 秒自動更新" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginBottom: 20 }}>
            {[
              { l: "BTC", v: coins[0] ? fmtPrice(coins[0].price) : "—", s: coins[0] ? ps(coins[0].change24h) : "", c: coins[0] ? pc(coins[0].change24h) : "#fff" },
              { l: "ETH", v: coins[1] ? fmtPrice(coins[1].price) : "—", s: coins[1] ? ps(coins[1].change24h) : "", c: coins[1] ? pc(coins[1].change24h) : "#fff" },
              { l: "TOP 10 成交量", v: fmt(totalVol) + " USDT", s: "24H" },
              { l: "恐懼貪婪", v: String(fearGreed), s: fearGreed > 55 ? "貪婪" : fearGreed > 45 ? "中性" : "恐懼", c: fearGreed > 55 ? "#00ffa3" : fearGreed > 45 ? "#ffcc44" : "#ff4466" },
            ].map((c, i) => (
              <div key={i} style={{ padding: "16px 18px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6, fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: 1 }}>{c.l}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: c.c || "#fff", fontFamily: "'JetBrains Mono',monospace" }}>{c.v}</div>
                <div style={{ fontSize: 10, color: c.c || "rgba(255,255,255,0.3)", marginTop: 2 }}>{c.s}</div>
              </div>
            ))}
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead><tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["#", "幣種", "價格 (USDT)", "24H %", "24H 高", "24H 低", "成交量 (USDT)", "走勢"].map((h, i) => (
                  <th key={i} style={{ padding: "10px 12px", textAlign: i >= 2 ? "right" : "left", color: "rgba(255,255,255,0.35)", fontWeight: 500, fontSize: 11, fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: 1, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {coins.map((c, i) => (
                  <tr key={c.symbol} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", animation: `slideIn .3s ease ${i * .05}s both` }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: 12, color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>{i + 1}</td>
                    <td style={{ padding: 12 }}><div style={{ fontWeight: 600 }}>{c.symbol}</div><div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{c.name}</div></td>
                    <td style={{ padding: 12, textAlign: "right", fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, fontSize: 14 }}>{fmtPrice(c.price)}</td>
                    <td style={{ padding: 12, textAlign: "right", fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, color: pc(c.change24h) }}>{ps(c.change24h)}</td>
                    <td style={{ padding: 12, textAlign: "right", fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.5)", fontSize: 12 }}>{fmtPrice(c.high24h)}</td>
                    <td style={{ padding: 12, textAlign: "right", fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.5)", fontSize: 12 }}>{fmtPrice(c.low24h)}</td>
                    <td style={{ padding: 12, textAlign: "right", fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{fmt(c.volume)}</td>
                    <td style={{ padding: 12, textAlign: "right" }}><Sparkline data={c.sparkline} color={pc(c.change24h)} width={80} height={28} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 8, fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: "'JetBrains Mono',monospace", textAlign: "right" }}>
            資料來源：Binance Spot API · /api/v3/ticker/24hr + /api/v3/klines
          </div>
        </section>

        {/* ═══ 熱度排行 ═══ */}
        <section id="s-trending" style={{ marginBottom: 48, animation: "fadeUp .5s ease" }}>
          <SectionTitle icon="△" title="近期熱度排行榜" subtitle="社群聲量 + 漲幅 + 資金流入綜合評分" />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {trending.map((t, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "32px 100px 1fr 80px", gap: 12, alignItems: "center", padding: "14px 16px", borderRadius: 10, background: i < 3 ? "rgba(0,255,163,0.04)" : "rgba(255,255,255,0.02)", border: `1px solid ${i < 3 ? "rgba(0,255,163,0.1)" : "rgba(255,255,255,0.04)"}`, animation: `slideIn .3s ease ${i * .06}s both` }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 16, color: i < 3 ? "#00ffa3" : "rgba(255,255,255,0.3)", textAlign: "center" }}>{i < 3 ? ["🥇", "🥈", "🥉"][i] : `#${t.rank}`}</div>
                <div><div style={{ fontWeight: 600, fontSize: 14 }}>{t.symbol}</div><div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{t.name}</div></div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>{t.reason}</div>
                <div style={{ textAlign: "right", fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, color: "#00ffa3", fontSize: 13 }}>+{t.change}%</div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ 每日新聞 ═══ */}
        <section id="s-news" style={{ marginBottom: 48, animation: "fadeUp .5s ease" }}>
          <SectionTitle icon="▤" title="每日新聞" subtitle="重點消息 · 合作 · 監管 · 生態動態" />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {news.map((n, i) => {
              const sm = { bullish: { c: "#00ffa3", l: "利多", b: "rgba(0,255,163,0.08)" }, bearish: { c: "#ff4466", l: "利空", b: "rgba(255,68,102,0.08)" }, neutral: { c: "#ffcc44", l: "中性", b: "rgba(255,204,68,0.08)" } };
              const s = sm[n.sentiment]; const id = { high: "#ff4466", medium: "#ffcc44", low: "rgba(255,255,255,0.2)" };
              return (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "52px 1fr auto", gap: 12, alignItems: "center", padding: "14px 16px", borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", animation: `slideIn .3s ease ${i * .04}s both` }}>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{n.time}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.5, marginBottom: 6 }}>{n.title}</div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{n.source}</span>
                      {n.tags.map((tag, j) => <span key={j} style={{ fontSize: 10, padding: "1px 6px", borderRadius: 3, background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.45)" }}>{tag}</span>)}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: s.b, color: s.c, fontWeight: 600 }}>{s.l}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: id[n.impact] }} />
                      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase" }}>{n.impact}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ═══ 代幣釋放 ═══ */}
        <section id="s-unlocks" style={{ marginBottom: 48, animation: "fadeUp .5s ease" }}>
          <SectionTitle icon="◎" title="近期代幣釋放" subtitle="未來 7 天重大解鎖事件" />
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead><tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["日期", "代幣", "數量", "估值", "佔供應量", "類型", "影響"].map((h, i) => (
                  <th key={i} style={{ padding: "10px 12px", textAlign: i >= 3 ? "right" : "left", color: "rgba(255,255,255,0.35)", fontWeight: 500, fontSize: 11, fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: 1, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {unlocks.map((u, i) => {
                  const ic = { high: "#ff4466", medium: "#ffcc44", low: "rgba(255,255,255,0.3)" };
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", animation: `slideIn .3s ease ${i * .05}s both` }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: 12, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.5)", fontSize: 12 }}>{u.date}</td>
                      <td style={{ padding: 12, fontWeight: 600 }}>{u.token}</td>
                      <td style={{ padding: 12, fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>{u.amount}</td>
                      <td style={{ padding: 12, textAlign: "right", fontFamily: "'JetBrains Mono',monospace", fontWeight: 500 }}>{u.value}</td>
                      <td style={{ padding: 12, textAlign: "right", fontFamily: "'JetBrains Mono',monospace", color: u.pctSupply > 2 ? "#ff4466" : u.pctSupply > 1 ? "#ffcc44" : "rgba(255,255,255,0.5)" }}>{u.pctSupply}%</td>
                      <td style={{ padding: 12, textAlign: "right", fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{u.type}</td>
                      <td style={{ padding: 12, textAlign: "right" }}><span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: `${ic[u.impact]}15`, color: ic[u.impact], fontWeight: 600, textTransform: "uppercase" }}>{u.impact}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 12, padding: "12px 16px", borderRadius: 8, background: "rgba(255,68,102,0.06)", border: "1px solid rgba(255,68,102,0.1)", fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
            ⚠️ <strong style={{ color: "#ff4466" }}>重點關注：</strong>SUI（3/17）和 STRK（3/21）解鎖佔供應量較高（&gt;2%），可能帶來短期拋壓。
          </div>
        </section>

        {/* ═══ 聰明錢包 ═══ */}
        <section id="s-wallets" style={{ marginBottom: 48, animation: "fadeUp .5s ease" }}>
          <SectionTitle icon="◈" title="投資錢包勝率排行" subtitle="鏈上數據追蹤 · 聰明錢動向" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: 10 }}>
            {smartWallets.map((w, i) => (
              <div key={i} style={{ padding: "16px 18px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", animation: `fadeUp .4s ease ${i * .06}s both` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: i < 3 ? "#00ffa3" : "rgba(255,255,255,0.35)", fontWeight: 700 }}>#{w.rank}</span>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{w.label}</span>
                  </div>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{w.address}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
                  {[{ l: "勝率", v: w.winRate + "%", c: "#00ffa3", s: 16 }, { l: "30D P&L", v: w.pnl30d, c: "#00ffa3", s: 14 }, { l: "7D 交易", v: w.trades7d, s: 14 }].map((x, j) => (
                    <div key={j}><div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, marginBottom: 2 }}>{x.l}</div><div style={{ fontSize: x.s, fontWeight: 700, color: x.c || "#fff", fontFamily: "'JetBrains Mono',monospace" }}>{x.v}</div></div>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}><span style={{ color: "rgba(255,255,255,0.25)" }}>持倉：</span>{w.topHolding}</div>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)" }}>{w.style}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ 迷因熱點 ═══ */}
        <section id="s-meme" style={{ marginBottom: 48, animation: "fadeUp .5s ease" }}>
          <SectionTitle icon="✦" title="迷因幣熱點" subtitle="Binance 即時數據 · Meme Season 追蹤" />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {memeCoins.map((m, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "100px 110px 1fr 90px 80px", gap: 12, alignItems: "center", padding: "14px 16px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", animation: `slideIn .3s ease ${i * .05}s both` }}>
                <div><div style={{ fontWeight: 700, fontSize: 15 }}>{m.symbol}</div><div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{m.name}</div></div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace" }}><div style={{ fontSize: 12, fontWeight: 500 }}>{fmtPrice(m.price)}</div><div style={{ fontSize: 11, color: pc(m.change), fontWeight: 600 }}>{ps(m.change)}</div></div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>{m.narrative}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "'JetBrains Mono',monospace", textAlign: "right" }}>{fmt(m.volume)}</div>
                <div><HeatBar value={m.heat} /></div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8, fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: "'JetBrains Mono',monospace", textAlign: "right" }}>幣價/漲跌/成交量：Binance 即時 · 敘事：AI 生成</div>
        </section>

        {/* ═══ 恐懼貪婪 ═══ */}
        <section id="s-fear" style={{ marginBottom: 48, animation: "fadeUp .5s ease" }}>
          <SectionTitle icon="◐" title="恐懼與貪婪指數" subtitle="Alternative.me API 即時數據" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
            <div style={{ padding: 20, borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <FearGreedGauge value={fearGreed} />
            </div>
            <div style={{ padding: 20, borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: "rgba(255,255,255,0.7)" }}>組成因子</div>
              {[{ l: "波動性", v: 35, w: "25%" }, { l: "市場動能", v: 68, w: "25%" }, { l: "社群媒體", v: 72, w: "15%" }, { l: "問卷調查", v: 58, w: "15%" }, { l: "BTC 佔比", v: 42, w: "10%" }, { l: "Google 趨勢", v: 61, w: "10%" }].map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 80, fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{f.l}</div>
                  <div style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)" }}><div style={{ width: `${f.v}%`, height: "100%", borderRadius: 2, background: f.v > 60 ? "#00ffa3" : f.v > 40 ? "#ffcc44" : "#ff4466" }} /></div>
                  <div style={{ width: 28, textAlign: "right", fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.4)" }}>{f.v}</div>
                  <div style={{ width: 28, textAlign: "right", fontSize: 9, color: "rgba(255,255,255,0.25)" }}>{f.w}</div>
                </div>
              ))}
              <div style={{ marginTop: 8, fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: "'JetBrains Mono',monospace" }}>api.alternative.me/fng/</div>
            </div>
          </div>
        </section>

        {/* ═══ API 架構 ═══ */}
        <section id="s-api" style={{ marginBottom: 48, animation: "fadeUp .5s ease" }}>
          <SectionTitle icon="⬡" title="免費 API 串接架構" subtitle="所有數據來源均為免費" />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { n: "Binance Spot API（本頁主要來源）", u: "api.binance.com/api/v3", c: "即時幣價、24H漲跌、最高最低、成交量、K線走勢", e: ["/ticker/24hr", "/ticker/price", "/klines"], l: "1200 weight/min · 無需 Key", color: "#ff8844" },
              { n: "Alternative.me（恐懼貪婪指數）", u: "api.alternative.me/fng/", c: "恐懼與貪婪指數即時 + 歷史", e: ["/?limit=1"], l: "完全免費 · 無需 Key", color: "#ff66aa" },
              { n: "CryptoPanic API（新聞）", u: "cryptopanic.com/api/free/v1", c: "即時新聞聚合、情緒分析", e: ["/posts/?filter=hot"], l: "需免費 Key · 200 calls/hr", color: "#4488ff" },
              { n: "DeFi Llama（代幣釋放）", u: "api.llama.fi", c: "代幣釋放日程、TVL、DeFi 協議", e: ["/unlocks", "/protocols"], l: "完全免費 · 無需 Key", color: "#66ddaa" },
              { n: "DeBank Open API（錢包追蹤）", u: "open-api.debank.com", c: "DeFi 錢包追蹤、Smart Money", e: ["/v1/user/total_balance"], l: "免費層 · 需註冊", color: "#ffaa44" },
              { n: "Whale Alert（鯨魚追蹤）", u: "api.whale-alert.io/v1", c: "大額轉帳監控", e: ["/transactions"], l: "10 calls/min · 需免費 Key", color: "#44aaff" },
            ].map((a, i) => (
              <div key={i} style={{ padding: "16px 20px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: `1px solid ${a.color}15`, animation: `fadeUp .4s ease ${i * .06}s both` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: a.color }} /><span style={{ fontWeight: 600, fontSize: 14 }}>{a.n}</span></div>
                    <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.3)" }}>{a.u}</div>
                  </div>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "rgba(0,255,163,0.1)", color: "#00ffa3", fontFamily: "'JetBrains Mono',monospace" }}>FREE</span>
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginBottom: 8 }}>{a.c}</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                  {a.e.map((ep, j) => <code key={j} style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,0.04)", color: a.color, fontFamily: "'JetBrains Mono',monospace" }}>{ep}</code>)}
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono',monospace" }}>⚡ {a.l}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, padding: 24, borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>系統架構</div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 2.2, overflowX: "auto", whiteSpace: "pre" }}>
{`┌─────────────────────────────────────────────────┐
│  📱 React 前端（GitHub Pages）                     │
│  ├─ Binance API → 即時幣價 + K 線                  │
│  └─ Alternative.me → 恐懼貪婪指數                  │
└────────────────────┬────────────────────────────┘
                     │ 搭配後端可擴充 ↓
┌─────────────────────────────────────────────────┐
│  ⏰ GitHub Actions Cron（每日 08:00）              │
│  Python 腳本收集新聞 / 釋放 / 錢包                   │
└────────────────────┬────────────────────────────┘
    ┌────────────────┼────────────────┐
    ▼                ▼                ▼
CryptoPanic    DeFi Llama      Whale Alert
 新聞+情緒      釋放+TVL        鯨魚追蹤
    └────────────────┼────────────────┘
                     ▼
          🤖 Claude AI → 分析摘要
                     ▼
          📡 Discord Webhook 推送`}
            </div>
          </div>
        </section>

      </main>

      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.04)", padding: "20px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", fontFamily: "'JetBrains Mono',monospace" }}>
          CRYPTO DAILY · Binance API + Alternative.me · USDT 計價 · 僅供研究參考，非投資建議
        </div>
      </footer>
    </div>
  );
}
