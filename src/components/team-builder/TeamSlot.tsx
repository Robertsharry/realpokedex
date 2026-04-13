"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Plus, X, Sparkles } from "lucide-react";
import { TypeBadge } from "@/components/pokemon/TypeBadge";
import { capitalize, getArtworkUrl } from "@/lib/constants";
import { useShinyStore } from "@/stores/shiny-store";
import type { TeamSlot as TeamSlotType } from "@/lib/types";

interface TeamSlotProps {
  slot: TeamSlotType;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onAdd: () => void;
}

export function TeamSlot({
  slot,
  index,
  isSelected,
  onSelect,
  onRemove,
  onAdd,
}: TeamSlotProps) {
  if (!slot.pokemon) {
    return (
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.05 }}
        onClick={onAdd}
        className="group flex h-36 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/50 transition-all hover:border-primary/50 hover:bg-accent/30"
      >
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Plus className="h-8 w-8 text-muted-foreground/40 transition-colors group-hover:text-primary" />
        </motion.div>
        <span className="mt-1 text-xs text-muted-foreground/40">
          Slot {index + 1}
        </span>
      </motion.button>
    );
  }

  const pokemon = slot.pokemon;
  const { isShiny } = useShinyStore();
  const shiny = isShiny(pokemon.id);
  const primaryType = pokemon.types[0]?.name ?? "normal";
  const totalStats = pokemon.stats.reduce((sum, s) => sum + s.baseStat, 0);
  const filledMoves = slot.moves.filter(Boolean).length;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className={`group relative h-36 cursor-pointer rounded-2xl border-2 p-3 transition-all ${
        isSelected
          ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
          : "border-border/50 hover:border-border hover:bg-accent/30"
      }`}
      onClick={onSelect}
    >
      {/* Remove button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute -right-1.5 -top-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-white opacity-0 transition-opacity group-hover:opacity-100"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="flex h-full items-center gap-3">
        {/* Sprite */}
        <div className={`relative h-20 w-20 shrink-0 ${shiny ? "animate-shiny-glow" : ""}`}>
          <Image
            src={getArtworkUrl(pokemon.id, shiny)}
            alt={`${pokemon.name}${shiny ? " (shiny)" : ""}`}
            fill
            sizes="80px"
            className="object-contain"
          />
          {shiny && (
            <Sparkles className="absolute -right-1 -top-1 h-3.5 w-3.5 animate-sparkle fill-yellow-400 text-yellow-400" />
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">
            {slot.nickname || capitalize(pokemon.name)}
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {pokemon.types.map((t) => (
              <TypeBadge key={t.name} type={t.name} size="sm" />
            ))}
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground">
            BST: {totalStats} · Moves: {filledMoves}/4
          </p>
        </div>
      </div>
    </motion.div>
  );
}
