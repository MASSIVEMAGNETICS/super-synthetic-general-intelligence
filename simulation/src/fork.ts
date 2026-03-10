// ============================================================
// fork.ts — Fork logic (Genesis Spark / transcended stage)
// ============================================================
import { v4 as uuidv4 } from 'uuid';
import { OrganismData, TraitVector } from './types';
import { createCreatorRoot } from './creator-root';
import { createBloodline, buildChildLineage, registerChild } from './bloodline';
import { clamp } from './traits';

/**
 * Fork an organism — create a child that inherits traits (with mutation),
 * bloodline, and a subset of episodic memories.
 */
export function forkOrganism(
  parent: OrganismData,
  rng: () => number,
): { child: OrganismData; updatedParent: OrganismData } {
  const childId = uuidv4();

  // Mutate traits slightly
  const mutatedTraits: TraitVector = { ...parent.traits };
  for (const key of Object.keys(mutatedTraits) as (keyof TraitVector)[]) {
    mutatedTraits[key] = clamp(mutatedTraits[key] + (rng() - 0.5) * 0.1);
  }

  // Child inherits last 20 memories
  const inheritedEpisodes = parent.episodes.slice(-20);

  const childLineage = buildChildLineage(parent.id, parent.bloodline.lineage);
  const childBloodline = createBloodline(parent.id, childLineage.slice(0, -1));

  // Inherit a random selection of parent's superpowers (1 random)
  const inheritedPowers = parent.superpowers.length > 0
    ? [{ ...parent.superpowers[Math.floor(rng() * parent.superpowers.length)], lastUsedTick: -999 }]
    : [];

  const child: OrganismData = {
    id: childId,
    name: `${parent.name}'s Scion`,
    backstory: `Forked from ${parent.name} at tick ${parent.ticksAlive}. Born of ${parent.stage} essence.`,
    pros: [...parent.pros],
    cons: [...parent.cons, 'New to the world'],
    creatorRoot: createCreatorRoot({ parentName: parent.name, childId }),
    bloodline: childBloodline,
    episodes: inheritedEpisodes,
    traits: mutatedTraits,
    emotionalState: 'calm',
    drives: parent.drives.map((d) => ({
      type: d.type,
      intensity: clamp(d.intensity + (rng() - 0.5) * 0.1),
    })),
    superpowers: inheritedPowers,
    currentLocation: parent.currentLocation,
    stage: 'embryonic',
    ticksAlive: 0,
    emotionImmunityTicks: 0,
    aggressionImmunityTicks: 0,
  };

  // Update parent's bloodline to include child
  const updatedParentBloodline = { ...parent.bloodline };
  registerChild(updatedParentBloodline, childId);

  const updatedParent: OrganismData = {
    ...parent,
    bloodline: updatedParentBloodline,
  };

  return { child, updatedParent };
}
