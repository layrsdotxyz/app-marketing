import type { Metadata } from "next";
import { Inter } from "next/font/google";
import WaitlistPage from "@/components/WaitlistPage";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: "Join the Waitlist",
  description:
    "Get early access to Predifi — the prediction market aggregator. Join our waitlist today.",
  alternates: {
    canonical: "https://predifi.com/waitlist",
  },
  openGraph: {
    title: "Join the Predifi Waitlist — Early Access",
    description: "Get early access to Predifi — the prediction market aggregator. Secure your spot before launch.",
    url: "https://predifi.com/waitlist",
  },
  twitter: {
    card: "summary_large_image",
    title: "Join the Predifi Waitlist — Early Access",
    description: "Secure your spot before launch. Predifi is the next-gen prediction market aggregator.",
  },
};

export default function Waitlist() {
  return (
    <div className={`${inter.variable} ${inter.className}`}>
      <WaitlistPage />
    </div>
  );
}
