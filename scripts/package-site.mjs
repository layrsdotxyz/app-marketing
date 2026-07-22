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
  "robots.txt",
  "sitemap.xml",
];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const file of publicFiles) {
  await cp(path.join(root, file), path.join(output, file));
}

process.stdout.write(`Packaged ${publicFiles.length} files into ${output}\n`);
