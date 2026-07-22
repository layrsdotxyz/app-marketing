(() => {
  const redaction = document.querySelector(".redact");

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
