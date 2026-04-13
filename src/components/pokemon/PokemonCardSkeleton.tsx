import { Skeleton } from "@/components/ui/skeleton";

export function PokemonCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/50 p-4">
      <Skeleton className="mb-2 h-3 w-12" />
      <Skeleton className="mx-auto my-2 h-28 w-28 rounded-full" />
      <Skeleton className="mx-auto h-4 w-20" />
      <div className="mt-2 flex justify-center gap-1.5">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
    </div>
  );
}
