import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const deploymentUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.VERCEL_PROJECT_PRODUCTION_URL ??
  process.env.VERCEL_URL ??
  "http://localhost:3000";

const siteUrl = deploymentUrl.startsWith("http")
  ? deploymentUrl
  : `https://${deploymentUrl}`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "FlightBoi",
  title: {
    default: "FlightBoi",
    template: "%s | FlightBoi",
  },
  description:
    "A cinematic browser flight game and aviation familiarization sandbox built with Next.js, Three.js, and React Three Fiber.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "FlightBoi",
    description:
      "Arcade flight wonder, Sky Academy familiarization, cockpit systems, and hidden neon runs in one browser-native Next.js game.",
    url: "/",
    siteName: "FlightBoi",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "FlightBoi cinematic arcade flight game with neon aircraft, grid, and aviation academy callouts",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FlightBoi",
    description:
      "Cinematic arcade flying meets aviation familiarization, cockpit systems, Sky Academy lessons, and Grid Run.",
    images: [
      {
        url: "/twitter-image",
        alt: "FlightBoi browser flight game social preview with a neon light-jet over a cinematic grid",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full overflow-hidden bg-background text-foreground">{children}</body>
    </html>
  );
}
