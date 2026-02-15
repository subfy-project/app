import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
  description: "Connect your Stellar wallet to access your Subfy dashboard.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "/login",
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
