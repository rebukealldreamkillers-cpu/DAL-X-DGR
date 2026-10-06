"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FullInvestigation } from "./investigation-workspace";

type Disposition = "KEEP" | "DOWNSIZE" | "REPLACE" | "KILL";

type Props = {
  agentId: string;
  investigation: FullInvestigation;
  completedAt: string | null;
  onComplete: () => void;
  onUpdate: () => void;
};

const DISPOSITION_STYLES: Record<Disposition, { border: string; bg: string; text: string; label: string; description: string }> = {
  KEEP: { border: "border-emerald-500/40", bg: "bg-emerald-500/10", text: "text-emerald-400", label: "KEEP", description: "Investment justified, continue within approved boundary" },
  DOWNSIZE: { border: "border-amber-500/40", bg: "bg-amber-500/10", text: "text-amber-400", label: "DOWNSIZE", description: "Requirement real, mechanism overbuilt" },
  REPLACE: { border: "border-orange-500/40", bg: "bg-orange-500/10", text: "text-orange-400", label: "REPLACE", description: "Mechanism lacks evidence, implement alternative" },
  KILL: { border: "border-red-500/40", bg: "bg-red-500/10", text: "text-red-400", label: "KILL", description: "No evidence and no viable alternative" },
};

export function Section4Disposition({ agentId, investigation, completedAt, onComplete, onUpdate }: Props) {
  const [form, setForm] = useState({
    sponsorName: investigation.sponsorName ?? "",
    sponsorTitle: investigation.sponsorTitle ?? "",
    sponsorEmail: investigation.sponsorEmail ?? "",
    costPerCallUsd: investigation.costPerCallUsd ?? "",
    monthlyVolume: investigation.monthlyVolume?.toString() ?? "",
    riskNote: investigation.riskNote ?? "",
    alternativeNote: investigation.alternativeNote ?? "",
    disposition: investigation.disposition ?? ("" as Disposition | ""),
    dispositionReasoning: investigation.dispositionReasoning ?? "",
    analystName: investigation.analystName ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(patch: Partial<typeof form>) {
    setForm((p) => ({ ...p, ...patch }));
  }

  async function save() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/investigations/${agentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sponsorName: form.sponsorName || null,
        sponsorTitle: form.sponsorTitle || null,
        sponsorEmail: form.sponsorEmail || null,
        costPerCallUsd: form.costPerCallUsd || null,
        monthlyVolume: form.monthlyVolume ? parseInt(form.monthlyVolume) : null,
        riskNote: form.riskNote || null,
        alternativeNote: form.alternativeNote || null,
        disposition: form.disposition || null,
        dispositionReasoning: form.dispositionReasoning || null,
        analystName: form.analystName || null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      onUpdate();
    } else {
      setError("Failed to save.");
    }
  }

  async function markSectionComplete() {
    if (!form.disposition) { setError("Select a disposition before completing this section."); return; }
    if (!form.dispositionReasoning.trim()) { setError("Disposition reasoning is required."); return; }
    setCompleting(true);
    setError(null);
    // Save then mark complete
    const saveRes = await fetch(`/api/investigations/${agentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sponsorName: form.sponsorName || null,
        sponsorTitle: form.sponsorTitle || null,
        sponsorEmail: form.sponsorEmail || null,
        costPerCallUsd: form.costPerCallUsd || null,
        monthlyVolume: form.monthlyVolume ? parseInt(form.monthlyVolume) : null,
        riskNote: form.riskNote || null,
        alternativeNote: form.alternativeNote || null,
        disposition: form.disposition || null,
        dispositionReasoning: form.dispositionReasoning || null,
        analystName: form.analystName || null,
        section4Complete: true,
      }),
    });
    setCompleting(false);
    if (saveRes.ok) {
      onComplete();
    } else {
      setError("Failed to save.");
    }
  }

  return (
    <div className="space-y-6 pt-1">
      {/* Defense file sponsor */}
      <div className="space-y-3">
        <p className="text-sm font-medium">Defense file sponsor</p>
        <p className="text-xs text-muted-foreground">The named individual who will sign the decision record. Must be a person, not a department.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Name</Label>
            <Input className="h-8 text-sm" placeholder="e.g. Sarah Chen" value={form.sponsorName} onChange={(e) => update({ sponsorName: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Title</Label>
            <Input className="h-8 text-sm" placeholder="e.g. Chief Revenue Officer" value={form.sponsorTitle} onChange={(e) => update({ sponsorTitle: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Email</Label>
            <Input className="h-8 text-sm" type="email" placeholder="e.g. s.chen@company.com" value={form.sponsorEmail} onChange={(e) => update({ sponsorEmail: e.target.value })} />
          </div>
        </div>
      </div>

      {/* Cost inputs */}
      <div className="space-y-3">
        <p className="text-sm font-medium">Cost inputs</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Cost per call (USD)</Label>
            <Input
              className="h-8 text-sm"
              type="number"
              min={0}
              step={0.000001}
              placeholder="0.002"
              value={form.costPerCallUsd}
              onChange={(e) => update({ costPerCallUsd: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Monthly call volume</Label>
            <Input
              className="h-8 text-sm"
              type="number"
              min={0}
              placeholder="10000"
              value={form.monthlyVolume}
              onChange={(e) => update({ monthlyVolume: e.target.value })}
            />
          </div>
        </div>
        {form.costPerCallUsd && form.monthlyVolume && (
          <p className="text-xs text-muted-foreground">
            Monthly: ${(parseFloat(form.costPerCallUsd) * parseInt(form.monthlyVolume)).toLocaleString("en-US", { maximumFractionDigits: 0 })} ·{" "}
            Annual: ${(parseFloat(form.costPerCallUsd) * parseInt(form.monthlyVolume) * 12).toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </p>
        )}
      </div>

      {/* Risk conditions */}
      <div className="space-y-1.5">
        <Label>Risk conditions <span className="text-muted-foreground font-normal text-xs">(inputs to disposition reasoning)</span></Label>
        <Textarea
          className="min-h-[70px] resize-none text-sm"
          placeholder="Describe the risk conditions that informed the disposition decision."
          value={form.riskNote}
          onChange={(e) => update({ riskNote: e.target.value })}
        />
      </div>

      {/* Alternative mechanism note */}
      <div className="space-y-1.5">
        <Label>Alternative mechanism <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
        <Textarea
          className="min-h-[60px] resize-none text-sm"
          placeholder="If a lower-cost alternative exists, note it here as input to the disposition reasoning."
          value={form.alternativeNote}
          onChange={(e) => update({ alternativeNote: e.target.value })}
        />
      </div>

      {/* Disposition */}
      <div className="space-y-3">
        <p className="text-sm font-medium">Workflow disposition</p>
        <div className="grid grid-cols-2 gap-2.5">
          {(["KEEP", "DOWNSIZE", "REPLACE", "KILL"] as Disposition[]).map((d) => {
            const s = DISPOSITION_STYLES[d];
            return (
              <button
                key={d}
                onClick={() => update({ disposition: d })}
                className={cn(
                  "border rounded-lg px-3 py-2.5 text-left transition-colors",
                  form.disposition === d ? `${s.border} ${s.bg} ${s.text}` : "border-border hover:border-foreground/30",
                )}
              >
                <p className="text-xs font-semibold">{s.label}</p>
                <p className="text-[10px] mt-0.5 opacity-80 leading-snug">{s.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Disposition reasoning */}
      <div className="space-y-1.5">
        <Label>Disposition reasoning <span className="text-muted-foreground font-normal text-xs">(required)</span></Label>
        <Textarea
          className="min-h-[90px] resize-none text-sm"
          placeholder="Explain the disposition based on evidence from sections 1 through 3, cost data, and risk conditions above."
          value={form.dispositionReasoning}
          onChange={(e) => update({ dispositionReasoning: e.target.value })}
        />
      </div>

      {/* Analyst name */}
      <div className="space-y-1.5">
        <Label>Analyst name <span className="text-muted-foreground font-normal text-xs">(FDO completing this record)</span></Label>
        <Input className="h-8 text-sm max-w-xs" placeholder="Your name" value={form.analystName} onChange={(e) => update({ analystName: e.target.value })} />
      </div>

      {error && <p className="text-sm text-red-400 bg-red-950/30 border border-red-800 rounded px-3 py-2">{error}</p>}

      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={save} disabled={saving}>
          {saving && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
          Save draft
        </Button>
        {!completedAt && (
          <Button size="sm" onClick={markSectionComplete} disabled={completing}>
            {completing && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
            Complete decision record
          </Button>
        )}
      </div>

      {completedAt && (
        <div className="flex items-center gap-2 rounded-md border border-emerald-700/40 bg-emerald-500/5 px-3 py-2.5">
          <Lock className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
          <p className="text-xs text-emerald-400 font-medium">
            Decision record locked: {investigation.disposition ?? "none"}{investigation.analystName ? ` · ${investigation.analystName}` : ""}
          </p>
        </div>
      )}
    </div>
  );
}
