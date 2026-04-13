"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { GitCompareArrows, Plus, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TypeBadge } from "@/components/pokemon/TypeBadge";
import { StatBarGroup } from "@/components/pokemon/StatBar";
import { PokemonPicker } from "@/components/team-builder/PokemonPicker";
import { useShinyStore } from "@/stores/shiny-store";
import { getArtworkUrl, capitalize, STAT_LABELS, STAT_COLORS } from "@/lib/constants";
import { getDualTypeEffectiveness } from "@/lib/type-effectiveness";
import type { Pokemon } from "@/lib/types";

export default function ComparePage() {
  const [pokemonA, setPokemonA] = useState<Pokemon | null>(null);
  const [pokemonB, setPokemonB] = useState<Pokemon | null>(null);
  const [picking, setPicking] = useState<"A" | "B" | null>(null);
  const { isShiny } = useShinyStore();

  function getTypeAdvantage(): string {
    if (!pokemonA || !pokemonB) return "";
    const aTypes = pokemonA.types.map((t) => t.name);
    const bTypes = pokemonB.types.map((t) => t.name);

    // Check if A can hit B super-effectively with STAB
    let aAdvantage = false;
    for (const at of aTypes) {
      if (getDualTypeEffectiveness(at, bTypes) > 1) {
        aAdvantage = true;
        break;
      }
    }

    // Check if B can hit A super-effectively with STAB
    let bAdvantage = false;
    for (const bt of bTypes) {
      if (getDualTypeEffectiveness(bt, aTypes) > 1) {
        bAdvantage = true;
        break;
      }
    }

    if (aAdvantage && !bAdvantage) return `${capitalize(pokemonA.name)} has type advantage!`;
    if (bAdvantage && !aAdvantage) return `${capitalize(pokemonB.name)} has type advantage!`;
    if (aAdvantage && bAdvantage) return "Both have type advantage - mutual threat!";
    return "Neutral type matchup";
  }

  const statNames = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <GitCompareArrows className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-extrabold">Compare Pokemon</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Compare stats, types, and matchups side by side.
        </p>
      </div>

      {/* Selection slots */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:gap-8">
        {/* Pokemon A */}
        <div className="text-center">
          {pokemonA ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative"
            >
              <button
                onClick={() => setPokemonA(null)}
                className="absolute right-0 top-0 z-10 rounded-full bg-destructive p-1 text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <div className={`relative mx-auto mb-3 h-40 w-40 ${isShiny(pokemonA.id) ? "animate-shiny-glow" : ""}`}>
                <Image
                  src={getArtworkUrl(pokemonA.id, isShiny(pokemonA.id))}
                  alt={pokemonA.name}
                  fill
                  sizes="160px"
                  className="object-contain drop-shadow-lg"
                />
                {isShiny(pokemonA.id) && (
                  <Sparkles className="absolute -right-1 -top-1 h-4 w-4 animate-sparkle fill-yellow-400 text-yellow-400" />
                )}
              </div>
              <h3 className="text-lg font-bold">{capitalize(pokemonA.name)}</h3>
              <div className="mt-1 flex justify-center gap-1">
                {pokemonA.types.map((t) => (
                  <TypeBadge key={t.name} type={t.name} size="sm" />
                ))}
              </div>
            </motion.div>
          ) : (
            <button
              onClick={() => setPicking("A")}
              className="flex h-56 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/50 transition-colors hover:border-primary/50 hover:bg-accent/30"
            >
              <Plus className="h-8 w-8 text-muted-foreground/40" />
              <span className="mt-2 text-sm text-muted-foreground">Select Pokemon</span>
            </button>
          )}
        </div>

        {/* Pokemon B */}
        <div className="text-center">
          {pokemonB ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative"
            >
              <button
                onClick={() => setPokemonB(null)}
                className="absolute right-0 top-0 z-10 rounded-full bg-destructive p-1 text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <div className={`relative mx-auto mb-3 h-40 w-40 ${isShiny(pokemonB.id) ? "animate-shiny-glow" : ""}`}>
                <Image
                  src={getArtworkUrl(pokemonB.id, isShiny(pokemonB.id))}
                  alt={pokemonB.name}
                  fill
                  sizes="160px"
                  className="object-contain drop-shadow-lg"
                />
                {isShiny(pokemonB.id) && (
                  <Sparkles className="absolute -right-1 -top-1 h-4 w-4 animate-sparkle fill-yellow-400 text-yellow-400" />
                )}
              </div>
              <h3 className="text-lg font-bold">{capitalize(pokemonB.name)}</h3>
              <div className="mt-1 flex justify-center gap-1">
                {pokemonB.types.map((t) => (
                  <TypeBadge key={t.name} type={t.name} size="sm" />
                ))}
              </div>
            </motion.div>
          ) : (
            <button
              onClick={() => setPicking("B")}
              className="flex h-56 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/50 transition-colors hover:border-primary/50 hover:bg-accent/30"
            >
              <Plus className="h-8 w-8 text-muted-foreground/40" />
              <span className="mt-2 text-sm text-muted-foreground">Select Pokemon</span>
            </button>
          )}
        </div>
      </div>

      {/* Type advantage */}
      {pokemonA && pokemonB && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-xl bg-primary/5 p-4 text-center"
        >
          <p className="text-sm font-bold text-primary">{getTypeAdvantage()}</p>
        </motion.div>
      )}

      {/* Stat Comparison */}
      {pokemonA && pokemonB && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border/50 p-6"
        >
          <h2 className="mb-6 text-lg font-bold">Stat Comparison</h2>

          {/* Radar chart (SVG) */}
          <div className="mb-8 flex justify-center">
            <svg viewBox="0 0 300 300" className="h-64 w-64">
              {/* Background hexagon layers */}
              {[1, 0.75, 0.5, 0.25].map((scale) => (
                <polygon
                  key={scale}
                  points={statNames
                    .map((_, i) => {
                      const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                      const r = 120 * scale;
                      return `${150 + r * Math.cos(angle)},${150 + r * Math.sin(angle)}`;
                    })
                    .join(" ")}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  className="text-border"
                />
              ))}

              {/* Axis lines */}
              {statNames.map((_, i) => {
                const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                return (
                  <line
                    key={i}
                    x1="150"
                    y1="150"
                    x2={150 + 120 * Math.cos(angle)}
                    y2={150 + 120 * Math.sin(angle)}
                    stroke="currentColor"
                    strokeWidth="0.5"
                    className="text-border"
                  />
                );
              })}

              {/* Pokemon A polygon */}
              <polygon
                points={statNames
                  .map((stat, i) => {
                    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                    const val = pokemonA.stats.find((s) => s.name === stat)?.baseStat ?? 0;
                    const r = (val / 255) * 120;
                    return `${150 + r * Math.cos(angle)},${150 + r * Math.sin(angle)}`;
                  })
                  .join(" ")}
                fill="rgba(99, 144, 240, 0.2)"
                stroke="#6390F0"
                strokeWidth="2"
              />

              {/* Pokemon B polygon */}
              <polygon
                points={statNames
                  .map((stat, i) => {
                    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                    const val = pokemonB.stats.find((s) => s.name === stat)?.baseStat ?? 0;
                    const r = (val / 255) * 120;
                    return `${150 + r * Math.cos(angle)},${150 + r * Math.sin(angle)}`;
                  })
                  .join(" ")}
                fill="rgba(238, 129, 48, 0.2)"
                stroke="#EE8130"
                strokeWidth="2"
              />

              {/* Labels */}
              {statNames.map((stat, i) => {
                const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                const r = 140;
                return (
                  <text
                    key={stat}
                    x={150 + r * Math.cos(angle)}
                    y={150 + r * Math.sin(angle)}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-muted-foreground text-[10px] font-bold"
                  >
                    {STAT_LABELS[stat]}
                  </text>
                );
              })}
            </svg>
          </div>

          {/* Legend */}
          <div className="mb-6 flex justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[#6390F0]" />
              <span>{capitalize(pokemonA.name)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[#EE8130]" />
              <span>{capitalize(pokemonB.name)}</span>
            </div>
          </div>

          {/* Bar comparison */}
          <div className="space-y-3">
            {statNames.map((stat) => {
              const aVal = pokemonA.stats.find((s) => s.name === stat)?.baseStat ?? 0;
              const bVal = pokemonB.stats.find((s) => s.name === stat)?.baseStat ?? 0;
              const max = Math.max(aVal, bVal, 1);

              return (
                <div key={stat} className="flex items-center gap-2">
                  <span className="w-8 text-right text-xs font-bold text-muted-foreground">
                    {STAT_LABELS[stat]}
                  </span>
                  <span className={`w-8 text-right text-xs font-bold tabular-nums ${aVal >= bVal ? "text-[#6390F0]" : "text-muted-foreground"}`}>
                    {aVal}
                  </span>
                  <div className="flex flex-1 gap-0.5">
                    <div className="flex h-4 flex-1 justify-end overflow-hidden rounded-l-full bg-muted/30">
                      <motion.div
                        className="rounded-l-full bg-[#6390F0]"
                        initial={{ width: 0 }}
                        animate={{ width: `${(aVal / max) * 100}%` }}
                        transition={{ duration: 0.6 }}
                      />
                    </div>
                    <div className="flex h-4 flex-1 overflow-hidden rounded-r-full bg-muted/30">
                      <motion.div
                        className="rounded-r-full bg-[#EE8130]"
                        initial={{ width: 0 }}
                        animate={{ width: `${(bVal / max) * 100}%` }}
                        transition={{ duration: 0.6 }}
                      />
                    </div>
                  </div>
                  <span className={`w-8 text-xs font-bold tabular-nums ${bVal >= aVal ? "text-[#EE8130]" : "text-muted-foreground"}`}>
                    {bVal}
                  </span>
                </div>
              );
            })}
            {/* Totals */}
            <div className="flex items-center gap-2 border-t border-border/50 pt-2">
              <span className="w-8 text-right text-xs font-bold text-muted-foreground">TOT</span>
              <span className="w-8 text-right text-xs font-extrabold tabular-nums">
                {pokemonA.stats.reduce((s, st) => s + st.baseStat, 0)}
              </span>
              <div className="flex-1" />
              <span className="w-8 text-xs font-extrabold tabular-nums">
                {pokemonB.stats.reduce((s, st) => s + st.baseStat, 0)}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Picker */}
      <PokemonPicker
        open={picking !== null}
        onClose={() => setPicking(null)}
        onSelect={(p) => {
          if (picking === "A") setPokemonA(p);
          else setPokemonB(p);
          setPicking(null);
        }}
      />
    </div>
  );
}
