import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [html, css, script] = await Promise.all([
  readFile(path.join(root, "index.html"), "utf8"),
  readFile(path.join(root, "styles.css"), "utf8"),
  readFile(path.join(root, "site.js"), "utf8"),
]);

const failures = [];
const requireText = (source, needle, description) => {
  if (!source.includes(needle)) failures.push(`Missing ${description}: ${needle}`);
};
const rejectText = (source, pattern, description) => {
  if (pattern.test(source)) failures.push(`Disallowed ${description}: ${pattern}`);
};

requireText(html, '<button class="redact" type="button">', "semantic redaction button");
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

if (failures.length > 0) {
  process.stderr.write(`${failures.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write("Static landing invariants validated.\n");
}
