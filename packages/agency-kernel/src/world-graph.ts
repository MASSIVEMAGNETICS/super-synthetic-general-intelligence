import type { Informatron } from "./types";

export interface WorldNode {
  readonly id: string;
  readonly kind: string;
  readonly data: Readonly<Record<string, unknown>>;
}

export interface WorldEdge {
  readonly from: string;
  readonly to: string;
  readonly relation: string;
  readonly eventHash: string;
}

export class WorldGraph {
  public readonly nodes = new Map<string, WorldNode>();
  public readonly edges: WorldEdge[] = [];

  public static rebuild(events: readonly Informatron[]): WorldGraph {
    const graph = new WorldGraph();
    const byHash = new Map(events.map((event) => [event.eventHash, event]));
    for (const event of events) {
      graph.nodes.set(event.eventId, {
        id: event.eventId,
        kind: event.eventType,
        data: event.payload,
      });
      if (event.parentEventHash) {
        const parent = byHash.get(event.parentEventHash);
        if (parent) {
          graph.edges.push({
            from: parent.eventId,
            to: event.eventId,
            relation: "caused_or_preceded",
            eventHash: event.eventHash,
          });
        }
      }
    }
    return graph;
  }
}
