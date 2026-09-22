"use client";

import { Button } from "@/components/ui/Button";

export function OfflineRetry() {
  return (
    <Button className="mt-2" onClick={() => window.location.reload()}>
      Try again
    </Button>
  );
}
