(() => {
  "use strict";

  const dataNode = document.getElementById("deployment-registry-data");
  const registryRoot = document.getElementById("deployment-registry");
  if (!dataNode || !registryRoot) return;

  const registry = JSON.parse(dataNode.textContent);
  const addressPattern = /^0x[0-9a-fA-F]{40}$/;
  const copyIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11"></rect><path d="M5 15V5a2 2 0 0 1 2-2h10"></path></svg>';
  const checkIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>';
  const shieldIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 5 6v5c0 4 3 7 7 8 4-1 7-4 7-8V6z"></path><path d="M9 12l2 2 4-4"></path></svg>';

  const coreCopy = {
    layrsAdmin: {
      name: "LayrsAdmin",
      role: "Governance & role registry",
      what: "The protocol's on-chain access-control root. It holds operational roles and governs upgrades to the UUPS contracts.",
      privacy: "Restricts sensitive settlement and payout operations to governed signers, including instructions authorized by the attested execution path.",
    },
    marketRegistry: {
      name: "MarketRegistry",
      role: "Market definitions & attested binding",
      what: "The public registry of prediction-market definitions: asset, window, open and close times, limits and release bindings.",
      privacy: "Binds each public market to the approved confidential execution release so users can verify the code boundary without exposing the private order book.",
    },
    adminOracle: {
      name: "AdminOracle",
      role: "Attested price & resolution feed",
      what: "Publishes reference prices and final outcomes accepted by the settlement rail under governed resolver permissions.",
      privacy: "Publishes the outcome evidence required for public verification while user positions and private portfolio state remain outside the public payload.",
    },
    matchSettlement: {
      name: "MatchSettlement",
      role: "Private-CLOB settlement audit rail",
      what: "Records governed batches and fill receipts produced by Layrs settlement processing.",
      privacy: "The order book and individual private instructions are processed inside the confidential execution boundary; the chain receives the verifiable settlement rail, not the private book.",
    },
  };

  const poolInfo = (chain, pool) => {
    if (chain.key === "horizen" && pool.symbol === "ZEN") {
      return {
        what: "The live custody pool and ERC-4626 liquidity vault for ZEN prediction markets on Horizen MainNet, with its registered ZenStaker yield adapter.",
        privacy: "Orders against pooled liquidity are handled by the attested private CLOB. Public contracts expose custody and aggregate settlement, not individual orders or portfolio ownership.",
        verify: true,
      };
    }
    if (pool.pool) {
      return {
        what: `${pool.symbol} custody is separated between the prediction-market collateral pool and the ERC-4626 liquidity vault.`,
        privacy: "On-chain balances make aggregate custody verifiable. User-level trading positions, private order metadata and internal portfolio accounting are not published by this registry.",
      };
    }
    return {
      what: `The ERC-4626 ${pool.symbol} liquidity vault provides a public, share-based interface for protocol liquidity.`,
      privacy: "Aggregate vault assets and share accounting are public; Layrs keeps private portfolio and reward attribution out of this public contract registry.",
    };
  };

  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  const shortAddress = (address) => `${address.slice(0, 6)}…${address.slice(-4)}`;

  const explorerLink = (chain, address) => {
    if (!addressPattern.test(address)) throw new Error("invalid address in deployment registry");
    return `${chain.explorer}${address}`;
  };

  const copyButton = (address) => {
    const button = element("button", "copy-address");
    button.type = "button";
    button.innerHTML = copyIcon;
    button.setAttribute("aria-label", `Copy address ${address}`);
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(address);
      } catch {
        const fallback = element("textarea");
        fallback.value = address;
        fallback.setAttribute("readonly", "");
        fallback.style.position = "fixed";
        fallback.style.opacity = "0";
        document.body.appendChild(fallback);
        fallback.select();
        document.execCommand("copy");
        fallback.remove();
      }
      button.classList.add("done");
      button.innerHTML = checkIcon;
      window.setTimeout(() => {
        button.classList.remove("done");
        button.innerHTML = copyIcon;
      }, 1400);
    });
    return button;
  };

  const addressRow = (chain, label, address, primary) => {
    const row = element("div", `contract-address${primary ? " primary" : ""}`);
    row.appendChild(element("span", "contract-address-label", label));
    const link = element("a", "contract-address-link", address);
    link.href = explorerLink(chain, address);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    row.append(link, copyButton(address));
    return row;
  };

  const tooltip = (name, info) => {
    const trigger = element("button", "know-more");
    trigger.type = "button";
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-label", `Know more about ${name}`);
    const icon = element("span", "know-more-icon", "?");
    trigger.append(icon, document.createTextNode("Know more"));

    const tip = element("span", "contract-tooltip");
    tip.setAttribute("role", "tooltip");
    tip.append(
      element("h4", "", name),
      element("p", "", info.what),
    );
    const privacy = element("span", "privacy-note");
    privacy.innerHTML = shieldIcon;
    privacy.appendChild(element("span", "", info.privacy));
    tip.appendChild(privacy);
    if (info.verify) {
      const verify = element("a", "verify-enclave", "Verify the enclave live at app.layrs.xyz ↗");
      verify.href = "https://app.layrs.xyz/privacy";
      verify.target = "_blank";
      verify.rel = "noopener noreferrer";
      tip.appendChild(verify);
    }
    trigger.appendChild(tip);

    const place = () => {
      const bounds = trigger.getBoundingClientRect();
      if (bounds.left > window.innerWidth * 0.5) {
        tip.style.left = "auto";
        tip.style.right = "0";
      } else {
        tip.style.left = "0";
        tip.style.right = "auto";
      }
    };
    trigger.addEventListener("mouseenter", place);
    trigger.addEventListener("focus", place);
    trigger.addEventListener("click", (event) => {
      event.stopPropagation();
      place();
      const next = trigger.dataset.open !== "true";
      document.querySelectorAll('.know-more[data-open="true"]').forEach((node) => {
        delete node.dataset.open;
        node.setAttribute("aria-expanded", "false");
      });
      if (next) {
        trigger.dataset.open = "true";
        trigger.setAttribute("aria-expanded", "true");
      }
    });
    return trigger;
  };

  const tag = (label, className = "") =>
    element("span", `contract-tag${className ? ` ${className}` : ""}`, label);

  const card = (chain, config) => {
    const cardNode = element("article", "contract-card");
    const top = element("div", "contract-card-top");
    const heading = element("div");
    const nameWrap = element("div", "contract-name-wrap");
    nameWrap.append(
      element("span", "contract-name", config.name),
      tooltip(config.name, config.info),
    );
    heading.append(nameWrap, element("div", "contract-role", config.role));
    top.appendChild(heading);

    const tags = element("div", "contract-tags");
    for (const item of config.tags) tags.appendChild(tag(item.label, item.className));
    top.appendChild(tags);
    cardNode.appendChild(top);

    const addresses = element("div", "contract-addresses");
    for (const row of config.addresses) {
      addresses.appendChild(addressRow(chain, row.label, row.address, row.primary));
    }
    cardNode.appendChild(addresses);

    if (config.asset) {
      const asset = element("div", "contract-asset");
      asset.appendChild(element("span", "contract-asset-label", `Asset ${config.asset.symbol}`));
      const link = element("a", "", shortAddress(config.asset.address));
      link.href = explorerLink(chain, config.asset.address);
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      asset.appendChild(link);
      cardNode.appendChild(asset);
    }
    return cardNode;
  };

  const renderCore = (chain, container) => {
    for (const [key, addresses] of Object.entries(chain.core)) {
      const copy = coreCopy[key];
      if (!copy) continue;
      container.appendChild(card(chain, {
        name: copy.name,
        role: copy.role,
        info: copy,
        tags: [
          { label: "Proxy", className: "proxy" },
          { label: "Verified", className: "verified" },
        ],
        addresses: [
          { label: "Proxy", address: addresses.proxy, primary: true },
          { label: "Implementation", address: addresses.implementation, primary: false },
        ],
      }));
    }
  };

  const renderPools = (chain, container) => {
    for (const pool of chain.pools) {
      const addresses = [];
      if (pool.pool) addresses.push(
        { label: "Pool", address: pool.pool.proxy, primary: true },
      );
      addresses.push({ label: "Vault", address: pool.vault.proxy, primary: true });
      for (const adapter of pool.adapters) {
        addresses.push({ label: "Adapter", address: adapter.address, primary: false });
      }
      if (pool.pool) addresses.push(
        { label: "Pool impl", address: pool.pool.implementation, primary: false },
      );
      addresses.push(
        { label: "Vault impl", address: pool.vault.implementation, primary: false },
      );
      container.appendChild(card(chain, {
        name: pool.pool ? `${pool.symbol} LayrsPool + Vault` : `${pool.symbol} LP Vault`,
        role: pool.role,
        info: poolInfo(chain, pool),
        tags: [
          ...(pool.active ? [{ label: "Active", className: "active" }] : []),
          { label: "Verified", className: "verified" },
        ],
        addresses,
        asset: { symbol: pool.symbol, address: pool.asset },
      }));
    }
  };

  for (const chain of registry.chains) {
    const section = element("section", "registry-chain");
    const head = element("div", "registry-chain-head");
    head.append(
      element("h2", "", chain.name),
      element("span", "registry-chain-id", `chain ${chain.chainId}`),
    );
    const explorer = element(
      "a",
      "registry-explorer",
      `${new URL(chain.explorer).host} ↗`,
    );
    explorer.href = new URL("/", chain.explorer).toString();
    explorer.target = "_blank";
    explorer.rel = "noopener noreferrer";
    head.appendChild(explorer);
    section.appendChild(head);

    section.appendChild(element("p", "registry-group-label", "Core protocol"));
    const core = element("div", "registry-grid");
    renderCore(chain, core);
    section.appendChild(core);

    section.appendChild(element(
      "p",
      "registry-group-label",
      chain.key === "horizen"
        ? "Collateral pool, vault & yield"
        : "Collateral pools & vaults",
    ));
    const pools = element("div", "registry-grid");
    renderPools(chain, pools);
    section.appendChild(pools);
    registryRoot.appendChild(section);
  }

  if (Array.isArray(registry.proofs) && registry.proofs.length > 0) {
    const proofSection = element("section", "registry-chain proof-registry");
    const proofHead = element("div", "registry-chain-head");
    proofHead.append(
      element("h2", "", "Privacy proofs"),
      element("span", "registry-chain-id", "RISC Zero · zkVerify · Horizen"),
    );
    const repository = element("a", "registry-explorer", "public evidence ↗");
    repository.href = "https://github.com/layrsHQ/privacy-evidence";
    repository.target = "_blank";
    repository.rel = "noopener noreferrer";
    proofHead.appendChild(repository);
    proofSection.appendChild(proofHead);
    proofSection.appendChild(element("p", "registry-group-label", "Verified settlement attestations"));

    const proofGrid = element("div", "registry-grid");
    for (const proof of registry.proofs) {
      const chain = registry.chains.find((candidate) => candidate.key === proof.chain);
      if (!chain) continue;
      const evidence = proof.firstAttestation;
      const proofCard = card(chain, {
        name: proof.name,
        role: "Additive, non-custodial settlement-proof registry",
        info: {
          what: "Verifies zkVerify aggregation receipts for the versioned Layrs RISC Zero settlement program and records the bound public result on Horizen.",
          privacy: "Iteration 0 proves the committed 25-observation median resolution without publishing individual orders, positions, balances or portfolio ownership.",
        },
        tags: [
          { label: "ZK verified", className: "active" },
          { label: "Source verified", className: "verified" },
        ],
        addresses: [
          { label: "Registry", address: proof.address, primary: true },
        ],
      });

      const evidenceRows = element("div", "proof-evidence");
      const row = (label, value, href) => {
        const item = element("div", "proof-evidence-row");
        item.appendChild(element("span", "proof-evidence-label", label));
        if (href) {
          const link = element("a", "", value);
          link.href = href;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          item.appendChild(link);
        } else {
          item.appendChild(element("code", "", value));
        }
        return item;
      };
      evidenceRows.append(
        row("Market", evidence.marketId),
        row("Outcome", evidence.outcome),
        row("Proof hash", `${evidence.proofArtifactHash.slice(0, 18)}…${evidence.proofArtifactHash.slice(-8)}`),
        row(
          "zkVerify",
          `domain ${proof.zkVerifyDomainId} · aggregation ${evidence.zkVerifyAggregationId} ↗`,
          `https://zkverify.subscan.io/extrinsic/${evidence.zkVerifyTransactionHash}`,
        ),
        row(
          "Horizen",
          `${evidence.attestationTx.slice(0, 14)}…${evidence.attestationTx.slice(-8)} ↗`,
          `https://horizen.calderaexplorer.xyz/tx/${evidence.attestationTx}`,
        ),
        row(
          "Artifacts",
          "receipt, journal, source and verifier ↗",
          "https://github.com/layrsHQ/privacy-evidence/tree/main/evidence/iteration-0",
        ),
      );
      const scope = element(
        "p",
        "proof-scope",
        "Scope: resolution median and settlement binding. Pyth signatures, CLOB matching, payouts, fees, bridges and TEE integrity are not claimed by Iteration 0.",
      );
      proofCard.append(evidenceRows, scope);
      proofGrid.appendChild(proofCard);
    }
    proofSection.appendChild(proofGrid);
    registryRoot.appendChild(proofSection);
  }

  const provenance = document.getElementById("registry-provenance");
  if (provenance) {
    provenance.textContent = `Generated from app-smart-contracts ${registry.provenance.sourceCommit.slice(0, 12)}.`;
  }

  document.addEventListener("click", () => {
    document.querySelectorAll('.know-more[data-open="true"]').forEach((node) => {
      delete node.dataset.open;
      node.setAttribute("aria-expanded", "false");
    });
  });
})();
