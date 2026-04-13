import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface ShinyState {
  /** Global toggle — when true, all Pokemon show shiny variants */
  globalShiny: boolean;
  /** Per-Pokemon shiny overrides (for individual toggling) */
  shinyIds: number[];
  toggleGlobalShiny: () => void;
  toggleShiny: (id: number) => void;
  isShiny: (id: number) => boolean;
}

export const useShinyStore = create<ShinyState>()(
  persist(
    (set, get) => ({
      globalShiny: false,
      shinyIds: [],
      toggleGlobalShiny: () =>
        set((state) => ({ globalShiny: !state.globalShiny })),
      toggleShiny: (id) =>
        set((state) => ({
          shinyIds: state.shinyIds.includes(id)
            ? state.shinyIds.filter((sid) => sid !== id)
            : [...state.shinyIds, id],
        })),
      isShiny: (id) => {
        const state = get();
        // Global toggle XOR individual toggle
        const individualToggled = state.shinyIds.includes(id);
        return state.globalShiny ? !individualToggled : individualToggled;
      },
    }),
    {
      name: "pokedex-shiny",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
