import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import { canonicalize, deepFreeze, sha256 } from "./canonical";
import type { Informatron, InformatronBody } from "./types";

export class ChronosIntegrityError extends Error {}

export class ChronosLedger {
  private readonly events: Informatron[] = [];

  public constructor(private readonly persistencePath?: string) {
    if (persistencePath && existsSync(persistencePath)) {
      this.load(persistencePath);
    }
  }

  public get size(): number {
    return this.events.length;
  }

  public get tipHash(): string | null {
    return this.events.at(-1)?.eventHash ?? null;
  }

  public all(): readonly Informatron[] {
    return this.events;
  }

  public append(input: Omit<InformatronBody, "parentEventHash">): Informatron {
    const body: InformatronBody = {
      ...input,
      parentEventHash: this.tipHash,
    };
    const event = deepFreeze({ ...body, eventHash: sha256(body) }) as Informatron;
    this.events.push(event);
    if (this.persistencePath) {
      mkdirSync(dirname(this.persistencePath), { recursive: true });
      appendFileSync(this.persistencePath, `${canonicalize(event)}\n`, { encoding: "utf8" });
    }
    return event;
  }

  public verify(): { readonly ok: true; readonly count: number; readonly tipHash: string | null } {
    let parent: string | null = null;
    for (const event of this.events) {
      const body: InformatronBody = {
        eventId: event.eventId,
        eventType: event.eventType,
        actor: event.actor,
        occurredAt: event.occurredAt,
        parentEventHash: event.parentEventHash,
        evidenceRefs: event.evidenceRefs,
        payload: event.payload,
      };
      if (event.parentEventHash !== parent) {
        throw new ChronosIntegrityError(`Broken parent link at ${event.eventId}`);
      }
      if (sha256(body) !== event.eventHash) {
        throw new ChronosIntegrityError(`Hash mismatch at ${event.eventId}`);
      }
      parent = event.eventHash;
    }
    return { ok: true, count: this.events.length, tipHash: parent };
  }

  private load(path: string): void {
    const lines = readFileSync(path, "utf8").split(/\r?\n/u).filter(Boolean);
    for (const line of lines) {
      this.events.push(deepFreeze(JSON.parse(line) as Informatron) as Informatron);
    }
    this.verify();
  }
}
