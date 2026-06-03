import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "Writing Twin AI Support",
  description:
    "Get help with Writing Twin AI — account issues, billing, installation, Gmail integration, and feature questions.",
};

const SUPPORT_EMAIL = "support@writingtwinai.com";

const CATEGORIES = [
  { icon: "👤", label: "Account Issues" },
  { icon: "💳", label: "Billing & Subscription" },
  { icon: "🔑", label: "Login Problems" },
  { icon: "🔧", label: "Extension Installation" },
  { icon: "📧", label: "Gmail Integration" },
  { icon: "💡", label: "Feature Requests" },
  { icon: "🐛", label: "Bug Reports" },
];

const FAQS = [
  {
    q: "How do I install Writing Twin AI?",
    a: "Install the extension from the Chrome Web Store, then sign in with your Google account. Once installed, open any Gmail compose window and click the Humanize button in the toolbar.",
  },
  {
    q: "How does Writing DNA work?",
    a: "Writing DNA learns your personal communication style from writing samples you provide during onboarding. The more samples you add, the more accurately the extension captures your voice — your vocabulary, sentence rhythm, and tone.",
  },
  {
    q: "Does Writing Twin AI read my inbox?",
    a: "No. The extension only processes text when you explicitly click the Humanize button inside a compose window. It does not read, scan, or monitor your inbox or any other part of Gmail.",
  },
  {
    q: "Is my data sold to third parties?",
    a: "No. Writing Twin AI does not sell your personal data. Your writing samples and rewrite content are used solely to power your personal Writing DNA profile and improve your rewrite results.",
  },
  {
    q: "Which platforms are supported?",
    a: "Gmail is fully supported today. Outlook, LinkedIn, and HiWorks are on the roadmap and will be released in upcoming versions.",
  },
  {
    q: "How do I cancel my subscription?",
    a: "You can manage or cancel your subscription at any time from your account settings on the dashboard. Cancellations take effect at the end of your current billing period.",
  },
  {
    q: "Why is the Humanize button not showing in Gmail?",
    a: "Make sure the extension is enabled in Chrome (chrome://extensions) and that you are signed in to your Writing Twin AI account. Refreshing the Gmail tab after installation usually resolves this.",
  },
  {
    q: "How many rewrites do I get on the free plan?",
    a: "Free accounts include a limited number of rewrites per month. Upgrade to Pro for 300 rewrites per month and access to all tone modes.",
  },
];

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      <Nav />

      {/* Hero */}
      <div className="bg-gradient-to-b from-primary-50 to-white dark:from-neutral-800 dark:to-neutral-900 border-b border-neutral-100 dark:border-neutral-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14 text-center">
          <p className="text-xs font-semibold tracking-widest uppercase text-primary-500 mb-3">
            Support Center
          </p>
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-4 tracking-tight">
            How can we help?
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-base max-w-md mx-auto">
            Find answers below or reach us directly. We typically respond within 24–48 hours.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14 space-y-16">

        {/* Support categories */}
        <section>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-6">
            What do you need help with?
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {CATEGORIES.map(({ icon, label }) => (
              <a
                key={label}
                href="#contact"
                className="flex items-center gap-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700
                           hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-neutral-800
                           transition-colors duration-150 group"
              >
                <span className="text-xl">{icon}</span>
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                  {label}
                </span>
              </a>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-6">
            Frequently asked questions
          </h2>
          <div className="space-y-4">
            {FAQS.map(({ q, a }) => (
              <div
                key={q}
                className="rounded-xl border border-neutral-100 dark:border-neutral-800 p-5
                           bg-neutral-50 dark:bg-neutral-800/50"
              >
                <p className="font-semibold text-sm text-neutral-900 dark:text-white mb-2">{q}</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact support */}
        <section id="contact" className="rounded-2xl border border-primary-100 dark:border-primary-900/40
                            bg-gradient-to-br from-primary-50 to-white dark:from-primary-950/30 dark:to-neutral-900
                            p-8 text-center">
          <div className="text-3xl mb-4">✉️</div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
            Still need help?
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">
            Email us at{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-primary-500 hover:underline font-medium"
            >
              {SUPPORT_EMAIL}
            </a>
          </p>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-6">
            Typical response time: within 24–48 hours
          </p>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="btn-primary inline-flex"
          >
            Contact Support
          </a>
        </section>

      </div>

      {/* Footer links */}
      <div className="border-t border-neutral-100 dark:border-neutral-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 flex flex-wrap gap-4 text-xs text-neutral-400">
          <Link href="/" className="hover:text-neutral-600 dark:hover:text-neutral-300">
            Home
          </Link>
          <Link href="/privacy" className="hover:text-neutral-600 dark:hover:text-neutral-300">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-neutral-600 dark:hover:text-neutral-300">
            Terms of Service
          </Link>
          <span className="ml-auto">© {new Date().getFullYear()} Writing Twin AI</span>
        </div>
      </div>
    </div>
  );
}
