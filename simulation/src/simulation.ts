// ============================================================
// simulation.ts — Simulation engine: tick resolution, interactions, narrative
// ============================================================
import { OrganismData, LocationName, Episode, EmotionalState } from './types';
import { driftTraits } from './traits';
import { transitionEmotion } from './emotions';
import { recalculateDrives, topDrive } from './drives';
import { choosePowerToActivate, isOnCooldown } from './superpowers';
import { moveOrganism, getLocation, applyLocationBoosts, getLocationEmotionNudge, LOCATION_NAMES } from './world';
import { updateStage } from './organism';
import { createEpisode, appendEpisode } from './memory';
import { superpowerActivationChance, stageEmoji } from './stages';
import { forkOrganism } from './fork';
import { printNarrativeLine, buildOrganismAction } from './narrator';
import chalk from 'chalk';

export interface SimulationState {
  tick: number;
  organisms: OrganismData[];
  artifacts: string[];
  rng: () => number;
}

// ── Interaction templates ─────────────────────────────────
function resolveInteraction(
  a: OrganismData,
  b: OrganismData,
  tick: number,
  rng: () => number,
): { episodes: Episode[]; description: string; type: 'conflict' | 'cooperation' | 'interaction' } {
  const aTop = topDrive(a.drives);
  const bTop = topDrive(b.drives);

  const aggScore = (a.traits.aggression + b.traits.aggression) / 2;
  const coopScore = (a.traits.empathy + b.traits.empathy) / 2;

  let type: 'conflict' | 'cooperation' | 'interaction';
  let description: string;

  if (aTop.type === 'dominate' || bTop.type === 'dominate' || (aggScore > 0.6 && rng() < 0.5)) {
    type = 'conflict';
    description = `${a.name} and ${b.name} clash — ${
      aTop.type === 'dominate'
        ? `${a.name} asserts dominance`
        : `${b.name} pushes back hard`
    }.`;
  } else if (coopScore > 0.5 || aTop.type === 'connect' || bTop.type === 'nurture') {
    type = 'cooperation';
    description = `${a.name} and ${b.name} find common ground — ${
      aTop.type === 'nurture'
        ? `${a.name} tends to ${b.name}'s wounds`
        : `they share an unexpected moment of understanding`
    }.`;
  } else {
    type = 'interaction';
    const templates = [
      `${a.name} and ${b.name} exchange terse words about the state of Veridion Hollow.`,
      `${a.name} and ${b.name} cross paths — neither is sure how to feel about it.`,
      `${a.name} eyes ${b.name} warily, and ${b.name} pretends not to notice.`,
      `${a.name} and ${b.name} argue about the northern border.`,
      `${a.name} shares a rumour with ${b.name} that neither should repeat.`,
    ];
    description = templates[Math.floor(rng() * templates.length)];
  }

  const aTick = createEpisode(tick, type, description, a.emotionalState, [a.id, b.id], a.currentLocation);
  const bTick = createEpisode(tick, type, description, b.emotionalState, [a.id, b.id], b.currentLocation);

  return { episodes: [aTick, bTick], description, type };
}

// ── Superpower effect descriptions ───────────────────────
function superpowerEffect(
  powerName: string,
  caster: OrganismData,
  others: OrganismData[],
  tick: number,
  rng: () => number,
): { effect: string; targetsModified: Map<string, Partial<OrganismData>> } {
  const mods = new Map<string, Partial<OrganismData>>();

  switch (powerName) {
    case 'Chrono Glimpse': {
      const target = others[Math.floor(rng() * others.length)];
      return {
        effect: target
          ? `${caster.name} sees ${target.name}'s lie unraveling in 3 ticks.`
          : `${caster.name} glimpses a hazy future — someone is not who they seem.`,
        targetsModified: mods,
      };
    }
    case 'Ember Voice': {
      const target = others[Math.floor(rng() * others.length)];
      if (target) {
        mods.set(target.id, {
          traits: { ...target.traits, charisma: Math.min(1, target.traits.charisma + 0.1) },
        });
        return {
          effect: `${caster.name}'s voice washes over ${target.name} — their resistance crumbles.`,
          targetsModified: mods,
        };
      }
      return { effect: `${caster.name}'s words echo through the empty air.`, targetsModified: mods };
    }
    case 'Iron Will': {
      mods.set(caster.id, { emotionImmunityTicks: 5 });
      return {
        effect: `${caster.name} becomes a fortress of stillness — emotions locked for 5 ticks.`,
        targetsModified: mods,
      };
    }
    case 'Shadow Step': {
      const dest = LOCATION_NAMES[Math.floor(rng() * LOCATION_NAMES.length)];
      mods.set(caster.id, { currentLocation: dest });
      return {
        effect: `${caster.name} vanishes in a shadow and reappears at ${dest}.`,
        targetsModified: mods,
      };
    }
    case 'Verdant Touch': {
      const sad = others.find(
        (o) => o.emotionalState === 'melancholy' || o.emotionalState === 'fearful' || o.emotionalState === 'angry',
      );
      if (sad) {
        mods.set(sad.id, { emotionalState: 'calm' as EmotionalState });
        return {
          effect: `${caster.name} lays a gentle hand on ${sad.name} — their storm fades to calm.`,
          targetsModified: mods,
        };
      }
      return { effect: `${caster.name}'s healing touch finds no one in need.`, targetsModified: mods };
    }
    case 'Echo Memory': {
      const insight = caster.episodes[Math.floor(rng() * Math.max(1, caster.episodes.length))];
      return {
        effect: insight
          ? `${caster.name} replays: "${insight.description.slice(0, 60)}..." — new insight floods in.`
          : `${caster.name} reaches into memory and finds only echoes.`,
        targetsModified: mods,
      };
    }
    case 'Spark Forge': {
      const artifacts = ['Crystalline Compass', 'Ember Lantern', 'Whispering Rune', 'Iron Codex', 'Verdant Seed'];
      const artifact = artifacts[Math.floor(rng() * artifacts.length)];
      return {
        effect: `${caster.name} forges a ${artifact} — it hums with latent power.`,
        targetsModified: mods,
      };
    }
    case 'Mind Link': {
      const target = others[Math.floor(rng() * others.length)];
      if (target) {
        const keys = Object.keys(caster.traits) as (keyof typeof caster.traits)[];
        const blendedTraits = { ...caster.traits };
        for (const key of keys) {
          blendedTraits[key] = (caster.traits[key] + target.traits[key]) / 2;
        }
        mods.set(target.id, { traits: blendedTraits });
        mods.set(caster.id, { traits: blendedTraits });
        return {
          effect: `${caster.name} and ${target.name} merge minds — their traits blur together.`,
          targetsModified: mods,
        };
      }
      return { effect: `${caster.name}'s mind reaches out into empty silence.`, targetsModified: mods };
    }
    case 'Titan Skin': {
      mods.set(caster.id, { aggressionImmunityTicks: 3 });
      return {
        effect: `${caster.name}'s skin turns to iron — immune to aggression for 3 ticks.`,
        targetsModified: mods,
      };
    }
    case 'Dream Weave': {
      const dreaming = others.find((o) => o.emotionalState === 'melancholy');
      if (dreaming) {
        mods.set(dreaming.id, {
          drives: dreaming.drives.map((d) =>
            d.type === 'connect' ? { ...d, intensity: Math.min(1, d.intensity + 0.3) } : d,
          ),
        });
        return {
          effect: `${caster.name} slips into ${dreaming.name}'s melancholy — the "connect" drive blazes bright.`,
          targetsModified: mods,
        };
      }
      return { effect: `${caster.name} weaves dreams into empty air — no dreamer nearby.`, targetsModified: mods };
    }
    case 'Pulse Sight': {
      const states = others.slice(0, 5).map((o) => `${o.name}: ${o.emotionalState}`).join(', ');
      return {
        effect: `${caster.name} reads the room — ${states || 'the town is quiet'}.`,
        targetsModified: mods,
      };
    }
    case 'Rift Walk': {
      const nearby = others.slice(0, 4);
      nearby.forEach((o) => {
        mods.set(o.id, {
          traits: { ...o.traits, creativity: Math.min(1, o.traits.creativity + 0.05) },
        });
      });
      return {
        effect: `${caster.name} tears a rift — creativity surges in ${nearby.map((o) => o.name).join(', ') || 'the area'}.`,
        targetsModified: mods,
      };
    }
    case 'Blood Howl': {
      const kin = others.filter((o) => o.bloodline.lineage.includes(caster.id));
      kin.forEach((o) => {
        mods.set(o.id, {
          traits: { ...o.traits, courage: Math.min(1, o.traits.courage + 0.08) },
        });
      });
      return {
        effect: kin.length > 0
          ? `${caster.name} howls — kin [${kin.map((o) => o.name).join(', ')}] feel courage surge.`
          : `${caster.name} howls to the sky — no kin answers yet.`,
        targetsModified: mods,
      };
    }
    case 'Null Field': {
      const target = others[Math.floor(rng() * others.length)];
      return {
        effect: target
          ? `${caster.name} erects a null field around ${target.name} — their next power fizzles.`
          : `${caster.name}'s null field crackles with nowhere to go.`,
        targetsModified: mods,
      };
    }
    case 'Genesis Spark':
      // Fork is handled in the main tick loop
      return {
        effect: `${caster.name} channels the Genesis Spark — the fabric of Veridion Hollow trembles.`,
        targetsModified: mods,
      };
    default:
      return { effect: `${caster.name} activates an unknown power.`, targetsModified: mods };
  }
}

// ── Apply modifications to organism list ─────────────────
function applyMods(
  organisms: OrganismData[],
  mods: Map<string, Partial<OrganismData>>,
): OrganismData[] {
  return organisms.map((o) => {
    const mod = mods.get(o.id);
    if (!mod) return o;
    return { ...o, ...mod };
  });
}

// ── Soliloquy (solo actions) ──────────────────────────────
const DISCOVERY_TEMPLATES = [
  (name: string, loc: string) => `${name} discovers a hidden passage in ${loc}.`,
  (name: string, loc: string) => `${name} unearths a crumbling manuscript at ${loc}.`,
  (name: string, loc: string) => `${name} notices something impossible at ${loc} — and writes it down.`,
  (name: string, loc: string) => `${name} finds a half-buried artifact near ${loc}.`,
];

// ── Main tick function ────────────────────────────────────
export function processTick(state: SimulationState): SimulationState {
  const { tick, rng } = state;
  let organisms = [...state.organisms];
  const artifacts = [...state.artifacts];
  const newOrganisms: OrganismData[] = [];

  // Group organisms by location
  const byLocation = new Map<LocationName, OrganismData[]>();
  for (const loc of LOCATION_NAMES) byLocation.set(loc, []);
  for (const o of organisms) {
    byLocation.get(o.currentLocation)!.push(o);
  }

  // Process each location — collect all lines first, then print together
  for (const [locName, group] of byLocation.entries()) {
    if (group.length === 0) continue;

    const location = getLocation(locName);
    // All narrative lines for this location block (printed together after the header)
    const locLines: string[] = [];

    for (let i = 0; i < group.length; i++) {
      let o = group[i];
      const prevStage = o.stage;

      // 1. Tick alive
      o = { ...o, ticksAlive: o.ticksAlive + 1 };

      // 2. Drift immunity counters
      if (o.emotionImmunityTicks > 0) o = { ...o, emotionImmunityTicks: o.emotionImmunityTicks - 1 };
      if (o.aggressionImmunityTicks > 0) o = { ...o, aggressionImmunityTicks: o.aggressionImmunityTicks - 1 };

      // 3. Drift traits
      o = { ...o, traits: driftTraits(o.traits, o.episodes, rng) };
      o = { ...o, traits: applyLocationBoosts(o.traits, locName) };

      // 4. Transition emotion
      const nudge = getLocationEmotionNudge(locName);
      o = {
        ...o,
        emotionalState: transitionEmotion(
          o.emotionalState, o.episodes, o.traits,
          o.emotionImmunityTicks, rng, nudge,
        ),
      };

      // 5. Recalculate drives
      o = { ...o, drives: recalculateDrives(o.drives, o.emotionalState, o.traits, o.stage, rng) };

      // 6. Stage progression
      const { organism: staged, advanced } = updateStage(o);
      o = staged;
      if (advanced) {
        const stageEp = createEpisode(
          tick, 'internal',
          `${o.name} ascends to the ${o.stage} stage.`,
          o.emotionalState, [o.id], locName,
        );
        o = { ...o, episodes: appendEpisode(o.episodes, stageEp) };
        locLines.push(
          chalk.yellow(`  ✨ ${chalk.bold(o.name)} advances: ${stageEmoji(prevStage)} ${prevStage} → ${stageEmoji(o.stage)} ${chalk.bold(o.stage)}`),
        );
      }

      // 7. Action narrative
      locLines.push(chalk.white(buildOrganismAction(o, rng)));

      // 8. Interaction (if another organism is at same location)
      if (group.length > 1 && i < group.length - 1) {
        const partner = group[(i + 1) % group.length];
        if (o.aggressionImmunityTicks === 0) {
          const { episodes: intEps, description, type } = resolveInteraction(o, partner, tick, rng);
          o = { ...o, episodes: appendEpisode(o.episodes, intEps[0]) };
          const partnerEpAdded = { ...partner, episodes: appendEpisode(partner.episodes, intEps[1]) };
          group[i + 1] = partnerEpAdded;

          const typeColor = type === 'conflict' ? chalk.red : type === 'cooperation' ? chalk.green : chalk.white;
          locLines.push(chalk.white(`  🗨 ${chalk.bold(o.name)} → ${chalk.bold(partner.name)}: ${typeColor(description)}`));
        }
      }

      // 9. Solo discovery (low chance)
      if (rng() < 0.08) {
        const tpl = DISCOVERY_TEMPLATES[Math.floor(rng() * DISCOVERY_TEMPLATES.length)];
        const desc = tpl(o.name, locName);
        const ep = createEpisode(tick, 'discovery', desc, o.emotionalState, [o.id], locName);
        o = { ...o, episodes: appendEpisode(o.episodes, ep) };
        locLines.push(chalk.blue(`  📜 Episode [discovery]: "${desc}"`));
      }

      // 10. Superpower activation
      const activationChance = superpowerActivationChance(o.stage);
      const power = choosePowerToActivate(o.superpowers, tick, activationChance, rng);
      if (power && !isOnCooldown(power, tick)) {
        const others = organisms.filter((x) => x.id !== o.id && x.currentLocation === locName);
        const { effect, targetsModified } = superpowerEffect(power.name, o, others, tick, rng);

        o = {
          ...o,
          superpowers: o.superpowers.map((sp) =>
            sp.name === power.name ? { ...sp, lastUsedTick: tick } : sp,
          ),
        };

        const powerEp = createEpisode(
          tick, 'superpower_use',
          `${o.name} activated ${power.name}: ${effect}`,
          o.emotionalState, [o.id], locName,
        );
        o = { ...o, episodes: appendEpisode(o.episodes, powerEp) };

        locLines.push(chalk.magenta(`  → ${o.name} activates ${chalk.bold(power.name.toUpperCase())} — ${effect}`));

        organisms = applyMods(organisms, targetsModified);

        if (power.name === 'Genesis Spark') {
          const { child, updatedParent } = forkOrganism(o, rng);
          o = updatedParent;
          newOrganisms.push(child);
          locLines.push(chalk.greenBright(`  🧬 ${chalk.bold(o.name)} forks! New organism: ${chalk.bold(child.name)} enters Veridion Hollow.`));
        }

        if (power.name === 'Spark Forge') {
          const artifactNames = ['Crystalline Compass', 'Ember Lantern', 'Whispering Rune', 'Iron Codex', 'Verdant Seed'];
          artifacts.push(artifactNames[Math.floor(rng() * artifactNames.length)]);
        }
      }

      // 11. Movement
      const newLoc = moveOrganism(o.currentLocation, rng);
      o = { ...o, currentLocation: newLoc };

      // Update organism in main list
      const idx = organisms.findIndex((x) => x.id === o.id);
      if (idx !== -1) organisms[idx] = o;
    }

    // Print the complete location block
    printNarrativeLine(location.emoji, locName, locLines);
  }

  organisms = [...organisms, ...newOrganisms];

  return {
    tick: tick + 1,
    organisms,
    artifacts,
    rng,
  };
}
