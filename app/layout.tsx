import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Geist_Mono, Orbitron, Rajdhani } from "next/font/google";
import { cookies } from "next/headers";
import DropListNotification from "./components/drop-list-notification";
import CookieConsentBanner from "./components/cookie-consent-banner";
import SiteNavigation from "./components/site-navigation";
import CartNotification from "./components/cart-notification";
import "./globals.css";

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
});

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GLITCHED",
  description: "GLITCHED. performance tech accessories storefront",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const consentCookie = (await cookies()).get("glitched-cookie-consent")?.value ?? null;

  return (
    <html
      lang="en"
      className={`${orbitron.variable} ${rajdhani.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <SiteNavigation />
        {children}
        <CookieConsentBanner initialConsent={consentCookie} />
        <DropListNotification />
        <CartNotification />
        <Analytics />
      </body>
    </html>
  );
}
