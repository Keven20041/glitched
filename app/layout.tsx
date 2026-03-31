import type { Metadata } from "next";
import { Geist_Mono, Orbitron, Rajdhani } from "next/font/google";
import Script from "next/script";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const performancePolyfill = `
    (function () {
      if (typeof window === "undefined") return;
      var perf = window.performance;
      if (!perf) return;
      if (typeof perf.clearMarks !== "function") {
        perf.clearMarks = function () {};
      }
      if (typeof perf.clearMeasures !== "function") {
        perf.clearMeasures = function () {};
      }
    })();
  `;

  return (
    <html
      lang="en"
      className={`${orbitron.variable} ${rajdhani.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <Script id="performance-api-polyfill" strategy="beforeInteractive">
          {performancePolyfill}
        </Script>
        {children}
      </body>
    </html>
  );
}
