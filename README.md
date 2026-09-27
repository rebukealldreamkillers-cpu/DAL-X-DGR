# DAL-X Decision Governance Review

The Decision Governance Review (DGR) is a four-week, structured investigation of up to ten existing AI-assisted workflows. It produces one evidence-supported governance decision per workflow — Keep, Downsize, Replace, or Kill — plus the signed authority requirements governing any continued execution.

This repository is the DGR web application. It manages engagements, runs the four-section investigation per agent, generates Governance Manifests, and collects sponsor signatures. Signed manifests are the configuration source for DAL-X runtime enforcement.

---

## Product Summary

**What it does.** Each registered AI workflow (called an agent) moves through a four-section investigation. The investigation cannot be skipped or reordered. The final disposition in Section 4 cannot be confirmed until Sections 1–3 are complete.

**What it produces.** One Defense File per agent (evidence, authority structure, enforcement boundary, and verdict), a Governance Manifest covering all continuing workflows, and a sponsor signature that makes the manifest enforceable.

**Who uses it.** Jochanni Labs analysts run the investigation. Client subject-matter experts validate evidence in each section. The named executive sponsor signs the final manifest.

**Core rule.** No validated authority, no execution.

---

## The Four-Section Investigation

Every agent in the engagement moves through the same four sections in order.

### Section 1 — Execution Class Declaration

The analyst names every distinct action the workflow performs: what it does (`action`), where it reaches (`target`), the scope of that reach (`scope`), and what breaks if it acts incorrectly (`consequenceRationale`). Each execution class is validated by a named reviewer. A class with `validationStatus: NOT_VALIDATED` blocks Section 2 for that class.

### Section 2 — Authority Matrix

One authority entry per execution class. The entry assigns one of four authority levels:

| Level | Meaning |
|-------|---------|
| `AUTO` | An approved policy authorizes execution without human review |
| `REVIEW` | A named role must review before execution proceeds |
| `ESCALATE` | A named authority holder must be notified and must approve |
| `DENY` | Execution is prohibited under all conditions |

Each entry also specifies the authority role, the policy basis (required for AUTO and DENY), the named current holder (required for REVIEW and ESCALATE), the evidence that must exist at runtime before a decision can be made, and the DAL-X runtime signal that identifies this class.

### Section 3 — Enforcement Boundary

The analyst maps the execution path from agent to downstream system, identifies any bypass paths, and assesses whether DAL-X can enforce the boundary. Three outcomes:

| Suitability | Meaning |
|-------------|---------|
| `SUITABLE` | DAL-X can enforce the approved authority at this boundary |
| `PREREQUISITES_REQUIRED` | Enforcement is possible but blocked by a named prerequisite |
| `NOT_SUITABLE` | DAL-X cannot enforce at this boundary; sponsor decision required |

For NOT_SUITABLE, the sponsor must record one of: `SUSPEND`, `ESTABLISH_BOUNDARY`, or `OVERRIDE_ACCEPTED`. The investigation cannot close without a recorded decision.

### Section 4 — Business Value and Disposition

The analyst records cost per call, monthly volume, risk notes, and any identified lower-cost alternative. The evidence across all four sections determines the governance finding:

| Verdict | Meaning |
|---------|---------|
| `KEEP` | Maps to a real requirement; no simpler mechanism available; retain within approved limits |
| `DOWNSIZE` | Real requirement, but scope or discretion exceeds what is needed; restrict to approved reduced scope |
| `REPLACE` | Wrong mechanism; revoke authority and validate approved alternative before production responsibility transfers |
| `KILL` | Duplicative, unsupported, or no longer tied to an authorized requirement; revoke and decommission |

The disposition and its reasoning are recorded here. The analyst name is required before the section can be marked complete.

---

## Deliverables

Every agent that completes all four sections produces:

- **Defense File** — evidence, authority structure, enforcement boundary, finding, sponsor decision, and approval date
- **Governance Manifest** — for Keep and Downsize agents: signed authority specification covering scope, limits, triggers, evidence, escalation, decision rules, and version
- **Implementation Handoff** — for Replace and Kill agents: revocation and closure instructions

A Governance Manifest transitions through three states:

```
PROPOSED → SIGNED → SUPERSEDED
```

A PROPOSED manifest is not a signed policy. A SIGNED manifest is not yet an enforced policy. Enforcement begins only when DAL-X loads a manifest the named sponsor has signed. These states must never be conflated.

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
| `registered_agents` | One row per AI workflow registered in the engagement |
| `investigations` | One row per agent; tracks sponsor info, section completion, and final disposition |
| `execution_classes` | One row per declared execution class (Section 1) |
| `authority_matrix` | One row per execution class; authority level and runtime requirements (Section 2) |
| `enforcement_boundary` | One row per investigation; DAL-X suitability and enforcement path (Section 3) |
| `defense_files` | One row per agent; tracks signature lifecycle and any sponsor override |
| `governance_manifests` | One row per manifest version; tracks enforcement readiness and sponsor signature |
| `checkpoint_responses` | Post-engagement checkpoint records |

---

## Application Routes

The application is a Next.js App Router project with Clerk authentication.

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
cp .env.local.example .env.local  # set DATABASE_URL and Clerk keys
npx drizzle-kit push
npm run dev
```

Environment variables required:

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
