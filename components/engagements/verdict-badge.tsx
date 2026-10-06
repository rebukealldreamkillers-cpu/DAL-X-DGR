"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Posture = "KEEP" | "DOWNSIZE" | "REPLACE" | "KILL";

const POSTURE_STYLES: Record<Posture, string> = {
  KEEP: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  DOWNSIZE: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  REPLACE: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  KILL: "bg-red-500/10 text-red-400 border-red-500/30",
};

const POSTURE_LABELS: Record<Posture, string> = {
  KEEP: "Keep",
  DOWNSIZE: "Downsize",
  REPLACE: "Replace",
  KILL: "Kill",
};

export function PostureBadge({ posture }: { posture: Posture }) {
  return (
    <Badge variant="outline" className={cn("font-medium", POSTURE_STYLES[posture])}>
      {POSTURE_LABELS[posture]}
    </Badge>
  );
}

