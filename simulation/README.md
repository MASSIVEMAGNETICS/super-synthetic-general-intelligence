# VictorSeed-1 Simulation — Veridion Hollow

A self-contained TypeScript CLI simulation featuring **20 unique organisms** living in the small town of **Veridion Hollow**. Each organism is a full VictorSeed-1 entity with all core subsystems: immutable creator root, bloodline registry, episodic memory, trait vector drift, emotional state machine, drive system, superpowers, stage progression, fork support, and snapshot/replay.

## Prerequisites

- Node.js 18+
- npm 8+

## Installation

From the **project root**:

```bash
npm install
```

Or from the `simulation/` directory:

```bash
npm install
```

## Running the Simulation

From the **project root**:

```bash
npm run sim
```

From the `simulation/` directory:

```bash
npm run sim
# or
npx ts-node src/index.ts
```

### CLI Options

| Flag | Description | Default |
|------|-------------|---------|
| `--seed <number>` | Set a numeric seed for deterministic runs | random |
| `--ticks <number>` | Number of ticks to simulate (0 = infinite) | 0 |
| `--delay <ms>` | Milliseconds between ticks | 1000 |
| `--snapshot-interval <n>` | Save snapshot every N ticks | 10 |
| `--load <file>` | Load a snapshot file to resume simulation | — |

### Examples

```bash
# Run with a fixed seed for reproducible output
npx ts-node src/index.ts --seed 42

# Run 50 ticks then exit
npx ts-node src/index.ts --ticks 50 --delay 500

# Resume from a snapshot
npx ts-node src/index.ts --load snapshots/snapshot_tick_20.json
```

## Snapshots

Snapshots are saved automatically every 10 ticks (configurable) to `simulation/snapshots/snapshot_tick_{N}.json`. Press **Ctrl+C** to gracefully save a final snapshot and print a town summary.

## Architecture

| File | Purpose |
|------|---------|
| `src/types.ts` | All TypeScript interfaces and type definitions |
| `src/creator-root.ts` | Immutable creator root factory with SHA-256 hashing |
| `src/bloodline.ts` | Bloodline registry logic |
| `src/memory.ts` | Episodic memory store (append-only, max 200) |
| `src/traits.ts` | Trait vector + drift engine |
| `src/emotions.ts` | Emotional state machine |
| `src/drives.ts` | Drive system |
| `src/superpowers.ts` | Superpower pool (15 powers), assignment, activation |
| `src/world.ts` | Veridion Hollow town — 8 locations, movement, effects |
| `src/stages.ts` | Stage progression logic |
| `src/snapshot.ts` | Snapshot save/load |
| `src/fork.ts` | Fork logic |
| `src/organism.ts` | Organism class integrating all 10 subsystems |
| `src/townfolk.ts` | 20 unique organism definitions |
| `src/narrator.ts` | Narrative log formatter (chalk + emoji) |
| `src/simulation.ts` | Simulation engine — tick resolution, interactions |
| `src/index.ts` | CLI entrypoint with ASCII banner |

## The 20 Townfolk of Veridion Hollow

| # | Name | Superpowers |
|---|------|-------------|
| 1 | Maren Ashveil | Chrono Glimpse, Shadow Step |
| 2 | Dorian Kael | Verdant Touch, Mind Link |
| 3 | Sable Voss | Echo Memory, Pulse Sight |
| 4 | Theta-7 | Iron Will, Null Field |
| 5 | Lira Sunhollow | Ember Voice, Rift Walk |
| 6 | Crag Dunmore | Titan Skin, Iron Will |
| 7 | Wren Lostlight | Verdant Touch, Blood Howl |
| 8 | Elix Mordane | Spark Forge, Echo Memory |
| 9 | Nyx Othara | Dream Weave, Chrono Glimpse |
| 10 | Jasper Flint | Ember Voice, Shadow Step |
| 11 | Kova Ashenmere | Titan Skin, Spark Forge |
| 12 | Rune Driftborn | Genesis Spark, Mind Link |
| 13 | Pyra Volkheart | Rift Walk, Blood Howl |
| 14 | Silas Greymoor | Pulse Sight, Dream Weave |
| 15 | Orin Halfmoon | Echo Memory, Null Field |
| 16 | Fenra Bloodthorn | Blood Howl, Shadow Step |
| 17 | Asha Dewvane | Verdant Touch, Pulse Sight |
| 18 | Zephyr Cain | Spark Forge, Rift Walk |
| 19 | Vesper Nighthollow | Dream Weave, Ember Voice |
| 20 | Calder Stonewright | Spark Forge, Chrono Glimpse |
