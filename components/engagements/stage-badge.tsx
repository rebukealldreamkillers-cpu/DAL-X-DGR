"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Stage = "CENSUS" | "INVESTIGATION" | "REGISTRY" | "DEFENSE_FILES" | "CLOSED";

const STAGE_STYLES: Record<Stage, string> = {
  CENSUS: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  INVESTIGATION: "bg-violet-500/10 text-violet-400 border-violet-500/30",
  REGISTRY: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  DEFENSE_FILES: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  CLOSED: "bg-zinc-700/30 text-zinc-400 border-zinc-600/30",
};

const STAGE_LABELS: Record<Stage, string> = {
  CENSUS: "Wk 1 · Census",
  INVESTIGATION: "Wk 2 · Investigation",
  REGISTRY: "Wk 3 · Registry",
  DEFENSE_FILES: "Wk 4 · Defense Files",
  CLOSED: "Closed",
};

export function StageBadge({ stage }: { stage: Stage }) {
  return (
    <Badge variant="outline" className={cn("font-medium text-xs", STAGE_STYLES[stage])}>
      {STAGE_LABELS[stage]}
    </Badge>
  );
}
