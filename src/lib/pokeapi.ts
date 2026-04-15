import type {
  Pokemon,
  PokemonIndexEntry,
  PokemonListItem,
  PokemonSpecies,
  EvolutionNode,
  PokemonMove,
  AbilityDetail,
  PokemonType,
  RegionEncounters,
  EncounterArea,
  EncounterVersion,
} from "./types";
import { getArtworkUrl, getSpriteUrl, getCryUrl, capitalize, ALL_TYPES, TOTAL_POKEMON } from "./constants";

const BASE_URL = "https://pokeapi.co/api/v2";

// Client-side cache for repeated fetches
const clientCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

async function cachedFetch<T>(url: string): Promise<T> {
  const cached = clientCache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const data = await res.json();
  clientCache.set(url, { data, timestamp: Date.now() });
  return data as T;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractId(url: string): number {
  const parts = url.replace(/\/$/, "").split("/");
  return parseInt(parts[parts.length - 1], 10);
}

export async function getPokemonList(
  offset = 0,
  limit = 20
): Promise<PokemonListItem[]> {
  const data = await cachedFetch<{
    results: { name: string; url: string }[];
  }>(`${BASE_URL}/pokemon?offset=${offset}&limit=${limit}`);

  return data.results.map((p) => ({
    id: extractId(p.url),
    name: p.name,
  }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getPokemon(id: number | string): Promise<Pokemon> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await cachedFetch<any>(`${BASE_URL}/pokemon/${id}`);

  return {
    id: data.id,
    name: data.name,
    types: data.types.map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (t: any) => ({ slot: t.slot, name: t.type.name })
    ),
    stats: data.stats.map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (s: any) => ({
        name: s.stat.name,
        baseStat: s.base_stat,
        effort: s.effort,
      })
    ),
    abilities: data.abilities.map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (a: any) => ({
        name: a.ability.name,
        isHidden: a.is_hidden,
        slot: a.slot,
      })
    ),
    height: data.height,
    weight: data.weight,
    baseExperience: data.base_experience,
    sprites: {
      front: getSpriteUrl(data.id),
      artwork: getArtworkUrl(data.id),
    },
    cryUrl: getCryUrl(data.id),
  };
}

export async function getPokemonSpecies(
  id: number | string
): Promise<PokemonSpecies> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await cachedFetch<any>(`${BASE_URL}/pokemon-species/${id}`);

  const englishFlavor = data.flavor_text_entries
    .filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (e: any) => e.language.name === "en"
    )
    .pop();

  const englishGenus = data.genera.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (g: any) => g.language.name === "en"
  );

  const evoChainUrl = data.evolution_chain?.url;

  return {
    flavorText: englishFlavor
      ? englishFlavor.flavor_text.replace(/[\n\f\r]/g, " ")
      : "",
    genus: englishGenus ? englishGenus.genus : "",
    generation: data.generation?.name?.replace("generation-", "").toUpperCase() ?? "",
    evolutionChainId: evoChainUrl ? extractId(evoChainUrl) : null,
    genderRate: data.gender_rate,
    captureRate: data.capture_rate,
    eggGroups: data.egg_groups.map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (e: any) => capitalize(e.name)
    ),
    habitat: data.habitat ? capitalize(data.habitat.name) : null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseEvolutionChain(chain: any): EvolutionNode {
  const speciesId = extractId(chain.species.url);
  const details = chain.evolution_details?.[0];

  return {
    speciesName: chain.species.name,
    speciesId,
    minLevel: details?.min_level ?? null,
    trigger: details?.trigger?.name ?? null,
    item: details?.item?.name ?? details?.held_item?.name ?? null,
    evolvesTo: chain.evolves_to.map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (e: any) => parseEvolutionChain(e)
    ),
  };
}

export async function getEvolutionChain(
  chainId: number
): Promise<EvolutionNode> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await cachedFetch<any>(
    `${BASE_URL}/evolution-chain/${chainId}`
  );
  return parseEvolutionChain(data.chain);
}

export async function getMoveDetails(name: string): Promise<PokemonMove> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await cachedFetch<any>(`${BASE_URL}/move/${name}`);

  const englishEffect = data.effect_entries.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (e: any) => e.language.name === "en"
  );

  const meta = data.meta;

  return {
    name: data.name,
    type: data.type.name,
    power: data.power,
    accuracy: data.accuracy,
    pp: data.pp,
    damageClass: data.damage_class.name,
    effectShort: englishEffect?.short_effect ?? "",
    learnMethod: "",
    levelLearnedAt: 0,
    priority: data.priority ?? 0,
    drain: meta?.drain ?? 0,
    healing: meta?.healing ?? 0,
    critRate: meta?.crit_rate ?? 0,
    minHits: meta?.min_hits ?? null,
    maxHits: meta?.max_hits ?? null,
    flinchChance: meta?.flinch_chance ?? 0,
  };
}

export async function getPokemonMoves(
  id: number | string
): Promise<{ name: string; learnMethod: string; levelLearnedAt: number }[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await cachedFetch<any>(`${BASE_URL}/pokemon/${id}`);

  const moves: { name: string; learnMethod: string; levelLearnedAt: number }[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const m of data.moves) {
    // Get the most recent version group detail
    const versionDetails = m.version_group_details;
    const latest = versionDetails[versionDetails.length - 1];

    if (latest) {
      moves.push({
        name: m.move.name,
        learnMethod: latest.move_learn_method.name,
        levelLearnedAt: latest.level_learned_at,
      });
    }
  }

  return moves;
}

export async function getAbilityDetails(
  name: string
): Promise<AbilityDetail> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await cachedFetch<any>(`${BASE_URL}/ability/${name}`);

  const englishEffect = data.effect_entries.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (e: any) => e.language.name === "en"
  );
  const englishFlavorText = data.flavor_text_entries
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((e: any) => e.language.name === "en")
    .pop();

  return {
    name: data.name,
    effectShort: englishFlavorText?.flavor_text ?? englishEffect?.short_effect ?? "",
    effectLong: englishEffect?.effect ?? "",
  };
}

/** Batch fetch basic Pokemon data for the grid (including types) */
export async function getPokemonBatch(
  ids: number[]
): Promise<Pokemon[]> {
  const results = await Promise.all(ids.map((id) => getPokemon(id)));
  return results;
}

/** Fetch a lightweight index of ALL Pokemon (id, name, types).
 *  Uses 1 list call + 18 type endpoint calls = 19 requests total.
 *  All responses are cached by the service worker for offline use. */
let indexPromise: Promise<PokemonIndexEntry[]> | null = null;

export function getFullPokemonIndex(): Promise<PokemonIndexEntry[]> {
  if (indexPromise) return indexPromise;
  indexPromise = fetchFullIndex();
  return indexPromise;
}

async function fetchFullIndex(): Promise<PokemonIndexEntry[]> {
  // Step 1: Get all Pokemon names and IDs (1 request)
  const list = await cachedFetch<{
    results: { name: string; url: string }[];
  }>(`${BASE_URL}/pokemon?limit=${TOTAL_POKEMON}&offset=0`);

  // Step 2: Get type data from all 18 type endpoints in parallel
  const typePromises = ALL_TYPES.map(async (typeName) => {
    const data = await cachedFetch<{
      pokemon: { pokemon: { url: string }; slot: number }[];
    }>(`${BASE_URL}/type/${typeName}`);
    return { typeName, pokemon: data.pokemon };
  });

  const typeResults = await Promise.all(typePromises);

  // Build a map: pokemonId -> PokemonType[]
  const typeMap = new Map<number, PokemonType[]>();
  for (const { typeName, pokemon } of typeResults) {
    for (const p of pokemon) {
      const id = extractId(p.pokemon.url);
      if (id > TOTAL_POKEMON) continue;
      if (!typeMap.has(id)) typeMap.set(id, []);
      typeMap.get(id)!.push({ slot: p.slot, name: typeName });
    }
  }

  // Build entries, sorted by slot so primary type comes first
  return list.results
    .map((p) => {
      const id = extractId(p.url);
      const types = typeMap.get(id) ?? [];
      types.sort((a, b) => a.slot - b.slot);
      return { id, name: p.name, types };
    })
    .filter((e) => e.id <= TOTAL_POKEMON)
    .sort((a, b) => a.id - b.id);
}

/** Fetch where a Pokemon can be found, grouped by region.
 *  Chain: /pokemon/{id}/encounters → /location-area → /location (for region). */
export async function getPokemonEncounters(
  id: number | string
): Promise<RegionEncounters[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await cachedFetch<any[]>(
    `${BASE_URL}/pokemon/${id}/encounters`
  );

  if (!raw || raw.length === 0) return [];

  // 1. Collect unique location-area URLs
  const areaUrls = [...new Set(raw.map((e) => e.location_area.url as string))];

  // 2. Batch-fetch location-areas to get parent location URLs (all cached)
  const areaResults = await Promise.all(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    areaUrls.map((url) => cachedFetch<any>(url))
  );

  // Map area URL → parent location URL & name
  const areaToLocation = new Map<string, { url: string; name: string }>();
  areaUrls.forEach((areaUrl, i) => {
    const loc = areaResults[i].location;
    areaToLocation.set(areaUrl, { url: loc.url, name: loc.name });
  });

  // 3. Get unique location URLs and fetch them for region data
  const uniqueLocationUrls = [
    ...new Set([...areaToLocation.values()].map((l) => l.url)),
  ];
  const locationResults = await Promise.all(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    uniqueLocationUrls.map((url) => cachedFetch<any>(url))
  );

  const locationToRegion = new Map<string, string>();
  uniqueLocationUrls.forEach((url, i) => {
    locationToRegion.set(url, locationResults[i].region?.name ?? "unknown");
  });

  // 4. Transform raw encounters into clean grouped data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const encounterAreas: (EncounterArea & { region: string })[] = raw.map((enc) => {
    const areaUrl = enc.location_area.url as string;
    const areaName = enc.location_area.name as string;
    const parentLoc = areaToLocation.get(areaUrl)!;
    const region = locationToRegion.get(parentLoc.url) ?? "unknown";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const versions: EncounterVersion[] = enc.version_details.map((vd: any) => ({
      version: vd.version.name as string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      methods: vd.encounter_details.map((ed: any) => ({
        method: ed.method.name as string,
        chance: ed.chance as number,
        minLevel: ed.min_level as number,
        maxLevel: ed.max_level as number,
      })),
    }));

    return {
      locationName: parentLoc.name,
      areaName,
      versions,
      region,
    };
  });

  // 5. Group by region
  const regionMap = new Map<string, EncounterArea[]>();
  for (const area of encounterAreas) {
    const { region, ...rest } = area;
    if (!regionMap.has(region)) regionMap.set(region, []);
    regionMap.get(region)!.push(rest);
  }

  // Sort regions in a logical order and return
  const regionOrder = [
    "kanto", "johto", "hoenn", "sinnoh", "unova",
    "kalos", "alola", "galar", "paldea", "hisui",
  ];
  return [...regionMap.entries()]
    .sort(([a], [b]) => {
      const ai = regionOrder.indexOf(a);
      const bi = regionOrder.indexOf(b);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    })
    .map(([region, areas]) => ({ region, areas }));
}
