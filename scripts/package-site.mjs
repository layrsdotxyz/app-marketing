import { createHash } from "node:crypto";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
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
  "deployment.html",
  "deployment.css",
  "deployment.js",
  "adoption.html",
  "demo.html",
  "evidence.css",
  "adoption.js",
];

// Brand assets ship as a directory so the kit download and the individual files
// resolve from the same place the page references.
const publicDirs = ["brand", "media"];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const file of publicFiles) {
  await cp(path.join(root, file), path.join(output, file));
}

const adoptionScript = await readFile(path.join(root, "adoption.js"));
const adoptionScriptHash = createHash("sha256").update(adoptionScript).digest("hex").slice(0, 16);
const adoptionScriptName = `adoption.${adoptionScriptHash}.js`;
await writeFile(path.join(output, adoptionScriptName), adoptionScript);
const adoptionPage = await readFile(path.join(output, "adoption.html"), "utf8");
if (!adoptionPage.includes('src="/adoption.js"')) {
  throw new Error("adoption page is missing its unversioned source script");
}
await writeFile(
  path.join(output, "adoption.html"),
  adoptionPage.replace('src="/adoption.js"', `src="/${adoptionScriptName}"`),
);

// The mutable /current release is updated before CloudFront invalidation has
// necessarily reached every edge. Content-address the shared homepage assets
// so fresh HTML can never be paired with an older stylesheet or script during
// that propagation window.
const sharedAssets = await Promise.all(
  ["styles.css", "site.js"].map(async (file) => {
    const contents = await readFile(path.join(root, file));
    const hash = createHash("sha256").update(contents).digest("hex").slice(0, 16);
    const extension = path.extname(file);
    const name = `${path.basename(file, extension)}.${hash}${extension}`;
    await writeFile(path.join(output, name), contents);
    return [file, name];
  }),
);

for (const pageName of ["index.html", "deployment.html", "adoption.html", "demo.html", "brand.html"]) {
  const pagePath = path.join(output, pageName);
  let page = await readFile(pagePath, "utf8");
  for (const [sourceName, versionedName] of sharedAssets) {
    page = page
      .replaceAll(`href="/${sourceName}"`, `href="/${versionedName}"`)
      .replaceAll(`href="${sourceName}"`, `href="/${versionedName}"`)
      .replaceAll(`src="/${sourceName}"`, `src="/${versionedName}"`)
      .replaceAll(`src="${sourceName}"`, `src="/${versionedName}"`);
  }
  await writeFile(pagePath, page);
}

for (const dir of publicDirs) {
  await cp(path.join(root, dir), path.join(output, dir), { recursive: true });
}

process.stdout.write(
  `Packaged ${publicFiles.length} files, ${adoptionScriptName}, ${sharedAssets.map(([, name]) => name).join(", ")} and ${publicDirs.length} directories into ${output}\n`,
);
