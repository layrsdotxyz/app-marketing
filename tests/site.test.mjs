import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [html, css, deployment, deploymentScript, adoption, demo, publishScript, header, footer, registry] = await Promise.all([
  readFile(path.join(root, "index.html"), "utf8"),
  readFile(path.join(root, "styles.css"), "utf8"),
  readFile(path.join(root, "deployment.html"), "utf8"),
  readFile(path.join(root, "deployment.js"), "utf8"),
  readFile(path.join(root, "adoption.html"), "utf8"),
  readFile(path.join(root, "demo.html"), "utf8"),
  readFile(path.join(root, "deployment", "publish-static-release.sh"), "utf8"),
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
});

test("publishes privacy-preserving adoption evidence and a captioned demo", () => {
  assert.match(adoption, /Qualification methodology/);
  assert.match(adoption, /Download JSON/);
  assert.match(adoption, /identity-to-position/);
  assert.match(demo, /kind="captions"/);
  assert.match(demo, /RISC Zero proof/);
  assert.match(demo, /zkVerify verification/);
});
