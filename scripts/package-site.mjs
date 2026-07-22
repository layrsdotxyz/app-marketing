import { cp, mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "dist");
const publicFiles = [
  "index.html",
  "styles.css",
  "fonts-inlined.css",
  "site.js",
  "layrs-mark.svg",
  "hero-bg.mp4",
  "robots.txt",
  "sitemap.xml",
  "brand.html",
  "brand.css",
];

// Brand assets ship as a directory so the kit download and the individual files
// resolve from the same place the page references.
const publicDirs = ["brand"];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const file of publicFiles) {
  await cp(path.join(root, file), path.join(output, file));
}

for (const dir of publicDirs) {
  await cp(path.join(root, dir), path.join(output, dir), { recursive: true });
}

process.stdout.write(`Packaged ${publicFiles.length} files and ${publicDirs.length} directory into ${output}\n`);
