import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Subscribe",
    template: "%s | Subscribe",
  },
  description: "Checkout page for Subfy subscription plans.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SubscribeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
