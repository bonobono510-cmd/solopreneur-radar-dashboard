import "./globals.css";

export const metadata = {
  title: "Solopreneur Radar",
  description: "Daily idea-discovery dashboard",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
