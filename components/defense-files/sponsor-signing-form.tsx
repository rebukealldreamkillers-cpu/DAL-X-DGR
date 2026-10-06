"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Posture = "KEEP" | "DOWNSIZE" | "REPLACE" | "KILL";

type Props = {
  token: string;
  sponsorName: string;
  agentName: string;
  disposition: string | null;
  analystName: string | null;
};

const POSTURE_LABELS: Record<Posture, string> = {
  KEEP: "Keep: investment justified",
  DOWNSIZE: "Downsize: lower-cost path",
  REPLACE: "Replace: insufficient evidence",
  KILL: "Kill: no evidence, no alternative",
};

export function SponsorSigningForm({ token, sponsorName, agentName, disposition, analystName }: Props) {
  const [decision, setDecision] = useState<"accept" | "override" | null>(null);
  const [overridePosture, setOverridePosture] = useState<Posture | null>(null);
  const [overrideRationale, setOverrideRationale] = useState("");
  const [name, setName] = useState(sponsorName);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [overridden, setOverridden] = useState(false);
  const [signedAt, setSignedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!decision) { setError("Select a decision."); return; }
    if (decision === "override") {
      if (!overridePosture) { setError("Select the governance posture you believe applies."); return; }
      if (!overrideRationale.trim()) { setError("Rationale is required when recording a departure."); return; }
      if (!name.trim()) { setError("Your name is required."); return; }
    }

    setSubmitting(true);
    setError(null);

    const body =
      decision === "accept"
        ? { action: "accept" }
        : {
            action: "override",
            posture: overridePosture!,
            rationale: overrideRationale,
            sponsorName: name,
          };

    const res = await fetch(`/api/sign/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSubmitting(false);

    if (res.ok) {
      setSignedAt(new Date().toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" }));
      setDone(true);
      setOverridden(decision === "override");
    } else {
      const d = await res.json();
      setError(d.error ?? "Failed to submit");
    }
  }

  if (done) {
    return (
      <div className="border rounded-lg p-6 space-y-5">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 flex-shrink-0" />
          <div>
            <h2 className="text-base font-semibold">
              {overridden ? "Departure recorded" : "Operating decision authorized"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">{signedAt}</p>
          </div>
        </div>

        <div className="border-t pt-4 space-y-2 text-sm">
          <div className="grid grid-cols-[7rem_1fr] gap-x-3 gap-y-1.5 text-xs">
            <span className="text-muted-foreground">Agent</span>
            <span>{agentName}</span>
            {disposition && (
              <>
                <span className="text-muted-foreground">Issued disposition</span>
                <span>{disposition}</span>
              </>
            )}
            {overridden && overridePosture && (
              <>
                <span className="text-muted-foreground">Sponsor posture</span>
                <span>{overridePosture} (departure from issued)</span>
              </>
            )}
            {analystName && (
              <>
                <span className="text-muted-foreground">Analyst</span>
                <span>{analystName}</span>
              </>
            )}
            {overridden && name && (
              <>
                <span className="text-muted-foreground">Recorded by</span>
                <span>{name}</span>
              </>
            )}
          </div>

          {overridden && overrideRationale && (
            <div className="pt-2 border-t space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Departure rationale (permanent record)</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{overrideRationale}</p>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          {overridden
            ? "Your stated rationale has been recorded as a permanent audit entry alongside the issued posture."
            : "Your authorization is recorded. The Defense File is now closed."}
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-5 space-y-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Your decision
      </p>

      {/* Decision selector */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          onClick={() => setDecision("accept")}
          className={cn(
            "border rounded-lg px-4 py-3 text-left transition-colors",
            decision === "accept"
              ? "border-foreground bg-foreground/5"
              : "border-border hover:border-foreground/30",
          )}
        >
          <p className="text-sm font-medium">Authorize operating decision</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            I confirm I have reviewed this investigation record and authorize the stated disposition
          </p>
        </button>
        <button
          onClick={() => setDecision("override")}
          className={cn(
            "border rounded-lg px-4 py-3 text-left transition-colors",
            decision === "override"
              ? "border-foreground bg-foreground/5"
              : "border-border hover:border-foreground/30",
          )}
        >
          <p className="text-sm font-medium">Record a departure</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            I believe a different posture applies
          </p>
        </button>
      </div>

      {/* Override fields */}
      {decision === "override" && (
        <div className="space-y-4 pt-1">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Your name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name (for the record)"
              className="max-w-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Governance posture you believe applies</Label>
            <div className="grid grid-cols-2 gap-2">
              {(["KEEP", "DOWNSIZE", "REPLACE", "KILL"] as Posture[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setOverridePosture(p)}
                  className={cn(
                    "border rounded-lg px-3 py-2 text-left text-xs transition-colors",
                    overridePosture === p
                      ? "border-foreground bg-foreground/5 font-medium"
                      : "border-border hover:border-foreground/30",
                  )}
                >
                  {POSTURE_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-400">
            This departure will be recorded as a permanent audit entry alongside the issued posture and cannot be deleted.
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rationale">Rationale for departure</Label>
            <Textarea
              id="rationale"
              value={overrideRationale}
              onChange={(e) => setOverrideRationale(e.target.value)}
              placeholder="Explain why the issued governance posture does not reflect the evidence as you understand it."
              className="min-h-[80px] resize-none"
            />
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-400 bg-red-950/30 border border-red-800 rounded px-3 py-2">
          {error}
        </p>
      )}

      <Button
        onClick={submit}
        disabled={submitting || !decision}
        className="w-full"
      >
        {submitting ? (
          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
        ) : (
          <CheckCircle2 className="w-4 h-4 mr-1.5" />
        )}
        {decision === "override" ? "Record departure" : "Authorize operating decision"}
      </Button>
    </div>
  );
}
