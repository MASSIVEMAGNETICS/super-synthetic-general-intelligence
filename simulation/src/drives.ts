// ============================================================
// drives.ts — Drive system
// ============================================================
import { Drive, DriveType, EmotionalState, TraitVector, Stage } from './types';

const ALL_DRIVE_TYPES: DriveType[] = [
  'survive', 'connect', 'explore', 'create',
  'dominate', 'nurture', 'understand', 'transcend',
];

export function createDrives(rng: () => number): Drive[] {
  return ALL_DRIVE_TYPES.map((type) => ({
    type,
    intensity: Math.round((0.2 + rng() * 0.6) * 100) / 100,
  }));
}

/**
 * Recalculate drive intensities based on emotional state, traits, and stage.
 */
export function recalculateDrives(
  drives: Drive[],
  emotion: EmotionalState,
  traits: TraitVector,
  stage: Stage,
  rng: () => number,
): Drive[] {
  return drives.map((drive) => {
    let base = drive.intensity;
    const jitter = (rng() - 0.5) * 0.06;

    switch (drive.type) {
      case 'survive':
        if (emotion === 'fearful' || emotion === 'anxious') base += 0.1;
        base += traits.resilience * 0.05;
        break;
      case 'connect':
        if (emotion === 'joyful' || emotion === 'melancholy') base += 0.08;
        base += traits.empathy * 0.08 + traits.charisma * 0.04;
        break;
      case 'explore':
        if (emotion === 'excited') base += 0.1;
        base += traits.curiosity * 0.1;
        break;
      case 'create':
        if (emotion === 'excited' || emotion === 'determined') base += 0.08;
        base += traits.creativity * 0.1;
        break;
      case 'dominate':
        if (emotion === 'angry') base += 0.12;
        base += traits.aggression * 0.1 - traits.empathy * 0.03;
        break;
      case 'nurture':
        if (emotion === 'joyful' || emotion === 'calm') base += 0.08;
        base += traits.empathy * 0.08;
        break;
      case 'understand':
        base += traits.wisdom * 0.1 + traits.curiosity * 0.05;
        if (emotion === 'calm') base += 0.06;
        break;
      case 'transcend':
        if (stage === 'elder' || stage === 'transcended') base += 0.15;
        base += traits.wisdom * 0.08;
        if (emotion === 'determined') base += 0.08;
        break;
    }

    return {
      type: drive.type,
      intensity: Math.max(0, Math.min(1, base + jitter)),
    };
  });
}

export function topDrive(drives: Drive[]): Drive {
  return drives.reduce((max, d) => (d.intensity > max.intensity ? d : max), drives[0]);
}

export function driveEmoji(type: DriveType): string {
  const map: Record<DriveType, string> = {
    survive: '🛡️',
    connect: '🤝',
    explore: '🧭',
    create: '🎨',
    dominate: '👑',
    nurture: '🌱',
    understand: '📚',
    transcend: '✨',
  };
  return map[type];
}
