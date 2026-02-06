"use client";

import { usePathname, useRouter } from "next/navigation";
import { DashboardLayout } from "@subfy/ui";

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <DashboardLayout
      activeHref={pathname}
      onNavigate={(href) => router.push(href)}
      username="User"
    >
      {children}
    </DashboardLayout>
  );
}
