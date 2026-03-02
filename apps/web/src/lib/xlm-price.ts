"use client";

import { useCallback, useEffect, useState } from "react";

const COINGECKO_XLM_USD_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd";
const REFRESH_INTERVAL_MS = 60_000; // 1 minute

export interface XlmPriceState {
  /** XLM price in USD, or null while loading / on error */
  priceUsd: number | null;
  loading: boolean;
  error: boolean;
}

/**
 * Fetches current XLM/USD price from CoinGecko (no API key).
 * Refreshes every minute. Use for display/estimation only.
 */
export function useXlmPrice(): XlmPriceState {
  const [priceUsd, setPriceUsd] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchPrice = useCallback(async () => {
    try {
      const res = await fetch(COINGECKO_XLM_USD_URL, { cache: "no-store" });
      if (!res.ok) {
        setError(true);
        return;
      }
      const data = (await res.json()) as { stellar?: { usd?: number } };
      const usd = data?.stellar?.usd;
      if (typeof usd === "number" && usd > 0) {
        setPriceUsd(usd);
        setError(false);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPrice();
    const interval = setInterval(fetchPrice, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchPrice]);

  return { priceUsd, loading, error };
}
