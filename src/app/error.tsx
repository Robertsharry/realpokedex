"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <div className="mb-4 text-6xl">?!</div>
      <h2 className="mb-2 text-2xl font-bold">A wild error appeared!</h2>
      <p className="mb-6 text-muted-foreground">
        Something went wrong. The error has been noted.
      </p>
      <Button onClick={reset}>Try Again</Button>
    </div>
  );
}
