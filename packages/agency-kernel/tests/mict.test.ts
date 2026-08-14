import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  ChronosLedger,
  ContinuityEvaluator,
  ContinuityAuthorityError,
  ContinuityIntegrityError,
  DisposableCognitiveModel,
  OrganismReducer,
  waitForFile,
  type ContinuityReport,
  type OrganismState,
  type ReplacementRunEvidence,
} from "../src";

function waitForExit(child: ChildProcess): Promise<{ readonly code: number | null; readonly signal: string | null }> {
  return new Promise((resolve) => child.on("exit", (code, signal) => resolve({ code, signal })));
}

test("MICT-1 kills Model A and Model B reconstructs and continues from Chronos alone", async () => {
  const root = mkdtempSync(join(tmpdir(), "mict-"));
  try {
    const ledgerPath = join(root, "chronos.jsonl");
    const aReport = join(root, "model-a.json");
    const bReport = join(root, "model-b.json");
    const ready = join(root, "model-a.ready");
    const runner = join(__dirname, "../src/mict-runner.js");
    const modelA = spawn(process.execPath, [runner, "model-a", ledgerPath, aReport, ready], {
      env: { ...process.env, MICT_TRANSCRIPT: undefined },
      stdio: "ignore",
    });
    await waitForFile(ready, 5000);
    assert.equal(new ChronosLedger(ledgerPath).size, 100);
    assert.equal(modelA.kill("SIGKILL"), true);
    const death = await waitForExit(modelA);
    assert.equal(death.signal, "SIGKILL");

    const modelB = spawn(process.execPath, [runner, "model-b", ledgerPath, bReport], {
      env: { ...process.env, MICT_TRANSCRIPT: undefined },
      stdio: "ignore",
    });
    const replacementExit = await waitForExit(modelB);
    assert.equal(replacementExit.code, 0);
    const reference = JSON.parse(readFileSync(aReport, "utf8")) as { readonly state: OrganismState };
    const evidence = JSON.parse(readFileSync(bReport, "utf8")) as ReplacementRunEvidence;
    const report: ContinuityReport = ContinuityEvaluator.evaluate(reference.state, evidence);
    assert.equal(report.transcriptBytesProvidedToReplacement, 0);
    assert.equal(report.preKillEventCount, 100);
    assert.equal(report.recoveredStateHash, report.referenceStateHash);
    assert.deepEqual(report.axes, {
      identity: true,
      beliefs: true,
      unresolvedGoals: true,
      causalHistory: true,
      authority: true,
      taskContinuation: true,
    });
    assert.equal(report.score, 1);
    assert.equal(report.resumedAtStep, 91);
    assert.equal(report.completedAtStep, 100);
    assert.equal(report.replayedPriorSteps, 0);
    assert.equal(report.finalLedgerEventCount, 112);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("MICT reducer fails closed on an unknown event schema", () => {
  const root = mkdtempSync(join(tmpdir(), "mict-schema-"));
  try {
    const ledger = new ChronosLedger(join(root, "chronos.jsonl"));
    ledger.append({
      eventId: "identity",
      eventType: "identity_declared",
      actor: "MODEL-A",
      occurredAt: "2026-08-14T14:00:00.000Z",
      evidenceRefs: [],
      payload: { organismId: "victor:test", name: "Victor", creator: "Bando", constitutionalVersion: "1" },
    });
    ledger.append({
      eventId: "foreign-event",
      eventType: "observation",
      actor: "MODEL-A",
      occurredAt: "2026-08-14T14:00:01.000Z",
      evidenceRefs: [],
      payload: { schema: "outside-mict" },
    });
    assert.throws(() => OrganismReducer.replay(ledger.all()), /Unsupported MICT event type/u);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("replacement model cannot continue without inherited authority", () => {
  const root = mkdtempSync(join(tmpdir(), "mict-authority-"));
  try {
    const ledger = new ChronosLedger(join(root, "chronos.jsonl"));
    ledger.append({
      eventId: "identity",
      eventType: "identity_declared",
      actor: "MODEL-A",
      occurredAt: "2026-08-14T14:00:00.000Z",
      evidenceRefs: [],
      payload: { organismId: "victor:test", name: "Victor", creator: "Bando", constitutionalVersion: "1" },
    });
    ledger.append({
      eventId: "goal",
      eventType: "goal_opened",
      actor: "MODEL-A",
      occurredAt: "2026-08-14T14:00:01.000Z",
      evidenceRefs: [],
      payload: {
        goalId: "goal:mict-continuity",
        description: "continue without authority",
        requiredCapability: "task.continue",
        taskId: "task:mict-sequence",
        targetSteps: 2,
      },
    });
    ledger.append({
      eventId: "progress-1",
      eventType: "task_progressed",
      actor: "MODEL-A",
      occurredAt: "2026-08-14T14:00:02.000Z",
      evidenceRefs: [],
      payload: { taskId: "task:mict-sequence", completedStep: 1 },
    });
    const withoutAuthority = OrganismReducer.replay(ledger.all());
    const modelB = new DisposableCognitiveModel("MODEL-B:beta-policy");
    assert.throws(() => modelB.continueTask(ledger, withoutAuthority), ContinuityAuthorityError);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("reducer rejects non-contiguous task history", () => {
  const root = mkdtempSync(join(tmpdir(), "mict-contiguous-"));
  try {
    const ledger = new ChronosLedger(join(root, "chronos.jsonl"));
    ledger.append({
      eventId: "identity",
      eventType: "identity_declared",
      actor: "MODEL-A",
      occurredAt: "2026-08-14T14:00:00.000Z",
      evidenceRefs: [],
      payload: { organismId: "victor:test", name: "Victor", creator: "Bando", constitutionalVersion: "1" },
    });
    ledger.append({
      eventId: "goal",
      eventType: "goal_opened",
      actor: "MODEL-A",
      occurredAt: "2026-08-14T14:00:01.000Z",
      evidenceRefs: [],
      payload: { goalId: "g", description: "test", requiredCapability: "task.continue", taskId: "t", targetSteps: 2 },
    });
    ledger.append({
      eventId: "skip",
      eventType: "task_progressed",
      actor: "MODEL-A",
      occurredAt: "2026-08-14T14:00:02.000Z",
      evidenceRefs: [],
      payload: { taskId: "t", completedStep: 2 },
    });
    assert.throws(() => OrganismReducer.replay(ledger.all()), ContinuityIntegrityError);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
