import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { Toaster } from "sonner";
import "./globals.css";

const GA_MEASUREMENT_ID = "G-00WXTWPTZZ";

export const metadata: Metadata = {
  title: {
    default: "Predifi - Next-Gen Decentralized Prediction Markets",
    template: "%s | Predifi",
  },
  description:
    "Trade on institutional-grade prediction markets with deep liquidity, unified API access, and cross-venue arbitrage.",
  metadataBase: new URL("https://predifi.com"),
  openGraph: {
    type: "website",
    siteName: "Predifi",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    site: "@predifi_com",
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-512x512.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    shortcut: "/favicon-32x32.png",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://predifi.com/#organization",
      "name": "Predifi",
      "url": "https://predifi.com",
      "logo": "https://predifi.com/assets/logo-icon-dark.png",
      "sameAs": [
        "https://x.com/predifi_com"
      ]
    },
    {
      "@type": "WebSite",
      "@id": "https://predifi.com/#website",
      "url": "https://predifi.com",
      "name": "Predifi",
      "publisher": { "@id": "https://predifi.com/#organization" },
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://blog.predifi.com?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    }
  ]
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link rel="preconnect" href="https://fonts.cdnfonts.com" />
        <link
          rel="stylesheet"
          href="https://fonts.cdnfonts.com/css/jetbrains-mono"
        />
      </head>
      <body>
        <ThemeProvider>
          {children}
          <Toaster position="top-center" theme="dark" />
        </ThemeProvider>
      </body>
      <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />
    </html>
  );
}
