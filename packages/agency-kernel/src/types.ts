export type RiskClass = "low" | "medium" | "high" | "critical";
export type Disposition =
  | "execute"
  | "delay"
  | "seek_evidence"
  | "do_nothing"
  | "request_approval"
  | "reject";

export interface VerifiedObservation {
  readonly observationId: string;
  readonly source: string;
  readonly statement: string;
  readonly evidenceRefs: readonly string[];
  readonly confidence: number;
  readonly observedAt: string;
}

export interface IdentityKernel {
  readonly aetherlingId: string;
  readonly name: string;
  readonly creator: string;
  readonly lineage: readonly string[];
}

export interface BeliefRecord {
  readonly beliefId: string;
  readonly proposition: string;
  readonly confidence: number;
  readonly evidenceRefs: readonly string[];
  readonly status: "hypothesis" | "accepted" | "contested" | "rejected";
}

export interface Constitution {
  readonly version: string;
  readonly principles: readonly string[];
  readonly vetoedCapabilities: readonly string[];
}

export interface Goal {
  readonly goalId: string;
  readonly description: string;
  readonly priority: number;
}

export interface CapabilityGrant {
  readonly capability: string;
  readonly risk: RiskClass;
  readonly scope: readonly string[];
  readonly requiresHumanApproval: boolean;
}

export interface Commitment {
  readonly commitmentId: string;
  readonly statement: string;
  readonly active: boolean;
}

export interface AetherlingState {
  readonly identity: IdentityKernel;
  readonly beliefs: readonly BeliefRecord[];
  readonly constitution: Constitution;
  readonly goals: readonly Goal[];
  readonly capabilities: readonly CapabilityGrant[];
  readonly commitments: readonly Commitment[];
  readonly stateVersion: string;
  readonly parentStateHash: string | null;
  readonly createdAt: string;
  readonly integrityHash: string;
}

export type OptionKind =
  | "act"
  | "do_nothing"
  | "delay"
  | "seek_evidence"
  | "request_human_decision";

export interface ActionOption {
  readonly optionId: string;
  readonly kind: OptionKind;
  readonly description: string;
  readonly capability?: string;
  readonly payload?: Readonly<Record<string, unknown>>;
}

export interface CounterfactualResult {
  readonly optionId: string;
  readonly expectedUtility: number;
  readonly expectedRisk: number;
  readonly predictedOutcome: string;
}

export interface HumanApproval {
  readonly approvalId: string;
  readonly principal: string;
  readonly capability: string;
  readonly optionId: string;
  readonly scope: readonly string[];
  readonly approvedAt: string;
  readonly expiresAt: string;
}

export interface AgencyDecision {
  readonly decisionId: string;
  readonly aetherlingId: string;
  readonly stateVersion: string;
  readonly observationRefs: readonly string[];
  readonly options: readonly ActionOption[];
  readonly simulations: readonly CounterfactualResult[];
  readonly selectedOptionId: string | null;
  readonly vetoes: readonly string[];
  readonly authorization: {
    readonly required: boolean;
    readonly status: "not_required" | "pending" | "approved" | "rejected" | "expired";
    readonly principal?: string;
    readonly scope?: readonly string[];
  };
  readonly finalDisposition: Disposition;
  readonly integrityHash: string;
}

export interface ExecutionResult {
  readonly ok: boolean;
  readonly capability: string;
  readonly outputRefs: readonly string[];
  readonly summary: string;
  readonly completedAt: string;
}

export interface InformatronBody {
  readonly eventId: string;
  readonly eventType:
    | "genesis"
    | "observation"
    | "decision"
    | "approval"
    | "execution"
    | "outcome"
    | "belief_revision";
  readonly actor: string;
  readonly occurredAt: string;
  readonly parentEventHash: string | null;
  readonly evidenceRefs: readonly string[];
  readonly payload: Readonly<Record<string, unknown>>;
}

export interface Informatron extends InformatronBody {
  readonly eventHash: string;
}

export interface TraceBody {
  readonly traceId: string;
  readonly runId: string;
  readonly sequence: number;
  readonly stage: string;
  readonly recordedAt: string;
  readonly inputRefs: readonly string[];
  readonly outputRefs: readonly string[];
  readonly details: Readonly<Record<string, unknown>>;
  readonly previousTraceHash: string | null;
}

export interface TraceRecord extends TraceBody {
  readonly traceHash: string;
}
