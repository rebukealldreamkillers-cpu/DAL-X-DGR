"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExecutionClassRow } from "./investigation-workspace";

type Props = {
  agentId: string;
  investigationId: string;
  executionClasses: ExecutionClassRow[];
  completedAt: string | null;
  onComplete: () => void;
  onUpdate: () => void;
};

type AuthorityLevel = "AUTO" | "REVIEW" | "ESCALATE" | "DENY";

type AuthorityForm = {
  authorityLevel: AuthorityLevel | "";
  authorityRole: string;
  authorityBasis: string;
  currentHolderName: string;
  currentHolderTitle: string;
  evidenceRequirement: string;
  runtimeSignal: string;
};

const EMPTY_AUTHORITY: AuthorityForm = {
  authorityLevel: "",
  authorityRole: "",
  authorityBasis: "",
  currentHolderName: "",
  currentHolderTitle: "",
  evidenceRequirement: "",
  runtimeSignal: "",
};

const LEVEL_STYLES: Record<AuthorityLevel, { border: string; bg: string; text: string; label: string }> = {
  AUTO: { border: "border-emerald-500/40", bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Automatic" },
  REVIEW: { border: "border-blue-500/40", bg: "bg-blue-500/10", text: "text-blue-400", label: "Review required" },
  ESCALATE: { border: "border-amber-500/40", bg: "bg-amber-500/10", text: "text-amber-400", label: "Escalation required" },
  DENY: { border: "border-red-500/40", bg: "bg-red-500/10", text: "text-red-400", label: "Denied" },
};

function AuthorityLevelBadge({ level }: { level: AuthorityLevel }) {
  const s = LEVEL_STYLES[level];
  return (
    <span className={cn("inline-block px-2 py-0.5 rounded text-xs font-medium border", s.border, s.bg, s.text)}>
      {s.label}
    </span>
  );
}

export function Section2AuthorityMatrix({
  agentId,
  investigationId,
  executionClasses,
  completedAt,
  onComplete,
  onUpdate,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(
    executionClasses.find((ec) => !ec.authority)?.id ?? null,
  );
  const [forms, setForms] = useState<Record<string, AuthorityForm>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [completing, setCompleting] = useState(false);

  function getForm(ec: ExecutionClassRow): AuthorityForm {
    return (
      forms[ec.id] ?? {
        authorityLevel: ec.authority?.authorityLevel ?? "",
        authorityRole: ec.authority?.authorityRole ?? "",
        authorityBasis: ec.authority?.authorityBasis ?? "",
        currentHolderName: ec.authority?.currentHolderName ?? "",
        currentHolderTitle: ec.authority?.currentHolderTitle ?? "",
        evidenceRequirement: ec.authority?.evidenceRequirement ?? "",
        runtimeSignal: ec.authority?.runtimeSignal ?? "",
      }
    );
  }

  function updateForm(id: string, patch: Partial<AuthorityForm>) {
    setForms((p) => ({ ...p, [id]: { ...getForm(executionClasses.find((e) => e.id === id)!), ...forms[id], ...patch } }));
  }

  async function saveAuthority(ec: ExecutionClassRow) {
    const form = getForm(ec);
    if (!form.authorityLevel) { setErrors((p) => ({ ...p, [ec.id]: "Select an authority level." })); return; }
    if (!form.authorityRole.trim()) { setErrors((p) => ({ ...p, [ec.id]: "Authority role is required." })); return; }
    if (form.authorityLevel === "AUTO" && !form.authorityBasis.trim()) { setErrors((p) => ({ ...p, [ec.id]: "Authority basis is required for AUTO — name the policy or approved rule." })); return; }
    if ((form.authorityLevel === "REVIEW" || form.authorityLevel === "ESCALATE") && !form.currentHolderName.trim()) { setErrors((p) => ({ ...p, [ec.id]: "Current holder name is required for REVIEW and ESCALATE." })); return; }
    if (!form.evidenceRequirement.trim()) { setErrors((p) => ({ ...p, [ec.id]: "Evidence requirement is required." })); return; }
    if (!form.runtimeSignal.trim()) { setErrors((p) => ({ ...p, [ec.id]: "Runtime signal is required." })); return; }

    setSaving(ec.id);
    setErrors((p) => ({ ...p, [ec.id]: "" }));

    const res = await fetch(`/api/execution-classes/${ec.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        authority: {
          authorityLevel: form.authorityLevel,
          authorityRole: form.authorityRole,
          authorityBasis: form.authorityBasis || null,
          currentHolderName: form.currentHolderName || null,
          currentHolderTitle: form.currentHolderTitle || null,
          evidenceRequirement: form.evidenceRequirement,
          runtimeSignal: form.runtimeSignal,
        },
      }),
    });
    setSaving(null);
    if (res.ok) {
      setForms((p) => { const n = { ...p }; delete n[ec.id]; return n; });
      onUpdate();
    } else {
      setErrors((p) => ({ ...p, [ec.id]: "Failed to save." }));
    }
  }

  async function markSectionComplete() {
    setCompleting(true);
    await fetch(`/api/investigations/${agentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section2Complete: true }),
    });
    setCompleting(false);
    onComplete();
  }

  const allHaveAuthority = executionClasses.length > 0 && executionClasses.every((ec) => !!ec.authority);

  if (executionClasses.length === 0) {
    return (
      <div className="py-4 text-sm text-muted-foreground">
        Complete Section 1 (Execution Class Declaration) before assigning authority.
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-1">
      <div className="text-sm text-muted-foreground leading-relaxed">
        Assign authority to each execution class. Any class not assigned a level will be treated as DENIED at runtime. An AUTO class must name the policy or rule permitting automatic authorization — an empty authority field does not imply self-authorization.
      </div>

      <div className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-400">
        <strong className="text-zinc-300">Default rule:</strong> any execution class not listed in the authority matrix is DENIED.
      </div>

      <div className="border rounded-lg overflow-hidden divide-y">
        {executionClasses.map((ec) => {
          const expanded = expandedId === ec.id;
          const form = getForm(ec);
          const level = form.authorityLevel as AuthorityLevel | "";
          return (
            <div key={ec.id} className="bg-background">
              <button
                className="w-full px-4 py-3 flex items-start gap-3 text-left hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedId(expanded ? null : ec.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{ec.action}</span>
                    <span className="text-xs text-muted-foreground">→ {ec.target}</span>
                    {ec.authority ? (
                      <AuthorityLevelBadge level={ec.authority.authorityLevel} />
                    ) : (
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-slate-600 border-slate-300">No authority assigned</Badge>
                    )}
                  </div>
                  {ec.authority && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {ec.authority.authorityRole}
                      {ec.authority.currentHolderName ? ` · ${ec.authority.currentHolderName}` : ""}
                    </p>
                  )}
                </div>
                {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />}
              </button>

              {expanded && (
                <div className="px-4 pb-4 pt-2 border-t bg-muted/10 space-y-4">
                  {/* Authority level selector */}
                  <div className="space-y-2">
                    <Label className="text-xs">Authority level</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(["AUTO", "REVIEW", "ESCALATE", "DENY"] as AuthorityLevel[]).map((l) => {
                        const s = LEVEL_STYLES[l];
                        return (
                          <button
                            key={l}
                            onClick={() => updateForm(ec.id, { authorityLevel: l })}
                            className={cn(
                              "border rounded-md px-2.5 py-2 text-left text-xs transition-colors",
                              level === l ? `${s.border} ${s.bg} ${s.text}` : "border-border hover:border-foreground/30",
                            )}
                          >
                            <p className="font-semibold">{l}</p>
                            <p className="text-[10px] mt-0.5 opacity-70">{s.label}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {level && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">
                          Authority role{" "}
                          <span className="text-muted-foreground">
                            {level === "AUTO" ? "(policy name)" : "(role title)"}
                          </span>
                        </Label>
                        <Input
                          className="h-8 text-sm"
                          placeholder={level === "AUTO" ? "e.g. Low-value claim auto-approval policy v2" : "e.g. RCM Operations Director"}
                          value={form.authorityRole}
                          onChange={(e) => updateForm(ec.id, { authorityRole: e.target.value })}
                        />
                      </div>

                      {level === "AUTO" && (
                        <div className="space-y-1">
                          <Label className="text-xs">Authority basis <span className="text-muted-foreground">(required for AUTO)</span></Label>
                          <Input
                            className="h-8 text-sm"
                            placeholder="e.g. Board-approved delegated authority schedule §4.2"
                            value={form.authorityBasis}
                            onChange={(e) => updateForm(ec.id, { authorityBasis: e.target.value })}
                          />
                        </div>
                      )}

                      {(level === "REVIEW" || level === "ESCALATE") && (
                        <>
                          <div className="space-y-1">
                            <Label className="text-xs">Current holder name</Label>
                            <Input
                              className="h-8 text-sm"
                              placeholder="e.g. Sarah Chen"
                              value={form.currentHolderName}
                              onChange={(e) => updateForm(ec.id, { currentHolderName: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Current holder title</Label>
                            <Input
                              className="h-8 text-sm"
                              placeholder="e.g. RCM Operations Director"
                              value={form.currentHolderTitle}
                              onChange={(e) => updateForm(ec.id, { currentHolderTitle: e.target.value })}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {level && (
                    <>
                      <div className="space-y-1">
                        <Label className="text-xs">Evidence requirement at execution time</Label>
                        <Textarea
                          className="min-h-[60px] resize-none text-sm"
                          placeholder="What must exist at the moment of execution before a decision is made?"
                          value={form.evidenceRequirement}
                          onChange={(e) => updateForm(ec.id, { evidenceRequirement: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Runtime identification signal</Label>
                        <Input
                          className="h-8 text-sm"
                          placeholder="e.g. action=submit_auth AND claim_value < 5000 AND denial_code IN (X12, X14)"
                          value={form.runtimeSignal}
                          onChange={(e) => updateForm(ec.id, { runtimeSignal: e.target.value })}
                        />
                      </div>
                    </>
                  )}

                  {errors[ec.id] && <p className="text-xs text-red-600">{errors[ec.id]}</p>}

                  {level && (
                    <Button size="sm" disabled={saving === ec.id} onClick={() => saveAuthority(ec)}>
                      {saving === ec.id && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                      Save authority
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {allHaveAuthority && !completedAt && (
        <Button size="sm" onClick={markSectionComplete} disabled={completing}>
          {completing && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
          Mark Section 2 complete
        </Button>
      )}

      {completedAt && (
        <p className="text-xs text-emerald-700 font-medium">Section 2 complete — authority assigned for all {executionClasses.length} class(es).</p>
      )}
    </div>
  );
}
