// ============================================================
// types.ts — All interfaces and type definitions for VictorSeed-1
// ============================================================

// ── Creator Root ──────────────────────────────────────────
export interface CreatorRoot {
  readonly creatorId: string;
  readonly seedVersion: string;
  readonly genesisTimestamp: number;
  readonly genesisHash: string;
}

// ── Bloodline ─────────────────────────────────────────────
export interface BloodlineRegistry {
  parentId: string | null;
  generation: number;
  lineage: string[];  // ancestor IDs oldest-first
  childIds: string[];
}

// ── Episodic Memory ───────────────────────────────────────
export type EpisodeType =
  | 'interaction'
  | 'discovery'
  | 'conflict'
  | 'cooperation'
  | 'internal'
  | 'superpower_use';

export interface Episode {
  id: string;
  tick: number;
  type: EpisodeType;
  description: string;
  emotionalTag: EmotionalState;
  participants: string[];  // organism IDs
  location: string;
}

// ── Trait Vector ──────────────────────────────────────────
export interface TraitVector {
  courage: number;
  cunning: number;
  empathy: number;
  creativity: number;
  discipline: number;
  charisma: number;
  resilience: number;
  curiosity: number;
  aggression: number;
  wisdom: number;
}

export type TraitKey = keyof TraitVector;

// ── Emotional State ───────────────────────────────────────
export type EmotionalState =
  | 'calm'
  | 'excited'
  | 'anxious'
  | 'angry'
  | 'joyful'
  | 'melancholy'
  | 'determined'
  | 'fearful';

// ── Drive System ──────────────────────────────────────────
export type DriveType =
  | 'survive'
  | 'connect'
  | 'explore'
  | 'create'
  | 'dominate'
  | 'nurture'
  | 'understand'
  | 'transcend';

export interface Drive {
  type: DriveType;
  intensity: number;  // 0.0–1.0
}

// ── Superpowers ───────────────────────────────────────────
export interface Superpower {
  name: string;
  description: string;
  cooldownTicks: number;
  power: number;  // 0.0–1.0
  lastUsedTick: number;
}

// ── Locations ─────────────────────────────────────────────
export type LocationName =
  | 'Town Square'
  | 'The Old Library'
  | 'Ember Creek'
  | 'Shadow Market'
  | 'Ironwood Grove'
  | 'The Spire'
  | "Healer's Den"
  | 'The Threshold';

export interface Location {
  name: LocationName;
  description: string;
  emoji: string;
  // Trait modifiers applied while organism is in this location
  traitBoosts: Partial<TraitVector>;
  // Emotional nudge: if present, this state is slightly favoured
  emotionNudge?: EmotionalState;
}

// ── Stage ─────────────────────────────────────────────────
export type Stage =
  | 'embryonic'
  | 'infant'
  | 'adolescent'
  | 'mature'
  | 'elder'
  | 'transcended';

// ── Organism ──────────────────────────────────────────────
export interface OrganismData {
  id: string;
  name: string;
  backstory: string;
  pros: string[];
  cons: string[];
  creatorRoot: CreatorRoot;
  bloodline: BloodlineRegistry;
  episodes: Episode[];
  traits: TraitVector;
  emotionalState: EmotionalState;
  drives: Drive[];
  superpowers: Superpower[];
  currentLocation: LocationName;
  stage: Stage;
  ticksAlive: number;
  // Immunity counters (from Iron Will / Titan Skin)
  emotionImmunityTicks: number;
  aggressionImmunityTicks: number;
}

// ── Snapshot ──────────────────────────────────────────────
export interface WorldState {
  townName: string;
  tick: number;
  artifacts: string[];
}

export interface Snapshot {
  tick: number;
  savedAt: number;
  world: WorldState;
  organisms: OrganismData[];
}

// ── Narrative Line ────────────────────────────────────────
export interface NarrativeLine {
  locationEmoji: string;
  locationName: string;
  lines: string[];
}
