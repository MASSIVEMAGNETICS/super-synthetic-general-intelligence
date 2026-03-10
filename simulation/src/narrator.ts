// ============================================================
// narrator.ts — Narrative log formatter (chalk + emoji)
// ============================================================
import chalk from 'chalk';
import { OrganismData, EmotionalState, Stage } from './types';
import { emotionEmoji } from './emotions';
import { stageEmoji } from './stages';
import { driveEmoji, topDrive } from './drives';

export function printBanner(): void {
  console.log(chalk.yellow('\n╔══════════════════════════════════════════════════════╗'));
  console.log(chalk.yellow('║  ⚡  VERIDION HOLLOW ⚡  —  A VictorSeed-1 Simulation  ║'));
  console.log(chalk.yellow('╚══════════════════════════════════════════════════════╝'));
  console.log(chalk.dim('    20 organisms. One town. Infinite emergent stories.\n'));
}

export function printTickHeader(tick: number, townName: string): void {
  const border = '═'.repeat(46);
  console.log(chalk.cyan(`\n${border}`));
  console.log(chalk.cyan(`  Tick ${tick}  —  ${townName}`));
  console.log(chalk.cyan(`${border}`));
}

export function printTickFooter(): void {
  console.log(chalk.dim('─'.repeat(48)));
}

export function printNarrativeLine(
  locationEmoji: string,
  locationName: string,
  lines: string[],
): void {
  console.log(chalk.bold(`\n${locationEmoji} ${chalk.white(locationName)}:`));
  for (const line of lines) {
    console.log(`  ${line}`);
  }
}

export function printSuperpowerActivation(
  casterName: string,
  powerName: string,
  effect: string,
): void {
  console.log(chalk.magenta(`  → ${casterName} activates ${chalk.bold(powerName.toUpperCase())} — ${effect}`));
}

export function printTraitDrift(
  name: string,
  traitName: string,
  from: number,
  to: number,
  emotion: EmotionalState,
): void {
  const arrow = to > from ? chalk.green('↑') : chalk.red('↓');
  const emojiStr = emotionEmoji(emotion);
  console.log(
    chalk.dim(`  → ${name}'s ${traitName} drifts ${arrow} (${from.toFixed(2)} → ${to.toFixed(2)}). Emotion: ${emojiStr} ${emotion}`),
  );
}

export function printStageAdvance(name: string, from: Stage, to: Stage): void {
  console.log(
    chalk.yellow(`  ✨ ${chalk.bold(name)} advances: ${stageEmoji(from)} ${from} → ${stageEmoji(to)} ${chalk.bold(to)}`),
  );
}

export function printEpisodeLog(type: string, description: string): void {
  console.log(chalk.blue(`  📜 Episode [${type}]: "${description}"`));
}

export function printInteraction(actor: string, target: string, action: string): void {
  console.log(chalk.white(`  🗨 ${chalk.bold(actor)} → ${chalk.bold(target)}: ${action}`));
}

export function printFork(parentName: string, childName: string): void {
  console.log(chalk.greenBright(`  🧬 ${chalk.bold(parentName)} forks! New organism: ${chalk.bold(childName)} enters Veridion Hollow.`));
}

export function printSnapshot(filepath: string, tick: number): void {
  console.log(chalk.dim(`\n  💾 Snapshot saved → ${filepath} (tick ${tick})`));
}

export function printTownSummary(organisms: OrganismData[], tick: number): void {
  const border = '═'.repeat(52);
  console.log(chalk.yellow(`\n${border}`));
  console.log(chalk.yellow(`  📊  VERIDION HOLLOW — TOWN SUMMARY (tick ${tick})`));
  console.log(chalk.yellow(`${border}`));
  console.log(chalk.dim(`  Population: ${organisms.length} organisms\n`));

  for (const o of organisms) {
    const drive = topDrive(o.drives);
    const emo = emotionEmoji(o.emotionalState);
    const stage = stageEmoji(o.stage);
    const driveE = driveEmoji(drive.type);
    console.log(
      `  ${stage} ${chalk.bold(o.name.padEnd(20))} ` +
      `${emo} ${o.emotionalState.padEnd(12)} ` +
      `${driveE} ${drive.type.padEnd(12)} ` +
      `${chalk.dim(o.currentLocation)}`,
    );
  }
  console.log(chalk.yellow(`\n${border}\n`));
}

export function buildOrganismAction(organism: OrganismData, rng: () => number): string {
  const drive = topDrive(organism.drives);
  const emo = organism.emotionalState;
  const name = organism.name;

  const actionMap: Partial<Record<string, string[]>> = {
    survive: [
      `${name} scans the area nervously, hand on their weapon.`,
      `${name} retreats to a defensible position.`,
      `${name} checks their supplies with a grim expression.`,
    ],
    connect: [
      `${name} seeks out familiar faces in the crowd.`,
      `${name} strikes up a conversation with anyone nearby.`,
      `${name} offers help to a passing stranger.`,
    ],
    explore: [
      `${name} examines every corner of the space.`,
      `${name} pulls out a worn journal and scribbles notes.`,
      `${name} wanders off the beaten path.`,
    ],
    create: [
      `${name} begins crafting something from found materials.`,
      `${name} hums softly, lost in creative thought.`,
      `${name} sketches intricate patterns in the dust.`,
    ],
    dominate: [
      `${name} asserts their presence loudly.`,
      `${name} challenges anyone who meets their gaze.`,
      `${name} positions themselves at the center of attention.`,
    ],
    nurture: [
      `${name} tends to a nearby wounded plant.`,
      `${name} checks in on the people around them.`,
      `${name} prepares a small gift for a companion.`,
    ],
    understand: [
      `${name} sits in quiet contemplation.`,
      `${name} reads from a battered tome.`,
      `${name} asks deep questions that nobody can answer.`,
    ],
    transcend: [
      `${name} stares into the distance, beyond the horizon.`,
      `${name} meditates, barely breathing.`,
      `${name} mutters ancient words in an unknown tongue.`,
    ],
  };

  const emotionModifier: Partial<Record<EmotionalState, string>> = {
    angry: ' — their jaw is clenched, fists tight.',
    joyful: ' — a rare smile lighting their face.',
    anxious: ' — eyes darting, unable to settle.',
    melancholy: ' — moving slowly, as if weighted.',
    determined: ' — every motion purposeful and precise.',
    fearful: ' — flinching at every sound.',
    excited: ' — electric with barely contained energy.',
    calm: ' — with quiet, deliberate grace.',
  };

  const actions = actionMap[drive.type] ?? [`${name} drifts through the space thoughtfully.`];
  const base = actions[Math.floor(rng() * actions.length)];
  const modifier = emotionModifier[emo] ?? '';
  return base + modifier;
}
