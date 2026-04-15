import type { Pokemon, PokemonMove } from "./types";
import { getDualTypeEffectiveness } from "./type-effectiveness";

// ── Types ──────────────────────────────────────────────────────────

export interface BattleStats {
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

export interface BattleMove {
  name: string;
  type: string;
  power: number;
  accuracy: number;
  pp: number;
  currentPp: number;
  damageClass: "physical" | "special" | "status";
  priority: number;
  drain: number;
  healing: number;
  critRate: number;
  minHits: number | null;
  maxHits: number | null;
}

export interface BattlePokemon {
  pokemon: Pokemon;
  stats: BattleStats;
  moves: BattleMove[];
  types: string[];
}

export interface BattleLogEntry {
  turn: number;
  actor: "player" | "opponent";
  message: string;
  type: "move" | "damage" | "effectiveness" | "faint" | "info" | "heal" | "switch";
}

export type BattlePhase =
  | "idle"
  | "select-moves"
  | "player-turn"
  | "animating"
  | "switching"
  | "finished";

export interface BattleSide {
  team: BattlePokemon[];
  activeIndex: number;
}

export interface BattleState {
  player: BattleSide;
  opponent: BattleSide;
  log: BattleLogEntry[];
  turn: number;
  phase: BattlePhase;
  winner: "player" | "opponent" | null;
}

// Helpers to get active Pokemon
export function getActive(side: BattleSide): BattlePokemon {
  return side.team[side.activeIndex];
}

// ── Stat Calculation (Level 100, 31 IVs, 252 EVs, neutral nature) ──

const LEVEL = 100;
const IV = 31;
const EV = 252;

function calcHp(base: number): number {
  if (base === 1) return 1; // Shedinja
  return Math.floor(((2 * base + IV + Math.floor(EV / 4)) * LEVEL) / 100) + LEVEL + 10;
}

function calcStat(base: number): number {
  return Math.floor(((2 * base + IV + Math.floor(EV / 4)) * LEVEL) / 100) + 5;
}

export function calculateBattleStats(pokemon: Pokemon): BattleStats {
  const getStat = (name: string) =>
    pokemon.stats.find((s) => s.name === name)?.baseStat ?? 50;

  const hp = calcHp(getStat("hp"));
  return {
    hp,
    maxHp: hp,
    attack: calcStat(getStat("attack")),
    defense: calcStat(getStat("defense")),
    specialAttack: calcStat(getStat("special-attack")),
    specialDefense: calcStat(getStat("special-defense")),
    speed: calcStat(getStat("speed")),
  };
}

// ── Damage Calculation (Gen V+ formula) ────────────────────────────

function getStab(moveType: string, userTypes: string[]): number {
  return userTypes.includes(moveType) ? 1.5 : 1;
}

function getTypeMultiplier(moveType: string, targetTypes: string[]): number {
  return getDualTypeEffectiveness(moveType, targetTypes);
}

function randomRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function calculateDamage(
  attacker: BattlePokemon,
  defender: BattlePokemon,
  move: BattleMove
): { damage: number; effectiveness: number; isCrit: boolean } {
  if (move.power === 0) return { damage: 0, effectiveness: 1, isCrit: false };

  // Accuracy check
  if (move.accuracy > 0 && Math.random() * 100 > move.accuracy) {
    return { damage: -1, effectiveness: 1, isCrit: false }; // Miss
  }

  const isPhysical = move.damageClass === "physical";
  const atk = isPhysical ? attacker.stats.attack : attacker.stats.specialAttack;
  const def = isPhysical ? defender.stats.defense : defender.stats.specialDefense;

  // Critical hit: base 6.25%, +1 stage = 12.5%, +2 = 50%
  const critChances = [0.0625, 0.125, 0.5, 1];
  const critStage = Math.min(move.critRate, 3);
  const isCrit = Math.random() < critChances[critStage];
  const critMod = isCrit ? 1.5 : 1;

  // Random factor (85-100%)
  const randomFactor = randomRange(85, 100) / 100;

  // STAB
  const stab = getStab(move.type, attacker.types);

  // Type effectiveness
  const effectiveness = getTypeMultiplier(move.type, defender.types);

  // Gen V+ damage formula
  const baseDamage =
    Math.floor(
      (Math.floor((2 * LEVEL) / 5 + 2) * move.power * atk) / def / 50
    ) + 2;

  const finalDamage = Math.max(
    1,
    Math.floor(baseDamage * critMod * randomFactor * stab * effectiveness)
  );

  return { damage: finalDamage, effectiveness, isCrit };
}

// ── AI Trainer Logic ───────────────────────────────────────────────

export function aiChooseMove(
  aiPokemon: BattlePokemon,
  playerPokemon: BattlePokemon
): number {
  const moves = aiPokemon.moves;
  if (moves.length === 0) return 0;

  const scores = moves.map((move, i) => {
    if (move.currentPp <= 0) return { index: i, score: -1 };
    if (move.power === 0) {
      // Healing moves get a score boost when HP is low
      if (move.healing > 0 && aiPokemon.stats.hp < aiPokemon.stats.maxHp * 0.4) {
        return { index: i, score: 80 };
      }
      return { index: i, score: 5 };
    }

    const effectiveness = getTypeMultiplier(move.type, playerPokemon.types);
    const stab = getStab(move.type, aiPokemon.types);
    const isPhysical = move.damageClass === "physical";
    const atk = isPhysical
      ? aiPokemon.stats.attack
      : aiPokemon.stats.specialAttack;

    let score = move.power * stab * effectiveness * (atk / 200);

    if (effectiveness >= 2) score *= 1.5;
    if (effectiveness < 1) score *= 0.5;
    if (effectiveness === 0) score = 0;

    // Bonus for drain when HP is low
    if (move.drain > 0 && aiPokemon.stats.hp < aiPokemon.stats.maxHp * 0.6) {
      score *= 1.3;
    }

    // Slight penalty for recoil moves when HP is low
    if (move.drain < 0 && aiPokemon.stats.hp < aiPokemon.stats.maxHp * 0.3) {
      score *= 0.7;
    }

    // If this KOs, max priority
    const estDamage = calculateDamage(aiPokemon, playerPokemon, move).damage;
    if (estDamage >= playerPokemon.stats.hp) score += 999;

    return { index: i, score };
  });

  const usable = scores.filter((s) => s.score >= 0);
  if (usable.length === 0) return 0;

  usable.sort((a, b) => b.score - a.score);

  if (usable.length >= 2 && Math.random() < 0.3) {
    return usable[1].index;
  }
  return usable[0].index;
}

// ── Move Utilities ─────────────────────────────────────────────────

export function toBattleMove(move: PokemonMove): BattleMove {
  return {
    name: move.name,
    type: move.type,
    power: move.power ?? 0,
    accuracy: move.accuracy ?? 100,
    pp: move.pp ?? 10,
    currentPp: move.pp ?? 10,
    damageClass: move.damageClass,
    priority: move.priority ?? 0,
    drain: move.drain ?? 0,
    healing: move.healing ?? 0,
    critRate: move.critRate ?? 0,
    minHits: move.minHits ?? null,
    maxHits: move.maxHits ?? null,
  };
}

export function pickRandomMoves(allMoves: PokemonMove[]): PokemonMove[] {
  const damaging = allMoves.filter((m) => (m.power ?? 0) > 0);
  const pool = damaging.length >= 4 ? damaging : allMoves;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 4);
}

/** Pick 4 best moves for the AI trainer (blind — doesn't peek at opponent). */
export function pickSmartMoves(
  allMoves: PokemonMove[],
  userTypes: string[]
): PokemonMove[] {
  const damaging = allMoves.filter((m) => (m.power ?? 0) > 0);
  if (damaging.length === 0) return allMoves.slice(0, 4);

  const scored = damaging.map((m) => {
    const power = m.power ?? 0;
    const stab = userTypes.includes(m.type) ? 1.5 : 1;
    return { move: m, score: power * stab };
  });

  scored.sort((a, b) => b.score - a.score);

  const picked: PokemonMove[] = [];
  const usedTypes = new Set<string>();

  for (const { move } of scored) {
    if (picked.length >= 4) break;
    if (picked.length < 3 && usedTypes.has(move.type) && scored.length > 4) continue;
    picked.push(move);
    usedTypes.add(move.type);
  }

  for (const { move } of scored) {
    if (picked.length >= 4) break;
    if (!picked.includes(move)) picked.push(move);
  }

  return picked.slice(0, 4);
}

// ── Battle Execution ───────────────────────────────────────────────

export function executeTurn(
  state: BattleState,
  playerMoveIndex: number
): BattleState {
  const newState = structuredClone(state);
  const playerActive = getActive(newState.player);
  const opponentActive = getActive(newState.opponent);
  newState.turn++;

  const aiMoveIndex = aiChooseMove(opponentActive, playerActive);

  const playerMove = playerActive.moves[playerMoveIndex];
  const opponentMove = opponentActive.moves[aiMoveIndex];

  // Determine turn order: priority first, then speed
  let playerFirst: boolean;
  if ((playerMove?.priority ?? 0) !== (opponentMove?.priority ?? 0)) {
    playerFirst = (playerMove?.priority ?? 0) > (opponentMove?.priority ?? 0);
  } else {
    playerFirst =
      playerActive.stats.speed > opponentActive.stats.speed ||
      (playerActive.stats.speed === opponentActive.stats.speed && Math.random() < 0.5);
  }

  const first = playerFirst ? playerActive : opponentActive;
  const second = playerFirst ? opponentActive : playerActive;
  const firstMove = playerFirst ? playerMove : opponentMove;
  const secondMove = playerFirst ? opponentMove : playerMove;
  const firstActor: "player" | "opponent" = playerFirst ? "player" : "opponent";
  const secondActor: "player" | "opponent" = playerFirst ? "opponent" : "player";

  // Execute first move
  executeMove(newState, first, second, firstMove, firstActor);

  // Check if second Pokemon fainted before it moves
  if (second.stats.hp > 0) {
    executeMove(newState, second, first, secondMove, secondActor);
  }

  // Handle fainting and switching
  handleFaintAndSwitch(newState);

  return newState;
}

function executeMove(
  state: BattleState,
  attacker: BattlePokemon,
  defender: BattlePokemon,
  move: BattleMove,
  actor: "player" | "opponent"
): void {
  const attackerName = formatName(attacker.pokemon.name);
  const defenderName = formatName(defender.pokemon.name);
  const moveName = formatName(move.name);

  state.log.push({
    turn: state.turn,
    actor,
    message: `${attackerName} used ${moveName}!`,
    type: "move",
  });

  // Deduct PP
  move.currentPp = Math.max(0, move.currentPp - 1);

  // Status healing move (no power but heals)
  if (move.power === 0 && move.healing > 0) {
    const healAmount = Math.floor(attacker.stats.maxHp * (move.healing / 100));
    const actualHeal = Math.min(healAmount, attacker.stats.maxHp - attacker.stats.hp);
    attacker.stats.hp = Math.min(attacker.stats.maxHp, attacker.stats.hp + actualHeal);
    if (actualHeal > 0) {
      state.log.push({
        turn: state.turn,
        actor,
        message: `${attackerName} restored ${actualHeal} HP!`,
        type: "heal",
      });
    } else {
      state.log.push({
        turn: state.turn,
        actor,
        message: `${attackerName}'s HP is already full!`,
        type: "info",
      });
    }
    return;
  }

  if (move.power === 0) {
    state.log.push({
      turn: state.turn,
      actor,
      message: "But nothing happened...",
      type: "info",
    });
    return;
  }

  // Multi-hit moves
  const hits = (move.minHits != null && move.maxHits != null)
    ? randomRange(move.minHits, move.maxHits)
    : 1;

  let totalDamage = 0;
  let lastEffectiveness = 1;
  let anyCrit = false;

  for (let h = 0; h < hits; h++) {
    if (defender.stats.hp <= 0) break;

    const result = calculateDamage(attacker, defender, move);

    if (result.damage === -1) {
      if (h === 0) {
        state.log.push({
          turn: state.turn,
          actor,
          message: `${attackerName}'s attack missed!`,
          type: "info",
        });
      }
      return;
    }

    defender.stats.hp = Math.max(0, defender.stats.hp - result.damage);
    totalDamage += result.damage;
    lastEffectiveness = result.effectiveness;
    if (result.isCrit) anyCrit = true;
  }

  // Effectiveness messages
  if (lastEffectiveness >= 2) {
    state.log.push({
      turn: state.turn,
      actor,
      message: "It's super effective!",
      type: "effectiveness",
    });
  } else if (lastEffectiveness > 0 && lastEffectiveness < 1) {
    state.log.push({
      turn: state.turn,
      actor,
      message: "It's not very effective...",
      type: "effectiveness",
    });
  } else if (lastEffectiveness === 0) {
    state.log.push({
      turn: state.turn,
      actor,
      message: "It had no effect...",
      type: "effectiveness",
    });
    return;
  }

  if (anyCrit) {
    state.log.push({
      turn: state.turn,
      actor,
      message: "A critical hit!",
      type: "info",
    });
  }

  if (hits > 1) {
    state.log.push({
      turn: state.turn,
      actor,
      message: `Hit ${hits} times!`,
      type: "info",
    });
  }

  state.log.push({
    turn: state.turn,
    actor,
    message: `${defenderName} took ${totalDamage} damage!`,
    type: "damage",
  });

  // Drain effect (positive = absorb HP, negative = recoil)
  if (move.drain !== 0 && totalDamage > 0) {
    const drainAmount = Math.floor(totalDamage * Math.abs(move.drain) / 100);
    if (move.drain > 0) {
      // Absorb: heal attacker
      const actualHeal = Math.min(drainAmount, attacker.stats.maxHp - attacker.stats.hp);
      attacker.stats.hp = Math.min(attacker.stats.maxHp, attacker.stats.hp + actualHeal);
      if (actualHeal > 0) {
        state.log.push({
          turn: state.turn,
          actor,
          message: `${attackerName} drained ${actualHeal} HP!`,
          type: "heal",
        });
      }
    } else {
      // Recoil: damage attacker
      attacker.stats.hp = Math.max(0, attacker.stats.hp - drainAmount);
      state.log.push({
        turn: state.turn,
        actor,
        message: `${attackerName} took ${drainAmount} recoil damage!`,
        type: "damage",
      });
    }
  }
}

function handleFaintAndSwitch(state: BattleState): void {
  const playerActive = getActive(state.player);
  const opponentActive = getActive(state.opponent);

  // Check player faint
  if (playerActive.stats.hp <= 0) {
    state.log.push({
      turn: state.turn,
      actor: "player",
      message: `${formatName(playerActive.pokemon.name)} fainted!`,
      type: "faint",
    });

    // Try to send out next Pokemon
    const nextIndex = state.player.team.findIndex(
      (p, i) => i > state.player.activeIndex && p.stats.hp > 0
    );
    if (nextIndex !== -1) {
      state.player.activeIndex = nextIndex;
      const next = getActive(state.player);
      state.log.push({
        turn: state.turn,
        actor: "player",
        message: `Go, ${formatName(next.pokemon.name)}!`,
        type: "switch",
      });
    } else {
      state.winner = "opponent";
      state.phase = "finished";
      return;
    }
  }

  // Check opponent faint
  if (opponentActive.stats.hp <= 0) {
    state.log.push({
      turn: state.turn,
      actor: "opponent",
      message: `${formatName(opponentActive.pokemon.name)} fainted!`,
      type: "faint",
    });

    const nextIndex = state.opponent.team.findIndex(
      (p, i) => i > state.opponent.activeIndex && p.stats.hp > 0
    );
    if (nextIndex !== -1) {
      state.opponent.activeIndex = nextIndex;
      const next = getActive(state.opponent);
      state.log.push({
        turn: state.turn,
        actor: "opponent",
        message: `Trainer Claude sent out ${formatName(next.pokemon.name)}!`,
        type: "switch",
      });
    } else {
      state.winner = "player";
      state.phase = "finished";
      return;
    }
  }
}

export function formatName(name: string): string {
  return name
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ── Initialize Battle ──────────────────────────────────────────────

export interface BattleInitEntry {
  pokemon: Pokemon;
  moves: PokemonMove[];
}

export function initBattle(
  playerTeam: BattleInitEntry[],
  opponentTeam: BattleInitEntry[]
): BattleState {
  return {
    player: {
      team: playerTeam.map((e) => ({
        pokemon: e.pokemon,
        stats: calculateBattleStats(e.pokemon),
        moves: e.moves.slice(0, 4).map(toBattleMove),
        types: e.pokemon.types.map((t) => t.name),
      })),
      activeIndex: 0,
    },
    opponent: {
      team: opponentTeam.map((e) => ({
        pokemon: e.pokemon,
        stats: calculateBattleStats(e.pokemon),
        moves: e.moves.slice(0, 4).map(toBattleMove),
        types: e.pokemon.types.map((t) => t.name),
      })),
      activeIndex: 0,
    },
    log: [
      {
        turn: 0,
        actor: "opponent",
        message: "Trainer Claude wants to battle!",
        type: "info",
      },
    ],
    turn: 0,
    phase: "player-turn",
    winner: null,
  };
}
