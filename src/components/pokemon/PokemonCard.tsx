"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Sparkles } from "lucide-react";
import { TypeBadge } from "./TypeBadge";
import { TYPE_COLORS, formatPokemonId, capitalize, getArtworkUrl } from "@/lib/constants";
import { useFavoritesStore } from "@/stores/favorites-store";
import { useShinyStore } from "@/stores/shiny-store";
import type { PokemonIndexEntry } from "@/lib/types";

interface PokemonCardProps {
  pokemon: PokemonIndexEntry;
  index?: number;
}

export function PokemonCard({ pokemon, index = 0 }: PokemonCardProps) {
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const { isShiny, toggleShiny } = useShinyStore();
  const [imgError, setImgError] = useState(false);
  const primaryType = pokemon.types[0]?.name ?? "normal";
  const colors = TYPE_COLORS[primaryType] ?? TYPE_COLORS.normal;
  const fav = isFavorite(pokemon.id);
  const shiny = isShiny(pokemon.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.6) }}
      whileHover={{ y: -6, scale: 1.02 }}
      className="group relative"
    >
      <Link href={`/pokemon/${pokemon.id}`}>
        <div
          className="pokedex-screen relative overflow-hidden rounded-2xl p-3 pb-3 transition-shadow duration-300 group-hover:shadow-lg group-hover:shadow-black/20"
          style={{
            background: `linear-gradient(135deg, ${colors.bg}18 0%, ${colors.bg}08 50%, transparent 100%)`,
          }}
        >
          {/* Background type pattern */}
          <div
            className="absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-10 blur-2xl"
            style={{ backgroundColor: colors.bg }}
          />

          {/* Top row: ID + shiny toggle */}
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs font-bold text-muted-foreground/60">
              {formatPokemonId(pokemon.id)}
            </p>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleShiny(pokemon.id);
              }}
              className="relative z-10 rounded-full p-1 transition-all hover:scale-125"
              aria-label={shiny ? "Show normal variant" : "Show shiny variant"}
            >
              <Sparkles
                className={`h-3.5 w-3.5 transition-colors ${
                  shiny
                    ? "fill-yellow-400 text-yellow-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.6)]"
                    : "text-muted-foreground/30 group-hover:text-muted-foreground/60"
                }`}
              />
            </button>
          </div>

          {/* Artwork */}
          <div className={`relative mx-auto my-1.5 h-28 w-28 ${shiny ? "animate-shiny-glow" : ""}`}>
            {imgError ? (
              <div className="flex h-full w-full items-center justify-center rounded-xl bg-muted/20 text-muted-foreground/30">
                <span className="text-3xl">?</span>
              </div>
            ) : (
              <Image
                src={getArtworkUrl(pokemon.id, shiny)}
                alt={`${pokemon.name}${shiny ? " (shiny)" : ""}`}
                fill
                sizes="112px"
                className="object-contain drop-shadow-lg transition-transform duration-300 group-hover:scale-110"
                loading={index < 12 ? "eager" : "lazy"}
                priority={index < 4}
                onError={() => setImgError(true)}
              />
            )}
            {/* Shiny sparkles overlay */}
            {shiny && !imgError && (
              <>
                <Sparkles className="absolute -left-1 top-2 h-3.5 w-3.5 animate-sparkle fill-yellow-300 text-yellow-300" style={{ animationDelay: "0s" }} />
                <Sparkles className="absolute -right-1 top-6 h-3 w-3 animate-sparkle fill-yellow-200 text-yellow-200" style={{ animationDelay: "0.5s" }} />
                <Sparkles className="absolute bottom-4 left-1 h-2.5 w-2.5 animate-sparkle fill-yellow-400 text-yellow-400" style={{ animationDelay: "1s" }} />
              </>
            )}
          </div>

          {/* Name */}
          <h3 className="text-center text-sm font-bold">
            {capitalize(pokemon.name)}
          </h3>

          {/* Types */}
          <div className="mt-1.5 flex justify-center gap-1.5">
            {pokemon.types.map((t) => (
              <TypeBadge key={t.name} type={t.name} size="sm" />
            ))}
          </div>
        </div>
      </Link>

      {/* Favorite button - top right, outside the card link */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleFavorite(pokemon.id);
        }}
        className="absolute right-2 top-2 z-10 rounded-full bg-background/50 p-1.5 backdrop-blur-sm transition-all hover:scale-110 hover:bg-background/80"
        aria-label={fav ? "Remove from favorites" : "Add to favorites"}
      >
        <Heart
          className={`h-4 w-4 transition-colors ${
            fav
              ? "fill-red-500 text-red-500"
              : "text-muted-foreground/40 group-hover:text-muted-foreground/70"
          }`}
        />
      </button>
    </motion.div>
  );
}
