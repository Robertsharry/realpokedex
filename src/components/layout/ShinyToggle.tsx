"use client";

import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useShinyStore } from "@/stores/shiny-store";

export function ShinyToggle() {
  const { globalShiny, toggleGlobalShiny } = useShinyStore();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleGlobalShiny}
      className="relative rounded-full"
      aria-label={globalShiny ? "Show normal variants" : "Show shiny variants"}
      title={globalShiny ? "Showing shiny variants" : "Show shiny variants"}
    >
      <Sparkles
        className={`h-5 w-5 transition-colors ${
          globalShiny
            ? "fill-yellow-400 text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.5)]"
            : "text-muted-foreground"
        }`}
      />
      {globalShiny && (
        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-yellow-400 shadow-[0_0_4px_rgba(250,204,21,0.6)]" />
      )}
    </Button>
  );
}
