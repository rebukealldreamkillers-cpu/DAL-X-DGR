"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

type Disposition = "KEEP" | "DOWNSIZE" | "REPLACE" | "KILL";

export type RegistryWorkflow = {
  id: string;
  engagementId: string;
  name: string;
  businessOutcome: string;
  costPerCallUsd: string | null;
  monthlyCallVolume: number | null;
  investigation: {
    disposition: Disposition | null;
    dispositionReasoning: string | null;
    completedAt: string | null;
    sponsorName: string | null;
    analystName: string | null;
  } | null;
};

type Props = {
  workflows: RegistryWorkflow[];
};

const DISPOSITION_STYLES: Record<Disposition, { border: string; bg: string; text: string; label: string }> = {
  KEEP: { border: "border-emerald-400", bg: "bg-emerald-50", text: "text-emerald-800", label: "KEEP" },
  DOWNSIZE: { border: "border-amber-400", bg: "bg-amber-50", text: "text-amber-800", label: "DOWNSIZE" },
  REPLACE: { border: "border-orange-400", bg: "bg-orange-50", text: "text-orange-800", label: "REPLACE" },
  KILL: { border: "border-red-400", bg: "bg-red-50", text: "text-red-800", label: "KILL" },
};

function DispositionBadge({ disposition }: { disposition: Disposition }) {
  const s = DISPOSITION_STYLES[disposition];
  return (
    <span className={cn("inline-block px-2 py-0.5 rounded text-xs font-medium border", s.border, s.bg, s.text)}>
      {s.label}
    </span>
  );
}

export function RegistryTable({ workflows }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(
    workflows.find((w) => !w.investigation?.completedAt)?.id ?? null,
  );

  return (
    <div className="border rounded-lg overflow-hidden divide-y">
      {workflows.map((w, idx) => {
        const inv = w.investigation;
        const complete = !!inv?.completedAt;
        const expanded = expandedId === w.id;
        const monthly =
          w.costPerCallUsd && w.monthlyCallVolume
            ? parseFloat(w.costPerCallUsd) * w.monthlyCallVolume
            : null;

        return (
          <div key={w.id} className="bg-background">
            <button
              className="w-full px-5 py-4 flex items-start gap-3 text-left hover:bg-muted/30 transition-colors"
              onClick={() => setExpandedId(expanded ? null : w.id)}
            >
              <div className="mt-0.5 flex-shrink-0">
                {complete ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-muted-foreground">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm font-medium">{w.name}</span>
                  {complete && (
                    <Badge
                      variant="outline"
                      className="text-[10px] h-4 px-1.5 text-emerald-700 border-emerald-200 bg-emerald-50"
                    >
                      DGR complete
                    </Badge>
                  )}
                  {inv?.disposition && <DispositionBadge disposition={inv.disposition} />}
                </div>

                <div className="flex items-center gap-4 mt-1 flex-wrap">
                  {monthly !== null && (
                    <span className="text-xs text-muted-foreground">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                        maximumFractionDigits: 0,
                      }).format(monthly)}
                      /mo
                    </span>
                  )}
                  {inv?.sponsorName && (
                    <span className="text-xs text-muted-foreground">
                      Sponsor: {inv.sponsorName}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-shrink-0 mt-0.5 text-muted-foreground">
                {expanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </button>

            {expanded && (
              <div className="px-5 pb-5 border-t bg-muted/10 pt-4 space-y-4">
                {!inv?.completedAt && (
                  <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
                    Decision Governance Review not yet complete. Open the agent record to continue.
                  </div>
                )}

                {inv?.dispositionReasoning && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Disposition reasoning
                    </p>
                    <p className="text-sm leading-relaxed">{inv.dispositionReasoning}</p>
                  </div>
                )}

                {inv?.analystName && (
                  <p className="text-xs text-muted-foreground">
                    Analyst: {inv.analystName}
                  </p>
                )}

                <Link
                  href={`/admin/engagements/${w.engagementId}/workflows/${w.id}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-foreground underline underline-offset-2"
                >
                  Open decision record
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
