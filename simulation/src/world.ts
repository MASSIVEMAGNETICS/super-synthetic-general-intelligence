// ============================================================
// world.ts — Veridion Hollow town, locations, movement
// ============================================================
import { Location, LocationName, EmotionalState, TraitVector } from './types';

export const LOCATIONS: Location[] = [
  {
    name: 'Town Square',
    description: 'The heart of Veridion Hollow — bustling, political, and full of gossip.',
    emoji: '🏛',
    traitBoosts: { charisma: 0.02 },
    emotionNudge: 'excited',
  },
  {
    name: 'The Old Library',
    description: 'Dust-laden shelves hiding forbidden knowledge and forgotten histories.',
    emoji: '📖',
    traitBoosts: { curiosity: 0.02, wisdom: 0.01 },
    emotionNudge: 'calm',
  },
  {
    name: 'Ember Creek',
    description: 'A glowing stream whose warmth soothes even the most troubled mind.',
    emoji: '🔥',
    traitBoosts: { resilience: 0.02 },
    emotionNudge: 'calm',
  },
  {
    name: 'Shadow Market',
    description: 'A labyrinthine bazaar of secrets, rare goods, and shady deals.',
    emoji: '💀',
    traitBoosts: { cunning: 0.02 },
    emotionNudge: 'anxious',
  },
  {
    name: 'Ironwood Grove',
    description: 'Ancient trees whose roots carry whispers from the deep earth.',
    emoji: '🌲',
    traitBoosts: { wisdom: 0.02, courage: 0.01 },
    emotionNudge: 'determined',
  },
  {
    name: 'The Spire',
    description: 'A towering structure at the edge of town. Those who climb it see too far.',
    emoji: '🗼',
    traitBoosts: { creativity: 0.02 },
    emotionNudge: 'fearful',
  },
  {
    name: "Healer's Den",
    description: 'A sanctuary of herbs, warmth, and quiet restoration.',
    emoji: '💚',
    traitBoosts: { empathy: 0.02, resilience: 0.01 },
    emotionNudge: 'calm',
  },
  {
    name: 'The Threshold',
    description: 'A liminal space between known and unknown. Reality feels thin here.',
    emoji: '🌀',
    traitBoosts: { curiosity: 0.01, wisdom: 0.02 },
    emotionNudge: 'melancholy',
  },
];

export const LOCATION_NAMES: LocationName[] = LOCATIONS.map((l) => l.name) as LocationName[];

export function getLocation(name: LocationName): Location {
  const loc = LOCATIONS.find((l) => l.name === name);
  if (!loc) throw new Error(`Unknown location: ${name}`);
  return loc;
}

export function randomLocation(rng: () => number): LocationName {
  return LOCATION_NAMES[Math.floor(rng() * LOCATION_NAMES.length)];
}

/**
 * Apply location-based trait boosts (small).
 */
export function applyLocationBoosts(traits: TraitVector, location: LocationName): TraitVector {
  const loc = getLocation(location);
  const updated = { ...traits };
  for (const [key, val] of Object.entries(loc.traitBoosts)) {
    const k = key as keyof TraitVector;
    updated[k] = Math.min(1, updated[k] + (val as number));
  }
  return updated;
}

/**
 * Get optional emotion nudge from location.
 */
export function getLocationEmotionNudge(location: LocationName): EmotionalState | undefined {
  return getLocation(location).emotionNudge;
}

/**
 * Move an organism to a new random location (or specific target).
 */
export function moveOrganism(
  currentLocation: LocationName,
  rng: () => number,
  targetLocation?: LocationName,
): LocationName {
  if (targetLocation) return targetLocation;
  // 30% chance of moving, otherwise stay
  if (rng() > 0.3) return currentLocation;
  return randomLocation(rng);
}
