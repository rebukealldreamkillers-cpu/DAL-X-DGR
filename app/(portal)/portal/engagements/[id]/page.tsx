import { notFound, redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getEngagement } from "@/lib/engagements";
import { StageBadge } from "@/components/engagements/stage-badge";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, CheckCircle2, Circle, FileText } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ManifestJson } from "@/lib/manifests";

export const dynamic = "force-dynamic";

const DISPOSITION_STYLES: Record<string, { border: string; bg: string; text: string }> = {
  KEEP: { border: "border-emerald-500/40", bg: "bg-emerald-500/10", text: "text-emerald-400" },
  DOWNSIZE: { border: "border-amber-500/40", bg: "bg-amber-500/10", text: "text-amber-400" },
  REPLACE: { border: "border-orange-500/40", bg: "bg-orange-500/10", text: "text-orange-400" },
  KILL: { border: "border-red-500/40", bg: "bg-red-500/10", text: "text-red-400" },
};

export default async function PortalEngagementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await params;
  const engagement = await getEngagement(id);
  if (!engagement) notFound();

  const stage = engagement.stage as
    | "CENSUS"
    | "INVESTIGATION"
    | "REGISTRY"
    | "DEFENSE_FILES"
    | "CLOSED";

  // Verify sponsor access — email must match contact or any investigation sponsor
  const user = await currentUser();
  const userEmail = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase();
  const hasAccess =
    userEmail &&
    (engagement.contactEmail.toLowerCase() === userEmail ||
      engagement.registeredAgents.some(
        (w) => w.investigation?.sponsorEmail?.toLowerCase() === userEmail,
      ));

  if (!hasAccess) notFound();

  const STATUS_LABELS: Record<string, string> = {
    DRAFT: "Not yet sent",
    SENT: "Awaiting your signature",
    SIGNED: "Signed",
    OVERRIDDEN: "Departure recorded",
  };

  // Latest manifest for the three-act framing panel
  const latestManifest = (engagement.governanceManifests ?? []).sort(
    (a, b) => b.version - a.version,
  )[0];
  const manifestJson = latestManifest?.manifestJson as ManifestJson | undefined;

  // Governance summary stats
  const totalAgents = engagement.registeredAgents.length;
  const investigationsComplete = engagement.registeredAgents.filter(
    (w) => !!w.investigation?.completedAt,
  ).length;
  const dispositionCounts = engagement.registeredAgents.reduce(
    (acc, w) => {
      const d = w.investigation?.disposition;
      if (d) acc[d] = (acc[d] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  const authorizationsComplete = engagement.registeredAgents.filter(
    (w) => w.defenseFile?.status === "SIGNED" || w.defenseFile?.status === "OVERRIDDEN",
  ).length;

  // Analyst name — take from first agent with one set
  const analystName = engagement.registeredAgents
    .map((w) => w.investigation?.analystName)
    .find(Boolean) ?? null;

  const STAGE_DESCRIPTION: Record<string, string> = {
    CENSUS: "AI agents are being registered and catalogued. Governance investigations have not yet begun.",
    INVESTIGATION: "Each agent is under a 4-section governance investigation. Decision records are being built.",
    REGISTRY: "All investigations are complete. Governance decisions have been issued.",
    DEFENSE_FILES: "Defense files have been issued. Sponsor authorization is required to activate DAL-X enforcement.",
    CLOSED: "The governance review is complete. All defense files are authorized.",
  };

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/portal" className="hover:text-foreground">Portal</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium">{engagement.companyName}</span>
      </nav>

      {/* Dossier header */}
      <div className="space-y-3">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Governance Dossier
            </span>
          </div>
          <h1 className="text-xl font-semibold mt-1">{engagement.companyName}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Decision Governance Review</p>
        </div>
        <div className="flex items-start gap-3 flex-wrap">
          <StageBadge stage={stage} />
          <p className="text-xs text-muted-foreground leading-relaxed max-w-lg">
            {STAGE_DESCRIPTION[stage]}
          </p>
        </div>
        {analystName && (
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Analyst:</span> {analystName}
          </p>
        )}
      </div>

      {/* Three-act framing */}
      <div className="rounded-md border border-zinc-700 bg-zinc-900 px-4 py-3 space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
          How this works
        </p>
        <p className="text-xs text-zinc-300 leading-relaxed">
          Jochanni Labs has completed the governance assessment for each AI agent in scope
          (Act 1). For each agent below, you may authorize or record a departure from the
          proposed governance decision (Act 2). Your decision enables DAL-X to enforce the
          policy at runtime (Act 3).
        </p>
      </div>

      {/* Manifest summary — if one exists */}
      {manifestJson && (
        <div className="border rounded-lg px-5 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Governance Assessment Summary</p>
            {latestManifest && (
              <Badge
                variant="outline"
                className={
                  latestManifest.manifestStatus === "SIGNED"
                    ? "text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/30"
                }
              >
                {latestManifest.manifestStatus === "SIGNED" ? "Signed" : "Proposed"}
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xl font-semibold">{manifestJson.summary.totalAgents}</p>
              <p className="text-xs text-muted-foreground">Agents in scope</p>
            </div>
            <div>
              <p className="text-xl font-semibold">{manifestJson.summary.enforcementReadyCount}</p>
              <p className="text-xs text-muted-foreground">Enforcement ready</p>
            </div>
            <div>
              <p className="text-xl font-semibold">
                {Object.entries(manifestJson.summary.dispositionBreakdown)
                  .filter(([k]) => k === "KEEP" || k === "DOWNSIZE")
                  .reduce((s, [, c]) => s + c, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Permitted (KEEP / DOWNSIZE)</p>
            </div>
          </div>
        </div>
      )}

      {/* Governance summary — shown once we have agents */}
      {totalAgents > 0 && stage !== "CENSUS" && (
        <div className="border rounded-lg p-4 space-y-3 bg-muted/10">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Governance summary
          </p>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-lg font-semibold">{investigationsComplete}/{totalAgents}</p>
              <p className="text-xs text-muted-foreground">Investigations complete</p>
            </div>
            {Object.keys(dispositionCounts).length > 0 && (
              <div>
                <p className="text-lg font-semibold">
                  {Object.entries(dispositionCounts)
                    .map(([d, n]) => `${n} ${d}`)
                    .join(" · ")}
                </p>
                <p className="text-xs text-muted-foreground">Dispositions issued</p>
              </div>
            )}
            {stage === "DEFENSE_FILES" || stage === "CLOSED" ? (
              <div>
                <p className="text-lg font-semibold">{authorizationsComplete}/{totalAgents}</p>
                <p className="text-xs text-muted-foreground">Defense files authorized</p>
              </div>
            ) : null}
          </div>
        </div>
      )}

      <Separator />

      {/* Agent decision records */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Agent decision records</h2>
        {engagement.registeredAgents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No agents registered.</p>
        ) : (
          <div className="border rounded-lg overflow-hidden divide-y">
            {engagement.registeredAgents.map((w) => {
              const inv = w.investigation;
              const dfStatus = w.defenseFile?.status ?? "DRAFT";
              const needsSignature = dfStatus === "SENT";
              const disposition = inv?.disposition;
              const dispStyle = disposition ? DISPOSITION_STYLES[disposition] : null;

              const dalxSuitability = inv?.enforcementBoundary?.dalxSuitability;
              const dalxLabel =
                dalxSuitability === "SUITABLE"
                  ? "DAL-X suitable"
                  : dalxSuitability === "PREREQUISITES_REQUIRED"
                  ? "prerequisites required"
                  : dalxSuitability === "NOT_SUITABLE"
                  ? "not suitable"
                  : null;

              const sectionsComplete = [
                inv?.section1CompletedAt,
                inv?.section2CompletedAt,
                inv?.section3CompletedAt,
                inv?.section4CompletedAt,
              ].filter(Boolean).length;

              return (
                <div key={w.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {inv?.completedAt ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        )}
                        <p className="text-sm font-medium">{w.name}</p>
                        {dispStyle && disposition && (
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${dispStyle.border} ${dispStyle.bg} ${dispStyle.text}`}
                          >
                            {disposition}
                          </span>
                        )}
                        {needsSignature && (
                          <Badge
                            variant="outline"
                            className="text-[10px] h-4 px-1.5 text-amber-400 border-amber-500/30 bg-amber-500/10"
                          >
                            Signature required
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 ml-6">
                        {w.businessOutcome}
                      </p>
                      {/* Investigation meta row */}
                      <div className="flex items-center gap-3 mt-1.5 ml-6">
                        {inv?.completedAt ? (
                          <span className="text-xs text-muted-foreground">Investigation complete</span>
                        ) : inv ? (
                          <span className="text-xs text-muted-foreground">
                            Under investigation · {sectionsComplete}/4 sections
                          </span>
                        ) : null}
                        {dalxLabel && (
                          <span
                            className={cn(
                              "text-[10px] font-medium px-1.5 py-0.5 rounded border",
                              dalxSuitability === "SUITABLE"
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                                : dalxSuitability === "PREREQUISITES_REQUIRED"
                                ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                                : "border-red-500/30 bg-red-500/10 text-red-400",
                            )}
                          >
                            {dalxLabel}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs text-muted-foreground">
                        {STATUS_LABELS[dfStatus] ?? dfStatus}
                      </p>
                      {needsSignature && w.defenseFile?.signatureToken && (
                        <Link
                          href={`/sign/${w.defenseFile.signatureToken}`}
                          className="text-xs text-foreground font-medium underline underline-offset-2 mt-0.5 block"
                        >
                          Authorize now →
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Disposition reasoning */}
                  {inv?.dispositionReasoning && (
                    <div className="ml-6 mt-3 pt-3 border-t text-xs text-muted-foreground">
                      <p className="leading-relaxed">{inv.dispositionReasoning}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 60-day checkpoint */}
      {stage === "CLOSED" && (
        <>
          <Separator />
          <div className="border rounded-lg px-5 py-4">
            <p className="text-sm font-medium">60-day checkpoint</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Help us track real outcomes — tell us whether the recommended actions were carried out.
            </p>
            <Link
              href={`/checkpoint/${id}`}
              className="inline-flex items-center gap-1.5 text-xs font-medium underline underline-offset-2 mt-3"
            >
              Complete the checkpoint →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
