"use client";

import { useEffect, useState, useDeferredValue, useRef } from "react";
import { PokemonCard } from "./PokemonCard";
import { PokemonCardSkeleton } from "./PokemonCardSkeleton";
import { getFullPokemonIndex } from "@/lib/pokeapi";
import { useFavoritesStore } from "@/stores/favorites-store";
import { GENERATIONS, ALL_TYPES, capitalize, TOTAL_POKEMON } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, SlidersHorizontal, CheckCircle2 } from "lucide-react";
import type { PokemonIndexEntry } from "@/lib/types";

const RENDER_BATCH = 80;

export function PokemonGrid() {
  const [pokemonIndex, setPokemonIndex] = useState<PokemonIndexEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [renderCount, setRenderCount] = useState(RENDER_BATCH);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [genFilter, setGenFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("id");
  const [showFilters, setShowFilters] = useState(false);
  const deferredSearch = useDeferredValue(search);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { favoriteIds } = useFavoritesStore();

  // Load full Pokemon index on mount (19 API calls, all cached by service worker)
  useEffect(() => {
    async function loadIndex() {
      setLoading(true);
      try {
        const index = await getFullPokemonIndex();
        setPokemonIndex(index);
      } catch (err) {
        console.error("Failed to load Pokemon index:", err);
      }
      setLoading(false);
    }
    loadIndex();
  }, []);

  // Filter against the FULL index (all 1025 Pokemon)
  const filtered = pokemonIndex.filter((p) => {
    if (deferredSearch) {
      const q = deferredSearch.toLowerCase();
      const matchesName = p.name.toLowerCase().includes(q);
      const matchesId = p.id.toString() === q || `#${p.id}` === q;
      if (!matchesName && !matchesId) return false;
    }
    if (typeFilter && !p.types.some((t) => t.name === typeFilter)) return false;
    if (genFilter) {
      const gen = GENERATIONS.find((g) => g.name === genFilter);
      if (gen && (p.id < gen.range[0] || p.id > gen.range[1])) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      default:
        return a.id - b.id;
    }
  });

  // Progressive rendering: show `renderCount` at a time, load more on scroll
  const visible = sorted.slice(0, renderCount);
  const hasMore = renderCount < sorted.length;

  // Reset render count when filters change
  useEffect(() => {
    setRenderCount(RENDER_BATCH);
  }, [deferredSearch, typeFilter, genFilter, sortBy]);

  // Intersection observer to render more cards as user scrolls
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setRenderCount((prev) => Math.min(prev + RENDER_BATCH, sorted.length));
        }
      },
      { rootMargin: "400px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, sorted.length]);

  const hasActiveFilters = typeFilter || genFilter || deferredSearch;

  return (
    <div>
      {/* Search and Filter Bar */}
      <div className="mb-6 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search all 1025 Pokemon by name or number..."
              className="pl-10"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <Button
            variant={showFilters ? "secondary" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
          </Button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-2 rounded-xl border border-border/50 bg-card/50 p-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
            >
              <option value="">All Types</option>
              {ALL_TYPES.map((t) => (
                <option key={t} value={t}>{capitalize(t)}</option>
              ))}
            </select>

            <select
              value={genFilter}
              onChange={(e) => setGenFilter(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
            >
              <option value="">All Generations</option>
              {GENERATIONS.map((g) => (
                <option key={g.name} value={g.name}>{g.name}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
            >
              <option value="id">Sort: Number</option>
              <option value="name">Sort: A-Z</option>
              <option value="name-desc">Sort: Z-A</option>
            </select>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTypeFilter("");
                  setGenFilter("");
                  setSearch("");
                  setSortBy("id");
                }}
                className="text-xs"
              >
                Clear All
              </Button>
            )}
          </div>
        )}

        {/* Results count */}
        <p className="text-sm text-muted-foreground">
          {loading ? (
            "Loading all Pokemon..."
          ) : hasActiveFilters ? (
            `Found ${sorted.length} of ${TOTAL_POKEMON} Pokemon`
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              All {TOTAL_POKEMON} Pokemon loaded
            </span>
          )}
          {favoriteIds.length > 0 && ` · ${favoriteIds.length} favorited`}
        </p>
      </div>

      {/* Pokemon Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 20 }, (_, i) => (
            <PokemonCardSkeleton key={i} />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-lg font-medium text-muted-foreground">No Pokemon found</p>
          <p className="mt-1 text-sm text-muted-foreground/70">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {visible.map((pokemon, i) => (
            <PokemonCard key={pokemon.id} pokemon={pokemon} index={i} />
          ))}
        </div>
      )}

      {/* Progressive render sentinel */}
      {hasMore && !loading && (
        <div ref={sentinelRef} className="flex justify-center py-8">
          <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 10 }, (_, i) => (
              <PokemonCardSkeleton key={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
