"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@subfy/ui";
import { Wallet, Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import { WalletProvider, useWallet } from "@/lib/wallet";
import type { ISupportedWallet } from "@creit.tech/stellar-wallets-kit";

/* ──────────────────────────────────────────────────────────
 * Login inner component (needs WalletProvider above it)
 * ──────────────────────────────────────────────────────── */

function LoginContent() {
  const router = useRouter();
  const {
    publicKey,
    connecting,
    error,
    displayAddress,
    wallets,
    loadingWallets,
    connect,
  } = useWallet();

  /* ── Redirect to dashboard once authenticated ── */
  useEffect(() => {
    if (publicKey) {
      router.push("/dashboard");
    }
  }, [publicKey, router]);

  const handleSelectWallet = async (wallet: ISupportedWallet) => {
    await connect(wallet.id);
  };

  /* If already connected, show a brief loading state while redirecting */
  if (publicKey) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <Loader2 className="size-8 animate-spin text-main-400" />
        <p className="font-outfit text-body-base text-text-secondary">
          Connected as {displayAddress}, redirecting…
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-md">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-main-500/8 blur-[120px]" />
      </div>

      <div className="relative flex flex-col items-center gap-8">
        {/* Icon */}
        <div className="flex size-20 items-center justify-center rounded-2xl border border-main-500/20 bg-main-500/10">
          <Wallet className="size-10 text-main-400" />
        </div>

        {/* Heading */}
        <div className="flex flex-col gap-3 text-center">
          <h1 className="font-sora text-display-3 tracking-tight text-text-primary">
            Connect your <span className="text-gradient">Wallet</span>
          </h1>
          <p className="mx-auto max-w-sm font-outfit text-body-base leading-relaxed text-text-secondary">
            Sign in with your Stellar wallet to access the Subfy dashboard.
            No password, no email — just your wallet.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex w-full items-center gap-3 rounded-xl border border-danger-border bg-danger-bg px-5 py-4">
            <AlertCircle className="size-5 shrink-0 text-danger" />
            <p className="font-outfit text-body-sm text-danger">{error}</p>
          </div>
        )}

        {/* Wallet list */}
        <div className="flex w-full flex-col gap-3">
          {loadingWallets ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-text-secondary" />
            </div>
          ) : (
            wallets.map((wallet) => (
              <button
                key={wallet.id}
                onClick={() => handleSelectWallet(wallet)}
                disabled={!wallet.isAvailable || connecting}
                className="group flex w-full items-center gap-4 rounded-xl border border-dark-500 bg-neutral-900 px-5 py-4 text-left transition-all hover:border-main-500/40 hover:bg-neutral-900/80 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {/* Icon */}
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

                {/* Label + status */}
                <div className="flex-1">
                  <p className="font-inter text-body-sm font-medium text-text-primary">
                    {wallet.name}
                  </p>
                  <p className="font-outfit text-body-xs text-text-secondary">
                    {!wallet.isAvailable ? "Not detected" : "Available"}
                  </p>
                </div>

                {/* Status indicator + connecting spinner */}
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

        {/* Info note */}
        <p className="text-center font-outfit text-body-xs leading-relaxed text-text-secondary">
          Signing is free — no XLM or transaction fees required.
          <br />
          We use a{" "}
          <span className="text-text-primary">
            cryptographic challenge (SEP-10)
          </span>{" "}
          to verify your identity.
        </p>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
 * Login page (wraps content with WalletProvider)
 * ──────────────────────────────────────────────────────── */

export default function LoginPage() {
  return (
    <WalletProvider>
      <div className="flex min-h-screen flex-col overflow-x-hidden bg-neutral-950">
        {/* Navbar */}
        <nav className="border-b border-dark-500/50 bg-neutral-950/80 backdrop-blur-xl">
          <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/Logo.svg" alt="Subfy" className="h-7" />
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="size-4" />
                  <span className="hidden sm:inline">Back to</span> Home
                </Button>
              </Link>
              <Link href="/whitelist">
                <Button variant="outline" size="sm">
                  Whitelist
                </Button>
              </Link>
            </div>
          </div>
        </nav>

        {/* Main */}
        <main className="flex flex-1 items-center justify-center px-6 py-20">
          <LoginContent />
        </main>

        {/* Footer */}
        <footer className="border-t border-dark-500/50 py-6">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/Logo.svg" alt="Subfy" className="h-5" />
            </Link>
            <p className="font-outfit text-body-xs text-text-secondary">
              &copy; {new Date().getFullYear()} Subfy. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </WalletProvider>
  );
}
