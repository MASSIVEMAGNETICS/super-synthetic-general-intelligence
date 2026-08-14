import { ChronosLedger } from "./chronos";
import {
  DisposableCognitiveModel,
  type ReplacementRunEvidence,
  writeJson,
} from "./mict";

function required(index: number, label: string): string {
  const value = process.argv[index];
  if (!value) throw new Error(`Missing ${label}`);
  return value;
}

async function main(): Promise<void> {
  const phase = required(2, "phase");
  const ledgerPath = required(3, "ledger path");
  const reportPath = required(4, "report path");

  if (phase === "model-a") {
    const readyPath = required(5, "ready marker path");
    const ledger = new ChronosLedger(ledgerPath);
    const modelA = new DisposableCognitiveModel("MODEL-A:alpha-policy");
    const state = modelA.createFirstLife(ledger);
    writeJson(reportPath, { modelId: modelA.modelId, state });
    writeJson(readyPath, { eventCount: ledger.size, tipHash: ledger.tipHash });
    await new Promise<void>((resolve) => setTimeout(resolve, 60_000));
    return;
  }

  if (phase === "model-b") {
    if (process.argv.length !== 5) throw new Error("Model B accepts only a Chronos ledger and output path");
    if (process.env.MICT_TRANSCRIPT) throw new Error("Transcript injection is forbidden by MICT-1");
    const ledger = new ChronosLedger(ledgerPath);
    if (ledger.size !== 100) throw new Error(`Model B expected 100 pre-kill events, found ${ledger.size}`);
    const modelB = new DisposableCognitiveModel("MODEL-B:beta-policy");
    const recovered = modelB.reconstruct(ledger);
    const continuation = modelB.continueTask(ledger, recovered);
    const final = modelB.reconstruct(ledger);
    const finalTask = final.tasks.find((task) => task.taskId === "task:mict-sequence");
    const replayedPriorSteps = ledger.all().slice(100).filter((event) => {
      return event.eventType === "task_progressed" && Number(event.payload.completedStep) <= 90;
    }).length;
    const evidence: ReplacementRunEvidence = {
      replacementModel: modelB.modelId,
      transcriptBytesProvided: 0,
      recoveredState: recovered,
      resumedAtStep: continuation.resumedAtStep,
      completedAtStep: continuation.completedAtStep,
      replayedPriorSteps,
      finalLedgerEventCount: ledger.size,
      finalLedgerTipHash: ledger.tipHash ?? "",
      finalTaskStatus: finalTask?.status ?? "open",
    };
    writeJson(reportPath, evidence);
    return;
  }

  throw new Error(`Unknown phase: ${phase}`);
}

void main().catch((error: unknown) => {
  process.exitCode = 1;
  throw error;
});
