import {
  pgTable,
  text,
  timestamp,
  integer,
  numeric,
  boolean,
  pgEnum,
  uuid,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ── Enums ─────────────────────────────────────────────────────────────────────

export const engagementStageEnum = pgEnum("engagement_stage", [
  "CENSUS",
  "INVESTIGATION",
  "REGISTRY",
  "DEFENSE_FILES",
  "CLOSED",
]);

export const postureEnum = pgEnum("posture", [
  "KEEP",
  "DOWNSIZE",
  "REPLACE",
  "KILL",
]);

// Used in registeredAgents.existingEvidenceStatus (census-level field)
export const evidenceTypeEnum = pgEnum("evidence_type", [
  "NONE",
  "ANECDOTAL",
  "DOCUMENTED",
]);

export const defenseFileStatusEnum = pgEnum("defense_file_status", [
  "DRAFT",
  "SENT",
  "SIGNED",
  "OVERRIDDEN",
]);

export const registrationStatusEnum = pgEnum("registration_status", [
  "ACTIVE",
  "SUSPENDED",
  "DECOMMISSIONING",
  "CLOSED",
]);

export const manifestStatusEnum = pgEnum("manifest_status", [
  "PROPOSED",
  "SIGNED",
  "SUPERSEDED",
]);

export const authorityLevelEnum = pgEnum("authority_level", [
  "AUTO",
  "REVIEW",
  "ESCALATE",
  "DENY",
]);

export const validationStatusEnum = pgEnum("validation_status", [
  "VALIDATED",
  "NOT_VALIDATED",
]);

export const dalxSuitabilityEnum = pgEnum("dalx_suitability", [
  "SUITABLE",
  "PREREQUISITES_REQUIRED",
  "NOT_SUITABLE",
]);

// ── Engagements ───────────────────────────────────────────────────────────────

export const engagements = pgTable("engagements", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyName: text("company_name").notNull(),
  contactName: text("contact_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  aiSpendDescription: text("ai_spend_description"),
  internalAudience: text("internal_audience"),
  stage: engagementStageEnum("stage").notNull().default("CENSUS"),
  ndaAcknowledgedAt: timestamp("nda_acknowledged_at"),
  censusCompletedAt: timestamp("census_completed_at"),
  investigationCompletedAt: timestamp("investigation_completed_at"),
  registryCompletedAt: timestamp("registry_completed_at"),
  defenseFilesCompletedAt: timestamp("defense_files_completed_at"),
  closedAt: timestamp("closed_at"),
  checkpointScheduledAt: timestamp("checkpoint_scheduled_at"),
  checkpointCompletedAt: timestamp("checkpoint_completed_at"),
  analystClerkId: text("analyst_clerk_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Registered Agents (Pipeline Census) ──────────────────────────────────────

export const registeredAgents = pgTable("registered_agents", {
  id: uuid("id").primaryKey().defaultRandom(),
  engagementId: uuid("engagement_id")
    .notNull()
    .references(() => engagements.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  permittedPurpose: text("permitted_purpose").notNull(),
  businessOutcome: text("business_outcome").notNull(),
  costPerCallUsd: numeric("cost_per_call_usd", { precision: 10, scale: 6 }),
  monthlyCallVolume: integer("monthly_call_volume"),
  modelTier: text("model_tier"),
  existingEvidenceStatus: evidenceTypeEnum("existing_evidence_status").default("NONE"),
  registrationStatus: registrationStatusEnum("registration_status").notNull().default("ACTIVE"),
  dalxRegistered: boolean("dalx_registered").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Investigations ────────────────────────────────────────────────────────────

export const investigations = pgTable("investigations", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: uuid("agent_id")
    .notNull()
    .unique()
    .references(() => registeredAgents.id, { onDelete: "cascade" }),
  engagementId: uuid("engagement_id")
    .notNull()
    .references(() => engagements.id, { onDelete: "cascade" }),

  // Defense file sponsor — the named individual who signs the decision record
  sponsorName: text("sponsor_name"),
  sponsorTitle: text("sponsor_title"),
  sponsorEmail: text("sponsor_email"),

  // Section 4 — Business Value and Disposition
  costPerCallUsd: numeric("cost_per_call_usd", { precision: 10, scale: 6 }),
  monthlyVolume: integer("monthly_volume"),
  riskNote: text("risk_note"),
  alternativeNote: text("alternative_note"),
  disposition: postureEnum("disposition"),
  dispositionReasoning: text("disposition_reasoning"),
  analystName: text("analyst_name"),

  // Section completion tracking
  section1CompletedAt: timestamp("section1_completed_at"), // execution class declaration
  section2CompletedAt: timestamp("section2_completed_at"), // authority matrix
  section3CompletedAt: timestamp("section3_completed_at"), // enforcement boundary
  section4CompletedAt: timestamp("section4_completed_at"), // business value and disposition

  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Execution Classes (Section 1 — declared by sponsor team, validated by FDO) ─

export const executionClasses = pgTable("execution_classes", {
  id: uuid("id").primaryKey().defaultRandom(),
  investigationId: uuid("investigation_id")
    .notNull()
    .references(() => investigations.id, { onDelete: "cascade" }),
  agentId: uuid("agent_id")
    .notNull()
    .references(() => registeredAgents.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  target: text("target").notNull(),
  scope: text("scope").notNull(),
  consequenceRationale: text("consequence_rationale").notNull(),
  validationStatus: validationStatusEnum("validation_status").notNull().default("NOT_VALIDATED"),
  // Traceability — required before validationStatus may be set to VALIDATED
  validatedBy: text("validated_by"),
  validationEvidence: text("validation_evidence"),
  validationDate: timestamp("validation_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Authority Matrix (Section 2 — one entry per execution class) ──────────────

export const authorityMatrix = pgTable("authority_matrix", {
  id: uuid("id").primaryKey().defaultRandom(),
  executionClassId: uuid("execution_class_id")
    .notNull()
    .unique()
    .references(() => executionClasses.id, { onDelete: "cascade" }),
  investigationId: uuid("investigation_id")
    .notNull()
    .references(() => investigations.id, { onDelete: "cascade" }),
  authorityLevel: authorityLevelEnum("authority_level").notNull(),
  // Required for all levels. For AUTO: the approved policy name. For REVIEW/ESCALATE: the role title.
  authorityRole: text("authority_role").notNull(),
  // For AUTO: the specific policy or rule permitting automatic authorization.
  // For DENY: the rule mandating denial. Nullable for REVIEW/ESCALATE.
  authorityBasis: text("authority_basis"),
  // For REVIEW and ESCALATE only — the person who held this authority when the DGR was completed
  currentHolderName: text("current_holder_name"),
  currentHolderTitle: text("current_holder_title"),
  // What evidence must exist at execution time before a decision can be made
  evidenceRequirement: text("evidence_requirement").notNull(),
  // How DAL-X identifies this execution class at runtime
  runtimeSignal: text("runtime_signal").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Enforcement Boundary (Section 3 — one entry per investigation) ────────────

export const enforcementBoundary = pgTable("enforcement_boundary", {
  id: uuid("id").primaryKey().defaultRandom(),
  investigationId: uuid("investigation_id")
    .notNull()
    .unique()
    .references(() => investigations.id, { onDelete: "cascade" }),
  agentId: uuid("agent_id")
    .notNull()
    .references(() => registeredAgents.id, { onDelete: "cascade" }),
  // Brief sequence: agent → orchestrator → gateway → DAL-X → downstream
  executionPath: text("execution_path").notNull(),
  // Named bypass paths, if any; null if none identified
  bypassPaths: text("bypass_paths"),
  requiredBoundary: text("required_boundary").notNull(),
  dalxSuitability: dalxSuitabilityEnum("dalx_suitability").notNull(),
  integrationPoint: text("integration_point").notNull(),
  // What execution information DAL-X needs to enforce at this boundary
  requiredExecutionInfo: text("required_execution_info"),
  downstreamValidationPoint: text("downstream_validation_point").notNull(),
  // For PREREQUISITES_REQUIRED or NOT_SUITABLE — names the specific blocker
  blocker: text("blocker"),
  // Sponsor decision for NOT_SUITABLE — enterprise owns the operating decision
  // "SUSPEND" | "ESTABLISH_BOUNDARY" | "OVERRIDE_ACCEPTED"
  sponsorDecision: text("sponsor_decision"),
  sponsorDecisionNote: text("sponsor_decision_note"),
  sponsorDecisionAt: timestamp("sponsor_decision_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Defense Files ─────────────────────────────────────────────────────────────

export const defenseFiles = pgTable("defense_files", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: uuid("agent_id")
    .notNull()
    .unique()
    .references(() => registeredAgents.id, { onDelete: "cascade" }),
  status: defenseFileStatusEnum("status").notNull().default("DRAFT"),
  pdfBlobUrl: text("pdf_blob_url"),
  signatureToken: text("signature_token").unique(),
  signatureTokenExpiresAt: timestamp("signature_token_expires_at"),

  // Sponsor signature
  signedAt: timestamp("signed_at"),
  signedByIp: text("signed_by_ip"),
  signedByUserAgent: text("signed_by_user_agent"),

  // Sponsor departure — recorded separately from the Jochanni Labs recommended disposition
  sponsorOverridePosture: postureEnum("sponsor_override_posture"),
  sponsorOverrideRationale: text("sponsor_override_rationale"),
  sponsorOverrideAt: timestamp("sponsor_override_at"),
  sponsorOverrideName: text("sponsor_override_name"),

  // Tracking keys (Jira / Linear)
  trackingKey: text("tracking_key"),
  trackingSystem: text("tracking_system"),
  trackingStatus: text("tracking_status"),

  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Governance Manifests ──────────────────────────────────────────────────────

export const governanceManifests = pgTable("governance_manifests", {
  id: uuid("id").primaryKey().defaultRandom(),
  engagementId: uuid("engagement_id")
    .notNull()
    .references(() => engagements.id, { onDelete: "cascade" }),
  manifestStatus: manifestStatusEnum("manifest_status").notNull().default("PROPOSED"),
  manifestJson: jsonb("manifest_json").notNull(),
  version: integer("version").notNull().default(1),
  // A signed manifest is not automatically ready for enforcement.
  // True only when: disposition permits operation, all classes validated,
  // suitability is SUITABLE, sponsor has signed, prerequisites resolved.
  enforcementReady: boolean("enforcement_ready").notNull().default(false),
  enforcementReadyAt: timestamp("enforcement_ready_at"),
  signedAt: timestamp("signed_at"),
  signedByName: text("signed_by_name"),
  signedByTitle: text("signed_by_title"),
  signedByEmail: text("signed_by_email"),
  signedByIp: text("signed_by_ip"),
  blobUrl: text("blob_url"),
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
});

// ── Checkpoint Responses ──────────────────────────────────────────────────────

export const checkpointResponses = pgTable("checkpoint_responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  engagementId: uuid("engagement_id")
    .notNull()
    .references(() => engagements.id, { onDelete: "cascade" }),
  agentId: uuid("agent_id")
    .notNull()
    .references(() => registeredAgents.id, { onDelete: "cascade" }),
  actionCarriedOut: text("action_carried_out").notNull(), // "yes" | "in_progress" | "no"
  reason: text("reason"),
  clientConsentToShare: boolean("client_consent_to_share").default(false),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
});

// ── Relations ─────────────────────────────────────────────────────────────────

export const engagementsRelations = relations(engagements, ({ many }) => ({
  registeredAgents: many(registeredAgents),
  governanceManifests: many(governanceManifests),
  checkpointResponses: many(checkpointResponses),
  investigations: many(investigations),
}));

export const registeredAgentsRelations = relations(registeredAgents, ({ one, many }) => ({
  engagement: one(engagements, {
    fields: [registeredAgents.engagementId],
    references: [engagements.id],
  }),
  investigation: one(investigations),
  defenseFile: one(defenseFiles),
  executionClasses: many(executionClasses),
  enforcementBoundary: one(enforcementBoundary),
  checkpointResponses: many(checkpointResponses),
}));

export const investigationsRelations = relations(investigations, ({ one, many }) => ({
  agent: one(registeredAgents, {
    fields: [investigations.agentId],
    references: [registeredAgents.id],
  }),
  engagement: one(engagements, {
    fields: [investigations.engagementId],
    references: [engagements.id],
  }),
  executionClasses: many(executionClasses),
  enforcementBoundary: one(enforcementBoundary),
}));

export const executionClassesRelations = relations(executionClasses, ({ one }) => ({
  investigation: one(investigations, {
    fields: [executionClasses.investigationId],
    references: [investigations.id],
  }),
  agent: one(registeredAgents, {
    fields: [executionClasses.agentId],
    references: [registeredAgents.id],
  }),
  authority: one(authorityMatrix),
}));

export const authorityMatrixRelations = relations(authorityMatrix, ({ one }) => ({
  executionClass: one(executionClasses, {
    fields: [authorityMatrix.executionClassId],
    references: [executionClasses.id],
  }),
  investigation: one(investigations, {
    fields: [authorityMatrix.investigationId],
    references: [investigations.id],
  }),
}));

export const enforcementBoundaryRelations = relations(enforcementBoundary, ({ one }) => ({
  investigation: one(investigations, {
    fields: [enforcementBoundary.investigationId],
    references: [investigations.id],
  }),
  agent: one(registeredAgents, {
    fields: [enforcementBoundary.agentId],
    references: [registeredAgents.id],
  }),
}));

export const defenseFilesRelations = relations(defenseFiles, ({ one }) => ({
  agent: one(registeredAgents, {
    fields: [defenseFiles.agentId],
    references: [registeredAgents.id],
  }),
}));

export const governanceManifestsRelations = relations(governanceManifests, ({ one }) => ({
  engagement: one(engagements, {
    fields: [governanceManifests.engagementId],
    references: [engagements.id],
  }),
}));

export const checkpointResponsesRelations = relations(checkpointResponses, ({ one }) => ({
  engagement: one(engagements, {
    fields: [checkpointResponses.engagementId],
    references: [engagements.id],
  }),
  agent: one(registeredAgents, {
    fields: [checkpointResponses.agentId],
    references: [registeredAgents.id],
  }),
}));

// ── TypeScript Types ──────────────────────────────────────────────────────────

export type Posture = "KEEP" | "DOWNSIZE" | "REPLACE" | "KILL";
export type Disposition = Posture;
export type AuthorityLevel = "AUTO" | "REVIEW" | "ESCALATE" | "DENY";
export type ValidationStatus = "VALIDATED" | "NOT_VALIDATED";
export type DalxSuitability = "SUITABLE" | "PREREQUISITES_REQUIRED" | "NOT_SUITABLE";
export type ManifestStatus = "PROPOSED" | "SIGNED" | "SUPERSEDED";
export type RegistrationStatus = "ACTIVE" | "SUSPENDED" | "DECOMMISSIONING" | "CLOSED";

export type Engagement = typeof engagements.$inferSelect;
export type NewEngagement = typeof engagements.$inferInsert;
export type RegisteredAgent = typeof registeredAgents.$inferSelect;
export type NewRegisteredAgent = typeof registeredAgents.$inferInsert;
export type Investigation = typeof investigations.$inferSelect;
export type NewInvestigation = typeof investigations.$inferInsert;
export type ExecutionClass = typeof executionClasses.$inferSelect;
export type NewExecutionClass = typeof executionClasses.$inferInsert;
export type AuthorityMatrixRow = typeof authorityMatrix.$inferSelect;
export type NewAuthorityMatrixRow = typeof authorityMatrix.$inferInsert;
export type EnforcementBoundary = typeof enforcementBoundary.$inferSelect;
export type NewEnforcementBoundary = typeof enforcementBoundary.$inferInsert;
export type DefenseFile = typeof defenseFiles.$inferSelect;
export type NewDefenseFile = typeof defenseFiles.$inferInsert;
export type GovernanceManifest = typeof governanceManifests.$inferSelect;
export type NewGovernanceManifest = typeof governanceManifests.$inferInsert;
export type CheckpointResponse = typeof checkpointResponses.$inferSelect;
export type NewCheckpointResponse = typeof checkpointResponses.$inferInsert;
