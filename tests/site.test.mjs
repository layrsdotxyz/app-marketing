import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [html, css, siteScript, deployment, deploymentScript, adoption, demo, publishScript, packageScript, header, footer, registry] = await Promise.all([
  readFile(path.join(root, "index.html"), "utf8"),
  readFile(path.join(root, "styles.css"), "utf8"),
  readFile(path.join(root, "site.js"), "utf8"),
  readFile(path.join(root, "deployment.html"), "utf8"),
  readFile(path.join(root, "deployment.js"), "utf8"),
  readFile(path.join(root, "adoption.html"), "utf8"),
  readFile(path.join(root, "demo.html"), "utf8"),
  readFile(path.join(root, "deployment", "publish-static-release.sh"), "utf8"),
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
  assert.match(footer, /docs\.layrs\.xyz\/security">Security/);
  assert.match(footer, /href="\/deployment">Deployment/);
  assert.doesNotMatch(footer, /\/attestation/);
});

test("publishes a manifest-generated Horizen-first deployment registry", () => {
  assert.equal(registry.provenance.repository, "layrsHQ/app-smart-contracts");
  assert.deepEqual(registry.chains.map(({ key }) => key), ["horizen", "base"]);
  assert.equal(registry.chains[0].explorer, "https://horizen.calderaexplorer.xyz/address/");
  assert.equal(registry.chains[1].explorer, "https://basescan.org/address/");
  assert.match(deployment, /Every address,[\s\S]*verifiable[\s\S]*on-chain/);
  assert.match(deployment, /name="base:app_id" content="6a600856078f6baf9ef300da"/);
});

test("deployment interactions are keyboard and mobile accessible", () => {
  assert.match(deploymentScript, /aria-expanded/);
  assert.match(deploymentScript, /navigator\.clipboard\.writeText/);
  assert.match(deploymentScript, /app\.layrs\.xyz\/privacy/);
  assert.match(deploymentScript, /github\.com\/layrsHQ\/privacy-evidence/);
  assert.match(deploymentScript, /zkverify\.subscan\.io\/extrinsic/);
  assert.match(deploymentScript, /Pyth signatures, CLOB matching, payouts, fees, bridges and TEE integrity are not claimed/);
});

test("publishes extensionless evidence routes through the normal release path", () => {
  assert.match(publishScript, /current\/\$route"/);
  assert.match(publishScript, /content-type 'text\/html; charset=utf-8'/);
  assert.match(publishScript, /'\/deployment'/);
  assert.match(publishScript, /for route in deployment demo adoption/);
  assert.match(publishScript, /'\/demo'/);
  assert.match(publishScript, /'\/adoption'/);
  assert.match(publishScript, /'\/adoption\.js'/);
  assert.match(packageScript, /adoption\.\$\{adoptionScriptHash\}\.js/);
  assert.match(packageScript, /replace\('src="\/adoption\.js"'/);
});

test("publishes privacy-preserving adoption evidence and a captioned demo", () => {
  assert.match(adoption, /Protocol activity/);
  assert.match(adoption, /Activity per private commitment/);
  assert.match(adoption, /SQL used by this report/);
  assert.match(adoption, /dune\.com\/queries\/8146290/);
  assert.doesNotMatch(adoption, /TaskOn reconciliation/);
  assert.match(adoption, /Download JSON/);
  assert.match(adoption, /no address output/);
  assert.match(demo, /kind="captions"/);
  assert.match(demo, /RISC Zero proof/);
  assert.match(demo, /zkVerify verification/);
});
