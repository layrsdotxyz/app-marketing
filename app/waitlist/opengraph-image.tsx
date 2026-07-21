import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

export const alt = "Join the Predifi Waitlist — Early Access";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// ─── Colour tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:      "#050505",
  amber:   "#FBBF24",
  amber20: "rgba(251,191,36,0.20)",
  amber12: "rgba(251,191,36,0.12)",
  amber06: "rgba(251,191,36,0.06)",
  amberT:  "rgba(251,191,36,0.70)",
  white88: "rgba(255,255,255,0.88)",
  white55: "rgba(255,255,255,0.55)",
  white28: "rgba(255,255,255,0.28)",
  white14: "rgba(255,255,255,0.14)",
  white06: "rgba(255,255,255,0.06)",
  white03: "rgba(255,255,255,0.03)",
  green:   "rgba(34,197,94,0.80)",
  green08: "rgba(16,185,129,0.08)",
};

// ─── Stat card ─────────────────────────────────────────────────────────────────
function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        border: `1px solid ${C.white06}`,
        background: C.white03,
        padding: "20px 24px",
      }}
    >
      <span
        style={{
          color: C.white88,
          fontSize: 32,
          fontWeight: 900,
          letterSpacing: "-0.01em",
          lineHeight: 1,
        }}
      >
        {value}
      </span>
      <span
        style={{
          color: C.white28,
          fontSize: 10,
          fontWeight: 500,
          textTransform: "uppercase" as const,
          letterSpacing: "0.14em",
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── Market row preview ────────────────────────────────────────────────────────
function MarketRow({
  q, prob, accent, highlight,
}: {
  q: string; prob: number; accent: string; highlight?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 16px",
        background: highlight ? "rgba(251,191,36,0.04)" : "transparent",
        borderBottom: `1px solid ${C.white06}`,
        gap: 12,
      }}
    >
      <span style={{ color: C.white55, fontSize: 12, flex: 1 }}>{q}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* mini bar */}
        <div style={{ display: "flex", width: 60, height: 3, background: C.white06 }}>
          <div style={{ width: `${prob}%`, height: "100%", background: accent }} />
        </div>
        <span style={{ color: accent, fontSize: 12, fontWeight: 700, width: 36, textAlign: "right" as const }}>
          {prob}%
        </span>
      </div>
    </div>
  );
}

// ─── Main image ─────────────────────────────────────────────────────────────────
export default async function OgImage() {
  // Load logo icon from disk → base64 data URL (works in Node.js runtime)
  const logoSrc = (() => {
    try {
      const buf = readFileSync(join(process.cwd(), "public/assets/logo-icon-dark.png"));
      return `data:image/png;base64,${buf.toString("base64")}`;
    } catch { return null; }
  })();

  // Load Inter for crisp text. Falls back gracefully if CDN is unreachable.
  type FontEntry = { name: string; data: ArrayBuffer; weight: 400 | 700 | 900 };
  let fontOpts: FontEntry[] | undefined;
  try {
    const [black, bold, regular] = await Promise.all([
      fetch("https://fonts.bunny.net/inter/files/inter-latin-900-normal.woff").then(r => r.arrayBuffer()),
      fetch("https://fonts.bunny.net/inter/files/inter-latin-700-normal.woff").then(r => r.arrayBuffer()),
      fetch("https://fonts.bunny.net/inter/files/inter-latin-400-normal.woff").then(r => r.arrayBuffer()),
    ]);
    fontOpts = [
      { name: "Inter", data: black,   weight: 900 },
      { name: "Inter", data: bold,    weight: 700 },
      { name: "Inter", data: regular, weight: 400 },
    ];
  } catch { /* render with default font */ }

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          backgroundColor: C.bg,
          padding: "56px 64px 48px",
          position: "relative",
          overflow: "hidden",
          fontFamily: fontOpts ? "Inter" : "'Helvetica Neue', Arial, sans-serif",
        }}
      >
        {/* ── Amber glow top-right ── */}
        <div
          style={{
            position: "absolute",
            top: -180,
            right: -120,
            width: 760,
            height: 760,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(251,191,36,0.18) 0%, rgba(251,191,36,0.06) 40%, transparent 70%)",
          }}
        />
        {/* ── Green glow bottom-left ── */}
        <div
          style={{
            position: "absolute",
            bottom: -140,
            left: -80,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(16,185,129,0.09) 0%, transparent 65%)",
          }}
        />
        {/* ── Purple accent mid-left ── */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: -60,
            width: 320,
            height: 320,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)",
          }}
        />

        {/* ══ TOP ROW: logo + badge ══════════════════════════════════════════ */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 40,
          }}
        >
          {/* Wordmark */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {logoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoSrc}
                width={36}
                height={36}
                alt="Predifi"
                style={{ objectFit: "contain" }}
              />
            ) : (
              /* Fallback diamond if logo can't be read */
              <div
                style={{
                  width: 36, height: 36,
                  border: `1px solid rgba(251,191,36,0.45)`,
                  background: C.amber12,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <div style={{ width: 14, height: 14, background: C.amber, transform: "rotate(45deg)" }} />
              </div>
            )}
            <span
              style={{
                color: "rgba(255,255,255,0.88)",
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: "0.24em",
                textTransform: "uppercase" as const,
              }}
            >
              PREDIFI
            </span>
          </div>

          {/* Live badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              border: `1px solid rgba(251,191,36,0.28)`,
              background: C.amber06,
              padding: "9px 18px",
            }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: C.amber,
              }}
            />
            <span
              style={{
                color: "rgba(251,191,36,0.75)",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.22em",
                textTransform: "uppercase" as const,
              }}
            >
              EARLY ACCESS OPEN · Q2 2026
            </span>
          </div>
        </div>

        {/* ══ MAIN CONTENT: two-column ══════════════════════════════════════ */}
        <div style={{ display: "flex", gap: 56, flex: 1 }}>

          {/* ── Left: headline + stats ── */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            {/* Headline */}
            <div style={{ display: "flex", flexDirection: "column", marginBottom: 20 }}>
              <span
                style={{
                  color: C.white88,
                  fontSize: 62,
                  fontWeight: 900,
                  lineHeight: 1.0,
                  letterSpacing: "-0.025em",
                  textTransform: "uppercase" as const,
                }}
              >
                CLAIM YOUR
              </span>
              <span
                style={{
                  color: C.amber,
                  fontSize: 62,
                  fontWeight: 900,
                  lineHeight: 1.0,
                  letterSpacing: "-0.025em",
                  textTransform: "uppercase" as const,
                }}
              >
                SPOT BEFORE
              </span>
              <span
                style={{
                  color: C.white88,
                  fontSize: 62,
                  fontWeight: 900,
                  lineHeight: 1.0,
                  letterSpacing: "-0.025em",
                  textTransform: "uppercase" as const,
                }}
              >
                LAUNCH.
              </span>
            </div>

            {/* Subtext */}
            <span
              style={{
                color: C.white28,
                fontSize: 15,
                lineHeight: 1.65,
                letterSpacing: "0.02em",
                marginBottom: 28,
              }}
            >
              One account. Best price. Every outcome, on any chain.
            </span>

            {/* Stats 2×2 */}
            <div style={{ display: "flex", gap: 10 }}>
              <Stat value="16"    label="Chains at launch"   />
              <Stat value="100+"  label="Markets at genesis" />
              <Stat value="17.7×" label="Max parlay payout"  />
              <Stat value="0%"    label="House edge. Ever."  />
            </div>
          </div>

          {/* ── Right: product preview card ── */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: 340,
              border: `1px solid ${C.white14}`,
              background: "rgba(8,6,4,0.95)",
              overflow: "hidden",
              boxShadow: "0 0 60px rgba(251,191,36,0.08), 0 32px 80px rgba(0,0,0,0.7)",
            }}
          >
            {/* Browser chrome */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 14px",
                borderBottom: `1px solid ${C.white06}`,
                background: "rgba(255,255,255,0.015)",
              }}
            >
              <div style={{ display: "flex", gap: 5 }}>
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: "rgba(255,80,80,0.45)" }} />
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: "rgba(255,180,50,0.35)" }} />
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: "rgba(50,205,50,0.30)" }} />
              </div>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px",
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${C.white06}`,
                  marginLeft: 8,
                }}
              >
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.green }} />
                <span style={{ color: C.white28, fontSize: 9, letterSpacing: "0.04em" }}>app.predifi.com</span>
              </div>
            </div>

            {/* App nav */}
            <div
              style={{
                display: "flex",
                gap: 0,
                padding: "0 14px",
                borderBottom: `1px solid ${C.white06}`,
                background: "rgba(0,0,0,0.18)",
              }}
            >
              {["Markets", "Parlay", "Portfolio"].map((t, i) => (
                <div
                  key={t}
                  style={{
                    padding: "9px 12px",
                    fontSize: 9,
                    fontWeight: i === 1 ? 700 : 400,
                    color: i === 1 ? "rgba(251,191,36,0.75)" : C.white28,
                    borderBottom: i === 1 ? `2px solid rgba(251,191,36,0.6)` : "2px solid transparent",
                    textTransform: "uppercase" as const,
                    letterSpacing: "0.12em",
                  }}
                >
                  {t}
                </div>
              ))}
            </div>

            {/* Markets */}
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <MarketRow q="Fed rate cut before Q3?" prob={62} accent="rgba(139,92,246,0.8)" />
              <MarketRow q="BTC > $120k by Dec 2026?" prob={48} accent="rgba(251,191,36,0.8)" highlight />
              <MarketRow q="ETH flips BTC market cap?" prob={19} accent="rgba(99,179,237,0.8)" />
              <MarketRow q="US midterm turnout > 55%?" prob={71} accent="rgba(74,222,128,0.8)" />
            </div>

            {/* Parlay payout strip */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                borderTop: `1px solid rgba(251,191,36,0.15)`,
                background: "rgba(251,191,36,0.04)",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ color: C.white28, fontSize: 8, textTransform: "uppercase" as const, letterSpacing: "0.16em" }}>3-leg parlay</span>
                <span style={{ color: C.white55, fontSize: 10, fontWeight: 600 }}>$100 → $1,770</span>
              </div>
              <span
                style={{
                  color: C.amber,
                  fontSize: 28,
                  fontWeight: 900,
                  letterSpacing: "-0.01em",
                }}
              >
                17.7×
              </span>
            </div>
          </div>

        </div>

        {/* ══ BOTTOM ROW ═══════════════════════════════════════════════════ */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 24,
            paddingTop: 18,
            borderTop: `1px solid ${C.white06}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.green }} />
              <span style={{ color: C.white28, fontSize: 12, letterSpacing: "0.06em" }}>Settled on-chain</span>
            </div>
            <span style={{ color: C.white14, fontSize: 12 }}>·</span>
            <span style={{ color: C.white28, fontSize: 12, letterSpacing: "0.06em" }}>No intermediary</span>
            <span style={{ color: C.white14, fontSize: 12 }}>·</span>
            <span style={{ color: C.white28, fontSize: 12, letterSpacing: "0.06em" }}>No house edge</span>
          </div>
          <span style={{ color: C.white14, fontSize: 12, letterSpacing: "0.1em" }}>predifi.com/waitlist</span>
        </div>

      </div>
    ),
    {
      width: size.width,
      height: size.height,
      fonts: fontOpts,
    },
  );
}
