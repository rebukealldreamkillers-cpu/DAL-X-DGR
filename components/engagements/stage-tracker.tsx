"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

type Stage = "CENSUS" | "INVESTIGATION" | "REGISTRY" | "DEFENSE_FILES" | "CLOSED";

type StageTimestamps = {
  census?: Date | string | null;
  investigation?: Date | string | null;
  registry?: Date | string | null;
  defenseFiles?: Date | string | null;
  closed?: Date | string | null;
};

const STEPS = [
  { stage: "CENSUS" as Stage, label: "Census", desc: "Map all in-flight AI workflows", tsKey: "census" as keyof StageTimestamps },
  { stage: "INVESTIGATION" as Stage, label: "Investigation", desc: "Four-section governance investigation per agent", tsKey: "investigation" as keyof StageTimestamps },
  { stage: "REGISTRY" as Stage, label: "Registry", desc: "One disposition per agent", tsKey: "registry" as keyof StageTimestamps },
  { stage: "DEFENSE_FILES" as Stage, label: "Defense Files", desc: "Signed accountability records", tsKey: "defenseFiles" as keyof StageTimestamps },
  { stage: "CLOSED" as Stage, label: "Closed", desc: "Governance Manifest delivered", tsKey: "closed" as keyof StageTimestamps },
];

const ORDER: Stage[] = ["CENSUS", "INVESTIGATION", "REGISTRY", "DEFENSE_FILES", "CLOSED"];

function stageIndex(stage: Stage) {
  return ORDER.indexOf(stage);
}

function fmtDate(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function StageTracker({
  currentStage,
  timestamps,
}: {
  currentStage: Stage;
  timestamps?: StageTimestamps;
}) {
  const currentIdx = stageIndex(currentStage);

  return (
    <ol className="flex items-start gap-0">
      {STEPS.map((step, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        const isLast = i === STEPS.length - 1;
        const ts = timestamps ? fmtDate(timestamps[step.tsKey]) : null;

        return (
          <li key={step.stage} className="flex-1 flex flex-col items-center">
            <div className="flex items-center w-full">
              {/* Connector left */}
              <div className={cn("flex-1 h-px", i === 0 ? "invisible" : done || active ? "bg-foreground" : "bg-border")} />

              {/* Circle */}
              <div
                className={cn(
                  "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center border-2 text-xs font-semibold transition-colors",
                  done
                    ? "bg-foreground border-foreground text-background"
                    : active
                    ? "bg-background border-foreground text-foreground"
                    : "bg-background border-border text-muted-foreground",
                )}
              >
                {done ? <Check className="w-3.5 h-3.5" /> : <span>{i + 1}</span>}
              </div>

              {/* Connector right */}
              <div className={cn("flex-1 h-px", isLast ? "invisible" : done ? "bg-foreground" : "bg-border")} />
            </div>

            {/* Label */}
            <div className="mt-2 text-center px-1">
              <p className={cn("text-xs font-medium", active ? "text-foreground" : done ? "text-foreground" : "text-muted-foreground")}>
                {step.label}
              </p>
              {ts && (i <= currentIdx) ? (
                <p className="text-[10px] text-muted-foreground mt-0.5">{ts}</p>
              ) : (
                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 hidden sm:block">{step.desc}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
