# Hero Page Prompt — Decision Governance Review
## For use with Lovable.dev

This document is the source of truth for updating the Decision Governance Review product page at jochannilabs.com/decision-governance-review.html. Apply changes to the sections noted below. Sections not mentioned here should remain unchanged pending review.

---

## What the Product Is

The Decision Governance Review (DGR) is a structured governance engagement that produces one evidence-supported governance decision per AI-assisted workflow: Keep, Downsize, Replace, or Kill. Each decision comes with signed authority requirements for continued operation.

It runs as three working sessions completed within ten business days after required evidence is received. The timeline depends on enterprise preparation — named sponsor, workflow owners, subject-matter validators, and supporting evidence must be in hand before the clock starts.

It is not an AI maturity score. It is not a strategy roadmap. It is a controlled decision process with a named sponsor, a structured investigation, and a signed record.

**Core rule:** No validated authority, no execution.

---

## Section 02 — Replace "Six Review Questions" with "Three Working Sessions"

This section is currently titled "Six Review Questions" and lists six investigation questions. Replace the entire section with the following.

**Section label:** Three Working Sessions

**Headline:** Declared Before Decided.

**Lead paragraph:** Three working sessions completed within ten business days after required evidence is received. The disposition cannot be confirmed until execution classes are declared, authority is assigned, and the enforcement boundary is mapped.

**The three sessions:**

1. **Register and Classify** — Build the workflow registry. Name owners, record approximate cost, assign initial risk tier, log preliminary disposition, and surface missing evidence. The FDO may identify preliminary KILL candidates. The executive sponsor owns the final decision.

2. **Investigate** — For each Full Review workflow: confirm every consequential execution class, mark each VALIDATED or NOT VALIDATED, assign AUTO / REVIEW / ESCALATE / DENY, identify the enforcement boundary, assess DAL-X suitability, and record blockers. Missing evidence stays open with a named owner. It is never converted into a favorable assumption.

3. **Decide and Sign** — The executive sponsor reviews the disposition, authority matrix, enforcement boundary, and required next action. The Governance Manifest is signed. A signed manifest with unresolved blockers is signed evidence of the decision — not permission to begin enforcement.

**Footnote:** The same structure applies to every engagement. A session with unresolved items remains open. It is never carried forward as complete.

---

## Section 02 — Risk Tier Note (add below the three session items)

Add a short callout block after the three session descriptions:

**Label:** Risk-Based Treatment

**Body:** Not every workflow requires the same depth of investigation. A workflow that cannot change records, trigger decisions, expose sensitive data, or create consequential outcomes — and that requires meaningful human review before its output is used — may qualify for a simplified review. Read-only access alone does not qualify. A read-only workflow that produces output a human uses to deny credit, alter treatment, or terminate employment is consequential. The test is consequence, not access mode.

---

## Section 05 — Update "Four-Week Process" to Match Three Sessions

The timeline section currently describes four weeks. Replace with the following structure:

**Section label:** Three Working Sessions

**Headline:** Ten Business Days. One Controlled Decision Path.

**Lead:** The schedule begins when the named sponsor, workflow owners, validators, and required evidence are confirmed. Jochanni Labs cannot compress the timeline until the enterprise side is ready.

| Session | Name | What happens |
|---------|------|-------------|
| Session 1 | Register and Classify | Register all in-scope workflows. Confirm owners, requirements, costs, risk tiers, preliminary dispositions, and missing evidence. |
| Session 2 | Investigate | Apply Sections 1–3. Declare execution classes, assign authority levels, map enforcement boundaries, record blockers. |
| Session 3 | Decide and Sign | Present each disposition to the executive sponsor. Record acceptance or override. Sign the Governance Manifest. Finalize ownership, distribution, and DAL-X handoff. |

**Footnote below table:** The ten business day window is a completion commitment, not a scheduling guarantee. It begins on evidence receipt, not on engagement start.

---

## Section 03 — Four Verdicts (verify, do not change copy)

The four verdict descriptions should remain as currently written. Verify that the page shows:

- V.01 KEEP — maps to a real requirement, no simpler mechanism, retain within approved limits
- V.02 DOWNSIZE — real requirement, wrong scope or discretion, restrict to approved reduced scope
- V.03 REPLACE — wrong mechanism, revoke and validate approved alternative before transfer
- V.04 KILL — duplicative, unsupported, or no longer tied to an authorized requirement

Add one sentence below the four verdicts if not already present:

> An override changes the client decision. It does not rewrite the original Jochanni Labs finding. Both remain separate, dated facts.

---

## Section 06 — DAL-X (verify, update one paragraph)

The section correctly states that a signed decision is not runtime enforcement. Add or confirm the following sentence in this section:

> A signed manifest with unresolved blockers is signed evidence of the decision. It is not permission to begin enforcement. enforcementReady is true only when all execution classes are validated, the enforcement boundary is suitable, and the sponsor has signed with no open prerequisites.

---

## Section 04 — Deliverables (verify, update one label)

Change "Decision Registry Portfolio Record" to "Workflow Registry" for consistency with current terminology. All other deliverable descriptions remain correct.

---

## Terminology to Use Consistently

| Use | Not |
|-----|-----|
| Three working sessions | Three days / three-day sprint |
| Ten business days after evidence is received | Four weeks / four-week engagement |
| Working Session 1, 2, 3 | Week 1, 2, 3, 4 |
| Execution class | Task, capability, action type |
| Authority matrix | Approval chain, permission set |
| Enforcement boundary | Integration point, DAL-X connection |
| Disposition | Outcome, recommendation, rating |
| Named executive sponsor | Stakeholder, approver |
| Governance Manifest | Policy document, configuration file |
| Defense File | Report, assessment |
| FDO (Formal Decision Officer) | Analyst, consultant, reviewer |
| Preliminary disposition | Initial assessment, early finding |
| Simplified review | Low-risk track, fast track |
| Full review | Standard track, full assessment |

---

## What Not to Claim

- Do not claim that regulators endorse this specific DGR method.
- The EU AI Act uses a risk-based framework — this is cited as precedent for the risk tier approach, not as regulatory endorsement of DGR.
- The FDO does not make final governance decisions. The executive sponsor does. Legal and compliance specialists confirm regulatory conclusions.
- DAL-X enforcement is not active until `enforcementReady` is true AND engineering has implemented and proved the execution path.
