"use client";

import { useState, useEffect, useDeferredValue } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { TypeBadge } from "@/components/pokemon/TypeBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import { getPokemonBatch, getPokemonList } from "@/lib/pokeapi";
import { capitalize, getArtworkUrl, ALL_TYPES } from "@/lib/constants";
import type { Pokemon } from "@/lib/types";

interface PokemonPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (pokemon: Pokemon) => void;
}

export function PokemonPicker({ open, onClose, onSelect }: PokemonPickerProps) {
  const [pokemon, setPokemon] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      // Load first 200 Pokemon for quick picking
      try {
        const list = await getPokemonList(0, 200);
        const ids = list.map((p) => p.id);
        const batch = await getPokemonBatch(ids);
        if (!cancelled) setPokemon(batch);
      } catch (err) {
        console.error("Failed to load Pokemon for picker:", err);
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [open]);

  const filtered = pokemon.filter((p) => {
    if (deferredSearch) {
      const q = deferredSearch.toLowerCase();
      if (!p.name.includes(q) && !p.id.toString().startsWith(q)) return false;
    }
    if (typeFilter && !p.types.some((t) => t.name === typeFilter)) return false;
    return true;
  });

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>Choose a Pokemon</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or number..."
              className="pl-10"
              autoFocus
            />
          </div>
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
        </div>

        <div className="mt-2 max-h-[50vh] overflow-y-auto">
          {loading ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {Array.from({ length: 16 }, (_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No Pokemon found
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onSelect(p);
                    onClose();
                  }}
                  className="flex flex-col items-center rounded-xl p-2 transition-colors hover:bg-accent"
                >
                  <div className="relative h-14 w-14">
                    <Image
                      src={getArtworkUrl(p.id)}
                      alt={p.name}
                      fill
                      sizes="56px"
                      className="object-contain"
                    />
                  </div>
                  <span className="mt-1 truncate text-xs font-medium">
                    {capitalize(p.name)}
                  </span>
                  <div className="mt-0.5 flex gap-0.5">
                    {p.types.map((t) => (
                      <TypeBadge key={t.name} type={t.name} size="sm" />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
