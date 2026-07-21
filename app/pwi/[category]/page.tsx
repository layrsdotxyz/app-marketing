import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

export const revalidate = 3600;

// ─── Constants ─────────────────────────────────────────────────────────────────

const VALID_CATEGORIES = [
  "geopolitics", "economics", "politics", "technology", "climate", "crypto", "sports",
] as const;

type Category = (typeof VALID_CATEGORIES)[number];

const CATEGORY_WEIGHTS: Record<Category, number> = {
  geopolitics: 0.25, economics: 0.25, politics: 0.20,
  technology:  0.10, climate:   0.10, crypto:   0.05, sports: 0.05,
};

const CATEGORY_DESCRIPTIONS: Record<Category, string> = {
  geopolitics: "Wars, alliances, sanctions, and territorial disputes — geopolitical prediction markets reveal where the crowd assigns risk.",
  economics:   "Inflation, rate decisions, GDP growth, and recession probability — the market's quantified forecast for the global economy.",
  politics:    "Elections, legislation, and leadership changes. Prediction markets aggregate better-informed sentiment than traditional polling.",
  technology:  "Regulatory outcomes, product launches, AI milestones, and sector moves — the crowd's forward view on tech.",
  climate:     "Policy, extreme weather events, and emissions targets — where prediction markets intersect with climate risk.",
  crypto:      "Price targets, ETF approvals, network upgrades, and regulatory developments in the digital asset space.",
  sports:      "Championships, match outcomes, drafts, and player milestones — sports prediction markets as a liquidity signal.",
};

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Market {
  externalId: string;
  source: string;
  question: string;
  yesProbability: number;
  volumeUsd: number;
  stabilityScore: number;
}

interface CategoryData {
  category: Category;
  score: number | null;
  scoreDelta: number | null;
  markets: Market[];
}

// ─── Data fetching ──────────────────────────────────────────────────────────────

async function fetchCategory(category: Category): Promise<CategoryData | null> {
  try {
    const res = await fetch(`https://api.predifi.com/api/index/category/${category}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return (await res.json()) as CategoryData;
  } catch { return null; }
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

type StressLevel = "stable" | "moderate" | "stressed" | "critical";

function stressLevel(score: number): StressLevel {
  if (score >= 60) return "stable";
  if (score >= 42) return "moderate";
  if (score >= 26) return "stressed";
  return "critical";
}

const STRESS = {
  stable:   { border: "border-green-500/28",  bg: "bg-green-500/[0.04]",  bar: "bg-green-500",  text: "text-green-400",  accent: "#10b981" },
  moderate: { border: "border-amber-400/28",  bg: "bg-amber-400/[0.04]",  bar: "bg-amber-400",  text: "text-amber-400",  accent: "#f59e0b" },
  stressed: { border: "border-orange-500/30", bg: "bg-orange-500/[0.04]", bar: "bg-orange-500", text: "text-orange-400", accent: "#f97316" },
  critical: { border: "border-red-500/35",    bg: "bg-red-500/[0.05]",    bar: "bg-red-500",    text: "text-red-400",    accent: "#ef4444" },
};

function formatVolume(usd: number): string {
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`;
  if (usd >= 1_000)     return `$${(usd / 1_000).toFixed(0)}K`;
  return `$${usd.toFixed(0)}`;
}

function probColor(p: number): string {
  if (p >= 0.70) return "text-green-400";
  if (p >= 0.45 && p <= 0.55) return "text-amber-400";
  if (p <= 0.30) return "text-red-400";
  return "text-white/65";
}

// ─── Static params ──────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  return VALID_CATEGORIES.map((category) => ({ category }));
}

// ─── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const title = `${category.charAt(0).toUpperCase() + category.slice(1)} Index | Predifi World Index`;
  return {
    title,
    description: CATEGORY_DESCRIPTIONS[category as Category] ?? "Prediction market intelligence.",
    alternates: { canonical: `https://predifi.com/pwi/${category}` },
    openGraph: { title, description: CATEGORY_DESCRIPTIONS[category as Category] ?? "", url: `https://predifi.com/pwi/${category}` },
  };
}

// ─── Score gauge ───────────────────────────────────────────────────────────────

function ScoreGauge({ score, color }: { score: number; color: string }) {
  const pct = Math.max(2, Math.min(98, score));
  return (
    <div className="mt-6">
      <div className="relative h-2 bg-white/[0.04] border border-white/6">
        <div className="absolute inset-0 flex">
          <div className="w-1/4 bg-red-500/10" />
          <div className="w-1/4 bg-orange-500/8" />
          <div className="w-1/4 bg-amber-500/6" />
          <div className="w-1/4 bg-green-500/8" />
        </div>
        <div className="absolute top-0 bottom-0 w-px bg-white/70" style={{ left: `${pct}%` }} />
        <div className="absolute top-1/2 -translate-y-1/2 w-2 h-2 border border-black/40" style={{ left: `calc(${pct}% - 4px)`, background: color }} />
      </div>
      <div className="flex justify-between mt-1.5 text-[7px] uppercase tracking-[0.14em] text-white/20">
        <span>0 &middot; Extreme</span><span>25</span><span>50 &middot; Moderate</span><span>75</span><span>100 &middot; Stable</span>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: raw } = await params;
  if (!VALID_CATEGORIES.includes(raw as Category)) notFound();

  const category    = raw as Category;
  const weight      = (CATEGORY_WEIGHTS[category] * 100).toFixed(0);
  const displayName = category.charAt(0).toUpperCase() + category.slice(1);
  const data        = await fetchCategory(category);

  const otherCategories = VALID_CATEGORIES.filter(c => c !== category);

  // No data state
  if (!data || data.score === null) {
    const sl = stressLevel(50);
    const c  = STRESS[sl];
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col">
        <style>{`@keyframes pulse-slow{0%,100%{opacity:.45}50%{opacity:1}}`}</style>
        <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(to right,rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,0.03) 1px,transparent 1px)", backgroundSize: "72px 72px" }} />
        <nav className="relative z-50 flex items-center justify-between px-6 md:px-12 py-4 border-b border-white/6 bg-[#050505]/80 backdrop-blur-sm">
          <Link href="/" className="flex items-center gap-2.5 opacity-85 hover:opacity-100 transition-opacity">
            <Image src="/assets/logo-icon-dark.png" alt="Predifi" width={22} height={22} className="w-[22px] h-[22px]" />
            <span className="text-[11px] uppercase tracking-[0.26em] font-semibold hidden sm:inline">Predifi</span>
          </Link>
          <div className="flex items-center gap-2 text-white/20 text-xs">
            <Link href="/pwi" className="hover:text-white/50 transition-colors">Index</Link>
            <span>/</span>
            <span className={`uppercase tracking-[0.14em] text-[9px] ${c.text}`}>{displayName}</span>
          </div>
          <Link href="/waitlist" className="text-[9px] uppercase tracking-[0.18em] text-amber-400/60 hover:text-amber-300 border border-amber-400/20 px-3 py-1.5 transition-colors">Join waitlist</Link>
        </nav>
        <main className="flex-1 flex flex-col items-center justify-center px-6 text-center relative z-10">
          <p className={`text-[9px] uppercase tracking-[0.26em] ${c.text} opacity-55 mb-5`}>{displayName} Index</p>
          <h1 className="text-[36px] font-black uppercase tracking-[-0.01em] mb-5" style={{ fontFamily: "var(--font-display, Inter, system-ui, sans-serif)" }}>
            Data available<br />after first run
          </h1>
          <p className="text-[12px] text-white/30 leading-relaxed mb-6 max-w-sm">
            The index runs daily at 5AM UTC. Category market data will appear after the first run.
          </p>
          <Link href="/pwi" className="text-[9px] uppercase tracking-[0.18em] text-white/28 hover:text-white/55 border border-white/8 px-5 py-2.5 transition-all">
            ← World Index
          </Link>
        </main>
      </div>
    );
  }

  const sl = stressLevel(data.score);
  const c  = STRESS[sl];
  const sortedMarkets = [...data.markets].sort((a, b) => b.volumeUsd - a.volumeUsd);
  const sources = Array.from(new Set(sortedMarkets.map(m => m.source)));

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <style>{`@keyframes pulse-slow{0%,100%{opacity:.45}50%{opacity:1}}`}</style>

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{ backgroundImage: "linear-gradient(to right,rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,0.03) 1px,transparent 1px)", backgroundSize: "72px 72px" }} />

      {/* ── Nav ── */}
      <nav className="relative z-50 flex items-center justify-between px-6 md:px-12 py-4 border-b border-white/6" style={{ backdropFilter: "blur(12px)", background: "rgba(5,5,5,0.82)" }}>
        <Link href="/" className="flex items-center gap-2.5 opacity-85 hover:opacity-100 transition-opacity duration-200">
          <Image src="/assets/logo-icon-dark.png" alt="Predifi" width={22} height={22} className="w-[22px] h-[22px]" />
          <span className="text-[11px] uppercase tracking-[0.26em] font-semibold hidden sm:inline">Predifi</span>
        </Link>
        <div className="flex items-center gap-2 text-white/20 text-[9px] uppercase tracking-[0.14em]">
          <Link href="/pwi" className="hover:text-white/50 transition-colors">Index</Link>
          <span className="text-white/12">/</span>
          <span className={c.text}>{displayName}</span>
        </div>
        <Link href="/waitlist" className="text-[9px] uppercase tracking-[0.18em] text-amber-400/60 hover:text-amber-300 border border-amber-400/20 hover:border-amber-400/40 px-3 py-1.5 transition-all duration-200">
          Join waitlist
        </Link>
      </nav>

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className={`relative z-10 border-b border-white/6 ${c.bg}`}>
        {/* Top accent line */}
        <div className={`absolute top-0 left-0 right-0 h-px ${c.bar} opacity-40`} />
        <div className="max-w-5xl mx-auto px-6 md:px-12 py-14 md:py-18">

          <p className={`text-[9px] uppercase tracking-[0.26em] ${c.text} opacity-55 mb-2`}>
            {displayName} Index &middot; {weight}% of World Index
          </p>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="flex items-baseline gap-4 mb-2">
                <span
                  className="text-[72px] md:text-[88px] font-black tabular-nums leading-none text-white/88"
                  style={{ fontFamily: "var(--font-display, Inter, system-ui, sans-serif)" }}
                >
                  {data.score.toFixed(1)}
                </span>
                <div className="flex flex-col gap-1">
                  <span className="text-white/25 text-lg">/100</span>
                  {data.scoreDelta !== null && (
                    <span className={`text-sm tabular-nums ${data.scoreDelta > 0 ? "text-green-400" : data.scoreDelta < 0 ? "text-red-400" : "text-white/28"}`}>
                      {data.scoreDelta > 0 ? "+" : ""}{data.scoreDelta.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
              <span className={`text-[8px] uppercase tracking-[0.18em] px-2 py-1 border ${c.border} ${c.text} opacity-55`}>{sl}</span>
            </div>
            <p className="text-[13px] text-white/38 leading-relaxed max-w-md tracking-[0.02em]">
              {CATEGORY_DESCRIPTIONS[category]}
            </p>
          </div>

          <ScoreGauge score={data.score} color={c.accent} />
        </div>
      </section>

      {/* ══════════════════════════════════════════
          MARKET TABLE — terminal feel
      ══════════════════════════════════════════ */}
      <section className="relative z-10 px-6 md:px-12 py-14">
        <div className="max-w-5xl mx-auto">

          <div className="flex items-center justify-between mb-6">
            <p className="text-[9px] uppercase tracking-[0.26em] text-white/22">
              Constituent markets
              <span className="ml-3 text-white/15">({sortedMarkets.length})</span>
            </p>
            {sources.length > 0 && (
              <p className="text-[8px] uppercase tracking-[0.14em] text-white/18">
                Sources: {sources.join(" &middot; ")}
              </p>
            )}
          </div>

          {sortedMarkets.length === 0 ? (
            <div className="border border-white/6 bg-white/[0.015] py-16 text-center">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/20">
                No qualifying markets in the latest run
              </p>
            </div>
          ) : (
            <div className="border border-white/8 overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[1fr_80px_80px_80px] border-b border-white/8 bg-white/[0.015] px-5 py-3 text-[8px] uppercase tracking-[0.18em] text-white/22">
                <span>Market</span>
                <span className="text-right">Yes %</span>
                <span className="text-right">Stability</span>
                <span className="text-right">Volume</span>
              </div>

              {sortedMarkets.map((market, i) => (
                <div
                  key={market.externalId}
                  className={`grid grid-cols-[1fr_80px_80px_80px] px-5 py-4 items-center border-b border-white/5 last:border-0 transition-colors duration-150 hover:bg-white/[0.02] ${i % 2 === 0 ? "" : "bg-white/[0.008]"}`}
                >
                  <div className="flex items-start gap-2.5 pr-4 min-w-0">
                    <span className={`shrink-0 mt-0.5 text-[7px] uppercase tracking-[0.14em] px-1.5 py-0.5 border ${c.border} ${c.text} opacity-55`}>
                      {market.source}
                    </span>
                    <span className="text-[12px] text-white/70 leading-snug truncate">{market.question}</span>
                  </div>
                  <div className="text-right tabular-nums">
                    <span className={`text-[13px] font-semibold ${probColor(market.yesProbability)}`}>
                      {(market.yesProbability * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <div className="w-10 h-px bg-white/10 hidden sm:block">
                        <div className={`h-px ${c.bar}`} style={{ width: `${Math.max(2, market.stabilityScore * 100)}%` }} />
                      </div>
                      <span className="text-[12px] tabular-nums text-white/45">
                        {(market.stabilityScore * 100).toFixed(0)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right tabular-nums text-[12px] text-white/35">
                    {formatVolume(market.volumeUsd)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          OTHER CATEGORIES
      ══════════════════════════════════════════ */}
      <section className="relative z-10 border-t border-white/6 px-6 md:px-12 py-10">
        <div className="max-w-5xl mx-auto">
          <p className="text-[9px] uppercase tracking-[0.22em] text-white/18 mb-5">Other categories</p>
          <div className="flex flex-wrap gap-2">
            {otherCategories.map((cat) => {
              const oc = STRESS[stressLevel(50)]; // neutral since we don't have scores here
              return (
                <Link
                  key={cat}
                  href={`/pwi/${cat}`}
                  className="text-[9px] uppercase tracking-[0.14em] text-white/30 hover:text-white/60 border border-white/8 hover:border-white/18 px-4 py-2 transition-all duration-200"
                >
                  {cat}
                </Link>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-8">
            <Link href="/pwi" className="text-[9px] uppercase tracking-[0.18em] text-white/30 hover:text-white/60 border border-white/8 hover:border-white/18 px-5 py-2.5 transition-all duration-200">
              ← World Index
            </Link>
            <Link href="https://blog.predifi.com" className={`text-[9px] uppercase tracking-[0.18em] ${c.text} opacity-60 hover:opacity-100 border ${c.border} px-5 py-2.5 transition-all duration-200`}>
              Market Analysis
            </Link>
            <Link href="/waitlist" className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-black text-[9px] font-bold uppercase tracking-[0.2em] px-5 py-2.5 transition-colors duration-150">
              Join Waitlist
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/6 px-6 md:px-12 py-5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Image src="/assets/logo-icon-dark.png" alt="" width={14} height={14} className="w-3.5 h-3.5 opacity-[0.28]" />
            <span className="text-[8px] uppercase tracking-[0.18em] text-white/18">&copy; 2026 Predifi</span>
          </div>
          <div className="flex items-center gap-5 flex-wrap justify-center">
            {[
              { label: "World Index", href: "/pwi"                      },
              { label: "Blog",        href: "https://blog.predifi.com"  },
              { label: "Waitlist",    href: "/waitlist"                 },
              { label: "Terms",       href: "/tos"                      },
              { label: "Privacy",     href: "/privacy"                  },
            ].map(({ label, href }) => (
              <a key={label} href={href} className="text-[8px] uppercase tracking-[0.14em] text-white/18 hover:text-white/45 transition-colors duration-200">{label}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
