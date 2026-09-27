import Link from "next/link";
import { ArrowRight, CheckCircle2, Shield } from "lucide-react";

const VERDICTS = [
  {
    label: "KEEP",
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
    description:
      "Maps to a real requirement. No simpler mechanism available. Retain within the approved authority limits.",
  },
  {
    label: "DOWNSIZE",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    description:
      "Real requirement — wrong scope or discretion. Restrict execution to the approved reduced scope.",
  },
  {
    label: "REPLACE",
    color: "text-orange-700",
    bg: "bg-orange-50 border-orange-200",
    description:
      "Wrong mechanism. Revoke authority and validate the approved alternative before production responsibility transfers.",
  },
  {
    label: "KILL",
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
    description:
      "Duplicative, unsupported, or no longer tied to an authorized requirement. Revoke and decommission.",
  },
];

const SESSIONS = [
  {
    label: "Session 1",
    title: "Register and Classify",
    description:
      "Build the workflow registry. Confirm owners, approximate cost, initial risk tier, preliminary disposition, and missing evidence. The FDO may identify preliminary KILL candidates. The executive sponsor owns every final decision.",
  },
  {
    label: "Session 2",
    title: "Investigate",
    description:
      "Confirm every consequential execution class, mark each VALIDATED or NOT VALIDATED, assign AUTO / REVIEW / ESCALATE / DENY, identify the enforcement boundary, assess DAL-X suitability, and record blockers. Missing evidence stays open with a named owner. It is never converted into a favorable assumption.",
  },
  {
    label: "Session 3",
    title: "Decide and Sign",
    description:
      "The executive sponsor reviews each disposition, authority matrix, enforcement boundary, and required next action. The Governance Manifest is signed as the approved governance record. A signed manifest with unresolved blockers is signed evidence of the decision — not permission to begin enforcement.",
  },
];

const SECTIONS = [
  {
    num: "S1",
    title: "Execution Class Declaration",
    text: "Every action the workflow performs is named — what it does, where it reaches, what breaks if it acts incorrectly. Each class is validated by a named reviewer before authority can be assigned.",
  },
  {
    num: "S2",
    title: "Authority Matrix",
    text: "One authority entry per execution class: AUTO, REVIEW, ESCALATE, or DENY. Specifies the holder, policy basis, evidence required at runtime, and the DAL-X signal.",
  },
  {
    num: "S3",
    title: "Enforcement Boundary",
    text: "The execution path is mapped and DAL-X suitability is assessed. Three outcomes: Suitable, Prerequisites Required, or Not Suitable. Each requires a sponsor decision before the investigation closes.",
  },
  {
    num: "S4",
    title: "Business Value and Disposition",
    text: "Cost, volume, risk, and available alternatives. The evidence across all four sections determines the governance finding: Keep, Downsize, Replace, or Kill.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans">
      {/* Nav */}
      <nav className="border-b px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-400">Jochanni Labs</p>
          <p className="text-sm font-semibold leading-tight">Decision Governance Review</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/sign-in" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
            Sign in
          </Link>
          <Link
            href="/inquiry"
            className="text-sm bg-zinc-900 text-white px-4 py-2 rounded-lg hover:bg-zinc-700 transition-colors"
          >
            Start an inquiry →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-20 pb-16 text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-400 mb-4">
          Three working sessions · Ten business days · DAL-X enforced
        </p>
        <h1 className="text-4xl sm:text-5xl font-semibold leading-tight tracking-tight">
          Do your AI workflows operate under governance authority?
        </h1>
        <p className="mt-6 text-lg text-zinc-500 leading-relaxed max-w-2xl mx-auto">
          The Decision Governance Review produces one evidence-supported decision per workflow —
          Keep, Downsize, Replace, or Kill — and the signed authority requirements governing any
          continued execution. Three working sessions completed within ten business days after
          required evidence is received.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/inquiry"
            className="inline-flex items-center justify-center gap-2 bg-zinc-900 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-zinc-700 transition-colors"
          >
            Start an inquiry
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center justify-center gap-2 border border-zinc-200 px-6 py-3 rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors"
          >
            How it works
          </a>
        </div>
      </section>

      {/* Three-act principle */}
      <section className="border-y bg-zinc-950 text-zinc-100">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-400 mb-6">
            Three-act governance
          </p>
          <div className="grid sm:grid-cols-3 gap-6 text-sm">
            <div className="space-y-2">
              <span className="text-[10px] font-mono text-zinc-500">ACT 1</span>
              <p className="font-semibold text-zinc-100">Jochanni Labs assesses</p>
              <p className="text-zinc-400 leading-relaxed">
                Four investigation sections per workflow. Evidence determines the proposed
                disposition — not assumption.
              </p>
            </div>
            <div className="space-y-2">
              <span className="text-[10px] font-mono text-zinc-500">ACT 2</span>
              <p className="font-semibold text-zinc-100">Sponsor authorizes</p>
              <p className="text-zinc-400 leading-relaxed">
                The named executive sponsor accepts the disposition or records a stated departure.
                No authority, no enforcement.
              </p>
            </div>
            <div className="space-y-2">
              <span className="text-[10px] font-mono text-zinc-500">ACT 3</span>
              <p className="font-semibold text-zinc-100">DAL-X enforces</p>
              <p className="text-zinc-400 leading-relaxed">
                The signed Governance Manifest becomes the runtime policy when enforcementReady
                is true. DAL-X intercepts, escalates, and audits against it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem statement */}
      <section className="bg-zinc-50 border-y">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-400 mb-6">
            The problem
          </p>
          <div className="grid sm:grid-cols-3 gap-6 text-sm">
            <div className="space-y-2">
              <p className="font-semibold">AI workflows accumulate faster than governance.</p>
              <p className="text-zinc-500 leading-relaxed">
                Most organizations deploy AI workflows before establishing who authorized them,
                what they are permitted to do, and who is accountable if they act incorrectly.
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold">Internal review is not independent.</p>
              <p className="text-zinc-500 leading-relaxed">
                Teams that built the workflow are rarely positioned to evaluate whether it
                still earns its authority. Sunk cost reasoning and organizational pressure dominate.
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold">Enforcement requires authority.</p>
              <p className="text-zinc-500 leading-relaxed">
                A governance decision without a signed authority chain cannot be enforced.
                DAL-X requires a signed manifest with enforcementReady true before runtime
                interception activates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-3xl mx-auto px-6 py-16">
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-400 mb-2">
          How it works
        </p>
        <h2 className="text-2xl font-semibold mb-2">Three working sessions. One decision per workflow.</h2>
        <p className="text-sm text-zinc-500 mb-10 leading-relaxed">
          The ten business day window begins when the named sponsor, workflow owners, validators,
          and required evidence are confirmed.
        </p>
        <div className="space-y-6">
          {SESSIONS.map((s, i) => (
            <div key={i} className="flex gap-5">
              <div className="flex-shrink-0 w-20 pt-0.5">
                <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-400">{s.label}</p>
                <p className="text-xs font-semibold mt-0.5">{s.title}</p>
              </div>
              <div className="flex-1 border-l pl-5 pb-6">
                <p className="text-sm text-zinc-600 leading-relaxed">{s.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Four sections */}
      <section className="bg-zinc-50 border-y">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-400 mb-2">
            The investigation
          </p>
          <h2 className="text-2xl font-semibold mb-2">Four sections. Completed in order.</h2>
          <p className="text-sm text-zinc-500 mb-8 leading-relaxed">
            The disposition in Section 4 cannot be confirmed until Sections 1–3 are complete.
            A section with unresolved items remains open — it is never carried forward as complete.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {SECTIONS.map((s) => (
              <div key={s.num} className="flex gap-3 items-start border rounded-lg bg-white px-4 py-4">
                <span className="text-xs font-mono text-zinc-400 mt-0.5 flex-shrink-0">{s.num}</span>
                <div>
                  <p className="text-sm font-semibold text-zinc-800">{s.title}</p>
                  <p className="text-sm text-zinc-500 mt-1 leading-relaxed">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Four verdicts */}
      <section className="max-w-3xl mx-auto px-6 py-16">
        <div className="flex items-center gap-2 mb-2">
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">The decisions</p>
        </div>
        <div className="flex items-center gap-2 mb-8">
          <h2 className="text-2xl font-semibold">Four decisions. Each with a required response.</h2>
          <Shield className="w-5 h-5 text-zinc-400" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {VERDICTS.map((v) => (
            <div key={v.label} className={`border rounded-lg px-5 py-4 ${v.bg}`}>
              <p className={`text-sm font-bold tracking-wider ${v.color}`}>{v.label}</p>
              <p className="text-sm text-zinc-600 mt-1 leading-relaxed">{v.description}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-zinc-500 leading-relaxed">
          An override changes the client decision. It does not rewrite the original Jochanni Labs
          finding. Both remain separate, dated facts.
        </p>
      </section>

      {/* Deliverables */}
      <section className="bg-zinc-50 border-y">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-400 mb-2">
            Deliverables
          </p>
          <h2 className="text-2xl font-semibold mb-8">What you receive.</h2>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            {[
              "Workflow Registry — every workflow documented with owner, cost, risk tier, and preliminary disposition",
              "Defense Files — one per workflow: four-section findings, verdict, sponsor decision, and approval date",
              "Governance Manifest — signed authority specification and machine-readable DAL-X configuration",
              "Implementation Handoff — for Replace and Kill: revocation and closure instructions with named owners",
              "Missing Evidence Log — open items with named owners, carried forward until resolved",
              "60-day checkpoint — follow-up confirming whether required actions were carried out",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-zinc-600 leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h2 className="text-2xl font-semibold">Ready to govern your AI workflows?</h2>
        <p className="mt-3 text-zinc-500 text-sm leading-relaxed">
          Three working sessions. Ten business days after evidence is received.
          Conducted under mutual NDA. Response within one business day.
        </p>
        <Link
          href="/inquiry"
          className="inline-flex items-center gap-2 mt-6 bg-zinc-900 text-white px-7 py-3 rounded-lg text-sm font-medium hover:bg-zinc-700 transition-colors"
        >
          Start an inquiry
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-8">
        <div className="max-w-3xl mx-auto flex items-center justify-between flex-wrap gap-4 text-xs text-zinc-400">
          <div>
            <p className="font-medium text-zinc-600">Jochanni Labs</p>
            <p className="mt-0.5">Decision Governance Practice</p>
          </div>
          <div className="flex gap-6">
            <Link href="/inquiry" className="hover:text-zinc-600 transition-colors">Start a review</Link>
            <Link href="/sign-in" className="hover:text-zinc-600 transition-colors">Analyst sign in</Link>
            <Link href="/portal" className="hover:text-zinc-600 transition-colors">Client portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
