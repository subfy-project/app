const CONTRACT_ERROR_MESSAGES: Record<number, string> = {
  1: "Contract already initialized.",
  2: "Contract not initialized yet.",
  3: "Unauthorized action for this contract.",
  4: "This plan ID already exists.",
  5: "Plan not found.",
  6: "Invalid period.",
  7: "Plan is inactive.",
  8: "Subscriber already has an active subscription.",
  9: "Subscription not found.",
  10: "Subscription is cancelled.",
  11: "Invalid price.",
  12: "Renewal is too early.",
  13: "Invalid page size.",
};

export function toDisplayError(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message : fallback;
  const contractCode = message.match(/Error\(Contract,\s*#(\d+)\)/);
  if (contractCode) {
    const code = Number(contractCode[1]);
    return CONTRACT_ERROR_MESSAGES[code] ?? `Contract rejected action (code #${code}).`;
  }
  return message || fallback;
}
