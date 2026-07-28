const metrics = document.querySelector("#adoption-metrics");
const status = document.querySelector("#adoption-status");
const generatedAt = document.querySelector("#adoption-generated-at");

const firstNumber = (source, keys) => {
  for (const key of keys) {
    const value = key.split(".").reduce((current, part) => current?.[part], source);
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return 0;
};

const render = (report) => {
  const cards = [
    ["Unique private commitments", firstNumber(report, ["summary.uniquePrivateUserCommitments"]), "Observed protocol identities"],
    ["Qualifying activity", firstNumber(report, ["summary.privacyFeatureUsageCount"]), "Eligible protocol receipts"],
    ["Private sessions", firstNumber(report, ["summary.totalPrivateSessions"]), "Attested session starts"],
    ["Private fills", (report.trading?.fills ?? []).reduce((total, row) => total + (row.count ?? 0), 0), "Matched private orders"],
    ["Resolved markets", firstNumber(report, ["trading.confirmedResolutionTransactions"]), "Published outcomes"],
    ["Horizen audit fills", firstNumber(report, ["trading.confirmedAuditFills"]), "Confirmed chain evidence"],
    ["Guardian-qualified users", report.qualification?.guardianQualifiedUniqueUsers ?? "Pending", "TaskOn reconciliation"],
    ["Report version", String(report.schemaVersion ?? report.version ?? "1"), "Machine-readable methodology"],
  ];
  metrics.replaceChildren(...cards.map(([label, value, detail]) => {
    const card = document.createElement("article");
    card.className = "metric-card";
    const title = document.createElement("span");
    title.className = "metric-label";
    title.textContent = label;
    const number = document.createElement("b");
    number.textContent = typeof value === "number" ? value.toLocaleString("en-US") : value;
    const description = document.createElement("span");
    description.className = "metric-detail";
    description.textContent = detail;
    card.append(title, number, description);
    return card;
  }));
  const timestamp = report.generatedAt ?? report.reportGeneratedAt ?? report.asOf;
  generatedAt.textContent = timestamp
    ? `Report generated ${new Date(timestamp).toLocaleString("en-US", { timeZone: "UTC" })} UTC · ${report.reportChecksumSha256 ?? "checksum pending"}`
    : "Current production report";
  status.dataset.state = "ready";
};

fetch("https://api.layrs.xyz/v1/milestone/adoption", {
  headers: { Accept: "application/json" },
  mode: "cors",
})
  .then((response) => {
    if (!response.ok) throw new Error(`report returned ${response.status}`);
    return response.json();
  })
  .then(render)
  .catch(() => {
    status.dataset.state = "error";
    status.textContent = "The live report is temporarily unavailable. Use the JSON or CSV evidence links above.";
    generatedAt.textContent = "Live report unavailable";
  });
