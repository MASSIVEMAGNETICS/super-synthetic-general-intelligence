import type { ActionOption, AetherlingState, HumanApproval } from "./types";

export interface AuthorizationVerdict {
  readonly allowed: boolean;
  readonly required: boolean;
  readonly status: "not_required" | "pending" | "approved" | "rejected" | "expired";
  readonly reasons: readonly string[];
  readonly principal?: string;
  readonly scope?: readonly string[];
}

export class EthicaGovernor {
  public authorize(
    state: AetherlingState,
    option: ActionOption,
    approval?: HumanApproval,
    now = new Date(),
  ): AuthorizationVerdict {
    if (option.kind !== "act" || !option.capability) {
      return { allowed: true, required: false, status: "not_required", reasons: [] };
    }

    if (state.constitution.vetoedCapabilities.includes(option.capability)) {
      return {
        allowed: false,
        required: false,
        status: "rejected",
        reasons: ["capability_vetoed_by_constitution"],
      };
    }

    const grant = state.capabilities.find((item) => item.capability === option.capability);
    if (!grant) {
      return {
        allowed: false,
        required: false,
        status: "rejected",
        reasons: ["capability_not_granted"],
      };
    }

    if (!grant.requiresHumanApproval) {
      return { allowed: true, required: false, status: "not_required", reasons: [] };
    }

    if (!approval) {
      return {
        allowed: false,
        required: true,
        status: "pending",
        reasons: ["human_approval_required"],
      };
    }

    if (new Date(approval.expiresAt).getTime() <= now.getTime()) {
      return {
        allowed: false,
        required: true,
        status: "expired",
        reasons: ["approval_expired"],
      };
    }

    if (approval.optionId !== option.optionId || approval.capability !== option.capability) {
      return {
        allowed: false,
        required: true,
        status: "rejected",
        reasons: ["approval_scope_mismatch"],
      };
    }

    const payloadPath = String(option.payload?.path ?? "");
    if (payloadPath && !approval.scope.some((prefix) => payloadPath.startsWith(prefix))) {
      return {
        allowed: false,
        required: true,
        status: "rejected",
        reasons: ["approval_path_out_of_scope"],
      };
    }

    return {
      allowed: true,
      required: true,
      status: "approved",
      reasons: [],
      principal: approval.principal,
      scope: approval.scope,
    };
  }
}
