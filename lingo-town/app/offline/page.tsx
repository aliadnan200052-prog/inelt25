import type { Metadata } from "next";
import { LogoMark } from "@/components/illustrations/LogoMark";
import { OfflineRetry } from "./OfflineRetry";

export const metadata: Metadata = { title: "Offline" };

/** Precached by the service worker; shown when a page isn't available offline. */
export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[420px] flex-col items-center justify-center gap-4 px-6 text-center">
      <LogoMark size={64} />
      <h1 className="font-display text-xl font-semibold text-ink">The town is quiet right now</h1>
      <p className="text-base text-muted">
        You&rsquo;re offline. Places you&rsquo;ve already visited still work. Reconnect to open new ones.
      </p>
      <p lang="ar" dir="rtl" className="font-arabic text-sm text-muted">
        لا يوجد اتصال بالإنترنت. الأماكن التي زرتها ما زالت متاحة.
      </p>
      <OfflineRetry />
    </main>
  );
}
