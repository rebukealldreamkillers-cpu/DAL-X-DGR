import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  patchExecutionClass,
  deleteExecutionClass,
  upsertAuthority,
} from "@/lib/investigations";
import { db } from "@/db";
import { executionClasses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const patchSchema = z.object({
  action: z.string().min(1).optional(),
  target: z.string().min(1).optional(),
  scope: z.string().min(1).optional(),
  consequenceRationale: z.string().min(1).optional(),
  validationStatus: z.enum(["VALIDATED", "NOT_VALIDATED"]).optional(),
  validatedBy: z.string().optional().nullable(),
  validationEvidence: z.string().optional().nullable(),
  validationDate: z.string().datetime().optional().nullable(),
  // Authority fields — included in the same PATCH to keep the operation atomic
  authority: z
    .object({
      authorityLevel: z.enum(["AUTO", "REVIEW", "ESCALATE", "DENY"]),
      authorityRole: z.string().min(1),
      authorityBasis: z.string().optional().nullable(),
      currentHolderName: z.string().optional().nullable(),
      currentHolderTitle: z.string().optional().nullable(),
      evidenceRequirement: z.string().min(1),
      runtimeSignal: z.string().min(1),
    })
    .optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const ec = await db.query.executionClasses.findFirst({
    where: eq(executionClasses.id, id),
  });
  if (!ec) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { authority, validationDate, ...classFields } = parsed.data;

  const classPatch: Parameters<typeof patchExecutionClass>[1] = {
    ...classFields,
    validationDate: validationDate ? new Date(validationDate) : null,
  };

  const updated = await patchExecutionClass(id, classPatch);

  let authorityRow = null;
  if (authority) {
    authorityRow = await upsertAuthority({
      executionClassId: id,
      investigationId: ec.investigationId,
      ...authority,
    });
  }

  return NextResponse.json({ executionClass: updated, authority: authorityRow });
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await deleteExecutionClass(id);
  return new NextResponse(null, { status: 204 });
}
