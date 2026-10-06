import { db } from "@/db";
import {
  investigations,
  registeredAgents,
  executionClasses,
  authorityMatrix,
  enforcementBoundary,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type {
  Investigation,
  ExecutionClass,
  AuthorityMatrixRow,
  EnforcementBoundary,
  AuthorityLevel,
  ValidationStatus,
  DalxSuitability,
} from "@/db/schema";

// ── Investigation ─────────────────────────────────────────────────────────────

export async function getOrCreateInvestigation(agentId: string): Promise<Investigation> {
  const existing = await db.query.investigations.findFirst({
    where: eq(investigations.agentId, agentId),
  });
  if (existing) return existing;

  const agent = await db.query.registeredAgents.findFirst({
    where: eq(registeredAgents.id, agentId),
  });
  if (!agent) throw new Error("Agent not found");

  const [created] = await db
    .insert(investigations)
    .values({ agentId, engagementId: agent.engagementId })
    .returning();
  return created;
}

export async function getInvestigation(agentId: string) {
  return db.query.investigations.findFirst({
    where: eq(investigations.agentId, agentId),
    with: {
      executionClasses: {
        with: { authority: true },
        orderBy: (ec, { asc }) => [asc(ec.createdAt)],
      },
      enforcementBoundary: true,
    },
  });
}

export async function getInvestigationById(id: string) {
  return db.query.investigations.findFirst({
    where: eq(investigations.id, id),
    with: {
      executionClasses: {
        with: { authority: true },
        orderBy: (ec, { asc }) => [asc(ec.createdAt)],
      },
      enforcementBoundary: true,
    },
  });
}

type InvestigationPatch = Partial<
  Omit<Investigation, "id" | "agentId" | "engagementId" | "createdAt" | "updatedAt">
>;

export async function patchInvestigation(agentId: string, data: InvestigationPatch) {
  const existing = await getOrCreateInvestigation(agentId);

  const [updated] = await db
    .update(investigations)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(investigations.id, existing.id))
    .returning();

  const allDone =
    updated.section1CompletedAt &&
    updated.section2CompletedAt &&
    updated.section3CompletedAt &&
    updated.section4CompletedAt;

  if (allDone && !updated.completedAt) {
    const [final] = await db
      .update(investigations)
      .set({ completedAt: new Date(), updatedAt: new Date() })
      .where(eq(investigations.id, updated.id))
      .returning();
    return final;
  }

  return updated;
}

// ── Execution Classes ─────────────────────────────────────────────────────────

export async function createExecutionClass(data: {
  investigationId: string;
  agentId: string;
  action: string;
  target: string;
  scope: string;
  consequenceRationale: string;
}): Promise<ExecutionClass> {
  const [created] = await db
    .insert(executionClasses)
    .values(data)
    .returning();
  return created;
}

type ExecutionClassPatch = {
  action?: string;
  target?: string;
  scope?: string;
  consequenceRationale?: string;
  validationStatus?: ValidationStatus;
  validatedBy?: string | null;
  validationEvidence?: string | null;
  validationDate?: Date | null;
};

export async function patchExecutionClass(id: string, data: ExecutionClassPatch) {
  const [updated] = await db
    .update(executionClasses)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(executionClasses.id, id))
    .returning();
  return updated;
}

export async function deleteExecutionClass(id: string) {
  await db.delete(executionClasses).where(eq(executionClasses.id, id));
}

export async function getExecutionClassesForInvestigation(investigationId: string) {
  return db.query.executionClasses.findMany({
    where: eq(executionClasses.investigationId, investigationId),
    with: { authority: true },
    orderBy: (ec, { asc }) => [asc(ec.createdAt)],
  });
}

// ── Authority Matrix ──────────────────────────────────────────────────────────

export async function upsertAuthority(data: {
  executionClassId: string;
  investigationId: string;
  authorityLevel: AuthorityLevel;
  authorityRole: string;
  authorityBasis?: string | null;
  currentHolderName?: string | null;
  currentHolderTitle?: string | null;
  evidenceRequirement: string;
  runtimeSignal: string;
}): Promise<AuthorityMatrixRow> {
  const existing = await db.query.authorityMatrix.findFirst({
    where: eq(authorityMatrix.executionClassId, data.executionClassId),
  });

  if (existing) {
    const [updated] = await db
      .update(authorityMatrix)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(authorityMatrix.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db.insert(authorityMatrix).values(data).returning();
  return created;
}

// ── Enforcement Boundary ──────────────────────────────────────────────────────

type EnforcementBoundaryData = {
  agentId: string;
  executionPath: string;
  bypassPaths?: string | null;
  requiredBoundary: string;
  dalxSuitability: DalxSuitability;
  integrationPoint: string;
  requiredExecutionInfo?: string | null;
  downstreamValidationPoint: string;
  blocker?: string | null;
};

export async function upsertEnforcementBoundary(
  investigationId: string,
  data: EnforcementBoundaryData,
): Promise<EnforcementBoundary> {
  const existing = await db.query.enforcementBoundary.findFirst({
    where: eq(enforcementBoundary.investigationId, investigationId),
  });

  if (existing) {
    const [updated] = await db
      .update(enforcementBoundary)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(enforcementBoundary.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(enforcementBoundary)
    .values({ investigationId, ...data })
    .returning();
  return created;
}

export async function recordSponsorBoundaryDecision(
  investigationId: string,
  decision: {
    sponsorDecision: "SUSPEND" | "ESTABLISH_BOUNDARY" | "OVERRIDE_ACCEPTED";
    sponsorDecisionNote?: string | null;
  },
) {
  const [updated] = await db
    .update(enforcementBoundary)
    .set({
      sponsorDecision: decision.sponsorDecision,
      sponsorDecisionNote: decision.sponsorDecisionNote ?? null,
      sponsorDecisionAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(enforcementBoundary.investigationId, investigationId))
    .returning();
  return updated;
}

// ── Enforcement Readiness Check ───────────────────────────────────────────────

export type EnforcementReadinessResult = {
  ready: boolean;
  blockers: string[];
};

export async function checkEnforcementReadiness(
  agentId: string,
  manifestSigned: boolean,
): Promise<EnforcementReadinessResult> {
  const inv = await getInvestigation(agentId);
  const blockers: string[] = [];

  if (!inv) {
    return { ready: false, blockers: ["No investigation found"] };
  }

  if (!inv.disposition || inv.disposition === "KILL" || inv.disposition === "REPLACE") {
    blockers.push(`Disposition is ${inv.disposition ?? "not set"} — does not permit continued operation`);
  }

  const classes = inv.executionClasses ?? [];
  for (const ec of classes) {
    if (ec.validationStatus === "NOT_VALIDATED") {
      blockers.push(`Execution class "${ec.action} on ${ec.target}" is not validated`);
    }
  }

  const boundary = inv.enforcementBoundary;
  if (!boundary) {
    blockers.push("Enforcement boundary analysis not completed");
  } else if (boundary.dalxSuitability === "NOT_SUITABLE") {
    // Sponsor acceptance of unenforceable operation is a governance record, not an enforcement
    // boundary. NOT_SUITABLE agents are never enforcement-ready regardless of sponsor decision.
    if (boundary.sponsorDecision === "OVERRIDE_ACCEPTED") {
      blockers.push("Operating risk accepted — enforcement boundary not established");
    } else if (boundary.sponsorDecision === "SUSPEND") {
      blockers.push("Execution suspended — enforcement boundary not established");
    } else if (boundary.sponsorDecision === "ESTABLISH_BOUNDARY") {
      blockers.push("Enforcement boundary pending establishment — not yet verified");
    } else {
      blockers.push("No suitable enforcement boundary — sponsor decision required");
    }
  } else if (boundary.dalxSuitability === "PREREQUISITES_REQUIRED") {
    blockers.push(`Prerequisites required: ${boundary.blocker ?? "unspecified"}`);
  }

  if (!manifestSigned) {
    blockers.push("Sponsor signature required");
  }

  return { ready: blockers.length === 0, blockers };
}

// ── Section Completion Helpers ────────────────────────────────────────────────

export async function markSectionComplete(agentId: string, section: 1 | 2 | 3 | 4) {
  const field = {
    1: "section1CompletedAt",
    2: "section2CompletedAt",
    3: "section3CompletedAt",
    4: "section4CompletedAt",
  }[section] as keyof InvestigationPatch;

  return patchInvestigation(agentId, { [field]: new Date() } as InvestigationPatch);
}

export async function getInvestigationByAgentId(agentId: string) {
  return db.query.investigations.findFirst({
    where: eq(investigations.agentId, agentId),
  });
}

export async function getOrCreateInvestigationFull(agentId: string) {
  await getOrCreateInvestigation(agentId);
  return getInvestigation(agentId);
}

// ── Bulk Query for Engagement ─────────────────────────────────────────────────

export async function getInvestigationsForEngagement(engagementId: string) {
  return db.query.investigations.findMany({
    where: eq(investigations.engagementId, engagementId),
    with: {
      executionClasses: {
        with: { authority: true },
        orderBy: (ec, { asc }) => [asc(ec.createdAt)],
      },
      enforcementBoundary: true,
    },
  });
}
