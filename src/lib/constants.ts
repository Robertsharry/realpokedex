export const TYPE_COLORS: Record<string, { bg: string; text: string; light: string; border: string }> = {
  normal:   { bg: "#A8A77A", text: "#6D6B4E", light: "#C6C5A0", border: "#929172" },
  fire:     { bg: "#EE8130", text: "#9C4A0C", light: "#F5AD78", border: "#D96B1B" },
  water:    { bg: "#6390F0", text: "#2A518C", light: "#94B4F5", border: "#4A7AE8" },
  electric: { bg: "#F7D02C", text: "#8A7210", light: "#FADF6E", border: "#E0BA14" },
  grass:    { bg: "#7AC74C", text: "#3D6E1F", light: "#A4DA83", border: "#62B338" },
  ice:      { bg: "#96D9D6", text: "#4A8A87", light: "#B8E8E6", border: "#7ACCC8" },
  fighting: { bg: "#C22E28", text: "#7A1B17", light: "#D86862", border: "#A82521" },
  poison:   { bg: "#A33EA1", text: "#612360", light: "#C275C0", border: "#8C3489" },
  ground:   { bg: "#E2BF65", text: "#8A7330", light: "#ECD68D", border: "#CDA94B" },
  flying:   { bg: "#A98FF3", text: "#5B45B5", light: "#C4B3F7", border: "#9177E8" },
  psychic:  { bg: "#F95587", text: "#A81E4B", light: "#FB89AB", border: "#F03370" },
  bug:      { bg: "#A6B91A", text: "#5E6B0C", light: "#C3D24E", border: "#8FA410" },
  rock:     { bg: "#B6A136", text: "#6E611D", light: "#CCBA5E", border: "#9D8B2B" },
  ghost:    { bg: "#735797", text: "#42305E", light: "#9A82B5", border: "#604882" },
  dragon:   { bg: "#6F35FC", text: "#3C12B0", light: "#9B6EFD", border: "#5A1EE8" },
  dark:     { bg: "#705746", text: "#3E2F25", light: "#967B6A", border: "#5D473A" },
  steel:    { bg: "#B7B7CE", text: "#62627A", light: "#D1D1DE", border: "#A0A0BC" },
  fairy:    { bg: "#D685AD", text: "#8C4070", light: "#E5AAC7", border: "#C76E98" },
};

export const STAT_COLORS: Record<string, string> = {
  hp: "#FF5959",
  attack: "#F5AC78",
  defense: "#FAE078",
  "special-attack": "#9DB7F5",
  "special-defense": "#A7DB8D",
  speed: "#FA92B2",
};

export const STAT_LABELS: Record<string, string> = {
  hp: "HP",
  attack: "ATK",
  defense: "DEF",
  "special-attack": "SPA",
  "special-defense": "SPD",
  speed: "SPE",
};

export const STAT_MAX = 255;

export const GENERATIONS: { name: string; range: [number, number] }[] = [
  { name: "Gen I - Kanto", range: [1, 151] },
  { name: "Gen II - Johto", range: [152, 251] },
  { name: "Gen III - Hoenn", range: [252, 386] },
  { name: "Gen IV - Sinnoh", range: [387, 493] },
  { name: "Gen V - Unova", range: [494, 649] },
  { name: "Gen VI - Kalos", range: [650, 721] },
  { name: "Gen VII - Alola", range: [722, 809] },
  { name: "Gen VIII - Galar", range: [810, 905] },
  { name: "Gen IX - Paldea", range: [906, 1025] },
];

export const ALL_TYPES = [
  "normal", "fire", "water", "electric", "grass", "ice",
  "fighting", "poison", "ground", "flying", "psychic", "bug",
  "rock", "ghost", "dragon", "dark", "steel", "fairy",
] as const;

export type PokemonTypeName = (typeof ALL_TYPES)[number];

export const TOTAL_POKEMON = 1025;

export function getArtworkUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

export function getSpriteUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

export function getCryUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${id}.ogg`;
}

export function formatPokemonId(id: number): string {
  return `#${id.toString().padStart(4, "0")}`;
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getGenerationForId(id: number): string {
  const gen = GENERATIONS.find((g) => id >= g.range[0] && id <= g.range[1]);
  return gen?.name ?? "Unknown";
}
