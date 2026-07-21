"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CategoryResult {
  category: string;
  score: number;
  scoreDelta: number | null;
  marketCount: number;
  sources: string[];
}
interface WorldIndex {
  score: number;
  scoreDelta: number | null;
  label: string;
  date: string;
  categories: CategoryResult[];
}
interface HistoryPoint { date: string; score: number; label: string; delta: number | null; }

type SignalType = "market" | "model" | "survey" | "venue" | "sentiment";
type Direction  = "CROWD_BULLISH" | "CROWD_BEARISH" | "ALIGNED";
type Significance = "high" | "medium" | "low";

interface DivergenceSignal {
  id: string;
  category: string;
  market: string;
  crowd: number;
  crowdSource: "Polymarket" | "Kalshi";
  crowdVolume: number;
  signal: number;
  signalSource: string;
  signalType: SignalType;
  gap: number;
  direction: Direction;
  significance: Significance;
}
interface WhaleEntry {
  minsAgo: number;
  wallet: string;
  winRate: number;
  totalVol: string;
  sizeK: number;
  market: string;
  side: "YES" | "NO";
  probBefore: number;
  probAfter: number;
}

// ─── Stress helpers ────────────────────────────────────────────────────────────

type StressLevel = "stable" | "moderate" | "stressed" | "critical";

function stressLevel(score: number): StressLevel {
  if (score >= 60) return "stable";
  if (score >= 42) return "moderate";
  if (score >= 26) return "stressed";
  return "critical";
}

const STRESS = {
  stable:   { border: "border-green-500/28",  bg: "bg-green-500/[0.04]",  bar: "bg-green-500",  text: "text-green-400",  accent: "#10b981", hex: "rgba(16,185,129," },
  moderate: { border: "border-amber-400/28",  bg: "bg-amber-400/[0.04]",  bar: "bg-amber-400",  text: "text-amber-400",  accent: "#f59e0b", hex: "rgba(245,158,11," },
  stressed: { border: "border-orange-500/30", bg: "bg-orange-500/[0.04]", bar: "bg-orange-500", text: "text-orange-400", accent: "#f97316", hex: "rgba(249,115,22," },
  critical: { border: "border-red-500/35",    bg: "bg-red-500/[0.05]",    bar: "bg-red-500",    text: "text-red-400",    accent: "#ef4444", hex: "rgba(239,68,68,"  },
};

const CATEGORY_WEIGHTS: Record<string, number> = {
  geopolitics: 0.25, economics: 0.25, politics: 0.20,
  technology: 0.10,  climate: 0.10,   crypto: 0.05, sports: 0.05,
};

// ─── Divergence signals — 35 across 8 categories ─────────────────────────────

const DIVERGENCE_SIGNALS: DivergenceSignal[] = [
  // ECONOMICS
  { id:"fed-jun-cut",       category:"economics",   market:"Fed cuts rates before June 2026",       crowd:41, crowdSource:"Kalshi",    crowdVolume:8_400_000, signal:68, signalSource:"CME FedWatch",      signalType:"market",    gap:-27, direction:"CROWD_BEARISH", significance:"high"   },
  { id:"fed-3-cuts",        category:"economics",   market:"Fed total cuts ≥ 3 in 2026",            crowd:33, crowdSource:"Polymarket",crowdVolume:3_200_000, signal:51, signalSource:"CME FF Futures",    signalType:"market",    gap:-18, direction:"CROWD_BEARISH", significance:"high"   },
  { id:"gdp-2pt5",          category:"economics",   market:"US GDP growth > 2.5% in 2026",          crowd:52, crowdSource:"Polymarket",crowdVolume:1_100_000, signal:71, signalSource:"Atlanta GDPNow",    signalType:"model",     gap:-19, direction:"CROWD_BEARISH", significance:"high"   },
  { id:"recession-q4",      category:"economics",   market:"US recession before Q4 2026",           crowd:34, crowdSource:"Kalshi",    crowdVolume:5_800_000, signal:22, signalSource:"NY Fed Model",      signalType:"model",     gap:+12, direction:"CROWD_BULLISH", significance:"medium" },
  { id:"cpi-3pct",          category:"economics",   market:"US CPI below 3% by Dec 2026",           crowd:61, crowdSource:"Kalshi",    crowdVolume:2_900_000, signal:48, signalSource:"TIPS Breakeven",    signalType:"market",    gap:+13, direction:"CROWD_BULLISH", significance:"medium" },
  { id:"unrate-5",          category:"economics",   market:"US unemployment exceeds 5% in 2026",    crowd:28, crowdSource:"Polymarket",crowdVolume:  890_000, signal:18, signalSource:"FOMC Projections",  signalType:"model",     gap:+10, direction:"CROWD_BULLISH", significance:"medium" },
  { id:"ecb-2cuts",         category:"economics",   market:"ECB cuts rates ≥ 2× in 2026",           crowd:67, crowdSource:"Polymarket",crowdVolume:1_400_000, signal:79, signalSource:"OIS Implied",       signalType:"market",    gap:-12, direction:"CROWD_BEARISH", significance:"medium" },
  // CRYPTO
  { id:"btc-120k",          category:"crypto",      market:"BTC above $120k by Dec 2026",           crowd:48, crowdSource:"Polymarket",crowdVolume:12_400_000,signal:71, signalSource:"Deribit Options",   signalType:"market",    gap:-23, direction:"CROWD_BEARISH", significance:"high"   },
  { id:"eth-5k",            category:"crypto",      market:"ETH above $5k by Dec 2026",             crowd:31, crowdSource:"Polymarket",crowdVolume:4_100_000, signal:44, signalSource:"Deribit Options",   signalType:"market",    gap:-13, direction:"CROWD_BEARISH", significance:"medium" },
  { id:"btc-100k-jun",      category:"crypto",      market:"BTC above $100k by Jun 2026",           crowd:62, crowdSource:"Polymarket",crowdVolume:8_700_000, signal:55, signalSource:"Deribit Options",   signalType:"market",    gap:+7,  direction:"CROWD_BULLISH", significance:"low"    },
  { id:"crypto-5t",         category:"crypto",      market:"Crypto market cap > $5T in 2026",       crowd:44, crowdSource:"Kalshi",    crowdVolume:2_200_000, signal:31, signalSource:"Analyst Consensus", signalType:"survey",    gap:+13, direction:"CROWD_BULLISH", significance:"medium" },
  { id:"btc-dom-60",        category:"crypto",      market:"BTC dominance above 60% in 2026",       crowd:38, crowdSource:"Kalshi",    crowdVolume:1_600_000, signal:52, signalSource:"On-chain Signal",   signalType:"market",    gap:-14, direction:"CROWD_BEARISH", significance:"medium" },
  // POLITICS
  { id:"dem-house",         category:"politics",    market:"Democrats win House majority 2026",     crowd:38, crowdSource:"Polymarket",crowdVolume:6_300_000, signal:47, signalSource:"RCP Polling Avg",   signalType:"survey",    gap:-9,  direction:"CROWD_BEARISH", significance:"medium" },
  { id:"trump-50",          category:"politics",    market:"Trump approval rating above 50%",       crowd:22, crowdSource:"Kalshi",    crowdVolume:3_100_000, signal:44, signalSource:"Polling Average",   signalType:"survey",    gap:-22, direction:"CROWD_BEARISH", significance:"high"   },
  { id:"immig-bill",        category:"politics",    market:"Major immigration bill passes 2026",    crowd:18, crowdSource:"Polymarket",crowdVolume:  740_000, signal:12, signalSource:"GovTrack Model",    signalType:"model",     gap:+6,  direction:"CROWD_BULLISH", significance:"low"    },
  { id:"scotus-vacancy",    category:"politics",    market:"Supreme Court vacancy filled 2026",     crowd:34, crowdSource:"Kalshi",    crowdVolume:1_800_000, signal:27, signalSource:"Analyst Survey",    signalType:"survey",    gap:+7,  direction:"CROWD_BULLISH", significance:"low"    },
  // SPORTS
  { id:"okc-nba",           category:"sports",      market:"Oklahoma City Thunder win NBA 2026",    crowd:24, crowdSource:"Polymarket",crowdVolume:  980_000, signal:31, signalSource:"DraftKings",        signalType:"market",    gap:-7,  direction:"CROWD_BEARISH", significance:"medium" },
  { id:"chiefs-sb",         category:"sports",      market:"Kansas City Chiefs win Super Bowl LX",  crowd:22, crowdSource:"Polymarket",crowdVolume:1_200_000, signal:18, signalSource:"Vegas Consensus",   signalType:"market",    gap:+4,  direction:"CROWD_BULLISH", significance:"low"    },
  { id:"rm-ucl",            category:"sports",      market:"Real Madrid win UEFA Champions League", crowd:28, crowdSource:"Polymarket",crowdVolume:2_100_000, signal:34, signalSource:"Bet365",            signalType:"market",    gap:-6,  direction:"CROWD_BEARISH", significance:"low"    },
  { id:"yanks-ws",          category:"sports",      market:"New York Yankees win World Series 2026",crowd:15, crowdSource:"Polymarket",crowdVolume:  870_000, signal:19, signalSource:"FanDuel",           signalType:"market",    gap:-4,  direction:"CROWD_BEARISH", significance:"low"    },
  // GEOPOLITICS
  { id:"ukraine-cfr",       category:"geopolitics", market:"Ukraine-Russia ceasefire by Dec 2026",  crowd:31, crowdSource:"Polymarket",crowdVolume:9_200_000, signal:18, signalSource:"GDELT Sentiment",   signalType:"sentiment", gap:+13, direction:"CROWD_BULLISH", significance:"medium" },
  { id:"iran-deal",         category:"geopolitics", market:"Iran nuclear deal signed in 2026",      crowd:14, crowdSource:"Polymarket",crowdVolume:1_400_000, signal:8,  signalSource:"Diplomatic Track",  signalType:"survey",    gap:+6,  direction:"CROWD_BULLISH", significance:"low"    },
  { id:"taiwan-incident",   category:"geopolitics", market:"China-Taiwan military incident 2026",   crowd:19, crowdSource:"Kalshi",    crowdVolume:3_700_000, signal:28, signalSource:"Analyst Consensus", signalType:"survey",    gap:-9,  direction:"CROWD_BEARISH", significance:"medium" },
  { id:"nato-expand",       category:"geopolitics", market:"New NATO member admitted 2026",         crowd:67, crowdSource:"Polymarket",crowdVolume:  620_000, signal:58, signalSource:"Diplomatic Track",  signalType:"survey",    gap:+9,  direction:"CROWD_BULLISH", significance:"medium" },
  // TECHNOLOGY
  { id:"gpt5-jul",          category:"technology",  market:"GPT-5 released before Jul 2026",        crowd:72, crowdSource:"Polymarket",crowdVolume:4_800_000, signal:55, signalSource:"Analyst Survey",    signalType:"survey",    gap:+17, direction:"CROWD_BULLISH", significance:"high"   },
  { id:"eu-ai-enforce",     category:"technology",  market:"EU AI Act enforcement begins 2026",     crowd:81, crowdSource:"Polymarket",crowdVolume:1_100_000, signal:88, signalSource:"Legislative Track", signalType:"model",     gap:-7,  direction:"CROWD_BEARISH", significance:"low"    },
  { id:"us-ai-reg",         category:"technology",  market:"Major US AI regulation bill passes",    crowd:24, crowdSource:"Kalshi",    crowdVolume:2_300_000, signal:15, signalSource:"GovTrack Model",    signalType:"model",     gap:+9,  direction:"CROWD_BULLISH", significance:"medium" },
  // CLIMATE
  { id:"temp-record-26",    category:"climate",     market:"2026 sets global temperature record",   crowd:44, crowdSource:"Polymarket",crowdVolume:  780_000, signal:62, signalSource:"NOAA Climate Model",signalType:"model",     gap:-18, direction:"CROWD_BEARISH", significance:"high"   },
  { id:"carbon-price",      category:"climate",     market:"US carbon pricing mechanism 2026",      crowd:19, crowdSource:"Kalshi",    crowdVolume:  430_000, signal:27, signalSource:"Policy Analyst",    signalType:"survey",    gap:-8,  direction:"CROWD_BEARISH", significance:"medium" },
  { id:"extreme-weather",   category:"climate",     market:"Extreme weather costs > 2023 levels",   crowd:61, crowdSource:"Polymarket",crowdVolume:  560_000, signal:73, signalSource:"Actuarial Model",   signalType:"model",     gap:-12, direction:"CROWD_BEARISH", significance:"medium" },
  // CROSS-VENUE
  { id:"xv-fed-jun",        category:"cross-venue", market:"Fed cuts before June (venue spread)",   crowd:41, crowdSource:"Polymarket",crowdVolume:8_400_000, signal:38, signalSource:"Kalshi",            signalType:"venue",     gap:+3,  direction:"CROWD_BULLISH", significance:"low"    },
  { id:"xv-btc-100k",       category:"cross-venue", market:"BTC > $100k (venue spread)",            crowd:62, crowdSource:"Polymarket",crowdVolume:8_700_000, signal:55, signalSource:"Kalshi",            signalType:"venue",     gap:+7,  direction:"CROWD_BULLISH", significance:"medium" },
  { id:"xv-recession",      category:"cross-venue", market:"US recession 2026 (venue spread)",      crowd:34, crowdSource:"Polymarket",crowdVolume:5_800_000, signal:24, signalSource:"Metaculus",         signalType:"venue",     gap:+10, direction:"CROWD_BULLISH", significance:"medium" },
  { id:"xv-ukraine",        category:"cross-venue", market:"Ukraine ceasefire (venue spread)",      crowd:31, crowdSource:"Polymarket",crowdVolume:9_200_000, signal:24, signalSource:"Metaculus",         signalType:"venue",     gap:+7,  direction:"CROWD_BULLISH", significance:"low"    },
  { id:"xv-gpt5",           category:"cross-venue", market:"GPT-5 before July (venue spread)",      crowd:72, crowdSource:"Polymarket",crowdVolume:4_800_000, signal:64, signalSource:"Metaculus",         signalType:"venue",     gap:+8,  direction:"CROWD_BULLISH", significance:"medium" },
];

// ─── Whale feed ────────────────────────────────────────────────────────────────

const WHALE_FEED: WhaleEntry[] = [
  { minsAgo:2,   wallet:"0x8f2a…c391", winRate:71, totalVol:"$4.2M", sizeK:120, market:"BTC > $120k Dec 2026",            side:"YES", probBefore:45, probAfter:48 },
  { minsAgo:14,  wallet:"0x3c91…d7f0", winRate:58, totalVol:"$890k", sizeK:45,  market:"Fed cuts before June",            side:"NO",  probBefore:43, probAfter:41 },
  { minsAgo:38,  wallet:"0x7f3a…1b82", winRate:83, totalVol:"$12M",  sizeK:200, market:"Ukraine ceasefire by Dec 2026",   side:"YES", probBefore:28, probAfter:31 },
  { minsAgo:61,  wallet:"0x1d4e…8a23", winRate:65, totalVol:"$2.1M", sizeK:67,  market:"Trump approval above 50%",        side:"NO",  probBefore:24, probAfter:22 },
  { minsAgo:94,  wallet:"0xaa12…3309", winRate:77, totalVol:"$6.7M", sizeK:180, market:"GPT-5 released before Jul 2026",  side:"YES", probBefore:68, probAfter:72 },
  { minsAgo:127, wallet:"0x55f8…cc01", winRate:61, totalVol:"$1.4M", sizeK:33,  market:"ECB cuts ≥ 2× in 2026",          side:"YES", probBefore:64, probAfter:67 },
  { minsAgo:182, wallet:"0x9e71…4d56", winRate:74, totalVol:"$3.3M", sizeK:95,  market:"US recession before Q4 2026",    side:"YES", probBefore:31, probAfter:34 },
];

// ─── Mini-history: derive per-category from world history ─────────────────────

function categoryMiniHistory(base: HistoryPoint[], targetScore: number): number[] {
  if (base.length === 0) return [];
  const lastBase = base[base.length - 1].score;
  const offset = targetScore - lastBase;
  return base.map(h => Math.max(4, Math.min(96, h.score + offset)));
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmtVol(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}
function sigColor(s: Significance) {
  return s === "high" ? "text-red-400" : s === "medium" ? "text-amber-400" : "text-white/35";
}
function gapColor(gap: number) {
  const abs = Math.abs(gap);
  if (abs >= 18) return { text: "text-red-400",    bg: "rgba(239,68,68,"    };
  if (abs >= 10) return { text: "text-amber-400",  bg: "rgba(245,158,11,"   };
  return           { text: "text-white/40",        bg: "rgba(255,255,255,"  };
}
function dirLabel(d: Direction) {
  if (d === "CROWD_BULLISH") return { label: "CROWD HIGH",  cls: "text-emerald-400" };
  if (d === "CROWD_BEARISH") return { label: "CROWD LOW",   cls: "text-red-400"     };
  return                            { label: "ALIGNED",     cls: "text-white/30"    };
}

const CATEGORY_LIST = ["all","economics","crypto","politics","sports","geopolitics","technology","climate","cross-venue"] as const;
type CategoryFilter = typeof CATEGORY_LIST[number];

// ─── TickerBar ─────────────────────────────────────────────────────────────────

function TickerBar({ categories }: { categories: CategoryResult[] }) {
  const items = [...categories].sort((a, b) => (b.scoreDelta ?? 0) - (a.scoreDelta ?? 0));
  const doubled = [...items, ...items];
  return (
    <div className="border-b border-white/6 bg-black/40 overflow-hidden h-8 flex items-center">
      <div className="shrink-0 px-3 border-r border-white/8 h-full flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" style={{ animation: "pulse-dot 1.4s ease-in-out infinite" }} />
        <span className="text-[8px] uppercase tracking-[0.2em] text-amber-400/70 font-semibold">Live</span>
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="flex gap-0 whitespace-nowrap" style={{ animation: "ticker-scroll 28s linear infinite" }}>
          {doubled.map((cat, i) => {
            const sl = stressLevel(cat.score);
            const c = STRESS[sl];
            const delta = cat.scoreDelta;
            return (
              <Link
                key={i}
                href={`/pwi/${cat.category}`}
                className="inline-flex items-center gap-2 px-5 border-r border-white/5 h-8 hover:bg-white/[0.03] transition-colors"
              >
                <span className="text-[8px] uppercase tracking-[0.16em] text-white/35">{cat.category}</span>
                <span className={`text-[10px] font-bold tabular-nums ${c.text}`}>{cat.score.toFixed(1)}</span>
                {delta !== null && (
                  <span className={`text-[8px] tabular-nums ${delta > 0 ? "text-green-400" : delta < 0 ? "text-red-400" : "text-white/20"}`}>
                    {delta > 0 ? "▲" : "▼"}{Math.abs(delta).toFixed(1)}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── AnimatedNumber ────────────────────────────────────────────────────────────

function AnimatedNumber({ target, decimals = 1, duration = 1400 }: { target: number; decimals?: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number>(0);
  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplay(target * ease);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);
  return <>{display.toFixed(decimals)}</>;
}

// ─── ScoreGauge ────────────────────────────────────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
  const [filled, setFilled] = useState(false);
  useEffect(() => { const t = setTimeout(() => setFilled(true), 300); return () => clearTimeout(t); }, []);
  const pct = Math.max(2, Math.min(98, score));
  return (
    <div className="mt-5">
      <div className="relative h-2 bg-white/[0.04] border border-white/6">
        <div className="absolute inset-0 flex">
          <div className="w-[26%] bg-red-500/10" />
          <div className="w-[16%] bg-orange-500/8" />
          <div className="w-[18%] bg-amber-500/6" />
          <div className="w-[40%] bg-green-500/8" />
        </div>
        <div
          className="absolute top-0 bottom-0 w-px bg-white/70 transition-all"
          style={{ left: `${filled ? pct : 0}%`, transitionDuration: "1.2s", transitionTimingFunction: "cubic-bezier(0.33,1,0.68,1)" }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-white border border-black/40 transition-all"
          style={{ left: `calc(${filled ? pct : 0}% - 4px)`, transitionDuration: "1.2s", transitionTimingFunction: "cubic-bezier(0.33,1,0.68,1)" }}
        />
      </div>
      <div className="flex justify-between mt-1 text-[7px] uppercase tracking-[0.12em] text-white/18">
        <span>0 · Extreme</span><span>26</span><span>42 · Moderate</span><span>60</span><span>100 · Stable</span>
      </div>
    </div>
  );
}

// ─── InteractiveSparkline ──────────────────────────────────────────────────────

function InteractiveSparkline({ history }: { history: HistoryPoint[] }) {
  const [tooltip, setTooltip] = useState<{ idx: number; xPct: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [drawn, setDrawn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setDrawn(true), 200); return () => clearTimeout(t); }, []);

  const W = 600; const H = 80; const PAD = 6;
  const scores = history.map(h => h.score);
  const min = history.length > 0 ? Math.min(...scores) : 0;
  const max = history.length > 0 ? Math.max(...scores) : 100;
  const range = max - min || 1;
  const pts = scores.map((s, i) => ({
    x: history.length > 1 ? (i / (scores.length - 1)) * W : 0,
    y: H - PAD - ((s - min) / range) * (H - PAD * 2),
  }));

  const handleMove = useCallback((e: React.MouseEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width;
    const idx = Math.max(0, Math.min(history.length - 1, Math.round(xPct * (history.length - 1))));
    setTooltip({ idx, xPct: pts[idx].x / W });
  }, [history.length, pts, W]);

  if (history.length < 2) return null;

  const lineD = `M ${pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" L ")}`;
  const areaD = `${lineD} L ${W},${H} L 0,${H} Z`;
  const totalLen = pts.reduce((acc, p, i) => {
    if (i === 0) return 0;
    const dx = p.x - pts[i-1].x; const dy = p.y - pts[i-1].y;
    return acc + Math.sqrt(dx*dx + dy*dy);
  }, 0);
  const minIdx = scores.indexOf(min); const maxIdx = scores.indexOf(max);

  const tip = tooltip !== null ? history[tooltip.idx] : null;
  const tipPt = tooltip !== null ? pts[tooltip.idx] : null;

  return (
    <div className="relative select-none">
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" aria-hidden="true" className="overflow-visible">
        <defs>
          <linearGradient id="sfill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#f59e0b" stopOpacity="0.20" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.01" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#sfill)" />
        <path
          d={lineD} fill="none" stroke="#f59e0b" strokeWidth="1.8"
          strokeLinejoin="round" strokeLinecap="round" opacity={0.75}
          strokeDasharray={drawn ? "none" : `${totalLen}`}
          strokeDashoffset={drawn ? "0" : `${totalLen}`}
          style={{ transition: drawn ? "stroke-dashoffset 1.4s cubic-bezier(0.33,1,0.68,1)" : undefined }}
        />
        <circle cx={pts[minIdx].x} cy={pts[minIdx].y} r="3" fill="rgba(239,68,68,0.85)" />
        <circle cx={pts[maxIdx].x} cy={pts[maxIdx].y} r="3" fill="rgba(16,185,129,0.85)" />
        <circle cx={pts[pts.length-1].x} cy={pts[pts.length-1].y} r="4.5" fill="#f59e0b" opacity={0.9} />
        {/* hover crosshair */}
        {tipPt && (
          <>
            <line x1={tipPt.x} y1={0} x2={tipPt.x} y2={H} stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx={tipPt.x} cy={tipPt.y} r="4" fill="#f59e0b" stroke="#050505" strokeWidth="1.5" />
          </>
        )}
        <rect width={W} height={H} fill="transparent" onMouseMove={handleMove} onMouseLeave={() => setTooltip(null)} style={{ cursor: "crosshair" }} />
      </svg>
      {tip && tipPt && (
        <div
          className="absolute bottom-full mb-2 pointer-events-none z-30"
          style={{ left: `${tooltip!.xPct * 100}%`, transform: tooltip!.xPct > 0.75 ? "translateX(-100%)" : tooltip!.xPct < 0.25 ? "translateX(0)" : "translateX(-50%)" }}
        >
          <div className="bg-[#0a0a0a] border border-white/12 px-3 py-2 whitespace-nowrap">
            <p className="text-[8px] uppercase tracking-[0.14em] text-white/30 mb-1">{new Date(tip.date + "T00:00:00Z").toLocaleDateString("en-US", { month:"short", day:"numeric" })}</p>
            <p className="text-[14px] font-bold tabular-nums text-white/88">{tip.score.toFixed(1)}</p>
            <p className={`text-[8px] uppercase tracking-[0.1em] ${stressLevel(tip.score) === "stable" ? "text-green-400" : stressLevel(tip.score) === "moderate" ? "text-amber-400" : stressLevel(tip.score) === "stressed" ? "text-orange-400" : "text-red-400"}`}>{tip.label}</p>
            {tip.delta !== null && (
              <p className={`text-[9px] tabular-nums mt-0.5 ${tip.delta > 0 ? "text-green-400" : "text-red-400"}`}>{tip.delta > 0 ? "+" : ""}{tip.delta.toFixed(1)}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MiniSparkline ─────────────────────────────────────────────────────────────

function MiniSparkline({ points, color }: { points: number[]; color: string }) {
  const [drawn, setDrawn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setDrawn(true), 600 + Math.random() * 400); return () => clearTimeout(t); }, []);
  if (points.length < 2) return null;
  const W = 72; const H = 22;
  const min = Math.min(...points); const max = Math.max(...points); const range = max - min || 1;
  const pts = points.map((v, i) => ({ x: (i / (points.length - 1)) * W, y: H - ((v - min) / range) * H }));
  const d = `M ${pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" L ")}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden="true" style={{ overflow: "visible" }}>
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" opacity={0.6}
        strokeDasharray={drawn ? "none" : "200"} strokeDashoffset={drawn ? "0" : "200"}
        style={{ transition: "stroke-dashoffset 0.9s ease-out" }}
      />
      <circle cx={pts[pts.length-1].x} cy={pts[pts.length-1].y} r="2.5" fill={color} opacity={0.8} />
    </svg>
  );
}

// ─── RadarChart ────────────────────────────────────────────────────────────────

function RadarChart({ categories }: { categories: CategoryResult[] }) {
  if (categories.length === 0) return null;
  const cx = 130; const cy = 130; const maxR = 95; const n = categories.length;
  const axes = categories.map((cat, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    const cos = Math.cos(angle); const sin = Math.sin(angle);
    const r = (cat.score / 100) * maxR;
    return { cat, cos, sin, tip: { x: cx + maxR * cos, y: cy + maxR * sin }, data: { x: cx + r * cos, y: cy + r * sin } };
  });
  const ringPts = (pct: number) => axes.map(a => {
    const r = (pct / 100) * maxR;
    return `${(cx + r * a.cos).toFixed(1)},${(cy + r * a.sin).toFixed(1)}`;
  }).join(" ");
  const dataPoly = axes.map(a => `${a.data.x.toFixed(1)},${a.data.y.toFixed(1)}`).join(" ");
  const dotFill: Record<StressLevel, string> = { stable: "rgba(34,197,94,0.9)", moderate: "rgba(251,191,36,0.9)", stressed: "rgba(249,115,22,0.9)", critical: "rgba(239,68,68,0.9)" };
  const LABEL_R = maxR + 20;
  return (
    <svg viewBox="0 0 260 260" width="100%" aria-hidden="true" style={{ overflow: "visible" }}>
      {[25,50,75,100].map(pct => (
        <polygon key={pct} points={ringPts(pct)} fill="none"
          stroke={pct === 100 ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.05)"}
          strokeWidth={pct === 100 ? "1.5" : "1"} strokeDasharray={pct === 100 ? undefined : "3 3"} />
      ))}
      {axes.map((a, i) => <line key={i} x1={cx} y1={cy} x2={a.tip.x.toFixed(1)} y2={a.tip.y.toFixed(1)} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />)}
      <polygon points={dataPoly} fill="rgba(251,191,36,0.10)" stroke="rgba(251,191,36,0.55)" strokeWidth="1.5" strokeLinejoin="round" />
      {axes.map((a, i) => <circle key={i} cx={a.data.x.toFixed(1)} cy={a.data.y.toFixed(1)} r="4" fill={dotFill[stressLevel(a.cat.score)]} />)}
      {axes.map((a, i) => {
        const lx = (cx + LABEL_R * a.cos).toFixed(1); const ly = (cy + LABEL_R * a.sin).toFixed(1);
        const anchor = a.cos > 0.25 ? "start" : a.cos < -0.25 ? "end" : "middle";
        const base = a.sin > 0.25 ? "hanging" : a.sin < -0.25 ? "auto" : "middle";
        return <text key={i} x={lx} y={ly} textAnchor={anchor} dominantBaseline={base} fontSize="7" fill="rgba(255,255,255,0.28)">{a.cat.category.toUpperCase()}</text>;
      })}
      <circle cx={cx} cy={cy} r="2.5" fill="rgba(255,255,255,0.12)" />
    </svg>
  );
}

// ─── DivergenceScanner ─────────────────────────────────────────────────────────

function DivergenceScanner() {
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const [sortBy, setSortBy] = useState<"gap" | "significance">("gap");

  const filtered = DIVERGENCE_SIGNALS
    .filter(s => filter === "all" || s.category === filter)
    .sort((a, b) => sortBy === "gap" ? Math.abs(b.gap) - Math.abs(a.gap) : (b.significance === "high" ? 2 : b.significance === "medium" ? 1 : 0) - (a.significance === "high" ? 2 : a.significance === "medium" ? 1 : 0));

  const highCount = filtered.filter(s => s.significance === "high").length;

  return (
    <section className="relative z-10 border-t border-white/6">
      {/* Header */}
      <div className="border-b border-white/6 bg-white/[0.012]">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
          <div className="flex items-center gap-4">
            <p className="text-[9px] uppercase tracking-[0.26em] text-white/35 font-semibold">Divergence Scanner</p>
            {highCount > 0 && (
              <span className="text-[7px] uppercase tracking-[0.16em] px-2 py-0.5 border border-red-500/30 text-red-400/70 bg-red-500/[0.04]">
                {highCount} HIGH SIGNAL
              </span>
            )}
            <span className="text-[8px] text-white/18">{filtered.length} signals</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[7px] uppercase tracking-[0.14em] text-white/22 mr-1">Sort:</span>
            {(["gap","significance"] as const).map(s => (
              <button key={s} onClick={() => setSortBy(s)}
                className={`text-[7px] uppercase tracking-[0.14em] px-2.5 py-1 border transition-colors ${sortBy === s ? "border-amber-400/40 text-amber-400/80 bg-amber-400/[0.06]" : "border-white/8 text-white/25 hover:text-white/45"}`}>
                {s === "gap" ? "Gap Size" : "Significance"}
              </button>
            ))}
          </div>
        </div>
        {/* Category filter pills */}
        <div className="max-w-7xl mx-auto px-6 md:px-10 pb-3 flex gap-1.5 flex-wrap">
          {CATEGORY_LIST.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              className={`text-[7px] uppercase tracking-[0.14em] px-3 py-1 border transition-all ${filter === cat ? "border-amber-400/45 text-amber-400 bg-amber-400/[0.07]" : "border-white/8 text-white/25 hover:text-white/50 hover:border-white/15"}`}>
              {cat === "all" ? `All (${DIVERGENCE_SIGNALS.length})` : `${cat} (${DIVERGENCE_SIGNALS.filter(s => s.category === cat).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-0">
        {/* Column headers */}
        <div className="grid grid-cols-[1fr_80px_80px_140px_60px_100px_96px] gap-0 border-b border-white/8 bg-white/[0.012] px-4 py-2.5 text-[7px] uppercase tracking-[0.16em] text-white/22 hidden md:grid">
          <span>Market</span>
          <span className="text-right">Crowd %</span>
          <span className="text-right">Signal %</span>
          <span className="text-center">Gap Visualiser</span>
          <span className="text-right">Gap</span>
          <span className="text-center">Source</span>
          <span className="text-center">Direction</span>
        </div>

        <div className="divide-y divide-white/[0.04]">
          {filtered.map((sig, i) => {
            const gc   = gapColor(sig.gap);
            const dir  = dirLabel(sig.direction);
            const absGap = Math.abs(sig.gap);
            // Gap bar: 0–100 range, mark crowd and signal
            const lo = Math.min(sig.crowd, sig.signal);
            const hi = Math.max(sig.crowd, sig.signal);
            const barColor = sig.direction === "CROWD_BULLISH" ? "rgba(16,185,129,0.55)" : sig.direction === "CROWD_BEARISH" ? "rgba(239,68,68,0.55)" : "rgba(255,255,255,0.2)";

            return (
              <div key={sig.id} className={`grid grid-cols-1 md:grid-cols-[1fr_80px_80px_140px_60px_100px_96px] gap-0 px-4 py-3 items-center hover:bg-white/[0.018] transition-colors ${i % 2 === 0 ? "" : "bg-white/[0.006]"}`}>
                {/* Market */}
                <div className="min-w-0 flex items-start gap-2 pr-4">
                  <span className={`shrink-0 mt-0.5 text-[6px] uppercase tracking-[0.12em] px-1 py-0.5 border ${sigColor(sig.significance) === "text-red-400" ? "border-red-500/25 text-red-400/60" : sigColor(sig.significance) === "text-amber-400" ? "border-amber-400/25 text-amber-400/60" : "border-white/8 text-white/25"}`}>
                    {sig.significance}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] text-white/75 leading-snug truncate">{sig.market}</p>
                    <p className="text-[8px] text-white/22 uppercase tracking-[0.1em] mt-0.5">{sig.crowdSource} · {sig.category}</p>
                  </div>
                </div>
                {/* Crowd % */}
                <div className="text-right hidden md:block">
                  <span className="text-[13px] font-bold tabular-nums text-white/80">{sig.crowd}%</span>
                  <p className="text-[7px] text-white/22 uppercase tracking-[0.1em]">{sig.crowdSource}</p>
                </div>
                {/* Signal % */}
                <div className="text-right hidden md:block">
                  <span className="text-[13px] font-bold tabular-nums text-white/55">{sig.signal}%</span>
                  <p className="text-[7px] text-white/22 uppercase tracking-[0.1em]">{sig.signalType}</p>
                </div>
                {/* Gap bar */}
                <div className="hidden md:flex items-center px-3">
                  <div className="relative w-full h-1 bg-white/[0.06]">
                    {/* filled gap segment */}
                    <div className="absolute top-0 h-full" style={{ left: `${lo}%`, width: `${hi - lo}%`, background: barColor }} />
                    {/* crowd dot */}
                    <div className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-black/30" style={{ left: `calc(${sig.crowd}% - 4px)`, background: "#f59e0b" }} />
                    {/* signal dot */}
                    <div className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full border border-black/20" style={{ left: `calc(${sig.signal}% - 3px)`, background: "rgba(255,255,255,0.45)" }} />
                  </div>
                </div>
                {/* Gap number */}
                <div className="text-right hidden md:block">
                  <span className={`text-[13px] font-bold tabular-nums ${gc.text}`}>
                    {sig.gap > 0 ? "+" : ""}{sig.gap}
                  </span>
                  <p className="text-[7px] text-white/18 mt-0.5">pts</p>
                </div>
                {/* Source */}
                <div className="text-center hidden md:block">
                  <span className="text-[8px] text-white/38 leading-snug">{sig.signalSource}</span>
                </div>
                {/* Direction */}
                <div className="text-center hidden md:block">
                  <span className={`text-[7px] uppercase tracking-[0.12em] font-semibold ${dir.cls}`}>{dir.label}</span>
                  <p className="text-[7px] text-white/18 mt-0.5">{fmtVol(sig.crowdVolume)}</p>
                </div>
                {/* Mobile row */}
                <div className="md:hidden mt-1 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-[12px] font-bold tabular-nums text-amber-400">{sig.crowd}%</span>
                    <span className="text-[8px] text-white/30">vs {sig.signalSource}</span>
                    <span className="text-[12px] font-bold tabular-nums text-white/45">{sig.signal}%</span>
                  </div>
                  <span className={`text-[11px] font-bold tabular-nums ${gc.text}`}>{sig.gap > 0 ? "+" : ""}{sig.gap}pt</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── WhaleRadar ────────────────────────────────────────────────────────────────

function WhaleRadar() {
  const [tick, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 12_000); return () => clearInterval(id); }, []);
  const offset = tick % WHALE_FEED.length;
  const visible = [...WHALE_FEED.slice(offset), ...WHALE_FEED.slice(0, offset)].slice(0, 5);
  return (
    <section className="relative z-10 border-t border-white/6">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ animation: "pulse-dot 1.8s ease-in-out infinite" }} />
            <p className="text-[8px] uppercase tracking-[0.24em] text-white/28">Polymarket Whale Radar</p>
          </div>
          <p className="text-[7px] uppercase tracking-[0.14em] text-white/18">Large positions · On-chain</p>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {visible.map((w, i) => (
            <div key={i} className="grid grid-cols-[60px_1fr_80px_80px] md:grid-cols-[60px_1fr_100px_80px_80px_80px] items-center gap-4 py-2.5 hover:bg-white/[0.015] transition-colors px-1">
              <span className="text-[8px] tabular-nums text-white/22">{w.minsAgo < 60 ? `${w.minsAgo}m ago` : `${Math.floor(w.minsAgo/60)}h ago`}</span>
              <div className="min-w-0">
                <p className="text-[10px] text-white/65 truncate">{w.market}</p>
                <p className="text-[7px] text-white/22 mt-0.5">{w.wallet}</p>
              </div>
              <div className="hidden md:block text-right">
                <span className={`text-[10px] font-bold ${w.side === "YES" ? "text-emerald-400" : "text-red-400"}`}>{w.side}</span>
                <p className="text-[7px] text-white/22">{w.probBefore}% → {w.probAfter}%</p>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold tabular-nums text-amber-400">${w.sizeK}k</span>
              </div>
              <div className="hidden md:block text-right">
                <span className="text-[10px] tabular-nums text-white/45">{w.winRate}%</span>
                <p className="text-[7px] text-white/22">win rate</p>
              </div>
              <div className="hidden md:block text-right">
                <span className="text-[8px] text-white/22">{w.totalVol}</span>
                <p className="text-[7px] text-white/18">lifetime</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Main Terminal ─────────────────────────────────────────────────────────────

export default function PWITerminal({ worldData, history }: { worldData: WorldIndex; history: HistoryPoint[] }) {
  const sl = stressLevel(worldData.score);
  const sc = STRESS[sl];
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => { const id = setInterval(() => setElapsed(e => e + 1), 1000); return () => clearInterval(id); }, []);

  const sortedCats = [...worldData.categories].sort((a, b) => (CATEGORY_WEIGHTS[b.category] ?? 0) - (CATEGORY_WEIGHTS[a.category] ?? 0));

  // interpretation
  const sorted = [...worldData.categories].sort((a, b) => a.score - b.score);
  const low  = sorted[0];
  const high = sorted[sorted.length - 1];
  const stressedCount = worldData.categories.filter(c => c.score < 42).length;
  const score = worldData.score;
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const interp = !low || !high
    ? "Index data loading…"
    : score >= 70
    ? `Markets broadly signal stability. ${cap(high.category)} leads directional confidence (${high.score.toFixed(0)}). ${stressedCount === 0 ? "No categories in elevated stress." : `${cap(low.category)} remains primary uncertainty at ${low.score.toFixed(0)}.`}`
    : score >= 55
    ? `Measured confidence with pockets of uncertainty. ${cap(low.category)} is primary stress driver (${low.score.toFixed(0)}), while ${cap(high.category)} anchors the index at ${high.score.toFixed(0)}. Monitor cross-category contagion.`
    : score >= 40
    ? `Mixed signals across prediction markets. ${stressedCount} ${stressedCount === 1 ? "category" : "categories"} below uncertainty threshold — ${cap(low.category)} most stressed at ${low.score.toFixed(0)}. Risk-off positioning building.`
    : `Broad market stress. Prediction markets pricing significant instability across ${stressedCount} categories. ${cap(low.category)} registers extreme uncertainty at ${low.score.toFixed(0)}. Historically rare low-confidence signal.`;

  const formattedDate = new Date(worldData.date + "T00:00:00Z").toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric", timeZone:"UTC" });
  const histStart = history.length > 0 ? new Date(history[0].date + "T00:00:00Z").toLocaleDateString("en-US", { month:"short", day:"numeric" }) : null;
  const histEnd   = history.length > 0 ? new Date(history[history.length - 1].date + "T00:00:00Z").toLocaleDateString("en-US", { month:"short", day:"numeric" }) : null;

  const totalMarkets = worldData.categories.reduce((s, c) => s + c.marketCount, 0);
  const allSources = Array.from(new Set(worldData.categories.flatMap(c => c.sources)));
  const highDivergence = DIVERGENCE_SIGNALS.filter(s => s.significance === "high").length;

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <style>{`
        @keyframes pulse-dot { 0%,100%{opacity:.4;transform:scale(1)} 50%{opacity:1;transform:scale(1.25)} }
        @keyframes ticker-scroll { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes bar-in { from{width:0} to{width:var(--w)} }
      `}</style>

      {/* Grid background */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{ backgroundImage: "linear-gradient(to right,rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,0.025) 1px,transparent 1px)", backgroundSize: "64px 64px" }} />
      <div className="fixed pointer-events-none z-0" style={{ top:0, left:"50%", transform:"translateX(-50%)", width:"900px", height:"350px", background:"radial-gradient(ellipse at center top,rgba(251,191,36,0.05) 0%,transparent 65%)" }} />

      {/* ── Nav ── */}
      <nav className="relative z-50 flex items-center justify-between px-6 md:px-10 py-3.5 border-b border-white/6" style={{ backdropFilter:"blur(12px)", background:"rgba(5,5,5,0.88)" }}>
        <Link href="/" className="flex items-center gap-2.5 opacity-80 hover:opacity-100 transition-opacity">
          <Image src="/assets/logo-icon-dark.png" alt="Predifi" width={20} height={20} className="w-5 h-5" />
          <span className="text-[10px] uppercase tracking-[0.28em] font-semibold hidden sm:inline">Predifi</span>
        </Link>
        <div className="flex items-center gap-3">
          {/* LIVE badge */}
          <div className="flex items-center gap-1.5 border border-green-500/20 bg-green-500/[0.04] px-2.5 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" style={{ animation: "pulse-dot 1.4s ease-in-out infinite" }} />
            <span className="text-[7px] uppercase tracking-[0.2em] text-green-400/80">Live</span>
          </div>
          <span className="text-white/15 text-xs hidden sm:inline">·</span>
          <span className="text-[8px] uppercase tracking-[0.18em] text-white/28 hidden sm:inline">World Index</span>
          <span className="text-white/15 text-xs hidden sm:inline">·</span>
          <span className="text-[8px] tabular-nums text-white/22 hidden sm:inline">{formattedDate} · 05:00 UTC</span>
          {highDivergence > 0 && (
            <span className="text-[7px] uppercase tracking-[0.14em] px-2 py-0.5 border border-red-500/30 text-red-400/70 hidden md:inline-block">
              {highDivergence} HIGH DIV
            </span>
          )}
        </div>
        <Link href="/waitlist" className="text-[8px] uppercase tracking-[0.16em] text-amber-400/60 hover:text-amber-300 border border-amber-400/20 hover:border-amber-400/35 px-3 py-1.5 transition-all">
          Join waitlist
        </Link>
      </nav>

      {/* ── Ticker ── */}
      <TickerBar categories={worldData.categories} />

      {/* ══ HERO: score + radar + sparkline ══════════════════════════════════════ */}
      <section className="relative z-10 border-b border-white/6">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px_1fr] gap-8 items-start">

            {/* Left: score block */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <p className="text-[8px] uppercase tracking-[0.24em] text-white/22">Predifi World Index</p>
                <span className={`text-[7px] uppercase tracking-[0.14em] px-1.5 py-0.5 border ${sc.border} ${sc.text} opacity-60`}>{sl}</span>
              </div>
              <div className="flex items-baseline gap-3 mb-1">
                <span className="text-[88px] font-black tabular-nums leading-none text-white/88" style={{ fontFamily:"var(--font-display,Inter,system-ui,sans-serif)", letterSpacing:"-0.02em" }}>
                  <AnimatedNumber target={worldData.score} decimals={1} />
                </span>
                <div className="flex flex-col gap-1 pb-2">
                  <span className="text-white/22 text-base">/100</span>
                  {worldData.scoreDelta !== null && (
                    <span className={`text-sm tabular-nums font-semibold ${worldData.scoreDelta > 0 ? "text-green-400" : worldData.scoreDelta < 0 ? "text-red-400" : "text-white/28"}`}>
                      {worldData.scoreDelta > 0 ? "+" : ""}{worldData.scoreDelta.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
              <p className={`text-[11px] font-bold uppercase tracking-[0.16em] mb-4 ${sc.text}`}>{worldData.label}</p>
              <ScoreGauge score={worldData.score} />

              {/* Stat strip */}
              <div className="grid grid-cols-3 gap-px mt-5 border border-white/6">
                {[
                  { label:"Markets", value: totalMarkets.toString() },
                  { label:"Sources",  value: allSources.length.toString() },
                  { label:"Divergences", value: `${highDivergence} high` },
                ].map(s => (
                  <div key={s.label} className="bg-white/[0.015] px-3 py-2.5 text-center">
                    <p className="text-[16px] font-black tabular-nums text-white/80">{s.value}</p>
                    <p className="text-[7px] uppercase tracking-[0.14em] text-white/22 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Interpretation */}
              <div className={`mt-4 border ${sc.border} ${sc.bg} p-4`}>
                <p className="text-[7px] uppercase tracking-[0.2em] text-white/22 mb-2">Signal · {formattedDate}</p>
                <p className="text-[11px] leading-[1.8] text-white/55">{interp}</p>
              </div>
            </div>

            {/* Centre: radar */}
            <div className="border border-white/8 bg-white/[0.012] p-4">
              <p className="text-[7px] uppercase tracking-[0.2em] text-white/20 mb-3">Category Radar</p>
              <RadarChart categories={sortedCats} />
              <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1">
                {[{l:"Stable",c:"bg-green-500"},{l:"Moderate",c:"bg-amber-400"},{l:"Stressed",c:"bg-orange-500"},{l:"Critical",c:"bg-red-500"}].map(i => (
                  <div key={i.l} className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${i.c} opacity-75`} />
                    <span className="text-[7px] uppercase tracking-[0.1em] text-white/22">{i.l}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: sparkline */}
            <div className="border border-white/8 bg-white/[0.012] p-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[7px] uppercase tracking-[0.2em] text-white/20">30-Day Trend</p>
                <div className="flex items-center gap-3 text-[7px] text-white/20 uppercase tracking-[0.1em]">
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500/80" /> Hi</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500/80" /> Lo</span>
                </div>
              </div>
              <InteractiveSparkline history={history} />
              {histStart && histEnd && (
                <div className="flex justify-between mt-3 text-[7px] uppercase tracking-[0.1em] text-white/18">
                  <span>{histStart}</span>
                  <span className="tabular-nums">{history[0]?.score.toFixed(1)} → {history[history.length-1]?.score.toFixed(1)}</span>
                  <span>{histEnd}</span>
                </div>
              )}
              {/* Score band legend */}
              <div className="mt-4 border border-white/6 divide-y divide-white/[0.04]">
                {[{label:"Stable",range:"60–100",c:"text-green-400"},{label:"Moderate",range:"42–60",c:"text-amber-400"},{label:"Stressed",range:"26–42",c:"text-orange-400"},{label:"Critical",range:"0–26",c:"text-red-400"}].map(b => (
                  <div key={b.label} className="flex items-center justify-between px-3 py-1.5">
                    <span className={`text-[7px] uppercase tracking-[0.12em] ${b.c}`}>{b.label}</span>
                    <span className="text-[7px] tabular-nums text-white/22">{b.range}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ DIVERGENCE SCANNER ═══════════════════════════════════════════════════ */}
      <DivergenceScanner />

      {/* ══ CATEGORY GRID ════════════════════════════════════════════════════════ */}
      <section className="relative z-10 border-t border-white/6">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-6">
          <p className="text-[8px] uppercase tracking-[0.26em] text-white/22 mb-5">Category Breakdown</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {sortedCats.map((cat, idx) => {
              const sl2 = stressLevel(cat.score);
              const c2  = STRESS[sl2];
              const mini = categoryMiniHistory(history, cat.score);
              const weight = ((CATEGORY_WEIGHTS[cat.category] ?? 0) * 100).toFixed(0);
              return (
                <Link key={cat.category} href={`/pwi/${cat.category}`}
                  className={`group relative border ${c2.border} ${c2.bg} p-4 hover:border-opacity-60 transition-all duration-200`}
                  style={sl2 === "critical" ? { boxShadow:"0 0 20px rgba(239,68,68,0.10)" } : sl2 === "stressed" ? { boxShadow:"0 0 14px rgba(249,115,22,0.08)" } : undefined}
                >
                  <div className={`absolute top-0 left-0 right-0 h-px ${c2.bar} opacity-35`} />
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className={`text-[7px] uppercase tracking-[0.2em] ${c2.text} opacity-55 mb-1`}>{cat.category}</p>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[26px] font-black tabular-nums leading-none text-white/85" style={{ fontFamily:"var(--font-display,Inter,system-ui,sans-serif)" }}>
                          {cat.score.toFixed(1)}
                        </span>
                        {cat.scoreDelta !== null && (
                          <span className={`text-[9px] tabular-nums ${cat.scoreDelta > 0 ? "text-green-400" : cat.scoreDelta < 0 ? "text-red-400" : "text-white/25"}`}>
                            {cat.scoreDelta > 0 ? "+" : ""}{cat.scoreDelta.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                    <MiniSparkline points={mini} color={c2.accent} />
                  </div>
                  {/* Score bar */}
                  <div className="h-px bg-white/[0.06] mb-2.5 relative overflow-hidden">
                    <div className={`absolute top-0 left-0 h-full ${c2.bar} opacity-50`}
                      style={{ width: `${cat.score}%`, animation:`bar-in 0.9s cubic-bezier(0.33,1,0.68,1) ${idx * 80}ms both`, ["--w" as string]:`${cat.score}%` }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-[6px] uppercase tracking-[0.16em] px-1 py-0.5 border ${c2.border} ${c2.text} opacity-50`}>{sl2}</span>
                    <span className="text-[7px] text-white/18">{weight}% wt</span>
                  </div>
                  {cat.marketCount > 0 && <p className="text-[6px] text-white/18 mt-1.5">{cat.marketCount} markets · {cat.sources.slice(0,2).join(", ")}</p>}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ WHALE RADAR ══════════════════════════════════════════════════════════ */}
      <WhaleRadar />

      {/* ══ FOOTER ═══════════════════════════════════════════════════════════════ */}
      <footer className="relative z-10 border-t border-white/6 px-6 md:px-10 py-5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Image src="/assets/logo-icon-dark.png" alt="" width={12} height={12} className="opacity-20" />
            <span className="text-[7px] uppercase tracking-[0.18em] text-white/18">© 2026 Predifi · PWI v1</span>
          </div>
          <div className="flex items-center gap-5 flex-wrap justify-center">
            {[{l:"Categories",h:"/pwi"},{l:"Waitlist",h:"/waitlist"},{l:"Blog",h:"https://blog.predifi.com"},{l:"Terms",h:"/tos"},{l:"Privacy",h:"/privacy"}].map(({l,h}) => (
              <a key={l} href={h} className="text-[7px] uppercase tracking-[0.14em] text-white/18 hover:text-white/45 transition-colors">{l}</a>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400/50" />
            <span className="text-[7px] uppercase tracking-[0.14em] text-white/18">Polymarket · Kalshi</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
