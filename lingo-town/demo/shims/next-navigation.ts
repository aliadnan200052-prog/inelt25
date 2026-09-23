import { useMemo } from "react";
import { back, canGoBack, navigate, useLocation } from "../router";

/** Stand-in for next/navigation backed by the demo's in-memory router. */
export function useRouter() {
  return {
    push: (href: string) => navigate(href),
    replace: (href: string) => navigate(href, "replace"),
    back: () => back(),
  };
}

export const usePathname = () => useLocation().path;

export function useSearchParams() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export { canGoBack };
