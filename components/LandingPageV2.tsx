"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Copy, Check, TrendingUp, Globe, Zap, Shield } from "lucide-react";
import { toast } from "sonner";

// ─── Parlay Section ────────────────────────────────────────────────────────────

type AccentKey = "purple" | "amber" | "blue" | "green";
type LegCount  = 2 | 3 | 4;

interface ParlayLeg {
  question: string;
  category: string;
  prob:     number;
  accent:   AccentKey;
  label:    string;
}

const ACCENT: Record<AccentKey, { border: string; bg: string; text: string; bar: string; dot: string; glow: string; lineStart: string }> = {
  purple: { border: "border-purple-400/35", bg: "bg-purple-500/8",  text: "text-purple-300", bar: "bg-purple-400", dot: "rgba(139,92,246,1)",  glow: "rgba(139,92,246,0.35)", lineStart: "rgba(139,92,246,0.75)" },
  amber:  { border: "border-amber-400/35",  bg: "bg-amber-500/8",   text: "text-amber-300",  bar: "bg-amber-400",  dot: "rgba(251,191,36,1)",  glow: "rgba(251,191,36,0.35)",  lineStart: "rgba(251,191,36,0.75)"  },
  blue:   { border: "border-blue-400/35",   bg: "bg-blue-500/8",    text: "text-blue-300",   bar: "bg-blue-400",   dot: "rgba(99,179,237,1)",  glow: "rgba(59,130,246,0.35)",  lineStart: "rgba(99,179,237,0.75)"  },
  green:  { border: "border-green-400/35",  bg: "bg-green-500/8",   text: "text-green-300",  bar: "bg-green-400",  dot: "rgba(74,222,128,1)",  glow: "rgba(34,197,94,0.35)",   lineStart: "rgba(74,222,128,0.75)"  },
};

// Each config is a self-contained parlay example.
// Multiplier = product of (1 / probability) for each leg — exact fair-odds payout.
const PARLAY_CONFIGS: Record<LegCount, ParlayLeg[]> = {
  2: [
    { question: "Will the Fed cut rates before Q3 2026?", category: "MACRO",  prob: 62, accent: "purple", label: "Fed cut"    },
    { question: "Will BTC exceed $120k by end of 2026?",  category: "CRYPTO", prob: 48, accent: "amber",  label: "BTC $120k"  },
  ],
  3: [
    { question: "Will the Fed cut rates before Q3 2026?", category: "MACRO",  prob: 62, accent: "purple", label: "Fed cut"    },
    { question: "Will BTC exceed $120k by end of 2026?",  category: "CRYPTO", prob: 48, accent: "amber",  label: "BTC $120k"  },
    { question: "Will ETH flip BTC by market cap?",       category: "CRYPTO", prob: 19, accent: "blue",   label: "ETH flip"   },
  ],
  4: [
    { question: "Will the Fed cut rates before Q3 2026?", category: "MACRO",  prob: 62, accent: "purple", label: "Fed cut"    },
    { question: "Will BTC exceed $120k by end of 2026?",  category: "CRYPTO", prob: 48, accent: "amber",  label: "BTC $120k"  },
    { question: "Will ETH flip BTC by market cap?",       category: "CRYPTO", prob: 19, accent: "blue",   label: "ETH flip"   },
    { question: "Major nation adopts BTC as reserve?",    category: "MACRO",  prob: 31, accent: "green",  label: "BTC reserve" },
  ],
};

// True fair-odds parlay multiplier: product of (1/p) for each leg
function legMultiplier(legs: ParlayLeg[]): number {
  return legs.reduce((m, leg) => m / (leg.prob / 100), 1);
}

function ParlaySection() {
  const containerRef  = useRef<HTMLDivElement>(null);
  const card0Ref      = useRef<HTMLDivElement>(null);
  const card1Ref      = useRef<HTMLDivElement>(null);
  const card2Ref      = useRef<HTMLDivElement>(null);
  const card3Ref      = useRef<HTMLDivElement>(null);
  const resultRef     = useRef<HTMLDivElement>(null);
  const path0Ref      = useRef<SVGPathElement>(null);
  const path1Ref      = useRef<SVGPathElement>(null);
  const path2Ref      = useRef<SVGPathElement>(null);
  const path3Ref      = useRef<SVGPathElement>(null);

  const allCardRefs = [card0Ref, card1Ref, card2Ref, card3Ref];
  const allPathRefs = [path0Ref, path1Ref, path2Ref, path3Ref];

  const [svgSize,      setSvgSize]      = useState({ w: 0, h: 0 });
  const [pathData,     setPathData]     = useState(["", "", "", ""]);
  const [pathLengths,  setPathLengths]  = useState([800, 800, 800, 800]);
  const [animated,     setAnimated]     = useState(false);
  const [multiplier,   setMultiplier]   = useState(1.0);
  const [activeHover,  setActiveHover]  = useState<number | null>(null);
  const [selectedLegs, setSelectedLegs] = useState<LegCount>(3);
  const selectedLegsRef                 = useRef<LegCount>(3);
  const [barsReady,    setBarsReady]    = useState(false);
  const [legAnimKey,   setLegAnimKey]   = useState(0);

  // ── Compute SVG bezier paths from DOM positions ──
  const computePaths = useCallback(() => {
    const cont = containerRef.current;
    const res  = resultRef.current;
    if (!cont || !res) return;

    const cRect = cont.getBoundingClientRect();
    const rRect = res.getBoundingClientRect();
    setSvgSize({ w: cRect.width, h: cRect.height });

    const rx = rRect.left - cRect.left;
    const ry = rRect.top  + rRect.height / 2 - cRect.top;
    const n  = selectedLegsRef.current;

    const paths = Array.from({ length: 4 }, (_, i) => {
      if (i >= n) return "";
      const el = allCardRefs[i].current;
      if (!el) return "";
      const cr = el.getBoundingClientRect();
      const x1 = cr.right  - cRect.left;
      const y1 = cr.top    + cr.height / 2 - cRect.top;
      const cp = x1 + (rx - x1) * 0.52;
      return `M ${x1},${y1} C ${cp},${y1} ${cp},${ry} ${rx},${ry}`;
    });
    setPathData(paths);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Wait for fonts before measuring DOM — avoids misalignment due to FOUT
    const init = () => requestAnimationFrame(() => computePaths());
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(init);
    } else {
      setTimeout(init, 200);
    }

    // ResizeObserver is more reliable than window resize events
    const ro = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => requestAnimationFrame(computePaths))
      : null;
    if (ro && containerRef.current) ro.observe(containerRef.current);

    return () => ro?.disconnect();
  }, [computePaths]);

  // ── Measure path lengths after paths render ──
  useEffect(() => {
    if (!pathData.some(Boolean)) return;
    requestAnimationFrame(() => {
      const lens = allPathRefs.map((r) => r.current?.getTotalLength() ?? 800);
      setPathLengths(lens);
    });
  }, [pathData]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Scroll-triggered animation ──
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !animated) {
        setAnimated(true);
        const target = legMultiplier(PARLAY_CONFIGS[selectedLegsRef.current]);
        const start  = Date.now();
        const dur    = 1800;
        const tick   = () => {
          const t    = Math.min((Date.now() - start) / dur, 1);
          const ease = 1 - Math.pow(1 - t, 3);
          setMultiplier(1 + (target - 1) * ease);
          if (t < 1) requestAnimationFrame(tick);
        };
        setTimeout(() => {
          requestAnimationFrame(tick);
          setBarsReady(true);
        }, 700);
        io.unobserve(el);
      }
    }, { threshold: 0.22 });
    io.observe(el);
    return () => io.disconnect();
  }, [animated]);

  // ── Re-animate multiplier when leg count changes ──
  useEffect(() => {
    if (!animated || legAnimKey === 0) return;
    const target = legMultiplier(PARLAY_CONFIGS[selectedLegsRef.current]);
    const start  = Date.now();
    const dur    = 1100;
    const tick   = () => {
      const t    = Math.min((Date.now() - start) / dur, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setMultiplier(1 + (target - 1) * ease);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [legAnimKey, animated]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeLegs = PARLAY_CONFIGS[selectedLegs];

  const handleLegSelect = useCallback((n: LegCount) => {
    if (n === selectedLegsRef.current) return;
    selectedLegsRef.current = n;
    setSelectedLegs(n);
    setMultiplier(1.0);
    setBarsReady(false);
    setLegAnimKey(k => k + 1);
    // Recompute paths after React re-renders the new card count
    setTimeout(() => {
      requestAnimationFrame(computePaths);
      setTimeout(() => setBarsReady(true), 80);
    }, 60);
  }, [computePaths]);

  return (
    <section className="relative z-10 px-6 md:px-12 py-28 border-t border-white/6 overflow-hidden">
      {/* Ambient bg */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: [
          "radial-gradient(ellipse at 65% 50%, rgba(139,92,246,0.07) 0%, transparent 52%)",
          "radial-gradient(ellipse at 30% 80%, rgba(251,191,36,0.04) 0%, transparent 45%)",
          "radial-gradient(ellipse at 75% 15%, rgba(59,130,246,0.04) 0%, transparent 40%)",
        ].join(", "),
      }} />

      <div className="max-w-5xl mx-auto relative">

        {/* ── Header ── */}
        <div className="text-center mb-16" data-reveal>
          <span className="inline-flex items-center gap-2 text-[9px] uppercase tracking-[0.28em] text-purple-400/55 mb-5">
            <span className="w-1 h-1 rounded-full bg-purple-400/70" />
            Flagship feature
            <span className="w-1 h-1 rounded-full bg-purple-400/70" />
          </span>
          <h2
            className="text-[36px] md:text-[50px] font-black tracking-[-0.02em] leading-[1.02] mb-5"
            style={{ fontFamily: "var(--font-display, Inter, system-ui, sans-serif)" }}
          >
            Stack your convictions.
            <br />
            <span className="text-purple-400">Multiply your edge.</span>
          </h2>
          <p className="text-[13px] leading-[1.85] text-white/35 max-w-lg mx-auto tracking-[0.03em]">
            Combine multiple market positions into a single on-chain parlay.
            Each leg that resolves correctly multiplies your payout.
            One leg fails — the parlay fails. High conviction, compounded reward.
          </p>
        </div>

        {/* ══ DESKTOP GRAPHIC (md+) ══════════════════════════════════════════ */}
        <div
          ref={containerRef}
          className="relative hidden md:block"
          style={{ minHeight: 440 }}
          data-reveal
          data-reveal-delay="80"
        >
          {/* ── Leg selector — top-right of diagram ── */}
          <div className="absolute top-0 right-[49%] pr-4 translate-x-[100%] z-20 flex items-center gap-1.5">
            <span className="text-[7px] uppercase tracking-[0.14em] text-white/18 mr-1">Legs:</span>
            {([2, 3, 4] as LegCount[]).map((n) => {
              const active = selectedLegs === n;
              return (
                <button
                  key={n}
                  onClick={() => handleLegSelect(n)}
                  className={`text-[8px] uppercase tracking-[0.16em] font-bold px-3 py-1.5 border transition-all duration-200 ${
                    active
                      ? "border-purple-400/55 bg-purple-400/12 text-purple-300"
                      : "border-purple-400/18 bg-transparent text-purple-300/30 hover:border-purple-400/38 hover:text-purple-300/60"
                  }`}
                >
                  {n}
                </button>
              );
            })}
          </div>
          {/* SVG overlay — bezier paths + dots */}
          {svgSize.w > 0 && (
            <svg
              className="absolute inset-0 pointer-events-none z-10"
              width={svgSize.w}
              height={svgSize.h}
              style={{ overflow: "visible" }}
            >
              <defs>
                {activeLegs.map((leg, i) => (
                  <linearGradient key={`${selectedLegs}-${i}`} id={`lg${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   stopColor={ACCENT[leg.accent].lineStart} />
                    <stop offset="85%"  stopColor="rgba(251,191,36,0.85)" />
                    <stop offset="100%" stopColor="rgba(251,191,36,0.95)" />
                  </linearGradient>
                ))}
                {/* Line glow */}
                <filter id="lg-glow" x="-10%" y="-200%" width="120%" height="500%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                {/* Dot glow */}
                <filter id="dot-glow" x="-300%" y="-300%" width="700%" height="700%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>

              {pathData.map((d, i) => d && i < activeLegs.length && (
                <g key={i}>
                  {/* Fat glow under the line */}
                  <path
                    d={d}
                    stroke={ACCENT[activeLegs[i].accent].glow}
                    strokeWidth={activeHover === i ? 10 : 6}
                    fill="none"
                    filter="url(#lg-glow)"
                    style={{ transition: "stroke-width 0.3s ease, opacity 0.3s ease", opacity: activeHover !== null && activeHover !== i ? 0.3 : 1 }}
                  />
                  {/* Crisp line */}
                  <path
                    ref={allPathRefs[i]}
                    d={d}
                    stroke={`url(#lg${i})`}
                    strokeWidth={activeHover === i ? 2.5 : 1.5}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={pathLengths[i]}
                    strokeDashoffset={animated ? 0 : pathLengths[i]}
                    style={{
                      transition: animated
                        ? `stroke-dashoffset 1.1s cubic-bezier(0.4,0,0.2,1) ${0.08 + i * 0.18}s, stroke-width 0.3s ease`
                        : "none",
                      opacity: activeHover !== null && activeHover !== i ? 0.25 : 1,
                    }}
                  />
                  {/* Traveling dot */}
                  {animated && d && (
                    <circle
                      r={activeHover === i ? 5 : 3.5}
                      fill={ACCENT[activeLegs[i].accent].dot}
                      filter="url(#dot-glow)"
                    >
                      <animateMotion
                        dur={`${2.2 + i * 0.4}s`}
                        repeatCount="indefinite"
                        path={d}
                        rotate="auto"
                      />
                    </circle>
                  )}
                </g>
              ))}
            </svg>
          )}

          {/* ── Left: parlay leg cards ── */}
          <div className="absolute left-0 top-0 w-[43%] flex flex-col justify-between py-2" style={{ height: "100%" }}>
            {activeLegs.map((leg, i) => {
              const a = ACCENT[leg.accent];
              const isHovered = activeHover === i;
              // Tilt angles for up to 4 cards
              const tilts   = [-1.8, 0, 1.8, 0];
              const offsets  = [-6, 0, 6, 0];
              return (
                <div
                  key={`${selectedLegs}-${i}`}
                  ref={allCardRefs[i]}
                  className={`border ${a.border} ${a.bg} p-4 cursor-default select-none transition-all duration-400`}
                  style={{
                    transform: animated
                      ? `rotate(${tilts[i] ?? 0}deg) translateY(${offsets[i] ?? 0}px) scale(${isHovered ? 1.02 : 1})`
                      : "rotate(0deg) translateY(0px) scale(1)",
                    boxShadow: animated
                      ? `0 0 ${isHovered ? 32 : 16}px ${a.glow}, 0 0 ${isHovered ? 64 : 32}px ${a.glow.replace("0.35", "0.15")}`
                      : "none",
                    transition: "transform 0.5s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.4s ease",
                    transitionDelay: `${i * 0.12}s`,
                    opacity: activeHover !== null && !isHovered ? 0.55 : 1,
                  }}
                  onMouseEnter={() => setActiveHover(i)}
                  onMouseLeave={() => setActiveHover(null)}
                >
                  {/* Header row */}
                  <div className="flex items-center justify-between mb-2.5">
                    <span className={`text-[8px] uppercase tracking-[0.2em] ${a.text} border ${a.border} px-1.5 py-0.5 bg-black/20`}>
                      {leg.category}
                    </span>
                    <div
                      className={`w-5 h-5 border ${a.border} flex items-center justify-center transition-all duration-500`}
                      style={{
                        background: animated ? a.glow.replace("0.35", "0.2") : "transparent",
                        boxShadow: animated && isHovered ? `0 0 8px ${a.glow}` : "none",
                      }}
                    >
                      {animated && <Check className={`w-3 h-3 ${a.text}`} />}
                    </div>
                  </div>

                  {/* Question */}
                  <p
                    className="text-[12px] text-white/72 leading-snug mb-3 tracking-[0.015em]"
                    style={{ fontFamily: "var(--font-display, Inter, system-ui, sans-serif)" }}
                  >
                    {leg.question}
                  </p>

                  {/* Leg multiplier contribution */}
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[9px] uppercase tracking-[0.12em] ${a.text} opacity-60`}>YES</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[13px] font-bold tabular-nums ${a.text}`} style={{ fontFamily: "var(--font-display, Inter, system-ui, sans-serif)" }}>
                        {leg.prob}%
                      </span>
                      <span className="text-[9px] text-white/20 uppercase tracking-[0.1em]">
                        ({(1 / (leg.prob / 100)).toFixed(2)}×)
                      </span>
                    </div>
                  </div>

                  {/* Probability bar */}
                  <div className="h-1 bg-white/6 overflow-hidden">
                    <div
                      className={`h-full ${a.bar}`}
                      style={{
                        width: barsReady ? `${leg.prob}%` : "0%",
                        transition: "width 1.1s cubic-bezier(0.4,0,0.2,1)",
                        transitionDelay: `${0.35 + i * 0.18}s`,
                        boxShadow: isHovered ? `0 0 8px ${a.glow}` : "none",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Right: payout result ── */}
          <div
            ref={resultRef}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-[49%]"
          >
            <div
              className="border border-amber-400/22 bg-[#080604] relative overflow-hidden"
              style={{
                boxShadow: animated
                  ? "0 0 50px rgba(251,191,36,0.1), 0 0 100px rgba(251,191,36,0.05), inset 0 0 60px rgba(251,191,36,0.025)"
                  : "none",
                transition: "box-shadow 1s ease 0.5s",
              }}
            >
              {/* Scan line */}
              <div className="absolute inset-x-0 top-0 h-px pointer-events-none" style={{
                background: "linear-gradient(90deg, transparent, rgba(251,191,36,0.5), transparent)",
                animation: animated ? "scanLine 3.5s linear infinite" : "none",
              }} />

              {/* Top strip */}
              <div className="flex items-center justify-between px-6 py-3 border-b border-white/6">
                <span className="text-[8px] uppercase tracking-[0.22em] text-white/22">Parlay result</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" style={{ animation: animated ? "pulse-slow 1.8s infinite" : "none" }} />
                  <span className="text-[8px] uppercase tracking-[0.16em] text-amber-400/55">Live calc</span>
                </div>
              </div>

              {/* Body */}
              <div className="px-6 py-8 text-center">
                {/* IF ALL N HIT label */}
                <p className="text-[9px] uppercase tracking-[0.22em] text-white/22 mb-3">if all {selectedLegs} hit</p>

                {/* Giant multiplier */}
                <div
                  className="font-black text-amber-400 leading-none mb-1 tabular-nums"
                  style={{
                    fontSize: "clamp(64px, 9vw, 96px)",
                    fontFamily: "var(--font-display, Inter, system-ui, sans-serif)",
                    textShadow: animated
                      ? "0 0 30px rgba(251,191,36,0.55), 0 0 70px rgba(251,191,36,0.2)"
                      : "none",
                    transition: "text-shadow 0.8s ease 0.6s",
                  }}
                >
                  {multiplier.toFixed(1)}×
                </div>
                <p className="text-[9px] uppercase tracking-[0.18em] text-white/25 mb-8">payout multiplier</p>

                {/* The math — leg breakdown */}
                <div className="border border-white/6 bg-black/20 px-4 py-4 mb-5 text-left">
                  <p className="text-[8px] uppercase tracking-[0.2em] text-white/20 mb-3">How it compounds</p>
                  <div className="space-y-2">
                    {activeLegs.map((leg, i) => {
                      const a = ACCENT[leg.accent];
                      return (
                        <div key={i} className="flex items-center justify-between">
                          <span className={`text-[10px] truncate mr-2 ${a.text} opacity-70`} style={{ maxWidth: "65%" }}>
                            {leg.label}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] text-white/30 tabular-nums">{leg.prob}%</span>
                            <span className={`text-[9px] font-bold ${a.text} tabular-nums`}>
                              ×{(1 / (leg.prob / 100)).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="border-t border-white/6 mt-3 pt-3 flex items-center justify-between">
                    <span className="text-[9px] uppercase tracking-[0.14em] text-white/25">Combined</span>
                    <span className="text-[11px] font-bold text-white/50 tabular-nums">
                      {(activeLegs.reduce((acc, l) => acc * (l.prob / 100), 1) * 100).toFixed(1)}% → {legMultiplier(activeLegs).toFixed(1)}×
                    </span>
                  </div>
                </div>

                {/* Stake → payout */}
                <div className="flex items-center justify-center gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-[8px] uppercase tracking-[0.16em] text-white/22 mb-1">Stake</p>
                    <p className="text-[20px] font-bold text-white/50 tabular-nums" style={{ fontFamily: "var(--font-display, Inter, system-ui, sans-serif)" }}>$100</p>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <ArrowRight className="w-4 h-4 text-amber-400/40" />
                  </div>
                  <div className="text-center">
                    <p className="text-[8px] uppercase tracking-[0.16em] text-white/22 mb-1">Payout</p>
                    <p
                      className="text-[24px] font-black text-green-400 tabular-nums"
                      style={{ fontFamily: "var(--font-display, Inter, system-ui, sans-serif)" }}
                    >
                      ${Math.round(multiplier * 100).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Chain badge */}
                <div className="flex items-center justify-center gap-1.5 text-[8px] uppercase tracking-[0.16em] text-white/18">
                  <div className="w-1 h-1 rounded-full bg-green-400/55" />
                  Settled on-chain · No intermediary · No house edge
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══ MOBILE VERSION (< md) ══════════════════════════════════════════ */}
        <div className="md:hidden space-y-3" data-reveal data-reveal-delay="80">
          {/* Mobile leg selector */}
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[7px] uppercase tracking-[0.14em] text-white/18 mr-0.5">Legs:</span>
            {([2, 3, 4] as LegCount[]).map((n) => (
              <button
                key={n}
                onClick={() => handleLegSelect(n)}
                className={`text-[8px] uppercase tracking-[0.16em] font-bold px-3 py-1.5 border transition-all duration-200 ${
                  selectedLegs === n
                    ? "border-purple-400/55 bg-purple-400/12 text-purple-300"
                    : "border-purple-400/18 text-purple-300/30"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          {activeLegs.map((leg, i) => {
            const a = ACCENT[leg.accent];
            return (
              <div key={`${selectedLegs}-${i}`} className={`border ${a.border} ${a.bg} p-4`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[8px] uppercase tracking-[0.18em] ${a.text} border ${a.border} px-1.5 py-0.5`}>{leg.category}</span>
                  <span className={`text-[11px] font-bold tabular-nums ${a.text}`}>{leg.prob}% YES</span>
                </div>
                <p className="text-[12px] text-white/65 leading-snug mb-2 tracking-[0.015em]" style={{ fontFamily: "var(--font-display, Inter, system-ui, sans-serif)" }}>
                  {leg.question}
                </p>
                <div className="h-1 bg-white/6">
                  <div className={`h-full ${a.bar}`} style={{ width: `${leg.prob}%` }} />
                </div>
              </div>
            );
          })}

          {/* Arrow */}
          <div className="flex items-center justify-center py-2">
            <div className="flex flex-col items-center gap-1">
              <div className="w-px h-6 bg-gradient-to-b from-purple-400/30 to-amber-400/30" />
              <ArrowRight className="w-3.5 h-3.5 text-amber-400/40 rotate-90" />
            </div>
          </div>

          {/* Mobile result */}
          <div className="border border-amber-400/20 bg-[#080604] p-6 text-center">
            <p className="text-[8px] uppercase tracking-[0.2em] text-white/22 mb-2">if all {selectedLegs} hit</p>
            <p className="text-[56px] font-black text-amber-400 leading-none mb-1 tabular-nums" style={{ fontFamily: "var(--font-display, Inter, system-ui, sans-serif)" }}>
              {legMultiplier(activeLegs).toFixed(1)}×
            </p>
            <p className="text-[9px] uppercase tracking-[0.16em] text-white/25 mb-4">payout multiplier</p>
            <div className="flex items-center justify-center gap-4">
              <span className="text-[16px] font-bold text-white/40">$100</span>
              <ArrowRight className="w-4 h-4 text-amber-400/40" />
              <span className="text-[20px] font-black text-green-400" style={{ fontFamily: "var(--font-display, Inter, system-ui, sans-serif)" }}>
                ${Math.round(legMultiplier(activeLegs) * 100).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* ── Footer note ── */}
        <div className="mt-16 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-white/6 pt-8" data-reveal data-reveal-delay="150">
          <p className="text-[11px] leading-relaxed text-white/28 tracking-[0.03em] max-w-sm">
            Build 2-, 3-, or 4-leg parlays across any category mix — macro + crypto + politics.
            Parlays settle on-chain the moment all legs resolve.
          </p>
          <div className="flex items-center gap-2 shrink-0 text-[9px] uppercase tracking-[0.14em] text-white/20">
            <span className="tabular-nums text-amber-400/55 font-bold">{legMultiplier(activeLegs).toFixed(1)}×</span>
            <span>max payout · {selectedLegs}-leg</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface MockMarket {
  id: string;
  question: string;
  category: string;
  yesProb: number;
  volume: string;
  endsIn: string;
  trending?: boolean;
}

type Category = "ALL" | "POLITICS" | "CRYPTO" | "SPORTS" | "MACRO" | "CONFLICT";

// ─── Constants ─────────────────────────────────────────────────────────────────

const WAITLIST_ID = process.env.NEXT_PUBLIC_WAITLIST_ID || "32647";

const MOCK_MARKETS: MockMarket[] = [
  { id: "1", question: "Will the Fed cut rates before Q3 2026?",              category: "MACRO",    yesProb: 62, volume: "$1.2M", endsIn: "87d",  trending: true  },
  { id: "2", question: "Will BTC exceed $120k before end of 2026?",           category: "CRYPTO",   yesProb: 48, volume: "$3.7M", endsIn: "261d", trending: true  },
  { id: "3", question: "Will the 2026 US midterm turnout exceed 55%?",        category: "POLITICS", yesProb: 71, volume: "$890k", endsIn: "209d"                  },
  { id: "4", question: "Will any G7 nation officially adopt a CBDC by 2027?", category: "MACRO",    yesProb: 34, volume: "$540k", endsIn: "365d"                  },
  { id: "5", question: "Will ETH flip BTC by market cap before 2027?",        category: "CRYPTO",   yesProb: 19, volume: "$2.1M", endsIn: "365d"                  },
  { id: "6", question: "Ceasefire declared in active conflict zone by mid-2026?", category: "CONFLICT", yesProb: 55, volume: "$410k", endsIn: "122d"              },
];

const CATEGORIES: Category[] = ["ALL", "POLITICS", "CRYPTO", "SPORTS", "MACRO", "CONFLICT"];

const LIVE_FEED = [
  { addr: "0x3a…4f2", action: "bought", shares: 120, side: "YES", market: "Fed rate cut" },
  { addr: "0x9c…11b", action: "sold",   shares: 45,  side: "NO",  market: "BTC $120k"   },
  { addr: "0xf1…9a3", action: "bought", shares: 250, side: "YES", market: "Midterm turnout" },
  { addr: "0x7e…c82", action: "bought", shares: 80,  side: "NO",  market: "ETH flip"    },
  { addr: "0x2b…d44", action: "sold",   shares: 190, side: "YES", market: "Fed rate cut" },
  { addr: "0x5d…771", action: "bought", shares: 60,  side: "NO",  market: "CBDC G7"     },
];

const CAT_RING: Record<Category, string> = {
  ALL:      "ring-white/20",
  POLITICS: "ring-blue-400/40",
  CRYPTO:   "ring-amber-400/40",
  SPORTS:   "ring-green-400/40",
  MACRO:    "ring-purple-400/40",
  CONFLICT: "ring-red-400/40",
};
const CAT_TEXT: Record<Category, string> = {
  ALL:      "text-white/50",
  POLITICS: "text-blue-400",
  CRYPTO:   "text-amber-400",
  SPORTS:   "text-green-400",
  MACRO:    "text-purple-400",
  CONFLICT: "text-red-400",
};
const CAT_ACTIVE_BG: Record<Category, string> = {
  ALL:      "bg-white/10 text-white ring-white/40",
  POLITICS: "bg-blue-500/15 text-blue-300 ring-blue-400/60",
  CRYPTO:   "bg-amber-500/15 text-amber-300 ring-amber-400/60",
  SPORTS:   "bg-green-500/15 text-green-300 ring-green-400/60",
  MACRO:    "bg-purple-500/15 text-purple-300 ring-purple-400/60",
  CONFLICT: "bg-red-500/15 text-red-300 ring-red-400/60",
};

// ─── Hooks ─────────────────────────────────────────────────────────────────────

function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>("[data-reveal]");
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const delay = el.dataset.revealDelay || "0";
            setTimeout(() => el.classList.add("revealed"), Number(delay));
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

// ─── Hero widget ───────────────────────────────────────────────────────────────

function HeroWidget() {
  const [barWidth, setBarWidth] = useState(0);
  const [feedIndex, setFeedIndex] = useState(0);
  const [visibleFeed, setVisibleFeed] = useState<typeof LIVE_FEED>([]);

  useEffect(() => {
    const t = setTimeout(() => setBarWidth(62), 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setFeedIndex((i) => {
        const next = (i + 1) % LIVE_FEED.length;
        setVisibleFeed((prev) => [LIVE_FEED[next], ...prev].slice(0, 4));
        return next;
      });
    }, 1800);
    setVisibleFeed([LIVE_FEED[0]]);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-[400px] border border-white/10 bg-[#0a0a0a] overflow-hidden">
      {/* Scan line */}
      <div className="absolute inset-x-0 top-0 h-px pointer-events-none" style={{ background: "linear-gradient(90deg, transparent, rgba(251,191,36,0.5), transparent)", animation: "scanLine 3s linear infinite" }} />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/6">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[9px] uppercase tracking-[0.18em] text-white/30">Live markets</span>
        </div>
        <span className="text-[9px] uppercase tracking-[0.14em] text-amber-400/50">Predifi</span>
      </div>

      {/* Featured market */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[8px] uppercase tracking-[0.18em] px-1.5 py-0.5 border border-purple-400/30 text-purple-400/70">Macro</span>
          <TrendingUp className="w-3 h-3 text-amber-400/50" />
        </div>
        <p className="text-[13px] text-white/80 leading-snug mb-3 tracking-[0.02em]">
          Will the Fed cut rates<br />before Q3 2026?
        </p>

        {/* Animated probability bar */}
        <div className="mb-1.5">
          <div className="flex justify-between mb-1">
            <span className="text-[9px] text-white/30 uppercase tracking-[0.1em]">Probability</span>
            <span className="text-[13px] font-bold text-white tabular-nums" style={{ fontFamily: "var(--font-display, Inter, system-ui, sans-serif)" }}>
              {barWidth}% YES
            </span>
          </div>
          <div className="h-1.5 bg-white/6 w-full overflow-hidden">
            <div
              className="h-full bg-green-500"
              style={{ width: `${barWidth}%`, transition: "width 1.2s cubic-bezier(0.4, 0, 0.2, 1)" }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[8px] text-green-400/50 uppercase tracking-[0.08em]">YES {barWidth}%</span>
            <span className="text-[8px] text-red-400/50 uppercase tracking-[0.08em]">NO {100 - barWidth}%</span>
          </div>
        </div>

        <div className="flex justify-between pt-2 border-t border-white/5">
          <span className="text-[9px] text-white/20 uppercase tracking-[0.1em]">Vol $1.2M</span>
          <span className="text-[9px] text-white/20 uppercase tracking-[0.1em]">87 days left</span>
        </div>
      </div>

      {/* Live activity feed */}
      <div className="border-t border-white/6 px-4 py-3">
        <span className="text-[8px] uppercase tracking-[0.18em] text-white/20 block mb-2">Recent activity</span>
        <div className="space-y-1.5 h-[88px] overflow-hidden">
          {visibleFeed.map((entry, i) => (
            <div
              key={`${entry.addr}-${i}`}
              className="flex items-center gap-2 text-[9px] tracking-[0.04em]"
              style={{ animation: i === 0 ? "feedSlideIn 0.35s ease-out" : "none", opacity: 1 - i * 0.22 }}
            >
              <span className="text-white/25 font-mono">{entry.addr}</span>
              <span className="text-white/30">{entry.action}</span>
              <span className="font-medium text-white/50">{entry.shares}</span>
              <span className={entry.side === "YES" ? "text-green-400/80" : "text-red-400/80"}>
                {entry.side}
              </span>
              <span className="text-white/20 truncate max-w-[80px]">{entry.market}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer strip */}
      <div className="px-4 py-2 bg-white/[0.015] border-t border-white/5 flex items-center justify-between">
        <span className="text-[8px] uppercase tracking-[0.14em] text-white/15">Ethereum · Hedera · Solana · Arbitrum · Base</span>
        <span className="text-[8px] uppercase tracking-[0.14em] text-amber-400/30">+10 more</span>
      </div>
    </div>
  );
}

// ─── Market card ───────────────────────────────────────────────────────────────

function MarketCard({ market, index }: { market: MockMarket; index: number }) {
  const barRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapRef.current;
    const bar = barRef.current;
    if (!el || !bar) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const delay = index * 80;
          setTimeout(() => {
            el.classList.add("revealed");
            setTimeout(() => {
              if (bar) bar.style.width = `${market.yesProb}%`;
            }, 200);
          }, delay);
          io.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [market.yesProb, index]);

  const probColor =
    market.yesProb >= 65 ? "bg-green-500" :
    market.yesProb >= 40 ? "bg-amber-400" : "bg-red-500";

  return (
    <div
      ref={wrapRef}
      className="reveal-item group border border-white/8 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/15 transition-all duration-300 p-5 flex flex-col gap-4 cursor-default"
      style={{ transitionDelay: `${index * 40}ms` }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={`text-[9px] uppercase tracking-[0.16em] px-1.5 py-0.5 ring-1 bg-transparent ${CAT_TEXT[market.category as Category]} ${CAT_RING[market.category as Category]}`}>
          {market.category}
        </span>
        {market.trending && (
          <span className="flex items-center gap-1 text-[9px] uppercase tracking-[0.1em] text-amber-400/60">
            <TrendingUp className="w-2.5 h-2.5" />Hot
          </span>
        )}
      </div>

      <p
        className="text-white/75 text-[13px] leading-relaxed tracking-[0.02em] font-medium line-clamp-2 group-hover:text-white/90 transition-colors duration-200"
        style={{ fontFamily: "var(--font-display, Inter, system-ui, sans-serif)" }}
      >
        {market.question}
      </p>

      <div className="space-y-1.5">
        <div className="flex justify-between items-baseline">
          <span className="text-[9px] uppercase tracking-[0.1em] text-white/30">Probability</span>
          <span className="text-[14px] font-bold text-white tabular-nums" style={{ fontFamily: "var(--font-display, Inter, system-ui, sans-serif)" }}>
            {market.yesProb}% <span className="text-[10px] text-white/40 font-normal">YES</span>
          </span>
        </div>
        <div className="h-1 bg-white/6 w-full overflow-hidden">
          <div
            ref={barRef}
            className={`h-full ${probColor}`}
            style={{ width: "0%", transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)" }}
          />
        </div>
        <div className="flex justify-between">
          <span className="text-[8px] text-green-400/50 uppercase tracking-[0.08em]">YES {market.yesProb}%</span>
          <span className="text-[8px] text-red-400/50 uppercase tracking-[0.08em]">NO {100 - market.yesProb}%</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <span className="text-[9px] uppercase tracking-[0.1em] text-white/20">Vol {market.volume}</span>
        <span className="text-[9px] uppercase tracking-[0.1em] text-white/20">{market.endsIn} left</span>
      </div>
    </div>
  );
}

// ─── Email form ────────────────────────────────────────────────────────────────

function EmailForm({ className = "", size = "default" }: { className?: string; size?: "default" | "large" }) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [referralLink, setReferralLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [alreadyIn, setAlreadyIn] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("waitlist_email");
    const link  = localStorage.getItem("waitlist_referral_link");
    if (saved) { setAlreadyIn(true); setSubmitted(true); setReferralLink(link || ""); }
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || isSubmitting) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("Enter a valid email address");
      return;
    }
    setIsSubmitting(true);
    try {
      const norm = email.toLowerCase().trim();
      const gwRes = await fetch("https://api.getwaitlist.com/api/v1/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: norm, waitlist_id: Number(WAITLIST_ID) }),
      });
      const gwData = await gwRes.json();
      if (!gwRes.ok) throw new Error(gwData.error_string || "Failed to join waitlist");

      fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: gwData.email, referral_link: gwData.referral_link ?? "", already_registered: gwData.already_registered ?? false }),
      }).catch(() => {});

      localStorage.setItem("waitlist_email", gwData.email);
      localStorage.setItem("waitlist_referral_link", gwData.referral_link || "");
      setReferralLink(gwData.referral_link || "");
      setAlreadyIn(gwData.already_registered ?? false);
      setSubmitted(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [email, isSubmitting]);

  const copyReferral = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success("Referral link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch { toast.error("Failed to copy"); }
  };

  const inputCls = size === "large"
    ? "flex-1 bg-white/5 border border-white/15 hover:border-white/25 focus:border-amber-400/50 focus:outline-none px-5 py-4 text-[13px] tracking-[0.04em] text-white placeholder:text-white/20 transition-colors duration-200 disabled:opacity-50"
    : "flex-1 bg-white/5 border border-white/15 hover:border-white/25 focus:border-amber-400/50 focus:outline-none px-4 py-3 text-[12px] tracking-[0.04em] text-white placeholder:text-white/20 transition-colors duration-200 disabled:opacity-50";
  const btnCls = size === "large"
    ? "flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 disabled:bg-amber-400/25 disabled:cursor-not-allowed text-black text-[11px] font-bold uppercase tracking-[0.2em] px-7 py-4 transition-colors duration-150 whitespace-nowrap"
    : "flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 disabled:bg-amber-400/25 disabled:cursor-not-allowed text-black text-[10px] font-bold uppercase tracking-[0.2em] px-5 py-3 transition-colors duration-150 whitespace-nowrap";

  if (submitted) {
    return (
      <div className={`${className} border border-green-500/25 bg-green-500/5 p-5`}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <span className="text-[9px] uppercase tracking-[0.2em] text-green-400">
            {alreadyIn ? "Already registered" : "Access secured"}
          </span>
        </div>
        <p className="text-white/60 text-[12px] leading-relaxed mb-4 tracking-[0.02em]">
          {alreadyIn
            ? "You're already on the waitlist. We'll notify you at launch."
            : "You're in. Check your inbox — we'll notify you at launch."}
        </p>
        {referralLink && (
          <>
            <p className="text-[9px] uppercase tracking-[0.14em] text-white/25 mb-2">Share to move up the queue</p>
            <button
              onClick={copyReferral}
              className="flex items-center gap-2 w-full bg-white/4 border border-white/8 hover:border-white/18 px-3 py-2.5 text-left transition-colors duration-200 group"
            >
              <span className="flex-1 text-[10px] text-white/40 group-hover:text-white/60 tracking-[0.03em] truncate transition-colors duration-200">
                {referralLink}
              </span>
              {copied
                ? <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
                : <Copy className="w-3.5 h-3.5 text-white/25 group-hover:text-white/50 shrink-0 transition-colors duration-200" />
              }
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          disabled={isSubmitting}
          className={inputCls}
          autoComplete="email"
        />
        <button type="submit" disabled={isSubmitting || !email.trim()} className={btnCls}>
          {isSubmitting
            ? <span className="inline-block w-3.5 h-3.5 border-2 border-black/25 border-t-black rounded-full animate-spin" />
            : <><span>Claim your spot</span><ArrowRight className="w-3.5 h-3.5" /></>
          }
        </button>
      </form>
      <p className="text-[9px] uppercase tracking-[0.12em] text-white/18 mt-2.5">
        No spam · Free to join · Early access perks for waitlist members
      </p>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function LandingPageV2() {
  useScrollReveal();
  const [activeCategory, setActiveCategory] = useState<Category>("ALL");

  const filteredMarkets =
    activeCategory === "ALL" ? MOCK_MARKETS : MOCK_MARKETS.filter((m) => m.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-amber-400/20">

      {/* ── Global styles ── */}
      <style>{`
        :root { --font-display: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; }

        @keyframes scanLine    { 0% { transform: translateY(-100%); } 100% { transform: translateY(800%); } }
        @keyframes feedSlideIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeUp      { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse-slow  { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
        @keyframes countUp     { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

        .df { font-family: var(--font-display); }

        .hero-in {
          opacity: 0;
          will-change: opacity, transform;
          animation: fadeUp 0.7s ease-out forwards;
        }
        .reveal-item {
          opacity: 0;
          transform: translateY(22px);
          will-change: opacity, transform;
          transition: opacity 0.55s ease, transform 0.55s ease;
        }
        .reveal-item.revealed { opacity: 1; transform: translateY(0); will-change: auto; }

        [data-reveal] {
          opacity: 0;
          transform: translateY(24px);
          will-change: opacity, transform;
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        [data-reveal].revealed { opacity: 1; transform: translateY(0); will-change: auto; }

        @media (prefers-reduced-motion: reduce) {
          .hero-in, [data-reveal], .reveal-item {
            opacity: 1 !important;
            transform: none !important;
            animation: none !important;
            transition: none !important;
            will-change: auto !important;
          }
          * { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
        }
      `}</style>

      {/* ── Background grid ── */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.035) 1px, transparent 1px)",
        backgroundSize: "72px 72px",
      }} />
      {/* Radial glow — top */}
      <div className="fixed pointer-events-none z-0" style={{
        top: "-15vh", left: "50%", transform: "translateX(-50%)",
        width: "900px", height: "500px",
        background: "radial-gradient(ellipse at center, rgba(251,191,36,0.055) 0%, transparent 65%)",
      }} />

      {/* ══════════════════════════════════════════
          NAV
      ══════════════════════════════════════════ */}
      <nav className="relative z-50 flex items-center justify-between px-6 md:px-12 py-4 border-b border-white/6" style={{ backdropFilter: "blur(12px)", background: "rgba(5,5,5,0.75)" }}>
        <Link href="/" className="flex items-center gap-2.5 opacity-85 hover:opacity-100 transition-opacity duration-200">
          <Image src="/assets/logo-icon-dark.png" alt="Predifi" width={22} height={22} className="w-[22px] h-[22px]" />
          <span className="text-[11px] uppercase tracking-[0.26em] font-semibold hidden sm:inline">Predifi</span>
        </Link>

        {/* Live badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 border border-amber-400/20 bg-amber-400/4">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400" style={{ animation: "pulse-slow 2.5s ease-in-out infinite" }} />
          <span className="text-[9px] uppercase tracking-[0.2em] text-amber-400/70">Launch Q2 2026 — Join the waitlist</span>
        </div>

        <div className="flex items-center gap-5">
          <a href="https://x.com/predifi_com" target="_blank" rel="noopener noreferrer" className="text-[9px] uppercase tracking-[0.16em] text-white/35 hover:text-white/70 transition-colors duration-200">Twitter</a>
          <a href="https://blog.predifi.com" target="_blank" rel="noopener noreferrer" className="text-[9px] uppercase tracking-[0.16em] text-white/35 hover:text-white/70 transition-colors duration-200 hidden sm:inline">Blog</a>
          <a href="https://passport.predifi.com" target="_blank" rel="noopener noreferrer" className="text-[9px] uppercase tracking-[0.16em] text-white/55 hover:text-white/90 border border-white/12 hover:border-white/35 px-3 py-1.5 transition-all duration-200">Passport ↗</a>
        </div>
      </nav>

      {/* ══════════════════════════════════════════
          HERO  (2-col desktop)
      ══════════════════════════════════════════ */}
      <section className="relative z-10 min-h-[calc(100vh-53px)] flex items-center px-6 md:px-12 py-20">
        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">

          {/* ── Left: copy + form ── */}
          <div>
            {/* Eyebrow */}
            <div className="hero-in flex items-center gap-2 mb-7" style={{ animationDelay: "0.05s" }}>
              <span className="w-1 h-1 rounded-full bg-amber-400/60" />
              <span className="text-[9px] uppercase tracking-[0.24em] text-amber-400/55">Decentralized Prediction Markets</span>
              <span className="w-1 h-1 rounded-full bg-amber-400/60" />
            </div>

            {/* H1 — display font */}
            <h1
              className="hero-in text-[42px] sm:text-[52px] md:text-[60px] font-black leading-[1.02] tracking-[-0.02em] mb-6"
              style={{ animationDelay: "0.12s", fontFamily: "var(--font-display, Inter, system-ui, sans-serif)" }}
            >
              One account.<br />
              Every market.<br />
              <span className="text-amber-400">Every chain.</span>
            </h1>

            {/* Subtitle — mono */}
            <p className="hero-in text-white/45 text-[13px] leading-[1.8] tracking-[0.03em] max-w-md mb-10" style={{ animationDelay: "0.22s" }}>
              One account. Best price. Every outcome, on any chain.
              Trade markets, build parlays, compound your convictions — all settled on-chain with no house edge.
            </p>

            {/* Form */}
            <div className="hero-in max-w-md" style={{ animationDelay: "0.35s" }}>
              <EmailForm size="large" />
            </div>

            {/* Social proof — waitlist count placeholder */}
            <div className="hero-in flex items-center gap-3 mt-6" style={{ animationDelay: "0.45s" }}>
              <div className="flex -space-x-1">
                {["#f59e0b","#10b981","#6366f1","#ef4444","#0ea5e9"].map((c, i) => (
                  <div key={i} className="w-5 h-5 rounded-full border border-[#050505]" style={{ background: c, opacity: 0.7 }} />
                ))}
              </div>
              <span className="text-[10px] uppercase tracking-[0.14em] text-white/25">Join the waitlist before launch</span>
            </div>
          </div>

          {/* ── Right: live widget ── */}
          <div className="hero-in flex justify-center lg:justify-end" style={{ animationDelay: "0.3s" }}>
            <HeroWidget />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SIGNAL STRIP — industry context / emotional peak #1
      ══════════════════════════════════════════ */}
      <div className="relative z-10 border-t border-b border-white/6 overflow-hidden">
        <div className="px-6 md:px-12 py-6 max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x md:divide-white/5">
            {[
              { value: "$4B+",  label: "Daily volume",          sub: "across prediction venues" },
              { value: "16",    label: "Chains supported",      sub: "at launch" },
              { value: "100+",  label: "Live markets",          sub: "at genesis" },
              { value: "0%",    label: "House edge",            sub: "ever" },
            ].map((stat) => (
              <div key={stat.value} className="md:px-8 first:pl-0 last:pr-0">
                <div
                  className="text-[28px] md:text-[32px] font-black text-white/85 leading-none mb-1 tabular-nums df"
                  style={{ fontFamily: "var(--font-display, Inter, system-ui, sans-serif)" }}
                >
                  {stat.value}
                </div>
                <p className="text-[9px] uppercase tracking-[0.18em] text-white/35 leading-tight">{stat.label}</p>
                <p className="text-[8px] uppercase tracking-[0.14em] text-white/18 mt-0.5">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          PRIME BROKER IDENTITY  — the real differentiator
      ══════════════════════════════════════════ */}
      <section className="relative z-10 px-6 md:px-12 py-28 border-t border-white/6 overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 60% 40%, rgba(251,191,36,0.05), transparent 55%)" }} />

        <div className="max-w-5xl mx-auto relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

            {/* Left: positioning statement */}
            <div data-reveal>
              <span className="text-[9px] uppercase tracking-[0.26em] text-amber-400/45 block mb-5">What Predifi actually is</span>
              <h2
                className="text-3xl md:text-[42px] font-black tracking-[-0.015em] leading-[1.05] mb-6"
                style={{ fontFamily: "var(--font-display, Inter, system-ui, sans-serif)" }}
              >
                The prime broker<br />
                for prediction<br />
                <span className="text-amber-400">markets.</span>
              </h2>
              <p className="text-[13px] leading-[1.85] text-white/40 tracking-[0.03em] mb-8">
                Every other prediction market is a single venue — one chain, one liquidity pool, one interface. They compete for the same slice of a fragmented market.
              </p>
              <p className="text-[13px] leading-[1.85] text-white/55 tracking-[0.03em] mb-8">
                Predifi is the layer above all of them. We aggregate liquidity across venues, normalize resolution, and give you one account to trade any outcome on any chain — always at the best available price.
              </p>
              <p className="text-[13px] leading-[1.85] text-white/40 tracking-[0.03em]">
                Think prime brokerage in traditional finance — one relationship, access to every venue, consolidated P&amp;L. That&apos;s what we&apos;re building for prediction markets.
              </p>
            </div>

            {/* Right: capability cards */}
            <div className="space-y-3" data-reveal data-reveal-delay="100">

              {/* Prime access */}
              <div className="border border-amber-400/15 bg-amber-400/[0.025] p-5 group hover:border-amber-400/30 hover:bg-amber-400/[0.04] transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 border border-amber-400/25 bg-amber-400/8 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-amber-400 text-[11px] font-bold">$</span>
                  </div>
                  <div>
                    <h4
                      className="text-[13px] font-bold uppercase tracking-[0.08em] text-white/80 mb-1.5"
                      style={{ fontFamily: "var(--font-display, Inter, system-ui, sans-serif)" }}
                    >
                      Unified Position & P&L
                    </h4>
                    <p className="text-[11px] leading-relaxed text-white/35 tracking-[0.02em]">
                      One account. Every market. Every chain. Your positions, collateral, and P&L consolidated across every venue — one interface, zero fragmentation.
                    </p>
                  </div>
                </div>
              </div>

              {/* Best execution */}
              <div className="border border-green-400/15 bg-green-400/[0.025] p-5 group hover:border-green-400/30 hover:bg-green-400/[0.04] transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 border border-green-400/25 bg-green-400/8 flex items-center justify-center shrink-0 mt-0.5">
                    <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                  </div>
                  <div>
                    <h4
                      className="text-[13px] font-bold uppercase tracking-[0.08em] text-white/80 mb-1.5"
                      style={{ fontFamily: "var(--font-display, Inter, system-ui, sans-serif)" }}
                    >
                      Best-Price Execution
                    </h4>
                    <p className="text-[11px] leading-relaxed text-white/35 tracking-[0.02em]">
                      Smart order routing across all venues simultaneously. Your order goes where the price is best — same as institutional smart order routing, but for prediction markets.
                    </p>
                  </div>
                </div>
              </div>

              {/* Parlays */}
              <div className="border border-purple-400/20 bg-purple-400/[0.03] p-5 group hover:border-purple-400/40 hover:bg-purple-400/[0.05] transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-2 right-3">
                  <span className="text-[8px] uppercase tracking-[0.18em] text-purple-400/60 border border-purple-400/25 px-1.5 py-0.5">New</span>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 border border-purple-400/30 bg-purple-400/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-purple-300 text-[11px] font-bold">×</span>
                  </div>
                  <div>
                    <h4
                      className="text-[13px] font-bold uppercase tracking-[0.08em] text-white/80 mb-1.5"
                      style={{ fontFamily: "var(--font-display, Inter, system-ui, sans-serif)" }}
                    >
                      Prediction Parlays
                    </h4>
                    <p className="text-[11px] leading-relaxed text-white/35 tracking-[0.02em]">
                      Combine multiple market positions into a single correlated bet. Fed cuts AND BTC hits $120k? Stack those convictions. Higher risk, multiplied upside — parlays built natively on-chain.
                    </p>
                    {/* Parlay preview */}
                    <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                      {["Fed cut Q3", "×", "BTC $120k", "×", "ETH flip"].map((t, i) => (
                        <span
                          key={i}
                          className={`text-[9px] uppercase tracking-[0.1em] px-1.5 py-0.5 ${
                            t === "×"
                              ? "text-purple-400/60 font-bold"
                              : "border border-purple-400/20 text-purple-300/60"
                          }`}
                        >
                          {t}
                        </span>
                      ))}
                      <span className="text-[9px] text-green-400/60 ml-1 tracking-[0.08em]">= 6.4× payout</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* API / Institutional */}
              <div className="border border-white/8 bg-white/[0.015] p-5 group hover:border-white/15 hover:bg-white/[0.03] transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 border border-white/12 bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                    <Globe className="w-3.5 h-3.5 text-white/40" />
                  </div>
                  <div>
                    <h4
                      className="text-[13px] font-bold uppercase tracking-[0.08em] text-white/80 mb-1.5"
                      style={{ fontFamily: "var(--font-display, Inter, system-ui, sans-serif)" }}
                    >
                      Unified API Access
                    </h4>
                    <p className="text-[11px] leading-relaxed text-white/35 tracking-[0.02em]">
                      One API key. Every market. Build trading bots, analytics dashboards, or embed prediction markets into your product — without integrating five different APIs.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ParlaySection />

      {/* ══════════════════════════════════════════
          HOW IT WORKS  (new section)
      ══════════════════════════════════════════ */}
      <section className="relative z-10 px-6 md:px-12 py-28 border-t border-white/6">
        <div className="max-w-5xl mx-auto">

          <div className="text-center mb-16" data-reveal>
            <span className="text-[9px] uppercase tracking-[0.26em] text-white/22 block mb-4">How it works</span>
            <h2
              className="text-3xl md:text-4xl font-black tracking-[-0.01em]"
              style={{ fontFamily: "var(--font-display, Inter, system-ui, sans-serif)" }}
            >
              Three steps to your edge.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 relative">
            {/* Connector line — desktop only */}
            <div className="hidden md:block absolute top-8 left-[16.67%] right-[16.67%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

            {[
              {
                n: "01",
                icon: <Globe className="w-5 h-5" />,
                title: "Pick a market",
                body: "Browse hundreds of live markets across politics, crypto, sports, and macro. Every outcome has a price.",
                color: "text-amber-400",
                border: "border-amber-400/20",
                bg: "bg-amber-400/5",
              },
              {
                n: "02",
                icon: <Zap className="w-5 h-5" />,
                title: "Take a position",
                body: "Buy YES or NO shares. Your price reflects your conviction. Markets move in real time as belief shifts.",
                color: "text-green-400",
                border: "border-green-400/20",
                bg: "bg-green-400/5",
              },
              {
                n: "03",
                icon: <Shield className="w-5 h-5" />,
                title: "Collect your edge",
                body: "When the market resolves, winning shares pay out $1.00 each. AI-verified, on-chain, no house edge.",
                color: "text-purple-400",
                border: "border-purple-400/20",
                bg: "bg-purple-400/5",
              },
            ].map((step, i) => (
              <div
                key={step.n}
                className="flex flex-col items-start md:items-center md:text-center px-0 md:px-8 py-8 md:py-0"
                data-reveal
                data-reveal-delay={`${i * 120}`}
              >
                {/* Step icon + number */}
                <div className="relative mb-6">
                  <div className={`w-14 h-14 border ${step.border} ${step.bg} flex items-center justify-center ${step.color}`}>
                    {step.icon}
                  </div>
                  <span className={`absolute -top-2 -right-2 text-[8px] font-bold uppercase tracking-[0.2em] ${step.color} bg-[#050505] px-1`}>
                    {step.n}
                  </span>
                </div>
                <h3
                  className="text-[15px] font-bold uppercase tracking-[0.08em] text-white/90 mb-3"
                  style={{ fontFamily: "var(--font-display, Inter, system-ui, sans-serif)" }}
                >
                  {step.title}
                </h3>
                <p className="text-[12px] leading-relaxed text-white/35 tracking-[0.03em]">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          MARKETS PREVIEW
      ══════════════════════════════════════════ */}
      <section className="relative z-10 px-6 md:px-12 py-28 border-t border-white/6">
        <div className="max-w-5xl mx-auto">

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10" data-reveal>
            <div>
              <span className="text-[9px] uppercase tracking-[0.24em] text-white/22 block mb-3">Platform preview</span>
              <h2
                className="text-3xl md:text-4xl font-black tracking-[-0.01em]"
                style={{ fontFamily: "var(--font-display, Inter, system-ui, sans-serif)" }}
              >
                Markets in motion.
              </h2>
              <p className="text-white/30 text-[11px] tracking-[0.06em] uppercase mt-2">Sample markets — live data at launch</p>
            </div>
            <div className="flex items-center gap-1 text-[9px] uppercase tracking-[0.14em] text-white/20 border border-white/8 px-4 py-2 shrink-0">
              100+ markets at launch
            </div>
          </div>

          {/* Category pills */}
          <div className="flex items-center gap-2 mb-7 overflow-x-auto pb-2 scrollbar-hide" data-reveal data-reveal-delay="80">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-3 py-1.5 text-[9px] uppercase tracking-[0.18em] ring-1 transition-all duration-200 ${
                  activeCategory === cat
                    ? CAT_ACTIVE_BG[cat]
                    : `${CAT_TEXT[cat]} ring-white/10 bg-transparent hover:bg-white/4`
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredMarkets.map((market, i) => (
              <MarketCard key={market.id} market={market} index={i} />
            ))}
            {filteredMarkets.length === 0 && (
              <div className="col-span-3 py-20 text-center text-[10px] uppercase tracking-[0.18em] text-white/18">
                No sample markets in this category
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          THREE PILLARS
      ══════════════════════════════════════════ */}
      <section className="relative z-10 px-6 md:px-12 py-28 border-t border-white/6">
        <div className="max-w-5xl mx-auto">

          <div className="text-center mb-16" data-reveal>
            <span className="text-[9px] uppercase tracking-[0.26em] text-white/22 block mb-4">What makes us different</span>
            <h2
              className="text-3xl md:text-4xl font-black tracking-[-0.01em]"
              style={{ fontFamily: "var(--font-display, Inter, system-ui, sans-serif)" }}
            >
              Built different.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/5">
            {[
              {
                icon: <Zap className="w-4 h-4" />,
                accent: "text-amber-400",
                border: "border-amber-400/20",
                bg: "bg-amber-400/5",
                n: "01",
                title: "Unified Liquidity Layer",
                body: "One orderbook. All chains. Fragmented prediction markets mean thin liquidity and wide spreads — we aggregate them into a single deep pool so your bet fills at the real price.",
                tags: ["Cross-venue arbitrage", "Deep orderbook", "Zero fragmentation"],
              },
              {
                icon: <Shield className="w-4 h-4" />,
                accent: "text-green-400",
                border: "border-green-400/20",
                bg: "bg-green-400/5",
                n: "02",
                title: "AI-Verified Resolution",
                body: "Oracles fail. Humans get bribed. We layer AI verification over multi-source feeds with cryptoeconomic slashing — markets resolve correctly or someone pays for it.",
                tags: ["Multi-oracle consensus", "AI adjudication", "Slashing penalties"],
              },
              {
                icon: <Globe className="w-4 h-4" />,
                accent: "text-purple-400",
                border: "border-purple-400/20",
                bg: "bg-purple-400/5",
                n: "03",
                title: "Multi-Chain Native",
                body: "One protocol, 16 chains. EVM and beyond — Ethereum, Hedera, Arbitrum, Base, Polygon, Avalanche, Solana, Aptos, Monad, and more — with native cross-chain composability, not siloed deployments.",
                tags: ["16 chains", "EVM + Solana", "Avalanche", "Aptos", "+more"],
              },
            ].map((pillar, i) => (
              <div
                key={pillar.n}
                className="bg-[#050505] p-8 group hover:bg-white/[0.018] transition-colors duration-300"
                data-reveal
                data-reveal-delay={`${i * 100}`}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-9 h-9 border ${pillar.border} ${pillar.bg} flex items-center justify-center ${pillar.accent}`}>
                    {pillar.icon}
                  </div>
                  <span className={`text-[8px] uppercase tracking-[0.2em] ${pillar.accent} opacity-50`}>{pillar.n}</span>
                </div>
                <h3
                  className="text-[15px] font-bold uppercase tracking-[0.07em] text-white/85 mb-4"
                  style={{ fontFamily: "var(--font-display, Inter, system-ui, sans-serif)" }}
                >
                  {pillar.title}
                </h3>
                <p className="text-[12px] leading-relaxed text-white/32 tracking-[0.02em] mb-5">
                  {pillar.body}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {pillar.tags.map((tag) => (
                    <span key={tag} className={`text-[8px] uppercase tracking-[0.14em] px-2 py-0.5 border ${pillar.border} ${pillar.accent} opacity-60`}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CONVICTION STRIP — emotional peak #2
      ══════════════════════════════════════════ */}
      <section className="relative z-10 border-t border-white/6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(251,191,36,0.04), transparent 55%)" }} />
        <div className="px-6 md:px-12 py-20 max-w-5xl mx-auto relative" data-reveal>
          <p className="text-[9px] uppercase tracking-[0.26em] text-white/20 text-center mb-12">Why it matters</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "Prediction markets are the most accurate forecasting tool humans have built. They just need better infrastructure.",
                accent: "border-amber-400/15",
                tag: "On accuracy",
              },
              {
                quote: "When you can parlay macro + crypto + geopolitical outcomes, you stop guessing and start building a real thesis.",
                accent: "border-purple-400/15",
                tag: "On parlays",
              },
              {
                quote: "Every fragmented venue is a missed opportunity. A unified layer doesn\u2019t just aggregate \u2014 it creates a market that couldn\u2019t exist before.",
                accent: "border-green-400/15",
                tag: "On aggregation",
              },
            ].map((item, i) => (
              <div key={i} className={`border ${item.accent} bg-white/[0.015] p-6`} data-reveal data-reveal-delay={`${i * 80}`}>
                <p className="text-[8px] uppercase tracking-[0.18em] text-white/20 mb-4">{item.tag}</p>
                <p
                  className="text-[13px] leading-[1.75] text-white/55 tracking-[0.02em] italic"
                  style={{ fontFamily: "var(--font-display, Inter, system-ui, sans-serif)" }}
                >
                  &ldquo;{item.quote}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          WORLD INDEX
      ══════════════════════════════════════════ */}
      <section className="relative z-10 px-6 md:px-12 py-28 border-t border-white/6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none" style={{ width: "700px", height: "350px", background: "radial-gradient(ellipse at center top, rgba(139,92,246,0.07), transparent 65%)" }} />
        <div className="max-w-5xl mx-auto relative">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12">

            <div className="max-w-xl" data-reveal>
              <span className="text-[9px] uppercase tracking-[0.26em] text-purple-400/45 block mb-4">Predifi World Index</span>
              <h2
                className="text-3xl md:text-4xl font-black tracking-[-0.01em] mb-5"
                style={{ fontFamily: "var(--font-display, Inter, system-ui, sans-serif)" }}
              >
                One number.<br />
                <span className="text-purple-400">Every conviction.</span>
              </h2>
              <p className="text-[13px] leading-relaxed text-white/32 tracking-[0.03em] mb-8">
                The collective intelligence of every market, every chain, every bet — distilled into a signal the world doesn&apos;t have yet. Real-time. Composable. Open.
              </p>
              <Link
                href="/pwi"
                className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-purple-400/65 hover:text-purple-300 border border-purple-400/20 hover:border-purple-400/45 px-5 py-3 transition-all duration-200"
              >
                Explore World Index <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Index display */}
            <div className="border border-purple-400/15 bg-purple-400/[0.03] p-8 min-w-[240px] shrink-0" data-reveal data-reveal-delay="120">
              <div className="text-[9px] uppercase tracking-[0.2em] text-purple-400/40 mb-3">PWI · Global Signal</div>
              <div
                className="text-[64px] font-black text-white/85 tabular-nums leading-none mb-1"
                style={{ fontFamily: "var(--font-display, Inter, system-ui, sans-serif)" }}
              >
                64.2
              </div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-green-400/55 mb-6">↑ +1.4 today</div>
              <div className="space-y-2">
                {[{ label: "Crypto sentiment", v: 58 }, { label: "Political risk", v: 71 }, { label: "Macro stability", v: 43 }].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-[9px] text-white/25 uppercase tracking-[0.1em]">{item.label}</span>
                      <span className="text-[9px] text-white/40 tabular-nums">{item.v}</span>
                    </div>
                    <div className="h-px bg-white/6">
                      <div className="h-px bg-purple-400/40" style={{ width: `${item.v}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-white/5 text-[8px] uppercase tracking-[0.14em] text-white/16">Live data at launch</div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          BUILT WITH
      ══════════════════════════════════════════ */}
      <section className="relative z-10 px-6 md:px-12 py-24 border-t border-white/6">
        <div className="max-w-5xl mx-auto" data-reveal>

          {/* ── Chains ── */}
          <p className="text-[9px] uppercase tracking-[0.26em] text-white/18 text-center mb-6">Supported chains</p>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 mb-14">
            {[
              { name: "Ethereum",   accent: "border-blue-400/18   text-blue-400/50"   },
              { name: "Hedera",     accent: "border-green-400/18  text-green-400/50"  },
              { name: "Arbitrum",   accent: "border-blue-300/18   text-blue-300/50"   },
              { name: "Base",       accent: "border-blue-200/18   text-blue-200/50"   },
              { name: "Optimism",   accent: "border-red-400/18    text-red-400/50"    },
              { name: "BSC",        accent: "border-amber-400/18  text-amber-400/50"  },
              { name: "Polygon",    accent: "border-purple-400/18 text-purple-400/50" },
              { name: "HyperEVM",   accent: "border-cyan-400/18   text-cyan-400/50"   },
              { name: "World Chain",accent: "border-white/12      text-white/38"      },
              { name: "Unichain",   accent: "border-pink-400/18   text-pink-400/50"   },
              { name: "Linea",      accent: "border-white/12      text-white/38"      },
              { name: "Ink",        accent: "border-violet-400/18 text-violet-400/50" },
              { name: "Monad",      accent: "border-indigo-400/18 text-indigo-400/50" },
              { name: "Solana",     accent: "border-green-300/18  text-green-300/50"  },
              { name: "Aptos",      accent: "border-teal-400/18   text-teal-400/50"   },
              { name: "Avalanche",  accent: "border-red-400/18    text-red-400/50"    },
            ].map((p) => (
              <div
                key={p.name}
                className={`border ${p.accent.split(" ")[0]} bg-white/[0.012] hover:bg-white/[0.028] flex items-center justify-center px-2 py-2.5 transition-all duration-200 cursor-default group`}
              >
                <span className={`text-[8px] uppercase tracking-[0.12em] ${p.accent.split(" ")[1]} text-center leading-tight group-hover:opacity-100 transition-opacity duration-200`}>
                  {p.name}
                </span>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-white/5 mb-10" />

          {/* ── Partners ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <p className="text-[9px] uppercase tracking-[0.26em] text-white/18">Integration roadmap</p>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400/60" />
              <span className="text-[8px] uppercase tracking-[0.18em] text-amber-400/45">Confirmed integrations · In progress</span>
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {[
              { name: "Dynamic",      accent: "border-white/12      text-white/38",      tag: "Auth"      },
              { name: "ZeroDev",      accent: "border-violet-400/18 text-violet-400/50", tag: "AA Wallet" },
              { name: "Aave",         accent: "border-purple-400/18 text-purple-400/50", tag: "Liquidity" },
              { name: "Chainlink",    accent: "border-blue-400/18   text-blue-400/50",   tag: "Oracle"    },
              { name: "QuillAudit",   accent: "border-green-400/18  text-green-400/50",  tag: "Security"  },
              { name: "Google Cloud", accent: "border-white/12      text-white/38",      tag: "Infra"     },
              { name: "Databricks",   accent: "border-red-400/18    text-red-400/50",    tag: "Data"      },
            ].map((p) => (
              <div
                key={p.name}
                className={`border ${p.accent.split(" ")[0]} bg-white/[0.012] hover:bg-white/[0.028] flex flex-col items-center justify-center px-3 py-3 transition-all duration-200 cursor-default group gap-1`}
              >
                <span className={`text-[9px] uppercase tracking-[0.12em] ${p.accent.split(" ")[1]} text-center leading-tight group-hover:opacity-100 transition-opacity duration-200`}>
                  {p.name}
                </span>
                <span className="text-[7px] uppercase tracking-[0.16em] text-white/18">{p.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          BOTTOM CTA
      ══════════════════════════════════════════ */}
      <section className="relative z-10 px-6 md:px-12 py-28 border-t border-white/6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(251,191,36,0.04), transparent 60%)" }} />
        <div className="max-w-2xl mx-auto text-center relative" data-reveal>
          <div className="inline-flex items-center gap-2 border border-amber-400/20 bg-amber-400/5 px-4 py-2 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" style={{ animation: "pulse-slow 2s ease-in-out infinite" }} />
            <span className="text-[9px] uppercase tracking-[0.2em] text-amber-400/65">Launch Q2 2026 — Waitlist open now</span>
          </div>
          <h2
            className="text-3xl md:text-[42px] font-black tracking-[-0.015em] leading-[1.05] mb-5"
            style={{ fontFamily: "var(--font-display, Inter, system-ui, sans-serif)" }}
          >
            The market opens soon.<br />
            <span className="text-amber-400">Get in before it does.</span>
          </h2>
          <p className="text-[12px] leading-relaxed text-white/30 tracking-[0.03em] mb-3 max-w-md mx-auto">
            Early waitlist members receive fee discounts, early credit allocations, and first access to new market categories.
          </p>
          <p className="text-[11px] leading-relaxed text-white/18 tracking-[0.04em] mb-10 max-w-sm mx-auto uppercase">
            Referral spots are limited — each friend you invite moves you higher.
          </p>
          <EmailForm size="large" className="max-w-lg mx-auto" />

          {/* Perks list */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-5 text-[9px] uppercase tracking-[0.16em] text-white/22">
            {["Fee discount at launch", "Early credit allocation", "First-mover market access"].map((perk, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-amber-400/40" />
                {perk}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer className="relative z-10 border-t border-white/6 px-6 md:px-12 py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2">
            <Image src="/assets/logo-icon-dark.png" alt="Predifi" width={16} height={16} className="w-4 h-4 opacity-40" />
            <span className="text-[9px] uppercase tracking-[0.2em] text-white/20">© 2026 Predifi</span>
          </div>
          <div className="flex items-center gap-5 flex-wrap justify-center">
            {[
              { label: "World Index", href: "/pwi"                       },
              { label: "Blog",        href: "https://blog.predifi.com"   },
              { label: "Terms",       href: "/tos"                       },
              { label: "Privacy",     href: "/privacy"                   },
              { label: "Twitter",     href: "https://x.com/predifi_com"  },
            ].map(({ label, href }) => (
              <a key={label} href={href} className="text-[9px] uppercase tracking-[0.16em] text-white/22 hover:text-white/55 transition-colors duration-200">
                {label}
              </a>
            ))}
          </div>
          <span className="text-[8px] uppercase tracking-[0.14em] text-white/14">Build 0.1.0 · Development</span>
        </div>
      </footer>
    </div>
  );
}
