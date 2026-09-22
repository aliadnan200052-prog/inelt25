import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/nav/Providers";
import { themeBootScript } from "@/lib/theme-boot";
import { ServiceWorker } from "@/components/nav/ServiceWorker";
import { dmSans, fraunces, plexArabic } from "./fonts";
import "./globals.css";

/** iOS launch screens, rendered from the logo (see public/splash). */
const splashes = [
  [750, 1334, 2],
  [1170, 2532, 3],
  [1179, 2556, 3],
  [1284, 2778, 3],
  [1290, 2796, 3],
  [1536, 2048, 2],
] as const;

export const metadata: Metadata = {
  title: { default: "Lingo Town", template: "%s · Lingo Town" },
  description: "Practise real English conversations in a cozy little town.",
  applicationName: "Lingo Town",
  appleWebApp: {
    capable: true,
    title: "Lingo Town",
    statusBarStyle: "default",
    startupImage: splashes.map(([w, h, dpr]) => ({
      url: `/splash/splash-${w}x${h}.png`,
      media: `(device-width: ${w / dpr}px) and (device-height: ${h / dpr}px) and (-webkit-device-pixel-ratio: ${dpr}) and (orientation: portrait)`,
    })),
  },
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
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="min-h-dvh">
        <Providers>{children}</Providers>
        <ServiceWorker />
      </body>
    </html>
  );
}
