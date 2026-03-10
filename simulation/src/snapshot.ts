// ============================================================
// snapshot.ts — Snapshot save/load
// ============================================================
import * as fs from 'fs';
import * as path from 'path';
import { Snapshot } from './types';

const SNAPSHOTS_DIR = path.join(__dirname, '..', 'snapshots');

export function ensureSnapshotDir(): void {
  if (!fs.existsSync(SNAPSHOTS_DIR)) {
    fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
  }
}

export function saveSnapshot(snapshot: Snapshot): string {
  ensureSnapshotDir();
  const filename = `snapshot_tick_${snapshot.tick}.json`;
  const filepath = path.join(SNAPSHOTS_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(snapshot, null, 2), 'utf-8');
  return filepath;
}

export function loadSnapshot(filepath: string): Snapshot {
  const raw = fs.readFileSync(filepath, 'utf-8');
  return JSON.parse(raw) as Snapshot;
}

export function listSnapshots(): string[] {
  ensureSnapshotDir();
  return fs.readdirSync(SNAPSHOTS_DIR)
    .filter((f) => f.startsWith('snapshot_tick_') && f.endsWith('.json'))
    .map((f) => path.join(SNAPSHOTS_DIR, f))
    .sort();
}
