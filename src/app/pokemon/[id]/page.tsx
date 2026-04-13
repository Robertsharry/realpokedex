"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, ChevronLeft, ChevronRight, Plus, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { TypeBadge } from "@/components/pokemon/TypeBadge";
import { StatBarGroup } from "@/components/pokemon/StatBar";
import { EvolutionChain } from "@/components/pokemon/EvolutionChain";
import { MoveList } from "@/components/pokemon/MoveList";
import {
  getPokemon,
  getPokemonSpecies,
  getEvolutionChain,
} from "@/lib/pokeapi";
import { useFavoritesStore } from "@/stores/favorites-store";
import { useTeamStore } from "@/stores/team-store";
import {
  TYPE_COLORS,
  capitalize,
  formatPokemonId,
  TOTAL_POKEMON,
} from "@/lib/constants";
import { getTypeWeaknesses, getTypeResistances, getTypeImmunities } from "@/lib/type-effectiveness";
import type { Pokemon, PokemonSpecies, EvolutionNode } from "@/lib/types";

export default function PokemonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [species, setSpecies] = useState<PokemonSpecies | null>(null);
  const [evolution, setEvolution] = useState<EvolutionNode | null>(null);
  const [loading, setLoading] = useState(true);
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const { addPokemonToFirstEmpty } = useTeamStore();

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

        if (spec.evolutionChainId) {
          const evo = await getEvolutionChain(spec.evolutionChainId);
          if (!cancelled) setEvolution(evo);
        }
      } catch (err) {
        console.error("Failed to load Pokemon:", err);
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

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
    <div>
      {/* Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()} className="gap-1">
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex gap-1">
          {id > 1 && (
            <Link href={`/pokemon/${id - 1}`}>
              <Button variant="ghost" size="icon">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
          )}
          {id < TOTAL_POKEMON && (
            <Link href={`/pokemon/${id + 1}`}>
              <Button variant="ghost" size="icon">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-8 overflow-hidden rounded-3xl p-8"
        style={{
          background: `linear-gradient(135deg, ${colors.bg}30 0%, ${colors.bg}10 60%, transparent 100%)`,
        }}
      >
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          {/* Artwork */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative h-56 w-56 shrink-0 sm:h-64 sm:w-64"
          >
            <Image
              src={pokemon.sprites.artwork}
              alt={pokemon.name}
              fill
              sizes="256px"
              className="object-contain drop-shadow-2xl"
              priority
            />
          </motion.div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <p className="text-sm font-bold text-muted-foreground">
              {formatPokemonId(pokemon.id)}
            </p>
            <h1 className="text-3xl font-extrabold sm:text-4xl">
              {capitalize(pokemon.name)}
            </h1>
            {species && (
              <p className="mt-1 text-sm text-muted-foreground">{species.genus}</p>
            )}

            {/* Types */}
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              {pokemon.types.map((t) => (
                <TypeBadge key={t.name} type={t.name} size="lg" />
              ))}
            </div>

            {/* Action buttons */}
            <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
              <Button
                variant={fav ? "default" : "outline"}
                size="sm"
                onClick={() => toggleFavorite(pokemon.id)}
                className="gap-1.5"
              >
                <Heart className={`h-4 w-4 ${fav ? "fill-current" : ""}`} />
                {fav ? "Favorited" : "Favorite"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addPokemonToFirstEmpty(pokemon)}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Add to Team
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={playCry}
                className="gap-1.5"
              >
                <Volume2 className="h-4 w-4" />
                Cry
              </Button>
            </div>

            {/* Flavor text */}
            {species?.flavorText && (
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground italic">
                {species.flavorText}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-8">
          {/* About */}
          <section>
            <h2 className="mb-4 text-lg font-bold">About</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Height</p>
                <p className="font-bold">{(pokemon.height / 10).toFixed(1)} m</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Weight</p>
                <p className="font-bold">{(pokemon.weight / 10).toFixed(1)} kg</p>
              </div>
              {species && (
                <>
                  <div>
                    <p className="text-xs text-muted-foreground">Generation</p>
                    <p className="font-bold">{species.generation}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Catch Rate</p>
                    <p className="font-bold">{species.captureRate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Egg Groups</p>
                    <p className="font-bold">{species.eggGroups.join(", ") || "None"}</p>
                  </div>
                  {species.habitat && (
                    <div>
                      <p className="text-xs text-muted-foreground">Habitat</p>
                      <p className="font-bold">{species.habitat}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          {/* Abilities */}
          <section>
            <h2 className="mb-4 text-lg font-bold">Abilities</h2>
            <div className="flex flex-wrap gap-2">
              {pokemon.abilities.map((a) => (
                <div
                  key={a.name}
                  className="rounded-lg bg-accent px-3 py-1.5 text-sm"
                >
                  <span className="font-medium">
                    {capitalize(a.name.replace(/-/g, " "))}
                  </span>
                  {a.isHidden && (
                    <span className="ml-1 text-xs text-muted-foreground">(Hidden)</span>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Type Effectiveness */}
          <section>
            <h2 className="mb-4 text-lg font-bold">Type Effectiveness</h2>
            {weaknesses.length > 0 && (
              <div className="mb-3">
                <p className="mb-2 text-xs font-medium text-red-400">Weak to</p>
                <div className="flex flex-wrap gap-1.5">
                  {weaknesses.map((w) => (
                    <div key={w.type} className="flex items-center gap-1">
                      <TypeBadge type={w.type} size="sm" />
                      <span className="text-xs font-bold text-red-400">{w.multiplier}x</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {resistances.length > 0 && (
              <div className="mb-3">
                <p className="mb-2 text-xs font-medium text-green-400">Resistant to</p>
                <div className="flex flex-wrap gap-1.5">
                  {resistances.map((r) => (
                    <div key={r.type} className="flex items-center gap-1">
                      <TypeBadge type={r.type} size="sm" />
                      <span className="text-xs font-bold text-green-400">{r.multiplier}x</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {immunities.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-blue-400">Immune to</p>
                <div className="flex flex-wrap gap-1.5">
                  {immunities.map((type) => (
                    <div key={type} className="flex items-center gap-1">
                      <TypeBadge type={type} size="sm" />
                      <span className="text-xs font-bold text-blue-400">0x</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-8">
          {/* Stats */}
          <section>
            <h2 className="mb-4 text-lg font-bold">Base Stats</h2>
            <StatBarGroup stats={pokemon.stats} />
          </section>
        </div>
      </div>

      <Separator className="my-8" />

      {/* Evolution */}
      {evolution && (
        <section className="mb-8">
          <h2 className="mb-6 text-lg font-bold">Evolution Chain</h2>
          <EvolutionChain chain={evolution} currentId={pokemon.id} />
        </section>
      )}

      <Separator className="my-8" />

      {/* Moves */}
      <section>
        <h2 className="mb-6 text-lg font-bold">Moves</h2>
        <MoveList pokemonId={pokemon.id} pokemonTypes={typeNames} />
      </section>
    </div>
  );
}
