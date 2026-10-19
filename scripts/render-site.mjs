import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => readFile(path.join(root, relative), "utf8");

const [header, footer, currentHome, deploymentTemplate, adoptionTemplate, demoTemplate, registrySource] =
  await Promise.all([
    read("partials/header.html"),
    read("partials/footer.html"),
    read("index.html"),
    read("templates/deployment.html"),
    read("templates/adoption.html"),
    read("templates/demo.html"),
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
if (registry.schemaVersion !== 2 || !Array.isArray(registry.chains)
    || registry.chains.length !== 2) {
  throw new Error("invalid generated deployment registry");
}
// The public submission page is Horizen-only; retain other deployment records
// in the source registry without embedding them in the public page.
const pageRegistry = {
  ...registry,
  provenance: {
    ...registry.provenance,
    note: "Horizen bytecode and proxy implementations checked on-chain. Source verification is labelled only where independently confirmed from the explorer; no blanket role certification is claimed. Runtime labels distinguish current publication from other deployed contracts.",
  },
  chains: registry.chains.filter(({ key }) => key === "horizen"),
  proofs: registry.proofs.filter(({ chain }) => chain === "horizen"),
};
const safeRegistry = JSON.stringify(pageRegistry).replaceAll("<", "\\u003c");
const campaign = JSON.parse(await read("data/adoption-campaign.json"));
const safeCampaign = JSON.stringify(campaign).replaceAll("<", "\\u003c");
const deployment = deploymentTemplate
  .replace("{{LAYRS_SHARED_HEADER}}", header.trim())
  .replace("{{LAYRS_SHARED_FOOTER}}", footer.trim())
  .replace("{{LAYRS_DEPLOYMENT_REGISTRY}}", safeRegistry);
const adoption = adoptionTemplate
  .replace("{{LAYRS_SHARED_HEADER}}", header.trim())
  .replace("{{LAYRS_SHARED_FOOTER}}", footer.trim())
  .replace("{{LAYRS_CAMPAIGN_EVIDENCE}}", safeCampaign);
const demo = demoTemplate
  .replace("{{LAYRS_SHARED_HEADER}}", header.trim())
  .replace("{{LAYRS_SHARED_FOOTER}}", footer.trim());

if ([deployment, adoption, demo].some((page) => page.includes("{{LAYRS_"))) {
  throw new Error("unresolved public-page template marker");
}

await Promise.all([
  writeFile(path.join(root, "index.html"), home),
  writeFile(path.join(root, "deployment.html"), deployment),
  writeFile(path.join(root, "adoption.html"), adoption),
  writeFile(path.join(root, "demo.html"), demo),
]);

process.stdout.write("Rendered shared homepage, deployment, adoption and demo layouts.\n");
