/**
 * Unified Brand Configuration
 * Centralizes all logo paths, colors, and brand assets.
 */

export const brand = {
  name: "Predifi",
  tagline: "Next-Gen Decentralized Prediction Markets",
  description:
    "Trade on institutional-grade prediction markets with deep liquidity, unified API access, and cross-venue arbitrage. Built for champions.",

  urls: {
    website: "https://predifi.com",
    app: "https://app.predifi.com",
    docs: "https://docs.predifi.com",
    twitter: "https://x.com/predifi_com",
    discord: "https://discord.gg/predifi",
    telegram: "https://t.me/predifi",
  },

  // Public paths — assets live in /public/assets/
  logo: {
    dark: "/assets/predifi-logo-dark.png",
    light: "/assets/predifi-logo-light.png",
  },

  icon: {
    dark: "/assets/logo-icon-dark.png",
    light: "/assets/logo-icon-light.png",
  },

  publicPaths: {
    favicon: "/favicon.png",
    ogImage: "/og-image.png",
    manifest: "/manifest.json",
  },

  colors: {
    success: "hsl(142, 71%, 45%)",
    destructive: "hsl(0, 84%, 60%)",
    warning: "hsl(45, 93%, 47%)",
  },

  seo: {
    defaultTitle: "Predifi - Next-Gen Decentralized Prediction Markets",
    defaultDescription:
      "Trade on institutional-grade prediction markets with deep liquidity, unified API access, and cross-venue arbitrage. Built for champions.",
    defaultImage: "/og-image.png",
    twitterHandle: "@predifi_com",
  },
} as const;

// Helper function to get theme-aware logo public path
export function getThemedLogo(
  theme: string | undefined,
  resolvedTheme?: string
) {
  const effectiveTheme =
    theme === "system" ? resolvedTheme || "light" : theme || "light";
  return effectiveTheme === "dark" ? brand.logo.dark : brand.logo.light;
}
