const status = document.querySelector("#adoption-status");
const generatedAt = document.querySelector("#adoption-generated-at");
const summary = document.querySelector("#adoption-summary");
const activity = document.querySelector("#adoption-activity");
const buckets = document.querySelector("#adoption-buckets");
const queries = document.querySelector("#adoption-queries");
const checksum = document.querySelector("#adoption-checksum");
const downloadJson = document.querySelector("#download-adoption-json");
const downloadCsv = document.querySelector("#download-adoption-csv");

const firstNumber = (source, keys) => {
  for (const key of keys) {
    const value = key.split(".").reduce((current, part) => current?.[part], source);
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return 0;
};

const LEGACY_ADOPTION_CAPTURE = {
  epochId: "legacy-through-20260826T101325496Z",
  capturePath: "/legacy-adoption-3fb3d9acbc38762f6e065758705ce22f7895fd449ff6b9ea7f046465c96c4fa7.json",
  captureSha256: "3fb3d9acbc38762f6e065758705ce22f7895fd449ff6b9ea7f046465c96c4fa7",
  manifestPath: "/legacy-adoption-manifest-364caa9727989c1d9bb1d53eb0e0c4b7c734ad69f345e1949f3c2afafcf174c1.json",
  manifestSha256: "364caa9727989c1d9bb1d53eb0e0c4b7c734ad69f345e1949f3c2afafcf174c1",
  manifestObjectKey: "fresh-epoch-migration/20260826/adoption/adoption-historical-epoch-manifest.json",
  manifestObjectVersionId: "8kyCqLqd6GIKA0o2q4sfSPh9i6xvB2kz",
};

const sha256Hex = async (bytes) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))]
  .map((value) => value.toString(16).padStart(2, "0")).join("");

const fetchBytes = async (path) => {
  const response = await fetch(path, { cache: "force-cache" });
  if (!response.ok) throw new Error(`historical adoption capture returned ${response.status}`);
  return response.arrayBuffer();
};

const loadHistoricalAdoption = async (report) => {
  const [captureBytes, manifestBytes] = await Promise.all([
    fetchBytes(LEGACY_ADOPTION_CAPTURE.capturePath),
    fetchBytes(LEGACY_ADOPTION_CAPTURE.manifestPath),
  ]);
  // The immutable capture is minified JSON without a trailing newline. The
  // static-site package stores text assets with one packaging newline; bind
  // provenance to the original bytes and reject every other transformation.
  const packagedCapture = new Uint8Array(captureBytes);
  if (packagedCapture.length !== 2932 || packagedCapture.at(-1) !== 0x0a) {
    throw new Error("historical adoption capture packaging mismatch");
  }
  const provenanceCaptureBytes = packagedCapture.slice(0, -1);
  const [captureHash, manifestHash] = await Promise.all([
    sha256Hex(provenanceCaptureBytes),
    sha256Hex(manifestBytes),
  ]);
  if (captureHash !== LEGACY_ADOPTION_CAPTURE.captureSha256
      || manifestHash !== LEGACY_ADOPTION_CAPTURE.manifestSha256) {
    throw new Error("historical adoption artifact hash mismatch");
  }
  const capture = JSON.parse(new TextDecoder().decode(provenanceCaptureBytes));
  const manifest = JSON.parse(new TextDecoder().decode(manifestBytes));
  const epoch = report.epochs?.historical?.find(({ epochId }) => epochId === LEGACY_ADOPTION_CAPTURE.epochId);
  const manifestCapture = manifest.captures?.find(({ name }) => name === "adoption-api-json");
  if (!epoch
      || epoch.manifestSha256 !== `0x${manifestHash}`
      || epoch.manifestObjectKey !== LEGACY_ADOPTION_CAPTURE.manifestObjectKey
      || epoch.manifestObjectVersionId !== LEGACY_ADOPTION_CAPTURE.manifestObjectVersionId
      || manifest.epoch?.id !== LEGACY_ADOPTION_CAPTURE.epochId
      || manifestCapture?.sha256 !== captureHash
      || manifestCapture?.reportChecksumSha256 !== capture.reportChecksumSha256
      || capture.protocol !== "layrs.milestone-adoption.v1") {
    throw new Error("historical adoption provenance mismatch");
  }
  return capture;
};

const REPORT_QUERIES = [
  {
    title: "Private identities and protocol usage",
    source: "Internal DB",
    sql: `WITH identities AS (
  SELECT identity_commitment FROM layrsv2.private_sessions
  UNION SELECT identity_commitment FROM layrsv2.deposit_sessions
  UNION SELECT identity_commitment FROM layrsv2.withdrawals
  UNION SELECT identity_commitment FROM layrsv2.bridge_intents
), usage AS (
  SELECT count(*)::numeric AS count FROM layrsv2.private_sessions
  UNION ALL SELECT count(*)::numeric FROM layrsv2.deposit_sessions
  UNION ALL SELECT count(*)::numeric FROM layrsv2.withdrawals
  UNION ALL SELECT count(*)::numeric FROM layrsv2.audit_fill_artifacts
  UNION ALL SELECT count(*)::numeric FROM layrsv2.private_user_receipt_evidence
)
SELECT
  (SELECT count(*) FROM identities) AS unique_private_user_commitments,
  (SELECT count(*) FROM layrsv2.private_sessions
    WHERE revoked_at IS NULL AND expires_at > now()) AS active_private_sessions,
  (SELECT count(*) FROM layrsv2.private_sessions) AS total_private_sessions,
  coalesce((SELECT sum(count) FROM usage), 0) AS privacy_feature_usage_count;`,
  },
  {
    title: "Confirmed funding",
    source: "Internal DB + pool-confirmed receipts",
    sql: `SELECT session.destination_chain AS chain, session.asset,
       count(*) AS count,
       coalesce(sum(coalesce(
         transfer.destination_amount,
         session.pool_confirmed_amount,
         transfer.source_amount
       )), 0) AS amount_atomic
FROM layrsv2.deposit_transfers transfer
JOIN layrsv2.deposit_sessions session USING (deposit_id)
WHERE transfer.status IN ('POOL_CONFIRMED', 'CREDITED')
GROUP BY session.destination_chain, session.asset;

SELECT chain, asset, count(*) AS count, coalesce(sum(amount), 0) AS amount_atomic
FROM layrsv2.withdrawals
WHERE status IN ('CONFIRMED', 'RELEASED')
GROUP BY chain, asset;`,
  },
  {
    title: "Confirmed trading and settlement evidence",
    source: "Horizen settlement artifacts",
    sql: `SELECT chain, count(*) AS count, count(DISTINCT market_id) AS markets,
       coalesce(sum(quantity), 0) AS quantity_atomic,
       coalesce(sum(quantity * price_micros), 0) AS notional_price_micros_atomic,
       coalesce(sum(fee), 0) AS fee_atomic
FROM layrsv2.audit_fill_artifacts
WHERE audit_status = 'CONFIRMED'
GROUP BY chain;

SELECT
  (SELECT count(*) FROM layrsv2.audit_batches WHERE status = 'CONFIRMED') AS confirmed_audit_batches,
  (SELECT count(*) FROM layrsv2.audit_fill_artifacts WHERE audit_status = 'CONFIRMED') AS confirmed_audit_fills,
  (SELECT count(*) FROM layrsv2.onchain_resolution_transactions
    WHERE status = 'CONFIRMED') AS confirmed_resolution_transactions;`,
  },
  {
    title: "Vault contract interactions",
    source: "Indexed Base/Horizen events",
    sql: `SELECT chain, event_name AS event, count(*) AS count
FROM layrsv2.chain_events
WHERE removed = false
  AND event_name IN ('Deposit', 'Withdraw')
  AND lower(contract_role) LIKE '%vault%'
GROUP BY chain, event_name;`,
  },
];

const td = (value, className) => {
  const cell = document.createElement("td");
  cell.textContent = String(value);
  if (className) cell.className = className;
  return cell;
};

const row = (values) => {
  const element = document.createElement("tr");
  element.append(...values.map(([value, className]) => td(value, className)));
  return element;
};

const formatAtomic = (value, asset) => {
  if (!value || !/^\d+$/.test(String(value))) return "—";
  const decimals = asset === "USDC" ? 6 : asset === "ZEN" ? 18 : null;
  if (decimals === null) return String(value);
  const raw = String(value).padStart(decimals + 1, "0");
  const whole = raw.slice(0, -decimals);
  const fraction = raw.slice(-decimals).replace(/0+$/, "").slice(0, 6);
  return `${whole}${fraction ? `.${fraction}` : ""} ${asset}`;
};

const historicalAdoptionSnapshots = (report, legacySnapshot) => legacySnapshot ? [{
  epochId: LEGACY_ADOPTION_CAPTURE.epochId,
  label: report.epochs.historical.find(({ epochId }) => epochId === LEGACY_ADOPTION_CAPTURE.epochId)?.label,
  snapshot: legacySnapshot,
}] : [];

const unifiedActivityRows = (report, historicalSnapshots) => {
  const values = new Map();
  const add = (key, initial, item) => {
    const current = values.get(key) ?? initial;
    current.count += Number(item.count ?? 0);
    if (item.amountAtomic !== undefined) current.amountAtomic += BigInt(item.amountAtomic);
    if (item.sourceAmountAtomic !== undefined) current.amountAtomic += BigInt(item.sourceAmountAtomic);
    if (item.quantityAtomic !== undefined) current.quantityAtomic += BigInt(item.quantityAtomic);
    if (item.markets !== undefined && Number(item.count) > 0) current.marketCounts.push(Number(item.markets));
    values.set(key, current);
  };
  const ingest = (source) => {
    (source.funding?.deposits ?? []).forEach((item) => add(`deposit:${item.chain}:${item.asset}`,
      { kind: "deposit", chain: item.chain, asset: item.asset, count: 0, amountAtomic: 0n }, item));
    (source.funding?.withdrawals ?? []).forEach((item) => add(`withdrawal:${item.chain}:${item.asset}`,
      { kind: "withdrawal", chain: item.chain, asset: item.asset, count: 0, amountAtomic: 0n }, item));
    (source.funding?.bridges ?? []).forEach((item) => add(`bridge:${item.direction}:${item.status}`,
      { kind: "bridge", direction: item.direction, status: item.status, count: 0, amountAtomic: 0n }, item));
    (source.trading?.fills ?? []).forEach((item) => add(`private fill:${item.chain}`,
      { kind: "private fill", chain: item.chain, count: 0, quantityAtomic: 0n, marketCounts: [] }, item));
    (source.vaults?.events ?? []).forEach((item) => add(`vault:${item.chain}:${item.event}`,
      { kind: `vault ${item.event.toLowerCase()}`, chain: item.chain, count: 0 }, item));
  };
  historicalSnapshots.forEach(({ snapshot }) => ingest(snapshot));
  ingest(report);
  return [...values.values()].map((item) => {
    if (item.kind === "deposit" || item.kind === "withdrawal") return [
      item.kind, item.chain, item.asset, item.count, formatAtomic(item.amountAtomic.toString(), item.asset), "Verified production evidence",
    ];
    if (item.kind === "bridge") return [
      item.kind, item.direction.replaceAll("_", " → "), item.status, item.count,
      formatAtomic(item.amountAtomic.toString(), "ZEN"), "Verified production evidence",
    ];
    if (item.kind === "private fill") {
      const markets = item.marketCounts.length === 1 ? `${item.marketCounts[0]} markets` : "Verified markets";
      return [item.kind, item.chain, markets, item.count,
        `${(Number(item.quantityAtomic) / 1_000_000).toLocaleString("en-US")} contracts`, "Verified production evidence"];
    }
    return [item.kind, item.chain, "LPVault", item.count, "—", "Verified production evidence"];
  });
};

const reportForDownload = (report) => {
  const { qualification: _qualification, methodology = [], epochs: _epochs, lifetime, ...rest } = report;
  return {
    ...rest,
    lifetime: {
      uniquePrivateUserCommitments: lifetime?.uniquePrivateUserCommitments?.exactCombined ?? null,
      additive: lifetime?.additive ?? {},
    },
    methodology: methodology.filter((line) => !/TaskOn|Guardian-qualified/i.test(line)),
    sourceClassification: {
      primary: "Internal PostgreSQL reporting read model",
      chainEvidence: "Confirmed settlement artifacts and indexed Base/Horizen contract events",
      liveRpcScan: false,
    },
  };
};

const toCsv = (report, legacySnapshot) => {
  const rows = [["category", "network", "asset_or_state", "metric", "value"]];
  rows.push(["summary", "", "private_commitments", "unique", report.summary.uniquePrivateUserCommitments]);
  rows.push(["summary", "", "private_sessions", "active", report.summary.activePrivateSessions]);
  rows.push(["summary", "", "private_sessions", "total", report.summary.totalPrivateSessions]);
  rows.push(["summary", "", "privacy_features", "usage_count", report.summary.privacyFeatureUsageCount]);
  rows.push(["summary", "", "private_receipts", "activity_count", report.summary.privateReceiptActivityCount]);
  if (report.lifetime) {
    const unique = report.lifetime.uniquePrivateUserCommitments;
    rows.push(["lifetime", "", "private_commitments", "unique", unique.exactCombined]);
    Object.entries(report.lifetime.additive).forEach(([metric, value]) => rows.push(["lifetime", "", "additive", metric, value]));
  }
  report.identityActivityBuckets.forEach((item) => rows.push(["identity_activity", "", item.bucket, "commitments", item.commitments]));
  unifiedActivityRows(report, historicalAdoptionSnapshots(report, legacySnapshot)).forEach((item) =>
    rows.push(["activity", item[1], item[2], item[0], item[3]], ["activity", item[1], item[2], `${item[0]}_value`, item[4]]));
  rows.push(["report", "", "snapshot", "sha256", report.reportChecksumSha256]);
  return rows.map((values) => values.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
};

const enableDownload = (button, name, type, makeBody) => {
  button.disabled = false;
  button.onclick = () => {
    const href = URL.createObjectURL(new Blob([makeBody()], { type }));
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = name;
    anchor.click();
    URL.revokeObjectURL(href);
  };
};

const render = (report, legacySnapshot) => {
  const lifetimeUnique = report.lifetime?.uniquePrivateUserCommitments;
  const lifetime = report.lifetime?.additive;
  const uniqueLabel = Number.isSafeInteger(lifetimeUnique?.exactCombined)
    ? lifetimeUnique.exactCombined.toLocaleString("en-US")
    : firstNumber(report, ["summary.uniquePrivateUserCommitments"]).toLocaleString("en-US");
  const summaryRows = [
    ["Lifetime unique private commitments", uniqueLabel, "Production lifetime", "Exact deduplicated union of opaque commitments; no wallet or user address disclosed"],
    ["Lifetime privacy-feature interactions", (lifetime?.privacyFeatureUsageCount ?? firstNumber(report, ["summary.privacyFeatureUsageCount"])).toLocaleString("en-US"), "Production lifetime", "Metric-specific lifetime total; financial state is not part of this report"],
    ["Lifetime enclave-signed private commands", (lifetime?.privateReceiptActivityCount ?? firstNumber(report, ["summary.privateReceiptActivityCount"])).toLocaleString("en-US"), "TEE receipt evidence", "User-owned private-command receipts"],
    ["Active private sessions", firstNumber(report, ["summary.activePrivateSessions"]).toLocaleString("en-US"), "Internal DB", "Unrevoked, unexpired attested sessions"],
    ["Lifetime private sessions", (lifetime?.totalPrivateSessions ?? firstNumber(report, ["summary.totalPrivateSessions"])).toLocaleString("en-US"), "Production lifetime", "Attested session starts"],
    ["Lifetime confirmed private fills", (lifetime?.confirmedAuditFills ?? firstNumber(report, ["trading.confirmedAuditFills"])).toLocaleString("en-US"), "Horizen evidence", "Confirmed audit fills"],
    ["Lifetime confirmed resolutions", (lifetime?.confirmedResolutionTransactions ?? firstNumber(report, ["trading.confirmedResolutionTransactions"])).toLocaleString("en-US"), "Horizen evidence", "Confirmed market-resolution transactions"],
  ];
  summary.replaceChildren(...summaryRows.map((values) => row(values.map((value, index) => [value, index === 1 ? "adoption-value" : ""]))));

  const historicalSnapshots = historicalAdoptionSnapshots(report, legacySnapshot);
  const activityRows = unifiedActivityRows(report, historicalSnapshots);
  activity.replaceChildren(...activityRows.map((values) => row(values.map((value, index) => [value, index === 3 ? "adoption-value" : ""]))));

  const bucketRows = report.identityActivityBuckets;
  buckets.replaceChildren(...bucketRows.map((item) => row([
    [`${item.bucket} interactions`, ""],
    [item.commitments.toLocaleString("en-US"), "adoption-value"],
    ["Lifetime aggregate; commitment values withheld", ""],
  ])));

  queries.replaceChildren(...REPORT_QUERIES.map((definition) => {
    const details = document.createElement("details");
    details.className = "adoption-query";
    const heading = document.createElement("summary");
    const title = document.createElement("b");
    title.textContent = definition.title;
    const sourceLabel = document.createElement("span");
    sourceLabel.textContent = definition.source;
    heading.append(title, sourceLabel);
    const pre = document.createElement("pre");
    const code = document.createElement("code");
    code.textContent = definition.sql;
    pre.append(code);
    details.append(heading, pre);
    return details;
  }));

  const timestamp = report.generatedAt ?? report.reportGeneratedAt ?? report.asOf;
  generatedAt.textContent = timestamp
    ? `Generated ${new Date(timestamp).toLocaleString("en-US", { timeZone: "UTC" })} UTC`
    : "Current production report";
  checksum.textContent = report.reportChecksumSha256 ?? "Unavailable";
  status.dataset.state = "ready";

  const downloadable = reportForDownload(report);
  enableDownload(downloadJson, "layrs-adoption.json", "application/json", () => `${JSON.stringify(downloadable, null, 2)}\n`);
  enableDownload(downloadCsv, "layrs-adoption.csv", "text/csv;charset=utf-8", () => `${toCsv(report, legacySnapshot)}\n`);
};

const loadReport = () => fetch(`https://api.layrs.xyz/v1/milestone/adoption?at=${Date.now()}`, {
  headers: { Accept: "application/json" },
  mode: "cors",
  cache: "no-store",
}).then((response) => {
  if (!response.ok) throw new Error(`report returned ${response.status}`);
  return response.json();
}).then(async (report) => render(report, await loadHistoricalAdoption(report))).catch(() => {
  if (!summary.childElementCount) {
    status.dataset.state = "error";
    status.textContent = "The production evidence API is unavailable. No cached figures are shown.";
    generatedAt.textContent = "Live report unavailable";
  }
});

loadReport();
window.setInterval(loadReport, 3 * 60 * 60 * 1000);
