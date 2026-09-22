"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, X } from "lucide-react";
import { IconButton } from "@/components/ui/primitives";

type Props = {
  title?: string;
  /** Where "back" goes when there's no history (deep link / PWA launch). */
  fallbackHref: string;
  icon?: "back" | "close";
  right?: React.ReactNode;
  children?: React.ReactNode;
};

export function TopBar({ title, fallbackHref, icon = "back", right, children }: Props) {
  const router = useRouter();
  const goBack = () => {
    if (window.history.length > 1) router.back();
    else router.push(fallbackHref);
  };

  return (
    <header className="sticky top-0 z-30 -mx-4 bg-cream/95 px-4 pt-safe backdrop-blur-xl backdrop-saturate-150">
      <div className="flex h-14 items-center gap-2">
        <IconButton label={icon === "close" ? "Close" : "Back"} tone="clear" onClick={goBack} className="-ml-2">
          {icon === "close" ? <X className="size-5" aria-hidden /> : <ChevronLeft className="size-6" aria-hidden />}
        </IconButton>
        <div className="min-w-0 flex-1 truncate text-center text-sm font-bold text-ink">{title}</div>
        <div className="flex min-w-9 justify-end">{right}</div>
      </div>
      {children}
    </header>
  );
}
