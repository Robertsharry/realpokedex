import { PokemonGrid } from "@/components/pokemon/PokemonGrid";

export default function Home() {
  return (
    <div>
      {/* Hero with Pokedex device aesthetic */}
      <div className="mb-8 text-center">
        {/* Scanner and lights row */}
        <div className="mb-4 inline-flex items-center gap-3">
          <div className="relative flex h-12 w-12 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 animate-scanner-pulse" />
            <div className="absolute inset-[3px] rounded-full bg-gradient-to-br from-cyan-300 to-blue-500" />
            <div className="absolute inset-[7px] rounded-full bg-gradient-to-br from-white/80 to-cyan-200/60" />
            <div className="absolute left-[10px] top-[10px] h-3 w-3 rounded-full bg-white/90" />
          </div>
          <div className="flex gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.4)]" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.4)]" />
          </div>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Real<span className="text-primary">Pokedex</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your ultimate Pokemon companion. Search, explore, and build the perfect team.
        </p>
        <div className="mx-auto mt-3 h-px w-48 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      </div>

      <PokemonGrid />
    </div>
  );
}
