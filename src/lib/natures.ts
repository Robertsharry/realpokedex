import type { PokemonStat } from "./types";

export interface Nature {
  name: string;
  increased: string | null;  // stat name boosted (+10%)
  decreased: string | null;  // stat name lowered (-10%)
}

/** All 25 Pokemon natures. Stat names match PokeAPI format. */
export const NATURES: Nature[] = [
  // Neutral natures (no effect)
  { name: "Hardy",   increased: null,              decreased: null },
  { name: "Docile",  increased: null,              decreased: null },
  { name: "Serious", increased: null,              decreased: null },
  { name: "Bashful", increased: null,              decreased: null },
  { name: "Quirky",  increased: null,              decreased: null },
  // +Attack
  { name: "Lonely",  increased: "attack",          decreased: "defense" },
  { name: "Brave",   increased: "attack",          decreased: "speed" },
  { name: "Adamant", increased: "attack",          decreased: "special-attack" },
  { name: "Naughty", increased: "attack",          decreased: "special-defense" },
  // +Defense
  { name: "Bold",    increased: "defense",         decreased: "attack" },
  { name: "Relaxed", increased: "defense",         decreased: "speed" },
  { name: "Impish",  increased: "defense",         decreased: "special-attack" },
  { name: "Lax",     increased: "defense",         decreased: "special-defense" },
  // +Speed
  { name: "Timid",   increased: "speed",           decreased: "attack" },
  { name: "Hasty",   increased: "speed",           decreased: "defense" },
  { name: "Jolly",   increased: "speed",           decreased: "special-attack" },
  { name: "Naive",   increased: "speed",           decreased: "special-defense" },
  // +Special Attack
  { name: "Modest",  increased: "special-attack",  decreased: "attack" },
  { name: "Mild",    increased: "special-attack",  decreased: "defense" },
  { name: "Quiet",   increased: "special-attack",  decreased: "speed" },
  { name: "Rash",    increased: "special-attack",  decreased: "special-defense" },
  // +Special Defense
  { name: "Calm",    increased: "special-defense",  decreased: "attack" },
  { name: "Gentle",  increased: "special-defense",  decreased: "defense" },
  { name: "Sassy",   increased: "special-defense",  decreased: "speed" },
  { name: "Careful", increased: "special-defense",  decreased: "special-attack" },
];

/** Short stat labels for compact display */
export const NATURE_STAT_LABELS: Record<string, string> = {
  "attack": "Atk",
  "defense": "Def",
  "special-attack": "Sp.Atk",
  "special-defense": "Sp.Def",
  "speed": "Spd",
};

/** The 5 non-HP stats affected by natures, in display order */
const NATURE_STATS = ["attack", "defense", "special-attack", "special-defense", "speed"];

/**
 * Recommend the best natures for a Pokemon based on its base stats.
 * Returns up to 3 recommended natures, scored by how well they
 * boost the Pokemon's key stats and dump its least useful ones.
 */
export function getRecommendedNatures(
  stats: PokemonStat[]
): { nature: Nature; reason: string }[] {
  const statMap = new Map(stats.map((s) => [s.name, s.baseStat]));

  const atk = statMap.get("attack") ?? 0;
  const spa = statMap.get("special-attack") ?? 0;
  const spd = statMap.get("speed") ?? 0;
  const def = statMap.get("defense") ?? 0;
  const spdef = statMap.get("special-defense") ?? 0;

  // Determine attacking style
  const isPhysical = atk > spa;
  const isMixed = Math.abs(atk - spa) < 15;
  const isSpeedster = spd >= Math.max(atk, spa, def, spdef);

  // Score each nature based on stat priorities
  const scored = NATURES
    .filter((n) => n.increased !== null) // skip neutral natures
    .map((nature) => {
      let score = 0;
      let reason = "";

      const boosted = nature.increased!;
      const dumped = nature.decreased!;
      const boostVal = statMap.get(boosted) ?? 0;
      const dumpVal = statMap.get(dumped) ?? 0;

      // Reward boosting high base stats (they benefit most from +10%)
      score += boostVal * 0.5;

      // Reward dumping low or unused stats
      if (isPhysical && dumped === "special-attack") {
        score += 40; // physical attackers don't need Sp.Atk
        reason = "Boosts " + NATURE_STAT_LABELS[boosted] + ", dumps unused Sp.Atk";
      } else if (!isPhysical && !isMixed && dumped === "attack") {
        score += 40; // special attackers don't need Attack
        reason = "Boosts " + NATURE_STAT_LABELS[boosted] + ", dumps unused Atk";
      } else {
        // Penalize dumping important stats
        score -= dumpVal * 0.3;
        reason = "+" + NATURE_STAT_LABELS[boosted] + " / -" + NATURE_STAT_LABELS[dumped];
      }

      // Bonus for boosting the Pokemon's primary role stat
      if (isPhysical && boosted === "attack") score += 25;
      if (!isPhysical && !isMixed && boosted === "special-attack") score += 25;
      if (isSpeedster && boosted === "speed") score += 20;

      // Bonus for Speed boost on fast Pokemon
      if (boosted === "speed" && spd >= 80) score += 15;

      // Small penalty for dumping defensive stats on bulky Pokemon
      if (dumped === "defense" && def >= 100) score -= 15;
      if (dumped === "special-defense" && spdef >= 100) score -= 15;

      if (!reason.startsWith("Boosts")) {
        // Generate a more descriptive reason
        if (boosted === "attack" && isPhysical) reason = "Best for physical attacks";
        else if (boosted === "special-attack" && !isPhysical) reason = "Best for special attacks";
        else if (boosted === "speed") reason = "Maximizes Speed";
        else if (boosted === "defense") reason = "Improves physical bulk";
        else if (boosted === "special-defense") reason = "Improves special bulk";
      }

      return { nature, score, reason };
    })
    .sort((a, b) => b.score - a.score);

  // Return top 3 distinct recommendations
  return scored.slice(0, 3).map(({ nature, reason }) => ({ nature, reason }));
}

/**
 * Get the full 5x5 nature chart data.
 * Returns natures organized by increased/decreased stat for the grid.
 */
export function getNatureGrid(): (Nature | null)[][] {
  const grid: (Nature | null)[][] = NATURE_STATS.map(() =>
    NATURE_STATS.map(() => null)
  );

  for (const nature of NATURES) {
    if (!nature.increased || !nature.decreased) continue;
    const row = NATURE_STATS.indexOf(nature.increased);
    const col = NATURE_STATS.indexOf(nature.decreased);
    if (row >= 0 && col >= 0) {
      grid[row][col] = nature;
    }
  }

  return grid;
}
