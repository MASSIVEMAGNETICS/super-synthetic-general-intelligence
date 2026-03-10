// ============================================================
// index.ts — CLI entrypoint: init + tick loop
// ============================================================
import { createOrganism } from './organism';
import { TOWNFOLK_DEFINITIONS } from './townfolk';
import { processTick, SimulationState } from './simulation';
import { saveSnapshot, loadSnapshot, ensureSnapshotDir } from './snapshot';
import { printBanner, printTickHeader, printTickFooter, printSnapshot, printTownSummary } from './narrator';
import { OrganismData, Snapshot } from './types';
import chalk from 'chalk';

// ── CLI argument parsing ──────────────────────────────────
function parseArgs(): {
  seed: number;
  ticks: number;
  delay: number;
  snapshotInterval: number;
  loadFile: string | null;
} {
  const args = process.argv.slice(2);
  let seed = Math.floor(Math.random() * 999999);
  let ticks = 0;
  let delay = 1000;
  let snapshotInterval = 10;
  let loadFile: string | null = null;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--seed':
        seed = parseInt(args[++i], 10);
        break;
      case '--ticks':
        ticks = parseInt(args[++i], 10);
        break;
      case '--delay':
        delay = parseInt(args[++i], 10);
        break;
      case '--snapshot-interval':
        snapshotInterval = parseInt(args[++i], 10);
        break;
      case '--load':
        loadFile = args[++i];
        break;
    }
  }

  return { seed, ticks, delay, snapshotInterval, loadFile };
}

// ── Seeded RNG (mulberry32) ───────────────────────────────
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Main ──────────────────────────────────────────────────
async function main(): Promise<void> {
  const { seed, ticks, delay, snapshotInterval, loadFile } = parseArgs();

  printBanner();
  ensureSnapshotDir();

  const rng = mulberry32(seed);

  let state: SimulationState;

  if (loadFile) {
    console.log(chalk.cyan(`\n  📂 Loading snapshot: ${loadFile}`));
    const snap = loadSnapshot(loadFile);
    state = {
      tick: snap.tick,
      organisms: snap.organisms,
      artifacts: snap.world.artifacts,
      rng,
    };
    console.log(chalk.green(`  ✅ Resumed from tick ${snap.tick} with ${snap.organisms.length} organisms.\n`));
  } else {
    console.log(chalk.dim(`  🎲 RNG seed: ${seed}`));
    console.log(chalk.dim(`  🏘  Building Veridion Hollow...\n`));

    const organisms: OrganismData[] = TOWNFOLK_DEFINITIONS.map((def) =>
      createOrganism(def, rng),
    );

    state = {
      tick: 1,
      organisms,
      artifacts: [],
      rng,
    };

    console.log(chalk.green(`  ✅ ${organisms.length} organisms created and placed in Veridion Hollow.\n`));
  }

  // ── Graceful shutdown ──
  let running = true;
  const shutdown = async (): Promise<void> => {
    if (!running) return;
    running = false;
    console.log(chalk.yellow('\n\n  ⚠️  Ctrl+C detected — saving final snapshot...\n'));
    const filepath = saveSnapshot({
      tick: state.tick,
      savedAt: Date.now(),
      world: { townName: 'Veridion Hollow', tick: state.tick, artifacts: state.artifacts },
      organisms: state.organisms,
    });
    printSnapshot(filepath, state.tick);
    printTownSummary(state.organisms, state.tick);
    process.exit(0);
  };

  process.on('SIGINT', () => { void shutdown(); });
  process.on('SIGTERM', () => { void shutdown(); });

  // ── Tick loop ──
  const maxTicks = ticks > 0 ? ticks : Infinity;

  while (running && state.tick <= maxTicks) {
    printTickHeader(state.tick, 'Veridion Hollow');
    state = processTick(state);
    printTickFooter();

    // Snapshot
    if (state.tick % snapshotInterval === 0) {
      const snap: Snapshot = {
        tick: state.tick,
        savedAt: Date.now(),
        world: { townName: 'Veridion Hollow', tick: state.tick, artifacts: state.artifacts },
        organisms: state.organisms,
      };
      const filepath = saveSnapshot(snap);
      printSnapshot(filepath, state.tick);
    }

    if (ticks > 0 && state.tick > ticks) break;

    await new Promise<void>((resolve) => setTimeout(resolve, delay));
  }

  if (ticks > 0) {
    // Finite run complete
    const filepath = saveSnapshot({
      tick: state.tick,
      savedAt: Date.now(),
      world: { townName: 'Veridion Hollow', tick: state.tick, artifacts: state.artifacts },
      organisms: state.organisms,
    });
    printSnapshot(filepath, state.tick);
    printTownSummary(state.organisms, state.tick);
    console.log(chalk.green('\n  ✅ Simulation complete.\n'));
  }
}

main().catch((err: unknown) => {
  console.error(chalk.red('Fatal error:'), err);
  process.exit(1);
});
