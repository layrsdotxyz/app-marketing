import type { Metadata } from "next";
import LandingPageV2 from "@/components/LandingPageV2";

export const metadata: Metadata = {
  title: "Predifi - Next-Gen Decentralized Prediction Markets",
  description:
    "Trade on institutional-grade prediction markets with deep liquidity, unified API access, and cross-venue arbitrage. Built for champions.",
  alternates: {
    canonical: "https://predifi.com",
  },
  openGraph: {
    title: "Predifi - Next-Gen Decentralized Prediction Markets",
    description: "Trade on institutional-grade prediction markets with deep liquidity, unified API access, and cross-venue arbitrage. Built for champions.",
    url: "https://predifi.com",
    images: ["/og-image.png"],
  },
  twitter: {
    title: "Predifi - Next-Gen Decentralized Prediction Markets",
    description: "Trade on institutional-grade prediction markets with deep liquidity, unified API access, and cross-venue arbitrage.",
  },
};

export default function Home() {
  return <LandingPageV2 />;
}
