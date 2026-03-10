// ============================================================
// creator-root.ts — Immutable CreatorRoot factory with SHA-256
// ============================================================
import * as crypto from 'crypto';
import { CreatorRoot } from './types';

export function createCreatorRoot(seedData: object): CreatorRoot {
  const genesisTimestamp = Date.now();
  const payload = JSON.stringify({ ...seedData, genesisTimestamp });
  const genesisHash = crypto.createHash('sha256').update(payload).digest('hex');

  const root: CreatorRoot = Object.freeze({
    creatorId: 'MASSIVEMAGNETICS',
    seedVersion: '1.0.0',
    genesisTimestamp,
    genesisHash,
  });

  return root;
}

export function verifyCreatorRoot(root: CreatorRoot): boolean {
  // Verify the root is frozen
  return Object.isFrozen(root);
}
