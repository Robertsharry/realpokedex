import type {
  Pokemon,
  PokemonListItem,
  PokemonSpecies,
  EvolutionNode,
  PokemonMove,
  AbilityDetail,
} from "./types";
import { getArtworkUrl, getSpriteUrl, getCryUrl, capitalize } from "./constants";

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
