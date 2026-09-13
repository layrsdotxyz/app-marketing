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

const ADOPTION_EVIDENCE = {
  epochId: "legacy-through-20260826T101325496Z",
  capturePath: "/adoption-evidence-3fb3d9acbc38762f6e065758705ce22f7895fd449ff6b9ea7f046465c96c4fa7.json",
  captureSha256: "3fb3d9acbc38762f6e065758705ce22f7895fd449ff6b9ea7f046465c96c4fa7",
  manifestPath: "/adoption-evidence-manifest-364caa9727989c1d9bb1d53eb0e0c4b7c734ad69f345e1949f3c2afafcf174c1.json",
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
    fetchBytes(ADOPTION_EVIDENCE.capturePath),
    fetchBytes(ADOPTION_EVIDENCE.manifestPath),
  ]);
  const packagedCapture = new Uint8Array(captureBytes);
  if (packagedCapture.length !== 2932 || packagedCapture.at(-1) !== 0x0a) {
    throw new Error("historical adoption capture packaging mismatch");
  }
  const provenanceCaptureBytes = packagedCapture.slice(0, -1);
  const [captureHash, manifestHash] = await Promise.all([
    sha256Hex(provenanceCaptureBytes),
    sha256Hex(manifestBytes),
  ]);
  if (captureHash !== ADOPTION_EVIDENCE.captureSha256
      || manifestHash !== ADOPTION_EVIDENCE.manifestSha256) {
    throw new Error("historical adoption artifact hash mismatch");
  }
  const capture = JSON.parse(new TextDecoder().decode(provenanceCaptureBytes));
  const manifest = JSON.parse(new TextDecoder().decode(manifestBytes));
  const epoch = report.epochs?.historical?.find(({ epochId }) => epochId === ADOPTION_EVIDENCE.epochId);
  const manifestCapture = manifest.captures?.find(({ name }) => name === "adoption-api-json");
  if (!epoch
      || epoch.manifestSha256 !== `0x${manifestHash}`
      || epoch.manifestObjectKey !== ADOPTION_EVIDENCE.manifestObjectKey
      || epoch.manifestObjectVersionId !== ADOPTION_EVIDENCE.manifestObjectVersionId
      || manifest.epoch?.id !== ADOPTION_EVIDENCE.epochId
      || manifestCapture?.sha256 !== captureHash
      || manifestCapture?.reportChecksumSha256 !== capture.reportChecksumSha256
      || capture.protocol !== "layrs.milestone-adoption.v1") {
    throw new Error("historical adoption provenance mismatch");
  }
  return capture;
};

const REPORT_QUERIES = [
  {
    title: "Current direct-execution epoch adoption",
    source: "Direct-runtime PostgreSQL projection",
    sql: `SELECT
  count(*) AS identities,
  count(DISTINCT auth_subject_hash) AS authenticated_users,
  count(*) FILTER (WHERE admitted_post_genesis) AS post_genesis_admissions
FROM layrsv2.direct_execution_identities
WHERE epoch_id = :sealed_opening_epoch;

SELECT
  count(*) FILTER (WHERE liability > 0) AS funded_identities,
  sum(liability) AS projected_liability_atomic
FROM direct_execution_per_identity_liability;

SELECT count(*) AS verified_wallet_mappings
FROM layrsv2.direct_execution_privy_wallets
WHERE epoch_id = :sealed_opening_epoch;`,
  },
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

const mergeMetricRows = (collections, keyFields, atomicFields = []) => {
  const merged = new Map();
  collections.flat().forEach((item) => {
    const key = keyFields.map((field) => item[field]).join("|");
    const current = merged.get(key) ?? {
      ...Object.fromEntries(keyFields.map((field) => [field, item[field]])),
      count: 0,
      ...Object.fromEntries(atomicFields.map((field) => [field, "0"])),
    };
    current.count += Number(item.count ?? 0);
    atomicFields.forEach((field) => {
      current[field] = (BigInt(current[field]) + BigInt(item[field] ?? "0")).toString();
    });
    merged.set(key, current);
  });
  return [...merged.values()];
};

const buildAdoptionReport = (report, legacySnapshot) => ({
  identityActivityBuckets: report.identityActivityBuckets,
  funding: {
    deposits: mergeMetricRows(
      [legacySnapshot.funding.deposits, report.funding.deposits],
      ["chain", "asset"],
      ["amountAtomic"],
    ),
    withdrawals: mergeMetricRows(
      [legacySnapshot.funding.withdrawals, report.funding.withdrawals],
      ["chain", "asset"],
      ["amountAtomic"],
    ),
    bridges: mergeMetricRows(
      [legacySnapshot.funding.bridges, report.funding.bridges],
      ["direction", "status"],
      ["sourceAmountAtomic"],
    ),
  },
  trading: {
    fills: mergeMetricRows(
      [legacySnapshot.trading.fills, report.trading.fills],
      ["chain"],
      ["quantityAtomic", "notionalPriceMicrosAtomic", "feeAtomic"],
    ),
    confirmedAuditFills: report.lifetime.additive.confirmedAuditFills,
    confirmedAuditBatches: report.lifetime.additive.confirmedAuditBatches,
    confirmedResolutionTransactions: report.lifetime.additive.confirmedResolutionTransactions,
  },
  vaults: {
    events: mergeMetricRows(
      [legacySnapshot.vaults.events, report.vaults.events],
      ["chain", "event"],
    ),
  },
});

const adoptionActivityRows = (source) => [
  ...source.funding.deposits.map((item) => ["Deposit", item.chain, item.asset, item.count, formatAtomic(item.amountAtomic, item.asset), "Signed protocol evidence"]),
  ...source.funding.withdrawals.map((item) => ["Withdrawal", item.chain, item.asset, item.count, formatAtomic(item.amountAtomic, item.asset), "Signed protocol evidence"]),
  ...source.funding.bridges.map((item) => ["Bridge", item.direction.replaceAll("_", " → "), item.status, item.count, formatAtomic(item.sourceAmountAtomic, "ZEN"), "Signed protocol evidence"]),
  ...source.trading.fills.map((item) => ["Private fill", item.chain, "All reported markets", item.count, `${(Number(item.quantityAtomic) / 1_000_000).toLocaleString("en-US")} contracts`, "Confirmed settlement evidence"]),
  ...source.vaults.events.map((item) => [`Vault ${item.event.toLowerCase()}`, item.chain, "LPVault", item.count, "—", "Indexed protocol evidence"]),
];

const reportForDownload = (report, legacySnapshot) => {
  const {
    qualification: _qualification,
    methodology = [],
    funding: _currentFunding,
    trading: _currentTrading,
    vaults: _currentVaults,
    identityActivityBuckets: _currentBuckets,
    summary: currentSummary,
    epochs: _epochs,
    lifetime: _lifetime,
    directExecution,
    ...rest
  } = report;
  const adoptionReport = buildAdoptionReport(report, legacySnapshot);
  return {
    ...rest,
    summary: {
      uniquePrivateUserCommitments: report.lifetime.uniquePrivateUserCommitments.exactCombined,
      activePrivateSessions: currentSummary.activePrivateSessions,
      totalPrivateSessions: report.lifetime.additive.totalPrivateSessions,
      privacyFeatureUsageCount: report.lifetime.additive.privacyFeatureUsageCount,
      privateReceiptActivityCount: report.lifetime.additive.privateReceiptActivityCount,
    },
    ...adoptionReport,
    accounts: {
      identities: directExecution.identities,
      authenticatedUsers: directExecution.authSubjects,
      fundedUsers: directExecution.fundedIdentities,
      authenticationMappings: directExecution.walletMappings,
      projectedLiabilityAtomic: directExecution.projectedLiabilityAtomic,
      receipts: directExecution.receipts,
      orders: directExecution.orders,
      trades: directExecution.trades,
    },
    methodology: methodology.filter((line) => !/TaskOn|Guardian-qualified/i.test(line)),
    evidenceIntegrity: {
      identityMethod: report.lifetime.uniquePrivateUserCommitments.status,
      captureSha256: ADOPTION_EVIDENCE.captureSha256,
      manifestSha256: ADOPTION_EVIDENCE.manifestSha256,
    },
    sourceClassification: {
      primary: "Signed current projection plus immutable historical evidence",
      chainEvidence: "Confirmed settlement artifacts and indexed Base/Horizen contract events",
      liveRpcScan: false,
    },
  };
};

const toCsv = (report) => {
  const rows = [["category", "network", "asset_or_state", "metric", "value"]];
  rows.push(["summary", "", "private_commitments", "unique", report.summary.uniquePrivateUserCommitments]);
  rows.push(["summary", "", "private_sessions", "active", report.summary.activePrivateSessions]);
  rows.push(["summary", "", "private_sessions", "total", report.summary.totalPrivateSessions]);
  rows.push(["summary", "", "privacy_features", "usage_count", report.summary.privacyFeatureUsageCount]);
  rows.push(["summary", "", "private_receipts", "activity_count", report.summary.privateReceiptActivityCount]);
  if (report.accounts) {
    Object.entries(report.accounts).forEach(([metric, value]) => {
      rows.push(["accounts", "", "verified", metric, value]);
    });
  }
  report.identityActivityBuckets.forEach((item) => rows.push(["identity_activity", "", item.bucket, "commitments", item.commitments]));
  report.funding.deposits.forEach((item) => rows.push(["deposit", item.chain, item.asset, "count", item.count], ["deposit", item.chain, item.asset, "amount_atomic", item.amountAtomic]));
  report.funding.withdrawals.forEach((item) => rows.push(["withdrawal", item.chain, item.asset, "count", item.count], ["withdrawal", item.chain, item.asset, "amount_atomic", item.amountAtomic]));
  report.funding.bridges.forEach((item) => rows.push(["bridge", item.direction, item.status, "count", item.count], ["bridge", item.direction, item.status, "source_amount_atomic", item.sourceAmountAtomic]));
  report.trading.fills.forEach((item) => rows.push(["trade", item.chain, "confirmed_fills", "count", item.count]));
  report.vaults.events.forEach((item) => rows.push(["vault", item.chain, item.event, "count", item.count]));
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
  const adoptionReport = buildAdoptionReport(report, legacySnapshot);
  const uniqueLabel = lifetimeUnique
    ? lifetimeUnique.exactCombined.toLocaleString("en-US")
    : firstNumber(report, ["summary.uniquePrivateUserCommitments"]).toLocaleString("en-US");
  const summaryRows = [
    ["Unique private commitments", uniqueLabel, "Verified protocol report", lifetimeUnique ? "Privacy-safe exact count; no wallet or address is disclosed" : "Distinct opaque commitments across protocol records"],
    ["Private sessions", (lifetime?.totalPrivateSessions ?? 0).toLocaleString("en-US"), "Verified protocol report", "All attested session starts"],
    ["Privacy-feature interactions", (lifetime?.privacyFeatureUsageCount ?? 0).toLocaleString("en-US"), "Verified protocol report", "Protocol activity under the existing metric definition"],
    ["Enclave-signed private commands", (lifetime?.privateReceiptActivityCount ?? 0).toLocaleString("en-US"), "TEE evidence", "User-owned terminal receipt activity"],
    ["Deposits / withdrawals / bridges", `${(lifetime?.deposits ?? 0).toLocaleString("en-US")} / ${(lifetime?.withdrawals ?? 0).toLocaleString("en-US")} / ${(lifetime?.bridges ?? 0).toLocaleString("en-US")}`, "Funding evidence", "Confirmed and recorded activity counts"],
    ["Private fills / audit batches / resolutions", `${(lifetime?.confirmedAuditFills ?? 0).toLocaleString("en-US")} / ${(lifetime?.confirmedAuditBatches ?? 0).toLocaleString("en-US")} / ${(lifetime?.confirmedResolutionTransactions ?? 0).toLocaleString("en-US")}`, "Settlement evidence", "Confirmed settlement artifacts"],
    ["Authenticated accounts", firstNumber(report, ["directExecution.authSubjects"]).toLocaleString("en-US"), "Verified account registry", "Distinct canonical authentication subjects"],
    ["Funded customer accounts", firstNumber(report, ["directExecution.fundedIdentities"]).toLocaleString("en-US"), "Signed balance projection", "Accounts whose projected liability is greater than zero"],
    ["Verified authentication mappings", firstNumber(report, ["directExecution.walletMappings"]).toLocaleString("en-US"), "Privy authentication projection", "Authentication-only mappings; not deposit or withdrawal destinations"],
    ["Projected USDC liability", formatAtomic(report.directExecution?.projectedLiabilityAtomic, "USDC"), "Signed balance projection", "Reporting projection only; encrypted enclave state remains authoritative"],
    ["Direct receipts / orders / trades", `${firstNumber(report, ["directExecution.receipts"]).toLocaleString("en-US")} / ${firstNumber(report, ["directExecution.orders"]).toLocaleString("en-US")} / ${firstNumber(report, ["directExecution.trades"]).toLocaleString("en-US")}`, "Direct execution evidence", "Exactly-once terminal receipts and native CLOB events"],
  ];
  summary.replaceChildren(...summaryRows.map((values) => row(values.map((value, index) => [value, index === 1 ? "adoption-value" : ""]))));

  const activityRows = adoptionActivityRows(adoptionReport);
  activity.replaceChildren(...activityRows.map((values) => row(values.map((value, index) => [value, index === 3 ? "adoption-value" : ""]))));

  buckets.replaceChildren(...adoptionReport.identityActivityBuckets.map((item) => row([
    [`${item.bucket} interactions`, ""],
    [item.commitments.toLocaleString("en-US"), "adoption-value"],
    ["Aggregate only; commitment values withheld", ""],
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

  const downloadable = reportForDownload(report, legacySnapshot);
  enableDownload(downloadJson, "layrs-adoption.json", "application/json", () => `${JSON.stringify(downloadable, null, 2)}\n`);
  enableDownload(downloadCsv, "layrs-adoption.csv", "text/csv;charset=utf-8", () => `${toCsv(downloadable)}\n`);
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
