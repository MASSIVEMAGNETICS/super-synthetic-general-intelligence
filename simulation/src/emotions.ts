// ============================================================
// emotions.ts — Emotional state machine
// ============================================================
import { EmotionalState, TraitVector, Episode } from './types';

const ALL_STATES: EmotionalState[] = [
  'calm', 'excited', 'anxious', 'angry', 'joyful',
  'melancholy', 'determined', 'fearful',
];

/**
 * Transition emotional state based on recent episodes and traits.
 * If immunityTicks > 0 the state is locked — return as-is.
 */
export function transitionEmotion(
  current: EmotionalState,
  episodes: Episode[],
  traits: TraitVector,
  immunityTicks: number,
  rng: () => number,
  nudge?: EmotionalState,
): EmotionalState {
  if (immunityTicks > 0) return current;

  // Build a weight map
  const weights: Record<EmotionalState, number> = {
    calm: 1,
    excited: 1,
    anxious: 1,
    angry: 1,
    joyful: 1,
    melancholy: 1,
    determined: 1,
    fearful: 1,
  };

  // Trait influences
  weights.angry += traits.aggression * 2;
  weights.joyful += traits.empathy * 1.5 + traits.charisma * 0.5;
  weights.determined += traits.discipline * 2 + traits.courage * 1;
  weights.calm += traits.wisdom * 1.5 + traits.resilience * 1;
  weights.excited += traits.curiosity * 1.5 + traits.creativity * 1;
  weights.anxious += (1 - traits.courage) * 1.5;
  weights.melancholy += (1 - traits.resilience) * 1;
  weights.fearful += (1 - traits.courage) * 1 + traits.aggression * 0.5;

  // Recent episode influences
  for (const ep of episodes.slice(-5)) {
    switch (ep.type) {
      case 'conflict':
        weights.angry += 1.5;
        weights.fearful += 0.5;
        break;
      case 'cooperation':
        weights.joyful += 1.5;
        weights.calm += 0.5;
        break;
      case 'discovery':
        weights.excited += 2;
        break;
      case 'superpower_use':
        weights.excited += 1;
        weights.determined += 1;
        break;
      case 'internal':
        weights.melancholy += 0.5;
        weights.calm += 0.5;
        break;
      case 'interaction':
        weights.excited += 0.5;
        break;
    }
  }

  // Location nudge
  if (nudge) {
    weights[nudge] += 2;
  }

  // Slight inertia — current state gets a boost
  weights[current] += 1.5;

  // Weighted random selection
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let roll = rng() * total;

  for (const state of ALL_STATES) {
    roll -= weights[state];
    if (roll <= 0) return state;
  }

  return current;
}

export function emotionEmoji(state: EmotionalState): string {
  const map: Record<EmotionalState, string> = {
    calm: '😌',
    excited: '⚡',
    anxious: '😰',
    angry: '😡',
    joyful: '😄',
    melancholy: '😔',
    determined: '💪',
    fearful: '😨',
  };
  return map[state];
}
