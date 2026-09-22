import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/nav/Providers";
import { ServiceWorker } from "@/components/nav/ServiceWorker";
import { dmSans, fraunces, plexArabic } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Lingo Town", template: "%s · Lingo Town" },
  description: "Practise real English conversations in a cozy little town.",
  applicationName: "Lingo Town",
  appleWebApp: { capable: true, title: "Lingo Town", statusBarStyle: "default" },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6F1E7" },
    { media: "(prefers-color-scheme: dark)", color: "#141B1C" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${fraunces.variable} ${dmSans.variable} ${plexArabic.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh">
        <Providers>{children}</Providers>
        <ServiceWorker />
      </body>
    </html>
  );
}
