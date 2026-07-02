import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CookieConsent } from "@/components/cookie-consent";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const description =
  "Enkel kalender, direkte bookinger, smartere markedsføring og skatt på autopilot — for norske hytte- og leilighetseiere.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Verta — Full kontroll over dine utleieeiendommer",
    template: "%s — Verta",
  },
  description,
  keywords: [
    "hytteutleie",
    "Airbnb-forvaltning",
    "korttidsutleie",
    "booking",
    "skatt utleie",
    "smartlås",
    "Norge",
  ],
  openGraph: {
    type: "website",
    locale: "nb_NO",
    url: siteUrl,
    siteName: "Verta",
    title: "Verta — Full kontroll over dine utleieeiendommer",
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: "Verta — Full kontroll over dine utleieeiendommer",
    description,
  },
  appleWebApp: {
    capable: true,
    title: "Verta",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#081b33",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="nb"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {children}
        <CookieConsent />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
