import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getEngagement } from "@/lib/engagements";
import { getLatestManifest, generateManifest } from "@/lib/manifests";

function escapeCsv(v: string | null | undefined): string {
  if (!v) return "";
  return `"${String(v).replace(/"/g, '""')}"`;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") ?? "json";

  const engagement = await getEngagement(id);
  if (!engagement) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const slug = engagement.companyName.replace(/\s+/g, "-").toLowerCase();

  if (format === "manifest") {
    let manifest = await getLatestManifest(id);
    if (!manifest) {
      manifest = await generateManifest(id);
    }
    const json = JSON.stringify(manifest.manifestJson, null, 2);
    return new Response(json, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="governance-manifest-${slug}.json"`,
      },
    });
  }

  if (format === "csv") {
    const headers = [
      "Agent",
      "Business Outcome",
      "Permitted Purpose",
      "Disposition",
      "Disposition Reasoning",
      "Execution Classes",
      "All Validated",
      "DAL-X Suitability",
      "Investigation Complete",
    ];

    const rows = engagement.registeredAgents.map((w) => {
      const inv = w.investigation;
      const classes = inv?.executionClasses ?? [];
      const allValidated = classes.length > 0 && classes.every((ec) => ec.validationStatus === "VALIDATED");
      const boundary = inv?.enforcementBoundary;
      return [
        escapeCsv(w.name),
        escapeCsv(w.businessOutcome),
        escapeCsv(w.permittedPurpose),
        escapeCsv(inv?.disposition ?? ""),
        escapeCsv(inv?.dispositionReasoning ?? ""),
        String(classes.length),
        allValidated ? "Yes" : classes.length === 0 ? "N/A" : "No",
        escapeCsv(boundary?.dalxSuitability ?? ""),
        inv?.completedAt ? "Yes" : "No",
      ].join(",");
    });

    const csv = [headers.join(","), ...rows].join("\r\n");
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="governance-registry-${slug}.csv"`,
      },
    });
  }

  // Default: JSON registry export
  const data = {
    engagementId: id,
    companyName: engagement.companyName,
    exportedAt: new Date().toISOString(),
    agents: engagement.registeredAgents.map((w) => {
      const inv = w.investigation;
      const classes = inv?.executionClasses ?? [];
      const boundary = inv?.enforcementBoundary;
      return {
        id: w.id,
        name: w.name,
        businessOutcome: w.businessOutcome,
        permittedPurpose: w.permittedPurpose,
        registrationStatus: w.registrationStatus,
        decisionRecord: inv
          ? {
              disposition: inv.disposition,
              dispositionReasoning: inv.dispositionReasoning,
              costPerCallUsd: inv.costPerCallUsd ? parseFloat(inv.costPerCallUsd) : null,
              monthlyVolume: inv.monthlyVolume,
              riskNote: inv.riskNote,
              alternativeNote: inv.alternativeNote,
              executionClassCount: classes.length,
              allExecutionClassesValidated:
                classes.length > 0 && classes.every((ec) => ec.validationStatus === "VALIDATED"),
              executionClasses: classes.map((ec) => ({
                id: ec.id,
                action: ec.action,
                target: ec.target,
                scope: ec.scope,
                validationStatus: ec.validationStatus,
                authorityLevel: ec.authority?.authorityLevel ?? null,
                authorityRole: ec.authority?.authorityRole ?? null,
              })),
              enforcementBoundary: boundary
                ? {
                    dalxSuitability: boundary.dalxSuitability,
                    requiredBoundary: boundary.requiredBoundary,
                    integrationPoint: boundary.integrationPoint,
                    downstreamValidationPoint: boundary.downstreamValidationPoint,
                    blocker: boundary.blocker,
                    sponsorDecision: boundary.sponsorDecision,
                  }
                : null,
              completedAt: inv.completedAt,
            }
          : null,
      };
    }),
  };

  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="governance-registry-${slug}.json"`,
    },
  });
}
