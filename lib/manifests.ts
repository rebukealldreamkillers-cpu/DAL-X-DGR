import { db } from "@/db";
import { engagements, registeredAgents, governanceManifests } from "@/db/schema";
import { eq, isNull, desc, and } from "drizzle-orm";
import { checkEnforcementReadiness } from "@/lib/investigations";

// ── Manifest JSON Types (v3.0) ────────────────────────────────────────────────

export type ManifestAuthorityEntry = {
  level: string;
  role: string;
  basis: string | null;
  holderName: string | null;
  holderTitle: string | null;
  evidenceRequirement: string;
  runtimeSignal: string;
};

export type ManifestExecutionClass = {
  id: string;
  action: string;
  target: string;
  scope: string;
  consequenceRationale: string;
  validationStatus: string;
  validatedBy: string | null;
  validationEvidence: string | null;
  validationDate: string | null;
  authority: ManifestAuthorityEntry | null;
};

export type ManifestEnforcementBoundary = {
  executionPath: string;
  bypassPaths: string | null;
  requiredBoundary: string;
  dalxSuitability: string;
  integrationPoint: string;
  requiredExecutionInfo: string | null;
  downstreamValidationPoint: string;
  blocker: string | null;
  sponsorDecision: string | null;
};

export type ManifestAgentEntry = {
  agentId: string;
  investigationId: string | null;
  name: string;
  registrationStatus: string;
  permittedPurpose: string;
  businessOutcome: string;
  // Section 4
  disposition: string | null;
  dispositionReasoning: string | null;
  costPerCallUsd: number | null;
  monthlyVolume: number | null;
  riskNote: string | null;
  alternativeNote: string | null;
  // Section 2
  defaultExecutionRule: "DENY";
  executionClasses: ManifestExecutionClass[];
  // Section 3
  enforcementBoundary: ManifestEnforcementBoundary | null;
  // Readiness
  enforcementReady: boolean;
  enforcementReadyBlockers: string[];
  investigationCompletedAt: string | null;
};

export type ManifestJson = {
  manifestVersion: "3.0";
  manifestStatus: "PROPOSED" | "SIGNED" | "SUPERSEDED";
  engagementId: string;
  companyName: string;
  generatedAt: string;
  signedAt: string | null;
  signedBy: { name: string; title: string; email: string } | null;
  enforcementReady: boolean;
  summary: {
    totalAgents: number;
    dispositionBreakdown: Record<string, number>;
    enforcementReadyCount: number;
  };
  agents: ManifestAgentEntry[];
};

// ── Manifest Generation ───────────────────────────────────────────────────────

export async function generateManifest(engagementId: string) {
  const engagement = await db.query.engagements.findFirst({
    where: eq(engagements.id, engagementId),
    with: {
      registeredAgents: {
        where: isNull(registeredAgents.deletedAt),
        orderBy: [registeredAgents.sortOrder],
        with: {
          investigation: {
            with: {
              executionClasses: {
                with: { authority: true },
                orderBy: (fields, { asc }) => [asc(fields.createdAt)],
              },
              enforcementBoundary: true,
            },
          },
        },
      },
      governanceManifests: {
        orderBy: [desc(governanceManifests.version)],
      },
    },
  });

  if (!engagement) throw new Error("Engagement not found");

  const currentSigned = engagement.governanceManifests.find(
    (m) => m.manifestStatus === "SIGNED",
  );
  if (currentSigned) {
    await db
      .update(governanceManifests)
      .set({ manifestStatus: "SUPERSEDED" })
      .where(eq(governanceManifests.id, currentSigned.id));
  }

  const dispositionBreakdown: Record<string, number> = {
    KEEP: 0,
    DOWNSIZE: 0,
    REPLACE: 0,
    KILL: 0,
  };
  let enforcementReadyCount = 0;

  const agentEntries: ManifestAgentEntry[] = await Promise.all(
    engagement.registeredAgents.map(async (agent) => {
      const inv = agent.investigation;

      if (inv?.disposition) {
        dispositionBreakdown[inv.disposition] =
          (dispositionBreakdown[inv.disposition] ?? 0) + 1;
      }

      const classes: ManifestExecutionClass[] = (inv?.executionClasses ?? []).map((ec) => ({
        id: ec.id,
        action: ec.action,
        target: ec.target,
        scope: ec.scope,
        consequenceRationale: ec.consequenceRationale,
        validationStatus: ec.validationStatus,
        validatedBy: ec.validatedBy ?? null,
        validationEvidence: ec.validationEvidence ?? null,
        validationDate: ec.validationDate?.toISOString() ?? null,
        authority: ec.authority
          ? {
              level: ec.authority.authorityLevel,
              role: ec.authority.authorityRole,
              basis: ec.authority.authorityBasis ?? null,
              holderName: ec.authority.currentHolderName ?? null,
              holderTitle: ec.authority.currentHolderTitle ?? null,
              evidenceRequirement: ec.authority.evidenceRequirement,
              runtimeSignal: ec.authority.runtimeSignal,
            }
          : null,
      }));

      const boundary = inv?.enforcementBoundary;

      // Enforcement readiness: signed = false at generation time
      const { ready, blockers } = await checkEnforcementReadiness(agent.id, false);
      if (ready) enforcementReadyCount++;

      return {
        agentId: agent.id,
        investigationId: inv?.id ?? null,
        name: agent.name,
        registrationStatus: agent.registrationStatus,
        permittedPurpose: agent.permittedPurpose,
        businessOutcome: agent.businessOutcome,
        disposition: inv?.disposition ?? null,
        dispositionReasoning: inv?.dispositionReasoning ?? null,
        costPerCallUsd: inv?.costPerCallUsd ? parseFloat(inv.costPerCallUsd) : null,
        monthlyVolume: inv?.monthlyVolume ?? null,
        riskNote: inv?.riskNote ?? null,
        alternativeNote: inv?.alternativeNote ?? null,
        defaultExecutionRule: "DENY" as const,
        executionClasses: classes,
        enforcementBoundary: boundary
          ? {
              executionPath: boundary.executionPath,
              bypassPaths: boundary.bypassPaths ?? null,
              requiredBoundary: boundary.requiredBoundary,
              dalxSuitability: boundary.dalxSuitability,
              integrationPoint: boundary.integrationPoint,
              requiredExecutionInfo: boundary.requiredExecutionInfo ?? null,
              downstreamValidationPoint: boundary.downstreamValidationPoint,
              blocker: boundary.blocker ?? null,
              sponsorDecision: boundary.sponsorDecision ?? null,
            }
          : null,
        enforcementReady: false, // Updated to true on signing if conditions are met
        enforcementReadyBlockers: blockers,
        investigationCompletedAt: inv?.completedAt?.toISOString() ?? null,
      };
    }),
  );

  const latestVersion = engagement.governanceManifests[0]?.version ?? 0;
  const nextVersion = latestVersion + 1;

  const manifestJson: ManifestJson = {
    manifestVersion: "3.0",
    manifestStatus: "PROPOSED",
    engagementId,
    companyName: engagement.companyName,
    generatedAt: new Date().toISOString(),
    signedAt: null,
    signedBy: null,
    enforcementReady: false,
    summary: {
      totalAgents: engagement.registeredAgents.length,
      dispositionBreakdown,
      enforcementReadyCount: 0, // Computed at signing
    },
    agents: agentEntries,
  };

  const [manifest] = await db
    .insert(governanceManifests)
    .values({
      engagementId,
      manifestJson,
      version: nextVersion,
      manifestStatus: "PROPOSED",
      enforcementReady: false,
    })
    .returning();

  return manifest;
}

// ── Manifest Signing ──────────────────────────────────────────────────────────

export async function signManifest(
  manifestId: string,
  signer: { name: string; title: string; email: string; ip: string },
) {
  const manifest = await db.query.governanceManifests.findFirst({
    where: eq(governanceManifests.id, manifestId),
    with: { engagement: { with: { registeredAgents: { where: isNull(registeredAgents.deletedAt) } } } },
  });

  if (!manifest) throw new Error("Manifest not found");
  if (manifest.manifestStatus !== "PROPOSED") {
    throw new Error(`Cannot sign a manifest in ${manifest.manifestStatus} status`);
  }

  // Recompute enforcement readiness for each agent now that the manifest will be signed
  const agents = manifest.engagement.registeredAgents;
  let enforcementReadyCount = 0;
  const updatedAgentEntries = await Promise.all(
    ((manifest.manifestJson as ManifestJson).agents ?? []).map(async (entry) => {
      const { ready, blockers } = await checkEnforcementReadiness(entry.agentId, true);
      if (ready) enforcementReadyCount++;
      return { ...entry, enforcementReady: ready, enforcementReadyBlockers: blockers };
    }),
  );

  const manifestReady = enforcementReadyCount === agents.length && agents.length > 0;
  const signedAt = new Date();

  const updatedJson: ManifestJson = {
    ...(manifest.manifestJson as ManifestJson),
    manifestStatus: "SIGNED",
    signedAt: signedAt.toISOString(),
    signedBy: { name: signer.name, title: signer.title, email: signer.email },
    enforcementReady: manifestReady,
    summary: {
      ...(manifest.manifestJson as ManifestJson).summary,
      enforcementReadyCount,
    },
    agents: updatedAgentEntries,
  };

  const [updated] = await db
    .update(governanceManifests)
    .set({
      manifestStatus: "SIGNED",
      manifestJson: updatedJson,
      enforcementReady: manifestReady,
      enforcementReadyAt: manifestReady ? signedAt : null,
      signedAt,
      signedByName: signer.name,
      signedByTitle: signer.title,
      signedByEmail: signer.email,
      signedByIp: signer.ip,
    })
    .where(eq(governanceManifests.id, manifestId))
    .returning();

  return updated;
}

export async function supersedeManifest(engagementId: string) {
  return generateManifest(engagementId);
}

// ── Query Helpers ─────────────────────────────────────────────────────────────

export async function getManifests(engagementId: string) {
  return db.query.governanceManifests.findMany({
    where: eq(governanceManifests.engagementId, engagementId),
    orderBy: [desc(governanceManifests.version)],
  });
}

export async function getLatestManifest(engagementId: string) {
  return db.query.governanceManifests.findFirst({
    where: eq(governanceManifests.engagementId, engagementId),
    orderBy: [desc(governanceManifests.version)],
  });
}

export async function getSignedManifest(engagementId: string) {
  return db.query.governanceManifests.findFirst({
    where: and(
      eq(governanceManifests.engagementId, engagementId),
      eq(governanceManifests.manifestStatus, "SIGNED"),
    ),
    orderBy: [desc(governanceManifests.version)],
  });
}
