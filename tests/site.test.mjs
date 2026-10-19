import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [html, css, siteScript, deployment, deploymentScript, adoption, adoptionScript, legacyAdoption, legacyAdoptionManifest, demo, publishScript, rollbackScript, pipeline, packageScript, header, footer, registry] = await Promise.all([
  readFile(path.join(root, "index.html"), "utf8"),
  readFile(path.join(root, "styles.css"), "utf8"),
  readFile(path.join(root, "site.js"), "utf8"),
  readFile(path.join(root, "deployment.html"), "utf8"),
  readFile(path.join(root, "deployment.js"), "utf8"),
  readFile(path.join(root, "adoption.html"), "utf8"),
  readFile(path.join(root, "adoption.js"), "utf8"),
  readFile(path.join(root, "adoption-evidence-3fb3d9acbc38762f6e065758705ce22f7895fd449ff6b9ea7f046465c96c4fa7.json")),
  readFile(path.join(root, "adoption-evidence-manifest-364caa9727989c1d9bb1d53eb0e0c4b7c734ad69f345e1949f3c2afafcf174c1.json")),
  readFile(path.join(root, "demo.html"), "utf8"),
  readFile(path.join(root, "deployment", "publish-static-release.sh"), "utf8"),
  readFile(path.join(root, "deployment", "gitlab-rollback-static.sh"), "utf8"),
  readFile(path.join(root, ".gitlab-ci.yml"), "utf8"),
  readFile(path.join(root, "scripts", "package-site.mjs"), "utf8"),
  readFile(path.join(root, "partials", "header.html"), "utf8"),
  readFile(path.join(root, "partials", "footer.html"), "utf8"),
  readFile(path.join(root, "data", "deployment-registry.json"), "utf8").then(JSON.parse),
]);

test("publishes one document without a client-side router", () => {
  assert.equal((html.match(/<!doctype html>/gi) ?? []).length, 1);
  assert.doesNotMatch(html, /next\/|react|router/i);
});

test("plays a self-hosted, muted hero video without blocking reduced-motion users", () => {
  assert.match(html, /<video class="hero-video" autoplay muted loop playsinline/);
  assert.match(html, /<source src="hero-bg\.mp4" type="video\/mp4">/);
  assert.match(css, /prefers-reduced-motion:reduce[\s\S]*\.hero-video\{display:none;\}/);
});

test("keeps the original hero intact inside a full-bleed accessible carousel", () => {
  assert.match(html, /class="hero-stage" data-hero-carousel/);
  assert.match(html, /class="hero-slide hero-slide-primary is-active"/);
  assert.match(html, /class="hero-slide hero-slide-vaults"/);
  assert.match(html, /Built on[\s\S]*horizen-logo-yellow\.svg[\s\S]*Vault/);
  assert.match(css, /\.hero-stage\{[\s\S]*width:100%/);
  assert.match(css, /\.hero-slide\{[\s\S]*position:absolute;inset:0/);
  assert.match(css, /\.hero-slide\.is-active\{[\s\S]*position:relative/);
  assert.match(css, /\.hero\{[\s\S]*min-height:clamp\(650px/);
  assert.doesNotMatch(css, /\.vault-hero\{[^}]*min-height/);
  assert.match(siteScript, /prefers-reduced-motion: reduce/);
  assert.match(siteScript, /setAttribute\("aria-hidden"/);
});

test("keeps the vault slide theme-aware and renders a truthful live market tape", () => {
  assert.match(css, /\.hero-slide-vaults\{[\s\S]*var\(--paper\)[\s\S]*var\(--board\)/);
  assert.match(css, /\.vault-node\{[\s\S]*var\(--paper\)/);
  assert.match(html, /data-live-market-ticker/);
  assert.match(html, /data-market-ticker-status aria-live="polite"/);
  assert.doesNotMatch(html, /BTC &gt; \$120,000|Fed cuts at the next meeting|ZK rollup TVL doubles/);
  assert.match(siteScript, /https:\/\/api\.layrs\.xyz\/v1\/markets/);
  assert.match(siteScript, /upProbabilityMillionths/);
  assert.match(siteScript, /TICKER_REFRESH_MS = 30_000/);
  assert.match(siteScript, /Live market tape temporarily unavailable/);
});

test("keeps redaction keyboard accessible", () => {
  assert.match(html, /<button class="redact" type="button">/);
  assert.match(css, /\.redact:hover \.bar,\s*\.redact:focus-visible \.bar/);
});

test("keeps marker and scoped footer selectors", () => {
  assert.match(css, /\.mark\{[\s\S]*box-decoration-break:clone/);
  assert.match(css, /:root:not\(\[data-theme="light"\]\) \.brand svg\{fill:var\(--yellow\);\}/);
  assert.match(css, /:root\[data-theme="dark"\] \.brand svg\{fill:var\(--yellow\);\}/);
  assert.match(css, /\.foot-grid nav a\{/);
  assert.doesNotMatch(css, /(?:^|\})\s*\.foot-grid a\{/m);
});

test("contains no legacy product names or placeholder links", () => {
  assert.doesNotMatch(html, /predifi|hedera|hcs/i);
  assert.doesNotMatch(html, /href=["']#["']/i);
});

test("uses one canonical shared header and footer on both public pages", () => {
  for (const page of [html, deployment, adoption, demo]) {
    assert.match(page, new RegExp(header.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(page, new RegExp(footer.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(footer, /docs\.layrs\.xyz\/threat-model">Security/);
  assert.match(footer, /docs\.layrs\.xyz\/api">API reference/);
  assert.doesNotMatch(footer, /docs\.layrs\.xyz\/(security|sdk|community|updates)"/);
  assert.match(footer, /href="\/deployment">Deployment/);
  assert.match(footer, /href="https:\/\/x\.com\/layrslab">X \/ Twitter/);
  assert.doesNotMatch(footer, /layrsprotocol/i);
  assert.doesNotMatch(footer, /\/attestation/);
});

test("publishes only Horizen contracts while preserving source deployment records", () => {
  assert.equal(registry.provenance.repository, "layrsdotxyz/horizen-deployment");
  assert.equal(registry.schemaVersion, 2);
  assert.deepEqual(registry.chains.map(({ key }) => key), ["horizen", "base"]);
  assert.equal(registry.chains[0].explorer, "https://explorer.horizen.io/address/");
  assert.equal(registry.chains[1].explorer, "https://basescan.org/address/");
  assert.equal(registry.chains[0].core.matchSettlement.proxy, "0x406716f6ca3578715622250c47efb88728b98beb");
  assert.equal(registry.chains[0].core.adminOracle.proxy, "0x0237dfce14d1d66ca58948a6273e400cb3f00976");
  assert.equal(registry.chains[1].core.matchSettlement.proxy, "0xbc07a1b88b403db43a79809c615cdb26f20f12a8");
  assert.equal(registry.chains[1].core.adminOracle.proxy, "0xf5835af406473dc5a100605ea162781e9daf5abc");
  assert.match(deployment, /Every address,[\s\S]*verifiable[\s\S]*on-chain/);
  const embedded = JSON.parse(deployment.match(/<script id="deployment-registry-data" type="application\/json">([^<]+)<\/script>/)[1]);
  assert.deepEqual(embedded.chains.map(({ key }) => key), ["horizen"]);
  assert.ok(embedded.proofs.every(({ chain }) => chain === "horizen"));
  assert.deepEqual(embedded.chains[0], registry.chains[0]);
  assert.doesNotMatch(deployment, /basescan\.org|Horizen and Base|Horizen · Base/);
  assert.match(deployment, /Network <b>Horizen Mainnet<\/b>/);
  assert.match(deployment, /name="base:app_id" content="6a600856078f6baf9ef300da"/);
});

test("deployment interactions are keyboard and mobile accessible", () => {
  assert.match(deploymentScript, /aria-expanded/);
  assert.match(deploymentScript, /navigator\.clipboard\.writeText/);
  assert.match(deploymentScript, /app\.layrs\.xyz\/privacy/);
  assert.match(deploymentScript, /github\.com\/layrsdotxyz\/horizen-deployment/);
  assert.match(deploymentScript, /Runtime status/);
  assert.match(deploymentScript, /Publication status is independent/);
});

test("publishes extensionless evidence routes through the normal release path", () => {
  assert.match(publishScript, /current\/\$route"/);
  assert.match(publishScript, /content-type 'text\/html; charset=utf-8'/);
  assert.match(publishScript, /'\/deployment'/);
  assert.match(publishScript, /for route in deployment demo adoption/);
  assert.match(publishScript, /'\/demo'/);
  assert.match(publishScript, /'\/adoption'/);
  assert.match(publishScript, /'\/adoption\.js'/);
  assert.match(packageScript, /\["adoption\.html", "adoption\.js"\]/);
  assert.match(packageScript, /\["deployment\.html", "deployment\.js"\]/);
  assert.match(packageScript, /page\.replace\(sourceReference, `src="\/\$\{versionedName\}"`\)/);
  assert.match(packageScript, /\["styles\.css", "site\.js"\]/);
  assert.match(packageScript, /versionedName/);
  assert.doesNotMatch(publishScript, /current\/"[\s\S]{0,120}--delete/);
});

test("binds production marketing publication and rollback to the live Layrs account", () => {
  const expectedRole = "arn:aws:iam::082223548516:role/layrs-production-marketing-deploy";
  const expectedBucket = "layrs-082223548516-us-east-1-production-marketing";
  const expectedDistribution = "E950OG28C4DYF";
  assert.equal((pipeline.match(new RegExp(expectedRole, "g")) ?? []).length, 2);
  assert.equal((pipeline.match(new RegExp(expectedBucket, "g")) ?? []).length, 2);
  assert.equal((pipeline.match(new RegExp(expectedDistribution, "g")) ?? []).length, 2);
  assert.match(publishScript, /arn:aws:sts::082223548516:assumed-role\/layrs-production-marketing-deploy\/\*/);
  assert.match(publishScript, /layrs-082223548516-us-east-1-production-marketing/);
  assert.match(rollbackScript, /layrs-082223548516-us-east-1-production-marketing/);
  for (const controlled of [pipeline, publishScript, rollbackScript]) {
    assert.doesNotMatch(controlled, /255638996474|layrsv2-255638996474|E2AW6DQEDS3UQ/);
  }
});

test("publishes the verified campaign snapshot and preserves the existing demo", async () => {
  const campaign = JSON.parse(await readFile(path.join(root, "data/adoption-campaign.json"), "utf8"));
  assert.equal(campaign.participants, 392);
  assert.equal(campaign.participantDepositWallets, 392);
  assert.equal(campaign.successfulDeposits, 402);
  assert.equal(campaign.executedTrades, 750);
  assert.equal(campaign.deliveredWithdrawals, 399);
  assert.equal(campaign.uniqueSignedReceipts, 1470);
  assert.equal(campaign.tradesWithBothPublicationsVerified, campaign.executedTrades);
  assert.equal(campaign.startUtc, "2026-10-16T18:31:00.000Z");
  assert.equal(campaign.cutoffUtc, "2026-10-19T17:49:40.571Z");
  assert.match(adoption, /Fixed campaign snapshot, not a live feed/);




  assert.match(adoption, /do not independently certify enclave runtime attestation/);
  assert.match(adoptionScript, /Number\.isSafeInteger/);
  assert.match(adoption, /Download summary JSON/);
  assert.match(adoption, /Download summary CSV/);
  assert.doesNotMatch(adoption, /quicksight\.aws|taskon\/|participants\.csv/);
  assert.doesNotMatch(adoptionScript, /fetch\(|setInterval|milestone\/adoption|innerHTML/);
  for (const source of [adoption, adoptionScript, JSON.stringify(registry)]) {
    assert.doesNotMatch(source, /Sep 4|September 4|quest window|3,853 historical|202 historical|12 historical/);
    assert.doesNotMatch(source, /no receipt batches are currently published/);
  }
  assert.equal(registry.proofs.find(p => p.name === "LayrsTeeReceiptRegistry").enabled, true);
  assert.equal(registry.chains[0].pools[0].pool.proxy, "0xb412f63299ccff4fe57714ee580895cca74dd284");
  assert.equal(registry.chains[0].pools[0].vault, null);
  assert.match(deploymentScript, /if \(pool\.vault\)/);
  assert.match(demo, /kind="captions"/);
  assert.match(demo, /RISC Zero proof/);
  assert.match(demo, /zkVerify verification/);
  assert.equal(createHash("sha256").update(legacyAdoption.subarray(0, -1)).digest("hex"), "3fb3d9acbc38762f6e065758705ce22f7895fd449ff6b9ea7f046465c96c4fa7");
  assert.equal(createHash("sha256").update(legacyAdoptionManifest).digest("hex"), "364caa9727989c1d9bb1d53eb0e0c4b7c734ad69f345e1949f3c2afafcf174c1");
});
