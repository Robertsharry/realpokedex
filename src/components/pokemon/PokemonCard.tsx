"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { TypeBadge } from "./TypeBadge";
import { TYPE_COLORS, formatPokemonId, capitalize, getArtworkUrl } from "@/lib/constants";
import { useFavoritesStore } from "@/stores/favorites-store";
import type { Pokemon } from "@/lib/types";

interface PokemonCardProps {
  pokemon: Pokemon;
  index?: number;
}

export function PokemonCard({ pokemon, index = 0 }: PokemonCardProps) {
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const primaryType = pokemon.types[0]?.name ?? "normal";
  const colors = TYPE_COLORS[primaryType] ?? TYPE_COLORS.normal;
  const fav = isFavorite(pokemon.id);

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
          className="relative overflow-hidden rounded-2xl border border-border/50 p-4 transition-shadow duration-300 group-hover:shadow-lg group-hover:shadow-black/10"
          style={{
            background: `linear-gradient(135deg, ${colors.bg}15 0%, ${colors.bg}08 50%, transparent 100%)`,
          }}
        >
          {/* Background type pattern */}
          <div
            className="absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-10 blur-2xl"
            style={{ backgroundColor: colors.bg }}
          />

          {/* Pokemon ID */}
          <p className="text-xs font-bold text-muted-foreground/60">
            {formatPokemonId(pokemon.id)}
          </p>

          {/* Artwork */}
          <div className="relative mx-auto my-2 h-28 w-28">
            <Image
              src={getArtworkUrl(pokemon.id)}
              alt={pokemon.name}
              fill
              sizes="112px"
              className="object-contain drop-shadow-lg transition-transform duration-300 group-hover:scale-110"
              loading={index < 12 ? "eager" : "lazy"}
              priority={index < 4}
            />
          </div>

          {/* Name */}
          <h3 className="text-center text-sm font-bold">
            {capitalize(pokemon.name)}
          </h3>

          {/* Types */}
          <div className="mt-2 flex justify-center gap-1.5">
            {pokemon.types.map((t) => (
              <TypeBadge key={t.name} type={t.name} size="sm" />
            ))}
          </div>
        </div>
      </Link>

      {/* Favorite button - outside of link to prevent navigation */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleFavorite(pokemon.id);
        }}
        className="absolute right-3 top-3 z-10 rounded-full p-1.5 transition-all hover:scale-110"
        aria-label={fav ? "Remove from favorites" : "Add to favorites"}
      >
        <Heart
          className={cn(
            "h-4 w-4 transition-colors",
            fav
              ? "fill-red-500 text-red-500"
              : "text-muted-foreground/40 group-hover:text-muted-foreground"
          )}
        />
      </button>
    </motion.div>
  );
}

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
