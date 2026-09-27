import { notFound } from "next/navigation";
import { getDefenseFileByToken } from "@/lib/defense-files";
import { SponsorSigningForm } from "@/components/defense-files/sponsor-signing-form";
import { CheckCircle2, AlertTriangle, Shield } from "lucide-react";

export const dynamic = "force-dynamic";

const DISPOSITION_STYLES: Record<string, { border: string; bg: string; text: string }> = {
  KEEP: { border: "border-emerald-400", bg: "bg-emerald-50", text: "text-emerald-800" },
  DOWNSIZE: { border: "border-amber-400", bg: "bg-amber-50", text: "text-amber-800" },
  REPLACE: { border: "border-orange-400", bg: "bg-orange-50", text: "text-orange-800" },
  KILL: { border: "border-red-400", bg: "bg-red-50", text: "text-red-800" },
};

const AUTHORITY_LEVEL_STYLES: Record<string, string> = {
  AUTO: "border-emerald-300 bg-emerald-50 text-emerald-700",
  REVIEW: "border-blue-300 bg-blue-50 text-blue-700",
  ESCALATE: "border-amber-300 bg-amber-50 text-amber-700",
  DENY: "border-red-300 bg-red-50 text-red-700",
};

export default async function SignPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const df = await getDefenseFileByToken(token);

  if (!df) notFound();

  const expired =
    df.signatureTokenExpiresAt && new Date() > df.signatureTokenExpiresAt;

  if (expired) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
          <h1 className="text-lg font-semibold">Link expired</h1>
          <p className="text-sm text-muted-foreground">
            This signing link expired after 7 days. Contact your Jochanni Labs analyst to
            request a new link.
          </p>
        </div>
      </div>
    );
  }

  const alreadySigned = !!df.signedAt;
  const wf = df.agent;
  const inv = wf.investigation;
  const eng = wf.engagement;

  if (alreadySigned) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <h1 className="text-lg font-semibold">Signed and recorded</h1>
          <p className="text-sm text-muted-foreground">
            {df.status === "OVERRIDDEN"
              ? "Your departure from the governance decision has been recorded."
              : "You have authorized this governance decision. The Defense File is now closed."}
          </p>
          <p className="text-xs text-muted-foreground">
            {df.signedAt
              ? new Date(df.signedAt).toLocaleString("en-US", {
                  dateStyle: "long",
                  timeStyle: "short",
                })
              : ""}
          </p>
        </div>
      </div>
    );
  }

  const disposition = inv?.disposition;
  const dispStyle = disposition ? DISPOSITION_STYLES[disposition] : null;
  const executionClasses = inv?.executionClasses ?? [];
  const boundary = inv?.enforcementBoundary;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-12 space-y-8">
        {/* Header */}
        <div>
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
            Jochanni Labs · Decision Governance Review
          </p>
          <h1 className="text-xl font-semibold mt-1">Governance Defense File</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {eng.companyName} · {wf.name}
          </p>
        </div>

        {/* Three-act framing */}
        <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Act 2 of 3 — Executive authorization
          </p>
          <p className="text-xs text-slate-700 leading-relaxed">
            Jochanni Labs has completed the governance assessment (Act 1). Your signature
            below authorizes the governance decision and enables DAL-X runtime enforcement
            (Act 3). You may accept the issued decision or record a departure with rationale.
          </p>
        </div>

        {/* Disposition */}
        {disposition && dispStyle && (
          <div className="border rounded-lg p-5 space-y-3">
            <div className="flex items-center gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Workflow disposition
              </p>
              <span
                className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${dispStyle.border} ${dispStyle.bg} ${dispStyle.text}`}
              >
                {disposition}
              </span>
            </div>
            {inv?.dispositionReasoning && (
              <p className="text-sm leading-relaxed">{inv.dispositionReasoning}</p>
            )}

            {/* Sponsor info */}
            {inv?.sponsorName && (
              <div className="pt-3 border-t text-xs text-muted-foreground space-y-0.5">
                <p className="font-medium text-foreground">Defense file sponsor</p>
                <p>{inv.sponsorName}{inv.sponsorTitle ? ` · ${inv.sponsorTitle}` : ""}</p>
                {inv.sponsorEmail && <p>{inv.sponsorEmail}</p>}
              </div>
            )}
          </div>
        )}

        {/* Execution class authority matrix */}
        {executionClasses.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm font-semibold">Execution Class Authority Matrix</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              <strong>Default rule:</strong> any execution class not listed below is DENIED at runtime.
            </div>
            <div className="border rounded-lg divide-y text-xs overflow-hidden">
              {executionClasses.map((ec) => (
                <div key={ec.id} className="px-4 py-3 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{ec.action}</span>
                    <span className="text-muted-foreground">→ {ec.target}</span>
                    {ec.authority && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                          AUTHORITY_LEVEL_STYLES[ec.authority.authorityLevel] ?? ""
                        }`}
                      >
                        {ec.authority.authorityLevel}
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground">{ec.scope}</p>
                  {ec.authority && (
                    <p className="text-muted-foreground">
                      {ec.authority.authorityRole}
                      {ec.authority.currentHolderName ? ` · ${ec.authority.currentHolderName}` : ""}
                    </p>
                  )}
                  {ec.validationStatus === "NOT_VALIDATED" && (
                    <p className="text-amber-700">Not yet validated</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enforcement boundary */}
        {boundary && (
          <div className="border rounded-lg p-4 space-y-2 text-xs">
            <p className="text-sm font-semibold">Enforcement Boundary</p>
            <div className="grid grid-cols-1 gap-1.5 text-muted-foreground">
              <p><span className="font-medium text-foreground">Required boundary:</span> {boundary.requiredBoundary}</p>
              <p><span className="font-medium text-foreground">DAL-X suitability:</span> {boundary.dalxSuitability}</p>
              {boundary.integrationPoint && (
                <p><span className="font-medium text-foreground">Integration point:</span> {boundary.integrationPoint}</p>
              )}
              {boundary.downstreamValidationPoint && (
                <p><span className="font-medium text-foreground">Downstream validation:</span> {boundary.downstreamValidationPoint}</p>
              )}
              {boundary.blocker && (
                <p className="text-amber-700"><span className="font-medium">Blocker:</span> {boundary.blocker}</p>
              )}
            </div>
          </div>
        )}

        {/* Signing form */}
        <SponsorSigningForm
          token={token}
          sponsorName={inv?.sponsorName ?? ""}
        />

        <p className="text-xs text-muted-foreground leading-relaxed border-t pt-4">
          This document is confidential and governed by the mutual NDA between Jochanni Labs and{" "}
          {eng.companyName}. Your response is recorded as a permanent, dated audit entry.
        </p>
      </div>
    </div>
  );
}
