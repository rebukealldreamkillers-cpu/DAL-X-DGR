import type { Disposition } from "@/db/schema";

// ── DAL-X Enforcement Posture Text ────────────────────────────────────────────
// Canonical enforcement descriptions used in the Governance Manifest and
// displayed to sponsors before signing.

export const DAL_X_ENFORCEMENT_POSTURES: Record<Disposition, string> = {
  KEEP: "Maintains the approved authority boundary. Execution classes listed in the manifest may proceed under their assigned authority levels. All runtime signals, evidence requirements, and escalation paths remain active.",
  DOWNSIZE:
    "Restricts the agent to the approved reduced scope. Execution classes outside the reduced scope are blocked. The authority matrix governs all remaining classes.",
  REPLACE:
    "Revokes execution authority from the current agent. No authorization token is issued. The approved alternative becomes the authorized execution path once implemented and validated by the client.",
  KILL: "Revokes all execution authority. No authorization token is issued for any execution class. The agent remains blocked until decommissioning is confirmed and its registration is formally closed.",
};

export function deriveDALXEnforcementPosture(disposition: Disposition): string {
  return DAL_X_ENFORCEMENT_POSTURES[disposition];
}
