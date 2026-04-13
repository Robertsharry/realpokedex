"use client";

import { useEffect, useState, useCallback, useDeferredValue, useRef } from "react";
import { PokemonCard } from "./PokemonCard";
import { PokemonCardSkeleton } from "./PokemonCardSkeleton";
import { getPokemonBatch, getPokemonList } from "@/lib/pokeapi";
import { useFavoritesStore } from "@/stores/favorites-store";
import { GENERATIONS, ALL_TYPES, capitalize, TOTAL_POKEMON } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, SlidersHorizontal } from "lucide-react";
import type { Pokemon } from "@/lib/types";

const BATCH_SIZE = 40;

export function PokemonGrid() {
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [genFilter, setGenFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("id");
  const [showFilters, setShowFilters] = useState(false);
  const deferredSearch = useDeferredValue(search);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { favoriteIds } = useFavoritesStore();

  // Initial load
  useEffect(() => {
    async function loadInitial() {
      setLoading(true);
      try {
        const list = await getPokemonList(0, BATCH_SIZE);
        const ids = list.map((p) => p.id);
        const batch = await getPokemonBatch(ids);
        setAllPokemon(batch);
        setOffset(BATCH_SIZE);
        setHasMore(BATCH_SIZE < TOTAL_POKEMON);
      } catch (err) {
        console.error("Failed to load Pokemon:", err);
      }
      setLoading(false);
    }
    loadInitial();
  }, []);

  // Infinite scroll
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const list = await getPokemonList(offset, BATCH_SIZE);
      if (list.length === 0) {
        setHasMore(false);
        return;
      }
      const ids = list.map((p) => p.id);
      const batch = await getPokemonBatch(ids);
      setAllPokemon((prev) => [...prev, ...batch]);
      setOffset((prev) => prev + BATCH_SIZE);
      if (offset + BATCH_SIZE >= TOTAL_POKEMON) {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Failed to load more Pokemon:", err);
    }
    setLoadingMore(false);
  }, [offset, loadingMore, hasMore]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { rootMargin: "400px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore, hasMore, loadingMore]);

  // Filter and sort
  const filtered = allPokemon.filter((p) => {
    // Search filter
    if (deferredSearch) {
      const q = deferredSearch.toLowerCase();
      const matchesName = p.name.toLowerCase().includes(q);
      const matchesId = p.id.toString() === q || `#${p.id}` === q;
      if (!matchesName && !matchesId) return false;
    }

    // Type filter
    if (typeFilter && !p.types.some((t) => t.name === typeFilter)) return false;

    // Generation filter
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
      case "hp":
        return (b.stats.find((s) => s.name === "hp")?.baseStat ?? 0) - (a.stats.find((s) => s.name === "hp")?.baseStat ?? 0);
      case "attack":
        return (b.stats.find((s) => s.name === "attack")?.baseStat ?? 0) - (a.stats.find((s) => s.name === "attack")?.baseStat ?? 0);
      case "total":
        return b.stats.reduce((sum, s) => sum + s.baseStat, 0) - a.stats.reduce((sum, s) => sum + s.baseStat, 0);
      default:
        return a.id - b.id;
    }
  });

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
              placeholder="Search by name or number..."
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
              <option value="hp">Sort: HP</option>
              <option value="attack">Sort: Attack</option>
              <option value="total">Sort: Total Stats</option>
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
          {hasActiveFilters
            ? `Showing ${sorted.length} of ${allPokemon.length} loaded Pokemon`
            : `${allPokemon.length} of ${TOTAL_POKEMON} Pokemon loaded`}
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
          {sorted.map((pokemon, i) => (
            <PokemonCard key={pokemon.id} pokemon={pokemon} index={i} />
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      {hasMore && !loading && !hasActiveFilters && (
        <div ref={sentinelRef} className="flex justify-center py-8">
          {loadingMore && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {Array.from({ length: 10 }, (_, i) => (
                <PokemonCardSkeleton key={i} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
