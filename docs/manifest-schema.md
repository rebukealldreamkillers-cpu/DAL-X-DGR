# Governance Manifest — JSON Schema Specification
## DAL-X Policy Configuration Format v3.0

This document is the authoritative contract between the Decision Governance Review and DAL-X.
The DGR app generates this manifest. The executive sponsor signs it. DAL-X loads the signed
version as its runtime enforcement configuration.

**Three-act rule.** A PROPOSED manifest is not a signed policy. A SIGNED manifest is not yet
an enforced policy. Enforcement begins only when DAL-X loads a manifest the named sponsor
has signed. These states must never be conflated.

**Signed ≠ enforcement ready.** A signed manifest with unresolved blockers is signed evidence
of the decision, not permission to begin enforcement. `enforcementReady` must be `true` before
DAL-X treats the manifest as an active configuration source.

---

## Top-Level Structure

```json
{
  "manifestVersion": "3.0",
  "manifestStatus": "PROPOSED | SIGNED | SUPERSEDED",
  "engagementId": "<uuid>",
  "companyName": "<string>",
  "generatedAt": "<ISO8601>",
  "signedAt": "<ISO8601 | null>",
  "signedBy": {
    "name": "<string>",
    "title": "<string>",
    "email": "<string>"
  },
  "enforcementReady": "<boolean>",
  "enforcementReadyAt": "<ISO8601 | null>",
  "summary": {
    "totalAgents": "<int>",
    "dispositionBreakdown": {
      "KEEP": "<int>",
      "DOWNSIZE": "<int>",
      "REPLACE": "<int>",
      "KILL": "<int>"
    }
  },
  "agents": [ "<AgentEntry[]>" ]
}
```

**Field notes:**
- `manifestStatus`: PROPOSED until the sponsor signs. Transitions to SIGNED on signing.
  Transitions to SUPERSEDED when a new review cycle begins and a new PROPOSED manifest is
  generated. SUPERSEDED manifests are never deleted.
- `enforcementReady`: True only when all of the following hold: disposition permits operation
  (KEEP or DOWNSIZE), all execution classes are VALIDATED, enforcement boundary suitability
  is SUITABLE, sponsor has signed, and any prerequisites are resolved.
- `signedAt` / `signedBy`: Null when PROPOSED. Populated on signing. Immutable after signing.

---

## AgentEntry

One entry per registered AI agent in the engagement.

```json
{
  "agentId": "<uuid>",
  "name": "<string>",
  "registrationStatus": "ACTIVE | SUSPENDED | DECOMMISSIONING | CLOSED",
  "permittedPurpose": "<string>",
  "businessOutcome": "<string>",
  "riskTier": "SIMPLIFIED | FULL",
  "sponsor": { "<Sponsor>" },
  "disposition": { "<Disposition>" },
  "executionClasses": [ "<ExecutionClass[]>" ],
  "enforcementBoundary": { "<EnforcementBoundary | null>" }
}
```

**Field notes:**
- `registrationStatus`: Reflects the agent's current operational status. CLOSED agents have
  no active enforcement.
- `permittedPurpose`: The explicit statement of what this agent is authorized to do. DAL-X
  validates execution requests against this boundary.
- `riskTier`: Assigned during Working Session 1.
  - `SIMPLIFIED`: The workflow meets all five simplified review criteria. Result is "No
    consequential execution identified. Full DGR treatment is not required at this time."
    `executionClasses` will be empty. `enforcementBoundary` will be null.
  - `FULL`: One or more consequential execution classes must be declared. All four
    investigation sections are required. Every known consequential execution class must be
    declared — not only the primary class.

> **Read-only access does not qualify a workflow as SIMPLIFIED.** A read-only agent can
> produce output that causes a human to deny credit, terminate employment, alter treatment,
> or make another consequential decision. The test is consequence, not access mode.

---

## Sponsor

The named individual who signs the Defense File and is accountable for this agent's authority.

```json
{
  "name": "<string>",
  "title": "<string>",
  "email": "<string>"
}
```

**Field notes:**
- The sponsor is a named individual, not a department or role. DAL-X cannot validate
  authority against a title alone.
- Populated from the investigation's `sponsorName`, `sponsorTitle`, `sponsorEmail` fields.

---

## Disposition

The governance finding and its supporting evidence, recorded in Section 4 of the investigation.

```json
{
  "verdict": "KEEP | DOWNSIZE | REPLACE | KILL",
  "reasoning": "<string>",
  "costPerCallUsd": "<decimal | null>",
  "monthlyVolume": "<int | null>",
  "riskNote": "<string | null>",
  "alternativeNote": "<string | null>",
  "analystName": "<string>"
}
```

**Verdict definitions:**

| Verdict | DAL-X Enforcement |
|---------|------------------|
| KEEP | Maintains the approved authority boundary. Valid execution requests receive authorization tokens. Cost, volume, review, and escalation controls remain active. |
| DOWNSIZE | Restricts the agent to the approved reduced scope. Requests outside that scope are blocked or escalated. |
| REPLACE | Revokes execution authority from the current agent. No authorization token is issued. The approved alternative becomes the authorized path once implemented and validated. |
| KILL | Revokes all execution authority. No authorization token is issued. The agent remains blocked until decommissioning is confirmed and its registration is formally closed. |

**Field notes:**
- `reasoning`: The evidence-derived reason for this verdict. Not asserted independently of
  the four investigation sections.
- `analystName`: Required. The named analyst who completed Section 4.

---

## ExecutionClass

One entry per distinct action the workflow performs. Produced by Section 1 of the investigation.
An execution class must be VALIDATED before an authority entry can be assigned to it.

```json
{
  "executionClassId": "<uuid>",
  "action": "<string>",
  "target": "<string>",
  "scope": "<string>",
  "consequenceRationale": "<string>",
  "validationStatus": "VALIDATED | NOT_VALIDATED",
  "validatedBy": "<string | null>",
  "validationEvidence": "<string | null>",
  "validationDate": "<ISO8601 | null>",
  "authority": { "<AuthorityEntry>" }
}
```

**Field notes:**
- `action`: What the agent does — the specific operation (e.g., "generates denial appeal letter").
- `target`: Where the action reaches — the system or data it touches (e.g., "patient billing record").
- `scope`: The boundary of that reach (e.g., "read-only access to current claim; no write authority").
- `consequenceRationale`: What breaks if the agent acts incorrectly at this class.
- `validatedBy`: The named reviewer who confirmed the class declaration. Required before
  `validationStatus` may be set to VALIDATED.

---

## AuthorityEntry

One authority entry per execution class. Produced by Section 2 of the investigation.
Specifies who holds authority over this class and what DAL-X must verify at runtime.

```json
{
  "authorityLevel": "AUTO | REVIEW | ESCALATE | DENY",
  "authorityRole": "<string>",
  "authorityBasis": "<string | null>",
  "currentHolderName": "<string | null>",
  "currentHolderTitle": "<string | null>",
  "evidenceRequirement": "<string>",
  "runtimeSignal": "<string>"
}
```

**Authority level definitions:**

| Level | Meaning | Required fields |
|-------|---------|----------------|
| AUTO | An approved policy authorizes execution without human review | `authorityRole`, `authorityBasis` |
| REVIEW | A named role must review before execution proceeds | `authorityRole`, `currentHolderName`, `currentHolderTitle` |
| ESCALATE | A named authority holder must approve | `authorityRole`, `currentHolderName`, `currentHolderTitle` |
| DENY | Execution is prohibited under all conditions | `authorityRole`, `authorityBasis` |

**Field notes:**
- `authorityBasis`: The specific policy or rule. Required for AUTO (approved policy name) and
  DENY (rule mandating denial). Nullable for REVIEW and ESCALATE.
- `currentHolderName` / `currentHolderTitle`: The person who held this authority when the
  DGR was completed. Required for REVIEW and ESCALATE.
- `evidenceRequirement`: What must exist at execution time before a decision can be made.
  DAL-X verifies this at the call site.
- `runtimeSignal`: How DAL-X identifies this execution class at runtime. Must be unique
  within the agent's scope.

---

## EnforcementBoundary

One boundary entry per agent. Produced by Section 3 of the investigation.
Documents the execution path and whether DAL-X can enforce the approved authority at this boundary.

```json
{
  "executionPath": "<string>",
  "bypassPaths": "<string | null>",
  "requiredBoundary": "<string>",
  "dalxSuitability": "SUITABLE | PREREQUISITES_REQUIRED | NOT_SUITABLE",
  "integrationPoint": "<string>",
  "requiredExecutionInfo": "<string | null>",
  "downstreamValidationPoint": "<string>",
  "blocker": "<string | null>",
  "sponsorDecision": "SUSPEND | ESTABLISH_BOUNDARY | OVERRIDE_ACCEPTED | null",
  "sponsorDecisionNote": "<string | null>",
  "sponsorDecisionAt": "<ISO8601 | null>"
}
```

**Suitability outcomes:**

| Suitability | Meaning |
|-------------|---------|
| SUITABLE | DAL-X can enforce the approved authority at this boundary |
| PREREQUISITES_REQUIRED | Enforcement is possible but blocked by a named prerequisite (see `blocker`) |
| NOT_SUITABLE | DAL-X cannot enforce at this boundary; sponsor decision required |

**Field notes:**
- `executionPath`: The full sequence from agent invocation to downstream effect
  (e.g., "agent → orchestrator → gateway → DAL-X → downstream system").
- `bypassPaths`: Named paths that circumvent DAL-X, if any. Null if none identified.
- `requiredBoundary`: The boundary that must exist for DAL-X enforcement to be valid.
- `integrationPoint`: Where DAL-X sits in the execution path.
- `requiredExecutionInfo`: What execution information DAL-X needs to enforce at this boundary.
- `downstreamValidationPoint`: Where the downstream system confirms execution occurred
  within the approved boundary.
- `blocker`: For PREREQUISITES_REQUIRED or NOT_SUITABLE — names the specific blocker.
- `sponsorDecision`: Required when `dalxSuitability` is NOT_SUITABLE. The investigation
  cannot close without a recorded sponsor decision.

---

## State Transitions

```
PROPOSED → SIGNED      (executive sponsor signs via /sign/[token])
SIGNED   → SUPERSEDED  (new review cycle begins; new PROPOSED manifest created)
```

SUPERSEDED manifests are read-only historical records. They are never deleted.

`enforcementReady` transitions from false to true only after:
1. Disposition is KEEP or DOWNSIZE
2. All execution classes are VALIDATED
3. `dalxSuitability` is SUITABLE
4. Sponsor has signed (manifestStatus is SIGNED)
5. Any prerequisites identified in the enforcement boundary are resolved

---

## What DAL-X Does NOT Do

- DAL-X does not re-validate business evidence on each execution request. It verifies that
  required evidence exists as specified in `evidenceRequirement` at the call site.
- DAL-X does not build or configure alternative mechanism routes. The client's technical
  environment must provide those routes.
- DAL-X does not modify the signed manifest. Changes require a new DGR review cycle,
  a new proposed manifest, and a new sponsor signature.
- DAL-X does not generate its own authority. It enforces the authority the named sponsor
  has signed.
- A signed manifest is not proof that enforcement is active. Engineering must implement
  the approved version and technical validators must accept the enforcement evidence.
