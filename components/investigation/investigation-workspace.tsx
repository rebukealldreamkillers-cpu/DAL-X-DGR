"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle2, Circle, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Section1ExecutionClasses } from "./section1-execution-classes";
import { Section2AuthorityMatrix } from "./section2-authority-matrix";
import { Section3EnforcementBoundary } from "./section3-enforcement-boundary";
import { Section4Disposition } from "./section4-disposition";

export type ExecutionClassRow = {
  id: string;
  investigationId: string;
  agentId: string;
  action: string;
  target: string;
  scope: string;
  consequenceRationale: string;
  validationStatus: "VALIDATED" | "NOT_VALIDATED";
  validatedBy: string | null;
  validationEvidence: string | null;
  validationDate: string | null;
  authority: {
    id: string;
    authorityLevel: "AUTO" | "REVIEW" | "ESCALATE" | "DENY";
    authorityRole: string;
    authorityBasis: string | null;
    currentHolderName: string | null;
    currentHolderTitle: string | null;
    evidenceRequirement: string;
    runtimeSignal: string;
  } | null;
};

export type EnforcementBoundaryRow = {
  id: string;
  executionPath: string;
  bypassPaths: string | null;
  requiredBoundary: string;
  dalxSuitability: "SUITABLE" | "PREREQUISITES_REQUIRED" | "NOT_SUITABLE";
  integrationPoint: string;
  requiredExecutionInfo: string | null;
  downstreamValidationPoint: string;
  blocker: string | null;
  sponsorDecision: string | null;
  sponsorDecisionNote: string | null;
} | null;

export type FullInvestigation = {
  id: string;
  agentId: string;
  sponsorName: string | null;
  sponsorTitle: string | null;
  sponsorEmail: string | null;
  costPerCallUsd: string | null;
  monthlyVolume: number | null;
  riskNote: string | null;
  alternativeNote: string | null;
  disposition: "KEEP" | "DOWNSIZE" | "REPLACE" | "KILL" | null;
  dispositionReasoning: string | null;
  analystName: string | null;
  section1CompletedAt: string | null;
  section2CompletedAt: string | null;
  section3CompletedAt: string | null;
  section4CompletedAt: string | null;
  completedAt: string | null;
  executionClasses: ExecutionClassRow[];
  enforcementBoundary: EnforcementBoundaryRow;
};

type SectionMeta = {
  id: string;
  num: number;
  title: string;
  establishes: string;
  completedKey: keyof FullInvestigation;
};

const SECTIONS: SectionMeta[] = [
  {
    id: "s1",
    num: 1,
    title: "Execution Classes",
    establishes: "Declare and validate what this agent does — each distinct action, target system, and scope boundary.",
    completedKey: "section1CompletedAt",
  },
  {
    id: "s2",
    num: 2,
    title: "Authority Matrix",
    establishes: "Establish the authority level, role, and current holder for each execution class. Unlisted classes are DENIED by default.",
    completedKey: "section2CompletedAt",
  },
  {
    id: "s3",
    num: 3,
    title: "Enforcement Boundary",
    establishes: "Map the execution path, identify bypass risks, and determine whether DAL-X can be placed at the required boundary.",
    completedKey: "section3CompletedAt",
  },
  {
    id: "s4",
    num: 4,
    title: "Disposition & Record",
    establishes: "Record cost inputs, risk conditions, and the governance disposition. Complete the signed decision record.",
    completedKey: "section4CompletedAt",
  },
];

function getSectionFinding(s: SectionMeta, inv: FullInvestigation): string | null {
  if (s.id === "s1") {
    const total = inv.executionClasses.length;
    const validated = inv.executionClasses.filter((ec) => ec.validationStatus === "VALIDATED").length;
    return `${total} class${total !== 1 ? "es" : ""} declared · ${validated} validated`;
  }
  if (s.id === "s2") {
    const total = inv.executionClasses.length;
    return `Authority assigned for all ${total} class${total !== 1 ? "es" : ""}`;
  }
  if (s.id === "s3" && inv.enforcementBoundary) {
    const b = inv.enforcementBoundary;
    const suit =
      b.dalxSuitability === "SUITABLE"
        ? "DAL-X suitable"
        : b.dalxSuitability === "PREREQUISITES_REQUIRED"
        ? "prerequisites required"
        : "not suitable";
    return `${b.requiredBoundary} · ${suit}`;
  }
  if (s.id === "s4") {
    const disp = inv.disposition ?? "pending";
    return `Disposition: ${disp}${inv.analystName ? ` · ${inv.analystName}` : ""}`;
  }
  return null;
}

function firstIncomplete(inv: FullInvestigation): string {
  for (const s of SECTIONS) {
    if (!inv[s.completedKey]) return s.id;
  }
  return "s4";
}

type Props = {
  agentId: string;
  investigation: FullInvestigation;
};

export function InvestigationWorkspace({ agentId, investigation: initial }: Props) {
  const router = useRouter();
  const [investigation] = useState(initial);
  const [openItem, setOpenItem] = useState<string[]>([firstIncomplete(initial)]);

  const completedCount = SECTIONS.filter((s) => !!investigation[s.completedKey]).length;

  const handleSectionComplete = useCallback(
    (sectionId: string) => {
      const idx = SECTIONS.findIndex((s) => s.id === sectionId);
      const next = SECTIONS[idx + 1];
      if (next) setOpenItem([next.id]);
      router.refresh();
    },
    [router],
  );

  const handleUpdate = useCallback(() => {
    router.refresh();
  }, [router]);

  return (
    <div className="space-y-4">
      {/* Formal record header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Investigation Record
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {completedCount === 4 ? "complete" : `${completedCount}/4 sections`}
          </span>
        </div>

        {/* Phase navigation strip */}
        <div className="grid grid-cols-4 rounded-lg border overflow-hidden divide-x">
          {SECTIONS.map((s) => {
            const done = !!investigation[s.completedKey];
            const active = openItem.includes(s.id);
            return (
              <button
                key={s.id}
                onClick={() =>
                  setOpenItem(
                    active
                      ? openItem.filter((i) => i !== s.id)
                      : [...openItem.filter((i) => i !== s.id), s.id],
                  )
                }
                className={cn(
                  "px-2 py-2 text-left transition-colors",
                  done
                    ? "bg-emerald-500/10 hover:bg-emerald-500/15"
                    : active
                    ? "bg-muted/50"
                    : "hover:bg-muted/20",
                )}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  {done ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <span
                      className={cn(
                        "w-3 h-3 rounded-full border flex-shrink-0",
                        active ? "border-foreground/60 bg-foreground/10" : "border-border",
                      )}
                    />
                  )}
                  <span className="text-[10px] font-mono text-muted-foreground">{s.num}</span>
                </div>
                <p
                  className={cn(
                    "text-[11px] font-medium leading-tight",
                    done ? "text-emerald-400" : active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {s.title}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <Accordion
        value={openItem}
        onValueChange={(v) => setOpenItem(v)}
        className="border rounded-lg overflow-hidden divide-y"
      >
        {SECTIONS.map((s) => {
          const done = !!investigation[s.completedKey];
          const finding = done ? getSectionFinding(s, investigation) : null;
          return (
            <AccordionItem key={s.id} value={s.id} className="border-0">
              <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/30 transition-colors [&>svg]:hidden">
                <div className="flex items-start gap-3 text-left w-full">
                  {done ? (
                    <Lock className="w-4 h-4 text-emerald-500/70 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-muted-foreground">{s.num}</span>
                      <span className="text-sm font-medium">{s.title}</span>
                      {done && (
                        <Badge
                          variant="outline"
                          className="text-[10px] h-4 px-1.5 text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                        >
                          locked
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {finding ?? s.establishes}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-5 pb-5 pt-1">
                {s.id === "s1" && (
                  <Section1ExecutionClasses
                    agentId={agentId}
                    investigationId={investigation.id}
                    executionClasses={investigation.executionClasses}
                    completedAt={investigation.section1CompletedAt}
                    onComplete={() => handleSectionComplete("s1")}
                    onUpdate={handleUpdate}
                  />
                )}
                {s.id === "s2" && (
                  <Section2AuthorityMatrix
                    agentId={agentId}
                    investigationId={investigation.id}
                    executionClasses={investigation.executionClasses}
                    completedAt={investigation.section2CompletedAt}
                    onComplete={() => handleSectionComplete("s2")}
                    onUpdate={handleUpdate}
                  />
                )}
                {s.id === "s3" && (
                  <Section3EnforcementBoundary
                    agentId={agentId}
                    investigationId={investigation.id}
                    boundary={investigation.enforcementBoundary}
                    completedAt={investigation.section3CompletedAt}
                    onComplete={() => handleSectionComplete("s3")}
                    onUpdate={handleUpdate}
                  />
                )}
                {s.id === "s4" && (
                  <Section4Disposition
                    agentId={agentId}
                    investigation={investigation}
                    completedAt={investigation.section4CompletedAt}
                    onComplete={() => handleSectionComplete("s4")}
                    onUpdate={handleUpdate}
                  />
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
