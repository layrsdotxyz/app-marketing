import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = await readFile(path.join(root, "index.html"), "utf8");
const css = await readFile(path.join(root, "styles.css"), "utf8");

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
