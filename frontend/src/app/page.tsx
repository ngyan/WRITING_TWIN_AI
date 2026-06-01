import Link from "next/link";
import { Nav } from "@/components/Nav";

const features = [
  {
    icon: "🧬",
    title: "Learns your voice",
    body: "Paste a few emails or messages. Writing Twin extracts your DNA — sentence rhythm, word choice, tone — and applies it to everything it writes.",
  },
  {
    icon: "✨",
    title: "Works where you write",
    body: "Chrome extension injects a single button into Gmail, LinkedIn, Slack, and Outlook. One click rewrites your draft in your voice.",
  },
  {
    icon: "🎯",
    title: "Sounds like you, not AI",
    body: "The output doesn't start with 'I hope this message finds you well.' It sounds like you after a good night's sleep.",
  },
];

const beforeAfter = {
  before: "Just wanted to circle back on the proposal we discussed. I think there are some synergies we should leverage going forward to maximize the value proposition.",
  after: "Hey — following up on the proposal. I think there's real overlap here and it's worth a proper conversation. Want to set up 30 minutes this week?",
};

const testimonials = [
  { quote: "I stopped sounding like a corporate email template.", name: "Sarah K.", role: "Product Manager" },
  { quote: "My LinkedIn posts finally sound like me, not ChatGPT.", name: "Marcus T.", role: "Founder" },
  { quote: "Every email I send now actually sounds like something I'd write.", name: "Priya N.", role: "Sales Lead" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      <Nav />

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill bg-primary-50 border border-primary-100 text-primary-600 text-xs font-medium mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
          Now in early access
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold text-ink dark:text-white leading-[1.05] tracking-tight mb-6">
          Write Like Yourself.<br />
          <span className="text-primary-500">Not Like AI.</span>
        </h1>
        <p className="text-lg text-neutral-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Writing Twin learns how you write — your voice, rhythm, and word choices — and rewrites
          AI-sounding text to sound exactly like you. One button in Gmail, LinkedIn, and Slack.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="https://chrome.google.com/webstore"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-base px-7 h-12"
          >
            ✦ Add to Chrome — it&apos;s free
          </Link>
          <Link href="/pricing" className="btn-secondary text-base px-7 h-12">
            See plans
          </Link>
        </div>
        <p className="text-xs text-neutral-400 mt-4">Free plan: 30 rewrites/day. No credit card required.</p>
      </section>

      {/* Before / After */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-24">
        <div className="grid sm:grid-cols-2 gap-4 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-700 shadow-card">
          <div className="p-6 bg-neutral-50 dark:bg-neutral-800">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">Before</p>
            <p className="text-sm text-neutral-500 font-mono leading-relaxed">{beforeAfter.before}</p>
          </div>
          <div className="p-6 bg-accent-50 dark:bg-neutral-700/50 border-l border-neutral-200 dark:border-neutral-600">
            <p className="text-xs font-semibold text-accent-600 uppercase tracking-widest mb-3">After ✦</p>
            <p className="text-sm text-neutral-800 dark:text-neutral-100 font-mono leading-relaxed">{beforeAfter.after}</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-neutral-50 dark:bg-neutral-800/50 py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-center text-ink dark:text-white mb-3">
            Built around one question
          </h2>
          <p className="text-neutral-500 text-center mb-12">
            Does the output sound like you wrote it — or like everyone else using AI?
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="card p-6">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-semibold text-ink dark:text-white mb-2">{f.title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 max-w-5xl mx-auto px-4 sm:px-6">
        <h2 className="text-2xl font-bold text-center text-ink dark:text-white mb-12">
          What early users say
        </h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div key={t.name} className="card p-6">
              <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed mb-4">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div>
                <p className="text-sm font-semibold text-ink dark:text-white">{t.name}</p>
                <p className="text-xs text-neutral-400">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-primary-500 py-20">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Stop sounding like everyone else using AI.
          </h2>
          <p className="text-primary-100 mb-8">
            Takes 2 minutes to set up. Your voice, every time.
          </p>
          <Link href="/register" className="inline-flex items-center gap-2 px-7 h-12 rounded-pill bg-white text-primary-600 font-semibold text-base hover:bg-primary-50 transition-colors duration-150 shadow-md">
            Start free — no card needed
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-100 dark:border-neutral-800 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
          <p>© {new Date().getFullYear()} Writing Twin AI. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/pricing" className="hover:text-neutral-600 transition-colors">Pricing</Link>
            <a href="mailto:support@writingtwinai.com" className="hover:text-neutral-600 transition-colors">Support</a>
            <Link href="/privacy" className="hover:text-neutral-600 transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
