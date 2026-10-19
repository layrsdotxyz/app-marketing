(() => {
  "use strict";
  const node = document.querySelector("#campaign-evidence-data");
  const summary = document.querySelector("#adoption-summary");
  const status = document.querySelector("#adoption-status");
  if (!node || !summary || !status) return;
  try {
    const report = JSON.parse(node.textContent);
    const metrics = [
      ["Participants", report.participants, "Accounts with successful deposits and executed trades"],
      ["Participant deposit wallets", report.participantDepositWallets, "Distinct participant deposit-wallet addresses in the evidence tables"],
      ["Successful deposits", report.successfulDeposits, "Deposit operations, not unique accounts"],
      ["Total deposited", `${report.depositedUsdc} USDC`, "Original deposit amounts, counted once"],
      ["Executed trades", report.executedTrades, "One count per execution, including both counterparties in the trade table"],
      ["Delivered withdrawals", report.deliveredWithdrawals, "Withdrawals with independently checked recipient delivery"],
      ["Withdrawn principal", `${report.withdrawnUsdc} USDC`, "Requested principal of delivered withdrawals"],
      ["Trades with both proof publications verified", report.tradesWithBothPublicationsVerified, "Signed receipts, Merkle inclusion and publication events checked for both sides"],
      ["Unique signed private-fill receipts", report.uniqueSignedReceipts, "Deduplicated receipts linked to the executed trades"],
    ];
    for (const key of ["participants", "participantDepositWallets", "successfulDeposits", "executedTrades", "deliveredWithdrawals", "tradesWithBothPublicationsVerified", "uniqueSignedReceipts"]) {
      if (!Number.isSafeInteger(report[key]) || report[key] < 0) throw new Error("Invalid campaign count");
    }
    const rows = metrics.map((values) => {
      const row = document.createElement("tr");
      values.forEach((value, index) => {
        const cell = document.createElement("td");
        cell.textContent = typeof value === "number" ? value.toLocaleString("en-US") : value;
        if (index === 1) cell.className = "adoption-value";
        row.appendChild(cell);
      });
      return row;
    });
    summary.replaceChildren(...rows);
    const download = (id, filename, type, body) => {
      const button = document.getElementById(id);
      if (!button) return;
      button.disabled = false;
      button.addEventListener("click", () => {
        const url = URL.createObjectURL(new Blob([body], { type }));
        const anchor = document.createElement("a");
        anchor.href = url; anchor.download = filename; anchor.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      });
    };
    download("download-adoption-json", "layrs-campaign-summary.json", "application/json", JSON.stringify(report, null, 2));
    const csv = [["Metric", "Value", "Definition"], ...metrics,
      ["Campaign start (UTC)", report.startUtc, "Inclusive campaign boundary"],
      ["Snapshot cutoff (UTC)", report.cutoffUtc, "Fixed snapshot; not a live feed"]]
      .map(values => values.map(value => '"' + String(value).replaceAll('"', '""') + '"').join(",")).join("\n");
    download("download-adoption-csv", "layrs-campaign-summary.csv", "text/csv;charset=utf-8", csv);
    status.textContent = "Verified campaign totals from a fixed snapshot. The summary downloads include the complete snapshot period.";
  } catch {
    summary.replaceChildren();
    status.textContent = "The snapshot could not be displayed. Please try again later; contract explorer links remain available.";
  }
})();
