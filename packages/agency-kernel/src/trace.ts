import { deepFreeze, sha256 } from "./canonical";
import type { TraceBody, TraceRecord } from "./types";

export class TraceLedger {
  private readonly records: TraceRecord[] = [];

  public record(input: Omit<TraceBody, "sequence" | "previousTraceHash">): TraceRecord {
    const body: TraceBody = {
      ...input,
      sequence: this.records.length,
      previousTraceHash: this.records.at(-1)?.traceHash ?? null,
    };
    const record = deepFreeze({ ...body, traceHash: sha256(body) }) as TraceRecord;
    this.records.push(record);
    return record;
  }

  public all(): readonly TraceRecord[] {
    return this.records;
  }

  public verify(): { readonly ok: true; readonly count: number; readonly tipHash: string | null } {
    let previous: string | null = null;
    for (const record of this.records) {
      const body: TraceBody = {
        traceId: record.traceId,
        runId: record.runId,
        sequence: record.sequence,
        stage: record.stage,
        recordedAt: record.recordedAt,
        inputRefs: record.inputRefs,
        outputRefs: record.outputRefs,
        details: record.details,
        previousTraceHash: record.previousTraceHash,
      };
      if (record.previousTraceHash !== previous || sha256(body) !== record.traceHash) {
        throw new Error(`TRACE-0 integrity failure at sequence ${record.sequence}`);
      }
      previous = record.traceHash;
    }
    return { ok: true, count: this.records.length, tipHash: previous };
  }
}
