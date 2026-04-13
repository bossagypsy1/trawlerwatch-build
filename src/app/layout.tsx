import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrawlerWatch — UK Vessel Monitoring",
  description:
    "Ecological monitoring of trawling activity in UK waters. Track fishing vessels, routes, and activity patterns.",
  keywords: ["trawler", "fishing vessel", "AIS", "vessel tracking", "UK waters"],
  authors: [{ name: "TrawlerWatch" }],
  openGraph: {
    title: "TrawlerWatch",
    description: "Ecological monitoring of trawling activity in UK waters",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#020b18",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://a.basemaps.cartocdn.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
