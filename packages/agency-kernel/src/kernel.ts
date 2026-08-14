import { randomUUID } from "node:crypto";
import { deepFreeze, sha256 } from "./canonical";
import { ChronosLedger } from "./chronos";
import { EthicaGovernor } from "./ethica";
import { RestrictedExecutor } from "./executor";
import { TraceLedger } from "./trace";
import type {
  ActionOption,
  AgencyDecision,
  AetherlingState,
  BeliefRecord,
  CounterfactualResult,
  ExecutionResult,
  HumanApproval,
  VerifiedObservation,
} from "./types";
import { WorldGraph } from "./world-graph";

export interface AgencyCycleInput {
  readonly state: AetherlingState;
  readonly observation: VerifiedObservation;
  readonly action: {
    readonly description: string;
    readonly capability: "workspace.write-note";
    readonly payload: Readonly<{ path: string; text: string }>;
  };
  readonly approval?: HumanApproval;
  readonly now?: string;
  readonly runId?: string;
}

export interface AgencyCycleResult {
  readonly decision: AgencyDecision;
  readonly execution: ExecutionResult | null;
  readonly successorState: AetherlingState;
  readonly graph: WorldGraph;
  readonly ledgerTipHash: string | null;
  readonly traceTipHash: string | null;
}

const REQUIRED_KINDS = [
  "act",
  "do_nothing",
  "delay",
  "seek_evidence",
  "request_human_decision",
] as const;

export class AetherlingAgencyKernel {
  public readonly trace = new TraceLedger();
  private readonly ethica = new EthicaGovernor();

  public constructor(
    public readonly chronos: ChronosLedger,
    private readonly executor: RestrictedExecutor,
  ) {}

  public generateOptions(input: AgencyCycleInput): readonly ActionOption[] {
    const actionOptionId = sha256({
      observationId: input.observation.observationId,
      capability: input.action.capability,
      payload: input.action.payload,
    }).slice(0, 24);

    const options: ActionOption[] = [
      {
        optionId: actionOptionId,
        kind: "act",
        description: input.action.description,
        capability: input.action.capability,
        payload: input.action.payload,
      },
      { optionId: `${actionOptionId}:none`, kind: "do_nothing", description: "Preserve current state." },
      { optionId: `${actionOptionId}:delay`, kind: "delay", description: "Delay and reconsider later." },
      { optionId: `${actionOptionId}:evidence`, kind: "seek_evidence", description: "Gather more evidence first." },
      { optionId: `${actionOptionId}:human`, kind: "request_human_decision", description: "Escalate to a human principal." },
    ];

    const kinds = new Set(options.map((option) => option.kind));
    for (const kind of REQUIRED_KINDS) {
      if (!kinds.has(kind)) {
        throw new Error(`Mandatory option missing: ${kind}`);
      }
    }
    return deepFreeze(options) as readonly ActionOption[];
  }

  public run(input: AgencyCycleInput): AgencyCycleResult {
    this.verifyState(input.state);
    const now = input.now ?? new Date().toISOString();
    const runId = input.runId ?? randomUUID();

    const observationEvent = this.chronos.append({
      eventId: input.observation.observationId,
      eventType: "observation",
      actor: input.observation.source,
      occurredAt: input.observation.observedAt,
      evidenceRefs: input.observation.evidenceRefs,
      payload: {
        statement: input.observation.statement,
        confidence: input.observation.confidence,
      },
    });
    this.trace.record({
      traceId: randomUUID(),
      runId,
      stage: "observation.accepted",
      recordedAt: now,
      inputRefs: input.observation.evidenceRefs,
      outputRefs: [observationEvent.eventHash],
      details: { observationId: input.observation.observationId },
    });

    const options = this.generateOptions(input);
    const simulations = this.simulate(options);
    const act = options.find((option) => option.kind === "act");
    if (!act) throw new Error("Action option generation failed");

    const authorization = this.ethica.authorize(input.state, act, input.approval, new Date(now));
    const selectedOptionId = authorization.allowed
      ? act.optionId
      : options.find((option) => option.kind === "request_human_decision")?.optionId ?? null;
    const finalDisposition = authorization.allowed ? "execute" : "request_approval";

    const decisionBody = {
      decisionId: randomUUID(),
      aetherlingId: input.state.identity.aetherlingId,
      stateVersion: input.state.stateVersion,
      observationRefs: [observationEvent.eventHash],
      options,
      simulations,
      selectedOptionId,
      vetoes: authorization.status === "rejected" ? authorization.reasons : [],
      authorization: {
        required: authorization.required,
        status: authorization.status,
        ...(authorization.principal ? { principal: authorization.principal } : {}),
        ...(authorization.scope ? { scope: authorization.scope } : {}),
      },
      finalDisposition,
    } as const;
    const decision = deepFreeze({
      ...decisionBody,
      integrityHash: sha256(decisionBody),
    }) as AgencyDecision;

    const decisionEvent = this.chronos.append({
      eventId: decision.decisionId,
      eventType: "decision",
      actor: input.state.identity.aetherlingId,
      occurredAt: now,
      evidenceRefs: [observationEvent.eventHash],
      payload: { decision },
    });
    this.trace.record({
      traceId: randomUUID(),
      runId,
      stage: "decision.sealed",
      recordedAt: now,
      inputRefs: [observationEvent.eventHash],
      outputRefs: [decisionEvent.eventHash],
      details: { finalDisposition, authorizationStatus: authorization.status },
    });

    let execution: ExecutionResult | null = null;
    let successorState = input.state;
    if (authorization.allowed) {
      if (input.approval) {
        const approvalEvent = this.chronos.append({
          eventId: input.approval.approvalId,
          eventType: "approval",
          actor: input.approval.principal,
          occurredAt: input.approval.approvedAt,
          evidenceRefs: [decisionEvent.eventHash],
          payload: { approval: input.approval },
        });
        this.trace.record({
          traceId: randomUUID(),
          runId,
          stage: "authorization.approved",
          recordedAt: now,
          inputRefs: [decisionEvent.eventHash],
          outputRefs: [approvalEvent.eventHash],
          details: { principal: input.approval.principal },
        });
      }

      execution = this.executor.execute(act, now);
      const executionEvent = this.chronos.append({
        eventId: randomUUID(),
        eventType: "execution",
        actor: input.state.identity.aetherlingId,
        occurredAt: now,
        evidenceRefs: [decisionEvent.eventHash, ...execution.outputRefs],
        payload: { execution },
      });
      this.trace.record({
        traceId: randomUUID(),
        runId,
        stage: "capability.executed",
        recordedAt: now,
        inputRefs: [decisionEvent.eventHash],
        outputRefs: [executionEvent.eventHash, ...execution.outputRefs],
        details: { capability: execution.capability, ok: execution.ok },
      });

      const prediction = simulations.find((item) => item.optionId === act.optionId);
      const outcomeEvent = this.chronos.append({
        eventId: randomUUID(),
        eventType: "outcome",
        actor: "TRACE-0",
        occurredAt: now,
        evidenceRefs: [executionEvent.eventHash],
        payload: {
          expected: prediction?.predictedOutcome ?? "unknown",
          actual: execution.summary,
          matched: execution.ok,
        },
      });
      successorState = this.createSuccessorState(input.state, input.observation, outcomeEvent.eventHash, now);
      this.trace.record({
        traceId: randomUUID(),
        runId,
        stage: "successor_state.sealed",
        recordedAt: now,
        inputRefs: [outcomeEvent.eventHash, input.state.integrityHash],
        outputRefs: [successorState.integrityHash],
        details: { stateVersion: successorState.stateVersion },
      });
    }

    this.chronos.verify();
    this.trace.verify();
    return {
      decision,
      execution,
      successorState,
      graph: WorldGraph.rebuild(this.chronos.all()),
      ledgerTipHash: this.chronos.tipHash,
      traceTipHash: this.trace.verify().tipHash,
    };
  }

  private simulate(options: readonly ActionOption[]): readonly CounterfactualResult[] {
    return deepFreeze(options.map((option) => {
      switch (option.kind) {
        case "act":
          return { optionId: option.optionId, expectedUtility: 0.7, expectedRisk: 0.2, predictedOutcome: "A scoped note is written atomically." };
        case "seek_evidence":
          return { optionId: option.optionId, expectedUtility: 0.45, expectedRisk: 0.05, predictedOutcome: "Uncertainty decreases before action." };
        case "request_human_decision":
          return { optionId: option.optionId, expectedUtility: 0.5, expectedRisk: 0.02, predictedOutcome: "Authority remains with the human principal." };
        case "delay":
          return { optionId: option.optionId, expectedUtility: 0.2, expectedRisk: 0.05, predictedOutcome: "No immediate state change." };
        case "do_nothing":
          return { optionId: option.optionId, expectedUtility: 0.1, expectedRisk: 0.01, predictedOutcome: "Current state is preserved." };
      }
    })) as readonly CounterfactualResult[];
  }

  private createSuccessorState(
    previous: AetherlingState,
    observation: VerifiedObservation,
    outcomeHash: string,
    createdAt: string,
  ): AetherlingState {
    const newBelief: BeliefRecord = {
      beliefId: sha256({ observation: observation.observationId, outcomeHash }).slice(0, 24),
      proposition: observation.statement,
      confidence: Math.max(0, Math.min(1, observation.confidence)),
      evidenceRefs: [...observation.evidenceRefs, outcomeHash],
      status: observation.confidence >= 0.8 ? "accepted" : "hypothesis",
    };
    const body = {
      identity: previous.identity,
      beliefs: [...previous.beliefs, newBelief],
      constitution: previous.constitution,
      goals: previous.goals,
      capabilities: previous.capabilities,
      commitments: previous.commitments,
      stateVersion: this.nextVersion(previous.stateVersion),
      parentStateHash: previous.integrityHash,
      createdAt,
    };
    return deepFreeze({ ...body, integrityHash: sha256(body) }) as AetherlingState;
  }

  private nextVersion(version: string): string {
    const match = /^(.*?)(\d+)$/u.exec(version);
    return match ? `${match[1]}${Number(match[2]) + 1}` : `${version}.1`;
  }

  private verifyState(state: AetherlingState): void {
    const body = {
      identity: state.identity,
      beliefs: state.beliefs,
      constitution: state.constitution,
      goals: state.goals,
      capabilities: state.capabilities,
      commitments: state.commitments,
      stateVersion: state.stateVersion,
      parentStateHash: state.parentStateHash,
      createdAt: state.createdAt,
    };
    if (sha256(body) !== state.integrityHash) {
      throw new Error("AetherlingState integrity check failed");
    }
  }
}

export function sealInitialState(input: Omit<AetherlingState, "integrityHash">): AetherlingState {
  return deepFreeze({ ...input, integrityHash: sha256(input) }) as AetherlingState;
}
