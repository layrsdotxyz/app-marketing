import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => readFile(path.join(root, relative), "utf8");

const [header, footer, currentHome, deploymentTemplate, registrySource] =
  await Promise.all([
    read("partials/header.html"),
    read("partials/footer.html"),
    read("index.html"),
    read("templates/deployment.html"),
    read("data/deployment-registry.json"),
  ]);

const replaceMarked = (source, start, end, content) => {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end);
  if (startIndex < 0 || endIndex < 0 || endIndex <= startIndex) {
    throw new Error(`missing or invalid shared-layout markers: ${start} / ${end}`);
  }
  return `${source.slice(0, startIndex + start.length)}\n${content.trim()}\n${source.slice(endIndex)}`;
};

let home = replaceMarked(
  currentHome,
  "<!-- LAYRS_SHARED_HEADER_START -->",
  "<!-- LAYRS_SHARED_HEADER_END -->",
  header,
);
home = replaceMarked(
  home,
  "<!-- LAYRS_SHARED_FOOTER_START -->",
  "<!-- LAYRS_SHARED_FOOTER_END -->",
  footer,
);

const registry = JSON.parse(registrySource);
if (registry.schemaVersion !== 1 || !Array.isArray(registry.chains)
    || registry.chains.length !== 2) {
  throw new Error("invalid generated deployment registry");
}
const safeRegistry = JSON.stringify(registry).replaceAll("<", "\\u003c");
const deployment = deploymentTemplate
  .replace("{{LAYRS_SHARED_HEADER}}", header.trim())
  .replace("{{LAYRS_SHARED_FOOTER}}", footer.trim())
  .replace("{{LAYRS_DEPLOYMENT_REGISTRY}}", safeRegistry);

if (deployment.includes("{{LAYRS_")) {
  throw new Error("unresolved deployment-page template marker");
}

await Promise.all([
  writeFile(path.join(root, "index.html"), home),
  writeFile(path.join(root, "deployment.html"), deployment),
]);

process.stdout.write("Rendered shared homepage and deployment page layout.\n");
