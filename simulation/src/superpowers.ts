// ============================================================
// superpowers.ts — Superpower pool (15 powers), assignment, activation
// ============================================================
import { Superpower } from './types';

// ── Full superpower pool ──────────────────────────────────
export const SUPERPOWER_POOL: Omit<Superpower, 'lastUsedTick'>[] = [
  {
    name: 'Chrono Glimpse',
    description: 'See 3 ticks into the future — gain foresight bonus',
    cooldownTicks: 8,
    power: 0.75,
  },
  {
    name: 'Ember Voice',
    description: 'Persuade any organism, boosting charisma effect by 3x for one interaction',
    cooldownTicks: 6,
    power: 0.70,
  },
  {
    name: 'Iron Will',
    description: 'Become immune to emotional state changes for 5 ticks',
    cooldownTicks: 12,
    power: 0.80,
  },
  {
    name: 'Shadow Step',
    description: 'Teleport to any location in the town instantly',
    cooldownTicks: 5,
    power: 0.60,
  },
  {
    name: 'Verdant Touch',
    description: "Heal another organism's emotional state to 'calm'",
    cooldownTicks: 7,
    power: 0.65,
  },
  {
    name: 'Echo Memory',
    description: 'Perfectly recall and replay any past episode, gaining new insight',
    cooldownTicks: 10,
    power: 0.70,
  },
  {
    name: 'Spark Forge',
    description: 'Create a new artifact or resource in the town',
    cooldownTicks: 9,
    power: 0.65,
  },
  {
    name: 'Mind Link',
    description: 'Temporarily share trait vectors with another organism',
    cooldownTicks: 11,
    power: 0.75,
  },
  {
    name: 'Titan Skin',
    description: 'Become immune to aggression-based interactions for 3 ticks',
    cooldownTicks: 8,
    power: 0.70,
  },
  {
    name: 'Dream Weave',
    description: "Influence another organism's drives while they're in 'melancholy' state",
    cooldownTicks: 10,
    power: 0.80,
  },
  {
    name: 'Pulse Sight',
    description: 'Detect the emotional state of all organisms in the town',
    cooldownTicks: 4,
    power: 0.55,
  },
  {
    name: 'Rift Walk',
    description: 'Create a temporary zone that boosts creativity for all nearby organisms',
    cooldownTicks: 12,
    power: 0.75,
  },
  {
    name: 'Blood Howl',
    description: 'Boost the courage of all organisms sharing your bloodline',
    cooldownTicks: 10,
    power: 0.70,
  },
  {
    name: 'Null Field',
    description: "Cancel another organism's superpower activation",
    cooldownTicks: 7,
    power: 0.65,
  },
  {
    name: 'Genesis Spark',
    description: 'Fork yourself — create a child organism mid-simulation',
    cooldownTicks: 50,
    power: 1.0,
  },
];

export function getSuperpowerByName(name: string): Omit<Superpower, 'lastUsedTick'> | undefined {
  return SUPERPOWER_POOL.find((sp) => sp.name === name);
}

export function buildSuperpowers(names: string[]): Superpower[] {
  return names.map((name) => {
    const base = getSuperpowerByName(name);
    if (!base) throw new Error(`Unknown superpower: ${name}`);
    return { ...base, lastUsedTick: -999 };
  });
}

export function isOnCooldown(sp: Superpower, currentTick: number): boolean {
  return currentTick - sp.lastUsedTick < sp.cooldownTicks;
}

export function getReadySuperpowers(superpowers: Superpower[], currentTick: number): Superpower[] {
  return superpowers.filter((sp) => !isOnCooldown(sp, currentTick));
}

/**
 * Check whether any superpower should auto-activate this tick.
 * Returns the name of the power to activate, or null.
 */
export function choosePowerToActivate(
  superpowers: Superpower[],
  currentTick: number,
  activationChance: number,
  rng: () => number,
): Superpower | null {
  const ready = getReadySuperpowers(superpowers, currentTick);
  if (ready.length === 0) return null;
  if (rng() > activationChance) return null;

  // Weighted by power
  const total = ready.reduce((s, sp) => s + sp.power, 0);
  let roll = rng() * total;
  for (const sp of ready) {
    roll -= sp.power;
    if (roll <= 0) return sp;
  }
  return ready[ready.length - 1];
}
