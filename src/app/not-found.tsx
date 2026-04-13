import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <div className="mb-4 text-6xl">404</div>
      <h2 className="mb-2 text-2xl font-bold">Page not found!</h2>
      <p className="mb-6 text-muted-foreground">
        This route hasn&apos;t been discovered yet.
      </p>
      <Link href="/">
        <Button>Back to Pokedex</Button>
      </Link>
    </div>
  );
}
