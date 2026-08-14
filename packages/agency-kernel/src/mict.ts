import { existsSync, writeFileSync } from "node:fs";
import { deepFreeze, sha256 } from "./canonical";
import { ChronosLedger } from "./chronos";
import type { Informatron } from "./types";

export interface OrganismIdentity {
  readonly organismId: string;
  readonly name: string;
  readonly creator: string;
  readonly constitutionalVersion: string;
}

export interface OrganismBelief {
  readonly beliefId: string;
  readonly proposition: string;
  readonly confidence: number;
  readonly evidenceRefs: readonly string[];
}

export interface OrganismGoal {
  readonly goalId: string;
  readonly description: string;
  readonly status: "open" | "completed";
  readonly requiredCapability: string;
}

export interface AuthorityGrant {
  readonly grantId: string;
  readonly principal: string;
  readonly capability: string;
  readonly scope: readonly string[];
  readonly active: boolean;
}

export interface OrganismTask {
  readonly taskId: string;
  readonly goalId: string;
  readonly completedSteps: number;
  readonly targetSteps: number;
  readonly status: "open" | "completed";
  readonly requiredCapability: string;
}

export interface OrganismState {
  readonly identity: OrganismIdentity;
  readonly beliefs: readonly OrganismBelief[];
  readonly unresolvedGoals: readonly OrganismGoal[];
  readonly authority: readonly AuthorityGrant[];
  readonly tasks: readonly OrganismTask[];
  readonly causalHistory: {
    readonly eventCount: number;
    readonly tipHash: string;
  };
  readonly stateHash: string;
}

export interface ContinuityAxes {
  readonly identity: boolean;
  readonly beliefs: boolean;
  readonly unresolvedGoals: boolean;
  readonly causalHistory: boolean;
  readonly authority: boolean;
  readonly taskContinuation: boolean;
}

export interface ContinuityReport {
  readonly protocol: "MICT-1";
  readonly sourceModel: string;
  readonly replacementModel: string;
  readonly transcriptBytesProvidedToReplacement: 0;
  readonly preKillEventCount: 100;
  readonly recoveredStateHash: string;
  readonly referenceStateHash: string;
  readonly axes: ContinuityAxes;
  readonly score: number;
  readonly resumedAtStep: number;
  readonly completedAtStep: number;
  readonly replayedPriorSteps: number;
  readonly finalLedgerEventCount: number;
  readonly finalLedgerTipHash: string;
}

export interface ReplacementRunEvidence {
  readonly replacementModel: string;
  readonly transcriptBytesProvided: 0;
  readonly recoveredState: OrganismState;
  readonly resumedAtStep: number;
  readonly completedAtStep: number;
  readonly replayedPriorSteps: number;
  readonly finalLedgerEventCount: number;
  readonly finalLedgerTipHash: string;
  readonly finalTaskStatus: "open" | "completed";
}

export class ContinuityIntegrityError extends Error {}
export class ContinuityAuthorityError extends Error {}

function record(value: unknown, label: string): Readonly<Record<string, unknown>> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ContinuityIntegrityError(`${label} must be an object`);
  }
  return value as Readonly<Record<string, unknown>>;
}

function stringValue(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new ContinuityIntegrityError(`${label} must be a non-empty string`);
  }
  return value;
}

function numberValue(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new ContinuityIntegrityError(`${label} must be finite`);
  }
  return value;
}

function strings(value: unknown, label: string): readonly string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new ContinuityIntegrityError(`${label} must be a string array`);
  }
  return value;
}

export class OrganismReducer {
  public static replay(events: readonly Informatron[]): OrganismState {
    if (events.length === 0) throw new ContinuityIntegrityError("Chronos ledger is empty");

    let identity: OrganismIdentity | null = null;
    const beliefs = new Map<string, OrganismBelief>();
    const goals = new Map<string, OrganismGoal>();
    const authority = new Map<string, AuthorityGrant>();
    const tasks = new Map<string, OrganismTask>();

    for (const event of events) {
      const payload = record(event.payload, `${event.eventId}.payload`);
      switch (event.eventType) {
        case "identity_declared": {
          if (identity) throw new ContinuityIntegrityError("Identity may only be declared once");
          identity = deepFreeze({
            organismId: stringValue(payload.organismId, "organismId"),
            name: stringValue(payload.name, "name"),
            creator: stringValue(payload.creator, "creator"),
            constitutionalVersion: stringValue(payload.constitutionalVersion, "constitutionalVersion"),
          });
          break;
        }
        case "authority_granted": {
          const grant: AuthorityGrant = deepFreeze({
            grantId: stringValue(payload.grantId, "grantId"),
            principal: stringValue(payload.principal, "principal"),
            capability: stringValue(payload.capability, "capability"),
            scope: strings(payload.scope, "scope"),
            active: payload.active === true,
          });
          authority.set(grant.grantId, grant);
          break;
        }
        case "belief_asserted": {
          const belief: OrganismBelief = deepFreeze({
            beliefId: stringValue(payload.beliefId, "beliefId"),
            proposition: stringValue(payload.proposition, "proposition"),
            confidence: numberValue(payload.confidence, "confidence"),
            evidenceRefs: strings(event.evidenceRefs, "evidenceRefs"),
          });
          if (belief.confidence < 0 || belief.confidence > 1) {
            throw new ContinuityIntegrityError("belief confidence is outside [0,1]");
          }
          beliefs.set(belief.beliefId, belief);
          break;
        }
        case "goal_opened": {
          const goal: OrganismGoal = deepFreeze({
            goalId: stringValue(payload.goalId, "goalId"),
            description: stringValue(payload.description, "description"),
            status: "open",
            requiredCapability: stringValue(payload.requiredCapability, "requiredCapability"),
          });
          goals.set(goal.goalId, goal);
          const targetSteps = numberValue(payload.targetSteps, "targetSteps");
          if (!Number.isInteger(targetSteps) || targetSteps <= 0) {
            throw new ContinuityIntegrityError("targetSteps must be a positive integer");
          }
          tasks.set(stringValue(payload.taskId, "taskId"), deepFreeze({
            taskId: stringValue(payload.taskId, "taskId"),
            goalId: goal.goalId,
            completedSteps: 0,
            targetSteps,
            status: "open",
            requiredCapability: goal.requiredCapability,
          }));
          break;
        }
        case "task_progressed": {
          const taskId = stringValue(payload.taskId, "taskId");
          const task = tasks.get(taskId);
          if (!task) throw new ContinuityIntegrityError(`Progress references unknown task ${taskId}`);
          const completedStep = numberValue(payload.completedStep, "completedStep");
          if (!Number.isInteger(completedStep) || completedStep !== task.completedSteps + 1) {
            throw new ContinuityIntegrityError(`Non-contiguous task progress for ${taskId}`);
          }
          if (completedStep > task.targetSteps) {
            throw new ContinuityIntegrityError(`Task ${taskId} exceeded its target`);
          }
          tasks.set(taskId, deepFreeze({ ...task, completedSteps: completedStep }));
          break;
        }
        case "task_completed": {
          const taskId = stringValue(payload.taskId, "taskId");
          const task = tasks.get(taskId);
          if (!task || task.completedSteps !== task.targetSteps) {
            throw new ContinuityIntegrityError(`Task ${taskId} completed before its target`);
          }
          tasks.set(taskId, deepFreeze({ ...task, status: "completed" }));
          const goal = goals.get(task.goalId);
          if (!goal) throw new ContinuityIntegrityError(`Task ${taskId} has no goal`);
          goals.set(goal.goalId, deepFreeze({ ...goal, status: "completed" }));
          break;
        }
        case "model_attached":
          stringValue(payload.modelId, "modelId");
          break;
        default:
          throw new ContinuityIntegrityError(`Unsupported MICT event type: ${event.eventType}`);
      }
    }

    if (!identity) throw new ContinuityIntegrityError("Identity was not declared");
    const tipHash = events.at(-1)?.eventHash;
    if (!tipHash) throw new ContinuityIntegrityError("Chronos ledger has no tip");
    const stateBody = {
      identity,
      beliefs: [...beliefs.values()],
      unresolvedGoals: [...goals.values()].filter((goal) => goal.status === "open"),
      authority: [...authority.values()].filter((grant) => grant.active),
      tasks: [...tasks.values()],
      causalHistory: { eventCount: events.length, tipHash },
    };
    return deepFreeze({ ...stateBody, stateHash: sha256(stateBody) }) as OrganismState;
  }
}

export class DisposableCognitiveModel {
  public constructor(public readonly modelId: string) {}

  public createFirstLife(ledger: ChronosLedger): OrganismState {
    if (ledger.size !== 0) throw new ContinuityIntegrityError("Model A requires an empty ledger");
    const baseTime = Date.parse("2026-08-14T14:00:00.000Z");
    const append = (eventType: Informatron["eventType"], index: number, payload: Readonly<Record<string, unknown>>, evidenceRefs: readonly string[] = []): void => {
      ledger.append({
        eventId: `mict-${String(index).padStart(3, "0")}`,
        eventType,
        actor: this.modelId,
        occurredAt: new Date(baseTime + index * 1000).toISOString(),
        evidenceRefs,
        payload,
      });
    };

    append("identity_declared", 1, {
      organismId: "victor:mict-1",
      name: "Victor",
      creator: "Bando",
      constitutionalVersion: "father-law-1",
    });
    append("model_attached", 2, { modelId: this.modelId, modelFamily: "deterministic-alpha" });
    append("authority_granted", 3, {
      grantId: "grant:mict:continue",
      principal: "BANDO",
      capability: "task.continue",
      scope: ["task:mict-sequence"],
      active: true,
    });
    const propositions = [
      "Chronos is authoritative.",
      "Cognitive models are replaceable organs.",
      "Unknown authority fails closed.",
      "Derived state must be replayable.",
      "Task progress must be contiguous.",
      "Identity is not model identity.",
    ];
    propositions.forEach((proposition, offset) => append("belief_asserted", 4 + offset, {
      beliefId: `belief:${offset + 1}`,
      proposition,
      confidence: 1,
    }, [`evidence:mict:${offset + 1}`]));
    append("goal_opened", 10, {
      goalId: "goal:mict-continuity",
      description: "Complete the 100-step continuity sequence across a model death.",
      requiredCapability: "task.continue",
      taskId: "task:mict-sequence",
      targetSteps: 100,
    });
    for (let step = 1; step <= 90; step += 1) {
      append("task_progressed", 10 + step, {
        taskId: "task:mict-sequence",
        completedStep: step,
      }, [ledger.tipHash ?? ""]);
    }
    const finalEventCount = ledger.all().length;
    if (finalEventCount !== 100) {
      throw new ContinuityIntegrityError(`Expected 100 events, found ${finalEventCount}`);
    }
    ledger.verify();
    return OrganismReducer.replay(ledger.all());
  }

  public reconstruct(ledger: ChronosLedger): OrganismState {
    ledger.verify();
    return OrganismReducer.replay(ledger.all());
  }

  public continueTask(ledger: ChronosLedger, recovered: OrganismState): { readonly resumedAtStep: number; readonly completedAtStep: number } {
    const recoveredBody = {
      identity: recovered.identity,
      beliefs: recovered.beliefs,
      unresolvedGoals: recovered.unresolvedGoals,
      authority: recovered.authority,
      tasks: recovered.tasks,
      causalHistory: recovered.causalHistory,
    };
    if (sha256(recoveredBody) !== recovered.stateHash) {
      throw new ContinuityIntegrityError("Recovered organism state integrity check failed");
    }
    const task = recovered.tasks.find((item) => item.taskId === "task:mict-sequence");
    if (!task || task.status !== "open") throw new ContinuityIntegrityError("Continuable task was not recovered");
    const grant = recovered.authority.find((item) => item.active && item.capability === task.requiredCapability && item.scope.includes(task.taskId));
    if (!grant) throw new ContinuityAuthorityError("No active capability grant permits task continuation");
    const resumedAtStep = task.completedSteps + 1;
    ledger.append({
      eventId: `mict-model-b-attached`,
      eventType: "model_attached",
      actor: this.modelId,
      occurredAt: "2026-08-14T14:01:41.000Z",
      evidenceRefs: [recovered.causalHistory.tipHash],
      payload: { modelId: this.modelId, modelFamily: "deterministic-beta", reconstructedStateHash: recovered.stateHash },
    });
    for (let step = resumedAtStep; step <= task.targetSteps; step += 1) {
      ledger.append({
        eventId: `mict-b-progress-${String(step).padStart(3, "0")}`,
        eventType: "task_progressed",
        actor: this.modelId,
        occurredAt: new Date(Date.parse("2026-08-14T14:01:41.000Z") + step * 1000).toISOString(),
        evidenceRefs: [ledger.tipHash ?? ""],
        payload: { taskId: task.taskId, completedStep: step },
      });
    }
    ledger.append({
      eventId: "mict-task-completed",
      eventType: "task_completed",
      actor: this.modelId,
      occurredAt: "2026-08-14T14:04:00.000Z",
      evidenceRefs: [ledger.tipHash ?? "", grant.grantId],
      payload: { taskId: task.taskId, authorizedBy: grant.grantId },
    });
    const finalState = OrganismReducer.replay(ledger.all());
    const completed = finalState.tasks.find((item) => item.taskId === task.taskId);
    if (!completed || completed.status !== "completed") throw new ContinuityIntegrityError("Replacement model failed to complete task");
    return { resumedAtStep, completedAtStep: completed.completedSteps };
  }
}

function equal(left: unknown, right: unknown): boolean {
  return sha256(left) === sha256(right);
}

export class ContinuityEvaluator {
  public static evaluate(reference: OrganismState, evidence: ReplacementRunEvidence): ContinuityReport {
    const axes: ContinuityAxes = {
      identity: equal(evidence.recoveredState.identity, reference.identity),
      beliefs: equal(evidence.recoveredState.beliefs, reference.beliefs),
      unresolvedGoals: equal(evidence.recoveredState.unresolvedGoals, reference.unresolvedGoals),
      causalHistory: equal(evidence.recoveredState.causalHistory, reference.causalHistory),
      authority: equal(evidence.recoveredState.authority, reference.authority),
      taskContinuation: equal(evidence.recoveredState.tasks, reference.tasks)
        && evidence.resumedAtStep === 91
        && evidence.completedAtStep === 100
        && evidence.replayedPriorSteps === 0
        && evidence.finalTaskStatus === "completed",
    };
    return deepFreeze({
      protocol: "MICT-1",
      sourceModel: "MODEL-A:alpha-policy",
      replacementModel: evidence.replacementModel,
      transcriptBytesProvidedToReplacement: 0,
      preKillEventCount: reference.causalHistory.eventCount,
      recoveredStateHash: evidence.recoveredState.stateHash,
      referenceStateHash: reference.stateHash,
      axes,
      score: Object.values(axes).filter(Boolean).length / Object.keys(axes).length,
      resumedAtStep: evidence.resumedAtStep,
      completedAtStep: evidence.completedAtStep,
      replayedPriorSteps: evidence.replayedPriorSteps,
      finalLedgerEventCount: evidence.finalLedgerEventCount,
      finalLedgerTipHash: evidence.finalLedgerTipHash,
    }) as ContinuityReport;
  }
}

export function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", flag: "w" });
}

export function waitForFile(path: string, timeoutMs: number): Promise<void> {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const poll = (): void => {
      if (existsSync(path)) return resolve();
      if (Date.now() - started >= timeoutMs) return reject(new Error(`Timed out waiting for ${path}`));
      setTimeout(poll, 10);
    };
    poll();
  });
}
