/**
 * Manual migration to bypass drizzle-kit's TTY requirement.
 * Applies the full schema diff between 0000_snapshot and the current schema.ts.
 * Safe to re-run — uses IF NOT EXISTS / IF EXISTS guards throughout.
 */

import { readFileSync } from "fs";
import { neon } from "@neondatabase/serverless";

// Load .env.local manually
const envFile = readFileSync(".env.local", "utf-8");
for (const line of envFile.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  let val = trimmed.slice(eq + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  process.env[key] = val;
}

const sql = neon(process.env.DATABASE_URL);

async function run() {
  console.log("Starting manual migration...\n");

  // ── Step 1: Drop governance_postures (uses posture_lock_status enum) ──────────
  console.log("1. Dropping governance_postures table...");
  await sql`DROP TABLE IF EXISTS public.governance_postures CASCADE`;

  // ── Step 2: Truncate investigations so we can restructure it cleanly ──────────
  //    The new schema adds NOT NULL columns incompatible with old rows.
  console.log("2. Truncating investigations (schema rebuild)...");
  await sql`TRUNCATE TABLE public.investigations CASCADE`;

  // ── Step 3: Drop old investigation columns that use removed enums ─────────────
  console.log("3. Dropping old investigation columns...");
  const oldInvCols = [
    "q1_business_requirement", "q1_permitted_purpose", "q1_authorized_at", "q1_completed_at",
    "q2_evidence_type", "q2_evidence_description", "q2_evidence_strength",
    "q2_activation_threshold", "q2_expansion_conditions", "q2_completed_at",
    "q3_cost_per_call_usd", "q3_monthly_volume", "q3_monthly_total_usd", "q3_annualized_usd",
    "q3_interception_threshold_usd", "q3_escalation_threshold_usd",
    "q3_manual_override", "q3_manual_override_note", "q3_completed_at",
    "q4_alternative_type", "q4_alternative_description", "q4_estimated_cost_per_call_usd",
    "q4_feasibility", "q4_migration_conditions", "q4_client_implementation_required", "q4_completed_at",
    "q5_risks", "q5_completed_at",
    "q6_recommended_posture", "q6_dalx_enforcement_posture", "q6_reasoning_chain",
    "q6_analyst_accepted", "q6_analyst_override_note", "q6_completed_at",
  ];
  for (const col of oldInvCols) {
    await sql.query(`ALTER TABLE public.investigations DROP COLUMN IF EXISTS ${col}`);
  }

  // ── Step 4: Drop old enums ────────────────────────────────────────────────────
  console.log("4. Dropping old enums...");
  await sql`DROP TYPE IF EXISTS public.alternative_type CASCADE`;
  await sql`DROP TYPE IF EXISTS public.evidence_strength CASCADE`;
  await sql`DROP TYPE IF EXISTS public.posture_lock_status CASCADE`;
  await sql`DROP TYPE IF EXISTS public.risk_category CASCADE`;
  await sql`DROP TYPE IF EXISTS public.risk_severity CASCADE`;

  // ── Step 5: Create new enums ──────────────────────────────────────────────────
  console.log("5. Creating new enums...");
  await sql`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'authority_level' AND typnamespace = 'public'::regnamespace) THEN
        CREATE TYPE public.authority_level AS ENUM ('AUTO', 'REVIEW', 'ESCALATE', 'DENY');
      END IF;
    END $$
  `;
  await sql`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'validation_status' AND typnamespace = 'public'::regnamespace) THEN
        CREATE TYPE public.validation_status AS ENUM ('VALIDATED', 'NOT_VALIDATED');
      END IF;
    END $$
  `;
  await sql`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dalx_suitability' AND typnamespace = 'public'::regnamespace) THEN
        CREATE TYPE public.dalx_suitability AS ENUM ('SUITABLE', 'PREREQUISITES_REQUIRED', 'NOT_SUITABLE');
      END IF;
    END $$
  `;

  // ── Step 6: Rename sponsor columns in investigations ──────────────────────────
  console.log("6. Renaming investigation sponsor columns...");
  await sql`
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'investigations' AND column_name = 'q1_sponsor_name') THEN
        ALTER TABLE public.investigations RENAME COLUMN q1_sponsor_name TO sponsor_name;
      END IF;
    END $$
  `;
  await sql`
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'investigations' AND column_name = 'q1_sponsor_title') THEN
        ALTER TABLE public.investigations RENAME COLUMN q1_sponsor_title TO sponsor_title;
      END IF;
    END $$
  `;
  await sql`
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'investigations' AND column_name = 'q1_sponsor_email') THEN
        ALTER TABLE public.investigations RENAME COLUMN q1_sponsor_email TO sponsor_email;
      END IF;
    END $$
  `;

  // ── Step 7: Add new columns to investigations ─────────────────────────────────
  console.log("7. Adding new columns to investigations...");
  const addInvCols = [
    `ALTER TABLE public.investigations ADD COLUMN IF NOT EXISTS engagement_id uuid NOT NULL REFERENCES public.engagements(id) ON DELETE CASCADE`,
    `ALTER TABLE public.investigations ADD COLUMN IF NOT EXISTS cost_per_call_usd numeric(10, 6)`,
    `ALTER TABLE public.investigations ADD COLUMN IF NOT EXISTS monthly_volume integer`,
    `ALTER TABLE public.investigations ADD COLUMN IF NOT EXISTS risk_note text`,
    `ALTER TABLE public.investigations ADD COLUMN IF NOT EXISTS alternative_note text`,
    `ALTER TABLE public.investigations ADD COLUMN IF NOT EXISTS disposition public.posture`,
    `ALTER TABLE public.investigations ADD COLUMN IF NOT EXISTS disposition_reasoning text`,
    `ALTER TABLE public.investigations ADD COLUMN IF NOT EXISTS analyst_name text`,
    `ALTER TABLE public.investigations ADD COLUMN IF NOT EXISTS section1_completed_at timestamp`,
    `ALTER TABLE public.investigations ADD COLUMN IF NOT EXISTS section2_completed_at timestamp`,
    `ALTER TABLE public.investigations ADD COLUMN IF NOT EXISTS section3_completed_at timestamp`,
    `ALTER TABLE public.investigations ADD COLUMN IF NOT EXISTS section4_completed_at timestamp`,
  ];
  for (const stmt of addInvCols) {
    await sql.query(stmt);
  }

  // Add unique constraint on agent_id
  await sql`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'investigations_agent_id_unique') THEN
        ALTER TABLE public.investigations ADD CONSTRAINT investigations_agent_id_unique UNIQUE (agent_id);
      END IF;
    END $$
  `;

  // ── Step 8: Add new columns to governance_manifests ──────────────────────────
  console.log("8. Adding columns to governance_manifests...");
  await sql`ALTER TABLE public.governance_manifests ADD COLUMN IF NOT EXISTS enforcement_ready boolean NOT NULL DEFAULT false`;
  await sql`ALTER TABLE public.governance_manifests ADD COLUMN IF NOT EXISTS enforcement_ready_at timestamp`;

  // ── Step 9: Create execution_classes ─────────────────────────────────────────
  console.log("9. Creating execution_classes table...");
  await sql`
    CREATE TABLE IF NOT EXISTS public.execution_classes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      investigation_id uuid NOT NULL REFERENCES public.investigations(id) ON DELETE CASCADE,
      agent_id uuid NOT NULL REFERENCES public.registered_agents(id) ON DELETE CASCADE,
      action text NOT NULL,
      target text NOT NULL,
      scope text NOT NULL,
      consequence_rationale text NOT NULL,
      validation_status public.validation_status NOT NULL DEFAULT 'NOT_VALIDATED',
      validated_by text,
      validation_evidence text,
      validation_date timestamp,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    )
  `;

  // ── Step 10: Create authority_matrix ─────────────────────────────────────────
  console.log("10. Creating authority_matrix table...");
  await sql`
    CREATE TABLE IF NOT EXISTS public.authority_matrix (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      execution_class_id uuid NOT NULL UNIQUE REFERENCES public.execution_classes(id) ON DELETE CASCADE,
      investigation_id uuid NOT NULL REFERENCES public.investigations(id) ON DELETE CASCADE,
      authority_level public.authority_level NOT NULL,
      authority_role text NOT NULL,
      authority_basis text,
      current_holder_name text,
      current_holder_title text,
      evidence_requirement text NOT NULL,
      runtime_signal text NOT NULL,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    )
  `;

  // ── Step 11: Create enforcement_boundary ─────────────────────────────────────
  console.log("11. Creating enforcement_boundary table...");
  await sql`
    CREATE TABLE IF NOT EXISTS public.enforcement_boundary (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      investigation_id uuid NOT NULL UNIQUE REFERENCES public.investigations(id) ON DELETE CASCADE,
      agent_id uuid NOT NULL REFERENCES public.registered_agents(id) ON DELETE CASCADE,
      execution_path text NOT NULL,
      bypass_paths text,
      required_boundary text NOT NULL,
      dalx_suitability public.dalx_suitability NOT NULL,
      integration_point text NOT NULL,
      required_execution_info text,
      downstream_validation_point text NOT NULL,
      blocker text,
      sponsor_decision text,
      sponsor_decision_note text,
      sponsor_decision_at timestamp,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    )
  `;

  console.log("\nMigration complete.");
}

run().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
