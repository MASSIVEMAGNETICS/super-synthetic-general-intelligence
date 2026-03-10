// ============================================================
// memory.ts — Episodic memory store (append-only, max 200)
// ============================================================
import { v4 as uuidv4 } from 'uuid';
import { Episode, EpisodeType, EmotionalState } from './types';

const MAX_EPISODES = 200;

export function createEpisode(
  tick: number,
  type: EpisodeType,
  description: string,
  emotionalTag: EmotionalState,
  participants: string[],
  location: string,
): Episode {
  return {
    id: uuidv4(),
    tick,
    type,
    description,
    emotionalTag,
    participants,
    location,
  };
}

export function appendEpisode(episodes: Episode[], episode: Episode): Episode[] {
  const updated = [...episodes, episode];
  if (updated.length > MAX_EPISODES) {
    return updated.slice(updated.length - MAX_EPISODES);
  }
  return updated;
}

export function getRecentEpisodes(episodes: Episode[], count: number): Episode[] {
  return episodes.slice(-count);
}

export function countEpisodesByType(episodes: Episode[], type: EpisodeType): number {
  return episodes.filter((e) => e.type === type).length;
}
