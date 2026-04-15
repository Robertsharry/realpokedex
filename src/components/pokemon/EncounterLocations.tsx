"use client";

import { useState, useEffect } from "react";
import { MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getPokemonEncounters } from "@/lib/pokeapi";
import { capitalize } from "@/lib/constants";
import type { RegionEncounters } from "@/lib/types";

/** Region colors for visual distinction */
const REGION_COLORS: Record<string, string> = {
  kanto:  "#EE8130",
  johto:  "#7AC74C",
  hoenn:  "#6390F0",
  sinnoh: "#A8A77A",
  unova:  "#705746",
  kalos:  "#D685AD",
  alola:  "#F7D02C",
  galar:  "#735797",
  paldea: "#C22E28",
  hisui:  "#96D9D6",
};

/** Short labels for encounter methods */
const METHOD_LABELS: Record<string, string> = {
  walk: "Grass",
  "old-rod": "Old Rod",
  "good-rod": "Good Rod",
  "super-rod": "Super Rod",
  surf: "Surf",
  "rock-smash": "Rock Smash",
  headbutt: "Headbutt",
  "dark-grass": "Dark Grass",
  "grass-spots": "Shaking Grass",
  "cave-spots": "Dust Cloud",
  "bridge-spots": "Bridge Shadow",
  "super-rod-spots": "Fishing Spot",
  "surf-spots": "Rippling Water",
  gift: "Gift",
  "gift-egg": "Gift Egg",
  "only-one": "Static",
  "pokeflute": "Poke Flute",
  "headbutt-low": "Headbutt",
  "headbutt-normal": "Headbutt",
  "headbutt-high": "Headbutt",
  "squirt-bottle": "Squirt Bottle",
  "wailmer-pail": "Wailmer Pail",
  "seaweed": "Seaweed",
  "roaming-grass": "Roaming",
  "roaming-water": "Roaming",
};

/** Format a game version name nicely: "omega-ruby" → "Omega Ruby" */
function formatVersion(version: string): string {
  return version.split("-").map(capitalize).join(" ");
}

/** Format location name: "viridian-forest" → "Viridian Forest" */
function formatLocation(name: string): string {
  return name.split("-").map(capitalize).join(" ");
}

/** Deduplicate and condense game versions into a short list */
function condensedVersions(versions: { version: string }[]): string {
  const names = [...new Set(versions.map((v) => v.version))];
  // Group paired versions: red/blue, gold/silver, etc.
  if (names.length > 4) {
    return names.slice(0, 4).map(formatVersion).join(", ") + ` +${names.length - 4} more`;
  }
  return names.map(formatVersion).join(", ");
}

/** Get unique encounter methods across all versions for a location */
function uniqueMethods(versions: { methods: { method: string }[] }[]): string[] {
  const all = new Set<string>();
  for (const v of versions) {
    for (const m of v.methods) {
      all.add(m.method);
    }
  }
  return [...all];
}

/** Get level range across all versions for a location */
function levelRange(versions: { methods: { minLevel: number; maxLevel: number }[] }[]): string {
  let min = Infinity;
  let max = -Infinity;
  for (const v of versions) {
    for (const m of v.methods) {
      if (m.minLevel < min) min = m.minLevel;
      if (m.maxLevel > max) max = m.maxLevel;
    }
  }
  if (min === Infinity) return "";
  if (min === max) return `Lv.${min}`;
  return `Lv.${min}-${max}`;
}

interface EncounterLocationsProps {
  pokemonId: number;
}

export function EncounterLocations({ pokemonId }: EncounterLocationsProps) {
  const [data, setData] = useState<RegionEncounters[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(false);
      try {
        const encounters = await getPokemonEncounters(pokemonId);
        if (!cancelled) setData(encounters);
      } catch {
        if (!cancelled) setError(true);
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [pokemonId]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        Failed to load encounter data.
      </p>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border-2 border-current/10 p-6 text-center">
        <MapPin className="mx-auto mb-2 h-7 w-7 text-muted-foreground" />
        <p className="text-base font-bold">
          Not found in the wild
        </p>
        <p className="mt-1 text-sm font-medium text-muted-foreground">
          This Pokemon is obtained through gifts, events, or evolution.
        </p>
      </div>
    );
  }

  // Count total locations across all regions
  const totalAreas = data.reduce((sum, r) => sum + r.areas.length, 0);
  const PREVIEW_LIMIT = 3; // regions to show before "Show more"
  const showExpand = data.length > PREVIEW_LIMIT;
  const visibleRegions = expanded ? data : data.slice(0, PREVIEW_LIMIT);

  return (
    <div>
      <p className="mb-3 text-sm font-bold text-muted-foreground">
        Found in {totalAreas} location{totalAreas !== 1 ? "s" : ""} across{" "}
        {data.length} region{data.length !== 1 ? "s" : ""}
      </p>

      <div className="space-y-3">
        {visibleRegions.map((region) => {
          const color = REGION_COLORS[region.region] ?? "#888";
          return (
            <div
              key={region.region}
              className="overflow-hidden rounded-xl border-2 border-current/10"
            >
              {/* Region header */}
              <div
                className="flex items-center gap-2 px-4 py-2.5"
                style={{ background: `${color}25` }}
              >
                <div
                  className="h-3 w-3 rounded-full shadow-sm"
                  style={{ backgroundColor: color }}
                />
                <span className="text-base font-extrabold">
                  {capitalize(region.region)}
                </span>
                <span className="text-sm font-bold text-muted-foreground">
                  {region.areas.length} area{region.areas.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Location list */}
              <div className="divide-y divide-current/5">
                {region.areas.map((area) => {
                  const methods = uniqueMethods(area.versions);
                  const levels = levelRange(area.versions);
                  const games = condensedVersions(area.versions);

                  return (
                    <div key={area.areaName} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-base font-bold">
                            {formatLocation(area.locationName)}
                          </p>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {methods.map((method) => (
                              <span
                                key={method}
                                className="rounded-md bg-current/8 px-2 py-0.5 text-xs font-bold text-muted-foreground"
                              >
                                {METHOD_LABELS[method] ?? capitalize(method)}
                              </span>
                            ))}
                            {levels && (
                              <span className="rounded-md bg-primary/15 px-2 py-0.5 text-xs font-extrabold text-primary">
                                {levels}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <p className="mt-1.5 text-xs font-medium text-muted-foreground">
                        {games}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Show more/less toggle */}
      {showExpand && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-current/10 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-black/[0.04]"
        >
          {expanded ? (
            <>
              Show Less <ChevronUp className="h-3.5 w-3.5" />
            </>
          ) : (
            <>
              Show {data.length - PREVIEW_LIMIT} More Region{data.length - PREVIEW_LIMIT !== 1 ? "s" : ""}{" "}
              <ChevronDown className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
