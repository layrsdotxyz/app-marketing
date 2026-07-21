"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import gsap from "gsap";

import { X } from "lucide-react";
import { WaitlistCTA } from "@/components/WaitlistCTA";

// Thesis background images live in /public/assets/
const thesisTradeBg = "/assets/thesis-trade-bg.png";
const thesisTomorrowBg = "/assets/thesis-tomorrow-bg.png";
const thesisTodayBg = "/assets/thesis-today-bg.png";

type MarketDomain = "default" | "politics" | "sports" | "conflict" | "crypto" | "macro";
type ThesisWord = "TRADE" | "TOMORROW" | "TODAY";

type ArenaState = "registering" | "live" | "offline";

interface DomainMotionProfile {
  bgDuration: number;
  bgEase: string;
  emphasisDuration: number;
  volatility: "LOW" | "MEDIUM" | "HIGH";
}

interface ThesisMotionProfile {
  bgGradient: string;
  bgImage: string;
  kineticText: string;
  emphasisColor: string;
  charDelay: number;
}

interface ScatteredWord {
  text: string;
  top: string;
  left?: string;
  right?: string;
}

const motionProfiles: Record<MarketDomain, DomainMotionProfile> = {
  default: { bgDuration: 0.5, bgEase: "power2.out", emphasisDuration: 0.3, volatility: "LOW" },
  politics: { bgDuration: 0.8, bgEase: "power4.inOut", emphasisDuration: 0.5, volatility: "LOW" },
  sports: { bgDuration: 0.25, bgEase: "power3.out", emphasisDuration: 0.2, volatility: "MEDIUM" },
  conflict: { bgDuration: 0.4, bgEase: "power2.inOut", emphasisDuration: 0.35, volatility: "HIGH" },
  crypto: { bgDuration: 0.2, bgEase: "power1.out", emphasisDuration: 0.15, volatility: "HIGH" },
  macro: { bgDuration: 1.0, bgEase: "power4.out", emphasisDuration: 0.6, volatility: "LOW" },
};

const thesisProfiles: Record<ThesisWord, ThesisMotionProfile> = {
  TRADE: {
    bgGradient: "radial-gradient(circle at 40% 50%, rgba(43,213,118,0.15), transparent 65%)",
    bgImage: thesisTradeBg,
    kineticText: "TRADE",
    emphasisColor: "rgba(43,213,118,0.95)",
    charDelay: 0.04,
  },
  TOMORROW: {
    bgGradient: "radial-gradient(circle at 50% 50%, rgba(139,92,246,0.15), transparent 65%)",
    bgImage: thesisTomorrowBg,
    kineticText: "TOMORROW",
    emphasisColor: "rgba(139,92,246,0.95)",
    charDelay: 0.03,
  },
  TODAY: {
    bgGradient: "radial-gradient(circle at 60% 50%, rgba(251,191,36,0.18), transparent 65%)",
    bgImage: thesisTodayBg,
    kineticText: "TODAY",
    emphasisColor: "rgba(251,191,36,0.95)",
    charDelay: 0.05,
  },
};

const scatteredWords: ScatteredWord[] = [
  { text: "AGGREGATE", top: "8%", left: "5%" },
  { text: "PREDICT", top: "8%", left: "18%" },
  { text: "RESOLVE", top: "8%", left: "32%" },
  { text: "SETTLE", top: "8%", left: "46%" },
  { text: "PRICE", top: "8%", left: "60%" },
  { text: "&", top: "8%", left: "72%" },
  { text: "WIN", top: "8%", right: "8%" },
  { text: "BINARY", top: "13%", left: "8%" },
  { text: "OUTCOMES", top: "13%", left: "35%" },
  { text: "RESOLVED", top: "13%", right: "12%" },
  { text: "YOUR", top: "18%", left: "4%" },
  { text: "CONVICTION", top: "18%", left: "18%" },
  { text: "BECOMES", top: "18%", left: "45%" },
  { text: "YOUR", top: "18%", right: "20%" },
  { text: "POSITION", top: "18%", right: "3%" },
  { text: "L", top: "26%", left: "3%" },
  { text: "I", top: "26%", left: "6%" },
  { text: "Q", top: "26%", left: "9%" },
  { text: "U", top: "26%", left: "12%" },
  { text: "I", top: "26%", left: "15%" },
  { text: "D", top: "26%", left: "18%" },
  { text: "I", top: "26%", left: "21%" },
  { text: "T", top: "26%", left: "24%" },
  { text: "Y", top: "26%", left: "27%" },
  { text: "IS KING", top: "26%", right: "4%" },
  { text: "BEST EXECUTION", top: "38%", left: "12%" },
  { text: "UNIFIED ORDERBOOK", top: "38%", right: "10%" },
  { text: "PRICE DISCOVERY", top: "52%", left: "3%" },
  { text: "MARKET EFFICIENCY", top: "52%", right: "2%" },
  { text: "SIGNAL", top: "68%", left: "12%" },
  { text: "ALPHA", top: "68%", right: "14%" },
  { text: "BUY", top: "74%", left: "6%" },
  { text: "PROBABILITY", top: "74%", left: "18%" },
  { text: "VOLATILITY", top: "74%", left: "50%" },
  { text: "SELL", top: "74%", right: "6%" },
  { text: "YES", top: "80%", left: "15%" },
  { text: "NO", top: "80%", right: "18%" },
  { text: "ODDS", top: "44%", left: "6%" },
  { text: "STAKE", top: "44%", right: "8%" },
  { text: "EDGE", top: "56%", left: "22%" },
  { text: "EXPOSURE", top: "56%", right: "20%" },
  { text: "LONG", top: "62%", left: "4%" },
  { text: "SHORT", top: "62%", right: "5%" },
  { text: "SPREAD", top: "84%", left: "6%" },
  { text: "SLIPPAGE", top: "84%", right: "8%" },
  { text: "ORDERBOOK", top: "46%", left: "32%" },
  { text: "DEPTH", top: "48%", right: "35%" },
  { text: "AMM", top: "60%", left: "40%" },
  { text: "CLOB", top: "60%", right: "42%" },
  { text: "RESOLUTION", top: "88%", left: "25%" },
  { text: "ORACLE", top: "88%", right: "28%" },
];

const LandingPage = () => {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeBackground, setActiveBackground] = useState<MarketDomain>("default");
  const [showBanner, setShowBanner] = useState(true);
  const runningTweensRef = useRef<gsap.core.Tween[]>([]);

  const [telemetryLine1, setTelemetryLine1] = useState("AGGREGATION: ACTIVE");
  const [telemetryLine2, setTelemetryLine2] = useState("STATE: NORMALIZED");

  const [arenaState] = useState<ArenaState>("offline");
  const [showArena, setShowArena] = useState(false);
  const [particles, setParticles] = useState<Array<{
    size: number; baseX: number; baseY: number; alpha: number;
    glow: number; animDuration: number; animDelay: number;
    speedX: number; speedY: number;
  }> | null>(null);

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const thesisWords: ThesisWord[] = ["TRADE", "TOMORROW", "TODAY"];

  const [activeThesisWord, setActiveThesisWord] = useState<ThesisWord | null>(null);
  const thesisRowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const ctaCenterRef = useRef<HTMLDivElement>(null);
  const particleTrailContainerRef = useRef<HTMLDivElement>(null);
  const kineticTypeRef = useRef<HTMLDivElement>(null);
  const kineticAnimationRef = useRef<gsap.core.Timeline | null>(null);

  // Generate particles client-side only to avoid SSR hydration mismatch
  useEffect(() => {
    setParticles([...Array(30)].map(() => ({
      size: 2 + Math.random() * 4,
      baseX: Math.random() * 100,
      baseY: Math.random() * 100,
      alpha: 0.1 + Math.random() * 0.2,
      glow: 4 + Math.random() * 8,
      animDuration: 8 + Math.random() * 12,
      animDelay: Math.random() * -20,
      speedX: 0.01 + Math.random() * 0.03,
      speedY: 0.01 + Math.random() * 0.03,
    })));
  }, []);

  const arenaText = useMemo(() => {
    switch (arenaState) {
      case "registering":
        return { line1: "ARENA: SEASON 0", line2: "STATE: REGISTERING" };
      case "live":
        return { line1: "ARENA: LIVE", line2: "ROUND: 3 / 5" };
      case "offline":
        return { line1: "ARENA: SEASON 0", line2: "COMING SOON — Q2 2026" };
    }
  }, [arenaState]);

  const killRunningTweens = useCallback(() => {
    runningTweensRef.current.forEach((tween) => tween.kill());
    runningTweensRef.current = [];
  }, []);

  const switchBackground = useCallback(
    (target: MarketDomain) => {
      if (target === activeBackground) return;
      killRunningTweens();

      const profile = motionProfiles[target];
      const allBgs = document.querySelectorAll(".regime-bg");
      const targetBg = document.getElementById(`${target}-bg`);

      runningTweensRef.current.push(
        gsap.to(allBgs, { opacity: 0, duration: profile.bgDuration * 0.7, ease: profile.bgEase })
      );

      if (targetBg) {
        runningTweensRef.current.push(
          gsap.to(targetBg, { opacity: 1, duration: profile.bgDuration, ease: profile.bgEase })
        );
      }

      setActiveBackground(target);
    },
    [activeBackground, killRunningTweens]
  );

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
    const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;

    // swipe reserved for future use

    touchStartRef.current = null;
  };

  const updateTelemetry = useCallback((domain: MarketDomain) => {
    const profile = motionProfiles[domain];

    if (domain === "default") {
      gsap.to(".telemetry-text", {
        opacity: 0.12,
        duration: 0.3,
        onComplete: () => {
          setTelemetryLine1("AGGREGATION: ACTIVE");
          setTelemetryLine2("STATE: NORMALIZED");
          gsap.to(".telemetry-text", { opacity: 0.12, duration: 0.3 });
        },
      });
    } else {
      gsap.to(".telemetry-text", {
        opacity: 0.08,
        duration: 0.2,
        onComplete: () => {
          setTelemetryLine1(`REGIME: ${domain.toUpperCase()}`);
          setTelemetryLine2(`VOLATILITY: ${profile.volatility}`);
          gsap.to(".telemetry-text", { opacity: 0.15, duration: 0.3 });
        },
      });
    }
  }, []);

  // Boot sequence animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".background-frame", { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power2.out" });
      gsap.from(".logo-container", { opacity: 0, scale: 0.9, duration: 0.4, delay: 0.1, ease: "power2.out" });
      gsap.from(".telemetry-text", { opacity: 0, y: 4, duration: 0.5, stagger: 0.08, delay: 0.2, ease: "power2.out" });
      gsap.from(".scattered-word", {
        opacity: 0,
        scale: 0.9,
        duration: 0.5,
        stagger: { each: 0.02, from: "random" },
        delay: 0.3,
        ease: "power2.out",
      });

      const thesisWordEls = document.querySelectorAll(".thesis-word");
      thesisWordEls.forEach((wordEl, wordIndex) => {
        const chars = wordEl.querySelectorAll(".thesis-char");
        chars.forEach((char, charIndex) => {
          gsap.fromTo(
            char,
            { opacity: 0, x: -20, clipPath: "inset(0 100% 0 0)" },
            {
              opacity: 1,
              x: 0,
              clipPath: "inset(0 0% 0 0)",
              duration: 0.5,
              delay: 0.5 + wordIndex * 0.15 + charIndex * 0.04,
              ease: "power2.out",
            }
          );
        });
      });

      gsap.from(".text-assertion", { opacity: 0, x: -10, duration: 0.4, stagger: 0.1, delay: 0.6, ease: "power2.out" });
      gsap.from(".text-primitive", { opacity: 0, duration: 0.4, stagger: 0.05, delay: 0.8, ease: "power2.out" });

      gsap.fromTo(
        ".text-cta",
        { opacity: 0, y: 6 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, delay: 0.9, ease: "power2.out", clearProps: "opacity" }
      );

      setTimeout(() => {
        document.querySelectorAll(".scattered-word").forEach((el, i) => {
          gsap.to(el, { opacity: 0.4 + Math.random() * 0.3, duration: 2 + Math.random() * 2, repeat: -1, yoyo: true, ease: "sine.inOut", delay: i * 0.15 });
        });

        const scrambleRandomWord = () => {
          const words = document.querySelectorAll(".scattered-word");
          if (words.length === 0) return;
          const randomWord = words[Math.floor(Math.random() * words.length)] as HTMLElement;
          const originalText = randomWord.dataset.text || randomWord.textContent || "";
          const chars = "■▪▌▐▬";
          let iterations = 0;
          const interval = setInterval(() => {
            randomWord.textContent = originalText
              .split("")
              .map((char, idx) => {
                if (idx < iterations) return originalText[idx];
                if (char === " ") return " ";
                return chars[Math.floor(Math.random() * chars.length)];
              })
              .join("");
            iterations += 0.6;
            if (iterations >= originalText.length) {
              clearInterval(interval);
              randomWord.textContent = originalText;
            }
          }, 30);
          setTimeout(scrambleRandomWord, 800 + Math.random() * 2000);
        };
        setTimeout(scrambleRandomWord, 1500);
      }, 800);

      setTimeout(() => {
        document.querySelectorAll(".text-primitive").forEach((el, i) => {
          gsap.to(el, { opacity: 0.08, duration: 2 + Math.random(), repeat: -1, yoyo: true, ease: "none", delay: i * 0.4 });
        });
      }, 1200);

      setTimeout(() => {
        setShowArena(true);
        // Double rAF ensures React has committed the DOM before GSAP targets the element
        requestAnimationFrame(() => requestAnimationFrame(() => {
          gsap.fromTo(".arena-overlay", { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power2.out" });
        }));
      }, 1500);
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Parallax mouse movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const offsetX = (e.clientX - centerX) / centerX;
      const offsetY = (e.clientY - centerY) / centerY;

      document.querySelectorAll(".scattered-word").forEach((el) => {
        const htmlEl = el as HTMLElement;
        const speed = parseFloat(htmlEl.dataset.parallaxSpeed || "0.02");
        gsap.to(htmlEl, { x: offsetX * 40 * speed, y: offsetY * 25 * speed, duration: 0.8, ease: "power2.out", overwrite: "auto" });
      });

      document.querySelectorAll(".regime-bg").forEach((el, i) => {
        const speed = 0.015 + i * 0.005;
        gsap.to(el, { x: offsetX * 30 * speed, y: offsetY * 20 * speed, duration: 1.0, ease: "power2.out", overwrite: "auto" });
      });

      const scatteredContainer = document.querySelector(".scattered-container");
      if (scatteredContainer) {
        gsap.to(scatteredContainer, { x: offsetX * 8, y: offsetY * 5, duration: 1.2, ease: "power2.out", overwrite: "auto" });
      }

      document.querySelectorAll(".ambient-particle").forEach((el) => {
        const htmlEl = el as HTMLElement;
        const speedX = parseFloat(htmlEl.dataset.speedX || "0.02");
        const speedY = parseFloat(htmlEl.dataset.speedY || "0.02");
        gsap.to(el, {
          x: offsetX * 50 * speedX * (Math.random() > 0.5 ? 1 : -1),
          y: offsetY * 50 * speedY * (Math.random() > 0.5 ? 1 : -1),
          duration: 1.5,
          ease: "power1.out",
          overwrite: "auto",
        });
      });
    };

    const handleMouseLeave = () => {
      document.querySelectorAll(".scattered-word, .regime-bg, .ambient-particle").forEach((el) => {
        gsap.to(el, { x: 0, y: 0, duration: 1.2, ease: "power2.out" });
      });
      const scatteredContainer = document.querySelector(".scattered-container");
      if (scatteredContainer) {
        gsap.to(scatteredContainer, { x: 0, y: 0, duration: 1.2, ease: "power2.out" });
      }
    };

    let lastMoveTime = 0;
    const throttledMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastMoveTime < 16) return;
      lastMoveTime = now;
      handleMouseMove(e);
    };

    window.addEventListener("mousemove", throttledMouseMove);
    document.body.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      window.removeEventListener("mousemove", throttledMouseMove);
      document.body.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  const startKineticAnimation = useCallback((word: ThesisWord) => {
    if (!kineticTypeRef.current) return;
    if (kineticAnimationRef.current) kineticAnimationRef.current.kill();

    const kineticType = kineticTypeRef.current;
    const typeLines = kineticType.querySelectorAll(".type-line");
    const oddLines = kineticType.querySelectorAll(".type-line.odd");
    const evenLines = kineticType.querySelectorAll(".type-line.even");

    const repeatedText = `${word} ${word} ${word}`;
    typeLines.forEach((line) => { line.textContent = repeatedText; });

    gsap.set(kineticType, { display: "grid", scale: 1, rotation: 0, opacity: 1 });
    gsap.set(typeLines, { opacity: 0.02, x: "0%" });

    const timeline = gsap.timeline();
    timeline.to(kineticType, { duration: 1.2, ease: "power4.inOut", scale: 2.2, rotation: -90 });
    timeline.to(oddLines, { keyframes: [{ x: "15%", duration: 0.8, ease: "power4.inOut" }, { x: "-180%", duration: 1.2, ease: "power4.inOut" }], stagger: 0.06 }, 0);
    timeline.to(evenLines, { keyframes: [{ x: "-15%", duration: 0.8, ease: "power4.inOut" }, { x: "180%", duration: 1.2, ease: "power4.inOut" }], stagger: 0.06 }, 0);
    timeline.to(typeLines, { keyframes: [{ opacity: 0.8, duration: 0.6, ease: "power2.out" }, { opacity: 0, duration: 1.0, ease: "power2.in" }], stagger: 0.04 }, 0);

    kineticAnimationRef.current = timeline;
  }, []);

  const fadeOutKineticAnimation = useCallback(() => {
    if (!kineticTypeRef.current) return;
    if (kineticAnimationRef.current) {
      kineticAnimationRef.current.kill();
      kineticAnimationRef.current = null;
    }
    const kineticType = kineticTypeRef.current;
    const typeLines = kineticType.querySelectorAll(".type-line");
    gsap.to(kineticType, {
      opacity: 0,
      scale: 0.9,
      duration: 0.4,
      ease: "power2.out",
      onComplete: () => {
        gsap.set(kineticType, { scale: 1, rotation: 0, opacity: 1 });
        gsap.set(typeLines, { opacity: 0.02, x: "0%" });
      },
    });
  }, []);

  const spawnParticleTrail = useCallback((element: HTMLElement, color: string) => {
    const container = particleTrailContainerRef.current;
    if (!container) return;
    const rect = element.getBoundingClientRect();

    for (let i = 0; i < 12; i++) {
      const particle = document.createElement("div");
      const size = 3 + Math.random() * 5;
      const startX = rect.left + Math.random() * rect.width;
      const startY = rect.top + Math.random() * rect.height;
      particle.style.cssText = `position:fixed;width:${size}px;height:${size}px;background:${color};border-radius:50%;pointer-events:none;left:${startX}px;top:${startY}px;box-shadow:0 0 ${size * 2}px ${color};z-index:200;`;
      container.appendChild(particle);
      gsap.to(particle, {
        x: (Math.random() - 0.5) * 100,
        y: -50 - Math.random() * 80,
        opacity: 0,
        scale: 0,
        duration: 1 + Math.random() * 0.5,
        delay: i * 0.05,
        ease: "power2.out",
        onComplete: () => particle.remove(),
      });
    }
  }, []);

  const handleCtaMouseMove = useCallback((e: React.MouseEvent, ctaRef: React.RefObject<HTMLDivElement | null>) => {
    if (!ctaRef.current) return;
    const rect = ctaRef.current.getBoundingClientRect();
    const deltaX = e.clientX - (rect.left + rect.width / 2);
    const deltaY = e.clientY - (rect.top + rect.height / 2);
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (distance < 100) {
      const strength = (1 - distance / 100) * 0.4;
      gsap.to(ctaRef.current, { x: deltaX * strength, y: deltaY * strength, duration: 0.3, ease: "power2.out" });
    }
  }, []);

  const handleCtaMouseLeave = useCallback((ctaRef: React.RefObject<HTMLDivElement | null>) => {
    if (!ctaRef.current) return;
    gsap.to(ctaRef.current, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.5)" });
  }, []);

  const handleThesisEnter = useCallback(
    (word: ThesisWord, element: HTMLElement, index: number) => {
      if (activeThesisWord === word) return;
      setActiveThesisWord(word);
      const profile = thesisProfiles[word];

      const thesisBg = document.getElementById("thesis-bg");
      if (thesisBg) {
        thesisBg.style.background = profile.bgGradient;
        gsap.to(thesisBg, { opacity: 1, duration: 0.5, ease: "power2.out" });
      }

      thesisWords.forEach((w) => {
        const imgEl = document.getElementById(`thesis-img-${w}`);
        if (imgEl) gsap.to(imgEl, { opacity: w === word ? 0.3 : 0, duration: 0.6, ease: "power2.out" });
      });

      document.querySelectorAll(".scattered-word").forEach((el) => {
        const htmlEl = el as HTMLElement;
        const highlightBox = htmlEl.querySelector(".highlight-box") as HTMLElement;
        gsap.to(htmlEl, { opacity: 0.2, duration: 0.3, ease: "power2.out" });
        if (Math.random() > 0.6 && highlightBox) {
          gsap.to(highlightBox, {
            width: "calc(100% + 8px)",
            duration: 0.4,
            delay: Math.random() * 0.3,
            ease: "power2.inOut",
            onComplete: () => { gsap.to(htmlEl, { color: "#0a0a0a", opacity: 1, duration: 0.2 }); },
          });
        }
      });

      gsap.to(".thesis-word", { opacity: 0.25, duration: 0.25, ease: "power2.out" });
      gsap.to(element, {
        textShadow: `0 0 20px ${profile.emphasisColor}, 0 0 40px ${profile.emphasisColor}, 0 0 60px ${profile.emphasisColor.replace("0.95", "0.5")}`,
        duration: 0.4,
        ease: "power2.out",
      });
      element.classList.add("chromatic-active");
      spawnParticleTrail(element, profile.emphasisColor);

      const chars = element.querySelectorAll(".thesis-char");
      gsap.to(element, { opacity: 1, duration: 0.2, ease: "power2.out" });
      chars.forEach((char, i) => {
        gsap.to(char, { y: -4, scale: 1.08, opacity: 1, duration: 0.35, delay: i * profile.charDelay, ease: "power2.out" });
      });
      gsap.to(element, { letterSpacing: "0.4em", duration: 0.5, ease: "power2.out" });
      gsap.to(".telemetry-text", {
        opacity: 0.08,
        duration: 0.15,
        onComplete: () => {
          setTelemetryLine1(`MODE: ${word}`);
          setTelemetryLine2("SIGNAL: ACTIVE");
          gsap.to(".telemetry-text", { opacity: 0.2, duration: 0.25 });
        },
      });
      startKineticAnimation(word);
    },
    [activeThesisWord, startKineticAnimation, spawnParticleTrail]
  );

  const handleThesisLeave = useCallback(() => {
    setActiveThesisWord(null);
    const thesisBg = document.getElementById("thesis-bg");
    if (thesisBg) gsap.to(thesisBg, { opacity: 0, duration: 0.4, ease: "power2.out" });
    thesisWords.forEach((w) => {
      const imgEl = document.getElementById(`thesis-img-${w}`);
      if (imgEl) gsap.to(imgEl, { opacity: 0, duration: 0.5, ease: "power2.out" });
    });
    document.querySelectorAll(".scattered-word").forEach((el) => {
      const htmlEl = el as HTMLElement;
      const highlightBox = htmlEl.querySelector(".highlight-box") as HTMLElement;
      gsap.to(htmlEl, { opacity: 0.6, color: "rgba(255,204,0,0.8)", duration: 0.4, ease: "power2.out" });
      if (highlightBox) gsap.to(highlightBox, { width: "0%", duration: 0.3, ease: "power2.out" });
    });
    document.querySelectorAll(".thesis-word").forEach((wordEl) => {
      (wordEl as HTMLElement).classList.remove("chromatic-active");
      wordEl.querySelectorAll(".thesis-char").forEach((char) => {
        gsap.to(char, { y: 0, scale: 1, opacity: 1, duration: 0.3, ease: "power2.out" });
      });
    });
    gsap.to(".thesis-word", { opacity: 0.95, letterSpacing: "0.22em", textShadow: "none", duration: 0.35, ease: "power2.out" });
    updateTelemetry("default");
    fadeOutKineticAnimation();
  }, [updateTelemetry, fadeOutKineticAnimation]);

  const handleAssertionEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const originalText = el.dataset.text || el.innerText;
    const chars = "0123456789%$#@!*&";
    let iterations = 0;
    gsap.to(".telemetry-text", {
      opacity: 0.08,
      duration: 0.15,
      onComplete: () => {
        setTelemetryLine2("SIGNAL CONFIRMED");
        gsap.to(".telemetry-text", { opacity: 0.18, duration: 0.2 });
      },
    });
    const interval = setInterval(() => {
      el.innerText = originalText
        .split("")
        .map((char, i) => {
          if (i < iterations) return originalText[i];
          if (char === " ") return " ";
          return chars[Math.floor(Math.random() * chars.length)];
        })
        .join("");
      iterations += 0.8;
      if (iterations >= originalText.length) {
        clearInterval(interval);
        el.innerText = originalText;
        setTimeout(() => updateTelemetry(activeBackground), 500);
      }
    }, 25);
  };

  const getBackgroundStyle = (bg: MarketDomain): React.CSSProperties => {
    const styles: Record<MarketDomain, React.CSSProperties> = {
      default: { background: "radial-gradient(circle at center, rgba(255,255,255,0.04), transparent 70%)" },
      politics: { background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(0,0,0,0.9))" },
      sports: { background: "radial-gradient(circle at 60% 40%, rgba(255,255,255,0.08), transparent 65%)" },
      conflict: { background: "linear-gradient(135deg, rgba(255,80,80,0.08), rgba(0,0,0,0.95))" },
      crypto: { background: "radial-gradient(circle at 30% 60%, rgba(43,213,118,0.1), transparent 70%)" },
      macro: { background: "linear-gradient(to bottom, rgba(255,255,255,0.02), rgba(0,0,0,1))" },
    };
    return styles[bg];
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden bg-[#050505]"
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Scanlines FX */}
      <div
        className="fixed inset-0 pointer-events-none z-[100]"
        style={{
          background: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)`,
          mixBlendMode: "overlay",
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none z-[99] opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Alpha Banner */}
      {showBanner && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 bg-black/80 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-[0.15em] text-amber-400">ALPHA_PHASE</span>
            <span className="hidden sm:inline text-[10px] uppercase tracking-[0.1em] text-white/40">{"// FEATURES MAY BE LIMITED"}</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://passport.predifi.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] uppercase tracking-[0.14em] text-amber-400/80 hover:text-amber-400 transition-colors border border-amber-400/30 hover:border-amber-400/60 px-3 py-1 rounded"
            >
              ⚡ Passport ↗
            </a>
            <button onClick={() => setShowBanner(false)} className="text-white/40 hover:text-white transition-colors">
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Arena State Overlay */}
      {showArena && (
        <div
          className="arena-overlay fixed z-40 text-left cursor-default group"
          style={{ bottom: "80px", left: "16px" }}
        >
          <div className="text-[10px] uppercase tracking-[0.12em] text-amber-400/60">{arenaText.line1}</div>
          <div className="text-[9px] uppercase tracking-[0.1em] text-white/30">{arenaText.line2}</div>
        </div>
      )}

      {/* Background Grid */}
      <div
        className="background-frame fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />

      {/* Market Regime Backgrounds */}
      {(["default", "politics", "sports", "conflict", "crypto", "macro"] as MarketDomain[]).map((bg) => (
        <div
          key={bg}
          id={`${bg}-bg`}
          className="regime-bg fixed inset-0 pointer-events-none z-[1]"
          style={{ ...getBackgroundStyle(bg), opacity: activeBackground === bg ? 1 : 0 }}
        />
      ))}

      {/* Thesis Word Gradient Background */}
      <div id="thesis-bg" className="fixed inset-0 pointer-events-none z-[1]" style={{ opacity: 0 }} />

      {/* Thesis Background Images */}
      {thesisWords.map((word) => (
        <div
          key={`thesis-img-${word}`}
          id={`thesis-img-${word}`}
          className="fixed inset-0 pointer-events-none z-[0]"
          style={{
            backgroundImage: `url(${thesisProfiles[word].bgImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "grayscale(100%)",
            opacity: 0,
            mixBlendMode: "overlay",
          }}
        />
      ))}

      {/* Kinetic Type Layer */}
      <div
        ref={kineticTypeRef}
        className="fixed pointer-events-none z-[5]"
        style={{
          height: "100vmax",
          width: "100vmax",
          textTransform: "uppercase",
          display: "grid",
          justifyContent: "center",
          alignContent: "center",
          textAlign: "center",
          top: "50%",
          left: "50%",
          marginTop: "-50vmax",
          marginLeft: "-50vmax",
          transformStyle: "preserve-3d",
        }}
      >
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className={`type-line ${i % 2 === 0 ? "odd" : "even"}`}
            style={{
              whiteSpace: "nowrap",
              fontSize: "clamp(7rem, 18.75vh, 15rem)",
              lineHeight: 0.75,
              fontWeight: "bold",
              fontFamily: "'JetBrains Mono', sans-serif",
              color: "#ffffff",
              opacity: 0.015,
              userSelect: "none",
              position: "relative",
              zIndex: i % 2 === 0 ? 50 : 150,
            }}
          >
            TRADE TRADE TRADE
          </div>
        ))}
      </div>

      {/* Scattered Background Words */}
      <div className="scattered-container fixed inset-0 pointer-events-none z-[2]">
        {scatteredWords.map((word, i) => (
          <div
            key={`${word.text}-${i}`}
            className="scattered-word absolute text-[9px] md:text-[11px] uppercase tracking-[0.08em] whitespace-nowrap"
            style={{ top: word.top, left: word.left, right: word.right, color: "rgba(255,204,0,0.8)", fontFamily: "'JetBrains Mono', monospace", opacity: 0.6 }}
            data-text={word.text}
            data-parallax-speed={0.02 + (i % 5) * 0.01}
          >
            <span className="highlight-box absolute -top-[2px] -left-[4px] h-[calc(100%+4px)] bg-amber-400 z-[-1]" style={{ width: 0 }} />
            <span className="relative z-[1]">{word.text}</span>
          </div>
        ))}
      </div>

      {/* Ambient Particles — client-only to avoid SSR hydration mismatch */}
      <div id="particle-container" className="fixed inset-0 pointer-events-none z-[2] overflow-hidden">
        {particles && particles.map((p, i) => (
          <div
            key={i}
            className="ambient-particle absolute rounded-full"
            style={{
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: `rgba(255, 204, 0, ${p.alpha})`,
              left: `${p.baseX}%`,
              top: `${p.baseY}%`,
              boxShadow: `0 0 ${p.glow}px rgba(255, 204, 0, 0.3)`,
              animation: `particleFloat${i % 4} ${p.animDuration}s ease-in-out infinite`,
              animationDelay: `${p.animDelay}s`,
            }}
            data-speed-x={p.speedX}
            data-speed-y={p.speedY}
            data-base-x={p.baseX}
            data-base-y={p.baseY}
          />
        ))}
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes particleFloat0 { 0%,100%{transform:translate(0,0)} 25%{transform:translate(15px,-20px)} 50%{transform:translate(-10px,-35px)} 75%{transform:translate(20px,-15px)} }
        @keyframes particleFloat1 { 0%,100%{transform:translate(0,0)} 25%{transform:translate(-20px,15px)} 50%{transform:translate(25px,10px)} 75%{transform:translate(-15px,-20px)} }
        @keyframes particleFloat2 { 0%,100%{transform:translate(0,0)} 25%{transform:translate(10px,25px)} 50%{transform:translate(-20px,15px)} 75%{transform:translate(15px,-10px)} }
        @keyframes particleFloat3 { 0%,100%{transform:translate(0,0)} 25%{transform:translate(-15px,-15px)} 50%{transform:translate(20px,-25px)} 75%{transform:translate(-10px,20px)} }
        @keyframes ctaPulse { 0%,100%{text-shadow:0 0 8px rgba(255,204,0,0.3),0 0 16px rgba(255,204,0,0.2)} 50%{text-shadow:0 0 16px rgba(255,204,0,0.5),0 0 32px rgba(255,204,0,0.3),0 0 48px rgba(255,204,0,0.15)} }
        @keyframes chromaticShift { 0%,100%{text-shadow:-2px 0 rgba(255,0,0,0.5),2px 0 rgba(0,255,255,0.5),0 0 20px currentColor} 33%{text-shadow:-3px 1px rgba(255,0,0,0.6),3px -1px rgba(0,255,255,0.6),0 0 25px currentColor} 66%{text-shadow:-1px -1px rgba(255,0,0,0.4),1px 1px rgba(0,255,255,0.4),0 0 15px currentColor} }
        .chromatic-active { animation: chromaticShift 2s ease-in-out infinite; position: relative; }
        @keyframes glitchLeft { 0%,100%{transform:translateX(-2px)} 25%{transform:translateX(-3px) translateY(1px)} 50%{transform:translateX(-1px)} 75%{transform:translateX(-2px) translateY(-1px)} }
        @keyframes glitchRight { 0%,100%{transform:translateX(2px)} 25%{transform:translateX(1px) translateY(-1px)} 50%{transform:translateX(3px)} 75%{transform:translateX(2px) translateY(1px)} }
      `}</style>

      {/* Bottom Gradient */}
      <div className="fixed bottom-0 left-0 w-full h-[40%] z-[3] pointer-events-none" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.9), transparent)" }} />

      {/* Text Layer */}
      <div className="relative w-full h-full z-[3] pointer-events-none" style={{ paddingTop: showBanner ? "32px" : "0" }}>

        {/* Logo */}
        <Link
          href="/"
          className="logo-container absolute pointer-events-auto cursor-pointer flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity"
          style={{ top: showBanner ? "6%" : "4%", right: "4%" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/logo-icon-dark.png" alt="Predifi" className="h-6 md:h-8" />
          <span className="text-white text-xs md:text-sm uppercase tracking-[0.22em] font-medium hidden sm:inline">
            Predifi
          </span>
        </Link>

        {/* Telemetry HUD */}
        <div className="telemetry-text absolute text-[10px] md:text-[11px] uppercase tracking-[0.12em] text-white/12 pointer-events-none" style={{ top: showBanner ? "7%" : "5%", left: "4%" }}>
          {telemetryLine1}
        </div>
        <div className="telemetry-text absolute text-[10px] md:text-[11px] uppercase tracking-[0.12em] text-white/12 pointer-events-none" style={{ top: showBanner ? "10%" : "8%", left: "4%" }}>
          {telemetryLine2}
        </div>

        {/* Core Thesis Words */}
        <div className="thesis-container absolute w-full flex flex-col items-center gap-2 md:gap-3 z-10" style={{ top: showBanner ? "32%" : "29%" }}>
          {thesisWords.map((word, index) => (
            <div
              key={word}
              ref={(el) => { thesisRowRefs.current[index] = el; }}
              data-text={word}
              className={`thesis-word text-xl sm:text-2xl md:text-4xl lg:text-6xl uppercase tracking-[0.22em] cursor-pointer pointer-events-auto flex items-center justify-center ${activeThesisWord === word ? "text-white" : "text-white/95"}`}
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
              onMouseEnter={(e) => handleThesisEnter(word, e.currentTarget, index)}
              onMouseLeave={handleThesisLeave}
            >
              {word.split("").map((char, charIndex) => (
                <span key={charIndex} className="thesis-char inline-block" style={{ display: "inline-block", willChange: "transform" }}>
                  {char}
                </span>
              ))}
            </div>
          ))}
        </div>

        {/* Assertions */}
        <div className="text-assertion absolute text-[10px] md:text-sm uppercase tracking-[0.12em] text-white/40 cursor-default pointer-events-auto hidden sm:block" style={{ top: "50%", left: "10%" }} data-text="OUTCOMES ARE LIQUID" onMouseEnter={handleAssertionEnter}>
          OUTCOMES ARE LIQUID
        </div>
        <div className="text-assertion absolute text-[10px] md:text-sm uppercase tracking-[0.12em] text-white/40 cursor-default pointer-events-auto hidden sm:block" style={{ top: "56%", left: "55%" }} data-text="BELIEF IS PRICED" onMouseEnter={handleAssertionEnter}>
          BELIEF IS PRICED
        </div>
        <div className="text-assertion absolute text-[10px] md:text-sm uppercase tracking-[0.12em] text-white/40 cursor-default pointer-events-auto hidden sm:block" style={{ top: "62%", left: "30%" }} data-text="TIME COMPRESSES" onMouseEnter={handleAssertionEnter}>
          TIME COMPRESSES
        </div>

        {/* Market Primitives */}
        <div className="absolute w-full justify-center gap-6 md:gap-12 lg:gap-20 hidden md:flex" style={{ top: "74%" }}>
          {["PROBABILITY", "LIQUIDITY", "VOLATILITY", "RESOLUTION"].map((primitive) => (
            <div key={primitive} className="text-primitive text-[10px] md:text-xs uppercase tracking-[0.12em] text-white/20 pointer-events-none">
              {primitive}
            </div>
          ))}
        </div>

        {/* Mobile Subtitle */}
        <div className="absolute text-[9px] uppercase tracking-[0.1em] text-white/30 text-center w-full px-4 sm:hidden pointer-events-none" style={{ top: "44%" }}>
          AGGREGATED PREDICTION MARKETS
        </div>

        {/* Footer Nav */}
        <div className="absolute w-full flex items-center justify-center gap-6 md:gap-10" style={{ bottom: "4%" }}>
          <span className="text-[9px] uppercase tracking-[0.1em] text-white/15 pointer-events-none hidden md:inline">
            NETWORK_STATUS: DEVELOPMENT • BUILD: 0.1.0-ALPHA
          </span>
          <div className="flex items-center gap-5 pointer-events-auto">
            <Link href="/pwi" className="text-[9px] uppercase tracking-[0.14em] text-white/30 hover:text-white/70 transition-colors duration-200">
              World Index
            </Link>
            <span className="text-white/10 text-[9px]">•</span>
            <a href="https://blog.predifi.com" className="text-[9px] uppercase tracking-[0.14em] text-white/30 hover:text-white/70 transition-colors duration-200">
              Blog
            </a>
            <span className="text-white/10 text-[9px]">•</span>
            <Link href="/tos" className="text-[9px] uppercase tracking-[0.14em] text-white/30 hover:text-white/70 transition-colors duration-200">
              Terms
            </Link>
            <span className="text-white/10 text-[9px]">•</span>
            <Link href="/privacy" className="text-[9px] uppercase tracking-[0.14em] text-white/30 hover:text-white/70 transition-colors duration-200">
              Privacy
            </Link>
          </div>
        </div>
      </div>

      {/* Particle Trail Container */}
      <div ref={particleTrailContainerRef} className="fixed inset-0 pointer-events-none z-[150]" />

      {/* CTA Layer — single centered GET ACCESS */}
      <div className="fixed inset-0 z-[110] pointer-events-none" style={{ mixBlendMode: "normal" }}>
        <WaitlistCTA />
      </div>
    </div>
  );
};

export default LandingPage;
