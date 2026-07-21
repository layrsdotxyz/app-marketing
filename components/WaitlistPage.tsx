"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, Loader2, ArrowRight, Check, TrendingUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

// ─── Constants ─────────────────────────────────────────────────────────────────

const POSITION_REVEAL_THRESHOLD = 500;
const WAITLIST_ID = process.env.NEXT_PUBLIC_WAITLIST_ID || "32647";

const STYLES = `
  @keyframes ringExpand {
    0%   { transform: scale(0.4); opacity: 0.7; }
    100% { transform: scale(3.2); opacity: 0;   }
  }
  @keyframes pulse-slow {
    0%, 100% { opacity: 0.45; }
    50%       { opacity: 1;   }
  }
  @keyframes feedSlideIn {
    from { opacity: 0; transform: translateY(-5px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes barGrow {
    from { width: 0%; }
    to   { width: var(--bar-target); }
  }
`;

// ─── Product cutout data ───────────────────────────────────────────────────────

const PREVIEW_MARKETS = [
  { q: "Fed rate cut before Q3 2026?",   yes: 62, vol: "$4.2M", cat: "MACRO",    accent: "purple" },
  { q: "BTC exceeds $120k by Dec 2026?", yes: 48, vol: "$8.7M", cat: "CRYPTO",   accent: "amber"  },
  { q: "ETH flips BTC by market cap?",   yes: 19, vol: "$2.1M", cat: "CRYPTO",   accent: "blue"   },
  { q: "US midterm turnout > 55%?",      yes: 71, vol: "$1.4M", cat: "POLITICS", accent: "green"  },
  { q: "AI system wins Nobel Prize?",    yes: 33, vol: "$0.9M", cat: "TECH",     accent: "pink"   },
] as const;

const PARLAY_ROWS = [
  { label: "Fed cut",   prob: 62, mult: "1.61×", accent: "text-purple-300" },
  { label: "BTC $120k", prob: 48, mult: "2.08×", accent: "text-amber-300"  },
];

const PREVIEW_FEED = [
  { addr: "0x3a\u22ef4f2", action: "YES · 240 sh",  val: "+$148",  green: true  },
  { addr: "0x9c\u22ef11b", action: "NO · 85 sh",    val: "-$52",   green: false },
  { addr: "0xf1\u22ef9a3", action: "YES · 500 sh",  val: "+$295",  green: true  },
];

const ACCENTCLS: Record<string, { text: string; bg: string; bar: string }> = {
  purple: { text: "text-purple-300/70", bg: "bg-purple-400/8",  bar: "bg-purple-400/60" },
  amber:  { text: "text-amber-300/70",  bg: "bg-amber-400/8",   bar: "bg-amber-400/60"  },
  blue:   { text: "text-blue-300/70",   bg: "bg-blue-400/8",    bar: "bg-blue-400/60"   },
  green:  { text: "text-green-300/70",  bg: "bg-green-400/8",   bar: "bg-green-400/60"  },
  pink:   { text: "text-pink-300/70",   bg: "bg-pink-400/8",    bar: "bg-pink-400/60"   },
};

// ─── Full-width product cutout ─────────────────────────────────────────────────

function ProductCutout() {
  const [activeRow, setActiveRow] = useState(1);
  const [barPcts,   setBarPcts]   = useState(PREVIEW_MARKETS.map(() => 0));
  const [feedIdx,   setFeedIdx]   = useState(0);
  const [feedTick,  setFeedTick]  = useState(0);

  // Animate bars in on mount
  useEffect(() => {
    const id = setTimeout(() =>
      setBarPcts(PREVIEW_MARKETS.map(m => m.yes)), 150);
    return () => clearTimeout(id);
  }, []);

  // Cycle active row
  useEffect(() => {
    const t = setInterval(() =>
      setActiveRow(p => (p + 1) % PREVIEW_MARKETS.length), 2800);
    return () => clearInterval(t);
  }, []);

  // Cycle feed
  useEffect(() => {
    const t = setInterval(() => {
      setFeedIdx(p => (p + 1) % PREVIEW_FEED.length);
      setFeedTick(p => p + 1);
    }, 1800);
    return () => clearInterval(t);
  }, []);

  const parlayMultiplier = (0.62 * 0.48);
  const parlayPayout = (1 / parlayMultiplier).toFixed(1);

  return (
    <div
      className="w-full mb-10 border border-white/12 bg-[#070707] select-none overflow-hidden"
      style={{
        fontFamily: "var(--font-display, Inter, system-ui, sans-serif)",
        boxShadow: "0 0 60px rgba(251,191,36,0.06), 0 24px 80px rgba(0,0,0,0.6)",
      }}
    >
      {/* ── Browser chrome ── */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/8 bg-white/[0.018]">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400/30" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-500/30" />
        <div className="flex-1 mx-3 px-3 py-1 bg-white/[0.04] border border-white/6 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400/60" style={{ animation: "pulse-slow 2s ease-in-out infinite" }} />
          <span className="text-[8px] text-white/25 tracking-[0.04em]">app.predifi.com</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[7px] uppercase tracking-[0.12em] text-white/15">ETH</span>
          <span className="text-white/8">·</span>
          <span className="text-[7px] uppercase tracking-[0.12em] text-white/15">ARB</span>
          <span className="text-white/8">·</span>
          <span className="text-[7px] uppercase tracking-[0.12em] text-amber-400/35">+14</span>
        </div>
      </div>

      {/* ── App nav ── */}
      <div className="flex items-center gap-0 px-4 border-b border-white/6 bg-black/20">
        {["Markets", "Parlay Builder", "Portfolio", "World Index"].map((tab, i) => (
          <div
            key={tab}
            className={`px-4 py-2.5 text-[8px] uppercase tracking-[0.15em] border-b-2 transition-none ${
              i === 1
                ? "border-amber-400/60 text-amber-400/70"
                : "border-transparent text-white/20"
            }`}
          >
            {tab}
          </div>
        ))}
        <div className="ml-auto flex items-center gap-3 pr-2">
          <span className="text-[7px] uppercase tracking-[0.12em] text-white/15">0x4f…8a2</span>
          <span className="text-[7px] px-2 py-1 border border-amber-400/22 text-amber-400/50 uppercase tracking-[0.12em]">Connect</span>
        </div>
      </div>

      {/* ── Two-pane layout ── */}
      <div className="grid grid-cols-[1fr_200px] divide-x divide-white/6">

        {/* Left: market table */}
        <div>
          {/* Table header */}
          <div className="grid grid-cols-[1fr_64px_72px_44px] gap-0 px-4 py-2 border-b border-white/6">
            {["Market", "YES", "Volume", ""].map(h => (
              <span key={h} className="text-[7px] uppercase tracking-[0.14em] text-white/18">{h}</span>
            ))}
          </div>

          {/* Market rows */}
          {PREVIEW_MARKETS.map((m, i) => {
            const a = ACCENTCLS[m.accent];
            const isActive = i === activeRow;
            return (
              <div
                key={i}
                className={`grid grid-cols-[1fr_64px_72px_44px] gap-0 px-4 py-3 border-b border-white/[0.04] transition-colors duration-300 ${isActive ? "bg-amber-400/[0.025]" : "hover:bg-white/[0.015]"}`}
              >
                {/* Question */}
                <div className="flex items-center gap-2 min-w-0 pr-3">
                  <span className={`shrink-0 text-[7px] uppercase tracking-[0.1em] px-1.5 py-0.5 ${a.text} ${a.bg}`}>
                    {m.cat}
                  </span>
                  <span className="text-[10px] text-white/62 truncate leading-tight">{m.q}</span>
                </div>
                {/* YES prob + bar */}
                <div className="flex flex-col justify-center gap-1">
                  <span className={`text-[11px] font-bold tabular-nums ${isActive ? "text-amber-400" : "text-white/50"}`}>
                    {m.yes}%
                  </span>
                  <div className="h-[2px] bg-white/[0.06]">
                    <div
                      className={`h-full ${a.bar}`}
                      style={{ width: `${barPcts[i]}%`, transition: `width 1s cubic-bezier(0.4,0,0.2,1) ${i * 0.1}s` }}
                    />
                  </div>
                </div>
                {/* Volume */}
                <span className="text-[10px] tabular-nums text-white/28 flex items-center">{m.vol}</span>
                {/* Add to parlay */}
                <div className="flex items-center">
                  <span className={`text-[7px] uppercase tracking-[0.1em] px-1.5 py-1 border cursor-default transition-colors ${isActive ? "border-amber-400/35 text-amber-400/60 bg-amber-400/8" : "border-white/8 text-white/18"}`}>
                    {i < 2 ? "✓" : "+"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: parlay builder panel */}
        <div className="flex flex-col">
          {/* Panel header */}
          <div className="px-4 py-2.5 border-b border-white/6 bg-white/[0.01]">
            <p className="text-[7px] uppercase tracking-[0.18em] text-white/22 mb-0.5">Parlay Builder</p>
            <p className="text-[8px] text-white/12">2 legs selected</p>
          </div>

          {/* Legs */}
          <div className="flex-1 p-3 space-y-2">
            {PARLAY_ROWS.map((r, i) => (
              <div key={i} className="border border-white/8 bg-white/[0.02] p-2.5">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[8px] ${r.accent}`}>{r.label}</span>
                  <span className="text-[8px] text-amber-400/60 tabular-nums font-bold">{r.mult}</span>
                </div>
                <div className="h-px bg-white/[0.06]">
                  <div className="h-px bg-amber-400/40" style={{ width: `${r.prob}%` }} />
                </div>
              </div>
            ))}

            {/* Payout preview */}
            <div className="border border-amber-400/18 bg-amber-400/[0.03] p-3 mt-3">
              <p className="text-[7px] uppercase tracking-[0.14em] text-white/20 mb-2">Combined payout</p>
              <p
                className="text-[28px] font-black text-amber-400 tabular-nums leading-none"
                style={{ textShadow: "0 0 20px rgba(251,191,36,0.4)" }}
              >
                {parlayPayout}×
              </p>
              <p className="text-[7px] text-white/18 mt-1">$100 → ${Math.round(parseFloat(parlayPayout) * 100)}</p>
            </div>
          </div>

          {/* Live feed */}
          <div className="border-t border-white/6 p-3">
            <p className="text-[7px] uppercase tracking-[0.12em] text-white/15 mb-2">Live activity</p>
            <div className="overflow-hidden" style={{ height: 48 }}>
              {[0, 1, 2].map(offset => {
                const f = PREVIEW_FEED[(feedIdx + offset) % PREVIEW_FEED.length];
                return (
                  <div
                    key={`${feedTick}-${offset}`}
                    className="flex items-center justify-between py-1"
                    style={offset === 0 ? { animation: "feedSlideIn 0.3s ease-out both" } : undefined}
                  >
                    <span className="text-[7px] font-mono text-white/20 truncate">{f.addr}</span>
                    <span className={`text-[7px] tabular-nums ${f.green ? "text-green-400/60" : "text-red-400/50"}`}>{f.val}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Status bar ── */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t border-white/6 bg-black/30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-green-400/70" />
            <span className="text-[6.5px] uppercase tracking-[0.1em] text-white/18">On-chain</span>
          </div>
          <span className="text-white/8">·</span>
          <span className="text-[6.5px] uppercase tracking-[0.1em] text-white/15">0% house edge</span>
        </div>
        <div className="flex items-center gap-2">
          {["ETH", "ARB", "SOL", "BASE"].map(c => (
            <span key={c} className="text-[6px] uppercase text-white/20 tracking-[0.08em]">{c}</span>
          ))}
          <span className="text-[6.5px] text-amber-400/30 uppercase tracking-[0.08em]">+12 chains</span>
        </div>
      </div>
    </div>
  );
}

// ─── Types ─────────────────────────────────────────────────────────────────────

type SuccessResult = {
  position: number | null;
  referralLink: string;
  email: string;
  alreadyRegistered: boolean;
};

// ─── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  email: z.string().trim().email("Enter a valid email address").max(255),
});
type FormValues = z.infer<typeof schema>;

// ─── Inner form (needs Suspense wrapper for useSearchParams) ───────────────────

function WaitlistFormInner({ onSuccess }: { onSuccess: (r: SuccessResult) => void }) {
  const searchParams = useSearchParams();
  const refParam = searchParams.get("ref") || searchParams.get("referral_link") || "";
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const email = values.email.toLowerCase().trim();
      const gwBody: Record<string, unknown> = { email, waitlist_id: Number(WAITLIST_ID) };
      if (refParam) gwBody.referral_link = refParam;

      const gwRes = await fetch("https://api.getwaitlist.com/api/v1/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gwBody),
      });
      const gwData = await gwRes.json();
      if (!gwRes.ok) throw new Error(gwData.error_string || "Failed to join waitlist");

      fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: gwData.email,
          referral_link: gwData.referral_link ?? "",
          already_registered: gwData.already_registered ?? false,
        }),
      }).catch(() => {});

      localStorage.setItem("waitlist_email", gwData.email);
      localStorage.setItem("waitlist_referral_link", gwData.referral_link || "");
      localStorage.setItem("waitlist_position", String(gwData.priority ?? ""));

      onSuccess({
        position: gwData.priority ?? null,
        referralLink: gwData.referral_link || "",
        email: gwData.email,
        alreadyRegistered: gwData.already_registered ?? false,
      });
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Something went wrong. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {refParam && (
        <div className="flex items-center gap-2 mb-5 border border-green-500/20 bg-green-500/[0.04] px-4 py-2.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
          <p className="text-[11px] text-white/40 tracking-[0.02em]">
            You were referred &mdash; you&apos;ll start ahead in the queue.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <input
            {...register("email")}
            type="email"
            autoComplete="email"
            placeholder="your@email.com"
            className="w-full bg-white/[0.04] border border-white/12 hover:border-white/22 focus:border-amber-400/50 focus:outline-none text-white placeholder:text-white/18 text-[13px] tracking-[0.03em] px-4 py-3.5 transition-colors duration-200"
          />
          {errors.email && (
            <p className="text-[11px] text-red-400 mt-1.5 tracking-[0.02em]">{errors.email.message}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 disabled:bg-amber-400/25 disabled:cursor-not-allowed text-black text-[11px] font-bold uppercase tracking-[0.22em] py-3.5 transition-colors duration-150"
        >
          {isSubmitting
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <><span>Claim your spot</span><ArrowRight className="w-3.5 h-3.5" /></>
          }
        </button>
      </form>

      <p className="text-[9px] uppercase tracking-[0.12em] text-white/18 text-center mt-4 leading-relaxed">
        By joining you agree to our{" "}
        <Link href="/tos" className="text-white/30 hover:text-white/55 transition-colors underline underline-offset-2">Terms</Link>
        {" "}and{" "}
        <Link href="/privacy" className="text-white/30 hover:text-white/55 transition-colors underline underline-offset-2">Privacy Policy</Link>
      </p>
    </div>
  );
}

// ─── Success view ──────────────────────────────────────────────────────────────

function SuccessView({ result }: { result: SuccessResult }) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    if (!result.referralLink) return;
    try {
      await navigator.clipboard.writeText(result.referralLink);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const tweetText = `Just joined the Predifi waitlist — the prime broker for prediction markets. One account, every chain, zero house edge. Join via my link: ${result.referralLink}`;
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

  return (
    <div className="w-full max-w-lg mx-auto">

      {/* Animated rings + checkmark */}
      <div className="relative flex items-center justify-center mb-12">
        <div
          className="absolute w-20 h-20"
          style={{ borderRadius: "50%", border: "1px solid rgba(251,191,36,0.55)", animation: "ringExpand 1.2s ease-out forwards" }}
        />
        <div
          className="absolute w-20 h-20"
          style={{ borderRadius: "50%", border: "1px solid rgba(16,185,129,0.38)", animation: "ringExpand 1.6s ease-out 0.2s forwards" }}
        />
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 18, delay: 0.2 }}
          className="w-16 h-16 border border-green-500/30 bg-green-500/[0.07] flex items-center justify-center"
        >
          <Check className="w-7 h-7 text-green-400" strokeWidth={1.75} />
        </motion.div>
      </div>

      {/* Status text */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="text-center mb-8"
      >
        <p className="text-[9px] uppercase tracking-[0.3em] text-white/25 mb-3">
          {result.alreadyRegistered ? "Already registered" : "Access secured"}
        </p>
        <h2
          className="text-[40px] md:text-[52px] font-black uppercase tracking-[0.03em] leading-none mb-4"
          style={{ fontFamily: "var(--font-display, Inter, system-ui, sans-serif)" }}
        >
          {result.alreadyRegistered ? "STILL IN." : "YOU\u2019RE IN."}
        </h2>
        <p className="text-[12px] text-white/30 tracking-[0.03em]">
          {result.alreadyRegistered
            ? <>Spot held at <span className="text-white/60">{result.email}</span>.</>
            : <>Confirmation sent to <span className="text-white/60">{result.email}</span>. We\u2019ll notify you at launch.</>
          }
        </p>
      </motion.div>

      {/* Position */}
      {result.position !== null && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="border border-white/8 bg-white/[0.02] p-6 text-center mb-4"
        >
          <p className="text-[9px] uppercase tracking-[0.22em] text-white/22 mb-3">Your position</p>
          {result.position >= POSITION_REVEAL_THRESHOLD ? (
            <p
              className="text-[64px] font-black tabular-nums leading-none text-white/82"
              style={{ fontFamily: "var(--font-display, Inter, system-ui, sans-serif)" }}
            >
              #{result.position}
            </p>
          ) : (
            <div>
              <p className="text-[15px] font-black uppercase tracking-[0.16em] text-amber-400 mb-1">EARLY ACCESS</p>
              <p className="text-[9px] uppercase tracking-[0.14em] text-white/20">First wave &middot; Position locked</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Referral CTA — the primary action after signup */}
      {result.referralLink && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="border border-amber-400/20 bg-amber-400/[0.035] p-6 mb-5"
        >
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-amber-400/55" />
            <p className="text-[9px] uppercase tracking-[0.22em] text-amber-400/55">Move up the queue</p>
          </div>
          <p className="text-[11px] text-white/32 mb-4 leading-relaxed">
            Each person who joins using your link moves you one position higher. No limit.
          </p>

          <div className="flex gap-2 mb-3">
            <div className="flex-1 border border-white/8 bg-black/20 px-3 py-2.5 font-mono text-[10px] text-white/32 truncate">
              {result.referralLink}
            </div>
            <button
              onClick={copyLink}
              className="shrink-0 border border-white/12 hover:border-amber-400/40 bg-white/[0.02] hover:bg-amber-400/[0.06] px-4 py-2.5 text-[9px] uppercase tracking-[0.18em] transition-all duration-200 flex items-center gap-1.5 text-white/32 hover:text-white/60"
            >
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <a
            href={tweetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full border border-white/8 hover:border-white/18 bg-white/[0.015] hover:bg-white/[0.03] py-2.5 text-[9px] uppercase tracking-[0.18em] text-white/28 hover:text-white/55 transition-all duration-200"
          >
            Share on X &nbsp;&middot;&nbsp; Move up
            <ArrowRight className="w-3 h-3" />
          </a>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-center"
      >
        <Link href="/" className="text-[9px] uppercase tracking-[0.2em] text-white/20 hover:text-white/45 transition-colors duration-200">
          ← Back to Predifi
        </Link>
      </motion.div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function WaitlistPage() {
  const [result, setResult] = useState<SuccessResult | null>(null);

  // Restore previous signup from localStorage on mount
  useEffect(() => {
    const email = localStorage.getItem("waitlist_email");
    if (email) {
      setResult({
        position: Number(localStorage.getItem("waitlist_position")) || null,
        referralLink: localStorage.getItem("waitlist_referral_link") || "",
        email,
        alreadyRegistered: true,
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <style>{STYLES}</style>

      {/* ── Background grid + glows ── */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />
      <div className="fixed pointer-events-none z-0" style={{
        top: 0, right: 0, width: "800px", height: "600px",
        background: "radial-gradient(ellipse at 70% 20%, rgba(251,191,36,0.045) 0%, transparent 60%)",
      }} />
      <div className="fixed pointer-events-none z-0" style={{
        bottom: 0, left: 0, width: "600px", height: "500px",
        background: "radial-gradient(ellipse at 25% 75%, rgba(16,185,129,0.03) 0%, transparent 60%)",
      }} />

      {/* ── Nav ── */}
      <nav
        className="relative z-50 flex items-center justify-between px-6 md:px-12 py-4 border-b border-white/6"
        style={{ backdropFilter: "blur(12px)", background: "rgba(5,5,5,0.82)" }}
      >
        <Link href="/" className="flex items-center gap-2.5 opacity-85 hover:opacity-100 transition-opacity duration-200">
          <Image src="/assets/logo-icon-dark.png" alt="Predifi" width={22} height={22} className="w-[22px] h-[22px]" />
          <span className="text-[11px] uppercase tracking-[0.26em] font-semibold hidden sm:inline">Predifi</span>
        </Link>

        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 border border-amber-400/18 bg-amber-400/[0.025]">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400" style={{ animation: "pulse-slow 2.5s ease-in-out infinite" }} />
          <span className="text-[9px] uppercase tracking-[0.2em] text-amber-400/60">Launch Q2 2026 &mdash; Early access open</span>
        </div>

        <Link href="/" className="text-[9px] uppercase tracking-[0.18em] text-white/28 hover:text-white/60 transition-colors duration-200">
          ← Back
        </Link>
      </nav>

      {/* ── Main ── */}
      <main className="relative z-10 px-6 md:px-12">
        <AnimatePresence mode="wait">

          {result ? (
            /* ════ SUCCESS STATE ════ */
            <motion.div
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="min-h-[calc(100vh-57px)] flex items-center justify-center py-20"
            >
              <SuccessView result={result} />
            </motion.div>

          ) : (
            /* ════ FORM STATE ════ */
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="py-16 min-h-[calc(100vh-57px)]"
            >
              <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-16 items-start">

                {/* ── Left: brand context ── */}
                <div>
                  <div className="flex items-center gap-2 mb-7">
                    <span className="w-1 h-1 rounded-full bg-amber-400/55" />
                    <span className="text-[9px] uppercase tracking-[0.26em] text-amber-400/45">Decentralized Prediction Markets</span>
                    <span className="w-1 h-1 rounded-full bg-amber-400/55" />
                  </div>

                  <h1
                    className="text-[44px] md:text-[58px] font-black uppercase tracking-[-0.015em] leading-[1.0] mb-6"
                    style={{ fontFamily: "var(--font-display, Inter, system-ui, sans-serif)" }}
                  >
                    Claim your spot<br />
                    <span className="text-amber-400">before launch.</span>
                  </h1>

                  <p className="text-[13px] leading-[1.85] text-white/38 tracking-[0.03em] max-w-md mb-8">
                    Predifi is the prime broker for prediction markets &mdash; one account, best price, every outcome, on any chain.
                    Early access opens Q2 2026. Waitlist members get in first.
                  </p>

                  {/* Product cutout */}
                  <ProductCutout />

                  {/* Stats 2×2 */}
                  <div className="grid grid-cols-2 gap-2 max-w-xs mb-10">
                    {[
                      { value: "17.7×", label: "Max parlay payout"  },
                      { value: "16",    label: "Chains at launch"   },
                      { value: "100+",  label: "Markets at genesis" },
                      { value: "0%",    label: "House edge. Ever."  },
                    ].map((s) => (
                      <div key={s.label} className="border border-white/8 bg-white/[0.02] px-4 py-4">
                        <div
                          className="text-[24px] font-black text-white/82 tabular-nums leading-none mb-1"
                          style={{ fontFamily: "var(--font-display, Inter, system-ui, sans-serif)" }}
                        >
                          {s.value}
                        </div>
                        <div className="text-[8px] uppercase tracking-[0.15em] text-white/26">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Referral teaser — shown BEFORE signup to motivate */}
                  <div className="border border-amber-400/15 bg-amber-400/[0.025] p-5 max-w-xs">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-3.5 h-3.5 text-amber-400/55" />
                      <p className="text-[9px] uppercase tracking-[0.2em] text-amber-400/55">Move up the queue</p>
                    </div>
                    <p className="text-[11px] text-white/32 leading-relaxed mb-4">
                      After joining, share your personal referral link. Each confirmed signup moves you one position higher &mdash; no limit.
                    </p>
                    {/* Rank visual */}
                    <div className="flex items-end gap-1">
                      {[2, 3, 4, 5, 7, 9, 6].map((h, i) => (
                        <div key={i} className={i === 5 ? "bg-amber-400/70" : "bg-white/10"} style={{ width: 10, height: h * 5 }} />
                      ))}
                      <span className="text-[8px] text-amber-400/50 uppercase tracking-[0.1em] pb-0.5 ml-1">&uarr; You</span>
                    </div>
                  </div>
                </div>

                {/* ── Right: form card ── */}
                <div className="lg:sticky lg:top-24">
                  <div className="border border-white/10 bg-white/[0.025] p-8">
                    <p className="text-[9px] uppercase tracking-[0.26em] text-white/22 mb-2">Join the waitlist</p>
                    <p
                      className="text-[22px] font-black uppercase tracking-[0.04em] mb-7"
                      style={{ fontFamily: "var(--font-display, Inter, system-ui, sans-serif)" }}
                    >
                      GET ACCESS.
                    </p>
                    <Suspense
                      fallback={
                        <div className="flex items-center justify-center py-10">
                          <Loader2 className="w-5 h-5 animate-spin text-white/20" />
                        </div>
                      }
                    >
                      <WaitlistFormInner onSuccess={setResult} />
                    </Suspense>
                  </div>

                  <div className="flex items-center justify-center gap-4 mt-4 text-[8px] uppercase tracking-[0.13em] text-white/18">
                    <span>No spam</span>
                    <span className="text-white/8">&middot;</span>
                    <span>Free to join</span>
                    <span className="text-white/8">&middot;</span>
                    <span>Cancel anytime</span>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

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
              { label: "Terms",       href: "/tos"                      },
              { label: "Privacy",     href: "/privacy"                  },
              { label: "Twitter",     href: "https://x.com/predifi_com" },
            ].map(({ label, href }) => (
              <a key={label} href={href} className="text-[8px] uppercase tracking-[0.15em] text-white/18 hover:text-white/45 transition-colors duration-200">
                {label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
