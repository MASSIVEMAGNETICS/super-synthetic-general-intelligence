// ============================================================
// bloodline.ts — Bloodline registry logic
// ============================================================
import { BloodlineRegistry } from './types';

export function createBloodline(parentId: string | null = null, parentLineage: string[] = []): BloodlineRegistry {
  return {
    parentId,
    generation: parentLineage.length,
    lineage: [...parentLineage],
    childIds: [],
  };
}

export function registerChild(parent: BloodlineRegistry, childId: string): void {
  if (!parent.childIds.includes(childId)) {
    parent.childIds.push(childId);
  }
}

export function buildChildLineage(parentId: string, parentLineage: string[]): string[] {
  return [...parentLineage, parentId];
}
