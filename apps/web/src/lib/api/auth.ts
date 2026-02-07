/* ──────────────────────────────────────────────────────────
 * Auth API client
 *
 * Thin wrapper around the backend auth endpoints.
 * Uses SEP-10 transaction signing via stellar-wallets-kit.
 * ──────────────────────────────────────────────────────── */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface ChallengeResponse {
  /** Plain challenge string (kept for potential future use) */
  challenge: string;
  /** Stellar XDR for transaction signing */
  transaction: string;
  networkPassphrase: string;
}

export interface VerifyResponse {
  token: string;
  user: {
    publicKey: string;
    createdAt: string;
    lastLoginAt: string;
  };
}

/**
 * Request a SEP-10 challenge from the backend.
 */
export async function requestChallenge(
  publicKey: string,
): Promise<ChallengeResponse> {
  const res = await fetch(
    `${API_URL}/auth/challenge?publicKey=${encodeURIComponent(publicKey)}`,
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || "Failed to request challenge");
  }

  return res.json();
}

/**
 * Verify a signed SEP-10 transaction with the backend.
 */
export async function verifyWithTransaction(
  publicKey: string,
  transaction: string,
): Promise<VerifyResponse> {
  const res = await fetch(`${API_URL}/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publicKey, transaction }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || "Failed to verify transaction");
  }

  return res.json();
}

/**
 * Fetch the current user profile (requires auth token).
 */
export async function fetchMe(
  token: string,
): Promise<{ publicKey: string }> {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("Not authenticated");
  }

  return res.json();
}
