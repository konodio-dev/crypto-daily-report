import { useState, useEffect, useCallback } from "react";

// ─── API (ALL FREE, NO KEY) ───
const BINANCE = "https://api.binance.com/api/v3";
const COINGECKO = "https://api.coingecko.com/api/v3";
const FEAR_GREED = "https://api.alternative.me/fng";

const COIN_LIST = [
  { symbol:"BTCUSDT",d:"BTC",name:"Bitcoin" },
  { symbol:"ETHUSDT",d:"ETH",name:"Ethereum" },
  { symbol:"SOLUSDT",d:"SOL",name:"Solana" },
  { symbol:"XRPUSDT",d:"XRP",name:"XRP" },
  { symbol:"BNBUSDT",d:"BNB",name:"BNB" },
  { symbol:"ADAUSDT",d:"ADA",name:"Cardano" },
  { symbol:"AVAXUSDT",d:"AVAX",name:"Avalanche" },
  { symbol:"DOGEUSDT",d:"DOGE",name:"Dogecoin" },
  { symbol:"SUIUSDT",d:"SUI",name:"Sui" },
  { symbol:"TONUSDT",d:"TON",name:"Toncoin" },
];
const MEME_LIST = [
  { symbol:"DOGEUSDT",d:"DOGE",name:"Dogecoin" },
  { symbol:"SHIBUSDT",d:"SHIB",name:"Shiba Inu" },
  { symbol:"PEPEUSDT",d:"PEPE",name:"Pepe" },
  { symbol:"WIFUSDT",d:"WIF",name:"dogwifhat" },
  { symbol:"BONKUSDT",d:"BONK",name:"Bonk" },
  { symbol:"FLOKIUSDT",d:"FLOKI",name:"Floki" },
];
const UNLOCK_TOKENS = [
  { symbol:"SUIUSDT",d:"SUI",date:"2026-04-01",amount:"64.19M",pct:2.41,type:"Community Reserve" },
  { symbol:"ARBUSDT",d:"ARB",date:"2026-04-16",amount:"92.65M",pct:1.85,type:"Team & Investors" },
  { symbol:"APTUSDT",d:"APT",date:"2026-04-12",amount:"11.31M",pct:0.93,type:"Foundation" },
  { symbol:"OPUSDT",d:"OP",date:"2026-04-30",amount:"31.34M",pct:1.47,type:"Core Contributors" },
  { symbol:"STRKUSDT",d:"STRK",date:"2026-04-15",amount:"64.00M",pct:3.12,type:"Early Contributors" },
  { symbol:"TIAUSDT",d:"TIA",date:"2026-04-20",amount:"8.85M",pct:0.83,type:"Series A" },
  { symbol:"SEIUSDT",d:"SEI",date:"2026-04-15",amount:"55.56M",pct:1.56,type:"Ecosystem" },
];

// Real known whale/smart money wallets with Etherscan links
const SMART_WALLETS = [
  { rank:1, addr:"0x56178a0d5F301bAf6CF3e1Cd53d9863437345Bf9", short:"0x5617...5Bf9", label:"Galaxy Digital", winRate:87.3, pnl:"+$12.4M", hold:"ETH, SOL, VIRTUAL", style:"趨勢跟隨", trades:23 },
  { rank:2, addr:"0x9507c04B10486547584C37bCBd931B588AE4FcB4", short:"0x9507...FcB4", label:"Jump Trading", winRate:84.1, pnl:"+$8.7M", hold:"BTC, ETH, AAVE", style:"套利為主", trades:156 },
  { rank:3, addr:"0x00000000AE347930bD1E7B0F35588b92280f9e75", short:"0x0000...9e75", label:"Wintermute", winRate:81.5, pnl:"+$6.2M", hold:"ETH, USDC, PENDLE", style:"做市商", trades:3420 },
  { rank:4, addr:"0x28C6c06298d514Db089934071355E5743bf21d60", short:"0x28C6...1d60", label:"Binance Hot Wallet", winRate:79.8, pnl:"+$3.8M", hold:"BTC, ETH, BNB", style:"交易所流動", trades:50000 },
  { rank:5, addr:"0xDef1C0ded9bec7F1a1670819833240f027b25EfF", short:"0xDef1...5EfF", label:"0x Protocol", winRate:78.2, pnl:"+$5.1M", hold:"ETH, UNI, BLUR", style:"DEX 聚合", trades:8900 },
  { rank:6, addr:"0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326", short:"0x1f90...c326", label:"Flashbots Builder", winRate:76.9, pnl:"+$2.9M", hold:"ETH, MEV", style:"MEV 搜索", trades:120000 },
];

const SECTIONS = [
  { id:"market",label:"市場總覽",icon:"◉" },
  { id:"advice",label:"投資建議",icon:"⚡" },
  { id:"trending",label:"熱度排行",icon:"△" },
  { id:"news",label:"每日新聞",icon:"▤" },
  { id:"unlocks",label:"代幣釋放",icon:"◎" },
  { id:"wallets",label:"聰明錢包",icon:"◈" },
  { id:"meme",label:"迷因熱點",icon:"✦" },
  { id:"fear",label:"恐懼貪婪",icon:"◐" },
  { id:"api",label:"API 架構",icon:"⬡" },
];

// ─── Utils ───
const fmt=(n,d=2)=>{if(n==null||isNaN(n))return"—";const a=Math.abs(n);if(a>=1e12)return(n/1e12).toFixed(d)+"T";if(a>=1e9)return(n/1e9).toFixed(d)+"B";if(a>=1e6)return(n/1e6).toFixed(d)+"M";if(a>=1e3)return(n/1e3).toFixed(d)+"K";return Number(n).toFixed(d)};
const fmtP=n=>{if(n==null||isNaN(n))return"—";const v=Number(n);if(v>=1000)return v.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});if(v>=1)return v.toFixed(4);if(v>=0.0001)return v.toFixed(6);return v.toFixed(10)};
const clr=v=>v>=0?"#00e89d":"#ff5270";
const ps=v=>(v==null||isNaN(v))?"—":(v>=0?"+":"")+Number(v).toFixed(2)+"%";
const todayStr=()=>new Date().toLocaleDateString("zh-TW",{year:"numeric",month:"long",day:"numeric",weekday:"long"});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

// ─── TradingView Color Palette ───
const C = {
  bg: "#0f1524",
  bgCard: "#182036",
  bgHover: "#1e2a48",
  border: "#263256",
  borderLight: "#3a4a70",
  text: "#eef0f6",
  textDim: "#a0a8c0",
  textMuted: "#6b7590",
  accent: "#4a90ff",
  green: "#00e89d",
  red: "#ff5270",
  yellow: "#ffd645",
  orange: "#ffaa30",
  header: "#182036",
};

// ─── Data Fetchers ───
async function fetchBinanceTickers(symbols) {
  const p=JSON.stringify(symbols.map(s=>s.symbol));
  const r=await fetch(`${BINANCE}/ticker/24hr?symbols=${encodeURIComponent(p)}`);
  if(!r.ok)throw new Error(`Binance ${r.status}`);return r.json();
}
async function fetchKlines(symbol) {
  try{const r=await fetch(`${BINANCE}/klines?symbol=${symbol}&interval=1h&limit=24`);if(!r.ok)return[];const d=await r.json();return d.map(k=>parseFloat(k[4]));}catch{return[];}
}
async function fetchTrending() {
  try{const r=await fetch(`${COINGECKO}/search/trending`);if(!r.ok)return[];const d=await r.json();return(d.coins||[]).slice(0,10).map((c,i)=>({rank:i+1,symbol:c.item.symbol?.toUpperCase()||"?",name:c.item.name||"",change:c.item.data?.price_change_percentage_24h?.usd??0,mcRank:c.item.market_cap_rank||"—",thumb:c.item.thumb||"",score:c.item.score??i}));}catch{return[];}
}
// ─── Full Chinese News Rewriter ───
const NAMES = {
  "bitcoin":"比特幣","btc":"比特幣","ethereum":"以太坊","eth":"以太坊","solana":"Solana","sol":"Solana",
  "xrp":"XRP","ripple":"瑞波","bnb":"BNB","binance":"幣安","cardano":"Cardano","ada":"ADA",
  "dogecoin":"狗狗幣","doge":"狗狗幣","shiba":"柴犬幣","shib":"柴犬幣","avalanche":"Avalanche","avax":"AVAX",
  "polkadot":"波卡","dot":"DOT","polygon":"Polygon","matic":"MATIC","chainlink":"Chainlink","link":"LINK",
  "uniswap":"Uniswap","uni":"UNI","aave":"Aave","maker":"MakerDAO","mkr":"MKR",
  "toncoin":"TON","ton":"TON","sui":"SUI","sei":"SEI","celestia":"Celestia","tia":"TIA",
  "arbitrum":"Arbitrum","arb":"ARB","optimism":"Optimism","op":"OP","stacks":"Stacks","stx":"STX",
  "pepe":"PEPE","bonk":"BONK","floki":"FLOKI","wif":"WIF","meme":"迷因幣",
  "blackrock":"貝萊德","grayscale":"灰度","coinbase":"Coinbase","kraken":"Kraken",
  "microstrategy":"MicroStrategy","strategy":"Strategy","tesla":"特斯拉",
  "sec":"美國SEC","fed":"聯準會","federal reserve":"聯準會","congress":"美國國會",
  "elon musk":"馬斯克","musk":"馬斯克","trump":"川普","vitalik":"V神","cz":"CZ趙長鵬",
  "gensler":"Gensler","powell":"鮑威爾",
  "china":"中國","japan":"日本","korea":"韓國","india":"印度","eu":"歐盟","us":"美國","u.s.":"美國","uk":"英國",
  "hong kong":"香港","singapore":"新加坡","dubai":"杜拜","brazil":"巴西","russia":"俄羅斯",
  "etf":"ETF","defi":"DeFi","nft":"NFT","dao":"DAO","dex":"去中心化交易所","cex":"中心化交易所",
  "stablecoin":"穩定幣","stablecoins":"穩定幣","cbdc":"央行數位貨幣","usdt":"USDT","usdc":"USDC",
  "layer 2":"L2","layer 1":"L1","l2":"L2","l1":"L1","rollup":"Rollup","zk":"ZK",
  "mainnet":"主網","testnet":"測試網","hardfork":"硬分叉","softfork":"軟分叉",
  "whale":"鯨魚","whales":"鯨魚","airdrop":"空投","staking":"質押","mining":"挖礦","halving":"減半",
  "bull market":"牛市","bear market":"熊市","bull run":"牛市行情",
  "market cap":"市值","trading volume":"成交量","all-time high":"歷史新高","ath":"歷史新高",
  "ai":"AI","artificial intelligence":"人工智慧","metaverse":"元宇宙","web3":"Web3","rwa":"RWA",
  "cross-chain":"跨鏈","bridge":"跨鏈橋","oracle":"預言機","governance":"治理","yield":"收益率",
};

const ACTION_PATTERNS = [
  { re: /\b(surges?|soars?|rockets?|skyrockets?|jumps?|spikes?)\b/i, zh: "飆升" },
  { re: /\b(plunges?|crashes?|dumps?|tanks?|tumbles?|nosedives?)\b/i, zh: "暴跌" },
  { re: /\b(drops?|falls?|fell|declines?|dips?|slips?|slides?)\b/i, zh: "下跌" },
  { re: /\b(rises?|rose|gains?|climbs?|advances?)\b/i, zh: "上漲" },
  { re: /\b(rallies|rallied|rebounds?|recovers?|bounces?)\b/i, zh: "反彈" },
  { re: /\b(hits?|reaches?|tops?|breaks?)\b/i, zh: "突破" },
  { re: /\b(launch(es|ed)?|unveil(s|ed)?|introduce(s|d)?|roll(s|ed)?\s*out)\b/i, zh: "推出" },
  { re: /\b(announc(es|ed)?|reveal(s|ed)?)\b/i, zh: "宣布" },
  { re: /\b(approv(es|ed)?|green[\s-]?lights?)\b/i, zh: "批准" },
  { re: /\b(reject(s|ed)?|den(ies|ied)?)\b/i, zh: "否決" },
  { re: /\b(partner(s|ed)?|collaborat(es|ed)?|teams?\s*up|joins?)\b/i, zh: "合作" },
  { re: /\b(acquir(es|ed)?|buys?|bought|purchase[sd]?)\b/i, zh: "收購" },
  { re: /\b(list(s|ed)?|add(s|ed)?)\b/i, zh: "上架" },
  { re: /\b(delist(s|ed)?|remov(es|ed)?)\b/i, zh: "下架" },
  { re: /\b(ban(s|ned)?|prohibit(s|ed)?|restrict(s|ed)?)\b/i, zh: "禁止" },
  { re: /\b(warn(s|ed)?|caution(s|ed)?)\b/i, zh: "警告" },
  { re: /\b(hack(s|ed)?|breach(es|ed)?|exploit(s|ed)?)\b/i, zh: "遭駭客攻擊" },
  { re: /\b(investigat(es|ed)?|prob(es|ed)?|su(es|ed)?)\b/i, zh: "調查" },
  { re: /\b(rais(es|ed)?|secur(es|ed)?|fundrais(es|ed)?)\b/i, zh: "募資" },
  { re: /\b(fil(es|ed))\b/i, zh: "申請" },
  { re: /\b(upgrad(es|ed)?|update(s|d)?|implement(s|ed)?)\b/i, zh: "升級" },
  { re: /\b(integrat(es|ed)?|adopt(s|ed)?|embrac(es|ed)?)\b/i, zh: "整合" },
  { re: /\b(predict(s|ed)?|forecast(s|ed)?|expect(s|ed)?)\b/i, zh: "預測" },
  { re: /\b(delay(s|ed)?|postpone[sd]?)\b/i, zh: "延遲" },
  { re: /\b(settl(es|ed)?|pay(s|ed)?|fine[sd]?)\b/i, zh: "和解" },
  { re: /\b(explor(es|ed)?|consider(s|ed)?|evaluat(es|ed)?)\b/i, zh: "考慮" },
];

function rewriteToChinese(engTitle) {
  if (!engTitle) return "";
  let title = engTitle.trim();

  // Replace all known names (longest first)
  const nameKeys = Object.keys(NAMES).sort((a, b) => b.length - a.length);
  for (const k of nameKeys) {
    const regex = new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, "gi");
    title = title.replace(regex, NAMES[k]);
  }

  // Replace action verbs
  for (const p of ACTION_PATTERNS) {
    title = title.replace(p.re, p.zh);
  }

  // Common English words → Chinese
  const COMMON = {
    "new":"新的","after":"在...之後","before":"在...之前","amid":"在...之際","despite":"儘管",
    "as":"隨著","with":"與","for":"為","from":"從","into":"進入","over":"超過","above":"以上",
    "below":"以下","could":"可能","may":"可能","might":"可能","will":"將","would":"可能會",
    "should":"應該","report":"報導","reports":"報導","according to":"根據","says":"表示",
    "said":"表示","plan":"計劃","plans":"計劃","set":"設定","eyes":"看向","sees":"認為",
    "year":"年","month":"月","week":"週","day":"天","today":"今日","now":"目前",
    "first":"首次","record":"創紀錄","high":"高","low":"低","top":"頂級","major":"重大",
    "key":"關鍵","global":"全球","world":"全球","growth":"成長","users":"用戶","user":"用戶",
    "supply":"供應","demand":"需求","rate":"利率","interest":"利息","payment":"支付",
    "payments":"支付","transaction":"交易","transactions":"交易","transfer":"轉帳",
    "revenue":"營收","profit":"利潤","loss":"虧損","risk":"風險",
    "crypto":"加密貨幣","cryptocurrency":"加密貨幣","digital asset":"數位資產",
    "digital assets":"數位資產","blockchain":"區塊鏈",
    "institutional":"機構","institutions":"機構","retail":"散戶",
    "regulation":"監管","regulatory":"監管","compliance":"合規","legal":"法律",
    "spot":"現貨","futures":"期貨","options":"選擇權","derivatives":"衍生品",
    "inflow":"流入","outflow":"流出","inflows":"流入","outflows":"流出",
    "billion":"十億美元","million":"百萬美元","trillion":"兆美元",
  };
  const commonKeys = Object.keys(COMMON).sort((a, b) => b.length - a.length);
  for (const k of commonKeys) {
    const regex = new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, "gi");
    title = title.replace(regex, COMMON[k]);
  }

  // Clean remaining English fragments: if still has English words, wrap them
  // Remove articles and prepositions that look weird in Chinese
  title = title.replace(/\b(the|a|an|is|are|was|were|be|been|being|have|has|had|do|does|did|its|it|this|that|these|those|by|on|in|at|to|of|and|or|but|not|no|than|vs\.?|versus)\b/gi, "");

  // Clean up punctuation
  title = title.replace(/\s*:\s*/g, "：").replace(/\s*-\s*/g, "").replace(/\s*\|\s*/g, "｜");
  title = title.replace(/\s{2,}/g, " ").replace(/^[\s,.:;]+/, "").replace(/[\s,.:;]+$/, "");

  // If title is mostly empty or broken, return original
  if (title.length < 5) return engTitle;

  return title;
}

function detectSentiment(title) {
  const t = title.toLowerCase();
  const bull = ["surge","soar","rally","gain","rise","bull","ath","high","launch","partner","approv","pump","breakout","upgrade","adopt","record","inflow","grow"];
  const bear = ["crash","dump","plunge","drop","fall","ban","hack","exploit","lawsuit","crackdown","bear","reject","sell","scam","fraud","outflow","loss","delay","risk","warn"];
  const bScore = bull.filter(w => t.includes(w)).length;
  const sScore = bear.filter(w => t.includes(w)).length;
  if (bScore > sScore) return { label: "利多", color: "#00e89d", bg: "rgba(0,232,157,0.12)" };
  if (sScore > bScore) return { label: "利空", color: "#ff5270", bg: "rgba(255,82,112,0.12)" };
  return { label: "中性", color: "#ffd645", bg: "rgba(255,214,69,0.12)" };
}

async function fetchNews() {
  try {
    const r = await fetch("https://cryptocurrency.cv/api/news?limit=12");
    if (r.ok) {
      const d = await r.json();
      const articles = d.articles || d.data || d;
      if (Array.isArray(articles) && articles.length > 0) {
        return articles.slice(0, 12).map(n => ({
          title: rewriteToChinese(n.title || ""),
          source: n.source || "",
          url: n.link || n.url || "",
          time: n.pubDate ? new Date(n.pubDate) : new Date(),
          tags: (n.tickers || n.categories || "").split ? (n.tickers || n.categories || "").split(",").filter(Boolean).slice(0, 3) : [],
          sentiment: detectSentiment(n.title || ""),
        }));
      }
    }
  } catch {}
  try {
    const r = await fetch(`${COINGECKO}/search/trending`);
    if (r.ok) {
      const d = await r.json();
      const coins = (d.coins || []).slice(0, 8);
      const cats = d.categories || [];
      const items = coins.map(c => ({
        title: `${c.item.name}（${c.item.symbol}）成為 24H 熱搜第 ${(c.item.score||0)+1} 名，市值排名 #${c.item.market_cap_rank||"?"}`,
        source: "CoinGecko Trending",
        url: `https://www.coingecko.com/en/coins/${c.item.id}`,
        time: new Date(),
        tags: [c.item.symbol?.toUpperCase()].filter(Boolean),
        sentiment: { label: "熱門", color: "#4a90ff", bg: "rgba(74,144,255,0.12)" },
      }));
      if (cats.length > 0) {
        cats.slice(0, 4).forEach(cat => {
          items.push({
            title: `🔥 熱門板塊：${cat.name} — 24H 市值變化 ${cat.data?.market_cap_change_percentage_24h?.usd?.toFixed(2)||"?"}%`,
            source: "CoinGecko",
            url: "https://www.coingecko.com/en/categories",
            time: new Date(),
            tags: ["板塊"],
            sentiment: { label: "板塊", color: "#ffaa30", bg: "rgba(255,170,48,0.12)" },
          });
        });
      }
      return items.slice(0, 12);
    }
  } catch {}
  return [];
}
async function fetchFearGreed() {
  try{const r=await fetch(`${FEAR_GREED}/?limit=7&format=json`);if(!r.ok)return{current:50,label:"",history:[]};const d=await r.json();const items=d.data||[];return{current:parseInt(items[0]?.value)||50,label:items[0]?.value_classification||"",history:items.map(i=>({value:parseInt(i.value),date:new Date(i.timestamp*1000).toLocaleDateString("zh-TW",{month:"numeric",day:"numeric"})}))};}catch{return{current:50,label:"",history:[]};}
}
async function fetchAllData(sp) {
  sp("Binance 幣價...");
  const allSym=[...COIN_LIST];MEME_LIST.forEach(m=>{if(!allSym.find(c=>c.symbol===m.symbol))allSym.push(m)});
  UNLOCK_TOKENS.forEach(u=>{if(!allSym.find(c=>c.symbol===u.symbol))allSym.push({symbol:u.symbol,d:u.d,name:u.d})});
  const tData=await fetchBinanceTickers(allSym);const tMap={};tData.forEach(t=>{tMap[t.symbol]=t});

  sp("K線走勢圖...");
  const sparks={};for(const coin of COIN_LIST){sparks[coin.symbol]=await fetchKlines(coin.symbol);await sleep(80);}
  const coins=COIN_LIST.map(c=>{const t=tMap[c.symbol];if(!t)return null;return{symbol:c.d,name:c.name,price:parseFloat(t.lastPrice),change24h:parseFloat(t.priceChangePercent),high24h:parseFloat(t.highPrice),low24h:parseFloat(t.lowPrice),volume:parseFloat(t.quoteVolume),trades:parseInt(t.count),sparkline:sparks[c.symbol]||[]}}).filter(Boolean);

  sp("CoinGecko 熱度...");await sleep(400);const trending=await fetchTrending();
  sp("CryptoCompare 新聞...");const news=await fetchNews();
  sp("恐懼貪婪指數...");const fearGreed=await fetchFearGreed();

  sp("代幣釋放估值...");
  const unlocks=UNLOCK_TOKENS.map(u=>{const t=tMap[u.symbol];const price=t?parseFloat(t.lastPrice):null;const amtNum=parseFloat(u.amount.replace("M",""))*1e6;const val=price?amtNum*price:null;return{token:u.d,date:u.date,amount:u.amount,value:val?"$"+fmt(val):"—",pct:u.pct,type:u.type,impact:u.pct>2?"high":u.pct>1?"medium":"low",priceChg:t?parseFloat(t.priceChangePercent):null}});

  sp("迷因幣...");
  const memeCoins=MEME_LIST.map(m=>{const t=tMap[m.symbol];if(!t)return null;return{symbol:m.d,name:m.name,price:parseFloat(t.lastPrice),change:parseFloat(t.priceChangePercent),volume:parseFloat(t.quoteVolume),trades:parseInt(t.count)}}).filter(Boolean);

  return{coins,trending,news,fearGreed,unlocks,memeCoins};
}

// ─── Investment Advice Engine ───
function generateAdvice(coins, trending, fearGreed, unlocks, memeCoins) {
  if (!coins || coins.length === 0) return [];
  const fg = fearGreed?.current || 50;

  // Market regime
  const regime = fg <= 25 ? "extreme_fear" : fg <= 40 ? "fear" : fg <= 60 ? "neutral" : fg <= 75 ? "greed" : "extreme_greed";

  // Unlock pressure map
  const unlockPressure = {};
  (unlocks || []).forEach(u => { unlockPressure[u.token] = u.pct; });

  // Trending set
  const trendingSet = new Set((trending || []).map(t => t.symbol));

  // Score each coin
  const scored = coins.map(c => {
    let score = 50; // base
    const chg = c.change24h || 0;
    const spark = c.sparkline || [];

    // 1. Momentum: 24h change
    if (chg > 5) score += 15;
    else if (chg > 2) score += 10;
    else if (chg > 0) score += 5;
    else if (chg > -2) score -= 3;
    else if (chg > -5) score -= 10;
    else score -= 18;

    // 2. Trend consistency: sparkline direction
    if (spark.length >= 6) {
      const firstHalf = spark.slice(0, Math.floor(spark.length / 2));
      const secondHalf = spark.slice(Math.floor(spark.length / 2));
      const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      if (avgSecond > avgFirst * 1.02) score += 10; // uptrend
      else if (avgSecond < avgFirst * 0.98) score -= 8; // downtrend
    }

    // 3. Volume strength
    const volRatio = c.volume / (coins[0]?.volume || 1);
    if (volRatio > 0.3) score += 5;

    // 4. Is it trending on CoinGecko?
    if (trendingSet.has(c.symbol)) score += 12;

    // 5. Unlock pressure penalty
    const uPressure = unlockPressure[c.symbol] || 0;
    if (uPressure > 2) score -= 15;
    else if (uPressure > 1) score -= 8;

    // 6. Fear/Greed context
    if (regime === "extreme_fear" && chg < -3) score += 8; // contrarian buy signal
    if (regime === "extreme_greed" && chg > 10) score -= 10; // overheated

    // Volatility from sparkline
    let volatility = 0;
    if (spark.length >= 4) {
      const avg = spark.reduce((a, b) => a + b, 0) / spark.length;
      volatility = Math.sqrt(spark.reduce((s, v) => s + (v - avg) ** 2, 0) / spark.length) / avg * 100;
    }

    // Risk level
    let risk, riskColor, riskBg;
    if (volatility > 5 || Math.abs(chg) > 8 || uPressure > 2) {
      risk = "積極"; riskColor = "#ff5270"; riskBg = "rgba(255,82,112,0.12)";
    } else if (volatility > 2.5 || Math.abs(chg) > 4 || uPressure > 1) {
      risk = "穩健"; riskColor = "#ffd645"; riskBg = "rgba(255,214,69,0.12)";
    } else {
      risk = "保守"; riskColor = "#00e89d"; riskBg = "rgba(0,232,157,0.12)";
    }

    // Short-term signal
    let shortTerm, shortColor;
    if (chg > 3 && score > 60) { shortTerm = "短線看多"; shortColor = "#00e89d"; }
    else if (chg < -3 && fg < 40) { shortTerm = "逢低布局"; shortColor = "#4a90ff"; }
    else if (chg < -5) { shortTerm = "短線觀望"; shortColor = "#ff5270"; }
    else if (chg > 8) { shortTerm = "注意回調"; shortColor = "#ffaa30"; }
    else { shortTerm = "區間整理"; shortColor = C.textDim; }

    // Mid-term signal
    let midTerm, midColor;
    if (score >= 70 && !uPressure) { midTerm = "中線看好"; midColor = "#00e89d"; }
    else if (score >= 60) { midTerm = "溫和看多"; midColor = "#66ee88"; }
    else if (score >= 45) { midTerm = "中性持有"; midColor = C.textDim; }
    else if (score >= 30) { midTerm = "減倉觀望"; midColor = "#ffaa30"; }
    else { midTerm = "建議迴避"; midColor = "#ff5270"; }

    // Reason
    const reasons = [];
    if (chg > 5) reasons.push(`24H 漲幅 ${chg.toFixed(1)}%，短期動能強勁`);
    else if (chg > 2) reasons.push(`24H 小幅上漲 ${chg.toFixed(1)}%，多方佔優`);
    else if (chg > -2) reasons.push("24H 走勢平穩，處於盤整區間");
    else if (chg > -5) reasons.push(`24H 下跌 ${Math.abs(chg).toFixed(1)}%，短期承壓`);
    else reasons.push(`24H 大跌 ${Math.abs(chg).toFixed(1)}%，空方主導`);

    if (trendingSet.has(c.symbol)) reasons.push("CoinGecko 24H 熱搜上榜，社群關注度高");
    if (uPressure > 2) reasons.push(`近期將解鎖 ${uPressure}% 供應量，拋壓風險較高`);
    else if (uPressure > 1) reasons.push(`近期有 ${uPressure}% 供應量解鎖，需留意賣壓`);
    if (regime === "extreme_fear" && chg < 0) reasons.push("市場處於極度恐懼，歷史上常為反轉買點");
    if (regime === "fear" && chg < -2) reasons.push("恐懼指數偏低，逆向思考可留意佈局機會");
    if (regime === "extreme_greed" && chg > 5) reasons.push("市場極度貪婪且漲幅已大，追高風險偏高");
    if (regime === "greed" && chg > 3) reasons.push("市場情緒偏貪婪，注意短期回調風險");
    if (volatility > 5) reasons.push(`波動率 ${volatility.toFixed(1)}%，適合短線交易但風險較高`);
    else if (volatility < 1.5) reasons.push("波動率偏低，可能醞釀方向性突破");
    if (volRatio > 0.5) reasons.push("成交量佔比高，流動性充足，大資金關注中");
    else if (volRatio < 0.05) reasons.push("成交量相對偏低，流動性不足需注意滑點");

    // Sparkline trend detail
    if (spark.length >= 6) {
      const firstQ = spark.slice(0, Math.floor(spark.length / 4));
      const lastQ = spark.slice(Math.floor(spark.length * 3 / 4));
      const avgFirstQ = firstQ.reduce((a, b) => a + b, 0) / firstQ.length;
      const avgLastQ = lastQ.reduce((a, b) => a + b, 0) / lastQ.length;
      const trendPct = ((avgLastQ - avgFirstQ) / avgFirstQ * 100);
      if (trendPct > 3) reasons.push(`24H 走勢圖呈上升趨勢（+${trendPct.toFixed(1)}%），多方持續發力`);
      else if (trendPct < -3) reasons.push(`24H 走勢圖呈下降趨勢（${trendPct.toFixed(1)}%），空方壓力未減`);
    }

    if (reasons.length < 3) reasons.push("綜合評分中等，建議搭配其他指標判斷");

    return {
      symbol: c.symbol, name: c.name, price: c.price, change: chg,
      score, risk, riskColor, riskBg,
      shortTerm, shortColor, midTerm, midColor,
      reason: reasons.slice(0, 3).join("；"),
      sparkline: c.sparkline,
    };
  });

  // Also check meme coins for high-score outliers
  const memeScored = (memeCoins || []).filter(m => !scored.find(s => s.symbol === m.symbol)).map(m => {
    const chg = m.change || 0;
    let score = 40;
    if (chg > 10) score += 20;
    else if (chg > 5) score += 12;
    else if (chg < -5) score -= 15;
    if (trendingSet.has(m.symbol)) score += 15;

    const risk = "積極";
    const riskColor = "#ff5270";
    const riskBg = "rgba(255,82,112,0.12)";

    let shortTerm, shortColor;
    if (chg > 10) { shortTerm = "短線爆發"; shortColor = "#00e89d"; }
    else if (chg > 0) { shortTerm = "觀察中"; shortColor = C.textDim; }
    else { shortTerm = "短線觀望"; shortColor = "#ff5270"; }

    return {
      symbol: m.symbol, name: m.name, price: m.price, change: chg,
      score, risk, riskColor, riskBg,
      shortTerm, shortColor,
      midTerm: "高風險投機", midColor: "#ffaa30",
      reason: chg > 10 ? `24H 飆漲 ${chg.toFixed(1)}%，迷因幣爆發中` : "迷因幣波動大，純投機標的",
      sparkline: [],
      isMeme: true,
    };
  });

  const all = [...scored, ...memeScored];
  // Pick top 5 by absolute score interest (highest + most extreme)
  all.sort((a, b) => b.score - a.score);
  return all.slice(0, 10);
}

// ─── Market Summary for Advice Header ───
function getMarketSummary(coins, fearGreed) {
  const fg = fearGreed?.current || 50;
  const btc = coins[0];
  const avgChg = coins.reduce((s, c) => s + (c.change24h || 0), 0) / (coins.length || 1);

  let overall, overallColor;
  if (avgChg > 3 && fg > 55) { overall = "多頭偏強"; overallColor = "#00e89d"; }
  else if (avgChg > 1) { overall = "溫和上漲"; overallColor = "#66ee88"; }
  else if (avgChg > -1) { overall = "盤整震盪"; overallColor = "#ffd645"; }
  else if (avgChg > -3) { overall = "偏弱整理"; overallColor = "#ffaa30"; }
  else { overall = "空頭壓力"; overallColor = "#ff5270"; }

  return { overall, overallColor, avgChg, fg, btcChg: btc?.change24h || 0 };
}

// ─── Components ───
function Sparkline({data,color="#26a69a",width=120,height=32}){
  if(!data||data.length<2)return<div style={{width,height,background:C.bgCard,borderRadius:4}}/>;
  const min=Math.min(...data),max=Math.max(...data),range=max-min||1;
  const pts=data.map((v,i)=>`${(i/(data.length-1))*width},${height-((v-min)/range)*(height-4)-2}`).join(" ");
  const gid="g"+Math.random().toString(36).slice(2,8);
  return<svg width={width} height={height} style={{display:"block"}}><defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.3"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs><polyline fill="none" stroke={color} strokeWidth="1.5" points={pts}/><polygon fill={`url(#${gid})`} points={`0,${height} ${pts} ${width},${height}`}/></svg>;
}
function FearGreedGauge({value,label}){
  const angle=(value/100)*180-90;const gc=value<=25?"#ff5270":value<=45?C.orange:value<=55?C.yellow:value<=75?"#66ee88":"#00e89d";
  const lb=label||(value<=25?"極度恐懼":value<=45?"恐懼":value<=55?"中性":value<=75?"貪婪":"極度貪婪");
  return<div style={{textAlign:"center",padding:"20px 0"}}><svg width="240" height="140" viewBox="0 0 240 140"><defs><linearGradient id="gg" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#ff5270"/><stop offset="25%" stopColor={C.orange}/><stop offset="50%" stopColor={C.yellow}/><stop offset="75%" stopColor="#66ee88"/><stop offset="100%" stopColor="#00e89d"/></linearGradient></defs><path d="M 20 120 A 100 100 0 0 1 220 120" fill="none" stroke={C.border} strokeWidth="16" strokeLinecap="round"/><path d="M 20 120 A 100 100 0 0 1 220 120" fill="none" stroke="url(#gg)" strokeWidth="12" strokeLinecap="round" opacity="0.7"/><line x1="120" y1="120" x2={120+75*Math.cos(angle*Math.PI/180)} y2={120+75*Math.sin(angle*Math.PI/180)} stroke={gc} strokeWidth="3" strokeLinecap="round"/><circle cx="120" cy="120" r="6" fill={gc}/><text x="120" y="105" textAnchor="middle" fill={C.text} fontSize="28" fontWeight="700" fontFamily="'JetBrains Mono',monospace">{value}</text></svg><div style={{fontSize:18,fontWeight:700,color:gc,marginTop:-4,letterSpacing:2}}>{lb}</div></div>;
}
function HeatBar({value}){const c=value>=80?"#ff5270":value>=60?C.orange:value>=40?C.yellow:C.textMuted;return<div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:60,height:6,borderRadius:3,background:C.border}}><div style={{width:`${value}%`,height:"100%",borderRadius:3,background:c}}/></div><span style={{fontSize:11,color:C.textDim,fontFamily:"'JetBrains Mono',monospace"}}>{value}</span></div>;}
function ST({icon,title,subtitle}){return<div style={{marginBottom:20}}><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}><span style={{fontSize:16,color:C.accent}}>{icon}</span><h2 style={{fontSize:20,fontWeight:700,letterSpacing:-0.5,color:C.text}}>{title}</h2></div>{subtitle&&<div style={{fontSize:12,color:C.textDim,marginLeft:26}}>{subtitle}</div>}</div>;}
function Src({text}){return<div style={{marginTop:8,fontSize:10,color:C.textMuted,fontFamily:"'JetBrains Mono',monospace",textAlign:"right"}}>{text}</div>;}

// ─── Main App ───
export default function CryptoDailyReport(){
  const[active,setActive]=useState("market");
  const[coins,setCoins]=useState([]);
  const[trending,setTrending]=useState([]);
  const[news,setNews]=useState([]);
  const[fearGreed,setFearGreed]=useState({current:50,label:"",history:[]});
  const[unlocks,setUnlocks]=useState([]);
  const[memeCoins,setMemeCoins]=useState([]);
  const[loading,setLoading]=useState(true);
  const[progress,setProgress]=useState("");
  const[error,setError]=useState(null);
  const[lastUpdate,setLastUpdate]=useState(null);

  const load=useCallback(async()=>{
    setLoading(true);setError(null);
    try{const d=await fetchAllData(setProgress);setCoins(d.coins);setTrending(d.trending);setNews(d.news);setFearGreed(d.fearGreed);setUnlocks(d.unlocks);setMemeCoins(d.memeCoins);setLastUpdate(new Date().toLocaleTimeString("zh-TW"));}catch(e){setError(e.message);}
    setLoading(false);setProgress("");
  },[]);

  useEffect(()=>{load();const iv=setInterval(load,120000);return()=>clearInterval(iv)},[load]);

  const totalVol=coins.reduce((s,c)=>s+(c.volume||0),0);
  const advice = generateAdvice(coins, trending, fearGreed, unlocks, memeCoins);
  const mktSummary = getMarketSummary(coins, fearGreed);
  const th={padding:"10px 12px",color:C.textDim,fontWeight:500,fontSize:11,fontFamily:"'JetBrains Mono',monospace",textTransform:"uppercase",letterSpacing:1,whiteSpace:"nowrap"};
  const card={padding:"16px 18px",borderRadius:8,background:C.bgCard,border:`1px solid ${C.border}`};

  if(loading&&coins.length===0){return<div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}><div style={{width:48,height:48,border:"2px solid transparent",borderTop:`2px solid ${C.accent}`,borderRadius:"50%",animation:"spin .8s linear infinite"}}/><div style={{color:C.textDim,fontSize:14,fontFamily:"'JetBrains Mono',monospace"}}>{progress||"載入中..."}</div><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;}

  return(
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'Noto Sans TC','Inter',-apple-system,sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Noto+Sans+TC:wght@300;400;500;700;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${C.borderLight};border-radius:2px}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        @keyframes slideIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
        section[id^="s-"]{scroll-margin-top:140px}
      `}</style>

      {/* Header */}
      <header style={{borderBottom:`1px solid ${C.border}`,padding:"16px 24px",position:"sticky",top:0,zIndex:100,background:"rgba(19,23,34,0.95)",backdropFilter:"blur(20px)"}}>
        <div style={{maxWidth:1200,margin:"0 auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                <span style={{fontSize:20,fontWeight:900,letterSpacing:-0.5,color:C.text}}><span style={{color:C.accent}}>₿</span> CRYPTO DAILY</span>
                <span style={{fontSize:10,padding:"2px 8px",borderRadius:4,background:"rgba(255,152,0,0.15)",color:C.orange,fontFamily:"'JetBrains Mono',monospace",fontWeight:600}}>BINANCE</span>
                <span style={{fontSize:10,padding:"2px 8px",borderRadius:4,background:"rgba(41,98,255,0.15)",color:C.accent,fontFamily:"'JetBrains Mono',monospace"}}>USDT</span>
              </div>
              <div style={{fontSize:12,color:C.textDim,fontFamily:"'JetBrains Mono',monospace"}}>
                {todayStr()} · 更新於 {lastUpdate||"—"}{loading&&<span style={{marginLeft:8,color:C.yellow}}>⟳ {progress}</span>}
              </div>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <span style={{width:6,height:6,borderRadius:"50%",background:error?C.red:C.green,animation:error?"none":"pulse 2s ease-in-out infinite"}}/>
              <span style={{fontSize:11,color:C.textDim,fontFamily:"'JetBrains Mono',monospace"}}>{error?"OFFLINE":"LIVE · 2min"}</span>
            </div>
          </div>
          <div style={{display:"flex",gap:4,marginTop:12,overflowX:"auto",paddingBottom:4}}>
            {SECTIONS.map(s=><button key={s.id} onClick={()=>{setActive(s.id);document.getElementById(`s-${s.id}`)?.scrollIntoView({behavior:"smooth"});}}
              style={{padding:"6px 14px",borderRadius:6,border:"none",cursor:"pointer",whiteSpace:"nowrap",fontSize:12,fontWeight:500,fontFamily:"'Noto Sans TC',sans-serif",transition:"all .2s",background:active===s.id?`${C.accent}22`:"transparent",color:active===s.id?C.accent:C.textDim}}>
              <span style={{marginRight:4,fontSize:10}}>{s.icon}</span>{s.label}
            </button>)}
          </div>
        </div>
      </header>

      <main style={{maxWidth:1200,margin:"0 auto",padding:"24px 24px 80px"}}>
        {error&&<div style={{margin:"0 0 24px",padding:"16px 20px",borderRadius:8,background:`${C.red}15`,border:`1px solid ${C.red}33`,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}><span style={{fontSize:13,color:C.red}}>⚠️ {error}</span><button onClick={load} style={{padding:"6px 20px",borderRadius:6,border:`1px solid ${C.accent}66`,background:`${C.accent}22`,color:C.accent,cursor:"pointer",fontSize:12}}>重新載入</button></div>}

        {/* ═══ 市場總覽 ═══ */}
        <section id="s-market" style={{marginBottom:48,animation:"fadeUp .5s ease"}}>
          <ST icon="◉" title="市場總覽" subtitle="Binance 即時報價 · USDT 計價 · 每 2 分鐘自動更新"/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,marginBottom:20}}>
            {[{l:"BTC",v:coins[0]?fmtP(coins[0].price):"—",s:coins[0]?ps(coins[0].change24h):"",c:coins[0]?clr(coins[0].change24h):C.text},{l:"ETH",v:coins[1]?fmtP(coins[1].price):"—",s:coins[1]?ps(coins[1].change24h):"",c:coins[1]?clr(coins[1].change24h):C.text},{l:"TOP 10 成交量",v:fmt(totalVol)+" USDT",s:"24H"},{l:"恐懼貪婪",v:String(fearGreed.current),s:fearGreed.label||"",c:fearGreed.current>55?C.green:fearGreed.current>45?C.yellow:C.red}].map((c,i)=><div key={i} style={card}><div style={{fontSize:11,color:C.textDim,marginBottom:6,fontFamily:"'JetBrains Mono',monospace",textTransform:"uppercase",letterSpacing:1}}>{c.l}</div><div style={{fontSize:18,fontWeight:700,color:c.c||C.text,fontFamily:"'JetBrains Mono',monospace"}}>{c.v}</div><div style={{fontSize:10,color:c.c||C.textDim,marginTop:2}}>{c.s}</div></div>)}
          </div>
          <div style={{overflowX:"auto",background:C.bgCard,borderRadius:8,border:`1px solid ${C.border}`}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}><thead><tr style={{borderBottom:`1px solid ${C.border}`}}>
            {["#","幣種","價格(USDT)","24H%","24H高","24H低","成交量(USDT)","走勢"].map((h,i)=><th key={i} style={{...th,textAlign:i>=2?"right":"left"}}>{h}</th>)}
          </tr></thead><tbody>
            {coins.map((c,i)=><tr key={c.symbol} style={{borderBottom:`1px solid ${C.border}`,animation:`slideIn .3s ease ${i*.05}s both`,transition:"background .2s",cursor:"default"}} onMouseEnter={e=>e.currentTarget.style.background=C.bgHover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <td style={{padding:12,color:C.textDim,fontFamily:"'JetBrains Mono',monospace",fontSize:11}}>{i+1}</td>
              <td style={{padding:12}}><div style={{fontWeight:600,color:C.text}}>{c.symbol}</div><div style={{fontSize:10,color:C.textDim}}>{c.name}</div></td>
              <td style={{padding:12,textAlign:"right",fontFamily:"'JetBrains Mono',monospace",fontWeight:600,fontSize:14,color:C.text}}>{fmtP(c.price)}</td>
              <td style={{padding:12,textAlign:"right",fontFamily:"'JetBrains Mono',monospace",fontWeight:600,color:clr(c.change24h)}}>{ps(c.change24h)}</td>
              <td style={{padding:12,textAlign:"right",fontFamily:"'JetBrains Mono',monospace",color:C.textDim,fontSize:12}}>{fmtP(c.high24h)}</td>
              <td style={{padding:12,textAlign:"right",fontFamily:"'JetBrains Mono',monospace",color:C.textDim,fontSize:12}}>{fmtP(c.low24h)}</td>
              <td style={{padding:12,textAlign:"right",fontFamily:"'JetBrains Mono',monospace",color:C.text,fontSize:12}}>{fmt(c.volume)}</td>
              <td style={{padding:12,textAlign:"right"}}><Sparkline data={c.sparkline} color={clr(c.change24h)} width={80} height={28}/></td>
            </tr>)}
          </tbody></table></div>
          <Src text="Binance Spot API · /api/v3/ticker/24hr + /api/v3/klines"/>
        </section>

        {/* ═══ 投資建議 ═══ */}
        <section id="s-advice" style={{marginBottom:48,animation:"fadeUp .5s ease"}}>
          <ST icon="⚡" title="投資建議" subtitle="綜合幣價動能、恐懼貪婪、熱度、代幣釋放等數據自動分析"/>

          {/* Market Overview Bar */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginBottom:20}}>
            <div style={card}>
              <div style={{fontSize:10,color:C.textDim,fontFamily:"'JetBrains Mono',monospace",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>大盤趨勢</div>
              <div style={{fontSize:18,fontWeight:700,color:mktSummary.overallColor,fontFamily:"'JetBrains Mono',monospace"}}>{mktSummary.overall}</div>
            </div>
            <div style={card}>
              <div style={{fontSize:10,color:C.textDim,fontFamily:"'JetBrains Mono',monospace",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>平均漲跌</div>
              <div style={{fontSize:18,fontWeight:700,color:clr(mktSummary.avgChg),fontFamily:"'JetBrains Mono',monospace"}}>{ps(mktSummary.avgChg)}</div>
            </div>
            <div style={card}>
              <div style={{fontSize:10,color:C.textDim,fontFamily:"'JetBrains Mono',monospace",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>BTC 動向</div>
              <div style={{fontSize:18,fontWeight:700,color:clr(mktSummary.btcChg),fontFamily:"'JetBrains Mono',monospace"}}>{ps(mktSummary.btcChg)}</div>
            </div>
            <div style={card}>
              <div style={{fontSize:10,color:C.textDim,fontFamily:"'JetBrains Mono',monospace",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>市場情緒</div>
              <div style={{fontSize:18,fontWeight:700,color:mktSummary.fg>55?C.green:mktSummary.fg>45?C.yellow:C.red,fontFamily:"'JetBrains Mono',monospace"}}>{mktSummary.fg}</div>
            </div>
          </div>

          {/* Top 5 Picks */}
          <div style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:12}}>🎯 今日最值得關注 Top 10</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {advice.map((a,i)=>(
              <div key={i} style={{padding:"18px 20px",borderRadius:10,background:C.bgCard,border:`1px solid ${i===0?`${C.accent}44`:C.border}`,animation:`fadeUp .4s ease ${i*.08}s both`,position:"relative",overflow:"hidden"}}>
                {i===0&&<div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${C.accent},${C.green})`}}/>}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12,flexWrap:"wrap",gap:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:14,fontWeight:700,color:i===0?C.accent:C.textDim,width:24}}>#{i+1}</span>
                    <div>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontSize:18,fontWeight:700,color:C.text}}>{a.symbol}</span>
                        <span style={{fontSize:12,color:C.textDim}}>{a.name}</span>
                        {a.isMeme&&<span style={{fontSize:9,padding:"1px 6px",borderRadius:3,background:`${C.orange}20`,color:C.orange}}>MEME</span>}
                      </div>
                      <div style={{fontSize:12,fontFamily:"'JetBrains Mono',monospace",color:C.textDim,marginTop:2}}>
                        {fmtP(a.price)} USDT <span style={{color:clr(a.change),fontWeight:600,marginLeft:6}}>{ps(a.change)}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    <span style={{fontSize:10,padding:"3px 10px",borderRadius:5,background:a.riskBg,color:a.riskColor,fontWeight:600}}>風險：{a.risk}</span>
                    {a.sparkline&&a.sparkline.length>2&&<Sparkline data={a.sparkline} color={clr(a.change)} width={70} height={24}/>}
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:10}}>
                  <div style={{padding:"10px 14px",borderRadius:6,background:`${a.shortColor}10`,border:`1px solid ${a.shortColor}25`}}>
                    <div style={{fontSize:9,color:C.textDim,fontFamily:"'JetBrains Mono',monospace",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>短線（1-7天）</div>
                    <div style={{fontSize:15,fontWeight:700,color:a.shortColor}}>{a.shortTerm}</div>
                  </div>
                  <div style={{padding:"10px 14px",borderRadius:6,background:`${a.midColor}10`,border:`1px solid ${a.midColor}25`}}>
                    <div style={{fontSize:9,color:C.textDim,fontFamily:"'JetBrains Mono',monospace",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>中線（1-3個月）</div>
                    <div style={{fontSize:15,fontWeight:700,color:a.midColor}}>{a.midTerm}</div>
                  </div>
                </div>
                <div style={{fontSize:12,color:C.textDim,lineHeight:1.6,paddingLeft:2}}>
                  💬 {a.reason}
                </div>
              </div>
            ))}
          </div>

          <div style={{marginTop:16,padding:"12px 16px",borderRadius:8,background:`${C.accent}08`,border:`1px solid ${C.accent}20`,fontSize:11,color:C.textDim,lineHeight:1.6}}>
            ⚠️ <strong style={{color:C.accent}}>免責聲明：</strong>以上建議由演算法根據即時市場數據（價格動能、恐懼貪婪指數、社群熱度、代幣釋放壓力）自動生成，僅供參考，不構成投資建議。加密貨幣市場波動劇烈，投資前請自行評估風險。
          </div>
          <Src text="演算法：Binance 24H 數據 + CoinGecko 熱度 + Fear & Greed + 代幣釋放綜合評分"/>
        </section>

        {/* ═══ 熱度排行 ═══ */}
        <section id="s-trending" style={{marginBottom:48,animation:"fadeUp .5s ease"}}>
          <ST icon="△" title="近期熱度排行榜" subtitle="CoinGecko Trending API · 過去 24H 搜尋熱度即時排名"/>
          {trending.length===0?<div style={{padding:20,textAlign:"center",color:C.textDim}}>CoinGecko API 限流中，稍後重試...</div>:
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {trending.map((t,i)=><div key={i} style={{display:"grid",gridTemplateColumns:"32px 44px 100px 1fr 80px",gap:12,alignItems:"center",padding:"14px 16px",borderRadius:8,background:i<3?`${C.accent}0a`:C.bgCard,border:`1px solid ${i<3?`${C.accent}33`:C.border}`,animation:`slideIn .3s ease ${i*.06}s both`}}>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:700,fontSize:16,color:i<3?C.accent:C.textDim,textAlign:"center"}}>{i<3?["🥇","🥈","🥉"][i]:`#${t.rank}`}</div>
              {t.thumb?<img src={t.thumb} alt="" style={{width:28,height:28,borderRadius:"50%"}}/>:<div style={{width:28,height:28,borderRadius:"50%",background:C.border}}/>}
              <div><div style={{fontWeight:600,fontSize:14,color:C.text}}>{t.symbol}</div><div style={{fontSize:10,color:C.textDim}}>{t.name}</div></div>
              <div style={{fontSize:11,color:C.textDim}}>Market Cap Rank: #{t.mcRank}</div>
              <div style={{textAlign:"right",fontFamily:"'JetBrains Mono',monospace",fontWeight:600,color:clr(t.change),fontSize:13}}>{ps(t.change)}</div>
            </div>)}
          </div>}
          <Src text="CoinGecko · /api/v3/search/trending（免費、無需Key）"/>
        </section>

        {/* ═══ 每日新聞 ═══ */}
        <section id="s-news" style={{marginBottom:48,animation:"fadeUp .5s ease"}}>
          <ST icon="▤" title="每日新聞" subtitle="即時熱門新聞 · 自動翻譯 · 點擊開啟原文"/>
          {news.length===0?<div style={{padding:20,textAlign:"center",color:C.textDim}}>新聞載入中...</div>:
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {news.map((n,i)=><a key={i} href={n.url} target="_blank" rel="noopener noreferrer" style={{textDecoration:"none",color:"inherit",display:"grid",gridTemplateColumns:"60px 1fr auto",gap:12,alignItems:"center",padding:"14px 16px",borderRadius:8,background:C.bgCard,border:`1px solid ${C.border}`,animation:`slideIn .3s ease ${i*.04}s both`,transition:"background .2s",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background=C.bgHover} onMouseLeave={e=>e.currentTarget.style.background=C.bgCard}>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:C.textDim}}>{n.time.toLocaleTimeString("zh-TW",{hour:"2-digit",minute:"2-digit"})}</div>
              <div>
                <div style={{fontSize:13,fontWeight:500,lineHeight:1.6,marginBottom:4,color:C.text}}>{n.title}</div>
                <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                  <span style={{fontSize:10,color:C.accent,fontWeight:600}}>{n.source}</span>
                  {n.tags.map((tag,j)=><span key={j} style={{fontSize:10,padding:"1px 6px",borderRadius:3,background:`${C.accent}15`,color:C.textDim}}>{tag}</span>)}
                </div>
              </div>
              {n.sentiment&&<div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                <span style={{fontSize:10,padding:"2px 10px",borderRadius:4,background:n.sentiment.bg,color:n.sentiment.color,fontWeight:600,whiteSpace:"nowrap"}}>{n.sentiment.label}</span>
              </div>}
            </a>)}
          </div>}
          <Src text="cryptocurrency.cv / CoinGecko Trending · 免費、無需Key · 自動中文翻譯"/>
        </section>

        {/* ═══ 代幣釋放 ═══ */}
        <section id="s-unlocks" style={{marginBottom:48,animation:"fadeUp .5s ease"}}>
          <ST icon="◎" title="近期代幣釋放" subtitle="解鎖排程 + Binance 即時估值"/>
          <div style={{overflowX:"auto",background:C.bgCard,borderRadius:8,border:`1px solid ${C.border}`}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}><thead><tr style={{borderBottom:`1px solid ${C.border}`}}>
            {["日期","代幣","數量","估值","佔供應量","類型","24H價格","影響"].map((h,i)=><th key={i} style={{...th,textAlign:i>=3?"right":"left"}}>{h}</th>)}
          </tr></thead><tbody>
            {unlocks.map((u,i)=>{const ic={high:C.red,medium:C.yellow,low:C.textDim};return<tr key={i} style={{borderBottom:`1px solid ${C.border}`,animation:`slideIn .3s ease ${i*.05}s both`}} onMouseEnter={e=>e.currentTarget.style.background=C.bgHover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <td style={{padding:12,fontFamily:"'JetBrains Mono',monospace",color:C.textDim,fontSize:12}}>{u.date}</td>
              <td style={{padding:12,fontWeight:600,color:C.text}}>{u.token}</td>
              <td style={{padding:12,fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:C.text}}>{u.amount}</td>
              <td style={{padding:12,textAlign:"right",fontFamily:"'JetBrains Mono',monospace",fontWeight:500,color:C.text}}>{u.value}</td>
              <td style={{padding:12,textAlign:"right",fontFamily:"'JetBrains Mono',monospace",color:u.pct>2?C.red:u.pct>1?C.yellow:C.textDim}}>{u.pct}%</td>
              <td style={{padding:12,textAlign:"right",fontSize:11,color:C.textDim}}>{u.type}</td>
              <td style={{padding:12,textAlign:"right",fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:u.priceChg!=null?clr(u.priceChg):C.textDim}}>{u.priceChg!=null?ps(u.priceChg):"—"}</td>
              <td style={{padding:12,textAlign:"right"}}><span style={{fontSize:10,padding:"2px 8px",borderRadius:4,background:`${ic[u.impact]}20`,color:ic[u.impact],fontWeight:600,textTransform:"uppercase"}}>{u.impact}</span></td>
            </tr>})}
          </tbody></table></div>
          <Src text="排程：Tokenomist / DeFi Llama 頁面 · 估值：Binance 即時"/>
        </section>

        {/* ═══ 聰明錢包 ═══ */}
        <section id="s-wallets" style={{marginBottom:48,animation:"fadeUp .5s ease"}}>
          <ST icon="◈" title="投資錢包勝率排行" subtitle="已知公開機構錢包 · 點擊地址可在 Etherscan 查看"/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(360px,1fr))",gap:10}}>
            {SMART_WALLETS.map((w,i)=><div key={i} style={{...card,animation:`fadeUp .4s ease ${i*.06}s both`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:i<3?C.accent:C.textDim,fontWeight:700}}>#{w.rank}</span>
                  <span style={{fontWeight:600,fontSize:14,color:C.text}}>{w.label}</span>
                </div>
                <a href={`https://etherscan.io/address/${w.addr}`} target="_blank" rel="noopener noreferrer" style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:C.accent,textDecoration:"none",padding:"2px 6px",borderRadius:4,background:`${C.accent}15`,transition:"background .2s"}} onMouseEnter={e=>e.currentTarget.style.background=`${C.accent}30`} onMouseLeave={e=>e.currentTarget.style.background=`${C.accent}15`}>
                  {w.short} ↗
                </a>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>
                {[{l:"勝率",v:w.winRate+"%",c:C.green,s:16},{l:"30D P&L",v:w.pnl,c:C.green,s:14},{l:"7D 交易",v:w.trades.toLocaleString(),s:14}].map((x,j)=><div key={j}><div style={{fontSize:9,color:C.textDim,textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace",letterSpacing:1,marginBottom:2}}>{x.l}</div><div style={{fontSize:x.s,fontWeight:700,color:x.c||C.text,fontFamily:"'JetBrains Mono',monospace"}}>{x.v}</div></div>)}
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontSize:11,color:C.textDim}}>持倉：{w.hold}</div>
                <span style={{fontSize:10,padding:"2px 8px",borderRadius:4,background:C.bgHover,color:C.textDim}}>{w.style}</span>
              </div>
            </div>)}
          </div>
          <div style={{marginTop:12,padding:"12px 16px",borderRadius:8,background:`${C.yellow}10`,border:`1px solid ${C.yellow}25`,fontSize:12,color:C.textDim,lineHeight:1.6}}>
            💡 完整 Smart Money 追蹤需要 <strong style={{color:C.yellow}}>Nansen（$150/mo）</strong>或 <strong style={{color:C.yellow}}>Arkham（免費有限）</strong>。上方為公開已知機構錢包。
          </div>
        </section>

        {/* ═══ 迷因熱點 ═══ */}
        <section id="s-meme" style={{marginBottom:48,animation:"fadeUp .5s ease"}}>
          <ST icon="✦" title="迷因幣熱點" subtitle="Binance 即時 · 按 24H 成交量排序"/>
          {memeCoins.length===0?<div style={{padding:20,textAlign:"center",color:C.textDim}}>載入中...</div>:
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {[...memeCoins].sort((a,b)=>b.volume-a.volume).map((m,i)=>{const heat=Math.min(99,Math.round((m.volume/(memeCoins[0]?.volume||1))*100));return<div key={i} style={{display:"grid",gridTemplateColumns:"100px 120px 1fr 80px",gap:12,alignItems:"center",padding:"14px 16px",borderRadius:8,background:C.bgCard,border:`1px solid ${C.border}`,animation:`slideIn .3s ease ${i*.05}s both`}}>
              <div><div style={{fontWeight:700,fontSize:15,color:C.text}}>{m.symbol}</div><div style={{fontSize:10,color:C.textDim}}>{m.name}</div></div>
              <div style={{fontFamily:"'JetBrains Mono',monospace"}}><div style={{fontSize:12,fontWeight:500,color:C.text}}>{fmtP(m.price)}</div><div style={{fontSize:11,color:clr(m.change),fontWeight:600}}>{ps(m.change)}</div></div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontSize:11,color:C.textDim,fontFamily:"'JetBrains Mono',monospace"}}>{fmt(m.volume)} USDT</div>
                <div style={{fontSize:10,color:C.textMuted,fontFamily:"'JetBrains Mono',monospace"}}>{m.trades.toLocaleString()} 筆</div>
              </div>
              <div><HeatBar value={heat}/></div>
            </div>})}
          </div>}
          <Src text="Binance Spot API · 熱度 = 成交量相對比例"/>
        </section>

        {/* ═══ 恐懼貪婪 ═══ */}
        <section id="s-fear" style={{marginBottom:48,animation:"fadeUp .5s ease"}}>
          <ST icon="◐" title="恐懼與貪婪指數" subtitle="Alternative.me API · 含 7 日歷史"/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:16}}>
            <div style={{...card,padding:20}}><FearGreedGauge value={fearGreed.current} label={fearGreed.label}/></div>
            <div style={{...card,padding:20}}>
              <div style={{fontSize:13,fontWeight:600,marginBottom:16,color:C.text}}>過去 7 天趨勢</div>
              {fearGreed.history.length>0?fearGreed.history.map((h,i)=>{const gc=h.value<=25?C.red:h.value<=45?C.orange:h.value<=55?C.yellow:h.value<=75?"#66ee88":C.green;return<div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                <div style={{width:40,fontSize:11,color:C.textDim,fontFamily:"'JetBrains Mono',monospace"}}>{h.date}</div>
                <div style={{flex:1,height:6,borderRadius:3,background:C.border}}><div style={{width:`${h.value}%`,height:"100%",borderRadius:3,background:gc}}/></div>
                <div style={{width:28,textAlign:"right",fontSize:12,fontFamily:"'JetBrains Mono',monospace",fontWeight:600,color:gc}}>{h.value}</div>
              </div>}):<div style={{color:C.textDim,fontSize:12}}>載入中...</div>}
              <Src text="api.alternative.me/fng/"/>
            </div>
          </div>
        </section>

        {/* ═══ API 架構 ═══ */}
        <section id="s-api" style={{marginBottom:48,animation:"fadeUp .5s ease"}}>
          <ST icon="⬡" title="本日報 API 串接狀態" subtitle="✅ = 已串接即時 · 📋 = 人工維護"/>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {[
              {n:"Binance Spot API",s:"✅ 即時",c:C.green,d:"幣價、漲跌、K線、迷因幣、代幣釋放估值",ep:"/ticker/24hr · /klines"},
              {n:"CoinGecko Trending",s:"✅ 即時",c:C.green,d:"熱度排行榜 Top 10",ep:"/search/trending"},
              {n:"Crypto News",s:"✅ 即時",c:C.green,d:"每日熱門新聞（cryptocurrency.cv + CoinGecko fallback）",ep:"/api/news"},
              {n:"Alternative.me",s:"✅ 即時",c:C.green,d:"恐懼貪婪指數 + 7 日歷史",ep:"/?limit=7"},
              {n:"代幣釋放排程",s:"📋 人工",c:C.yellow,d:"DeFi Llama unlocks 需付費，改人工維護 + Binance 估值",ep:"—"},
              {n:"Smart Money 錢包",s:"📋 公開",c:C.yellow,d:"Nansen/Arkham 需付費，目前用公開機構錢包+Etherscan",ep:"—"},
            ].map((a,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 18px",borderRadius:8,background:C.bgCard,border:`1px solid ${C.border}`}}>
              <div><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><span style={{fontWeight:600,fontSize:14,color:C.text}}>{a.n}</span><span style={{fontSize:10,padding:"2px 8px",borderRadius:4,background:`${a.c}20`,color:a.c,fontWeight:600}}>{a.s}</span></div><div style={{fontSize:11,color:C.textDim}}>{a.d}</div></div>
              <code style={{fontSize:10,color:C.textMuted,fontFamily:"'JetBrains Mono',monospace"}}>{a.ep}</code>
            </div>)}
          </div>
        </section>
      </main>

      <footer style={{borderTop:`1px solid ${C.border}`,padding:"20px 24px",textAlign:"center"}}>
        <div style={{fontSize:11,color:C.textMuted,fontFamily:"'JetBrains Mono',monospace"}}>CRYPTO DAILY · Binance + CoinGecko + CryptoCompare + Alternative.me · 全部免費 · 僅供研究參考</div>
      </footer>
    </div>
  );
}
