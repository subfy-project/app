"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { DashboardLayout } from "@subfy/ui";
import { WalletProvider, useWallet } from "@/lib/wallet";
import { ConnectWalletButton } from "@/components/connect-wallet-button";
import { Loader2 } from "lucide-react";

/* ── Inner layout that consumes the wallet context ── */

function DashboardInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { publicKey, token } = useWallet();

  /* Redirect to /login if not authenticated */
  useEffect(() => {
    // Wait a tick so the provider has time to restore from localStorage
    const timer = setTimeout(() => {
      const storedToken = localStorage.getItem("subfy_token");
      if (!storedToken) {
        router.replace("/login");
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [token, router]);

  /* Show a loader while checking auth */
  if (!publicKey && !token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950">
        <Loader2 className="size-8 animate-spin text-main-400" />
      </div>
    );
  }

  return (
    <DashboardLayout
      activeHref={pathname}
      onNavigate={(href) => router.push(href)}
      userSlot={<ConnectWalletButton />}
    >
      {children}
    </DashboardLayout>
  );
}

/* ── Root dashboard layout with provider ──────────── */

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WalletProvider>
      <DashboardInner>{children}</DashboardInner>
    </WalletProvider>
  );
}
