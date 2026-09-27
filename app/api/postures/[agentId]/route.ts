import { NextResponse } from "next/server";

// Governance postures are no longer a separate record.
// Disposition is recorded in the investigation (Section 4).
// Use PATCH /api/investigations/[workflowId] with { disposition, dispositionReasoning }.

export async function GET() {
  return NextResponse.json(
    { error: "Use GET /api/investigations/[workflowId] — disposition is part of the investigation record." },
    { status: 410 },
  );
}

export async function PATCH() {
  return NextResponse.json(
    { error: "Use PATCH /api/investigations/[workflowId] with { disposition, dispositionReasoning }." },
    { status: 410 },
  );
}
