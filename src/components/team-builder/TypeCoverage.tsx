"use client";

import { TypeBadge } from "@/components/pokemon/TypeBadge";
import { ALL_TYPES, capitalize } from "@/lib/constants";
import { getAttackEffectiveness } from "@/lib/type-effectiveness";
import type { TeamSlot } from "@/lib/types";

interface TypeCoverageProps {
  slots: TeamSlot[];
}

export function TypeCoverage({ slots }: TypeCoverageProps) {
  const filledSlots = slots.filter((s) => s.pokemon);

  if (filledSlots.length === 0) {
    return (
      <div className="rounded-xl border border-border/50 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Add Pokemon to see type coverage
        </p>
      </div>
    );
  }

  // For each defending type, check which team members can hit it super-effectively
  const coverageMap: Record<string, { covered: boolean; coveredBy: string[] }> = {};

  for (const defType of ALL_TYPES) {
    const coveredBy: string[] = [];

    for (const slot of filledSlots) {
      const pokemon = slot.pokemon!;
      // Check STAB types
      for (const pokeType of pokemon.types) {
        if (getAttackEffectiveness(pokeType.name, defType) > 1) {
          coveredBy.push(capitalize(pokemon.name));
          break;
        }
      }
      // Check move types
      for (const move of slot.moves) {
        if (move && move.damageClass !== "status") {
          if (getAttackEffectiveness(move.type, defType) > 1) {
            if (!coveredBy.includes(capitalize(pokemon.name))) {
              coveredBy.push(capitalize(pokemon.name));
            }
            break;
          }
        }
      }
    }

    coverageMap[defType] = { covered: coveredBy.length > 0, coveredBy };
  }

  const coveredCount = Object.values(coverageMap).filter((v) => v.covered).length;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold">Offensive Coverage</h3>
        <span className="text-xs text-muted-foreground">
          {coveredCount}/{ALL_TYPES.length} types covered
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
        {ALL_TYPES.map((type) => {
          const info = coverageMap[type];
          return (
            <div
              key={type}
              className={`flex flex-col items-center rounded-lg p-2 transition-colors ${
                info.covered
                  ? "bg-green-500/10 ring-1 ring-green-500/20"
                  : "bg-red-500/5 ring-1 ring-red-500/10"
              }`}
              title={
                info.covered
                  ? `Covered by: ${info.coveredBy.join(", ")}`
                  : `No coverage against ${capitalize(type)}`
              }
            >
              <TypeBadge type={type} size="sm" />
              <span className={`mt-1 text-[10px] font-medium ${
                info.covered ? "text-green-400" : "text-red-400"
              }`}>
                {info.covered ? "Covered" : "Gap"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
