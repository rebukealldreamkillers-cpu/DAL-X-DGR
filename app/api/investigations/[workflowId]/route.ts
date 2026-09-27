import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getInvestigation, getOrCreateInvestigation, patchInvestigation } from "@/lib/investigations";
import { z } from "zod";

const patchSchema = z.object({
  // Defense file sponsor
  sponsorName: z.string().optional(),
  sponsorTitle: z.string().optional(),
  sponsorEmail: z.string().email().optional().or(z.literal("")),

  // Section 4 — Business Value and Disposition
  costPerCallUsd: z.string().optional().nullable(),
  monthlyVolume: z.number().int().optional().nullable(),
  riskNote: z.string().optional().nullable(),
  alternativeNote: z.string().optional().nullable(),
  disposition: z.enum(["KEEP", "DOWNSIZE", "REPLACE", "KILL"]).optional().nullable(),
  dispositionReasoning: z.string().optional().nullable(),
  analystName: z.string().optional().nullable(),

  // Section completion
  section1Complete: z.boolean().optional(),
  section2Complete: z.boolean().optional(),
  section3Complete: z.boolean().optional(),
  section4Complete: z.boolean().optional(),
});

export async function GET(_: Request, { params }: { params: Promise<{ workflowId: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { workflowId: agentId } = await params;
  const investigation = await getInvestigation(agentId);
  if (!investigation) {
    const created = await getOrCreateInvestigation(agentId);
    return NextResponse.json(created);
  }
  return NextResponse.json(investigation);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ workflowId: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { workflowId: agentId } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const now = new Date();
  const d = parsed.data;
  const patch: Record<string, unknown> = {};

  if (d.sponsorName !== undefined) patch.sponsorName = d.sponsorName;
  if (d.sponsorTitle !== undefined) patch.sponsorTitle = d.sponsorTitle;
  if (d.sponsorEmail !== undefined) patch.sponsorEmail = d.sponsorEmail;
  if (d.costPerCallUsd !== undefined) patch.costPerCallUsd = d.costPerCallUsd;
  if (d.monthlyVolume !== undefined) patch.monthlyVolume = d.monthlyVolume;
  if (d.riskNote !== undefined) patch.riskNote = d.riskNote;
  if (d.alternativeNote !== undefined) patch.alternativeNote = d.alternativeNote;
  if (d.disposition !== undefined) patch.disposition = d.disposition;
  if (d.dispositionReasoning !== undefined) patch.dispositionReasoning = d.dispositionReasoning;
  if (d.analystName !== undefined) patch.analystName = d.analystName;

  if (d.section1Complete) patch.section1CompletedAt = now;
  if (d.section2Complete) patch.section2CompletedAt = now;
  if (d.section3Complete) patch.section3CompletedAt = now;
  if (d.section4Complete) patch.section4CompletedAt = now;

  const updated = await patchInvestigation(agentId, patch as Parameters<typeof patchInvestigation>[1]);
  return NextResponse.json(updated);
}
