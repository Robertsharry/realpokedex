"use client";

import { AlertTriangle, CheckCircle, Info, Sparkles } from "lucide-react";
import { getTeamSuggestions, findSynergyPairs } from "@/lib/team-analysis";
import type { TeamSlot } from "@/lib/types";

interface TeamSuggestionsProps {
  slots: TeamSlot[];
}

export function TeamSuggestions({ slots }: TeamSuggestionsProps) {
  const suggestions = getTeamSuggestions(slots);
  const synergies = findSynergyPairs(slots);
  const filledSlots = slots.filter((s) => s.pokemon);

  if (filledSlots.length === 0) {
    return (
      <div className="rounded-xl border border-border/50 p-4">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
          <p className="text-sm text-muted-foreground">
            Add Pokemon to get team building suggestions!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold">Team Analysis</h3>

      {/* Suggestions */}
      <div className="space-y-2">
        {suggestions.map((suggestion, i) => {
          const isDanger = suggestion.includes("Danger") || suggestion.includes("Watch out");
          const isGood = suggestion.includes("Great") || suggestion.includes("full");
          const isInfo = !isDanger && !isGood;

          const Icon = isDanger
            ? AlertTriangle
            : isGood
              ? CheckCircle
              : Info;
          const iconColor = isDanger
            ? "text-red-400"
            : isGood
              ? "text-green-400"
              : "text-blue-400";

          return (
            <div
              key={i}
              className={`rounded-lg p-3 text-sm ${
                isDanger
                  ? "bg-red-500/5 ring-1 ring-red-500/10"
                  : isGood
                    ? "bg-green-500/5 ring-1 ring-green-500/10"
                    : "bg-blue-500/5 ring-1 ring-blue-500/10"
              }`}
            >
              <div className="flex items-start gap-2">
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconColor}`} />
                <p>{suggestion}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Synergy pairs */}
      {synergies.length > 0 && (
        <div className="mt-4">
          <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-yellow-500" />
            Team Synergy
          </h4>
          <div className="space-y-1.5">
            {synergies.map((pair, i) => (
              <div
                key={i}
                className="rounded-lg bg-yellow-500/5 p-2.5 text-xs ring-1 ring-yellow-500/10"
              >
                {pair.reason}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
