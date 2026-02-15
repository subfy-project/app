"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@subfy/ui";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { WalletProvider, useWallet } from "@/lib/wallet";
import type { ISupportedWallet } from "@creit.tech/stellar-wallets-kit";
import { WalletConnectPanel } from "@/components/wallet-connect-panel";

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
    <WalletConnectPanel
      wallets={wallets}
      loadingWallets={loadingWallets}
      connecting={connecting}
      error={error}
      title="Connect your Wallet"
      description="Sign in with your Stellar wallet to access the Subfy dashboard. No password, no email - just your wallet."
      onConnect={handleSelectWallet}
    />
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
