import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { ICPSection } from "@/components/sections/ICPSection";
import { BeforeAfter } from "@/components/sections/BeforeAfter";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { InstallButton } from "@/components/InstallButton";

export const metadata: Metadata = {
  title: "Writing Twin for Non-Native English Speakers — Sound Confident & Professional",
  description:
    "Non-native English speaker? Writing Twin makes your emails and messages sound confident and professional — while keeping your authentic voice. Free Chrome extension.",
};

export default function NonNativeEnglishPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      <Nav />

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill bg-primary-50 border border-primary-100 text-primary-600 text-xs font-medium mb-6">
          For Non-Native English Professionals
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-ink dark:text-white leading-tight mb-6">
          You think in two languages.
          <br />
          <span className="text-primary-500">Your emails should too.</span>
        </h1>
        <p className="text-lg text-neutral-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Writing Twin is built for professionals who work in English but don&apos;t think in
          English first. It doesn&apos;t replace your voice — it makes your voice fluent.
          Natural, confident, and unmistakably you — not a generic AI.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-4">
          <InstallButton location="non_native_hero" size="lg" />
          <a href="#see-it-work" className="btn-secondary text-base px-7 h-12">
            See it in action
          </a>
        </div>
        <p className="text-xs text-neutral-400">Free: 20 rewrites/month · No credit card</p>
      </section>

      <ICPSection />

      {/* Problem / solution */}
      <section id="see-it-work" className="py-24 max-w-4xl mx-auto px-4 sm:px-6">
        <h2 className="text-3xl font-bold text-center text-ink dark:text-white mb-4">
          The difference between &ldquo;correct&rdquo; and &ldquo;natural&rdquo;
        </h2>
        <p className="text-center text-neutral-500 mb-12 leading-relaxed">
          Grammar checkers make your English correct. Writing Twin makes it natural — and
          still yours. Here&apos;s what that looks like.
        </p>
        <BeforeAfter />
      </section>

      {/* 3 specific pain points */}
      <section className="bg-neutral-50 dark:bg-neutral-800/50 py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-center text-ink dark:text-white mb-12">
            Sound confident in every message
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                emoji: "📧",
                title: "Emails that get replies",
                body: "Stop writing overly formal emails that make you seem distant. Writing Twin matches your warmth and directness — so recipients respond.",
              },
              {
                emoji: "💼",
                title: "LinkedIn that sounds like you",
                body: "Your LinkedIn messages won't sound like a template anymore. Writing Twin keeps your personality while making you sound polished.",
              },
              {
                emoji: "⚡",
                title: "30-second fix, not 30 minutes",
                body: "Stop spending half an hour editing every important email. Write the rough draft, click once, done. Your voice, instantly.",
              },
            ].map((item) => (
              <div key={item.title} className="card p-6">
                <div className="text-3xl mb-4">{item.emoji}</div>
                <h3 className="font-semibold text-ink dark:text-white mb-2">{item.title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FinalCTA />
      <SiteFooter />
    </div>
  );
}
