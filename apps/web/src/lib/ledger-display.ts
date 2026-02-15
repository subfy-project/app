const LEDGER_CLOSE_SECONDS = 5;

export type StellarNetwork = "testnet" | "public";

function getHorizonUrl(network: StellarNetwork): string {
  return network === "public"
    ? "https://horizon.stellar.org"
    : "https://horizon-testnet.stellar.org";
}

export async function fetchLatestLedgerSequence(
  network: StellarNetwork,
): Promise<number | null> {
  try {
    const res = await fetch(`${getHorizonUrl(network)}/ledgers?order=desc&limit=1`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const payload = (await res.json()) as {
      _embedded?: { records?: Array<{ sequence?: string }> };
    };
    const value = payload?._embedded?.records?.[0]?.sequence;
    if (!value) return null;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  } catch {
    return null;
  }
}

function formatRelativeSeconds(totalSeconds: number): string {
  const abs = Math.abs(totalSeconds);
  const units: Array<{ unit: string; seconds: number }> = [
    { unit: "day", seconds: 86_400 },
    { unit: "hour", seconds: 3_600 },
    { unit: "minute", seconds: 60 },
  ];
  for (const item of units) {
    if (abs >= item.seconds) {
      const value = Math.round(totalSeconds / item.seconds);
      const suffix = Math.abs(value) > 1 ? `${item.unit}s` : item.unit;
      return value > 0 ? `in ${value} ${suffix}` : `${Math.abs(value)} ${suffix} ago`;
    }
  }
  return totalSeconds >= 0 ? "in a few seconds" : "a few seconds ago";
}

export function formatLedgerEstimate(
  ledger: number,
  latestLedger: number | null,
): string {
  if (!Number.isFinite(ledger) || ledger <= 0) return "-";
  if (!latestLedger || latestLedger <= 0) return `Ledger #${ledger}`;
  const deltaLedgers = ledger - latestLedger;
  const deltaSeconds = deltaLedgers * LEDGER_CLOSE_SECONDS;
  const target = new Date(Date.now() + deltaSeconds * 1000);
  return `${target.toLocaleString()} (${formatRelativeSeconds(deltaSeconds)})`;
}
