"use client";

import { motion } from "framer-motion";
import { TypeBadge } from "@/components/pokemon/TypeBadge";
import { ALL_TYPES, capitalize, TYPE_COLORS } from "@/lib/constants";
import { calculateTeamWeaknesses } from "@/lib/team-analysis";
import type { TeamSlot } from "@/lib/types";

interface TeamWeaknessesProps {
  slots: TeamSlot[];
}

export function TeamWeaknesses({ slots }: TeamWeaknessesProps) {
  const filledSlots = slots.filter((s) => s.pokemon);

  if (filledSlots.length === 0) {
    return (
      <div className="rounded-xl border border-border/50 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Add Pokemon to see team weaknesses
        </p>
      </div>
    );
  }

  const weaknesses = calculateTeamWeaknesses(slots);

  // Sort by weakness count (most dangerous first)
  const sorted = ALL_TYPES
    .map((type) => ({ type, count: weaknesses[type] }))
    .sort((a, b) => b.count - a.count);

  const maxCount = Math.max(...sorted.map((s) => s.count), 1);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold">Defensive Weaknesses</h3>
        <span className="text-xs text-muted-foreground">
          {sorted.filter((s) => s.count >= 3).length} danger zones
        </span>
      </div>

      <div className="space-y-1.5">
        {sorted.map(({ type, count }) => {
          if (count === 0) return null;
          const danger = count >= 3 ? "high" : count >= 2 ? "medium" : "low";
          const barColor =
            danger === "high"
              ? "bg-red-500"
              : danger === "medium"
                ? "bg-yellow-500"
                : "bg-green-500";

          return (
            <div key={type} className="flex items-center gap-2">
              <div className="w-16 shrink-0">
                <TypeBadge type={type} size="sm" />
              </div>
              <div className="relative h-5 flex-1 overflow-hidden rounded-full bg-muted/30">
                <motion.div
                  className={`absolute inset-y-0 left-0 rounded-full ${barColor}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${(count / maxCount) * 100}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
              <span className={`w-6 text-right text-xs font-bold ${
                danger === "high"
                  ? "text-red-400"
                  : danger === "medium"
                    ? "text-yellow-400"
                    : "text-green-400"
              }`}>
                {count}
              </span>
            </div>
          );
        })}
        {sorted.every((s) => s.count === 0) && (
          <p className="py-4 text-center text-sm text-green-400">
            No weaknesses! Perfect defensive coverage.
          </p>
        )}
      </div>
    </div>
  );
}
