"use client";

import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";

function FadeIn({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    node.style.opacity = "0";
    node.style.transform = "translateY(28px)";
    node.style.transition = `opacity 0.85s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.85s cubic-bezier(0.16,1,0.3,1) ${delay}ms`;
    node.style.willChange = "opacity, transform";

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            node.style.opacity = "1";
            node.style.transform = "translateY(0)";
            observer.unobserve(node);
          }
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

const ACTS = [
  {
    n: "01",
    title: "We investigate",
    body: "Four sections per workflow. Evidence determines the proposed decision. Not assumption. Not pressure.",
  },
  {
    n: "02",
    title: "The sponsor decides",
    body: "The named executive accepts the finding or records a departure. No signed authority means no enforcement.",
  },
  {
    n: "03",
    title: "DAL-X enforces",
    body: "The signed Governance Manifest becomes runtime policy. Not when it is signed. When enforcementReady is true.",
  },
];

const STAKES = [
  "Workflows accumulate faster than accountability.",
  "The team that built it cannot objectively evaluate it.",
  "Without a signed authority chain, there is nothing to enforce.",
];

const SESSIONS = [
  {
    label: "SESSION 1",
    title: "Register and Classify",
    body: "Build the workflow registry. Name every owner. Record approximate cost. Assign the initial risk tier and preliminary disposition. Surface missing evidence and log who owns each open item. The FDO may flag preliminary kill candidates. The executive sponsor owns every final decision.",
  },
  {
    label: "SESSION 2",
    title: "Investigate",
    body: "Confirm every consequential execution class and mark each one validated or not. Assign the authority level: AUTO, REVIEW, ESCALATE, or DENY. Identify the enforcement boundary and assess DAL-X suitability. Record every blocker with a named owner. Missing evidence stays open. It is never converted into a favorable assumption.",
  },
  {
    label: "SESSION 3",
    title: "Decide and Sign",
    body: "The executive sponsor reviews each disposition, authority matrix, enforcement boundary, and required next action. The Governance Manifest is signed as the approved governance record. A signed manifest with unresolved blockers is signed evidence of the decision. It is not permission to begin enforcement.",
  },
];

const SECTIONS = [
  {
    num: "S1",
    title: "Execution Class Declaration",
    body: "Every action the workflow performs is named: what it does, where it reaches, what breaks if it acts incorrectly. Each class is validated by a named reviewer before authority can be assigned.",
  },
  {
    num: "S2",
    title: "Authority Matrix",
    body: "One entry per execution class. AUTO, REVIEW, ESCALATE, or DENY. The holder, the policy basis, the evidence required at runtime, and the DAL-X signal.",
  },
  {
    num: "S3",
    title: "Enforcement Boundary",
    body: "The execution path is mapped. DAL-X suitability is assessed: Suitable, Prerequisites Required, or Not Suitable. Each outcome requires a sponsor decision before the investigation closes.",
  },
  {
    num: "S4",
    title: "Business Value and Disposition",
    body: "Cost, volume, risk, and available alternatives. The evidence across all four sections determines the finding: Keep, Downsize, Replace, or Kill.",
  },
];

const VERDICTS = [
  {
    label: "KEEP",
    bar: "bg-emerald-500",
    ghost: "text-emerald-500",
    tag: "text-emerald-400",
    headline: "Maps to a real requirement. No simpler mechanism available.",
    body: "Retain within the approved authority limits. Keep and Downsize both require a signed Governance Manifest before continued execution is authorized.",
  },
  {
    label: "DOWNSIZE",
    bar: "bg-amber-500",
    ghost: "text-amber-500",
    tag: "text-amber-400",
    headline: "The requirement is real. The scope is wrong.",
    body: "Restrict execution to the approved reduced scope. The current mechanism uses more capacity or discretion than the requirement justifies.",
  },
  {
    label: "REPLACE",
    bar: "bg-orange-500",
    ghost: "text-orange-500",
    tag: "text-orange-400",
    headline: "Wrong mechanism for the requirement.",
    body: "Revoke authority from the current workflow. The approved alternative becomes the authorized execution path once it is implemented and validated.",
  },
  {
    label: "KILL",
    bar: "bg-red-600",
    ghost: "text-red-600",
    tag: "text-red-400",
    headline: "No authorized requirement. No viable path.",
    body: "Revoke all execution authority. The workflow remains blocked until decommissioning is confirmed and registration is formally closed.",
  },
];

const DELIVERABLES = [
  "Workflow Registry. Every workflow documented with owner, cost, risk tier, and preliminary disposition.",
  "Defense Files. One per workflow with four-section findings, verdict, sponsor decision, and approval date.",
  "Governance Manifest. The signed authority specification and machine-readable DAL-X configuration.",
  "Implementation Handoff. For Replace and Kill: revocation instructions, named owners, and verification responsibility.",
  "Missing Evidence Log. Every open item carried forward with a named owner until resolved.",
  "60-day checkpoint. Confirmation that required actions were carried out.",
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur border-b border-zinc-900">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-mono uppercase tracking-[0.25em] text-zinc-300">
              Jochanni Labs
            </p>
            <p className="text-base font-medium text-zinc-100 mt-0.5 hidden sm:block">
              Decision Governance Review
            </p>
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <Link
              href="/sign-in"
              className="hidden sm:block text-base text-zinc-300 hover:text-zinc-200 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/inquiry"
              className="bg-amber-600 text-zinc-950 font-bold text-sm sm:text-base px-4 sm:px-5 py-2 sm:py-2.5 hover:bg-amber-500 transition-colors"
            >
              Start an inquiry
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen bg-zinc-950 flex items-center overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
          }}
        />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-amber-600/8 blur-[160px] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6 py-20 sm:py-32 w-full">
          <FadeIn>
            <div className="hidden sm:flex items-center gap-4 mb-10">
              <span className="font-mono tracking-[0.3em] text-zinc-400 text-base uppercase">
                Jochanni Labs
              </span>
              <span className="h-px w-10 bg-amber-600/40" />
              <span className="font-mono tracking-[0.3em] text-zinc-400 text-base uppercase">
                Decision Governance Review
              </span>
            </div>
          </FadeIn>

          <FadeIn>
            <h1 className="text-5xl sm:text-7xl lg:text-[88px] font-black leading-[0.92] tracking-tight max-w-5xl">
              <span className="block text-zinc-100">Who authorized</span>
              <span className="block text-zinc-300">your AI workflows?</span>
            </h1>
          </FadeIn>

          <FadeIn delay={200}>
            <p className="text-zinc-400 text-lg max-w-xl leading-relaxed mt-8">
              One decision per workflow. Keep it, downsize it, replace it, or end it.
              Signed by a named executive. Enforceable by DAL-X.
            </p>
          </FadeIn>

          <FadeIn delay={380}>
            <div className="mt-12 flex flex-col sm:flex-row gap-4">
              <Link
                href="/inquiry"
                className="inline-flex items-center justify-center gap-2 bg-amber-600 text-zinc-950 font-bold text-base px-8 py-4 tracking-wide hover:bg-amber-500 transition-colors"
              >
                Start an inquiry
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 border border-zinc-800 text-zinc-300 font-medium text-base px-8 py-4 tracking-wide hover:bg-zinc-900 hover:border-zinc-700 transition-colors"
              >
                How it works
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Three-act strip */}
      <section className="bg-zinc-900 border-y border-zinc-800">
        <FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-zinc-800">
            {ACTS.map((act) => (
              <div key={act.n} className="bg-zinc-900 p-6 sm:p-10">
                <p className="text-7xl font-black text-amber-600/15 leading-none">
                  {act.n}
                </p>
                <p className="text-lg font-medium text-zinc-100 mt-3">
                  {act.title}
                </p>
                <p className="text-base text-zinc-300 mt-2 leading-relaxed max-w-xs">
                  {act.body}
                </p>
              </div>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* The stakes */}
      <section className="bg-black py-20 sm:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <FadeIn>
            <p className="font-mono text-base tracking-[0.3em] text-amber-500 uppercase mb-16">
              Why this exists
            </p>
          </FadeIn>
          <div>
            {STAKES.map((stake, i) => (
              <FadeIn key={i} delay={i * 120}>
                <div className="border-t border-zinc-900 py-8 sm:py-12 flex gap-6 sm:gap-8 items-baseline">
                  <span className="text-base font-mono text-zinc-700 flex-shrink-0">
                    0{i + 1}
                  </span>
                  <p className="text-3xl sm:text-4xl lg:text-5xl font-normal text-zinc-200 leading-tight tracking-tight max-w-3xl">
                    {stake}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Three working sessions */}
      <section id="how-it-works" className="bg-zinc-950 py-20 sm:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <FadeIn>
            <p className="font-mono text-base tracking-[0.3em] text-amber-500 uppercase">
              The process
            </p>
            <h2 className="text-4xl sm:text-5xl font-bold text-zinc-100 tracking-tight mt-3">
              Three sessions. Ten business days.
            </h2>
            <p className="text-zinc-400 text-base mt-4 max-w-lg leading-relaxed">
              The clock starts when the named sponsor, workflow owners, validators,
              and supporting evidence are confirmed. Not before.
            </p>
          </FadeIn>

          <div className="relative mt-20">
            <div className="absolute left-[11px] top-6 bottom-6 w-px bg-gradient-to-b from-amber-600/60 via-amber-600/20 to-transparent" />
            <div className="space-y-16">
              {SESSIONS.map((s, i) => (
                <FadeIn key={s.label} delay={i * 140}>
                  <div className="flex gap-6 sm:gap-10 items-start">
                    <div className="w-[22px] h-[22px] rounded-full bg-amber-600/20 border border-amber-600/50 flex items-center justify-center flex-shrink-0 relative z-10">
                      <span className="w-2 h-2 bg-amber-600 rounded-full" />
                    </div>
                    <div>
                      <p className="font-mono text-base text-amber-500 tracking-[0.2em] uppercase">
                        {s.label}
                      </p>
                      <p className="text-xl font-medium text-zinc-100 mt-1">
                        {s.title}
                      </p>
                      <p className="text-base text-zinc-300 leading-relaxed mt-3 max-w-2xl">
                        {s.body}
                      </p>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Four investigation sections */}
      <section className="bg-zinc-900 border-y border-zinc-800 py-20 sm:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <FadeIn>
            <p className="font-mono text-base tracking-[0.3em] text-amber-500 uppercase">
              The investigation
            </p>
            <h2 className="text-4xl sm:text-5xl font-bold text-zinc-100 tracking-tight mt-3">
              Four sections. Each one gates the next.
            </h2>
            <p className="text-zinc-300 text-base mt-4 max-w-lg leading-relaxed">
              The disposition cannot be confirmed until Sections 1 through 3 are complete.
            </p>
          </FadeIn>

          <FadeIn>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-zinc-800 mt-16">
              {SECTIONS.map((s) => (
                <div key={s.num} className="bg-zinc-900 p-6 sm:p-10">
                  <p className="text-5xl font-black text-zinc-700 leading-none">
                    {s.num}
                  </p>
                  <p className="text-lg font-medium text-zinc-100 mt-4">
                    {s.title}
                  </p>
                  <p className="text-base text-zinc-300 leading-relaxed mt-3">
                    {s.body}
                  </p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* The four decisions */}
      <section className="bg-black py-0">
        <div className="max-w-5xl mx-auto px-6 py-16 sm:py-24">
          <FadeIn>
            <p className="font-mono text-base tracking-[0.3em] text-amber-500 uppercase">
              The decisions
            </p>
            <h2 className="text-4xl sm:text-5xl font-bold text-zinc-100 tracking-tight mt-3">
              Four decisions. Each with a required response.
            </h2>
            <p className="text-zinc-300 text-base mt-4 max-w-2xl leading-relaxed">
              An override changes the client decision. It does not rewrite the original
              Jochanni Labs finding. Both remain separate, dated facts.
            </p>
          </FadeIn>
        </div>

        <div>
          {VERDICTS.map((v, i) => (
            <FadeIn key={v.label}>
              <div
                className={`relative bg-black ${
                  i === 0 ? "border-t border-zinc-900" : ""
                } border-b border-zinc-900`}
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${v.bar}`} />
                <div className="max-w-5xl mx-auto px-6 py-10 sm:py-14 pl-10 sm:pl-12 flex items-center gap-8 sm:gap-16">
                  <div
                    className={`text-[80px] sm:text-[120px] font-black leading-none tracking-tight opacity-10 ${v.ghost} hidden sm:block`}
                  >
                    {v.label}
                  </div>
                  <div>
                    <p
                      className={`text-base font-mono tracking-[0.3em] uppercase ${v.tag}`}
                    >
                      {v.label}
                    </p>
                    <p className="text-2xl font-medium text-zinc-100 mt-2">
                      {v.headline}
                    </p>
                    <p className="text-base text-zinc-400 leading-relaxed mt-3 max-w-xl">
                      {v.body}
                    </p>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Deliverables */}
      <section className="bg-zinc-950 py-20 sm:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <FadeIn>
            <p className="font-mono text-base tracking-[0.3em] text-amber-500 uppercase">
              What you receive
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 tracking-tight mt-3 max-w-3xl">
              The record that survives the conversation.
            </h2>
          </FadeIn>

          <FadeIn delay={120}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6 mt-16 max-w-4xl">
              {DELIVERABLES.map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-2 flex-shrink-0" />
                  <p className="text-base text-zinc-400 leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-black py-24 sm:py-40 text-center">
        <div className="max-w-3xl mx-auto px-6">
          <FadeIn>
            <p className="font-mono text-base tracking-[0.3em] text-zinc-400 uppercase">
              Ready
            </p>
            <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[0.95] mt-6">
              <span className="block text-zinc-100">No authority,</span>
              <span className="block text-amber-500">no execution.</span>
            </h2>
            <p className="text-zinc-300 text-base mt-8 max-w-sm mx-auto leading-relaxed">
              Three working sessions. Ten business days after evidence is received.
              Conducted under mutual NDA.
            </p>
            <Link
              href="/inquiry"
              className="inline-flex items-center justify-center gap-2 mt-10 bg-amber-600 text-zinc-950 font-bold px-10 py-5 text-base tracking-wide hover:bg-amber-500 transition-colors"
            >
              Start an inquiry
              <ArrowRight className="w-4 h-4" />
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-950 border-t border-zinc-900">
        <div className="max-w-5xl mx-auto px-6 py-12 flex justify-between flex-wrap gap-6">
          <div>
            <p className="text-zinc-400 font-medium">Jochanni Labs</p>
            <p className="text-zinc-400 text-base mt-1">
              Decision Governance Practice
            </p>
          </div>
          <div className="flex flex-wrap gap-6 sm:gap-8 items-center">
            <Link
              href="/inquiry"
              className="text-base text-zinc-400 hover:text-zinc-400 transition-colors"
            >
              Start a review
            </Link>
            <Link
              href="/sign-in"
              className="text-base text-zinc-400 hover:text-zinc-400 transition-colors"
            >
              Analyst sign in
            </Link>
            <Link
              href="/portal"
              className="text-base text-zinc-400 hover:text-zinc-400 transition-colors"
            >
              Client portal
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
