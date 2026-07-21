import Link from "next/link";
import Image from "next/image";

export default function BlogHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5 opacity-90 hover:opacity-100 transition-opacity">
          <Image
            src="/assets/logo-icon-dark.png"
            alt="Predifi"
            width={28}
            height={28}
            className="h-7 w-auto"
          />
          <span className="text-sm font-medium uppercase tracking-[0.22em] text-white">Predifi</span>
        </Link>

        <nav className="hidden items-center gap-7 sm:flex">
          <Link
            href="https://blog.predifi.com"
            className="text-xs uppercase tracking-[0.16em] text-white/60 hover:text-white transition-colors"
          >
            Blog
          </Link>
          <a
            href="https://passport.predifi.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs uppercase tracking-[0.16em] text-amber-400/80 hover:text-amber-400 transition-colors"
          >
            ⚡ Passport
          </a>
          <Link
            href="/waitlist"
            className="rounded-full border border-amber-400/70 px-4 py-1.5 text-xs uppercase tracking-[0.14em] text-amber-400 transition-colors hover:border-amber-400 hover:bg-amber-400/10"
          >
            Join waitlist
          </Link>
        </nav>

        {/* Mobile: just the waitlist link */}
        <Link
          href="/waitlist"
          className="sm:hidden rounded-full border border-amber-400/70 px-3 py-1 text-xs text-amber-400"
        >
          Waitlist
        </Link>
      </div>
    </header>
  );
}
