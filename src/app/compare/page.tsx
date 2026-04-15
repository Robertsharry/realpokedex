"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitCompareArrows,
  Plus,
  X,
  Sparkles,
  Swords,
  Shuffle,
  ArrowLeft,
  Zap,
  Shield,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TypeBadge } from "@/components/pokemon/TypeBadge";
import { PokemonPicker } from "@/components/team-builder/PokemonPicker";
import { useShinyStore } from "@/stores/shiny-store";
import {
  getArtworkUrl,
  capitalize,
  STAT_LABELS,
  TYPE_COLORS,
  TOTAL_POKEMON,
} from "@/lib/constants";
import { getDualTypeEffectiveness } from "@/lib/type-effectiveness";
import { getPokemonMoves, getMoveDetails, getPokemon } from "@/lib/pokeapi";
import {
  initBattle,
  executeTurn,
  pickRandomMoves,
  pickSmartMoves,
  getActive,
  formatName,
  type BattleState,
  type BattleInitEntry,
} from "@/lib/battle";
import type { Pokemon, PokemonMove } from "@/lib/types";

type Mode = "compare" | "move-select" | "battle";
type PickTarget = "A1" | "A2" | "B1" | "B2" | null;

export default function ComparePage() {
  // 2 Pokemon per side
  const [playerTeam, setPlayerTeam] = useState<(Pokemon | null)[]>([null, null]);
  const [opponentTeam, setOpponentTeam] = useState<(Pokemon | null)[]>([null, null]);
  const [picking, setPicking] = useState<PickTarget>(null);
  const { isShiny } = useShinyStore();

  // Battle state
  const [mode, setMode] = useState<Mode>("compare");
  const [allPlayerMoves, setAllPlayerMoves] = useState<PokemonMove[][]>([[], []]);
  const [selectedMoves, setSelectedMoves] = useState<PokemonMove[][]>([[], []]);
  const [moveSelectSlot, setMoveSelectSlot] = useState(0);
  const [loadingMoves, setLoadingMoves] = useState(false);
  const [claudePicking, setClaudePicking] = useState(false);
  const [showOpponentMoves, setShowOpponentMoves] = useState(false);
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [animating, setAnimating] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [battleState?.log.length]);

  function setPlayerSlot(index: number, pokemon: Pokemon | null) {
    setPlayerTeam((prev) => { const n = [...prev]; n[index] = pokemon; return n; });
  }
  function setOpponentSlot(index: number, pokemon: Pokemon | null) {
    setOpponentTeam((prev) => { const n = [...prev]; n[index] = pokemon; return n; });
  }

  const playerReady = playerTeam.filter(Boolean).length >= 1;
  const opponentReady = opponentTeam.filter(Boolean).length >= 1;
  const bothReady = playerReady && opponentReady;

  async function claudePicksTeam() {
    setClaudePicking(true);
    try {
      const id1 = Math.floor(Math.random() * TOTAL_POKEMON) + 1;
      let id2 = Math.floor(Math.random() * TOTAL_POKEMON) + 1;
      while (id2 === id1) id2 = Math.floor(Math.random() * TOTAL_POKEMON) + 1;
      const [p1, p2] = await Promise.all([getPokemon(id1), getPokemon(id2)]);
      setOpponentTeam([p1, p2]);
    } catch (err) {
      console.error("Claude failed to pick:", err);
    }
    setClaudePicking(false);
  }

  async function loadMovesForBattle() {
    const activePlayers = playerTeam.filter(Boolean) as Pokemon[];
    const activeOpponents = opponentTeam.filter(Boolean) as Pokemon[];
    if (activePlayers.length === 0 || activeOpponents.length === 0) return;
    setLoadingMoves(true);

    try {
      const fetchMoveDetails = async (
        moves: { name: string; learnMethod: string; levelLearnedAt: number }[]
      ) => {
        const results: PokemonMove[] = [];
        for (let i = 0; i < moves.length; i += 10) {
          const batch = moves.slice(i, i + 10);
          const details = await Promise.all(
            batch.map(async (m) => {
              try {
                const d = await getMoveDetails(m.name);
                return { ...d, learnMethod: m.learnMethod, levelLearnedAt: m.levelLearnedAt };
              } catch { return null; }
            })
          );
          results.push(...(details.filter(Boolean) as PokemonMove[]));
        }
        return results;
      };

      // Fetch moves for all Pokemon in parallel
      const allRaw = await Promise.all(
        [...activePlayers, ...activeOpponents].map((p) => getPokemonMoves(p.id))
      );
      const allDetailed = await Promise.all(allRaw.map(fetchMoveDetails));

      const pMoves = allDetailed.slice(0, activePlayers.length);
      setAllPlayerMoves(pMoves);

      // AI picks moves for opponents (blind)
      const oMoves = allDetailed.slice(activePlayers.length);
      // Store opponent full move lists for display; AI picks happen at battle start

      setSelectedMoves(pMoves.map(() => []));
      setMoveSelectSlot(0);
      setMode("move-select");

      // Store opponent moves in a ref-like closure for battle start
      (window as unknown as Record<string, unknown>).__opponentMoves = oMoves.map((moves, i) =>
        pickSmartMoves(moves, activeOpponents[i].types.map((t) => t.name))
      );
    } catch (err) {
      console.error("Failed to load moves:", err);
    }
    setLoadingMoves(false);
  }

  function startBattle() {
    const activePlayers = playerTeam.filter(Boolean) as Pokemon[];
    const activeOpponents = opponentTeam.filter(Boolean) as Pokemon[];
    if (activePlayers.length === 0 || activeOpponents.length === 0) return;

    const opponentMoves = (window as unknown as Record<string, unknown>).__opponentMoves as PokemonMove[][];

    const pTeam: BattleInitEntry[] = activePlayers.map((p, i) => ({
      pokemon: p,
      moves: selectedMoves[i] ?? [],
    }));
    const oTeam: BattleInitEntry[] = activeOpponents.map((p, i) => ({
      pokemon: p,
      moves: opponentMoves?.[i] ?? [],
    }));

    const state = initBattle(pTeam, oTeam);
    setBattleState(state);
    setMode("battle");
  }

  function handlePlayerMove(moveIndex: number) {
    if (!battleState || battleState.phase === "finished" || animating) return;
    setAnimating(true);
    setTimeout(() => {
      const newState = executeTurn(battleState, moveIndex);
      setBattleState(newState);
      setAnimating(false);
    }, 300);
  }

  function resetBattle() {
    setBattleState(null);
    setMode("compare");
    setSelectedMoves([[], []]);
    setShowOpponentMoves(false);
  }

  function toggleMoveSelection(slot: number, move: PokemonMove) {
    setSelectedMoves((prev) => {
      const updated = [...prev];
      const current = [...(updated[slot] ?? [])];
      const exists = current.find((m) => m.name === move.name);
      if (exists) {
        updated[slot] = current.filter((m) => m.name !== move.name);
      } else if (current.length < 4) {
        updated[slot] = [...current, move];
      }
      return updated;
    });
  }

  function getTypeAdvantage(): string {
    const p = playerTeam.filter(Boolean) as Pokemon[];
    const o = opponentTeam.filter(Boolean) as Pokemon[];
    if (p.length === 0 || o.length === 0) return "";
    // Check first matchup
    const pTypes = p[0].types.map((t) => t.name);
    const oTypes = o[0].types.map((t) => t.name);
    let pAdv = false, oAdv = false;
    for (const t of pTypes) if (getDualTypeEffectiveness(t, oTypes) > 1) { pAdv = true; break; }
    for (const t of oTypes) if (getDualTypeEffectiveness(t, pTypes) > 1) { oAdv = true; break; }
    if (pAdv && !oAdv) return `${capitalize(p[0].name)} has type advantage!`;
    if (oAdv && !pAdv) return `${capitalize(o[0].name)} has type advantage!`;
    if (pAdv && oAdv) return "Both have type advantage - mutual threat!";
    return "Neutral type matchup";
  }

  const statNames = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"];

  // ── Battle Mode UI ──────────────────────────────────────────────
  if (mode === "battle" && battleState) {
    const { player, opponent, log, phase, winner } = battleState;
    const pActive = getActive(player);
    const oActive = getActive(opponent);
    const playerHpPct = Math.max(0, (pActive.stats.hp / pActive.stats.maxHp) * 100);
    const opponentHpPct = Math.max(0, (oActive.stats.hp / oActive.stats.maxHp) * 100);

    const hpColor = (pct: number) =>
      pct > 50 ? "#22c55e" : pct > 20 ? "#eab308" : "#ef4444";

    return (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={resetBattle} className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div className="flex items-center gap-2">
            <Swords className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-extrabold">BATTLE!</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={resetBattle} className="gap-1">
            <RotateCcw className="h-4 w-4" /> Restart
          </Button>
        </div>

        {/* Team indicators */}
        <div className="mb-3 flex items-center justify-between px-1">
          <div className="flex gap-1">
            {player.team.map((p, i) => (
              <div
                key={i}
                className={`h-3 w-3 rounded-full border transition-all ${
                  i === player.activeIndex
                    ? "border-blue-400 bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.5)]"
                    : p.stats.hp > 0
                      ? "border-green-600 bg-green-500"
                      : "border-red-800 bg-red-600"
                }`}
                title={`${formatName(p.pokemon.name)}: ${p.stats.hp}/${p.stats.maxHp} HP`}
              />
            ))}
          </div>
          <div className="flex gap-1">
            {opponent.team.map((p, i) => (
              <div
                key={i}
                className={`h-3 w-3 rounded-full border transition-all ${
                  i === opponent.activeIndex
                    ? "border-orange-400 bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.5)]"
                    : p.stats.hp > 0
                      ? "border-green-600 bg-green-500"
                      : "border-red-800 bg-red-600"
                }`}
                title={`${formatName(p.pokemon.name)}: ${p.stats.hp}/${p.stats.maxHp} HP`}
              />
            ))}
          </div>
        </div>

        {/* Battle Arena */}
        <div className="pokedex-screen relative overflow-hidden rounded-2xl p-4">
          {/* Opponent */}
          <div className="mb-2 flex items-start justify-between">
            <div className="flex-1">
              <div className="rounded-lg bg-black/30 px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">{capitalize(oActive.pokemon.name)}</span>
                  <span className="text-xs text-muted-foreground">Lv100</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[10px] font-bold text-muted-foreground">HP</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-black/40">
                    <motion.div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${opponentHpPct}%`, backgroundColor: hpColor(opponentHpPct) }}
                    />
                  </div>
                </div>
                <div className="mt-0.5 text-right text-[10px] tabular-nums text-muted-foreground">
                  {oActive.stats.hp}/{oActive.stats.maxHp}
                </div>
              </div>
            </div>
            <motion.div
              key={oActive.pokemon.id}
              className={`relative -mr-2 -mt-2 h-32 w-32 sm:h-40 sm:w-40 ${isShiny(oActive.pokemon.id) ? "animate-shiny-glow" : ""}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: animating ? -10 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <Image
                src={getArtworkUrl(oActive.pokemon.id, isShiny(oActive.pokemon.id))}
                alt={oActive.pokemon.name}
                fill
                sizes="160px"
                className="object-contain drop-shadow-lg"
              />
              {oActive.stats.hp <= 0 && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                  <span className="text-lg font-bold text-red-400">KO</span>
                </div>
              )}
            </motion.div>
          </div>

          <div className="mb-2 text-center">
            <span className="rounded-full bg-primary/20 px-3 py-0.5 text-[10px] font-bold text-primary">
              TRAINER CLAUDE
            </span>
          </div>

          {/* Player */}
          <div className="flex items-end justify-between">
            <motion.div
              key={pActive.pokemon.id}
              className={`relative -mb-2 -ml-2 h-36 w-36 sm:h-44 sm:w-44 ${isShiny(pActive.pokemon.id) ? "animate-shiny-glow" : ""}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: animating ? 10 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <Image
                src={getArtworkUrl(pActive.pokemon.id, isShiny(pActive.pokemon.id))}
                alt={pActive.pokemon.name}
                fill
                sizes="176px"
                className="object-contain drop-shadow-lg"
              />
              {pActive.stats.hp <= 0 && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                  <span className="text-lg font-bold text-red-400">KO</span>
                </div>
              )}
            </motion.div>
            <div className="flex-1">
              <div className="rounded-lg bg-black/30 px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">{capitalize(pActive.pokemon.name)}</span>
                  <span className="text-xs text-muted-foreground">Lv100</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[10px] font-bold text-muted-foreground">HP</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-black/40">
                    <motion.div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${playerHpPct}%`, backgroundColor: hpColor(playerHpPct) }}
                    />
                  </div>
                </div>
                <div className="mt-0.5 text-right text-[10px] tabular-nums text-muted-foreground">
                  {pActive.stats.hp}/{pActive.stats.maxHp}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Battle Log */}
        <div className="mt-4 max-h-40 overflow-y-auto rounded-xl bg-black/20 p-3">
          <AnimatePresence>
            {log.map((entry, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-sm ${
                  entry.type === "effectiveness"
                    ? entry.message.includes("super")
                      ? "font-bold text-red-400"
                      : entry.message.includes("not very")
                        ? "text-yellow-400"
                        : "text-zinc-500"
                    : entry.type === "faint"
                      ? "font-bold text-red-500"
                      : entry.type === "damage"
                        ? "text-orange-300"
                        : entry.type === "heal"
                          ? "font-medium text-green-400"
                          : entry.type === "switch"
                            ? "font-bold text-cyan-400"
                            : entry.type === "info" && entry.message.includes("critical")
                              ? "font-bold text-yellow-300"
                              : "text-muted-foreground"
                }`}
              >
                {entry.message}
              </motion.p>
            ))}
          </AnimatePresence>
          <div ref={logEndRef} />
        </div>

        {/* Opponent Moves Toggle */}
        <div className="mt-3">
          <button
            onClick={() => setShowOpponentMoves(!showOpponentMoves)}
            className="w-full rounded-lg bg-black/10 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-black/20"
          >
            {showOpponentMoves ? "Hide" : "Show"} {capitalize(oActive.pokemon.name)}&apos;s Moves
          </button>
          {showOpponentMoves && (
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {oActive.moves.map((move, i) => {
                const typeColor = TYPE_COLORS[move.type]?.bg ?? "#888";
                return (
                  <div
                    key={i}
                    className="rounded-lg border border-border/30 px-2 py-1.5 text-left"
                    style={{ background: `${typeColor}10`, borderColor: `${typeColor}40` }}
                  >
                    <span className="text-xs font-medium">{capitalize(move.name.replace(/-/g, " "))}</span>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[9px] text-muted-foreground">
                      <TypeBadge type={move.type} size="sm" />
                      {move.power > 0 && <span>{move.power} pwr</span>}
                      <span>PP {move.currentPp}/{move.pp}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Move Buttons or Result */}
        <div className="mt-4">
          {phase === "finished" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-xl p-6 text-center"
            >
              <p className="mb-2 text-2xl font-black">
                {winner === "player" ? (
                  <span className="text-green-400">YOU WIN!</span>
                ) : (
                  <span className="text-red-400">YOU LOST!</span>
                )}
              </p>
              <p className="mb-4 text-sm text-muted-foreground">
                {winner === "player"
                  ? "You defeated Trainer Claude!"
                  : "Trainer Claude defeated you!"}
              </p>
              <div className="flex justify-center gap-3">
                <Button onClick={resetBattle} className="gap-2">
                  <RotateCcw className="h-4 w-4" /> Rematch
                </Button>
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {pActive.moves.map((move, i) => {
                const typeColor = TYPE_COLORS[move.type]?.bg ?? "#888";
                const isDisabled = move.currentPp <= 0 || animating;
                const hasDrain = move.drain > 0;
                const hasRecoil = move.drain < 0;
                const hasPriority = move.priority > 0;
                return (
                  <button
                    key={i}
                    onClick={() => handlePlayerMove(i)}
                    disabled={isDisabled}
                    className="relative overflow-hidden rounded-xl border-2 px-3 py-3 text-left font-bold transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40"
                    style={{
                      borderColor: typeColor,
                      background: `linear-gradient(135deg, ${typeColor}20, transparent)`,
                    }}
                  >
                    <span className="text-sm">{capitalize(move.name.replace(/-/g, " "))}</span>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                      <TypeBadge type={move.type} size="sm" />
                      {move.power > 0 && (
                        <span className="flex items-center gap-0.5">
                          <Zap className="h-3 w-3" />{move.power}
                        </span>
                      )}
                      <span>PP {move.currentPp}/{move.pp}</span>
                    </div>
                    {/* Effect indicators */}
                    <div className="mt-1 flex gap-1">
                      {hasDrain && (
                        <span className="rounded bg-green-500/20 px-1 py-0.5 text-[8px] font-bold text-green-400">
                          DRAIN
                        </span>
                      )}
                      {hasRecoil && (
                        <span className="rounded bg-red-500/20 px-1 py-0.5 text-[8px] font-bold text-red-400">
                          RECOIL
                        </span>
                      )}
                      {hasPriority && (
                        <span className="rounded bg-blue-500/20 px-1 py-0.5 text-[8px] font-bold text-blue-400">
                          PRIORITY
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Move Selection UI ───────────────────────────────────────────
  if (mode === "move-select") {
    const activePlayers = playerTeam.filter(Boolean) as Pokemon[];
    const currentPokemon = activePlayers[moveSelectSlot];
    const currentMoves = allPlayerMoves[moveSelectSlot] ?? [];
    const damagingMoves = currentMoves.filter((m) => (m.power ?? 0) > 0);
    const currentSelected = selectedMoves[moveSelectSlot] ?? [];
    const isLastSlot = moveSelectSlot >= activePlayers.length - 1;
    const allSlotsReady = selectedMoves.every((s, i) => i >= activePlayers.length || s.length === 4);

    if (!currentPokemon) {
      setMode("compare");
      return null;
    }

    return (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => moveSelectSlot > 0 ? setMoveSelectSlot(moveSelectSlot - 1) : setMode("compare")}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <h1 className="text-lg font-extrabold">
            Choose Moves ({moveSelectSlot + 1}/{activePlayers.length})
          </h1>
          <div className="w-16" />
        </div>

        <div className="mb-4 text-center">
          <div className="relative mx-auto mb-2 h-24 w-24">
            <Image
              src={getArtworkUrl(currentPokemon.id, isShiny(currentPokemon.id))}
              alt={currentPokemon.name}
              fill
              sizes="96px"
              className="object-contain"
            />
          </div>
          <p className="text-sm font-bold">{capitalize(currentPokemon.name)}</p>
          <p className="text-xs text-muted-foreground">
            Select 4 moves ({currentSelected.length}/4)
          </p>
        </div>

        <div className="mb-4 flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const picked = pickRandomMoves(currentMoves);
              setSelectedMoves((prev) => {
                const n = [...prev]; n[moveSelectSlot] = picked; return n;
              });
            }}
            className="gap-1"
          >
            <Shuffle className="h-3.5 w-3.5" /> Random
          </Button>
          {currentSelected.length === 4 && (
            isLastSlot ? (
              allSlotsReady && (
                <Button size="sm" onClick={startBattle} className="gap-1">
                  <Swords className="h-3.5 w-3.5" /> Start Battle!
                </Button>
              )
            ) : (
              <Button size="sm" onClick={() => setMoveSelectSlot(moveSelectSlot + 1)} className="gap-1">
                Next Pokemon
              </Button>
            )
          )}
        </div>

        <div className="max-h-[60vh] space-y-1.5 overflow-y-auto rounded-xl border border-border/50 p-3">
          {damagingMoves.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No damaging moves found. Try random selection.
            </p>
          ) : (
            damagingMoves
              .sort((a, b) => (b.power ?? 0) - (a.power ?? 0))
              .map((move) => {
                const isSelected = currentSelected.some((m) => m.name === move.name);
                const typeColor = TYPE_COLORS[move.type]?.bg ?? "#888";
                const hasDrain = (move.drain ?? 0) > 0;
                const hasRecoil = (move.drain ?? 0) < 0;
                const hasPriority = (move.priority ?? 0) > 0;
                return (
                  <button
                    key={move.name}
                    onClick={() => toggleMoveSelection(moveSelectSlot, move)}
                    disabled={!isSelected && currentSelected.length >= 4}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-all ${
                      isSelected
                        ? "ring-2"
                        : "hover:bg-accent/30 disabled:opacity-30"
                    }`}
                    style={isSelected ? { borderColor: typeColor, outlineColor: typeColor, background: `${typeColor}15` } : {}}
                  >
                    <TypeBadge type={move.type} size="sm" />
                    <span className="flex-1 text-sm font-medium">
                      {capitalize(move.name.replace(/-/g, " "))}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {hasDrain && (
                        <span className="rounded bg-green-500/20 px-1 py-0.5 text-[9px] font-bold text-green-400">
                          DRAIN
                        </span>
                      )}
                      {hasRecoil && (
                        <span className="rounded bg-red-500/20 px-1 py-0.5 text-[9px] font-bold text-red-400">
                          RECOIL
                        </span>
                      )}
                      {hasPriority && (
                        <span className="rounded bg-blue-500/20 px-1 py-0.5 text-[9px] font-bold text-blue-400">
                          +PRI
                        </span>
                      )}
                      {move.power && (
                        <span className="flex items-center gap-1">
                          <Zap className="h-3 w-3" /> {move.power}
                        </span>
                      )}
                      {move.accuracy && (
                        <span className="flex items-center gap-1">
                          <Shield className="h-3 w-3" /> {move.accuracy}%
                        </span>
                      )}
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase">
                        {move.damageClass}
                      </span>
                    </div>
                  </button>
                );
              })
          )}
        </div>
      </div>
    );
  }

  // ── Compare Mode (default) ──────────────────────────────────────

  function renderSlot(
    pokemon: Pokemon | null,
    label: string,
    pickTarget: PickTarget,
    onClear: () => void
  ) {
    if (pokemon) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          <button
            onClick={() => { onClear(); resetBattle(); }}
            className="absolute right-0 top-0 z-10 rounded-full bg-destructive p-1 text-white"
          >
            <X className="h-3 w-3" />
          </button>
          <div className={`relative mx-auto mb-2 h-28 w-28 ${isShiny(pokemon.id) ? "animate-shiny-glow" : ""}`}>
            <Image
              src={getArtworkUrl(pokemon.id, isShiny(pokemon.id))}
              alt={pokemon.name}
              fill
              sizes="112px"
              className="object-contain drop-shadow-lg"
            />
            {isShiny(pokemon.id) && (
              <Sparkles className="absolute -right-1 -top-1 h-3 w-3 animate-sparkle fill-yellow-400 text-yellow-400" />
            )}
          </div>
          <h3 className="text-sm font-bold">{capitalize(pokemon.name)}</h3>
          <div className="mt-1 flex justify-center gap-1">
            {pokemon.types.map((t) => (
              <TypeBadge key={t.name} type={t.name} size="sm" />
            ))}
          </div>
        </motion.div>
      );
    }
    return (
      <button
        onClick={() => setPicking(pickTarget)}
        className="flex h-40 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/50 transition-colors hover:border-primary/50 hover:bg-accent/30"
      >
        <Plus className="h-6 w-6 text-muted-foreground/40" />
        <span className="mt-1 text-xs text-muted-foreground">{label}</span>
      </button>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <GitCompareArrows className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-extrabold">Compare & Battle</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick up to 2 Pokemon each. Compare stats or battle Trainer Claude!
        </p>
      </div>

      {/* Selection Grid: 2v2 */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:gap-8">
        {/* Player side */}
        <div>
          <p className="mb-2 text-center text-xs font-bold text-muted-foreground">YOUR TEAM</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center">
              {renderSlot(playerTeam[0], "Pokemon 1", "A1", () => setPlayerSlot(0, null))}
            </div>
            <div className="text-center">
              {renderSlot(playerTeam[1], "Pokemon 2", "A2", () => setPlayerSlot(1, null))}
            </div>
          </div>
        </div>

        {/* Opponent side */}
        <div>
          <p className="mb-2 text-center text-xs font-bold text-muted-foreground">TRAINER CLAUDE</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center">
              {renderSlot(opponentTeam[0], "Pokemon 1", "B1", () => setOpponentSlot(0, null))}
            </div>
            <div className="text-center">
              {renderSlot(opponentTeam[1], "Pokemon 2", "B2", () => setOpponentSlot(1, null))}
            </div>
          </div>
          <div className="mt-2 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={claudePicksTeam}
              disabled={claudePicking}
              className="gap-2"
            >
              {claudePicking ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Thinking...
                </>
              ) : (
                <>
                  <Shuffle className="h-3.5 w-3.5" />
                  Let Claude Pick
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Battle button */}
      {bothReady && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 text-center"
        >
          <Button
            onClick={loadMovesForBattle}
            disabled={loadingMoves}
            size="lg"
            className="gap-2 text-lg font-black"
          >
            {loadingMoves ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Loading moves...
              </>
            ) : (
              <>
                <Swords className="h-5 w-5" />
                BATTLE!
              </>
            )}
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            Level 100, max IVs & EVs. Drain, recoil, priority & more!
          </p>
        </motion.div>
      )}

      {/* Type advantage (first matchup) */}
      {bothReady && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-xl bg-primary/5 p-4 text-center"
        >
          <p className="text-sm font-bold text-primary">{getTypeAdvantage()}</p>
        </motion.div>
      )}

      {/* Stat Comparison (first Pokemon of each side) */}
      {playerTeam[0] && opponentTeam[0] && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border/50 p-6"
        >
          <h2 className="mb-6 text-lg font-bold">Stat Comparison</h2>

          <div className="mb-8 flex justify-center">
            <svg viewBox="0 0 300 300" className="h-64 w-64">
              {[1, 0.75, 0.5, 0.25].map((scale) => (
                <polygon
                  key={scale}
                  points={statNames.map((_, i) => {
                    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                    const r = 120 * scale;
                    return `${150 + r * Math.cos(angle)},${150 + r * Math.sin(angle)}`;
                  }).join(" ")}
                  fill="none" stroke="currentColor" strokeWidth="0.5" className="text-border"
                />
              ))}
              {statNames.map((_, i) => {
                const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                return (
                  <line key={i} x1="150" y1="150"
                    x2={150 + 120 * Math.cos(angle)} y2={150 + 120 * Math.sin(angle)}
                    stroke="currentColor" strokeWidth="0.5" className="text-border" />
                );
              })}
              <polygon
                points={statNames.map((stat, i) => {
                  const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                  const val = playerTeam[0]!.stats.find((s) => s.name === stat)?.baseStat ?? 0;
                  return `${150 + ((val / 255) * 120) * Math.cos(angle)},${150 + ((val / 255) * 120) * Math.sin(angle)}`;
                }).join(" ")}
                fill="rgba(99, 144, 240, 0.2)" stroke="#6390F0" strokeWidth="2"
              />
              <polygon
                points={statNames.map((stat, i) => {
                  const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                  const val = opponentTeam[0]!.stats.find((s) => s.name === stat)?.baseStat ?? 0;
                  return `${150 + ((val / 255) * 120) * Math.cos(angle)},${150 + ((val / 255) * 120) * Math.sin(angle)}`;
                }).join(" ")}
                fill="rgba(238, 129, 48, 0.2)" stroke="#EE8130" strokeWidth="2"
              />
              {statNames.map((stat, i) => {
                const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                return (
                  <text key={stat} x={150 + 140 * Math.cos(angle)} y={150 + 140 * Math.sin(angle)}
                    textAnchor="middle" dominantBaseline="middle"
                    className="fill-muted-foreground text-[10px] font-bold"
                  >{STAT_LABELS[stat]}</text>
                );
              })}
            </svg>
          </div>

          <div className="mb-6 flex justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[#6390F0]" />
              <span>{capitalize(playerTeam[0]!.name)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[#EE8130]" />
              <span>{capitalize(opponentTeam[0]!.name)}</span>
            </div>
          </div>

          <div className="space-y-3">
            {statNames.map((stat) => {
              const aVal = playerTeam[0]!.stats.find((s) => s.name === stat)?.baseStat ?? 0;
              const bVal = opponentTeam[0]!.stats.find((s) => s.name === stat)?.baseStat ?? 0;
              const max = Math.max(aVal, bVal, 1);
              return (
                <div key={stat} className="flex items-center gap-2">
                  <span className="w-8 text-right text-xs font-bold text-muted-foreground">{STAT_LABELS[stat]}</span>
                  <span className={`w-8 text-right text-xs font-bold tabular-nums ${aVal >= bVal ? "text-[#6390F0]" : "text-muted-foreground"}`}>{aVal}</span>
                  <div className="flex flex-1 gap-0.5">
                    <div className="flex h-4 flex-1 justify-end overflow-hidden rounded-l-full bg-muted/30">
                      <motion.div className="rounded-l-full bg-[#6390F0]" initial={{ width: 0 }} animate={{ width: `${(aVal / max) * 100}%` }} transition={{ duration: 0.6 }} />
                    </div>
                    <div className="flex h-4 flex-1 overflow-hidden rounded-r-full bg-muted/30">
                      <motion.div className="rounded-r-full bg-[#EE8130]" initial={{ width: 0 }} animate={{ width: `${(bVal / max) * 100}%` }} transition={{ duration: 0.6 }} />
                    </div>
                  </div>
                  <span className={`w-8 text-xs font-bold tabular-nums ${bVal >= aVal ? "text-[#EE8130]" : "text-muted-foreground"}`}>{bVal}</span>
                </div>
              );
            })}
            <div className="flex items-center gap-2 border-t border-border/50 pt-2">
              <span className="w-8 text-right text-xs font-bold text-muted-foreground">TOT</span>
              <span className="w-8 text-right text-xs font-extrabold tabular-nums">
                {playerTeam[0]!.stats.reduce((s, st) => s + st.baseStat, 0)}
              </span>
              <div className="flex-1" />
              <span className="w-8 text-xs font-extrabold tabular-nums">
                {opponentTeam[0]!.stats.reduce((s, st) => s + st.baseStat, 0)}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Picker */}
      <PokemonPicker
        open={picking !== null}
        onClose={() => setPicking(null)}
        onSelect={(p) => {
          if (picking === "A1") setPlayerSlot(0, p);
          else if (picking === "A2") setPlayerSlot(1, p);
          else if (picking === "B1") setOpponentSlot(0, p);
          else if (picking === "B2") setOpponentSlot(1, p);
          setPicking(null);
        }}
      />
    </div>
  );
}
