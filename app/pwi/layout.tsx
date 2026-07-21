import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
  adjustFontFallback: true,
});

export default function PWILayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${inter.variable} ${inter.className}`}>
      {children}
    </div>
  );
}
