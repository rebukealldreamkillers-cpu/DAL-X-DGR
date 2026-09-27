import { notFound } from "next/navigation";
import { getEngagement } from "@/lib/engagements";
import { getLatestManifest, getManifests } from "@/lib/manifests";
import { ManifestGenerateButton } from "@/components/manifests/manifest-generate-button";
import { ManifestSignButton } from "@/components/manifests/manifest-sign-button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronRight, Download, Shield, CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";
import type { ManifestJson, ManifestAgentEntry } from "@/lib/manifests";

export const dynamic = "force-dynamic";

const MANIFEST_STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  PROPOSED: { label: "Proposed", class: "bg-blue-50 text-blue-700 border-blue-200" },
  SIGNED: { label: "Signed", class: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  SUPERSEDED: { label: "Superseded", class: "bg-muted text-muted-foreground border-border" },
};

const DISPOSITION_STYLES: Record<string, { border: string; bg: string; text: string }> = {
  KEEP: { border: "border-emerald-400", bg: "bg-emerald-50", text: "text-emerald-800" },
  DOWNSIZE: { border: "border-amber-400", bg: "bg-amber-50", text: "text-amber-800" },
  REPLACE: { border: "border-orange-400", bg: "bg-orange-50", text: "text-orange-800" },
  KILL: { border: "border-red-400", bg: "bg-red-50", text: "text-red-800" },
};

export default async function ManifestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const engagement = await getEngagement(id);
  if (!engagement) notFound();

  const stage = engagement.stage as "CENSUS" | "INVESTIGATION" | "REGISTRY" | "DEFENSE_FILES" | "CLOSED";

  if (stage === "CENSUS" || stage === "INVESTIGATION") {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="border rounded-lg p-10 text-center text-muted-foreground">
          <p className="text-sm font-medium">Manifest not yet available</p>
          <p className="text-xs mt-1">
            Advance to the Registry stage and complete at least one Decision Governance Review to generate a manifest.
          </p>
        </div>
      </div>
    );
  }

  const [latest, history] = await Promise.all([
    getLatestManifest(id),
    getManifests(id),
  ]);

  const manifestJson = latest?.manifestJson as ManifestJson | undefined;
  const statusCfg = latest ? MANIFEST_STATUS_CONFIG[latest.manifestStatus] : null;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
        <Link href="/admin/engagements" className="hover:text-foreground">Engagements</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/admin/engagements/${id}`} className="hover:text-foreground">
          {engagement.companyName}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium">Governance Manifest</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-semibold">Governance Manifest</h1>
            {statusCfg && (
              <Badge variant="outline" className={`${statusCfg.class}`}>
                {statusCfg.label}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {engagement.companyName} · DAL-X policy configuration
          </p>
          {latest && (
            <p className="text-xs text-muted-foreground mt-0.5">
              v{latest.version} · Generated{" "}
              {new Date(latest.generatedAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
              {latest.signedAt && latest.signedByName && (
                <> · Signed by {latest.signedByName}</>
              )}
            </p>
          )}
        </div>

        <div className="flex gap-2 flex-shrink-0 flex-wrap items-start">
          {latest?.manifestStatus === "PROPOSED" && (
            <ManifestSignButton engagementId={id} manifestId={latest.id} />
          )}
          <ManifestGenerateButton engagementId={id} hasExisting={!!latest} />
          <a
            href={`/api/engagements/${id}/registry/export?format=manifest`}
            className="inline-flex items-center gap-1.5 text-xs border rounded-md px-3 py-1.5 hover:bg-muted/40 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download JSON
          </a>
        </div>
      </div>

      {!latest ? (
        <div className="border rounded-lg p-10 text-center text-muted-foreground">
          <p className="text-sm">No manifest generated yet.</p>
          <p className="text-xs mt-1">Click &quot;Generate manifest&quot; to produce the initial DAL-X policy configuration.</p>
        </div>
      ) : (
        <>
          {/* Summary */}
          {manifestJson?.summary && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border rounded-lg px-5 py-4 bg-muted/20">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Agents</p>
                <p className="text-xl font-semibold mt-0.5">{manifestJson.summary.totalAgents}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Enforcement Ready</p>
                <p className="text-xl font-semibold mt-0.5">
                  {manifestJson.summary.enforcementReadyCount}
                  <span className="text-sm font-normal text-muted-foreground">/{manifestJson.summary.totalAgents}</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Disposition</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {Object.entries(manifestJson.summary.dispositionBreakdown)
                    .filter(([, count]) => count > 0)
                    .map(([disposition, count]) => (
                      <span key={disposition} className="text-xs text-muted-foreground">
                        {disposition}: {count}
                      </span>
                    ))}
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Agent entries */}
          {manifestJson?.agents && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Agent governance entries
              </h2>
              <div className="border rounded-lg divide-y">
                {manifestJson.agents.map((agent: ManifestAgentEntry, idx: number) => {
                  const dispStyle = agent.disposition ? DISPOSITION_STYLES[agent.disposition] : null;
                  return (
                    <div key={agent.agentId} className="p-5 space-y-4">
                      {/* Agent header */}
                      <div className="flex items-start gap-3">
                        <span className="text-xs font-mono text-muted-foreground mt-0.5">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {agent.enforcementReady ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            )}
                            <p className="text-sm font-medium">{agent.name}</p>
                            {dispStyle && agent.disposition && (
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${dispStyle.border} ${dispStyle.bg} ${dispStyle.text}`}
                              >
                                {agent.disposition}
                              </span>
                            )}
                            {agent.enforcementReady && (
                              <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-emerald-700 border-emerald-200 bg-emerald-50">
                                enforcement ready
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{agent.businessOutcome}</p>
                        </div>
                      </div>

                      {/* Default execution rule */}
                      <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Shield className="w-3 h-3 text-slate-500" />
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                            Default execution rule
                          </p>
                        </div>
                        <p className="text-xs text-slate-700">
                          {agent.defaultExecutionRule} — any execution class not listed in the authority matrix is denied
                        </p>
                      </div>

                      {/* Execution classes */}
                      {agent.executionClasses.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Execution classes ({agent.executionClasses.length})
                          </p>
                          <div className="border rounded-lg divide-y text-xs overflow-hidden">
                            {agent.executionClasses.map((ec) => (
                              <div key={ec.id} className="px-3 py-2.5 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium">{ec.action}</span>
                                  <span className="text-muted-foreground">→ {ec.target}</span>
                                  {ec.authority && (
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                                        ec.authority.level === "AUTO"
                                          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                          : ec.authority.level === "REVIEW"
                                            ? "border-blue-300 bg-blue-50 text-blue-700"
                                            : ec.authority.level === "ESCALATE"
                                              ? "border-amber-300 bg-amber-50 text-amber-700"
                                              : "border-red-300 bg-red-50 text-red-700"
                                      }`}
                                    >
                                      {ec.authority.level}
                                    </span>
                                  )}
                                  <span
                                    className={`text-[10px] ${ec.validationStatus === "VALIDATED" ? "text-emerald-700" : "text-amber-700"}`}
                                  >
                                    {ec.validationStatus === "VALIDATED" ? "validated" : "not validated"}
                                  </span>
                                </div>
                                <p className="text-muted-foreground line-clamp-1">{ec.scope}</p>
                                {ec.authority && (
                                  <p className="text-muted-foreground">
                                    {ec.authority.role}
                                    {ec.authority.holderName ? ` · ${ec.authority.holderName}` : ""}
                                  </p>
                                )}
                                {ec.authority?.runtimeSignal && (
                                  <p className="text-muted-foreground font-mono text-[10px]">
                                    Signal: {ec.authority.runtimeSignal}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Enforcement boundary */}
                      {agent.enforcementBoundary && (
                        <div className="space-y-1.5 text-xs">
                          <p className="font-medium text-muted-foreground uppercase tracking-wide text-[10px]">
                            Enforcement boundary
                          </p>
                          <p>
                            <span className="text-muted-foreground">Boundary: </span>
                            {agent.enforcementBoundary.requiredBoundary}
                          </p>
                          <p>
                            <span className="text-muted-foreground">DAL-X suitability: </span>
                            {agent.enforcementBoundary.dalxSuitability}
                          </p>
                          {agent.enforcementBoundary.integrationPoint && (
                            <p>
                              <span className="text-muted-foreground">Integration: </span>
                              {agent.enforcementBoundary.integrationPoint}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Enforcement blockers */}
                      {agent.enforcementReadyBlockers.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-[10px]">
                            Enforcement blockers
                          </p>
                          <ul className="text-xs text-amber-700 space-y-0.5 list-disc list-inside">
                            {agent.enforcementReadyBlockers.map((b, i) => (
                              <li key={i}>{b}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Disposition reasoning */}
                      {agent.dispositionReasoning && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-[10px]">
                            Disposition reasoning
                          </p>
                          <p className="text-xs text-muted-foreground leading-relaxed">{agent.dispositionReasoning}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Version history */}
          {history.length > 1 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Version history
                </h2>
                <div className="border rounded-lg divide-y text-xs">
                  {history.map((m) => {
                    const cfg = MANIFEST_STATUS_CONFIG[m.manifestStatus];
                    return (
                      <div key={m.id} className="px-4 py-3 flex items-center gap-3">
                        <span className="font-mono text-muted-foreground w-6">v{m.version}</span>
                        <Badge variant="outline" className={`text-[10px] h-4 px-1.5 ${cfg?.class ?? ""}`}>
                          {cfg?.label ?? m.manifestStatus}
                        </Badge>
                        <span className="text-muted-foreground">
                          {new Date(m.generatedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        {m.signedByName && (
                          <span className="text-muted-foreground">· Signed by {m.signedByName}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
