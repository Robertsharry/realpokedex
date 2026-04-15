"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Star, TrendingUp, TrendingDown } from "lucide-react";
import { STAT_COLORS } from "@/lib/constants";
import {
  NATURES,
  NATURE_STAT_LABELS,
  getNatureGrid,
  getRecommendedNatures,
} from "@/lib/natures";
import type { PokemonStat } from "@/lib/types";

const NATURE_STATS_ORDER = ["attack", "defense", "special-attack", "special-defense", "speed"];

interface NatureChartProps {
  stats: PokemonStat[];
  pokemonName: string;
}

export function NatureChart({ stats, pokemonName }: NatureChartProps) {
  const [showFullGrid, setShowFullGrid] = useState(false);
  const recommendations = getRecommendedNatures(stats);
  const grid = getNatureGrid();

  return (
    <div>
      {/* Recommended Natures */}
      <div className="mb-4">
        <h4 className="mb-3 flex items-center gap-1.5 text-base font-extrabold">
          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
          Recommended Natures
        </h4>
        <div className="space-y-2.5">
          {recommendations.map(({ nature, reason }, i) => (
            <div
              key={nature.name}
              className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 ${
                i === 0
                  ? "border-primary/40 bg-primary/10"
                  : "border-current/10 bg-white/5"
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`text-base font-extrabold ${i === 0 ? "text-primary" : ""}`}>
                    {nature.name}
                  </span>
                  {i === 0 && (
                    <span className="rounded bg-primary/25 px-2 py-0.5 text-[10px] font-extrabold text-primary">
                      BEST
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm font-medium text-muted-foreground">{reason}</p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {nature.increased && (
                  <span
                    className="flex items-center gap-0.5 rounded-md px-2 py-1 font-extrabold"
                    style={{
                      backgroundColor: `${STAT_COLORS[nature.increased] ?? "#888"}30`,
                      color: STAT_COLORS[nature.increased] ?? "#888",
                    }}
                  >
                    <TrendingUp className="h-3.5 w-3.5" />
                    {NATURE_STAT_LABELS[nature.increased]}
                  </span>
                )}
                {nature.decreased && (
                  <span className="flex items-center gap-0.5 rounded-md bg-red-500/20 px-2 py-1 font-extrabold text-red-400">
                    <TrendingDown className="h-3.5 w-3.5" />
                    {NATURE_STAT_LABELS[nature.decreased]}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Expandable Full Nature Grid */}
      <button
        onClick={() => setShowFullGrid(!showFullGrid)}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-current/10 py-2.5 text-sm font-bold text-muted-foreground transition-colors hover:bg-black/[0.04]"
      >
        {showFullGrid ? "Hide" : "Show"} Full Nature Chart
        {showFullGrid ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
      </button>

      {showFullGrid && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[400px] text-xs sm:text-sm">
            <thead>
              <tr>
                <th className="px-1 py-1.5 text-left text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-green-400" />
                    <span className="hidden sm:inline">Boost</span> ↓ / <span className="hidden sm:inline">Lower</span> →
                    <TrendingDown className="h-3 w-3 text-red-400" />
                  </div>
                </th>
                {NATURE_STATS_ORDER.map((stat) => (
                  <th
                    key={stat}
                    className="px-1 py-1.5 text-center font-bold"
                    style={{ color: STAT_COLORS[stat] }}
                  >
                    {NATURE_STAT_LABELS[stat]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {NATURE_STATS_ORDER.map((rowStat, rowIdx) => (
                <tr key={rowStat} className="border-t border-border/30">
                  <td
                    className="px-1 py-1.5 font-bold"
                    style={{ color: STAT_COLORS[rowStat] }}
                  >
                    {NATURE_STAT_LABELS[rowStat]}
                  </td>
                  {NATURE_STATS_ORDER.map((colStat, colIdx) => {
                    const nature = grid[rowIdx][colIdx];
                    const isRecommended = nature && recommendations.some(
                      (r) => r.nature.name === nature.name
                    );
                    const isBest = nature && recommendations[0]?.nature.name === nature.name;
                    const isDiagonal = rowIdx === colIdx;

                    return (
                      <td
                        key={colStat}
                        className={`px-1.5 py-2 text-center font-bold transition-colors ${
                          isDiagonal
                            ? "bg-current/5 text-muted-foreground/50"
                            : isBest
                              ? "rounded-md bg-primary/20 font-extrabold text-primary"
                              : isRecommended
                                ? "rounded-md bg-primary/10 font-extrabold text-primary"
                                : ""
                        }`}
                      >
                        {isDiagonal ? "—" : nature?.name ?? "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Legend */}
          <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-400" /> Row = stat boosted (+10%)
            </span>
            <span className="flex items-center gap-1">
              <TrendingDown className="h-3 w-3 text-red-400" /> Column = stat lowered (-10%)
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-primary" /> = Recommended
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
