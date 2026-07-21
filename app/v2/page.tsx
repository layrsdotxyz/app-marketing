import type { Metadata } from "next";
import { Inter } from "next/font/google";
import LandingPageV2 from "@/components/LandingPageV2";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: "Predifi V2 Preview — Next-Gen Decentralized Prediction Markets",
  description: "Preview of the redesigned Predifi landing page.",
  robots: { index: false, follow: false },
};

export default function V2Preview() {
  return (
    <div className={`${inter.variable} ${inter.className}`}>
      <LandingPageV2 />
    </div>
  );
}
