import "./globals.css";

export const metadata = {
  title: "Subfy",
  description: "Subfy web app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
