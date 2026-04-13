import { ALL_TYPES, capitalize } from "./constants";
import type { TeamSlot, PokemonMove } from "./types";
import { getDualTypeEffectiveness, getAttackEffectiveness } from "./type-effectiveness";

/** Calculate how many team members are weak to each type */
export function calculateTeamWeaknesses(
  slots: TeamSlot[]
): Record<string, number> {
  const weaknesses: Record<string, number> = {};
  for (const type of ALL_TYPES) {
    weaknesses[type] = 0;
  }

  for (const slot of slots) {
    if (!slot.pokemon) continue;
    const defenderTypes = slot.pokemon.types.map((t) => t.name);

    for (const atkType of ALL_TYPES) {
      const effectiveness = getDualTypeEffectiveness(atkType, defenderTypes);
      if (effectiveness > 1) {
        weaknesses[atkType]++;
      }
    }
  }

  return weaknesses;
}

/** Calculate how many team members resist each type */
export function calculateTeamResistances(
  slots: TeamSlot[]
): Record<string, number> {
  const resistances: Record<string, number> = {};
  for (const type of ALL_TYPES) {
    resistances[type] = 0;
  }

  for (const slot of slots) {
    if (!slot.pokemon) continue;
    const defenderTypes = slot.pokemon.types.map((t) => t.name);

    for (const atkType of ALL_TYPES) {
      const effectiveness = getDualTypeEffectiveness(atkType, defenderTypes);
      if (effectiveness < 1) {
        resistances[atkType]++;
      }
    }
  }

  return resistances;
}

/** Check offensive type coverage — which types can the team hit super-effectively */
export function calculateTeamCoverage(
  slots: TeamSlot[]
): Record<string, boolean> {
  const coverage: Record<string, boolean> = {};
  for (const type of ALL_TYPES) {
    coverage[type] = false;
  }

  for (const slot of slots) {
    if (!slot.pokemon) continue;

    // Check STAB types (the Pokemon's own types are always coverage)
    for (const pokeType of slot.pokemon.types) {
      for (const defType of ALL_TYPES) {
        if (getAttackEffectiveness(pokeType.name, defType) > 1) {
          coverage[defType] = true;
        }
      }
    }

    // Check move types
    for (const move of slot.moves) {
      if (!move || move.damageClass === "status") continue;
      for (const defType of ALL_TYPES) {
        if (getAttackEffectiveness(move.type, defType) > 1) {
          coverage[defType] = true;
        }
      }
    }
  }

  return coverage;
}

/** Calculate a 0-100 coverage score */
export function calculateCoverageScore(slots: TeamSlot[]): number {
  const filledSlots = slots.filter((s) => s.pokemon);
  if (filledSlots.length === 0) return 0;

  const coverage = calculateTeamCoverage(slots);
  const weaknesses = calculateTeamWeaknesses(slots);

  // Offensive score: how many types can we hit super-effectively?
  const coveredTypes = Object.values(coverage).filter(Boolean).length;
  const offensiveScore = (coveredTypes / ALL_TYPES.length) * 50;

  // Defensive score: fewer shared weaknesses = better
  const maxWeaknessCount = Math.max(...Object.values(weaknesses), 1);
  const totalWeakness = Object.values(weaknesses).reduce((a, b) => a + b, 0);
  const avgWeakness = totalWeakness / ALL_TYPES.length;
  const defensiveScore = Math.max(0, (1 - avgWeakness / filledSlots.length) * 50);

  // Bonus for no critical weaknesses (3+ members weak to same type)
  const criticalWeaknesses = Object.values(weaknesses).filter((v) => v >= 3).length;
  const criticalPenalty = criticalWeaknesses * 5;

  return Math.round(Math.min(100, Math.max(0, offensiveScore + defensiveScore - criticalPenalty)));
}

/** Generate team improvement suggestions */
export function getTeamSuggestions(slots: TeamSlot[]): string[] {
  const suggestions: string[] = [];
  const filledSlots = slots.filter((s) => s.pokemon);

  if (filledSlots.length === 0) {
    suggestions.push("Add Pokemon to your team to get started!");
    return suggestions;
  }

  const weaknesses = calculateTeamWeaknesses(slots);
  const coverage = calculateTeamCoverage(slots);

  // Find critical weaknesses (3+ members weak)
  for (const type of ALL_TYPES) {
    if (weaknesses[type] >= 3) {
      const counterTypes = getCounterSuggestions(type);
      suggestions.push(
        `Danger! ${weaknesses[type]} Pokemon are weak to ${capitalize(type)}. Consider adding a ${counterTypes} type.`
      );
    }
  }

  // Find moderate weaknesses (2 members weak)
  for (const type of ALL_TYPES) {
    if (weaknesses[type] === 2 && suggestions.length < 4) {
      suggestions.push(
        `Watch out — 2 Pokemon are weak to ${capitalize(type)}.`
      );
    }
  }

  // Find uncovered types
  const uncoveredTypes = ALL_TYPES.filter((t) => !coverage[t]);
  if (uncoveredTypes.length > 0 && uncoveredTypes.length <= 5) {
    suggestions.push(
      `Your team can't hit ${uncoveredTypes.map(capitalize).join(", ")} super-effectively. Add moves or Pokemon to cover these types.`
    );
  } else if (uncoveredTypes.length > 5) {
    suggestions.push(
      `${uncoveredTypes.length} types aren't covered offensively. Add more diverse move types.`
    );
  }

  if (uncoveredTypes.length === 0 && suggestions.length === 0) {
    suggestions.push("Great team! You have full offensive type coverage.");
  }

  if (filledSlots.length < 6) {
    suggestions.push(
      `You have ${6 - filledSlots.length} empty slot${filledSlots.length < 5 ? "s" : ""}. Fill your team for better coverage!`
    );
  }

  return suggestions.slice(0, 4);
}

function getCounterSuggestions(weakType: string): string {
  const counters: Record<string, string> = {
    fire: "Water, Ground, or Rock",
    water: "Grass or Electric",
    grass: "Fire, Ice, or Poison",
    electric: "Ground",
    ice: "Fire, Fighting, or Steel",
    fighting: "Flying, Psychic, or Fairy",
    poison: "Ground or Psychic",
    ground: "Water, Grass, or Ice",
    flying: "Electric, Ice, or Rock",
    psychic: "Bug, Ghost, or Dark",
    bug: "Fire, Flying, or Rock",
    rock: "Water, Grass, Fighting, or Steel",
    ghost: "Ghost or Dark",
    dragon: "Ice, Dragon, or Fairy",
    dark: "Fighting, Bug, or Fairy",
    steel: "Fire, Fighting, or Ground",
    fairy: "Poison or Steel",
    normal: "Fighting",
  };
  return counters[weakType] ?? "a different";
}

/** Find synergy pairs — Pokemon that cover each other's weaknesses */
export function findSynergyPairs(
  slots: TeamSlot[]
): { pokemon1: string; pokemon2: string; reason: string }[] {
  const pairs: { pokemon1: string; pokemon2: string; reason: string }[] = [];
  const filled = slots.filter((s) => s.pokemon);

  for (let i = 0; i < filled.length; i++) {
    for (let j = i + 1; j < filled.length; j++) {
      const a = filled[i].pokemon!;
      const b = filled[j].pokemon!;
      const aTypes = a.types.map((t) => t.name);
      const bTypes = b.types.map((t) => t.name);

      // Check if B resists what A is weak to
      const aWeaknesses = ALL_TYPES.filter(
        (t) => getDualTypeEffectiveness(t, aTypes) > 1
      );
      const bResists = ALL_TYPES.filter(
        (t) => getDualTypeEffectiveness(t, bTypes) < 1
      );
      const bCoversA = aWeaknesses.filter((t) => bResists.includes(t));

      if (bCoversA.length >= 2) {
        pairs.push({
          pokemon1: capitalize(b.name),
          pokemon2: capitalize(a.name),
          reason: `${capitalize(b.name)} resists ${bCoversA.map(capitalize).join(", ")} — covering ${capitalize(a.name)}'s weaknesses`,
        });
      }
    }
  }

  return pairs.slice(0, 3);
}
