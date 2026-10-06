"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EnforcementBoundaryRow } from "./investigation-workspace";

type Props = {
  agentId: string;
  investigationId: string;
  boundary: EnforcementBoundaryRow;
  completedAt: string | null;
  onComplete: () => void;
  onUpdate: () => void;
};

type Suitability = "SUITABLE" | "PREREQUISITES_REQUIRED" | "NOT_SUITABLE";

const SUITABILITY_OPTIONS: { value: Suitability; label: string; description: string; style: string; activeStyle: string }[] = [
  {
    value: "SUITABLE",
    label: "Suitable",
    description: "A defined integration point and downstream validation point exist.",
    style: "border-border hover:border-foreground/30",
    activeStyle: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  },
  {
    value: "PREREQUISITES_REQUIRED",
    label: "Prerequisites required",
    description: "DAL-X may fit after a named issue is resolved.",
    style: "border-border hover:border-foreground/30",
    activeStyle: "border-amber-500/40 bg-amber-500/10 text-amber-400",
  },
  {
    value: "NOT_SUITABLE",
    label: "Not suitable",
    description: "No reliable integration or enforcement point exists.",
    style: "border-border hover:border-foreground/30",
    activeStyle: "border-red-500/40 bg-red-500/10 text-red-400",
  },
];

export function Section3EnforcementBoundary({
  agentId,
  investigationId,
  boundary,
  completedAt,
  onComplete,
  onUpdate,
}: Props) {
  const [form, setForm] = useState({
    executionPath: boundary?.executionPath ?? "",
    bypassPaths: boundary?.bypassPaths ?? "",
    requiredBoundary: boundary?.requiredBoundary ?? "",
    dalxSuitability: (boundary?.dalxSuitability ?? "") as Suitability | "",
    integrationPoint: boundary?.integrationPoint ?? "",
    requiredExecutionInfo: boundary?.requiredExecutionInfo ?? "",
    downstreamValidationPoint: boundary?.downstreamValidationPoint ?? "",
    blocker: boundary?.blocker ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(patch: Partial<typeof form>) {
    setForm((p) => ({ ...p, ...patch }));
  }

  async function save() {
    if (!form.executionPath.trim()) { setError("Execution path is required."); return; }
    if (!form.requiredBoundary.trim()) { setError("Required boundary is required."); return; }
    if (!form.dalxSuitability) { setError("Select a DAL-X suitability finding."); return; }
    if (!form.integrationPoint.trim()) { setError("Integration point is required."); return; }
    if (!form.downstreamValidationPoint.trim()) { setError("Downstream validation point is required."); return; }
    if ((form.dalxSuitability === "PREREQUISITES_REQUIRED" || form.dalxSuitability === "NOT_SUITABLE") && !form.blocker.trim()) {
      setError("Blocker is required when suitability is Prerequisites Required or Not Suitable.");
      return;
    }

    setSaving(true);
    setError(null);

    const res = await fetch(`/api/enforcement-boundary/${investigationId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentId,
        executionPath: form.executionPath,
        bypassPaths: form.bypassPaths || null,
        requiredBoundary: form.requiredBoundary,
        dalxSuitability: form.dalxSuitability,
        integrationPoint: form.integrationPoint,
        requiredExecutionInfo: form.requiredExecutionInfo || null,
        downstreamValidationPoint: form.downstreamValidationPoint,
        blocker: form.blocker || null,
      }),
    });

    setSaving(false);
    if (res.ok) {
      onUpdate();
    } else {
      setError("Failed to save enforcement boundary.");
    }
  }

  async function markSectionComplete() {
    setCompleting(true);
    await fetch(`/api/investigations/${agentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section3Complete: true }),
    });
    setCompleting(false);
    onComplete();
  }

  const canComplete = boundary && form.dalxSuitability && !saving;

  return (
    <div className="space-y-5 pt-1">
      <div className="text-sm text-muted-foreground leading-relaxed">
        Map the execution path, identify bypass paths, and determine the single required enforcement boundary. The record must identify whether DAL-X can be placed at that boundary and what the downstream system must validate.
      </div>

      {/* Execution path */}
      <div className="space-y-1.5">
        <Label>Execution path <span className="text-muted-foreground font-normal text-xs">(brief sequence)</span></Label>
        <Textarea
          className="min-h-[70px] resize-none text-sm"
          placeholder="e.g. AI agent → workflow orchestrator (n8n) → RCM API gateway → Payer API"
          value={form.executionPath}
          onChange={(e) => update({ executionPath: e.target.value })}
        />
      </div>

      {/* Bypass paths */}
      <div className="space-y-1.5">
        <Label>Bypass paths <span className="text-muted-foreground font-normal text-xs">(null if none identified)</span></Label>
        <Input
          className="h-9 text-sm"
          placeholder="e.g. Agent can call RCM API directly with service account key, bypassing orchestrator"
          value={form.bypassPaths}
          onChange={(e) => update({ bypassPaths: e.target.value })}
        />
      </div>

      {/* Required boundary */}
      <div className="space-y-1.5">
        <Label>Required enforcement boundary</Label>
        <Input
          className="h-9 text-sm"
          placeholder="e.g. RCM API gateway — every call path must pass through it"
          value={form.requiredBoundary}
          onChange={(e) => update({ requiredBoundary: e.target.value })}
        />
      </div>

      {/* DAL-X suitability */}
      <div className="space-y-2">
        <Label>DAL-X suitability finding</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {SUITABILITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => update({ dalxSuitability: opt.value })}
              className={cn(
                "border rounded-lg px-3 py-2.5 text-left transition-colors",
                form.dalxSuitability === opt.value ? opt.activeStyle : opt.style,
              )}
            >
              <p className="text-xs font-semibold">{opt.label}</p>
              <p className="text-[11px] mt-0.5 opacity-80 leading-snug">{opt.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Conditional: NOT_SUITABLE guidance */}
      {form.dalxSuitability === "NOT_SUITABLE" && (
        <div className="rounded-md border border-red-800 bg-red-950/30 px-3 py-2.5 text-xs text-red-300 space-y-1">
          <p className="font-medium">Sponsor decision required.</p>
          <p>Record the sponsor's choice: Suspend the consequential execution, establish a reliable enforcement boundary, or record an override accepting continued operation without that boundary. The enterprise owns the operating decision.</p>
        </div>
      )}

      {/* Integration point, required execution info, downstream validation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Integration point</Label>
          <Input
            className="h-9 text-sm"
            placeholder="e.g. RCM API gateway — /api/auth/submit endpoint"
            value={form.integrationPoint}
            onChange={(e) => update({ integrationPoint: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Downstream validation point</Label>
          <Input
            className="h-9 text-sm"
            placeholder="e.g. Payer API validates DAL-X auth token before processing"
            value={form.downstreamValidationPoint}
            onChange={(e) => update({ downstreamValidationPoint: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Required execution information <span className="text-muted-foreground font-normal text-xs">(what DAL-X needs to enforce at this boundary)</span></Label>
        <Input
          className="h-9 text-sm"
          placeholder="e.g. claim_id, claim_value, denial_code, execution_class_id"
          value={form.requiredExecutionInfo}
          onChange={(e) => update({ requiredExecutionInfo: e.target.value })}
        />
      </div>

      {/* Blocker — required for PREREQS and NOT_SUITABLE */}
      {(form.dalxSuitability === "PREREQUISITES_REQUIRED" || form.dalxSuitability === "NOT_SUITABLE") && (
        <div className="space-y-1.5">
          <Label>Blocker <span className="text-muted-foreground font-normal text-xs">(required)</span></Label>
          <Input
            className="h-9 text-sm"
            placeholder="e.g. API gateway does not currently expose execution metadata needed for token validation"
            value={form.blocker}
            onChange={(e) => update({ blocker: e.target.value })}
          />
        </div>
      )}

      {error && <p className="text-sm text-red-400 bg-red-950/30 border border-red-800 rounded px-3 py-2">{error}</p>}

      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={save} disabled={saving}>
          {saving && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
          Save boundary
        </Button>
        {canComplete && !completedAt && (
          <Button size="sm" onClick={markSectionComplete} disabled={completing}>
            {completing && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
            Mark Section 3 complete
          </Button>
        )}
      </div>

      {completedAt && (
        <div className="flex items-center gap-2 rounded-md border border-emerald-700/40 bg-emerald-500/5 px-3 py-2.5">
          <Lock className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
          <p className="text-xs text-emerald-400 font-medium">
            Section locked — boundary: {boundary?.requiredBoundary ?? "—"} · DAL-X: {boundary?.dalxSuitability === "SUITABLE" ? "suitable" : boundary?.dalxSuitability === "PREREQUISITES_REQUIRED" ? "prerequisites required" : "not suitable"}
          </p>
        </div>
      )}
    </div>
  );
}
