import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Whitelist",
    template: "%s | Whitelist",
  },
  description: "Join the Subfy whitelist to get early access to launches and updates.",
  alternates: {
    canonical: "/whitelist",
  },
};

export default function WhitelistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
