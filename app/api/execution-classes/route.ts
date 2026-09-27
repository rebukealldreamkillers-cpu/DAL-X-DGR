import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createExecutionClass, getOrCreateInvestigation } from "@/lib/investigations";
import { z } from "zod";

const schema = z.object({
  agentId: z.string().uuid(),
  action: z.string().min(1),
  target: z.string().min(1),
  scope: z.string().min(1),
  consequenceRationale: z.string().min(1),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const { agentId, ...classData } = parsed.data;
  const investigation = await getOrCreateInvestigation(agentId);

  const created = await createExecutionClass({
    investigationId: investigation.id,
    agentId,
    ...classData,
  });

  return NextResponse.json(created, { status: 201 });
}
