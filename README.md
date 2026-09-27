# DAL-X Decision Governance Review

The Decision Governance Review (DGR) is a structured governance engagement that produces one evidence-supported decision per AI-assisted workflow — Keep, Downsize, Replace, or Kill — plus the signed authority requirements governing any continued execution.

The engagement runs as three working sessions completed within ten business days after required evidence is received. The timeline depends on enterprise cooperation. Jochanni Labs cannot compress the schedule until the named sponsor, workflow owners, subject-matter validators, and supporting evidence are in hand.

**Core rule:** No validated authority, no execution.

---

## The Three Working Sessions

### Working Session 1 — Register and Classify

Every in-scope workflow is registered and classified. The session produces:

1. Workflow registry
2. Named owners
3. Approximate cost
4. Initial risk tier (Simplified or Full)
5. Preliminary disposition
6. Missing evidence log with named owners for each open item

The FDO may identify a preliminary KILL candidate during registration. The FDO does not kill a workflow or declare it noncompliant from a registration session. The executive sponsor owns the decision. Legal or compliance specialists confirm any regulatory conclusions.

### Working Session 2 — Investigate

Workflows that received Full review treatment in Session 1 are investigated. Missing evidence identified in Session 1 may be validated during Session 2 when the correct specialist attends. Evidence that remains missing stays open with a named owner — it is not converted into a favorable assumption.

Session 2 actions:

1. Confirm every known consequential execution class
2. Mark each class VALIDATED or NOT_VALIDATED
3. Assign AUTO, REVIEW, ESCALATE, or DENY to each class
4. Identify the enforcement boundary
5. Assess DAL-X suitability
6. Record blockers with named owners

Every known consequential execution class must be declared. Recording only the primary class and leaving secondary execution outside the authority matrix is not acceptable. A dangerous secondary action does not become safe because it was not listed.

### Working Session 3 — Decide and Sign

The executive sponsor reviews the disposition, authority matrix, enforcement boundary, and required next action for each workflow. The Governance Manifest is signed as the approved governance record.

A signed manifest becomes a DAL-X configuration source only when `enforcementReady` is true. A signed manifest with unresolved blockers is signed evidence of the decision — it is not permission to begin enforcement.

---

## Risk Tiers

Risk-based treatment is required. The EU AI Act uses a risk-based framework as precedent, though Jochanni Labs makes no claim that regulators endorse this specific method.

### Simplified Review

Apply when the workflow meets **all five** of the following conditions:

1. Cannot change a record or system state
2. Cannot independently trigger a business decision
3. Cannot expose sensitive data
4. Cannot create a financial, legal, operational, customer, or employee consequence
5. Requires meaningful human review before its output is used

If all five conditions are met, the result is: **No consequential execution identified. Full DGR treatment is not required at this time.**

> **Read-only access does not qualify a workflow as simplified.** A read-only agent can produce output that causes a human to deny credit, terminate employment, alter treatment, or make another consequential decision. The test is consequence, not access mode.

### Full Review

Apply when the workflow can affect records, money, access, data, customers, employees, regulated decisions, or downstream systems. One or more consequential execution classes must be declared.

All four investigation sections are required: Execution Class Declaration, Authority Matrix, Enforcement Boundary, and Business Value and Disposition.

---

## The Four Investigation Sections

All four sections apply to Full Review workflows and must be completed in order.

### Section 1 — Execution Class Declaration

Every action the workflow performs is named: what it does (`action`), where it reaches (`target`), the scope of that reach (`scope`), and what breaks if it acts incorrectly (`consequenceRationale`). Each class is validated by a named reviewer. A class with `validationStatus: NOT_VALIDATED` blocks Section 2 for that class.

### Section 2 — Authority Matrix

One authority entry per execution class.

| Level | Meaning |
|-------|---------|
| AUTO | An approved policy authorizes execution without human review |
| REVIEW | A named role must review before execution proceeds |
| ESCALATE | A named authority holder must approve |
| DENY | Execution is prohibited under all conditions |

Each entry specifies the authority role, policy basis, named current holder, evidence required at runtime, and DAL-X runtime signal.

### Section 3 — Enforcement Boundary

The execution path from agent to downstream system is mapped and DAL-X suitability is assessed.

| Suitability | Meaning |
|-------------|---------|
| SUITABLE | DAL-X can enforce the approved authority at this boundary |
| PREREQUISITES_REQUIRED | Enforcement is possible but blocked by a named prerequisite |
| NOT_SUITABLE | DAL-X cannot enforce at this boundary; sponsor decision required |

For NOT_SUITABLE, the sponsor records one of: SUSPEND, ESTABLISH_BOUNDARY, or OVERRIDE_ACCEPTED. The investigation cannot close without a recorded decision.

### Section 4 — Business Value and Disposition

Cost, volume, risk, and available alternatives are recorded. The evidence across all four sections determines the governance finding.

| Verdict | Meaning |
|---------|---------|
| KEEP | Maps to a real requirement; no simpler mechanism available; retain within approved limits |
| DOWNSIZE | Real requirement, but scope or discretion exceeds what is needed; restrict to approved reduced scope |
| REPLACE | Wrong mechanism; revoke authority and validate approved alternative before production responsibility transfers |
| KILL | Duplicative, unsupported, or no longer tied to an authorized requirement; revoke and decommission |

---

## Deliverables

| Deliverable | Purpose |
|-------------|---------|
| Workflow Registry | One row per workflow: decision, reason, owner, status, change condition, tracking reference, next action |
| Defense File | One per workflow: evidence, four-section findings, verdict, sponsor decision, approval date |
| Governance Manifest | For Keep and Downsize: signed authority specification covering scope, limits, triggers, evidence, escalation, decision rules, and version |
| Implementation Handoff | For Replace and Kill: revocation and closure instructions, owners, tracking references, verification responsibility |

### Manifest Lifecycle

```
PROPOSED → SIGNED → SUPERSEDED
```

A PROPOSED manifest is not a signed policy. A SIGNED manifest is not yet an enforced policy. `enforcementReady` is true only when:

1. Disposition is KEEP or DOWNSIZE
2. All execution classes are VALIDATED
3. Enforcement boundary suitability is SUITABLE
4. Sponsor has signed
5. Any prerequisites identified in the enforcement boundary are resolved

---

## Database Schema

### Enums

| Enum | Values |
|------|--------|
| `engagement_stage` | CENSUS, INVESTIGATION, REGISTRY, DEFENSE_FILES, CLOSED |
| `posture` | KEEP, DOWNSIZE, REPLACE, KILL |
| `evidence_type` | NONE, ANECDOTAL, DOCUMENTED |
| `defense_file_status` | DRAFT, SENT, SIGNED, OVERRIDDEN |
| `registration_status` | ACTIVE, SUSPENDED, DECOMMISSIONING, CLOSED |
| `manifest_status` | PROPOSED, SIGNED, SUPERSEDED |
| `authority_level` | AUTO, REVIEW, ESCALATE, DENY |
| `validation_status` | VALIDATED, NOT_VALIDATED |
| `dalx_suitability` | SUITABLE, PREREQUISITES_REQUIRED, NOT_SUITABLE |

### Tables

| Table | Purpose |
|-------|---------|
| `engagements` | One row per client engagement; tracks stage and completion timestamps |
| `registered_agents` | One row per AI workflow; includes risk tier, preliminary disposition |
| `investigations` | One row per agent; tracks sponsor info, section completion, final disposition |
| `execution_classes` | One row per declared execution class (Section 1) |
| `authority_matrix` | One row per execution class; authority level and runtime requirements (Section 2) |
| `enforcement_boundary` | One row per investigation; DAL-X suitability and path (Section 3) |
| `defense_files` | One row per agent; signature lifecycle and sponsor override |
| `governance_manifests` | One row per manifest version; enforcement readiness and sponsor signature |
| `checkpoint_responses` | Post-engagement checkpoint records |

---

## Application Routes

| Route | Purpose |
|-------|---------|
| `/` | Dashboard — active engagements |
| `/inquiry` | New engagement intake form |
| `/engagements/[id]` | Engagement detail and stage management |
| `/engagements/[id]/agents/[agentId]/investigate` | Four-section investigation UI |
| `/engagements/[id]/manifest` | Governance Manifest generation and review |
| `/sign/[token]` | Sponsor signature capture (public, token-gated) |

---

## Setup

```bash
npm install
cp .env.local.example .env.local
npx drizzle-kit push
npm run dev
```

| Variable | Source |
|----------|--------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk dashboard |
| `CLERK_SECRET_KEY` | Clerk dashboard |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob |

---

## DAL-X Handoff

The signed Governance Manifest is the configuration source for DAL-X, not proof that enforcement is active. Engineering must:

1. Load the signed manifest into DAL-X
2. Bind each execution class to the exact agent, target, action, and parameters
3. Prove direct calls fail without a valid authority token
4. Verify downstream readback confirms the enforcement path

Runtime enforcement is active only after engineering implements the approved version and technical validators accept the enforcement evidence.
