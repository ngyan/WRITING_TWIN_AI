import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Comparison } from "@/components/sections/Comparison";
import { BeforeAfter } from "@/components/sections/BeforeAfter";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { InstallButton } from "@/components/InstallButton";

export const metadata: Metadata = {
  title: "Writing Twin vs Grammarly — Voice vs Grammar",
  description:
    "Grammarly fixes grammar. Writing Twin fixes voice. See why professionals who use AI to draft messages need Writing Twin, not just Grammarly.",
};

export default function VsGrammarlyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      <Nav />

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill bg-primary-50 border border-primary-100 text-primary-600 text-xs font-medium mb-6">
          Writing Twin vs Grammarly
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-ink dark:text-white leading-tight mb-6">
          Grammarly fixes grammar.
          <br />
          <span className="text-primary-500">Writing Twin fixes voice.</span>
        </h1>
        <p className="text-lg text-neutral-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          If you use AI to draft messages, Grammarly won&apos;t help them sound like you.
          Writing Twin rewrites AI output in your specific voice — right inside Gmail,
          Outlook, LinkedIn, and Slack.
        </p>
        <InstallButton location="vs_grammarly_hero" size="lg" />
      </section>

      <BeforeAfter />
      <Comparison />

      {/* Differentiator callout */}
      <section className="py-16 max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-2xl font-bold text-ink dark:text-white mb-4">
          Use both — or just use the one that matters most to you.
        </h2>
        <p className="text-neutral-500 leading-relaxed mb-8">
          Grammarly catches typos. Writing Twin makes everything you write sound like a
          fluent, confident version of yourself. They solve different problems — but if you
          already sound grammatically correct and still sound like ChatGPT, you need Writing
          Twin.
        </p>
        <InstallButton location="vs_grammarly_mid" />
      </section>

      <FinalCTA />
      <SiteFooter />
    </div>
  );
}
