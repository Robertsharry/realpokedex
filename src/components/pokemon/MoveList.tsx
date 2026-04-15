"use client";

import { useState, useEffect } from "react";
import { TypeBadge } from "./TypeBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Swords, Sparkles, ShieldHalf, Star } from "lucide-react";
import { getPokemonMoves, getMoveDetails } from "@/lib/pokeapi";
import { capitalize } from "@/lib/constants";
import type { PokemonMove } from "@/lib/types";

interface MoveListProps {
  pokemonId: number;
  pokemonTypes: string[];
}

const CATEGORY_ICONS = {
  physical: Swords,
  special: Sparkles,
  status: ShieldHalf,
};

export function MoveList({ pokemonId, pokemonTypes }: MoveListProps) {
  const [moves, setMoves] = useState<PokemonMove[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("level-up");

  useEffect(() => {
    let cancelled = false;
    async function loadMoves() {
      setLoading(true);
      try {
        const moveList = await getPokemonMoves(pokemonId);

        // Batch load move details - limit to 50 at a time for performance
        const batchSize = 30;
        const allMoves: PokemonMove[] = [];

        for (let i = 0; i < Math.min(moveList.length, 100); i += batchSize) {
          const batch = moveList.slice(i, i + batchSize);
          const details = await Promise.all(
            batch.map(async (m) => {
              try {
                const detail = await getMoveDetails(m.name);
                return {
                  ...detail,
                  learnMethod: m.learnMethod,
                  levelLearnedAt: m.levelLearnedAt,
                };
              } catch {
                return null;
              }
            })
          );
          if (cancelled) return;
          allMoves.push(...details.filter((d): d is PokemonMove => d !== null));
        }

        if (!cancelled) setMoves(allMoves);
      } catch {
        if (!cancelled) setError(true);
      }
      if (!cancelled) setLoading(false);
    }
    loadMoves();
    return () => { cancelled = true; };
  }, [pokemonId]);

  const filteredMoves = moves.filter((m) => {
    if (search && !m.name.includes(search.toLowerCase().replace(/ /g, "-"))) return false;
    if (activeTab === "level-up") return m.learnMethod === "level-up";
    if (activeTab === "machine") return m.learnMethod === "machine";
    if (activeTab === "egg") return m.learnMethod === "egg";
    if (activeTab === "tutor") return m.learnMethod === "tutor";
    return true;
  });

  const sortedMoves = [...filteredMoves].sort((a, b) => {
    if (activeTab === "level-up") return a.levelLearnedAt - b.levelLearnedAt;
    return a.name.localeCompare(b.name);
  });

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Failed to load moves. Try refreshing the page.
      </p>
    );
  }

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 w-full justify-start">
          <TabsTrigger value="level-up">Level Up</TabsTrigger>
          <TabsTrigger value="machine">TM/HM</TabsTrigger>
          <TabsTrigger value="egg">Egg</TabsTrigger>
          <TabsTrigger value="tutor">Tutor</TabsTrigger>
        </TabsList>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search moves..."
            className="pl-10"
          />
        </div>

        <TabsContent value={activeTab} className="mt-0">
          {sortedMoves.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No moves found
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-base">
                <thead>
                  <tr className="border-b-2 border-current/10 text-sm font-extrabold uppercase tracking-wide text-muted-foreground">
                    {activeTab === "level-up" && <th className="px-3 py-2.5 text-left">Lv.</th>}
                    <th className="px-3 py-2.5 text-left">Move</th>
                    <th className="px-3 py-2.5 text-left">Type</th>
                    <th className="px-3 py-2.5 text-center">Cat.</th>
                    <th className="px-3 py-2.5 text-right">Pow</th>
                    <th className="px-3 py-2.5 text-right">Acc</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedMoves.map((move, i) => {
                    const isStab = pokemonTypes.includes(move.type);
                    const CategoryIcon = CATEGORY_ICONS[move.damageClass];
                    return (
                      <tr
                        key={`${move.name}-${i}`}
                        className="border-b border-current/5 transition-colors hover:bg-black/[0.04]"
                      >
                        {activeTab === "level-up" && (
                          <td className="px-3 py-2.5 font-mono text-sm font-bold tabular-nums text-muted-foreground">
                            {move.levelLearnedAt || "—"}
                          </td>
                        )}
                        <td className="px-3 py-2.5 font-bold">
                          <div className="flex items-center gap-2">
                            {isStab && (
                              <Star className="h-3.5 w-3.5 shrink-0 fill-yellow-500 text-yellow-500" />
                            )}
                            {capitalize(move.name.replace(/-/g, " "))}
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <TypeBadge type={move.type} size="md" />
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <CategoryIcon className="mx-auto h-5 w-5" />
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-extrabold tabular-nums">
                          {move.power ?? "—"}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-extrabold tabular-nums">
                          {move.accuracy ? `${move.accuracy}%` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
