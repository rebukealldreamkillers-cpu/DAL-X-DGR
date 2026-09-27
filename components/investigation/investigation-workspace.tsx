"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle } from "lucide-react";
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
    title: "Execution Class Declaration",
    establishes: "Sponsor team declares what this agent does. FDO records validation status for each class.",
    completedKey: "section1CompletedAt",
  },
  {
    id: "s2",
    num: 2,
    title: "Authority Matrix",
    establishes: "Authority level, role, and current holder per execution class. Default rule: any unlisted class is DENIED.",
    completedKey: "section2CompletedAt",
  },
  {
    id: "s3",
    num: 3,
    title: "Enforcement Boundary",
    establishes: "Maps the execution path, identifies bypass paths, and determines DAL-X suitability at the required boundary.",
    completedKey: "section3CompletedAt",
  },
  {
    id: "s4",
    num: 4,
    title: "Business Value and Disposition",
    establishes: "Cost inputs, risk conditions, and the workflow disposition (KEEP / DOWNSIZE / REPLACE / KILL).",
    completedKey: "section4CompletedAt",
  },
];

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
  const [investigation, setInvestigation] = useState(initial);
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">DGR Decision Record</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {completedCount}/4 sections complete
            {completedCount === 4 && " · investigation complete"}
          </p>
        </div>
        <div className="flex gap-1">
          {SECTIONS.map((s) => (
            <div
              key={s.id}
              className={`w-2 h-2 rounded-full transition-colors ${
                investigation[s.completedKey]
                  ? "bg-foreground"
                  : openItem.includes(s.id)
                    ? "bg-foreground/40"
                    : "bg-border"
              }`}
            />
          ))}
        </div>
      </div>

      <Accordion
        value={openItem}
        onValueChange={(v) => setOpenItem(v)}
        className="border rounded-lg overflow-hidden divide-y"
      >
        {SECTIONS.map((s) => {
          const done = !!investigation[s.completedKey];
          return (
            <AccordionItem key={s.id} value={s.id} className="border-0">
              <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/30 transition-colors [&>svg]:hidden">
                <div className="flex items-start gap-3 text-left w-full">
                  {done ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-muted-foreground">S{s.num}</span>
                      <span className="text-sm font-medium">{s.title}</span>
                      {done && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-emerald-700 border-emerald-200 bg-emerald-50">
                          complete
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{s.establishes}</p>
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
