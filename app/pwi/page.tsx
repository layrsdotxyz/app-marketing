import type { Metadata } from "next";
import PWITerminal from "@/components/PWITerminal";

export const revalidate = 21600; // recompute every 6 hours

export const metadata: Metadata = {
  title: "Predifi World Index | Prediction Market Intelligence Terminal",
  description:
    "The Predifi World Index — real-time global intelligence derived from prediction market consensus across geopolitics, economics, politics, technology, climate, crypto and sports. Divergence scanner included.",
  alternates: { canonical: "https://predifi.com/pwi" },
  openGraph: {
    title: "Predifi World Index",
    description: "Real-time global intelligence from prediction market consensus. Divergence scanner across 35 signals.",
    url: "https://predifi.com/pwi",
    images: ["/og-image.png"],
  },
  twitter: {
    title: "Predifi World Index",
    description: "Real-time global intelligence from prediction market consensus. No analysts. No bias. 35 divergence signals.",
  },
};

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
interface HistoryPoint {
  date: string;
  score: number;
  label: string;
  delta: number | null;
}

// ─── Data fetching ──────────────────────────────────────────────────────────────

async function fetchWorldIndex(): Promise<WorldIndex | null> {
  try {
    const res = await fetch("https://api.predifi.com/api/index/world", { next: { revalidate: 21600 } });
    if (!res.ok) return null;
    return (await res.json()) as WorldIndex;
  } catch { return null; }
}

async function fetchHistory(): Promise<HistoryPoint[]> {
  try {
    const res = await fetch("https://api.predifi.com/api/index/history?days=30", { next: { revalidate: 21600 } });
    if (!res.ok) return [];
    const data = (await res.json()) as { history: HistoryPoint[] };
    return data.history ?? [];
  } catch { return []; }
}

// ─── Mock fallback — shown when API is offline (pre-launch) ───────────────────

const MOCK_WORLD_INDEX: WorldIndex = {
  score: 54.2,
  scoreDelta: -2.1,
  label: "Moderate Uncertainty",
  date: "2026-04-16",
  categories: [
    { category: "geopolitics", score: 41.8, scoreDelta: -3.2, marketCount: 24, sources: ["Polymarket", "Metaculus"] },
    { category: "economics",   score: 58.4, scoreDelta:  1.1, marketCount: 31, sources: ["Polymarket", "Kalshi"]    },
    { category: "politics",    score: 62.1, scoreDelta:  0.8, marketCount: 18, sources: ["Metaculus", "PredictIt"] },
    { category: "technology",  score: 71.3, scoreDelta:  2.4, marketCount: 12, sources: ["Metaculus"]               },
    { category: "climate",     score: 48.9, scoreDelta: -1.5, marketCount: 9,  sources: ["Polymarket"]              },
    { category: "crypto",      score: 44.2, scoreDelta: -4.8, marketCount: 22, sources: ["Polymarket", "Augur"]     },
    { category: "sports",      score: 79.1, scoreDelta:  0.3, marketCount: 15, sources: ["PredictIt"]               },
  ],
};

const MOCK_HISTORY: HistoryPoint[] = [
  { date: "2026-03-16", score: 61.2, label: "Stable",   delta: null },
  { date: "2026-03-17", score: 59.8, label: "Moderate", delta: -1.4 },
  { date: "2026-03-18", score: 58.1, label: "Moderate", delta: -1.7 },
  { date: "2026-03-19", score: 60.4, label: "Stable",   delta:  2.3 },
  { date: "2026-03-20", score: 62.7, label: "Stable",   delta:  2.3 },
  { date: "2026-03-21", score: 63.5, label: "Stable",   delta:  0.8 },
  { date: "2026-03-22", score: 61.9, label: "Stable",   delta: -1.6 },
  { date: "2026-03-23", score: 59.2, label: "Moderate", delta: -2.7 },
  { date: "2026-03-24", score: 55.8, label: "Moderate", delta: -3.4 },
  { date: "2026-03-25", score: 53.1, label: "Moderate", delta: -2.7 },
  { date: "2026-03-26", score: 51.4, label: "Moderate", delta: -1.7 },
  { date: "2026-03-27", score: 49.8, label: "Moderate", delta: -1.6 },
  { date: "2026-03-28", score: 48.2, label: "Moderate", delta: -1.6 },
  { date: "2026-03-29", score: 46.5, label: "Moderate", delta: -1.7 },
  { date: "2026-03-30", score: 44.1, label: "Moderate", delta: -2.4 },
  { date: "2026-03-31", score: 42.8, label: "Moderate", delta: -1.3 },
  { date: "2026-04-01", score: 41.2, label: "Stressed", delta: -1.6 },
  { date: "2026-04-02", score: 39.7, label: "Stressed", delta: -1.5 },
  { date: "2026-04-03", score: 38.4, label: "Stressed", delta: -1.3 },
  { date: "2026-04-04", score: 40.1, label: "Stressed", delta:  1.7 },
  { date: "2026-04-05", score: 43.8, label: "Moderate", delta:  3.7 },
  { date: "2026-04-06", score: 47.2, label: "Moderate", delta:  3.4 },
  { date: "2026-04-07", score: 49.5, label: "Moderate", delta:  2.3 },
  { date: "2026-04-08", score: 51.8, label: "Moderate", delta:  2.3 },
  { date: "2026-04-09", score: 53.4, label: "Moderate", delta:  1.6 },
  { date: "2026-04-10", score: 55.1, label: "Moderate", delta:  1.7 },
  { date: "2026-04-11", score: 56.3, label: "Moderate", delta:  1.2 },
  { date: "2026-04-12", score: 55.8, label: "Moderate", delta: -0.5 },
  { date: "2026-04-13", score: 54.9, label: "Moderate", delta: -0.9 },
  { date: "2026-04-14", score: 54.2, label: "Moderate", delta: -0.7 },
];

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function PWI() {
  const [apiData, apiHistory] = await Promise.all([fetchWorldIndex(), fetchHistory()]);
  const worldData = apiData ?? MOCK_WORLD_INDEX;
  const history   = apiHistory.length > 0 ? apiHistory : MOCK_HISTORY;
  return <PWITerminal worldData={worldData} history={history} />;
}
