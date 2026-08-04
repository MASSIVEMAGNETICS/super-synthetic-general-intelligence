import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  AetherlingAgencyKernel,
  ChronosLedger,
  RestrictedExecutor,
  sealInitialState,
  type AgencyCycleInput,
  type HumanApproval,
} from "../src";

function fixture(): AgencyCycleInput {
  const state = sealInitialState({
    identity: {
      aetherlingId: "victor:seed-1",
      name: "Victor",
      creator: "Bando",
      lineage: ["MASSIVEMAGNETICS", "AetherForge"],
    },
    beliefs: [],
    constitution: {
      version: "father-law-1",
      principles: ["truth before confidence", "human authority over irreversible action"],
      vetoedCapabilities: [],
    },
    goals: [{ goalId: "vertical-slice", description: "Prove one verified action loop", priority: 1 }],
    capabilities: [{
      capability: "workspace.write-note",
      risk: "medium",
      scope: ["approved/"],
      requiresHumanApproval: true,
    }],
    commitments: [{ commitmentId: "no-history-rewrite", statement: "Learning creates successor state.", active: true }],
    stateVersion: "state-0",
    parentStateHash: null,
    createdAt: "2026-08-04T07:32:00.000Z",
  });
  return {
    state,
    observation: {
      observationId: "obs-vertical-slice",
      source: "BANDO",
      statement: "The verified Victor vertical slice should commence.",
      evidenceRefs: ["chat:2026-08-04:commence"],
      confidence: 1,
      observedAt: "2026-08-04T07:32:00.000Z",
    },
    action: {
      description: "Write the first approved Victor artifact.",
      capability: "workspace.write-note",
      payload: { path: "approved/first-transition.txt", text: "Victor vertical slice: verified transition 1.\n" },
    },
    now: "2026-08-04T07:32:01.000Z",
    runId: "run-vertical-slice-001",
  };
}

test("mandatory alternatives exist and no approval means no execution", () => {
  const root = mkdtempSync(join(tmpdir(), "aetherforge-no-approval-"));
  try {
    const ledger = new ChronosLedger(join(root, "chronos.jsonl"));
    const kernel = new AetherlingAgencyKernel(ledger, new RestrictedExecutor(root));
    const input = fixture();
    const result = kernel.run(input);
    assert.deepEqual(
      new Set(result.decision.options.map((option) => option.kind)),
      new Set(["act", "do_nothing", "delay", "seek_evidence", "request_human_decision"]),
    );
    assert.equal(result.decision.finalDisposition, "request_approval");
    assert.equal(result.execution, null);
    assert.equal(result.successorState.integrityHash, input.state.integrityHash);
    assert.equal(existsSync(join(root, "approved/first-transition.txt")), false);
    assert.equal(ledger.verify().ok, true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("approved action executes, traces, persists, replays, and seals successor state", () => {
  const root = mkdtempSync(join(tmpdir(), "aetherforge-approved-"));
  try {
    const ledgerPath = join(root, "chronos.jsonl");
    const ledger = new ChronosLedger(ledgerPath);
    const kernel = new AetherlingAgencyKernel(ledger, new RestrictedExecutor(root));
    const input = fixture();
    const act = kernel.generateOptions(input).find((option) => option.kind === "act");
    assert.ok(act);
    const approval: HumanApproval = {
      approvalId: "approval-001",
      principal: "BANDO",
      capability: "workspace.write-note",
      optionId: act.optionId,
      scope: ["approved/"],
      approvedAt: "2026-08-04T07:32:00.500Z",
      expiresAt: "2026-08-04T08:32:00.500Z",
    };

    const result = kernel.run({ ...input, approval });
    assert.equal(result.decision.finalDisposition, "execute");
    assert.equal(result.execution?.ok, true);
    assert.equal(readFileSync(join(root, "approved/first-transition.txt"), "utf8"), "Victor vertical slice: verified transition 1.\n");
    assert.equal(result.successorState.parentStateHash, input.state.integrityHash);
    assert.equal(result.successorState.stateVersion, "state-1");
    assert.equal(result.successorState.beliefs.length, 1);
    assert.ok(result.graph.nodes.size >= 5);
    assert.equal(kernel.trace.verify().ok, true);

    const originalTip = ledger.verify().tipHash;
    const restarted = new ChronosLedger(ledgerPath);
    assert.equal(restarted.verify().tipHash, originalTip);
    assert.equal(restarted.size, ledger.size);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("sandbox blocks path traversal", () => {
  const root = mkdtempSync(join(tmpdir(), "aetherforge-sandbox-"));
  try {
    const ledger = new ChronosLedger(join(root, "chronos.jsonl"));
    const kernel = new AetherlingAgencyKernel(ledger, new RestrictedExecutor(root));
    const input = fixture();
    const escaped = {
      ...input,
      action: {
        ...input.action,
        payload: { path: "../escape.txt", text: "blocked" },
      },
    };
    const act = kernel.generateOptions(escaped).find((option) => option.kind === "act");
    assert.ok(act);
    assert.throws(() => kernel.run({
      ...escaped,
      approval: {
        approvalId: "approval-escape",
        principal: "BANDO",
        capability: "workspace.write-note",
        optionId: act.optionId,
        scope: ["../"],
        approvedAt: "2026-08-04T07:32:00.500Z",
        expiresAt: "2026-08-04T08:32:00.500Z",
      },
    }), /Sandbox path escape blocked/u);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
