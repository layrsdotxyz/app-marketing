(() => {
  const redaction = document.querySelector(".redact");
  const heroCarousel = document.querySelector("[data-hero-carousel]");
  const tickerTrack = document.querySelector("[data-market-ticker-track]");
  const tickerStatus = document.querySelector("[data-market-ticker-status]");

  const PRODUCTION_MARKET_API = "https://api.layrs.xyz/v1/markets";
  const MARKET_API = ["localhost", "127.0.0.1"].includes(window.location.hostname)
    ? "/api/markets"
    : PRODUCTION_MARKET_API;
  const MARKET_APP = "https://app.layrs.xyz";
  const TICKER_REFRESH_MS = 30_000;

  const cleanSegment = (value, fallback) => {
    const segment = String(value ?? "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
    return segment || fallback;
  };

  const marketHref = (market) => {
    const display = market?.display;
    if (display?.slug) {
      const category = cleanSegment(display.category, "markets");
      const subcategory = cleanSegment(display.subcategory, "all");
      return `${MARKET_APP}/${category}/${subcategory}/${cleanSegment(display.slug, "market")}`;
    }

    const asset = cleanSegment(market?.asset, "market");
    const windowName = cleanSegment(market?.window, "event");
    const epoch = String(market?.marketId ?? "").split(":").at(-1);
    if (/^\d+$/.test(epoch) && windowName !== "event") {
      return `${MARKET_APP}/crypto/${asset}/${windowName}-up-down/${asset}-up-down-${windowName}-${epoch}`;
    }
    return `${MARKET_APP}/markets`;
  };

  const marketLabel = (market) => {
    const question = String(market?.display?.question ?? "").trim();
    if (question) {
      const macro = /^(.+?):\s*above\s+(-?[0-9]+(?:\.[0-9]+)?)\s+(.+?)\s+in the next official release\?$/i.exec(question);
      if (macro) {
        const [, label, rawStrike, rawUnits] = macro;
        const units = rawUnits.toLowerCase();
        const strike = Number(rawStrike);
        const compact = units.includes("percent")
          ? `${strike.toLocaleString("en-US", { maximumFractionDigits: 4 })}%`
          : units.includes("millions")
            ? `${(strike * 1_000_000).toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 2 })}`
            : units.includes("billions")
              ? `${(strike * 1_000_000_000).toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 2 })}`
              : strike.toLocaleString("en-US", { maximumFractionDigits: 4 });
        return `${label}: above ${compact}`;
      }
      return question.length > 78 ? `${question.slice(0, 75).trimEnd()}…` : question;
    }
    const asset = String(market?.asset ?? "Market").toUpperCase();
    const windowName = String(market?.window ?? "").toUpperCase();
    return windowName && windowName !== "EVENT" ? `${asset} Up or Down · ${windowName}` : asset;
  };

  const marketPrice = (market) => {
    const probability = Number(market?.upProbabilityMillionths);
    if (!Number.isFinite(probability)) return null;
    const cents = Math.min(100, Math.max(0, probability / 10_000));
    const outcome = String(market?.display?.outcomeLabels?.[0] ?? "UP").toUpperCase();
    return `${outcome} ${Number.isInteger(cents) ? cents : cents.toFixed(1)}¢`;
  };

  const renderTicker = (markets) => {
    if (!(tickerTrack instanceof HTMLElement)) return;
    tickerTrack.replaceChildren();

    const active = markets
      .filter((market) => market?.state === "OPEN" && market?.tradingAvailable === true)
      .sort((left, right) => {
        const leftVolume = BigInt(left?.volumeAtomic ?? "0");
        const rightVolume = BigInt(right?.volumeAtomic ?? "0");
        if (leftVolume !== rightVolume) return rightVolume > leftVolume ? 1 : -1;
        const leftEventRank = left?.window === "event" ? 1 : 0;
        const rightEventRank = right?.window === "event" ? 1 : 0;
        if (leftEventRank !== rightEventRank) return leftEventRank - rightEventRank;
        return Date.parse(left?.closesAt ?? 0) - Date.parse(right?.closesAt ?? 0);
      })
      .slice(0, 12);

    if (!active.length) {
      const link = document.createElement("a");
      link.href = `${MARKET_APP}/markets`;
      link.textContent = "No open markets right now · View upcoming markets";
      tickerTrack.append(link);
      if (tickerStatus) tickerStatus.textContent = "No Layrs markets are currently open.";
      return;
    }

    const entries = active.map((market) => {
      const link = document.createElement("a");
      link.href = marketHref(market);
      const state = document.createElement("span");
      state.className = "ticker-state";
      state.textContent = "Live";
      const label = document.createTextNode(` ${marketLabel(market)} `);
      const price = document.createElement("b");
      price.textContent = marketPrice(market) ?? "Price pending";
      link.append(state, label, price);
      return link;
    });

    for (let copy = 0; copy < 2; copy += 1) {
      entries.forEach((entry) => tickerTrack.append(entry.cloneNode(true)));
    }
    if (tickerStatus) tickerStatus.textContent = `${active.length} open Layrs markets loaded with current prices.`;
  };

  const renderTickerUnavailable = () => {
    if (!(tickerTrack instanceof HTMLElement)) return;
    const link = document.createElement("a");
    link.href = `${MARKET_APP}/markets`;
    link.textContent = "Live market tape temporarily unavailable · Open Markets";
    tickerTrack.replaceChildren(link);
    if (tickerStatus) tickerStatus.textContent = "The live Layrs market tape is temporarily unavailable.";
  };

  const refreshTicker = async () => {
    if (!(tickerTrack instanceof HTMLElement)) return;
    try {
      const response = await fetch(MARKET_API, { cache: "no-store", signal: AbortSignal.timeout(8_000) });
      if (!response.ok) throw new Error(`Market API returned ${response.status}`);
      const payload = await response.json();
      const markets = Array.isArray(payload) ? payload : payload?.markets;
      if (!Array.isArray(markets)) throw new Error("Market API returned an invalid payload");
      renderTicker(markets);
    } catch {
      renderTickerUnavailable();
    }
  };

  if (tickerTrack instanceof HTMLElement) {
    void refreshTicker();
    window.setInterval(() => { if (!document.hidden) void refreshTicker(); }, TICKER_REFRESH_MS);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) void refreshTicker(); });
  }

  if (heroCarousel instanceof HTMLElement) {
    const slides = [...heroCarousel.querySelectorAll("[data-hero-slide]")];
    const controls = [...heroCarousel.querySelectorAll("[data-hero-target]")];
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let activeIndex = 0;
    let timer = 0;

    const selectSlide = (index, userInitiated = false) => {
      activeIndex = (index + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        const active = slideIndex === activeIndex;
        slide.classList.toggle("is-active", active);
        slide.setAttribute("aria-hidden", String(!active));
      });
      controls.forEach((control, controlIndex) => {
        const active = controlIndex === activeIndex;
        control.classList.toggle("is-active", active);
        control.setAttribute("aria-current", String(active));
      });
      if (userInitiated) restart();
    };
    const stop = () => { if (timer) window.clearInterval(timer); timer = 0; };
    const start = () => {
      stop();
      if (!reduceMotion && slides.length > 1 && !document.hidden) {
        timer = window.setInterval(() => selectSlide(activeIndex + 1), 8_000);
      }
    };
    const restart = () => { stop(); start(); };

    controls.forEach((control) => control.addEventListener("click", () => {
      const target = Number(control.getAttribute("data-hero-target"));
      if (Number.isInteger(target)) selectSlide(target, true);
    }));
    heroCarousel.addEventListener("mouseenter", stop);
    heroCarousel.addEventListener("mouseleave", start);
    heroCarousel.addEventListener("focusin", stop);
    heroCarousel.addEventListener("focusout", (event) => {
      if (!(event.relatedTarget instanceof Node) || !heroCarousel.contains(event.relatedTarget)) start();
    });
    document.addEventListener("visibilitychange", start);
    selectSlide(0);
    start();
  }

  if (redaction instanceof HTMLButtonElement) {
    redaction.addEventListener("click", () => {
      const isOpen = redaction.classList.toggle("open");
      redaction.setAttribute("aria-expanded", String(isOpen));
    });
    redaction.setAttribute("aria-expanded", "false");
    redaction.setAttribute("aria-label", "Reveal the encrypted order status");
  }

  const revealElements = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window)) {
    revealElements.forEach((element) => element.classList.add("in"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
  );

  revealElements.forEach((element) => observer.observe(element));
})();
