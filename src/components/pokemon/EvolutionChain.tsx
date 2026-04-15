"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ChevronRight } from "lucide-react";
import { getArtworkUrl, capitalize } from "@/lib/constants";
import type { EvolutionNode } from "@/lib/types";

function EvolutionSprite({ id, name, className }: { id: number; name: string; className?: string }) {
  const [imgError, setImgError] = useState(false);
  if (imgError) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-xl bg-muted/20 text-muted-foreground/30">
        <span className="text-2xl">?</span>
      </div>
    );
  }
  return (
    <Image
      src={getArtworkUrl(id)}
      alt={name}
      fill
      sizes="96px"
      className={className ?? "object-contain transition-transform group-hover:scale-110"}
      onError={() => setImgError(true)}
    />
  );
}

interface EvolutionChainProps {
  chain: EvolutionNode;
  currentId: number;
}

function getEvolutionTriggerText(node: EvolutionNode): string {
  if (node.item) return capitalize(node.item.replace(/-/g, " "));
  if (node.minLevel) return `Level ${node.minLevel}`;
  if (node.trigger === "trade") return "Trade";
  if (node.trigger === "use-item") return "Use Item";
  if (node.trigger === "level-up") return "Level Up";
  return "";
}

function EvolutionStage({
  node,
  currentId,
  delay,
}: {
  node: EvolutionNode;
  currentId: number;
  delay: number;
}) {
  const isCurrent = node.speciesId === currentId;
  const triggerText = getEvolutionTriggerText(node);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay }}
        className="flex flex-col items-center"
      >
        <Link
          href={`/pokemon/${node.speciesId}`}
          className={`group relative flex flex-col items-center rounded-2xl p-3 transition-all hover:bg-black/[0.06] ${
            isCurrent ? "ring-2 ring-primary ring-offset-2 ring-offset-[#e8f4e8]" : ""
          }`}
        >
          <div className="relative h-20 w-20 sm:h-24 sm:w-24">
            <EvolutionSprite id={node.speciesId} name={node.speciesName} />
          </div>
          <span className="mt-1.5 text-sm font-extrabold sm:text-base">
            {capitalize(node.speciesName)}
          </span>
        </Link>
      </motion.div>

      {node.evolvesTo.length > 0 && (
        <div className="flex flex-col items-center gap-2">
          {node.evolvesTo.map((evo, i) => (
            <div key={evo.speciesName} className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-0.5">
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                {getEvolutionTriggerText(evo) && (
                  <span className="whitespace-nowrap text-xs font-bold text-muted-foreground">
                    {getEvolutionTriggerText(evo)}
                  </span>
                )}
              </div>
              <EvolutionStage
                node={evo}
                currentId={currentId}
                delay={delay + 0.2 * (i + 1)}
              />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export function EvolutionChain({ chain, currentId }: EvolutionChainProps) {
  // Flatten for simple linear chains, keep tree for branching
  const isLinear =
    chain.evolvesTo.length <= 1 &&
    chain.evolvesTo.every((e) => e.evolvesTo.length <= 1);

  if (isLinear) {
    const stages: EvolutionNode[] = [];
    let current: EvolutionNode | null = chain;
    while (current) {
      stages.push(current);
      current = current.evolvesTo[0] ?? null;
    }

    return (
      <div className="flex flex-wrap items-center justify-center gap-2">
        {stages.map((stage, i) => (
          <div key={stage.speciesName} className="flex items-center gap-2">
            {i > 0 && (
              <div className="flex flex-col items-center gap-0.5">
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                {getEvolutionTriggerText(stage) && (
                  <span className="whitespace-nowrap text-xs font-bold text-muted-foreground">
                    {getEvolutionTriggerText(stage)}
                  </span>
                )}
              </div>
            )}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: i * 0.2 }}
            >
              <Link
                href={`/pokemon/${stage.speciesId}`}
                className={`group flex flex-col items-center rounded-2xl p-3 transition-all hover:bg-black/[0.06] ${
                  stage.speciesId === currentId
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-[#e8f4e8]"
                    : ""
                }`}
              >
                <div className="relative h-20 w-20 sm:h-24 sm:w-24">
                  <EvolutionSprite id={stage.speciesId} name={stage.speciesName} />
                </div>
                <span className="mt-1 text-xs font-bold sm:text-sm">
                  {capitalize(stage.speciesName)}
                </span>
              </Link>
            </motion.div>
          </div>
        ))}
      </div>
    );
  }

  // Branching evolution (e.g., Eevee)
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <EvolutionStage node={chain} currentId={currentId} delay={0} />
    </div>
  );
}
