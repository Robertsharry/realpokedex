export interface PokemonListItem {
  id: number;
  name: string;
}

export interface PokemonStat {
  name: string;
  baseStat: number;
  effort: number;
}

export interface PokemonType {
  slot: number;
  name: string;
}

export interface PokemonAbility {
  name: string;
  isHidden: boolean;
  slot: number;
}

export interface Pokemon {
  id: number;
  name: string;
  types: PokemonType[];
  stats: PokemonStat[];
  abilities: PokemonAbility[];
  height: number;
  weight: number;
  baseExperience: number;
  sprites: {
    front: string;
    artwork: string;
  };
  cryUrl: string;
}

export interface PokemonSpecies {
  flavorText: string;
  genus: string;
  generation: string;
  evolutionChainId: number | null;
  genderRate: number;
  captureRate: number;
  eggGroups: string[];
  habitat: string | null;
}

export interface EvolutionNode {
  speciesName: string;
  speciesId: number;
  minLevel: number | null;
  trigger: string | null;
  item: string | null;
  evolvesTo: EvolutionNode[];
}

export interface PokemonMove {
  name: string;
  type: string;
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  damageClass: "physical" | "special" | "status";
  effectShort: string;
  learnMethod: string;
  levelLearnedAt: number;
}

export interface AbilityDetail {
  name: string;
  effectShort: string;
  effectLong: string;
}

export interface TeamSlot {
  pokemon: Pokemon | null;
  moves: (PokemonMove | null)[];
  nickname: string;
}

export interface Team {
  id: string;
  name: string;
  slots: TeamSlot[];
  createdAt: number;
}
