import { PokemonGrid } from "@/components/pokemon/PokemonGrid";
import { Zap } from "lucide-react";

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <div className="mb-8 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
          <Zap className="h-4 w-4" />
          1025 Pokemon
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Real<span className="text-primary">Pokedex</span>
        </h1>
        <p className="mt-2 text-muted-foreground">
          Your ultimate Pokemon companion. Search, explore, and build the perfect team.
        </p>
      </div>

      <PokemonGrid />
    </div>
  );
}
