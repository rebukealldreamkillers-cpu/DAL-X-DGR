import { auth } from "@clerk/nextjs/server";
import { getDefenseFileWithFullData, getOrCreateDefenseFile } from "@/lib/defense-files";
import { NextResponse } from "next/server";

const DISPOSITION_COLORS: Record<string, string> = {
  KEEP: "#065f46",
  DOWNSIZE: "#92400e",
  REPLACE: "#9a3412",
  KILL: "#7f1d1d",
};

const DISPOSITION_BG: Record<string, string> = {
  KEEP: "#d1fae5",
  DOWNSIZE: "#fef3c7",
  REPLACE: "#ffedd5",
  KILL: "#fee2e2",
};

const AUTHORITY_LABELS: Record<string, string> = {
  AUTO: "Automatic",
  REVIEW: "Review required",
  ESCALATE: "Escalation required",
  DENY: "Denied",
};

const SUITABILITY_LABELS: Record<string, string> = {
  SUITABLE: "Suitable",
  PREREQUISITES_REQUIRED: "Prerequisites required",
  NOT_SUITABLE: "Not suitable",
};

function fmtDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function row(label: string, value: string | null | undefined): string {
  return `<tr><td style="padding:6px 12px 6px 0;color:#6b7280;white-space:nowrap;vertical-align:top;font-size:13px;">${label}</td><td style="padding:6px 0;font-size:13px;">${value ?? "—"}</td></tr>`;
}

export async function GET(
  _: Request,
  { params }: { params: Promise<{ workflowId: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { workflowId } = await params;
  const data = await getDefenseFileWithFullData(workflowId);
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const df = data.defenseFile ?? (await getOrCreateDefenseFile(workflowId));
  const inv = data.investigation;
  const eng = data.engagement;
  const disposition = inv?.disposition ?? null;

  const dispositionColor = disposition ? (DISPOSITION_COLORS[disposition] ?? "#111") : "#111";
  const dispositionBg = disposition ? (DISPOSITION_BG[disposition] ?? "#f3f4f6") : "#f3f4f6";

  // ── Execution Class Authority Matrix ────────────────────────────────────────
  const classes = inv?.executionClasses ?? [];
  const classRows = classes
    .map((ec, i) => {
      const auth = ec.authority;
      const levelLabel = auth ? (AUTHORITY_LABELS[auth.authorityLevel] ?? auth.authorityLevel) : "—";
      const holderText =
        auth?.currentHolderName
          ? `${auth.currentHolderName}${auth.currentHolderTitle ? `, ${auth.currentHolderTitle}` : ""}`
          : auth?.authorityBasis
            ? `Basis: ${auth.authorityBasis}`
            : "—";
      const validBadge =
        ec.validationStatus === "VALIDATED"
          ? `<span style="background:#d1fae5;color:#065f46;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600;">Validated</span>`
          : `<span style="background:#fee2e2;color:#7f1d1d;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600;">Not validated</span>`;
      return `
        <tr style="background:${i % 2 === 0 ? "#fff" : "#f9fafb"};">
          <td style="padding:10px;border:1px solid #e5e7eb;vertical-align:top;">
            <div style="font-weight:500;font-size:13px;">${ec.action}</div>
            <div style="color:#6b7280;font-size:12px;margin-top:2px;">Target: ${ec.target}</div>
            <div style="color:#6b7280;font-size:12px;">Scope: ${ec.scope}</div>
          </td>
          <td style="padding:10px;border:1px solid #e5e7eb;font-size:13px;vertical-align:top;">${levelLabel}</td>
          <td style="padding:10px;border:1px solid #e5e7eb;font-size:13px;vertical-align:top;">${holderText}</td>
          <td style="padding:10px;border:1px solid #e5e7eb;font-size:12px;vertical-align:top;color:#374151;">${auth?.runtimeSignal ?? "—"}</td>
          <td style="padding:10px;border:1px solid #e5e7eb;vertical-align:top;">${validBadge}</td>
        </tr>`;
    })
    .join("");

  const classMatrix =
    classes.length > 0
      ? `<table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:8px;">
          <thead><tr style="background:#f9fafb;">
            <th style="text-align:left;padding:8px 10px;border:1px solid #e5e7eb;">Execution Class</th>
            <th style="text-align:left;padding:8px 10px;border:1px solid #e5e7eb;">Authority Level</th>
            <th style="text-align:left;padding:8px 10px;border:1px solid #e5e7eb;">Authority Holder / Basis</th>
            <th style="text-align:left;padding:8px 10px;border:1px solid #e5e7eb;">Runtime Signal</th>
            <th style="text-align:left;padding:8px 10px;border:1px solid #e5e7eb;">Validation</th>
          </tr></thead>
          <tbody>${classRows}</tbody>
        </table>
        <p style="font-size:12px;color:#6b7280;margin-top:8px;font-style:italic;">Default rule: any execution class not listed above is DENIED.</p>`
      : `<p style="color:#6b7280;font-size:13px;">No execution classes declared.</p>`;

  // ── Enforcement Boundary ─────────────────────────────────────────────────────
  const boundary = inv?.enforcementBoundary;
  const suitabilityLabel = boundary
    ? (SUITABILITY_LABELS[boundary.dalxSuitability] ?? boundary.dalxSuitability)
    : null;
  const boundarySection = boundary
    ? `<table style="font-size:13px;width:100%;">
        ${row("Execution path", boundary.executionPath)}
        ${row("Bypass paths", boundary.bypassPaths ?? "None identified")}
        ${row("Required boundary", boundary.requiredBoundary)}
        ${row("DAL-X suitability", suitabilityLabel)}
        ${row("Integration point", boundary.integrationPoint)}
        ${row("Downstream validation", boundary.downstreamValidationPoint)}
        ${boundary.blocker ? row("Blocker", boundary.blocker) : ""}
        ${boundary.sponsorDecision ? row("Sponsor decision", boundary.sponsorDecision) : ""}
      </table>
      ${boundary.requiredExecutionInfo ? `<div style="margin-top:10px;font-size:13px;"><strong>Required execution info:</strong> ${boundary.requiredExecutionInfo}</div>` : ""}`
    : `<p style="color:#6b7280;font-size:13px;">Enforcement boundary analysis not completed.</p>`;

  // ── Signature section ────────────────────────────────────────────────────────
  const signatureSection = df?.signedAt
    ? `<div style="margin-top:32px;border:1px solid #e5e7eb;border-radius:8px;padding:20px;">
        <p style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#6b7280;margin:0 0 12px;">Signature Record</p>
        <table style="font-size:13px;">
          ${row("Status", df.status === "OVERRIDDEN" ? "Departure recorded" : "Accepted")}
          ${
            df.status === "OVERRIDDEN"
              ? `${row("Sponsor name", df.sponsorOverrideName)}
                 ${row("Override disposition", df.sponsorOverridePosture ?? "—")}
                 ${row("Override rationale", df.sponsorOverrideRationale)}
                 ${row("Recorded at", fmtDate(df.sponsorOverrideAt))}`
              : `${row("Signed at", fmtDate(df.signedAt))}
                 ${row("IP address", df.signedByIp)}`
          }
        </table>
      </div>`
    : `<div style="margin-top:32px;border:1px dashed #d1d5db;border-radius:8px;padding:20px;text-align:center;color:#6b7280;">
        <p style="margin:0;font-size:13px;">Awaiting sponsor signature</p>
        ${inv?.sponsorName ? `<p style="margin:4px 0 0;font-size:12px;">${inv.sponsorName}${inv.sponsorEmail ? ` · ${inv.sponsorEmail}` : ""}</p>` : ""}
      </div>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Decision Defense File: ${data.name}</title>
  <style>
    *{box-sizing:border-box;}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111;max-width:900px;margin:0 auto;padding:48px 40px;line-height:1.5;}
    h1{font-size:22px;font-weight:600;margin:0;}
    h2{font-size:13px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#6b7280;margin:32px 0 10px;}
    p{margin:0 0 8px;}
    .section{margin-bottom:28px;border:1px solid #e5e7eb;border-radius:8px;padding:20px;}
    .no-print{background:#111;color:#fff;border:none;padding:10px 20px;border-radius:6px;font-size:14px;cursor:pointer;margin-bottom:32px;}
    @media print{.no-print{display:none;}body{padding:24px;}}
  </style>
</head>
<body>
  <button class="no-print" onclick="window.print()">Print / Save as PDF</button>

  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;">
    <div>
      <p style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#6b7280;margin-bottom:4px;">Jochanni Labs · Decision Governance Review</p>
      <h1>Decision Defense File</h1>
      <p style="margin-top:4px;color:#374151;">${eng.companyName}</p>
    </div>
    <div style="text-align:right;font-size:12px;color:#6b7280;">
      <p style="margin:0;">Generated ${fmtDate(new Date())}</p>
      ${df?.trackingKey ? `<p style="margin:4px 0 0;">${df.trackingSystem?.toUpperCase() ?? "TICKET"} ${df.trackingKey}</p>` : ""}
    </div>
  </div>

  <div style="background:#f9fafb;border-radius:8px;padding:20px;margin-bottom:32px;">
    <p style="font-size:16px;font-weight:600;margin:0;">${data.name}</p>
    <p style="color:#6b7280;margin:4px 0 0;font-size:14px;">${data.businessOutcome}</p>
  </div>

  ${
    disposition
      ? `<div style="margin-bottom:32px;padding:20px;border-radius:8px;background:${dispositionBg};border:1px solid ${dispositionColor}40;">
          <p style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:${dispositionColor};margin:0 0 8px;font-weight:600;">Workflow Disposition</p>
          <span style="display:inline-block;padding:4px 12px;border-radius:9999px;font-size:13px;font-weight:600;background:${dispositionBg};color:${dispositionColor};">${disposition}</span>
          ${inv?.dispositionReasoning ? `<p style="margin:12px 0 0;font-size:13px;">${inv.dispositionReasoning}</p>` : ""}
        </div>`
      : ""
  }

  <h2>Defense File Sponsor</h2>
  <div class="section">
    <table style="font-size:13px;width:100%;">
      ${row("Name", inv?.sponsorName)}
      ${row("Title", inv?.sponsorTitle)}
      ${row("Email", inv?.sponsorEmail)}
    </table>
  </div>

  <h2>Execution Class Authority Matrix</h2>
  <div class="section">
    ${classMatrix}
  </div>

  <h2>Enforcement Boundary</h2>
  <div class="section">
    ${boundarySection}
  </div>

  <h2>Business Value</h2>
  <div class="section">
    <table style="font-size:13px;">
      ${row("Cost per call", inv?.costPerCallUsd ? `$${parseFloat(inv.costPerCallUsd).toFixed(4)}` : null)}
      ${row("Monthly volume", inv?.monthlyVolume?.toLocaleString() ?? null)}
    </table>
    ${inv?.riskNote ? `<div style="margin-top:12px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:13px;"><strong>Risk conditions:</strong> ${inv.riskNote}</div>` : ""}
    ${inv?.alternativeNote ? `<div style="margin-top:8px;font-size:13px;"><strong>Alternative mechanism:</strong> ${inv.alternativeNote}</div>` : ""}
  </div>

  ${signatureSection}

  <p style="margin-top:40px;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:16px;">
    This document is generated by Jochanni Labs Decision Governance Review platform. It is confidential and governed by the mutual NDA in place between Jochanni Labs and ${eng.companyName}.
  </p>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
