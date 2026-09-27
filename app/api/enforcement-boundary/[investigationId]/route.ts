import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  upsertEnforcementBoundary,
  recordSponsorBoundaryDecision,
  getInvestigationById,
} from "@/lib/investigations";
import { z } from "zod";

const putSchema = z.object({
  agentId: z.string().uuid(),
  executionPath: z.string().min(1),
  bypassPaths: z.string().optional().nullable(),
  requiredBoundary: z.string().min(1),
  dalxSuitability: z.enum(["SUITABLE", "PREREQUISITES_REQUIRED", "NOT_SUITABLE"]),
  integrationPoint: z.string().min(1),
  requiredExecutionInfo: z.string().optional().nullable(),
  downstreamValidationPoint: z.string().min(1),
  blocker: z.string().optional().nullable(),
});

const sponsorDecisionSchema = z.object({
  sponsorDecision: z.enum(["SUSPEND", "ESTABLISH_BOUNDARY", "OVERRIDE_ACCEPTED"]),
  sponsorDecisionNote: z.string().optional().nullable(),
});

export async function GET(
  _: Request,
  { params }: { params: Promise<{ investigationId: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { investigationId } = await params;
  const inv = await getInvestigationById(investigationId);
  if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(inv.enforcementBoundary ?? null);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ investigationId: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { investigationId } = await params;
  const body = await req.json();
  const parsed = putSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const boundary = await upsertEnforcementBoundary(investigationId, parsed.data);
  return NextResponse.json(boundary);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ investigationId: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { investigationId } = await params;
  const body = await req.json();
  const parsed = sponsorDecisionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const updated = await recordSponsorBoundaryDecision(investigationId, parsed.data);
  return NextResponse.json(updated);
}
