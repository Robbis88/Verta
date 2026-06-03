import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CookieConsent } from "@/components/cookie-consent";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Verta — Full kontroll over dine utleieeiendommer",
  description:
    "Enkel kalender, direkte bookinger, smartere markedsføring og skatt på autopilot — for norske hytte- og leilighetseiere.",
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
      </body>
    </html>
  );
}
