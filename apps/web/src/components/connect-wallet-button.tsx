"use client";

import { useState } from "react";
import { useWallet } from "@/lib/wallet";
import type { ISupportedWallet } from "@creit.tech/stellar-wallets-kit";
import { Wallet, LogOut, Loader2, ChevronDown, X } from "lucide-react";

/* ──────────────────────────────────────────────────────────
 * ConnectWalletButton
 *
 * Renders either:
 *  - A "Connect Wallet" button (when disconnected)
 *  - The truncated address + disconnect option (when connected)
 *
 * On click it opens a modal listing all supported wallets
 * from @creit.tech/stellar-wallets-kit, styled with our design.
 * ──────────────────────────────────────────────────────── */

export function ConnectWalletButton() {
  const {
    publicKey,
    connecting,
    error,
    displayAddress,
    wallets,
    connect,
    disconnect,
  } = useWallet();

  const [modalOpen, setModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  /* ── Handlers ───────────────────────────────────── */

  const handleSelectWallet = async (wallet: ISupportedWallet) => {
    setModalOpen(false);
    await connect(wallet.id);
  };

  const handleDisconnect = async () => {
    setMenuOpen(false);
    await disconnect();
  };

  /* ── Connected state ────────────────────────────── */

  if (publicKey) {
    return (
      <div className="relative ml-1 sm:ml-2">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-2 rounded-lg border border-dark-500 bg-dark-500/40 px-3 py-1.5 font-inter text-sm text-text-primary transition-colors hover:bg-dark-500/70"
        >
          <div className="size-2 rounded-full bg-emerald-400" />
          <span className="hidden sm:inline">{displayAddress}</span>
          <ChevronDown className="size-3.5 text-text-secondary" />
        </button>

        {/* Dropdown menu */}
        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-dark-500 bg-neutral-900 shadow-2xl">
              <div className="border-b border-dark-500 px-4 py-3">
                <p className="font-inter text-xs text-text-secondary">
                  Connected
                </p>
                <p className="mt-0.5 font-mono text-xs text-text-primary break-all">
                  {publicKey.slice(0, 12)}…{publicKey.slice(-8)}
                </p>
              </div>
              <button
                onClick={handleDisconnect}
                className="flex w-full items-center gap-2 px-4 py-3 text-left font-inter text-sm text-red-400 transition-colors hover:bg-dark-500/50"
              >
                <LogOut className="size-4" />
                Disconnect
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  /* ── Disconnected state ─────────────────────────── */

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        disabled={connecting}
        className="ml-1 flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#7C5CFF] to-[#8B7CFF] px-3 py-1.5 font-inter text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 sm:ml-2 sm:px-4"
      >
        {connecting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Wallet className="size-4" />
        )}
        <span className="hidden sm:inline">
          {connecting ? "Connecting…" : "Connect Wallet"}
        </span>
      </button>

      {/* Wallet selection modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-sm mx-4 overflow-hidden rounded-2xl border border-dark-500 bg-neutral-900 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-dark-500 px-6 py-4">
              <h2 className="font-sora text-lg font-semibold text-text-primary">
                Connect Wallet
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-text-secondary transition-colors hover:bg-dark-500/50 hover:text-text-primary"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Error banner */}
            {error && (
              <div className="mx-6 mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Wallet list */}
            <div className="space-y-2 p-6">
              {wallets.map((wallet) => (
                <button
                  key={wallet.id}
                  onClick={() => handleSelectWallet(wallet)}
                  disabled={!wallet.isAvailable}
                  className="flex w-full items-center gap-4 rounded-xl border border-dark-500 bg-dark-500/20 px-4 py-3 text-left transition-all hover:border-[#7C5CFF]/40 hover:bg-dark-500/40 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {/* Wallet icon */}
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-dark-500">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={wallet.icon}
                      alt={wallet.name}
                      className="size-6"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>

                  {/* Name + status */}
                  <div className="flex-1">
                    <p className="font-inter text-sm font-medium text-text-primary">
                      {wallet.name}
                    </p>
                    {!wallet.isAvailable && (
                      <p className="font-inter text-xs text-text-secondary">
                        Not detected
                      </p>
                    )}
                  </div>

                  {/* Availability dot */}
                  <div
                    className={`size-2 rounded-full ${
                      wallet.isAvailable ? "bg-emerald-400" : "bg-neutral-600"
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-dark-500 px-6 py-3">
              <p className="text-center font-inter text-xs text-text-secondary">
                Connect with your Stellar wallet to access the dashboard
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
