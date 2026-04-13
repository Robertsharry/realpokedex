import { ALL_TYPES, type PokemonTypeName } from "./constants";

// Complete 18x18 type effectiveness matrix
// Row = attacking type, Column = defending type
// Values: 2 = super effective, 0.5 = not very effective, 0 = immune, 1 = normal
const TYPE_CHART: Record<string, Record<string, number>> = {
  normal:   { normal: 1, fire: 1, water: 1, electric: 1, grass: 1, ice: 1, fighting: 1, poison: 1, ground: 1, flying: 1, psychic: 1, bug: 1, rock: 0.5, ghost: 0, dragon: 1, dark: 1, steel: 0.5, fairy: 1 },
  fire:     { normal: 1, fire: 0.5, water: 0.5, electric: 1, grass: 2, ice: 2, fighting: 1, poison: 1, ground: 1, flying: 1, psychic: 1, bug: 2, rock: 0.5, ghost: 1, dragon: 0.5, dark: 1, steel: 2, fairy: 1 },
  water:    { normal: 1, fire: 2, water: 0.5, electric: 1, grass: 0.5, ice: 1, fighting: 1, poison: 1, ground: 2, flying: 1, psychic: 1, bug: 1, rock: 2, ghost: 1, dragon: 0.5, dark: 1, steel: 1, fairy: 1 },
  electric: { normal: 1, fire: 1, water: 2, electric: 0.5, grass: 0.5, ice: 1, fighting: 1, poison: 1, ground: 0, flying: 2, psychic: 1, bug: 1, rock: 1, ghost: 1, dragon: 0.5, dark: 1, steel: 1, fairy: 1 },
  grass:    { normal: 1, fire: 0.5, water: 2, electric: 1, grass: 0.5, ice: 1, fighting: 1, poison: 0.5, ground: 2, flying: 0.5, psychic: 1, bug: 0.5, rock: 2, ghost: 1, dragon: 0.5, dark: 1, steel: 0.5, fairy: 1 },
  ice:      { normal: 1, fire: 0.5, water: 0.5, electric: 1, grass: 2, ice: 0.5, fighting: 1, poison: 1, ground: 2, flying: 2, psychic: 1, bug: 1, rock: 1, ghost: 1, dragon: 2, dark: 1, steel: 0.5, fairy: 1 },
  fighting: { normal: 2, fire: 1, water: 1, electric: 1, grass: 1, ice: 2, fighting: 1, poison: 0.5, ground: 1, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dragon: 1, dark: 2, steel: 2, fairy: 0.5 },
  poison:   { normal: 1, fire: 1, water: 1, electric: 1, grass: 2, ice: 1, fighting: 1, poison: 0.5, ground: 0.5, flying: 1, psychic: 1, bug: 1, rock: 0.5, ghost: 0.5, dragon: 1, dark: 1, steel: 0, fairy: 2 },
  ground:   { normal: 1, fire: 2, water: 1, electric: 2, grass: 0.5, ice: 1, fighting: 1, poison: 2, ground: 1, flying: 0, psychic: 1, bug: 0.5, rock: 2, ghost: 1, dragon: 1, dark: 1, steel: 2, fairy: 1 },
  flying:   { normal: 1, fire: 1, water: 1, electric: 0.5, grass: 2, ice: 1, fighting: 2, poison: 1, ground: 1, flying: 1, psychic: 1, bug: 2, rock: 0.5, ghost: 1, dragon: 1, dark: 1, steel: 0.5, fairy: 1 },
  psychic:  { normal: 1, fire: 1, water: 1, electric: 1, grass: 1, ice: 1, fighting: 2, poison: 2, ground: 1, flying: 1, psychic: 0.5, bug: 1, rock: 1, ghost: 1, dragon: 1, dark: 0, steel: 0.5, fairy: 1 },
  bug:      { normal: 1, fire: 0.5, water: 1, electric: 1, grass: 2, ice: 1, fighting: 0.5, poison: 0.5, ground: 1, flying: 0.5, psychic: 2, bug: 1, rock: 1, ghost: 0.5, dragon: 1, dark: 2, steel: 0.5, fairy: 0.5 },
  rock:     { normal: 1, fire: 2, water: 1, electric: 1, grass: 1, ice: 2, fighting: 0.5, poison: 1, ground: 0.5, flying: 2, psychic: 1, bug: 2, rock: 1, ghost: 1, dragon: 1, dark: 1, steel: 0.5, fairy: 1 },
  ghost:    { normal: 0, fire: 1, water: 1, electric: 1, grass: 1, ice: 1, fighting: 1, poison: 1, ground: 1, flying: 1, psychic: 2, bug: 1, rock: 1, ghost: 2, dragon: 1, dark: 0.5, steel: 1, fairy: 1 },
  dragon:   { normal: 1, fire: 1, water: 1, electric: 1, grass: 1, ice: 1, fighting: 1, poison: 1, ground: 1, flying: 1, psychic: 1, bug: 1, rock: 1, ghost: 1, dragon: 2, dark: 1, steel: 0.5, fairy: 0 },
  dark:     { normal: 1, fire: 1, water: 1, electric: 1, grass: 1, ice: 1, fighting: 0.5, poison: 1, ground: 1, flying: 1, psychic: 2, bug: 1, rock: 1, ghost: 2, dragon: 1, dark: 0.5, steel: 0.5, fairy: 0.5 },
  steel:    { normal: 1, fire: 0.5, water: 0.5, electric: 0.5, grass: 1, ice: 2, fighting: 1, poison: 1, ground: 1, flying: 1, psychic: 1, bug: 1, rock: 2, ghost: 1, dragon: 1, dark: 1, steel: 0.5, fairy: 2 },
  fairy:    { normal: 1, fire: 0.5, water: 1, electric: 1, grass: 1, ice: 1, fighting: 2, poison: 0.5, ground: 1, flying: 1, psychic: 1, bug: 1, rock: 1, ghost: 1, dragon: 2, dark: 2, steel: 0.5, fairy: 1 },
};

/** Get effectiveness of attackType against a single defenderType */
export function getAttackEffectiveness(attackType: string, defenderType: string): number {
  return TYPE_CHART[attackType]?.[defenderType] ?? 1;
}

/** Get effectiveness of attackType against a dual-type defender */
export function getDualTypeEffectiveness(attackType: string, defenderTypes: string[]): number {
  return defenderTypes.reduce((mult, dt) => mult * getAttackEffectiveness(attackType, dt), 1);
}

/** Get all weaknesses for a set of types (returns types that deal >1x damage) */
export function getTypeWeaknesses(defenderTypes: string[]): { type: string; multiplier: number }[] {
  return ALL_TYPES
    .map((atkType) => ({
      type: atkType,
      multiplier: getDualTypeEffectiveness(atkType, defenderTypes),
    }))
    .filter((e) => e.multiplier > 1);
}

/** Get all resistances for a set of types (returns types that deal <1x damage, excluding immunities) */
export function getTypeResistances(defenderTypes: string[]): { type: string; multiplier: number }[] {
  return ALL_TYPES
    .map((atkType) => ({
      type: atkType,
      multiplier: getDualTypeEffectiveness(atkType, defenderTypes),
    }))
    .filter((e) => e.multiplier > 0 && e.multiplier < 1);
}

/** Get all immunities for a set of types (returns types that deal 0x damage) */
export function getTypeImmunities(defenderTypes: string[]): string[] {
  return ALL_TYPES.filter(
    (atkType) => getDualTypeEffectiveness(atkType, defenderTypes) === 0
  );
}

/** Get full defensive profile for a type combination */
export function getDefensiveProfile(defenderTypes: string[]): Record<string, number> {
  const profile: Record<string, number> = {};
  for (const atkType of ALL_TYPES) {
    profile[atkType] = getDualTypeEffectiveness(atkType, defenderTypes);
  }
  return profile;
}

/** Get all types that an attacking type is super effective against */
export function getSuperEffectiveAgainst(attackType: string): PokemonTypeName[] {
  return ALL_TYPES.filter((dt) => getAttackEffectiveness(attackType, dt) >= 2);
}

/** Get all types that an attacking type is not very effective against */
export function getNotVeryEffectiveAgainst(attackType: string): PokemonTypeName[] {
  return ALL_TYPES.filter((dt) => {
    const eff = getAttackEffectiveness(attackType, dt);
    return eff > 0 && eff < 1;
  });
}

/** Get all types that an attacking type has no effect on */
export function getNoEffectAgainst(attackType: string): PokemonTypeName[] {
  return ALL_TYPES.filter((dt) => getAttackEffectiveness(attackType, dt) === 0);
}

/** Get the full type chart for display */
export function getFullTypeChart(): { attacker: string; defender: string; multiplier: number }[] {
  const chart: { attacker: string; defender: string; multiplier: number }[] = [];
  for (const atk of ALL_TYPES) {
    for (const def of ALL_TYPES) {
      chart.push({ attacker: atk, defender: def, multiplier: getAttackEffectiveness(atk, def) });
    }
  }
  return chart;
}
