// ============================================================
// organism.ts — Organism class integrating all 10 subsystems
// ============================================================
import { v4 as uuidv4 } from 'uuid';
import {
  OrganismData, TraitVector, EmotionalState, LocationName,
  Stage, Episode, Drive, Superpower,
} from './types';
import { createCreatorRoot } from './creator-root';
import { createBloodline } from './bloodline';
import { createDrives } from './drives';
import { createRandomTraits } from './traits';
import { buildSuperpowers } from './superpowers';
import { calculateStage } from './stages';
import { randomLocation } from './world';

export interface OrganismDefinition {
  name: string;
  backstory: string;
  pros: string[];
  cons: string[];
  superpowerNames: string[];
  initialTraits?: Partial<TraitVector>;
  initialEmotion?: EmotionalState;
}

export function createOrganism(
  def: OrganismDefinition,
  rng: () => number,
  parentId: string | null = null,
  parentLineage: string[] = [],
): OrganismData {
  const id = uuidv4();

  const baseTraits = createRandomTraits(rng);
  const traits: TraitVector = def.initialTraits
    ? { ...baseTraits, ...def.initialTraits }
    : baseTraits;

  // Clamp initial traits
  for (const key of Object.keys(traits) as (keyof TraitVector)[]) {
    traits[key] = Math.max(0, Math.min(1, traits[key]));
  }

  const creatorRoot = createCreatorRoot({ name: def.name, id });
  const bloodline = createBloodline(parentId, parentLineage);
  const drives = createDrives(rng);
  const superpowers = buildSuperpowers(def.superpowerNames);
  const location = randomLocation(rng);
  const stage: Stage = 'embryonic';

  return {
    id,
    name: def.name,
    backstory: def.backstory,
    pros: def.pros,
    cons: def.cons,
    creatorRoot,
    bloodline,
    episodes: [],
    traits,
    emotionalState: def.initialEmotion ?? 'calm',
    drives,
    superpowers,
    currentLocation: location,
    stage,
    ticksAlive: 0,
    emotionImmunityTicks: 0,
    aggressionImmunityTicks: 0,
  };
}

export function updateStage(organism: OrganismData): { organism: OrganismData; advanced: boolean } {
  const newStage = calculateStage(organism.ticksAlive, organism.episodes.length);
  if (newStage !== organism.stage) {
    return { organism: { ...organism, stage: newStage }, advanced: true };
  }
  return { organism, advanced: false };
}

export function applyEpisode(organism: OrganismData, episode: Episode): OrganismData {
  const MAX = 200;
  let episodes = [...organism.episodes, episode];
  if (episodes.length > MAX) {
    episodes = episodes.slice(episodes.length - MAX);
  }
  return { ...organism, episodes };
}

export function cloneOrganismData(o: OrganismData): OrganismData {
  return JSON.parse(JSON.stringify(o)) as OrganismData;
}
