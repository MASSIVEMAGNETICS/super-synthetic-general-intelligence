import { mkdirSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import type { ActionOption, ExecutionResult } from "./types";

export class RestrictedExecutor {
  private readonly root: string;

  public constructor(workspaceRoot: string) {
    this.root = resolve(workspaceRoot);
  }

  public execute(option: ActionOption, completedAt: string): ExecutionResult {
    if (option.kind !== "act" || option.capability !== "workspace.write-note") {
      throw new Error("Unsupported or unauthorized capability");
    }

    const relativePath = String(option.payload?.path ?? "");
    const text = String(option.payload?.text ?? "");
    const destination = resolve(this.root, relativePath);
    if (destination !== this.root && !destination.startsWith(`${this.root}${sep}`)) {
      throw new Error("Sandbox path escape blocked");
    }

    mkdirSync(dirname(destination), { recursive: true });
    const temporary = `${destination}.tmp`;
    writeFileSync(temporary, text, { encoding: "utf8", flag: "w" });
    renameSync(temporary, destination);

    return {
      ok: true,
      capability: option.capability,
      outputRefs: [destination],
      summary: `Wrote ${new TextEncoder().encode(text).byteLength} bytes to ${relativePath}`,
      completedAt,
    };
  }
}
