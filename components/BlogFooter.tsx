import Link from "next/link";
import Image from "next/image";

const CATEGORIES = [
  { label: "Geopolitics", value: "geopolitics" },
  { label: "Economics", value: "economics" },
  { label: "Politics", value: "politics" },
  { label: "Technology", value: "technology" },
  { label: "Crypto", value: "crypto" },
  { label: "Climate", value: "climate" },
  { label: "Sports", value: "sports" },
];

export default function BlogFooter() {
  return (
    <footer className="border-t border-white/10 bg-black/60">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4 opacity-80 hover:opacity-100 transition-opacity">
              <Image
                src="/assets/logo-icon-dark.png"
                alt="Predifi"
                width={24}
                height={24}
                className="h-6 w-auto"
              />
              <span className="text-sm font-medium uppercase tracking-[0.22em] text-white">Predifi</span>
            </Link>
            <p className="text-xs text-white/40 leading-6 max-w-xs">
              Real-money prediction markets with deep liquidity. Trade on politics, economics, technology, and more.
            </p>
          </div>

          {/* Topics */}
          <div>
            <p className="mb-4 text-[11px] uppercase tracking-[0.18em] text-white/30 font-medium">Topics</p>
            <ul className="space-y-2">
              {CATEGORIES.map((cat) => (
                <li key={cat.value}>
                  <Link
                    href={`https://blog.predifi.com?category=${cat.value}`}
                    className="text-sm text-white/50 hover:text-white transition-colors"
                  >
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Platform */}
          <div>
            <p className="mb-4 text-[11px] uppercase tracking-[0.18em] text-white/30 font-medium">Platform</p>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-white/50 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <a href="https://blog.predifi.com" className="text-sm text-white/50 hover:text-white transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <Link href="/waitlist" className="text-sm text-white/50 hover:text-white transition-colors">
                  Join Waitlist
                </Link>
              </li>
              <li>
                <a
                  href="https://x.com/predifi_com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-white/50 hover:text-white transition-colors"
                >
                  Twitter / X
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/25">
            © {new Date().getFullYear()} Predifi. All rights reserved.
          </p>
          <p className="text-xs text-white/25">
            Prediction markets involve real financial risk. Trade responsibly.
          </p>
        </div>
      </div>
    </footer>
  );
}
