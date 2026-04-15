"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { PokemonCard } from "@/components/pokemon/PokemonCard";
import { PokemonCardSkeleton } from "@/components/pokemon/PokemonCardSkeleton";
import { useFavoritesStore } from "@/stores/favorites-store";
import { getFullPokemonIndex } from "@/lib/pokeapi";
import { GENERATIONS, TOTAL_POKEMON } from "@/lib/constants";
import type { PokemonIndexEntry } from "@/lib/types";

export default function FavoritesPage() {
  const { favoriteIds } = useFavoritesStore();
  const [allPokemon, setAllPokemon] = useState<PokemonIndexEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Load the lightweight index once (shared/cached across the app)
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const index = await getFullPokemonIndex();
        if (!cancelled) setAllPokemon(index);
      } catch {
        if (!cancelled) setError(true);
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Filter the full index by favorites — instant, no extra API calls
  const pokemon = allPokemon
    .filter((p) => favoriteIds.includes(p.id))
    .sort((a, b) => a.id - b.id);

  const completionPercent = Math.round((favoriteIds.length / TOTAL_POKEMON) * 100);

  // Generation breakdown
  const genBreakdown = GENERATIONS.map((gen) => {
    const total = gen.range[1] - gen.range[0] + 1;
    const collected = favoriteIds.filter(
      (id) => id >= gen.range[0] && id <= gen.range[1]
    ).length;
    return { ...gen, total, collected };
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-red-500" />
          <h1 className="text-2xl font-extrabold">Favorites</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Your personal Pokemon collection. Gotta catch &apos;em all!
        </p>
      </div>

      {/* Overall Progress */}
      <div className="mb-6 rounded-xl border border-border/50 p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-bold">Collection Progress</span>
          <span className="text-sm font-bold text-primary">
            {favoriteIds.length} / {TOTAL_POKEMON}
          </span>
        </div>
        <Progress value={completionPercent} className="h-3" />
        <p className="mt-1 text-xs text-muted-foreground">
          {completionPercent}% complete
        </p>
      </div>

      {/* Generation Breakdown */}
      <div className="mb-8 grid grid-cols-3 gap-2 sm:grid-cols-3 lg:grid-cols-9">
        {genBreakdown.map((gen) => (
          <div
            key={gen.name}
            className="rounded-lg border border-border/50 p-2 text-center"
          >
            <p className="text-[10px] font-bold text-muted-foreground">
              {gen.name.split(" - ")[0]}
            </p>
            <p className="text-sm font-bold">
              {gen.collected}/{gen.total}
            </p>
            <Progress
              value={(gen.collected / gen.total) * 100}
              className="mt-1 h-1.5"
            />
          </div>
        ))}
      </div>

      {/* Favorites Grid */}
      {error ? (
        <div className="py-20 text-center">
          <p className="text-lg font-medium text-red-400">A wild error appeared!</p>
          <p className="mt-1 text-sm text-muted-foreground">Failed to load Pokemon data. Try refreshing.</p>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: Math.min(favoriteIds.length, 10) || 4 }, (_, i) => (
            <PokemonCardSkeleton key={i} />
          ))}
        </div>
      ) : pokemon.length === 0 ? (
        <div className="py-20 text-center">
          <Heart className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
          <p className="text-lg font-medium text-muted-foreground">
            No favorites yet
          </p>
          <p className="mt-1 text-sm text-muted-foreground/70">
            Start exploring and tap the heart icon to add Pokemon to your collection!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {pokemon.map((p, i) => (
            <PokemonCard key={p.id} pokemon={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
