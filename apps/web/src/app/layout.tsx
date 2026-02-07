import { Sora, Outfit, Inter } from "next/font/google";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: "Subfy",
  description: "Subfy — Manage your plans and subscriptions seamlessly.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Subfy",
    description: "Subfy — Manage your plans and subscriptions seamlessly.",
    images: [
      {
        url: "/header.png",
        width: 1200,
        height: 630,
        alt: "Subfy",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Subfy",
    description: "Subfy — Manage your plans and subscriptions seamlessly.",
    images: ["/header.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className={`${sora.variable} ${outfit.variable} ${inter.variable}`}
    >
      <body className="font-sora">{children}</body>
    </html>
  );
}

