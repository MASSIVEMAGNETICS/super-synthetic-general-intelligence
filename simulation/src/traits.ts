// ============================================================
// traits.ts — Trait vector + drift engine
// ============================================================
import { TraitVector, TraitKey, Episode } from './types';

export function createRandomTraits(rng: () => number): TraitVector {
  const rand = () => Math.round((0.3 + rng() * 0.5) * 100) / 100;
  return {
    courage: rand(),
    cunning: rand(),
    empathy: rand(),
    creativity: rand(),
    discipline: rand(),
    charisma: rand(),
    resilience: rand(),
    curiosity: rand(),
    aggression: rand(),
    wisdom: rand(),
  };
}

export function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Drift each trait by a tiny random delta, influenced by recent episodes.
 */
export function driftTraits(
  traits: TraitVector,
  recentEpisodes: Episode[],
  rng: () => number,
): TraitVector {
  const delta = (): number => (rng() - 0.5) * 0.04; // -0.02 to +0.02

  const updated = { ...traits };
  const keys = Object.keys(updated) as TraitKey[];
  for (const key of keys) {
    updated[key] = clamp(updated[key] + delta());
  }

  // Episode-influenced drift
  for (const ep of recentEpisodes.slice(-5)) {
    if (ep.type === 'conflict') {
      updated.aggression = clamp(updated.aggression + 0.01);
      updated.empathy = clamp(updated.empathy - 0.01);
    }
    if (ep.type === 'cooperation') {
      updated.empathy = clamp(updated.empathy + 0.01);
      updated.aggression = clamp(updated.aggression - 0.01);
    }
    if (ep.type === 'discovery') {
      updated.curiosity = clamp(updated.curiosity + 0.01);
      updated.wisdom = clamp(updated.wisdom + 0.005);
    }
    if (ep.type === 'superpower_use') {
      updated.courage = clamp(updated.courage + 0.01);
    }
  }

  return updated;
}

export function traitAverage(traits: TraitVector): number {
  const vals = Object.values(traits) as number[];
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}
