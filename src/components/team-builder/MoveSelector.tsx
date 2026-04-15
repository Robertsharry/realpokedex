"use client";

import { useState, useEffect } from "react";
import { TypeBadge } from "@/components/pokemon/TypeBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Star, Swords, Sparkles, ShieldHalf, X } from "lucide-react";
import { getPokemonMoves, getMoveDetails } from "@/lib/pokeapi";
import { capitalize } from "@/lib/constants";
import type { Pokemon, PokemonMove, TeamSlot } from "@/lib/types";

interface MoveSelectorProps {
  slot: TeamSlot;
  onSetMove: (moveIndex: number, move: PokemonMove | null) => void;
}

export function MoveSelector({ slot, onSetMove }: MoveSelectorProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerMoveIndex, setPickerMoveIndex] = useState(0);
  const [availableMoves, setAvailableMoves] = useState<PokemonMove[]>([]);
  const [loadingMoves, setLoadingMoves] = useState(false);
  const [moveError, setMoveError] = useState(false);
  const [search, setSearch] = useState("");

  const pokemon = slot.pokemon;
  if (!pokemon) return null;

  const pokemonTypes = pokemon.types.map((t) => t.name);

  function openPicker(index: number) {
    setPickerMoveIndex(index);
    setPickerOpen(true);
    setSearch("");

    if (availableMoves.length === 0) {
      loadAvailableMoves();
    }
  }

  async function loadAvailableMoves() {
    if (!pokemon) return;
    setLoadingMoves(true);
    setMoveError(false);
    try {
      const moveList = await getPokemonMoves(pokemon.id);
      const batchSize = 20;
      const allMoves: PokemonMove[] = [];

      for (let i = 0; i < Math.min(moveList.length, 80); i += batchSize) {
        const batch = moveList.slice(i, i + batchSize);
        const details = await Promise.all(
          batch.map(async (m) => {
            try {
              const detail = await getMoveDetails(m.name);
              return { ...detail, learnMethod: m.learnMethod, levelLearnedAt: m.levelLearnedAt };
            } catch {
              return null;
            }
          })
        );
        allMoves.push(...details.filter((d): d is PokemonMove => d !== null));
      }

      // Sort: STAB moves first, then by power
      allMoves.sort((a, b) => {
        const aStab = pokemonTypes.includes(a.type) ? 1 : 0;
        const bStab = pokemonTypes.includes(b.type) ? 1 : 0;
        if (bStab !== aStab) return bStab - aStab;
        return (b.power ?? 0) - (a.power ?? 0);
      });

      setAvailableMoves(allMoves);
    } catch {
      setMoveError(true);
    }
    setLoadingMoves(false);
  }

  const filteredMoves = availableMoves.filter((m) => {
    if (!search) return m.damageClass !== "status" || m.power !== null;
    return m.name.includes(search.toLowerCase().replace(/ /g, "-"));
  });

  const CATEGORY_ICONS = {
    physical: Swords,
    special: Sparkles,
    status: ShieldHalf,
  };

  return (
    <div>
      <h4 className="mb-2 text-xs font-bold text-muted-foreground">
        Moves for {capitalize(pokemon.name)}
      </h4>
      <div className="grid grid-cols-2 gap-2">
        {slot.moves.map((move, i) => (
          <button
            key={i}
            onClick={() => openPicker(i)}
            className={`flex items-center gap-2 rounded-lg border p-2 text-left text-xs transition-colors hover:bg-accent ${
              move ? "border-border/50" : "border-dashed border-border/30"
            }`}
          >
            {move ? (
              <>
                <TypeBadge type={move.type} size="sm" />
                <span className="flex-1 truncate font-medium">
                  {capitalize(move.name.replace(/-/g, " "))}
                </span>
                {pokemonTypes.includes(move.type) && (
                  <Star className="h-3 w-3 shrink-0 fill-yellow-500 text-yellow-500" />
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetMove(i, null);
                  }}
                  className="shrink-0"
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </>
            ) : (
              <span className="text-muted-foreground/50">Move {i + 1}</span>
            )}
          </button>
        ))}
      </div>

      {/* Move Picker Dialog */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-h-[70vh] max-w-md overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              Select Move {pickerMoveIndex + 1} for {capitalize(pokemon.name)}
            </DialogTitle>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search moves..."
              className="pl-10"
              autoFocus
            />
          </div>

          <div className="max-h-[45vh] overflow-y-auto">
            {loadingMoves ? (
              <div className="space-y-2">
                {Array.from({ length: 10 }, (_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : moveError ? (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">Failed to load moves.</p>
                <button
                  onClick={loadAvailableMoves}
                  className="mt-2 text-sm font-medium text-primary hover:underline"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredMoves.map((move) => {
                  const isStab = pokemonTypes.includes(move.type);
                  const CategoryIcon = CATEGORY_ICONS[move.damageClass];
                  return (
                    <button
                      key={move.name}
                      onClick={() => {
                        onSetMove(pickerMoveIndex, move);
                        setPickerOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg p-2 text-left text-sm transition-colors hover:bg-accent"
                    >
                      {isStab && (
                        <Star className="h-3.5 w-3.5 shrink-0 fill-yellow-500 text-yellow-500" />
                      )}
                      <TypeBadge type={move.type} size="sm" />
                      <span className="flex-1 truncate font-medium">
                        {capitalize(move.name.replace(/-/g, " "))}
                      </span>
                      <CategoryIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">
                        {move.power ?? "—"}
                      </span>
                      <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
                        {move.accuracy ? `${move.accuracy}%` : "—"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
