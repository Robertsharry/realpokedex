"use client";

import { useState, useEffect, useDeferredValue, useRef } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { TypeBadge } from "@/components/pokemon/TypeBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Loader2 } from "lucide-react";
import { getFullPokemonIndex, getPokemon } from "@/lib/pokeapi";
import { capitalize, getArtworkUrl, ALL_TYPES, TYPE_COLORS, formatPokemonId } from "@/lib/constants";
import type { Pokemon, PokemonIndexEntry } from "@/lib/types";

const RENDER_BATCH = 80;

interface PokemonPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (pokemon: Pokemon) => void;
}

export function PokemonPicker({ open, onClose, onSelect }: PokemonPickerProps) {
  const [index, setIndex] = useState<PokemonIndexEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selecting, setSelecting] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [renderCount, setRenderCount] = useState(RENDER_BATCH);
  const deferredSearch = useDeferredValue(search);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Load full index when opened
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const fullIndex = await getFullPokemonIndex();
        if (!cancelled) setIndex(fullIndex);
      } catch {
        if (!cancelled) setError("Failed to load Pokemon list. Please try again.");
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [open]);

  // Reset render count and scroll on filter change
  useEffect(() => {
    setRenderCount(RENDER_BATCH);
    scrollRef.current?.scrollTo(0, 0);
  }, [deferredSearch, typeFilter]);

  // Infinite scroll within the modal
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setRenderCount((prev) => prev + RENDER_BATCH);
        }
      },
      { root: scrollRef.current, rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [index, deferredSearch, typeFilter]);

  const filtered = index.filter((p) => {
    if (deferredSearch) {
      const q = deferredSearch.toLowerCase();
      if (!p.name.includes(q) && !p.id.toString().startsWith(q)) return false;
    }
    if (typeFilter && !p.types.some((t) => t.name === typeFilter)) return false;
    return true;
  });

  const visible = filtered.slice(0, renderCount);

  async function handleSelect(entry: PokemonIndexEntry) {
    setSelecting(entry.id);
    try {
      const full = await getPokemon(entry.id);
      onSelect(full);
      onClose();
    } catch {
      setError(`Failed to load ${capitalize(entry.name)}. Tap to try again.`);
    }
    setSelecting(null);
  }

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden border-border/80 bg-card">
        <DialogHeader>
          <DialogTitle className="text-lg font-extrabold">Choose a Pokemon</DialogTitle>
          <p className="text-xs text-muted-foreground">
            {loading ? "Loading..." : error ? "" : `${filtered.length} of ${index.length} Pokemon`}
          </p>
          {error && (
            <p className="text-xs font-medium text-red-400">{error}</p>
          )}
        </DialogHeader>

        {/* Search & Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search all 1025 Pokemon..."
              className="pl-10"
              autoFocus
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground"
          >
            <option value="">All Types</option>
            {ALL_TYPES.map((t) => (
              <option key={t} value={t}>{capitalize(t)}</option>
            ))}
          </select>
        </div>

        {/* Pokemon Grid */}
        <div ref={scrollRef} className="mt-2 max-h-[55vh] overflow-y-auto rounded-lg">
          {loading ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {Array.from({ length: 16 }, (_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No Pokemon found
            </p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {visible.map((p) => {
                  const primaryType = p.types[0]?.name ?? "normal";
                  const colors = TYPE_COLORS[primaryType] ?? TYPE_COLORS.normal;
                  const isSelecting = selecting === p.id;

                  return (
                    <button
                      key={p.id}
                      onClick={() => handleSelect(p)}
                      disabled={selecting !== null}
                      className="group relative flex flex-col items-center rounded-xl border border-border/40 p-2 transition-all hover:scale-[1.03] hover:border-primary/40 hover:shadow-md active:scale-95 disabled:opacity-50"
                      style={{
                        background: `linear-gradient(145deg, ${colors.bg}12, transparent)`,
                      }}
                    >
                      {isSelecting && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/70">
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        </div>
                      )}
                      {/* ID badge */}
                      <span className="absolute left-1.5 top-1 text-[9px] font-bold tabular-nums text-muted-foreground/50">
                        {formatPokemonId(p.id)}
                      </span>
                      <div className="relative mt-2 h-16 w-16 sm:h-18 sm:w-18">
                        <Image
                          src={getArtworkUrl(p.id)}
                          alt={p.name}
                          fill
                          sizes="72px"
                          className="object-contain drop-shadow-md transition-transform group-hover:scale-110"
                          loading="lazy"
                        />
                      </div>
                      <span className="mt-1 w-full truncate text-center text-xs font-bold text-foreground">
                        {capitalize(p.name)}
                      </span>
                      <div className="mt-0.5 flex gap-0.5">
                        {p.types.map((t) => (
                          <TypeBadge key={t.name} type={t.name} size="sm" />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
              {/* Sentinel for more rendering */}
              {renderCount < filtered.length && (
                <div ref={sentinelRef} className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" />
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
