# Hero Page Prompt — Decision Governance Review
## For use with Lovable.dev

This document contains the source of truth for the Decision Governance Review product page at jochannilabs.com/decision-governance-review.html. Use it to update the hero page so it accurately reflects the current four-section investigation model.

---

## What the Product Is

The Decision Governance Review (DGR) is a four-week structured engagement that produces one evidence-supported governance decision per AI-assisted workflow: Keep, Downsize, Replace, or Kill. Each decision comes with signed authority requirements for continued operation.

It is not an AI maturity score. It is not a strategy roadmap. It is a controlled decision process with a named sponsor, a structured investigation, and a signed record.

**Core rule:** No validated authority, no execution.

---

## Section 02 — The Correct Content (replaces "Six Review Questions")

The page currently shows six questions in section 02. This is outdated. The current investigation model has four sections that must be completed in order. Replace section 02 with the following.

**Section label:** Four-Section Assessment

**Headline:** Declared Before Decided.

**Lead paragraph:** Each section must be completed before the next begins. The disposition cannot be confirmed until execution classes are declared, authority is assigned, and the enforcement boundary is mapped.

**The four sections:**

1. **Execution Class Declaration** — Name every action the workflow performs, its target, scope, and the consequence if it acts incorrectly. Each class is validated by a named reviewer before authority can be assigned.

2. **Authority Matrix** — One authority entry per execution class: AUTO, REVIEW, ESCALATE, or DENY. Specifies the holder, the policy basis, the evidence required at runtime, and the DAL-X signal.

3. **Enforcement Boundary** — Map the execution path and assess DAL-X suitability. Three outcomes: Suitable, Prerequisites Required, or Not Suitable. Each requires a sponsor decision before the investigation closes.

4. **Business Value and Disposition** — Cost, volume, risk, and available alternatives. The evidence here determines the governance finding: Keep, Downsize, Replace, or Kill.

**Footnote:** The same four sections structure every investigation. A section with unresolved items remains open. It is never carried forward as complete.

---

## The Four Verdicts (unchanged — verify these are still accurate on the page)

| Verdict | Short description |
|---------|------------------|
| KEEP | Maps to a real requirement; no simpler mechanism available; retain within approved limits |
| DOWNSIZE | Real requirement, but scope or discretion exceeds what is needed; restrict to approved reduced scope |
| REPLACE | Wrong mechanism; revoke authority and validate approved alternative before production responsibility transfers |
| KILL | Duplicative, unsupported, or no longer tied to an authorized requirement; revoke and decommission |

---

## The Four Deliverables (unchanged — verify these are still accurate on the page)

1. **Decision Registry** — one row per workflow: decision, reason, owner, status, change condition, tracking reference, next action
2. **Defense File** — one per workflow: evidence, four-section findings, verdict, sponsor decision, approval date
3. **Governance Manifest** — for continuing workflows: signed authority specification covering scope, limits, triggers, evidence, escalation, decision rules, version
4. **Implementation Handoff** — for Replace and Kill: revocation and closure instructions, owners, tracking references, verification responsibility

---

## The Four-Week Timeline (unchanged — verify these are still accurate on the page)

| Week | Phase | Activity |
|------|-------|----------|
| 1 | Register and Baseline | Register up to ten workflows. Confirm owners, requirements, mechanisms, costs, downstream systems, authority paths, and available evidence. |
| 2 | Investigate | Apply Sections 1–3. Declare execution classes, assign authority, map the enforcement boundary. |
| 3 | Validate | Resolve defects with client specialists, apply Section 4, prepare the decision package and proposed Governance Manifest. |
| 4 | Sign and Hand Off | Present each decision to the executive sponsor, record acceptance or override, finalize ownership, distribution, implementation conditions, and DAL-X handoff. |

---

## Authority Levels (new — may be referenced in updated copy)

The authority matrix assigns one of four levels to each execution class:

| Level | Meaning |
|-------|---------|
| AUTO | An approved policy authorizes execution without human review |
| REVIEW | A named role must review before execution proceeds |
| ESCALATE | A named authority holder must approve |
| DENY | Execution is prohibited under all conditions |

---

## DAL-X Connection (verify section 06 on the page is still accurate)

The DGR produces the signed Governance Manifest. Engineering converts it into runtime enforcement via DAL-X. The manifest is the configuration source — not proof that enforcement is active.

DGR defines: allow, block, escalate, revoke, or close.
DAL-X evaluates approved conditions at runtime.
Engineering proves the execution path.

`enforcementReady` is true only when all of the following hold:
- Disposition is KEEP or DOWNSIZE
- All execution classes are VALIDATED
- Enforcement boundary suitability is SUITABLE
- Sponsor has signed
- Any prerequisites are resolved

---

## Terminology to Use Consistently

| Use this | Not this |
|----------|----------|
| Execution class | Task, capability, or action type |
| Authority matrix | Approval chain or permission set |
| Enforcement boundary | Integration point or DAL-X connection |
| Disposition | Outcome, recommendation, or rating |
| Named executive sponsor | Stakeholder or approver |
| Governance Manifest | Policy document or configuration file |
| Defense File | Report or assessment |
