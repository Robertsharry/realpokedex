import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Team, TeamSlot, Pokemon, PokemonMove } from "@/lib/types";

function createEmptySlot(): TeamSlot {
  return { pokemon: null, moves: [null, null, null, null], nickname: "" };
}

function createEmptyTeam(name: string): Team {
  return {
    id: crypto.randomUUID(),
    name,
    slots: Array.from({ length: 6 }, () => createEmptySlot()),
    createdAt: Date.now(),
  };
}

interface TeamState {
  teams: Team[];
  activeTeamId: string | null;

  getActiveTeam: () => Team | null;
  createTeam: (name: string) => string;
  deleteTeam: (id: string) => void;
  renameTeam: (id: string, name: string) => void;
  setActiveTeam: (id: string) => void;
  addPokemonToSlot: (teamId: string, slotIndex: number, pokemon: Pokemon) => void;
  removePokemonFromSlot: (teamId: string, slotIndex: number) => void;
  setMoveForSlot: (teamId: string, slotIndex: number, moveIndex: number, move: PokemonMove | null) => void;
  setNickname: (teamId: string, slotIndex: number, nickname: string) => void;
  duplicateTeam: (id: string) => void;
  addPokemonToFirstEmpty: (pokemon: Pokemon) => boolean;
}

export const useTeamStore = create<TeamState>()(
  persist(
    (set, get) => ({
      teams: [createEmptyTeam("My Team")],
      activeTeamId: null,

      getActiveTeam: () => {
        const state = get();
        if (!state.activeTeamId && state.teams.length > 0) {
          return state.teams[0];
        }
        return state.teams.find((t) => t.id === state.activeTeamId) ?? null;
      },

      createTeam: (name) => {
        const team = createEmptyTeam(name);
        set((state) => ({
          teams: [...state.teams, team],
          activeTeamId: team.id,
        }));
        return team.id;
      },

      deleteTeam: (id) =>
        set((state) => {
          const filtered = state.teams.filter((t) => t.id !== id);
          if (filtered.length === 0) {
            const newTeam = createEmptyTeam("My Team");
            return { teams: [newTeam], activeTeamId: newTeam.id };
          }
          return {
            teams: filtered,
            activeTeamId:
              state.activeTeamId === id ? filtered[0].id : state.activeTeamId,
          };
        }),

      renameTeam: (id, name) =>
        set((state) => ({
          teams: state.teams.map((t) =>
            t.id === id ? { ...t, name } : t
          ),
        })),

      setActiveTeam: (id) => set({ activeTeamId: id }),

      addPokemonToSlot: (teamId, slotIndex, pokemon) =>
        set((state) => ({
          teams: state.teams.map((t) =>
            t.id === teamId
              ? {
                  ...t,
                  slots: t.slots.map((s, i) =>
                    i === slotIndex
                      ? { ...s, pokemon, nickname: "", moves: [null, null, null, null] }
                      : s
                  ),
                }
              : t
          ),
        })),

      removePokemonFromSlot: (teamId, slotIndex) =>
        set((state) => ({
          teams: state.teams.map((t) =>
            t.id === teamId
              ? {
                  ...t,
                  slots: t.slots.map((s, i) =>
                    i === slotIndex ? createEmptySlot() : s
                  ),
                }
              : t
          ),
        })),

      setMoveForSlot: (teamId, slotIndex, moveIndex, move) =>
        set((state) => ({
          teams: state.teams.map((t) =>
            t.id === teamId
              ? {
                  ...t,
                  slots: t.slots.map((s, i) =>
                    i === slotIndex
                      ? {
                          ...s,
                          moves: s.moves.map((m, mi) =>
                            mi === moveIndex ? move : m
                          ),
                        }
                      : s
                  ),
                }
              : t
          ),
        })),

      setNickname: (teamId, slotIndex, nickname) =>
        set((state) => ({
          teams: state.teams.map((t) =>
            t.id === teamId
              ? {
                  ...t,
                  slots: t.slots.map((s, i) =>
                    i === slotIndex ? { ...s, nickname } : s
                  ),
                }
              : t
          ),
        })),

      duplicateTeam: (id) =>
        set((state) => {
          const team = state.teams.find((t) => t.id === id);
          if (!team) return state;
          const newTeam: Team = {
            ...structuredClone(team),
            id: crypto.randomUUID(),
            name: `${team.name} (Copy)`,
            createdAt: Date.now(),
          };
          return {
            teams: [...state.teams, newTeam],
            activeTeamId: newTeam.id,
          };
        }),

      addPokemonToFirstEmpty: (pokemon) => {
        const state = get();
        const team = state.getActiveTeam();
        if (!team) return false;
        const emptyIndex = team.slots.findIndex((s) => !s.pokemon);
        if (emptyIndex === -1) return false;
        state.addPokemonToSlot(team.id, emptyIndex, pokemon);
        return true;
      },
    }),
    {
      name: "pokedex-teams",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
