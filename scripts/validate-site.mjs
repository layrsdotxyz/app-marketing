import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [html, css, script, deployment, deploymentCss, deploymentScript, adoption, adoptionScript, demo, header, footer, registrySource] = await Promise.all([
  readFile(path.join(root, "index.html"), "utf8"),
  readFile(path.join(root, "styles.css"), "utf8"),
  readFile(path.join(root, "site.js"), "utf8"),
  readFile(path.join(root, "deployment.html"), "utf8"),
  readFile(path.join(root, "deployment.css"), "utf8"),
  readFile(path.join(root, "deployment.js"), "utf8"),
  readFile(path.join(root, "adoption.html"), "utf8"),
  readFile(path.join(root, "adoption.js"), "utf8"),
  readFile(path.join(root, "demo.html"), "utf8"),
  readFile(path.join(root, "partials", "header.html"), "utf8"),
  readFile(path.join(root, "partials", "footer.html"), "utf8"),
  readFile(path.join(root, "data", "deployment-registry.json"), "utf8"),
]);

const failures = [];
const requireText = (source, needle, description) => {
  if (!source.includes(needle)) failures.push(`Missing ${description}: ${needle}`);
};
const rejectText = (source, pattern, description) => {
  if (pattern.test(source)) failures.push(`Disallowed ${description}: ${pattern}`);
};
const markedContent = (source, start, end) => {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end);
  if (startIndex < 0 || endIndex <= startIndex) return null;
  return source.slice(startIndex + start.length, endIndex).trim();
};

requireText(html, '<button class="redact" type="button">', "semantic redaction button");
requireText(html, '<video class="hero-video" autoplay muted loop playsinline', "muted autoplay hero video");
requireText(html, '<source src="hero-bg.mp4" type="video/mp4">', "self-hosted hero video source");
requireText(css, "box-decoration-break:clone", "per-line marker stroke");
requireText(css, ".foot-grid nav a", "scoped footer selector");
requireText(css, "@media (prefers-reduced-motion:reduce)", "reduced-motion behavior");
requireText(css, ':root[data-theme="dark"]', "explicit dark theme");
requireText(css, ':root[data-theme="light"]', "explicit light theme");
requireText(script, 'querySelector(".redact")', "redaction interaction");
requireText(html, 'href="https://app.layrs.xyz"', "dedicated trading origin");
requireText(html, 'href="https://vaults.layrs.xyz"', "dedicated vault origin");
requireText(html, 'href="https://docs.layrs.xyz', "dedicated documentation origin");

rejectText(html, /<style\b/i, "inline style block");
rejectText(html, /\sstyle=/i, "inline style attribute");
rejectText(html, /<script(?![^>]*\bsrc=)/i, "inline script");
rejectText(html, /predifi|hedera|hcs/i, "legacy product reference");
rejectText(html, /api\.fontshare|fonts\.googleapis|fonts\.gstatic/i, "third-party font request");
rejectText(html, /href=["']#["']/i, "empty fragment link");

const headerStart = "<!-- LAYRS_SHARED_HEADER_START -->";
const headerEnd = "<!-- LAYRS_SHARED_HEADER_END -->";
const footerStart = "<!-- LAYRS_SHARED_FOOTER_START -->";
const footerEnd = "<!-- LAYRS_SHARED_FOOTER_END -->";
if ([html, deployment, adoption, demo].some((page) =>
  markedContent(page, headerStart, headerEnd) !== header.trim())) {
  failures.push("All public pages must use the canonical shared header partial");
}
if ([html, deployment, adoption, demo].some((page) =>
  markedContent(page, footerStart, footerEnd) !== footer.trim())) {
  failures.push("All public pages must use the canonical shared footer partial");
}

requireText(footer, '<a href="https://docs.layrs.xyz/threat-model">Security</a>', "working Security footer link");
rejectText(footer, /docs\.layrs\.xyz\/(security|sdk|community|updates)["']/, "broken historical footer links");
requireText(footer, '<a href="/deployment">Deployment</a>', "Deployment footer link");
requireText(footer, '<a href="https://x.com/layrslab">X / Twitter</a>', "canonical X account link");
rejectText(footer, /layrsprotocol/i, "retired X account reference");
rejectText(footer, /docs\.layrs\.xyz\/attestation/i, "separate Attestation footer link");

requireText(deployment, '<link rel="canonical" href="https://layrs.xyz/deployment">', "deployment canonical URL");
requireText(deployment, '<meta name="base:app_id" content="6a600856078f6baf9ef300da">', "Base app metadata");
requireText(deployment, 'Every address, <span class="deployment-redact">verifiable</span> on-chain.', "deployment title");
requireText(deployment, 'id="deployment-registry-data" type="application/json"', "embedded generated registry");
requireText(deploymentCss, ".know-more[data-open=\"true\"]", "mobile tooltip state");
requireText(deploymentScript, "navigator.clipboard.writeText", "copy-to-clipboard behavior");
requireText(deploymentScript, "app.layrs.xyz/privacy", "live enclave verification link");
requireText(deploymentScript, "github.com/layrsdotxyz/app-smart-contracts", "public privacy evidence repository");
requireText(deploymentScript, "Runtime status", "truthful proof runtime status");
requireText(deploymentScript, "Publication status is independent", "proof scope boundary");
requireText(adoption, 'rel="canonical" href="https://layrs.xyz/adoption"', "adoption canonical URL");
requireText(adoption, "Protocol activity", "adoption activity summary");
requireText(adoption, "Fixed campaign snapshot, not a live feed", "explicit snapshot scope");



requireText(adoption, "Download summary JSON", "aggregate summary download");
rejectText(adoption, /quicksight\.aws|taskon\/|participants\.csv/, "public exposure of reviewer download links");
requireText(adoptionScript, "campaign-evidence-data", "packaged evidence data");
requireText(adoptionScript, "Number.isSafeInteger", "fail-closed count validation");
rejectText(adoption, /Sep 4|September 4|quest window/, "obsolete historical window commentary");
rejectText(adoptionScript, /fetch\(|setInterval|innerHTML/, "network polling or unsafe HTML rendering");
requireText(demo, 'rel="canonical" href="https://layrs.xyz/demo"', "demo canonical URL");
requireText(demo, '<track default kind="captions"', "default demo captions");
requireText(demo, "RISC Zero proof", "demo ZK coverage");
rejectText(adoption, /\sstyle=/i, "adoption inline style attribute");
rejectText(demo, /\sstyle=/i, "demo inline style attribute");
rejectText(deployment, /\sstyle=/i, "deployment inline style attribute");
rejectText(deployment, /<script(?![^>]*(?:\bsrc=|\btype=["']application\/json["']))/i, "deployment inline executable script");

const registry = JSON.parse(registrySource);
if (registry.schemaVersion !== 2 || registry.provenance?.repository !== "layrsdotxyz/app-smart-contracts") {
  failures.push("Deployment registry lacks active-production provenance");
}
if (registry.chains?.map((chain) => chain.key).join(",") !== "horizen,base") {
  failures.push("Deployment registry must render Horizen before Base");
}
for (const chain of registry.chains ?? []) {
  const expectedExplorer = chain.key === "horizen"
    ? "https://explorer.horizen.io/address/"
    : "https://basescan.org/address/";
  if (chain.explorer !== expectedExplorer) failures.push(`Invalid ${chain.key} explorer`);
}
const registryAddresses = JSON.stringify(registry).match(/0x[0-9a-fA-F]{40}/g) ?? [];
if (registryAddresses.length < 16 || registryAddresses.some((address) => !/^0x[0-9a-fA-F]{40}$/.test(address))) {
  failures.push("Deployment registry is missing validated active-production addresses");
}

if (failures.length > 0) {
  process.stderr.write(`${failures.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write("Static landing invariants validated.\n");
}
