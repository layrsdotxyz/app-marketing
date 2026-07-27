import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const deploymentDir = path.resolve(
  process.env.LAYRS_CONTRACT_DEPLOYMENT_DIR
    ?? path.join(root, "..", "app-smart-contracts", "deployment"),
);

const readManifest = async (name) => {
  const source = await readFile(path.join(deploymentDir, name), "utf8");
  return {
    source,
    value: JSON.parse(source),
    sha256: createHash("sha256").update(source).digest("hex"),
  };
};

const [base, horizen] = await Promise.all([
  readManifest("base.json"),
  readManifest("horizen.json"),
]);

const contractsRepository = path.resolve(deploymentDir, "..");
let sourceCommit = "unknown";
try {
  sourceCommit = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: contractsRepository,
    encoding: "utf8",
  }).trim();
} catch {
  // The manifest hashes remain authoritative in exported/source archives.
}

const core = (manifest) => Object.fromEntries(
  Object.entries(manifest.contracts).map(([key, value]) => [
    key,
    { proxy: value.proxy, implementation: value.implementation },
  ]),
);

const poolGroups = (manifest, chain) => {
  const groups = manifest.collaterals.map((collateral) => ({
    symbol: collateral.symbol,
    role: chain === "horizen"
      ? "Prediction-market collateral + LP vault"
      : `${collateral.symbol} prediction-market collateral + LP vault`,
    asset: collateral.asset,
    pool: collateral.layrsPool,
    vault: collateral.lpVault,
    adapters: (collateral.yieldAdapters ?? []).map((adapter) => ({
      name: adapter.name,
      address: adapter.adapter,
      status: adapter.status,
    })),
    active: chain === "horizen" && collateral.symbol === "ZEN",
  }));

  if (chain === "base") {
    const collateralSymbols = new Set(groups.map((group) => group.symbol));
    for (const vault of manifest.vaults ?? []) {
      if (collateralSymbols.has(vault.symbol)) continue;
      groups.push({
        symbol: vault.symbol,
        role: `${vault.symbol === "ETH" ? "Wrapped-ETH" : vault.symbol} LP vault (vault-only)`,
        asset: vault.asset,
        pool: null,
        vault: vault.lpVault,
        adapters: [],
        active: false,
      });
    }
  }
  return groups;
};

const output = {
  schemaVersion: 1,
  provenance: {
    repository: "layrsHQ/app-smart-contracts",
    sourceCommit,
    manifests: {
      base: { path: "deployment/base.json", sha256: base.sha256 },
      horizen: { path: "deployment/horizen.json", sha256: horizen.sha256 },
    },
  },
  chains: [
    {
      key: "horizen",
      name: "Horizen",
      chainId: 26514,
      explorer: "https://horizen.calderaexplorer.xyz/address/",
      core: core(horizen.value),
      pools: poolGroups(horizen.value, "horizen"),
    },
    {
      key: "base",
      name: "Base",
      chainId: 8453,
      explorer: "https://basescan.org/address/",
      core: core(base.value),
      pools: poolGroups(base.value, "base"),
    },
  ],
};

await mkdir(path.join(root, "data"), { recursive: true });
await writeFile(
  path.join(root, "data", "deployment-registry.json"),
  `${JSON.stringify(output, null, 2)}\n`,
);

process.stdout.write(
  `Synced deployment registry from ${output.provenance.repository}@${sourceCommit}\n`,
);
