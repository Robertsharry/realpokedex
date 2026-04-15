"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Heart,
  ChevronLeft,
  ChevronRight,
  Plus,
  Volume2,
  Sparkles,
  Ruler,
  Weight,
  Dna,
  Egg,
  MapPin,
  Trees,
  Target,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TypeBadge } from "@/components/pokemon/TypeBadge";
import { StatBarGroup } from "@/components/pokemon/StatBar";
import { EvolutionChain } from "@/components/pokemon/EvolutionChain";
import { MoveList } from "@/components/pokemon/MoveList";
import { EncounterLocations } from "@/components/pokemon/EncounterLocations";
import { NatureChart } from "@/components/pokemon/NatureChart";
import {
  getPokemon,
  getPokemonSpecies,
  getEvolutionChain,
  getAbilityDetails,
} from "@/lib/pokeapi";
import { useFavoritesStore } from "@/stores/favorites-store";
import { useTeamStore } from "@/stores/team-store";
import { useShinyStore } from "@/stores/shiny-store";
import {
  TYPE_COLORS,
  capitalize,
  formatPokemonId,
  getArtworkUrl,
  TOTAL_POKEMON,
} from "@/lib/constants";
import { getTypeWeaknesses, getTypeResistances, getTypeImmunities } from "@/lib/type-effectiveness";
import type { Pokemon, PokemonSpecies, EvolutionNode, AbilityDetail } from "@/lib/types";

// ── Section wrapper: every content block lives in a device panel ──
function DevicePanel({
  children,
  title,
  icon: Icon,
  accentColor,
}: {
  children: React.ReactNode;
  title: string;
  icon?: React.ElementType;
  accentColor?: string;
}) {
  return (
    <section className="dex-panel">
      <div className="dex-panel-header">
        <div className="dex-panel-led" style={accentColor ? { backgroundColor: accentColor } : undefined} />
        {Icon && <Icon className="h-4 w-4 text-red-300/80" />}
        <h2 className="dex-section-title">{title}</h2>
      </div>
      <div className="dex-panel-body">{children}</div>
    </section>
  );
}

export default function PokemonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [species, setSpecies] = useState<PokemonSpecies | null>(null);
  const [evolution, setEvolution] = useState<EvolutionNode | null>(null);
  const [abilityDetails, setAbilityDetails] = useState<Record<string, AbilityDetail>>({});
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  useEffect(() => { setImgError(false); }, [id]);
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const { addPokemonToFirstEmpty } = useTeamStore();
  const { isShiny, toggleShiny } = useShinyStore();

  useEffect(() => {
    if (!id || isNaN(id)) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [poke, spec] = await Promise.all([
          getPokemon(id),
          getPokemonSpecies(id),
        ]);
        if (cancelled) return;
        setPokemon(poke);
        setSpecies(spec);

        // Fetch ability descriptions in parallel
        const abilityPromises = poke.abilities.map(async (a) => {
          try {
            return await getAbilityDetails(a.name);
          } catch {
            return null;
          }
        });
        const abilityResults = await Promise.all(abilityPromises);
        if (!cancelled) {
          const map: Record<string, AbilityDetail> = {};
          for (const detail of abilityResults) {
            if (detail) map[detail.name] = detail;
          }
          setAbilityDetails(map);
        }

        if (spec.evolutionChainId) {
          const evo = await getEvolutionChain(spec.evolutionChainId);
          if (!cancelled) setEvolution(evo);
        }
      } catch (err) {
        console.error("Pokemon load error:", err);
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  // ── Loading skeleton ────────────────────────────────────────────
  if (loading || !pokemon) {
    return (
      <div className="space-y-6">
        <Skeleton className="mx-auto h-64 w-64 rounded-full" />
        <Skeleton className="mx-auto h-10 w-48" />
        <div className="mx-auto max-w-md space-y-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const primaryType = pokemon.types[0]?.name ?? "normal";
  const colors = TYPE_COLORS[primaryType] ?? TYPE_COLORS.normal;
  const fav = isFavorite(pokemon.id);
  const shiny = isShiny(pokemon.id);
  const typeNames = pokemon.types.map((t) => t.name);
  const weaknesses = getTypeWeaknesses(typeNames);
  const resistances = getTypeResistances(typeNames);
  const immunities = getTypeImmunities(typeNames);

  function playCry() {
    const audio = new Audio(pokemon!.cryUrl);
    audio.volume = 0.3;
    audio.play().catch(() => {});
  }

  return (
    <div className="dex-detail-page">
      {/* ── Top Navigation ───────────────────────────────────────── */}
      <nav className="mb-4 flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()} className="gap-1 text-base font-bold">
          <ChevronLeft className="h-5 w-5" />
          Back
        </Button>
        <div className="flex gap-1">
          {id > 1 && (
            <Link href={`/pokemon/${id - 1}`}>
              <Button variant="ghost" size="icon">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
          )}
          {id < TOTAL_POKEMON && (
            <Link href={`/pokemon/${id + 1}`}>
              <Button variant="ghost" size="icon">
                <ChevronRight className="h-5 w-5" />
              </Button>
            </Link>
          )}
        </div>
      </nav>

      {/* ── Hero: Pokedex Device Frame ───────────────────────────── */}
      <div className="pokedex-device mb-8">
        <div className="pokedex-device-inner">
          {/* Device hardware bar */}
          <div className="mb-4 flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 animate-scanner-pulse" />
              <div className="absolute inset-[2px] rounded-full bg-gradient-to-br from-cyan-300 to-blue-500" />
              <div className="absolute inset-[4px] rounded-full bg-gradient-to-br from-white/70 to-cyan-200/50" />
              <div className="absolute left-[6px] top-[6px] h-2 w-2 rounded-full bg-white/80" />
            </div>
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-400 shadow-[0_0_4px_rgba(248,113,113,0.6)]" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-400 shadow-[0_0_4px_rgba(250,204,21,0.6)]" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-400 shadow-[0_0_4px_rgba(74,222,128,0.6)]" />
            </div>
            <div className="ml-auto font-mono text-sm font-extrabold tracking-wider text-red-200/70">
              {formatPokemonId(pokemon.id)}
            </div>
          </div>

          {/* ── Main screen ──────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="pokedex-screen relative overflow-hidden rounded-2xl p-6 sm:p-8"
            style={{
              background: `linear-gradient(145deg, ${colors.bg}20 0%, oklch(0.15 0.015 250) 40%, oklch(0.13 0.01 250) 100%)`,
            }}
          >
            <div className="relative z-10 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              {/* Artwork */}
              <div className="relative shrink-0">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className={`relative h-56 w-56 sm:h-64 sm:w-64 ${shiny ? "animate-shiny-glow" : ""}`}
                >
                  {imgError ? (
                    <div className="flex h-full w-full items-center justify-center rounded-3xl bg-muted/20 text-muted-foreground/30">
                      <span className="text-6xl">?</span>
                    </div>
                  ) : (
                    <Image
                      src={getArtworkUrl(pokemon.id, shiny)}
                      alt={`${pokemon.name}${shiny ? " (shiny)" : ""}`}
                      fill
                      sizes="256px"
                      className="object-contain drop-shadow-2xl"
                      priority
                      onError={() => setImgError(true)}
                    />
                  )}
                  {shiny && (
                    <>
                      <Sparkles className="absolute -left-2 top-8 h-5 w-5 animate-sparkle fill-yellow-300 text-yellow-300" />
                      <Sparkles className="absolute -right-2 top-16 h-4 w-4 animate-sparkle fill-yellow-200 text-yellow-200" style={{ animationDelay: "0.7s" }} />
                      <Sparkles className="absolute bottom-12 left-2 h-3.5 w-3.5 animate-sparkle fill-yellow-400 text-yellow-400" style={{ animationDelay: "1.4s" }} />
                      <Sparkles className="absolute right-4 top-4 h-3 w-3 animate-sparkle fill-white text-white" style={{ animationDelay: "0.3s" }} />
                    </>
                  )}
                </motion.div>
                {shiny && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-yellow-500 to-amber-400 px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-black shadow-lg shadow-yellow-500/30">
                    Shiny
                  </div>
                )}
              </div>

              {/* Identity block */}
              <div className="flex-1 text-center sm:text-left">
                <p className="dex-id-label">{formatPokemonId(pokemon.id)}</p>
                <h1 className="dex-pokemon-name">{capitalize(pokemon.name)}</h1>
                {species && (
                  <p className="dex-genus">{species.genus}</p>
                )}

                {/* Type pills */}
                <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                  {pokemon.types.map((t) => (
                    <TypeBadge key={t.name} type={t.name} size="lg" />
                  ))}
                </div>

                {/* Action buttons */}
                <div className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start">
                  <Button
                    variant={shiny ? "default" : "outline"}
                    size="sm"
                    onClick={() => { toggleShiny(pokemon.id); setImgError(false); }}
                    className={`gap-1.5 text-sm font-bold ${shiny ? "bg-gradient-to-r from-yellow-600 to-amber-500 hover:from-yellow-500 hover:to-amber-400 text-black border-0" : ""}`}
                  >
                    <Sparkles className={`h-4 w-4 ${shiny ? "fill-current" : ""}`} />
                    {shiny ? "Shiny" : "Normal"}
                  </Button>
                  <Button
                    variant={fav ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleFavorite(pokemon.id)}
                    className="gap-1.5 text-sm font-bold"
                  >
                    <Heart className={`h-4 w-4 ${fav ? "fill-current" : ""}`} />
                    {fav ? "Favorited" : "Favorite"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addPokemonToFirstEmpty(pokemon)} className="gap-1.5 text-sm font-bold">
                    <Plus className="h-4 w-4" /> Add to Team
                  </Button>
                  <Button variant="outline" size="sm" onClick={playCry} className="gap-1.5 text-sm font-bold">
                    <Volume2 className="h-4 w-4" /> Cry
                  </Button>
                </div>

                {/* Flavor text */}
                {species?.flavorText && (
                  <p className="dex-flavor-text">{species.flavorText}</p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Body panels ──────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Left column ──────────────────────────────────────── */}
        <div className="space-y-6">
          {/* About */}
          <DevicePanel title="About" icon={Dna} accentColor="#22c55e">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              <div className="dex-data-field">
                <span className="dex-data-label"><Ruler className="mr-1 inline h-3 w-3" />Height</span>
                <span className="dex-data-value">{(pokemon.height / 10).toFixed(1)} m</span>
              </div>
              <div className="dex-data-field">
                <span className="dex-data-label"><Weight className="mr-1 inline h-3 w-3" />Weight</span>
                <span className="dex-data-value">{(pokemon.weight / 10).toFixed(1)} kg</span>
              </div>
              {species && (
                <>
                  <div className="dex-data-field">
                    <span className="dex-data-label">Generation</span>
                    <span className="dex-data-value">{species.generation}</span>
                  </div>
                  <div className="dex-data-field">
                    <span className="dex-data-label"><Target className="mr-1 inline h-3 w-3" />Catch Rate</span>
                    <span className="dex-data-value">{species.captureRate}</span>
                  </div>
                  <div className="dex-data-field">
                    <span className="dex-data-label"><Egg className="mr-1 inline h-3 w-3" />Egg Groups</span>
                    <span className="dex-data-value">{species.eggGroups.join(", ") || "None"}</span>
                  </div>
                  {species.habitat && (
                    <div className="dex-data-field">
                      <span className="dex-data-label"><Trees className="mr-1 inline h-3 w-3" />Habitat</span>
                      <span className="dex-data-value">{species.habitat}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </DevicePanel>

          {/* Abilities */}
          <DevicePanel title="Abilities" icon={Sparkles} accentColor="#a855f7">
            <div className="space-y-3">
              {pokemon.abilities.map((a) => {
                const detail = abilityDetails[a.name];
                return (
                  <div key={a.name} className="dex-ability-pill flex-col !items-start">
                    <div className="flex w-full items-center gap-2">
                      <span className="text-base font-extrabold">{capitalize(a.name.replace(/-/g, " "))}</span>
                      {a.isHidden && (
                        <span className="dex-ability-hidden">Hidden</span>
                      )}
                    </div>
                    {detail?.effectShort && (
                      <p className="mt-1 text-sm font-medium leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                        {detail.effectShort}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </DevicePanel>

          {/* Type Effectiveness */}
          <DevicePanel title="Type Effectiveness" icon={ShieldAlert} accentColor="#ef4444">
            {weaknesses.length > 0 && (
              <div className="mb-4">
                <p className="dex-sub-label text-red-400">
                  <ShieldAlert className="mr-1 inline h-3.5 w-3.5" />Weak to
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {weaknesses.map((w) => (
                    <div key={w.type} className="flex items-center gap-1.5">
                      <TypeBadge type={w.type} size="md" />
                      <span className="text-sm font-extrabold tabular-nums text-red-400">{w.multiplier}x</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {resistances.length > 0 && (
              <div className="mb-4">
                <p className="dex-sub-label text-green-400">
                  <ShieldCheck className="mr-1 inline h-3.5 w-3.5" />Resistant to
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {resistances.map((r) => (
                    <div key={r.type} className="flex items-center gap-1.5">
                      <TypeBadge type={r.type} size="md" />
                      <span className="text-sm font-extrabold tabular-nums text-green-400">{r.multiplier}x</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {immunities.length > 0 && (
              <div>
                <p className="dex-sub-label text-blue-400">
                  <ShieldOff className="mr-1 inline h-3.5 w-3.5" />Immune to
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {immunities.map((type) => (
                    <div key={type} className="flex items-center gap-1.5">
                      <TypeBadge type={type} size="md" />
                      <span className="text-sm font-extrabold tabular-nums text-blue-400">0x</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </DevicePanel>
        </div>

        {/* ── Right column ─────────────────────────────────────── */}
        <div className="space-y-6">
          <DevicePanel title="Base Stats" accentColor="#3b82f6">
            <StatBarGroup stats={pokemon.stats} />
          </DevicePanel>

          <DevicePanel title="Natures" accentColor="#f59e0b">
            <NatureChart stats={pokemon.stats} pokemonName={pokemon.name} />
          </DevicePanel>
        </div>
      </div>

      {/* ── Full-width panels ────────────────────────────────────── */}
      <div className="mt-6 space-y-6">
        <DevicePanel title="Where to Find" icon={MapPin} accentColor="#22d3ee">
          <EncounterLocations pokemonId={pokemon.id} />
        </DevicePanel>

        {evolution && (
          <DevicePanel title="Evolution Chain" icon={Dna} accentColor="#a855f7">
            <EvolutionChain chain={evolution} currentId={pokemon.id} />
          </DevicePanel>
        )}

        <DevicePanel title="Moves" accentColor="#ef4444">
          <MoveList pokemonId={pokemon.id} pokemonTypes={typeNames} />
        </DevicePanel>
      </div>
    </div>
  );
}
