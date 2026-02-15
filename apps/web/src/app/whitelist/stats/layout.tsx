import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Whitelist Stats",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "/whitelist/stats",
  },
};

export default function WhitelistStatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
