"use client";

import { useState } from "react";
import { Swords, Plus, Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { TeamSlot } from "@/components/team-builder/TeamSlot";
import { PokemonPicker } from "@/components/team-builder/PokemonPicker";
import { TypeCoverage } from "@/components/team-builder/TypeCoverage";
import { TeamWeaknesses } from "@/components/team-builder/TeamWeaknesses";
import { CoverageScore } from "@/components/team-builder/CoverageScore";
import { TeamSuggestions } from "@/components/team-builder/TeamSuggestions";
import { MoveSelector } from "@/components/team-builder/MoveSelector";
import { useTeamStore } from "@/stores/team-store";
import type { Pokemon, PokemonMove } from "@/lib/types";

export default function TeamBuilderPage() {
  const {
    teams,
    activeTeamId,
    getActiveTeam,
    createTeam,
    deleteTeam,
    renameTeam,
    setActiveTeam,
    addPokemonToSlot,
    removePokemonFromSlot,
    setMoveForSlot,
    duplicateTeam,
  } = useTeamStore();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSlotIndex, setPickerSlotIndex] = useState(0);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [editingName, setEditingName] = useState(false);

  const activeTeam = getActiveTeam();
  const effectiveTeamId = activeTeam?.id ?? activeTeamId ?? teams[0]?.id;

  function handleAddPokemon(slotIndex: number) {
    setPickerSlotIndex(slotIndex);
    setPickerOpen(true);
  }

  function handleSelectPokemon(pokemon: Pokemon) {
    if (!effectiveTeamId) return;
    addPokemonToSlot(effectiveTeamId, pickerSlotIndex, pokemon);
    setSelectedSlotIndex(pickerSlotIndex);
  }

  function handleSetMove(moveIndex: number, move: PokemonMove | null) {
    if (!effectiveTeamId || selectedSlotIndex === null) return;
    setMoveForSlot(effectiveTeamId, selectedSlotIndex, moveIndex, move);
  }

  const selectedSlot =
    selectedSlotIndex !== null ? activeTeam?.slots[selectedSlotIndex] : null;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Swords className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-extrabold">Team Builder</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Build your dream team and analyze type coverage in real-time.
        </p>
      </div>

      {/* Team selector */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <select
          value={effectiveTeamId ?? ""}
          onChange={(e) => setActiveTeam(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium"
        >
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        {editingName && activeTeam ? (
          <Input
            defaultValue={activeTeam.name}
            className="w-40"
            autoFocus
            onBlur={(e) => {
              renameTeam(activeTeam.id, e.target.value || "My Team");
              setEditingName(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                renameTeam(activeTeam.id, e.currentTarget.value || "My Team");
                setEditingName(false);
              }
            }}
          />
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditingName(true)}
          >
            Rename
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => createTeam("New Team")}
          className="gap-1"
        >
          <Plus className="h-3.5 w-3.5" />
          New
        </Button>

        {activeTeam && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => duplicateTeam(activeTeam.id)}
              className="gap-1"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy
            </Button>
            {teams.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => deleteTeam(activeTeam.id)}
                className="gap-1 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            )}
          </>
        )}
      </div>

      {activeTeam && (
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Left: Team Slots */}
          <div className="lg:col-span-2">
            <h2 className="mb-3 text-sm font-bold text-muted-foreground">
              TEAM ({activeTeam.slots.filter((s) => s.pokemon).length}/6)
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2">
              {activeTeam.slots.map((slot, i) => (
                <TeamSlot
                  key={i}
                  slot={slot}
                  index={i}
                  isSelected={selectedSlotIndex === i}
                  onSelect={() => setSelectedSlotIndex(i)}
                  onRemove={() => {
                    removePokemonFromSlot(activeTeam.id, i);
                    if (selectedSlotIndex === i) setSelectedSlotIndex(null);
                  }}
                  onAdd={() => handleAddPokemon(i)}
                />
              ))}
            </div>

            {/* Move selector for selected slot */}
            {selectedSlot?.pokemon && (
              <div className="mt-4">
                <Separator className="mb-4" />
                <MoveSelector
                  slot={selectedSlot}
                  onSetMove={handleSetMove}
                />
              </div>
            )}
          </div>

          {/* Right: Analysis Dashboard */}
          <div className="space-y-6 lg:col-span-3">
            {/* Coverage Score */}
            <div className="flex justify-center rounded-xl border border-border/50 p-6">
              <CoverageScore slots={activeTeam.slots} />
            </div>

            {/* Type Coverage */}
            <div className="rounded-xl border border-border/50 p-4">
              <TypeCoverage slots={activeTeam.slots} />
            </div>

            {/* Team Weaknesses */}
            <div className="rounded-xl border border-border/50 p-4">
              <TeamWeaknesses slots={activeTeam.slots} />
            </div>

            {/* Suggestions */}
            <div className="rounded-xl border border-border/50 p-4">
              <TeamSuggestions slots={activeTeam.slots} />
            </div>
          </div>
        </div>
      )}

      {/* Pokemon Picker Dialog */}
      <PokemonPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelectPokemon}
      />
    </div>
  );
}
