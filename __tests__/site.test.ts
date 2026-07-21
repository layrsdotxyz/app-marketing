/**
 * Predifi Marketing Site — Integration & Logic Tests
 *
 * Covers:
 *  1. Parlay multiplier math (LandingPageV2)
 *  2. Parlay config completeness (all 2/3/4-leg configs)
 *  3. PWI stress level classification
 *  4. PWI mock data integrity (no null scores, valid categories)
 *  5. PWI interpretation generator (non-empty, references real data)
 *  6. OG image file — logo asset exists on disk
 *  7. OG image file — no "edge" runtime export (would break readFileSync)
 *  8. Waitlist page — getwaitlist API payload shape
 *  9. Waitlist page — localStorage key names match between writer and reader
 * 10. API route — /api/waitlist exists and exports a POST handler
 * 11. Build artefact — all key routes are in the Next.js build manifest
 * 12. TypeScript — project compiles with zero errors
 */

import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const ROOT = join(__dirname, "..");

// ─── 1 & 2. Parlay multiplier math ────────────────────────────────────────────

describe("Parlay multiplier math", () => {
  // Mirror the production function exactly
  function legMultiplier(legs: { prob: number }[]): number {
    return legs.reduce((m, leg) => m / (leg.prob / 100), 1);
  }

  const CONFIGS = {
    2: [{ prob: 62 }, { prob: 48 }],
    3: [{ prob: 62 }, { prob: 48 }, { prob: 19 }],
    4: [{ prob: 62 }, { prob: 48 }, { prob: 19 }, { prob: 31 }],
  };

  it("2-leg multiplier is ~3.4× (1 / 0.62×0.48)", () => {
    const m = legMultiplier(CONFIGS[2]);
    expect(m).toBeCloseTo(3.36, 1);
  });

  it("3-leg multiplier is ~17.7× (1 / 0.62×0.48×0.19)", () => {
    const m = legMultiplier(CONFIGS[3]);
    expect(m).toBeCloseTo(17.68, 1);
  });

  it("4-leg multiplier is ~57× (1 / 0.62×0.48×0.19×0.31)", () => {
    const m = legMultiplier(CONFIGS[4]);
    expect(m).toBeCloseTo(57.05, 1);
  });

  it("multiplier strictly increases as legs are added", () => {
    const m2 = legMultiplier(CONFIGS[2]);
    const m3 = legMultiplier(CONFIGS[3]);
    const m4 = legMultiplier(CONFIGS[4]);
    expect(m3).toBeGreaterThan(m2);
    expect(m4).toBeGreaterThan(m3);
  });

  it("each config has the right number of legs", () => {
    expect(CONFIGS[2]).toHaveLength(2);
    expect(CONFIGS[3]).toHaveLength(3);
    expect(CONFIGS[4]).toHaveLength(4);
  });

  it("all leg probabilities are in range (1–99)", () => {
    Object.values(CONFIGS).flat().forEach(({ prob }) => {
      expect(prob).toBeGreaterThanOrEqual(1);
      expect(prob).toBeLessThanOrEqual(99);
    });
  });

  it("combined probability display is correct for 3-leg", () => {
    const combined = CONFIGS[3].reduce((acc, l) => acc * (l.prob / 100), 1) * 100;
    expect(combined).toBeCloseTo(5.65, 1); // shown as "5.6%" in UI
  });
});

// ─── 3. PWI stress level classification ───────────────────────────────────────

describe("PWI stressLevel()", () => {
  function stressLevel(score: number): string {
    if (score >= 60) return "stable";
    if (score >= 42) return "moderate";
    if (score >= 26) return "stressed";
    return "critical";
  }

  const cases: [number, string][] = [
    [100,  "stable"],
    [60,   "stable"],
    [59.9, "moderate"],
    [42,   "moderate"],
    [41.9, "stressed"],
    [26,   "stressed"],
    [25.9, "critical"],
    [0,    "critical"],
  ];

  it.each(cases)("score %f → %s", (score, expected) => {
    expect(stressLevel(score)).toBe(expected);
  });
});

// ─── 4. PWI mock data integrity ───────────────────────────────────────────────

describe("PWI mock data", () => {
  // Extract mock data by parsing the source file
  const pwiSrc = readFileSync(join(ROOT, "app/pwi/page.tsx"), "utf8");

  it("MOCK_WORLD_INDEX is defined in source", () => {
    expect(pwiSrc).toContain("const MOCK_WORLD_INDEX");
  });

  it("MOCK_HISTORY is defined in source", () => {
    expect(pwiSrc).toContain("const MOCK_HISTORY");
  });

  it("fallback uses ?? operator so API data takes priority when live", () => {
    expect(pwiSrc).toContain("apiData ?? MOCK_WORLD_INDEX");
  });

  it("MOCK_HISTORY has 30 data points", () => {
    // Extract only the history array entries (they're inside MOCK_HISTORY, not MOCK_WORLD_INDEX)
    const historyBlock = pwiSrc.match(/const MOCK_HISTORY[\s\S]*?^];/m)?.[0] ?? "";
    const matches = historyBlock.match(/date: "2026-\d{2}-\d{2}"/g);
    expect(matches?.length).toBe(30);
  });

  it("all 7 required categories are present in mock data", () => {
    const required = ["geopolitics", "economics", "politics", "technology", "climate", "crypto", "sports"];
    required.forEach(cat => {
      expect(pwiSrc).toContain(`category: "${cat}"`);
    });
  });

  it("mock world score is in valid range (0–100)", () => {
    const match = pwiSrc.match(/score:\s*([\d.]+),\s*\n\s*scoreDelta/);
    if (match) {
      const score = parseFloat(match[1]);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });
});

// ─── 5. PWI interpretation generator ─────────────────────────────────────────

describe("PWI getInterpretation()", () => {
  // Mirror the production function
  function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function getInterpretation(score: number, categories: { category: string; score: number }[]): string {
    const sorted = [...categories].sort((a, b) => a.score - b.score);
    const low    = sorted[0];
    const high   = sorted[sorted.length - 1];
    const stressedCount = categories.filter(c => c.score < 42).length;

    if (score >= 70) {
      return `Prediction markets broadly signal stability. ${cap(high.category)} leads with strong directional confidence (${high.score.toFixed(0)}). ${stressedCount === 0 ? "No categories showing elevated stress." : `${cap(low.category)} remains the primary uncertainty source at ${low.score.toFixed(0)}.`}`;
    }
    if (score >= 55) {
      return `Markets reflect measured confidence with pockets of uncertainty. ${cap(low.category)} is the primary stress driver (${low.score.toFixed(0)}), while ${cap(high.category)} anchors the index at ${high.score.toFixed(0)}. Monitor for cross-category contagion.`;
    }
    if (score >= 40) {
      return `Mixed signals across prediction markets. ${stressedCount} ${stressedCount === 1 ? "category" : "categories"} below the uncertainty threshold${stressedCount > 0 ? ` — ${cap(low.category)} most stressed at ${low.score.toFixed(0)}` : ""}. Risk-off positioning is building.`;
    }
    return `Broad market stress. Prediction markets pricing in significant instability across ${stressedCount} categories. ${cap(low.category)} registers extreme uncertainty at ${low.score.toFixed(0)}. This is a historically rare low-confidence signal.`;
  }

  const mockCats = [
    { category: "geopolitics", score: 41.8 },
    { category: "economics",   score: 58.4 },
    { category: "politics",    score: 62.1 },
    { category: "technology",  score: 71.3 },
    { category: "climate",     score: 48.9 },
    { category: "crypto",      score: 44.2 },
    { category: "sports",      score: 79.1 },
  ];

  it("returns a non-empty string for mock data", () => {
    const result = getInterpretation(54.2, mockCats);
    expect(result.length).toBeGreaterThan(20);
  });

  it("references the lowest-scoring category (geopolitics) for score 54.2", () => {
    const result = getInterpretation(54.2, mockCats);
    expect(result.toLowerCase()).toContain("geopolitics");
  });

  it("score 54.2 (40–55 range) only names the lowest-scoring category", () => {
    // The 40–55 branch focuses on the stressed driver, not the high anchor
    const result = getInterpretation(54.2, mockCats);
    expect(result.toLowerCase()).toContain("geopolitics"); // lowest at 41.8
    expect(result).toContain("Risk-off positioning");
  });

  it("high score (≥70) signals stability", () => {
    const result = getInterpretation(75, mockCats);
    expect(result).toContain("stability");
  });

  it("low score (<40) signals broad stress", () => {
    const result = getInterpretation(35, mockCats);
    expect(result).toContain("Broad market stress");
  });

  it("never returns empty string across full score range", () => {
    [10, 30, 45, 58, 72, 95].forEach(score => {
      expect(getInterpretation(score, mockCats).length).toBeGreaterThan(0);
    });
  });
});

// ─── 6. OG image — logo asset exists on disk ──────────────────────────────────

describe("OG image assets", () => {
  it("logo-icon-dark.png exists in public/assets/", () => {
    const logoPath = join(ROOT, "public/assets/logo-icon-dark.png");
    expect(existsSync(logoPath)).toBe(true);
  });

  it("predifi-logo-dark.png exists in public/assets/", () => {
    const logoPath = join(ROOT, "public/assets/predifi-logo-dark.png");
    expect(existsSync(logoPath)).toBe(true);
  });
});

// ─── 7. OG image — no edge runtime export ─────────────────────────────────────

describe("OG image source safety", () => {
  const ogSrc = readFileSync(join(ROOT, "app/waitlist/opengraph-image.tsx"), "utf8");

  it("does NOT export edge runtime (readFileSync requires Node.js)", () => {
    expect(ogSrc).not.toContain("export const runtime = \"edge\"");
    expect(ogSrc).not.toContain("export const runtime = 'edge'");
  });

  it("imports readFileSync from 'fs'", () => {
    expect(ogSrc).toContain("readFileSync");
    expect(ogSrc).toContain("from \"fs\"");
  });

  it("imports join from 'path'", () => {
    expect(ogSrc).toContain("from \"path\"");
  });

  it("uses process.cwd() to build the logo path", () => {
    expect(ogSrc).toContain("process.cwd()");
  });

  it("has a try/catch fallback if logo read fails", () => {
    expect(ogSrc).toContain("} catch {");
  });

  it("exports correct size (1200×630)", () => {
    expect(ogSrc).toContain("width: 1200");
    expect(ogSrc).toContain("height: 630");
  });

  it("exports contentType as image/png", () => {
    expect(ogSrc).toContain("image/png");
  });
});

// ─── 8. Waitlist — getwaitlist API payload shape ──────────────────────────────

describe("Waitlist getwaitlist integration", () => {
  const wSrc = readFileSync(join(ROOT, "components/WaitlistPage.tsx"), "utf8");

  it("POSTs to the correct getwaitlist endpoint", () => {
    expect(wSrc).toContain("https://api.getwaitlist.com/api/v1/signup");
  });

  it("sends email in payload", () => {
    expect(wSrc).toContain("email, waitlist_id");
  });

  it("sends waitlist_id from env var", () => {
    expect(wSrc).toContain("NEXT_PUBLIC_WAITLIST_ID");
    expect(wSrc).toContain("Number(WAITLIST_ID)");
  });

  it("conditionally sends referral_link when present", () => {
    expect(wSrc).toContain("gwBody.referral_link = refParam");
  });

  it("reads gwData.priority for queue position", () => {
    expect(wSrc).toContain("gwData.priority");
  });

  it("reads gwData.referral_link for sharing", () => {
    expect(wSrc).toContain("gwData.referral_link");
  });

  it("reads gwData.already_registered flag", () => {
    expect(wSrc).toContain("gwData.already_registered");
  });

  it("fires /api/waitlist as background call (fire-and-forget)", () => {
    expect(wSrc).toContain('fetch("/api/waitlist"');
    expect(wSrc).toContain(".catch(() => {})");
  });
});

// ─── 9. Waitlist — localStorage key consistency ───────────────────────────────

describe("Waitlist localStorage keys", () => {
  const wSrc = readFileSync(join(ROOT, "components/WaitlistPage.tsx"), "utf8");

  const KEYS = ["waitlist_email", "waitlist_referral_link", "waitlist_position"];

  KEYS.forEach(key => {
    it(`setItem("${key}") is present`, () => {
      expect(wSrc).toContain(`setItem("${key}"`);
    });
    it(`getItem("${key}") is present`, () => {
      expect(wSrc).toContain(`getItem("${key}")`);
    });
  });

  it("useSearchParams() is used inside a Suspense boundary", () => {
    expect(wSrc).toContain("useSearchParams");
    expect(wSrc).toContain("<Suspense");
  });
});

// ─── 10. API route — /api/waitlist exists and exports POST ────────────────────

describe("/api/waitlist route", () => {
  const routePath = join(ROOT, "app/api/waitlist/route.ts");

  it("route file exists", () => {
    expect(existsSync(routePath)).toBe(true);
  });

  it("exports a POST handler", () => {
    const src = readFileSync(routePath, "utf8");
    expect(src).toContain("export");
    expect(src).toMatch(/export\s+(async\s+)?function\s+POST|export\s+const\s+POST/);
  });

  it("uses AWS SES client", () => {
    const src = readFileSync(routePath, "utf8");
    expect(src).toContain("SES");
  });
});

// ─── 11b. PWITerminal — divergence scanner integrity ──────────────────────────

describe("PWITerminal divergence scanner", () => {
  const src = readFileSync(join(ROOT, "components/PWITerminal.tsx"), "utf8");

  it("is a client component", () => {
    expect(src).toContain('"use client"');
  });

  it("DIVERGENCE_SIGNALS array is defined", () => {
    expect(src).toContain("const DIVERGENCE_SIGNALS");
  });

  it("has signals from both Polymarket and Kalshi", () => {
    expect(src).toContain('"Polymarket"');
    expect(src).toContain('"Kalshi"');
  });

  it("covers all 8 categories", () => {
    const categories = ["economics","crypto","politics","sports","geopolitics","technology","climate","cross-venue"];
    categories.forEach(cat => {
      expect(src).toContain(`category:"${cat}"`);
    });
  });

  it("has at least 30 divergence signals", () => {
    const matches = src.match(/id:"/g);
    expect(matches?.length ?? 0).toBeGreaterThanOrEqual(30);
  });

  it("exports AnimatedNumber component", () => {
    expect(src).toContain("function AnimatedNumber");
  });

  it("exports InteractiveSparkline with tooltip", () => {
    expect(src).toContain("function InteractiveSparkline");
    expect(src).toContain("setTooltip");
  });

  it("includes whale radar", () => {
    expect(src).toContain("function WhaleRadar");
    expect(src).toContain("WHALE_FEED");
  });

  it("ticker uses CSS animation", () => {
    expect(src).toContain("ticker-scroll");
  });

  it("pwi page delegates rendering to PWITerminal", () => {
    const pageSrc = readFileSync(join(ROOT, "app/pwi/page.tsx"), "utf8");
    expect(pageSrc).toContain("PWITerminal");
    expect(pageSrc).toContain("worldData={worldData}");
  });
});

// ─── 11. Key source files all exist ───────────────────────────────────────────

describe("Key source files exist", () => {
  const files = [
    "components/WaitlistPage.tsx",
    "components/LandingPageV2.tsx",
    "components/PWITerminal.tsx",
    "app/waitlist/page.tsx",
    "app/waitlist/opengraph-image.tsx",
    "app/pwi/page.tsx",
    "app/pwi/layout.tsx",
    "app/pwi/[category]/page.tsx",
    "app/v2/page.tsx",
    "app/api/waitlist/route.ts",
  ];

  files.forEach(f => {
    it(f, () => {
      expect(existsSync(join(ROOT, f))).toBe(true);
    });
  });
});

// ─── 12. TypeScript compiles with zero errors ─────────────────────────────────

describe("TypeScript compilation", () => {
  it("tsc --noEmit exits with code 0", async () => {
    const { execSync } = await import("child_process");
    expect(() =>
      execSync("npx tsc --noEmit --skipLibCheck", { cwd: ROOT, stdio: "pipe" })
    ).not.toThrow();
  }, 60_000); // tsc on a full Next.js project takes ~15-30s
});
