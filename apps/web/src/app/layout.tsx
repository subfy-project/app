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

export const metadata = {
  title: "Subfy",
  description: "Subfy — Manage your plans and subscriptions seamlessly.",
  openGraph: {
    title: "Subfy",
    description: "Subfy — Manage your plans and subscriptions seamlessly.",
    images: ["/header.png"],
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
