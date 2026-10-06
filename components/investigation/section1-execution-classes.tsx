"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, ChevronDown, ChevronUp, AlertTriangle, Lock } from "lucide-react";
import type { ExecutionClassRow } from "./investigation-workspace";

type Props = {
  agentId: string;
  investigationId: string;
  executionClasses: ExecutionClassRow[];
  completedAt: string | null;
  onComplete: () => void;
  onUpdate: () => void;
};

type AddFormState = {
  action: string;
  target: string;
  scope: string;
  consequenceRationale: string;
};

type ValidationFormState = {
  validatedBy: string;
  validationEvidence: string;
  validationDate: string;
};

const EMPTY_FORM: AddFormState = { action: "", target: "", scope: "", consequenceRationale: "" };

export function Section1ExecutionClasses({
  agentId,
  investigationId,
  executionClasses,
  completedAt,
  onComplete,
  onUpdate,
}: Props) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<AddFormState>(EMPTY_FORM);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [validationForms, setValidationForms] = useState<Record<string, ValidationFormState>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

  async function addExecutionClass() {
    if (!addForm.action.trim() || !addForm.target.trim() || !addForm.scope.trim() || !addForm.consequenceRationale.trim()) {
      setAddError("All fields are required.");
      return;
    }
    setAdding(true);
    setAddError(null);
    const res = await fetch("/api/execution-classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId, ...addForm }),
    });
    setAdding(false);
    if (res.ok) {
      setAddForm(EMPTY_FORM);
      setShowAddForm(false);
      onUpdate();
    } else {
      const body = await res.json();
      setAddError(body.errors ? JSON.stringify(body.errors) : "Failed to add execution class.");
    }
  }

  async function deleteClass(id: string) {
    await fetch(`/api/execution-classes/${id}`, { method: "DELETE" });
    onUpdate();
  }

  async function saveValidation(ec: ExecutionClassRow) {
    const form = validationForms[ec.id];
    if (!form?.validatedBy?.trim() || !form?.validationEvidence?.trim() || !form?.validationDate) {
      return;
    }
    setSaving(ec.id);
    const res = await fetch(`/api/execution-classes/${ec.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        validationStatus: "VALIDATED",
        validatedBy: form.validatedBy,
        validationEvidence: form.validationEvidence,
        validationDate: new Date(form.validationDate).toISOString(),
      }),
    });
    setSaving(null);
    if (res.ok) onUpdate();
  }

  async function markNotValidated(id: string) {
    setSaving(id);
    await fetch(`/api/execution-classes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ validationStatus: "NOT_VALIDATED", validatedBy: null, validationEvidence: null, validationDate: null }),
    });
    setSaving(null);
    onUpdate();
  }

  async function markSectionComplete() {
    setCompleting(true);
    await fetch(`/api/investigations/${agentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section1Complete: true }),
    });
    setCompleting(false);
    onComplete();
  }

  const allValidated = executionClasses.length > 0 && executionClasses.every((ec) => ec.validationStatus === "VALIDATED");
  const anyNotValidated = executionClasses.some((ec) => ec.validationStatus === "NOT_VALIDATED");

  return (
    <div className="space-y-4 pt-1">
      <div className="text-sm text-muted-foreground leading-relaxed">
        The workflow owner and technical owner declare each execution class. The FDO records validation status — whether the declared class was confirmed through documentation, logs, configuration, or examples of actual executions.
      </div>

      {/* Execution class list */}
      {executionClasses.length > 0 ? (
        <div className="border rounded-lg overflow-hidden divide-y">
          {executionClasses.map((ec) => {
            const expanded = expandedId === ec.id;
            const vf = validationForms[ec.id] ?? { validatedBy: ec.validatedBy ?? "", validationEvidence: ec.validationEvidence ?? "", validationDate: ec.validationDate ? ec.validationDate.slice(0, 10) : "" };
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
                      {ec.validationStatus === "VALIDATED" ? (
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-emerald-400 border-emerald-500/30 bg-emerald-500/10">Validated</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-amber-400 border-amber-500/30 bg-amber-500/10">Not validated</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">Scope: {ec.scope}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </button>

                {expanded && (
                  <div className="px-4 pb-4 pt-1 border-t bg-muted/10 space-y-4">
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div><span className="text-muted-foreground">Target:</span> {ec.target}</div>
                      <div><span className="text-muted-foreground">Scope:</span> {ec.scope}</div>
                      <div><span className="text-muted-foreground">Consequence rationale:</span> {ec.consequenceRationale}</div>
                    </div>

                    {ec.validationStatus === "NOT_VALIDATED" ? (
                      <div className="space-y-3 border-t pt-3">
                        <p className="text-xs font-medium">Record validation</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Validated by</Label>
                            <Input
                              className="h-8 text-xs"
                              placeholder="Name and role"
                              value={vf.validatedBy}
                              onChange={(e) => setValidationForms((p) => ({ ...p, [ec.id]: { ...vf, validatedBy: e.target.value } }))}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Validation date</Label>
                            <Input
                              className="h-8 text-xs"
                              type="date"
                              value={vf.validationDate}
                              onChange={(e) => setValidationForms((p) => ({ ...p, [ec.id]: { ...vf, validationDate: e.target.value } }))}
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Validation evidence</Label>
                          <Textarea
                            className="min-h-[60px] resize-none text-xs"
                            placeholder="Documentation, logs, configuration, or execution examples reviewed"
                            value={vf.validationEvidence}
                            onChange={(e) => setValidationForms((p) => ({ ...p, [ec.id]: { ...vf, validationEvidence: e.target.value } }))}
                          />
                        </div>
                        <Button
                          size="sm"
                          disabled={!vf.validatedBy || !vf.validationEvidence || !vf.validationDate || saving === ec.id}
                          onClick={() => saveValidation(ec)}
                        >
                          {saving === ec.id && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                          Mark validated
                        </Button>
                      </div>
                    ) : (
                      <div className="border-t pt-3 space-y-1 text-xs text-muted-foreground">
                        <div><span className="font-medium text-foreground">Validated by:</span> {ec.validatedBy}</div>
                        <div><span className="font-medium text-foreground">Evidence:</span> {ec.validationEvidence}</div>
                        <Button size="sm" variant="ghost" className="mt-2 h-7 text-xs" onClick={() => markNotValidated(ec.id)}>
                          Revert to not validated
                        </Button>
                      </div>
                    )}

                    <div className="border-t pt-3">
                      <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 h-7 text-xs" onClick={() => deleteClass(ec.id)}>
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Remove class
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-lg p-6 text-center text-muted-foreground">
          <p className="text-sm">No execution classes declared yet.</p>
          <p className="text-xs mt-1">Add each distinct action this agent can take.</p>
        </div>
      )}

      {/* Add form */}
      {showAddForm ? (
        <div className="border rounded-lg p-4 space-y-3 bg-muted/10">
          <p className="text-sm font-medium">Add execution class</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Action <span className="text-muted-foreground">(what it does)</span></Label>
              <Input className="h-8 text-sm" placeholder="e.g. Submit prior authorization request" value={addForm.action} onChange={(e) => setAddForm((p) => ({ ...p, action: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Target <span className="text-muted-foreground">(system or resource)</span></Label>
              <Input className="h-8 text-sm" placeholder="e.g. Payer API / EHR denial queue" value={addForm.target} onChange={(e) => setAddForm((p) => ({ ...p, target: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Scope <span className="text-muted-foreground">(parameters, data accessed, limits)</span></Label>
            <Input className="h-8 text-sm" placeholder="e.g. Claims under $5,000 with denial code X12 or X14" value={addForm.scope} onChange={(e) => setAddForm((p) => ({ ...p, scope: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Consequence rationale <span className="text-muted-foreground">(why consequential)</span></Label>
            <Textarea className="min-h-[60px] resize-none text-sm" placeholder="e.g. Submits financial claim on behalf of patient — incorrect submission causes claim denial and patient billing harm" value={addForm.consequenceRationale} onChange={(e) => setAddForm((p) => ({ ...p, consequenceRationale: e.target.value }))} />
          </div>
          {addError && <p className="text-xs text-red-600">{addError}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={addExecutionClass} disabled={adding}>
              {adding && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Add class
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setShowAddForm(false); setAddError(null); setAddForm(EMPTY_FORM); }}>Cancel</Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setShowAddForm(true)}>
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Add execution class
        </Button>
      )}

      {/* Not fully validated warning */}
      {anyNotValidated && (
        <div className="flex items-start gap-2 rounded-md border border-amber-700 bg-amber-950/20 px-3 py-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300">
            Some execution classes are not yet validated. If validation cannot be confirmed, the record must state: <em>Execution classes not fully validated. Additional technical review required.</em>
          </p>
        </div>
      )}

      {executionClasses.length > 0 && !completedAt && (
        <Button onClick={markSectionComplete} disabled={completing} size="sm">
          {completing && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
          Mark Section 1 complete
        </Button>
      )}

      {completedAt && (
        <div className="flex items-center gap-2 rounded-md border border-emerald-700/40 bg-emerald-500/5 px-3 py-2.5">
          <Lock className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
          <p className="text-xs text-emerald-400 font-medium">
            Section locked — {executionClasses.length} class{executionClasses.length !== 1 ? "es" : ""} declared, {executionClasses.filter((ec) => ec.validationStatus === "VALIDATED").length} validated
          </p>
        </div>
      )}
    </div>
  );
}
