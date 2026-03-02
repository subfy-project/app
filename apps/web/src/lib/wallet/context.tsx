"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ISupportedWallet } from "@creit.tech/stellar-wallets-kit";
import type { WalletState } from "./types";
import { INITIAL_WALLET_STATE } from "./types";
import { getKit } from "./kit";
import {
  requestChallenge,
  verifyWithTransaction,
} from "../api/auth";
import {
  accountExistsOnTestnet,
  fundAccountViaFriendbot,
} from "../stellar-testnet";

/* ── Storage keys ──────────────────────────────────── */
const LS_TOKEN = "subfy_token";
const LS_PUBLIC_KEY = "subfy_public_key";
const LS_WALLET_ID = "subfy_wallet_id";

/* ── Context shape ─────────────────────────────────── */
interface WalletContextValue extends WalletState {
  /** Supported wallets from the kit (with availability info) */
  wallets: ISupportedWallet[];
  /** True while fetching the wallet list */
  loadingWallets: boolean;
  /** Connect a specific wallet then run the auth flow */
  connect: (walletId: string) => Promise<void>;
  /** Disconnect and clear session */
  disconnect: () => Promise<void>;
  /** Truncated public key for display (e.g. "GXXX…YYYY") */
  displayAddress: string | null;
}

const WalletContext = createContext<WalletContextValue | null>(null);

/* ── Provider props ───────────────────────────────── */

export interface WalletProviderProps {
  children: React.ReactNode;
  /**
   * When the connected account doesn't exist on Stellar testnet, this is called.
   * Return "fund" to fund via Friendbot and continue, "cancel" to abort.
   */
  onAccountNotFound?: (address: string) => Promise<"fund" | "cancel">;
}

/* ── Provider ──────────────────────────────────────── */

export function WalletProvider({ children, onAccountNotFound }: WalletProviderProps) {
  const [state, setState] = useState<WalletState>(INITIAL_WALLET_STATE);
  const [wallets, setWallets] = useState<ISupportedWallet[]>([]);
  const [loadingWallets, setLoadingWallets] = useState(true);

  /* ── Load supported wallets from the kit ──── */
  useEffect(() => {
    let cancelled = false;

    getKit()
      .getSupportedWallets()
      .then((supported) => {
        if (!cancelled) {
          setWallets(supported);
          setLoadingWallets(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadingWallets(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /* ── Restore session from localStorage on mount ── */
  useEffect(() => {
    const token = localStorage.getItem(LS_TOKEN);
    const publicKey = localStorage.getItem(LS_PUBLIC_KEY);
    const walletId = localStorage.getItem(LS_WALLET_ID);

    if (token && publicKey) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.exp > Date.now() / 1000) {
          setState((s) => ({
            ...s,
            token,
            publicKey,
            walletId,
          }));
          return;
        }
      } catch {
        // Malformed token → clear
      }
      localStorage.removeItem(LS_TOKEN);
      localStorage.removeItem(LS_PUBLIC_KEY);
      localStorage.removeItem(LS_WALLET_ID);
    }
  }, []);

  /* ── Connect ─────────────────────────────────────── */

  const connect = useCallback(
    async (walletId: string) => {
      setState((s) => ({ ...s, connecting: true, error: null }));

      try {
        const kit = getKit();

        // 1. Select the wallet module
        kit.setWallet(walletId);

        // 2. Request public key → clean "Connection Request" popup
        const { address } = await kit.getAddress();

        // 3. Check if account exists on Stellar testnet
        const exists = await accountExistsOnTestnet(address);
        if (!exists) {
          const choice = await onAccountNotFound?.(address);
          if (choice === "cancel" || choice === undefined) {
            setState((s) => ({
              ...s,
              connecting: false,
              error:
                choice === undefined
                  ? "This account doesn't exist on Stellar testnet."
                  : null,
            }));
            return;
          }
          if (choice === "fund") {
            const funded = await fundAccountViaFriendbot(address);
            if (!funded) {
              setState((s) => ({
                ...s,
                connecting: false,
                error: "Failed to fund account via Friendbot. Please try again.",
              }));
              return;
            }
          }
        }

        // 4. Request challenge from backend
        const challenge = await requestChallenge(address);

        // 5. Sign the SEP-10 challenge transaction
        const { signedTxXdr } = await kit.signTransaction(
          challenge.transaction,
          {
            address,
            networkPassphrase: challenge.networkPassphrase,
          },
        );

        // 6. Verify with backend → get JWT
        const { token } = await verifyWithTransaction(address, signedTxXdr);

        // 7. Persist session
        localStorage.setItem(LS_TOKEN, token);
        localStorage.setItem(LS_PUBLIC_KEY, address);
        localStorage.setItem(LS_WALLET_ID, walletId);

        setState({
          walletId,
          publicKey: address,
          token,
          connecting: false,
          error: null,
        });
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "An error occurred while connecting the wallet";
        setState((s) => ({
          ...s,
          connecting: false,
          error: message,
        }));
      }
    },
    [onAccountNotFound],
  );

  /* ── Disconnect ──────────────────────────────────── */

  const disconnect = useCallback(async () => {
    try {
      await getKit().disconnect();
    } catch {
      // Ignore disconnect errors
    }

    localStorage.removeItem(LS_TOKEN);
    localStorage.removeItem(LS_PUBLIC_KEY);
    localStorage.removeItem(LS_WALLET_ID);

    setState(INITIAL_WALLET_STATE);
  }, []);

  /* ── Derived values ──────────────────────────────── */

  const displayAddress = useMemo(() => {
    if (!state.publicKey) return null;
    const pk = state.publicKey;
    return `${pk.slice(0, 4)}…${pk.slice(-4)}`;
  }, [state.publicKey]);

  /* ── Context value ───────────────────────────────── */

  const value = useMemo<WalletContextValue>(
    () => ({
      ...state,
      wallets,
      loadingWallets,
      connect,
      disconnect,
      displayAddress,
    }),
    [state, wallets, loadingWallets, connect, disconnect, displayAddress],
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

/* ── Hook ──────────────────────────────────────────── */

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWallet must be used within a <WalletProvider>");
  }
  return ctx;
}
