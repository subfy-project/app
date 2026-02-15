"use client";

import type { ISupportedWallet } from "@creit.tech/stellar-wallets-kit";
import { AlertCircle, Loader2, Wallet } from "lucide-react";

interface WalletConnectPanelProps {
  wallets: ISupportedWallet[];
  loadingWallets: boolean;
  connecting: boolean;
  error?: string | null;
  title?: string;
  description?: string;
  onConnect: (wallet: ISupportedWallet) => Promise<void> | void;
}

export function WalletConnectPanel({
  wallets,
  loadingWallets,
  connecting,
  error,
  title = "Connect your Wallet",
  description = "Sign in with your Stellar wallet to continue.",
  onConnect,
}: WalletConnectPanelProps) {
  return (
    <div className="relative w-full max-w-md">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-main-500/8 blur-[120px]" />
      </div>

      <div className="relative flex flex-col items-center gap-8">
        <div className="flex size-20 items-center justify-center rounded-2xl border border-main-500/20 bg-main-500/10">
          <Wallet className="size-10 text-main-400" />
        </div>

        <div className="flex flex-col gap-3 text-center">
          <h1 className="font-sora text-display-3 tracking-tight text-text-primary">
            {title.split(" ").slice(0, -1).join(" ")}{" "}
            <span className="text-gradient">{title.split(" ").slice(-1)}</span>
          </h1>
          <p className="mx-auto max-w-sm font-outfit text-body-base leading-relaxed text-text-secondary">
            {description}
          </p>
        </div>

        {error ? (
          <div className="flex w-full items-center gap-3 rounded-xl border border-danger-border bg-danger-bg px-5 py-4">
            <AlertCircle className="size-5 shrink-0 text-danger" />
            <p className="font-outfit text-body-sm text-danger">{error}</p>
          </div>
        ) : null}

        <div className="flex w-full flex-col gap-3">
          {loadingWallets ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-text-secondary" />
            </div>
          ) : (
            wallets.map((wallet) => (
              <button
                key={wallet.id}
                onClick={() => void onConnect(wallet)}
                disabled={!wallet.isAvailable || connecting}
                className="group flex w-full items-center gap-4 rounded-xl border border-dark-500 bg-neutral-900 px-5 py-4 text-left transition-all hover:border-main-500/40 hover:bg-neutral-900/80 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-dark-500 bg-dark-500/50 transition-colors group-hover:border-main-500/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={wallet.icon}
                    alt={wallet.name}
                    className="size-7"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>

                <div className="flex-1">
                  <p className="font-inter text-body-sm font-medium text-text-primary">
                    {wallet.name}
                  </p>
                  <p className="font-outfit text-body-xs text-text-secondary">
                    {!wallet.isAvailable ? "Not detected" : "Available"}
                  </p>
                </div>

                {connecting ? (
                  <Loader2 className="size-5 animate-spin text-main-400" />
                ) : (
                  <div
                    className={`size-2.5 rounded-full ${
                      wallet.isAvailable ? "bg-emerald-400" : "bg-neutral-600"
                    }`}
                  />
                )}
              </button>
            ))
          )}
        </div>

        <p className="text-center font-outfit text-body-xs leading-relaxed text-text-secondary">
          Signing is free - no XLM or transaction fees required.
          <br />
          We use a{" "}
          <span className="text-text-primary">cryptographic challenge (SEP-10)</span>{" "}
          to verify your identity.
        </p>
      </div>
    </div>
  );
}
