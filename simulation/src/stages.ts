// ============================================================
// stages.ts — Stage progression logic
// ============================================================
import { Stage } from './types';

interface StageThreshold {
  stage: Stage;
  minTicks: number;
  minEpisodes: number;
}

const STAGE_THRESHOLDS: StageThreshold[] = [
  { stage: 'embryonic',   minTicks: 0,   minEpisodes: 0   },
  { stage: 'infant',      minTicks: 5,   minEpisodes: 3   },
  { stage: 'adolescent',  minTicks: 15,  minEpisodes: 10  },
  { stage: 'mature',      minTicks: 30,  minEpisodes: 25  },
  { stage: 'elder',       minTicks: 60,  minEpisodes: 60  },
  { stage: 'transcended', minTicks: 100, minEpisodes: 120 },
];

export function calculateStage(ticksAlive: number, episodeCount: number): Stage {
  let current: Stage = 'embryonic';
  for (const threshold of STAGE_THRESHOLDS) {
    if (ticksAlive >= threshold.minTicks && episodeCount >= threshold.minEpisodes) {
      current = threshold.stage;
    }
  }
  return current;
}

export function hasAdvanced(oldStage: Stage, newStage: Stage): boolean {
  const order: Stage[] = ['embryonic', 'infant', 'adolescent', 'mature', 'elder', 'transcended'];
  return order.indexOf(newStage) > order.indexOf(oldStage);
}

export function stageEmoji(stage: Stage): string {
  const map: Record<Stage, string> = {
    embryonic:   '🥚',
    infant:      '🌱',
    adolescent:  '🌿',
    mature:      '🌳',
    elder:       '🏔️',
    transcended: '⭐',
  };
  return map[stage];
}

/**
 * Higher stages increase the chance of superpower activation.
 */
export function superpowerActivationChance(stage: Stage): number {
  const map: Record<Stage, number> = {
    embryonic:   0.05,
    infant:      0.08,
    adolescent:  0.12,
    mature:      0.18,
    elder:       0.25,
    transcended: 0.35,
  };
  return map[stage];
}
