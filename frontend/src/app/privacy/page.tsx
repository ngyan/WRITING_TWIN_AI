import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "Privacy Policy — Writing Twin AI",
  description: "How Writing Twin AI collects, uses, and protects your data.",
};

const EFFECTIVE_DATE = "June 1, 2026";
const CONTACT_EMAIL = "support@writingtwinai.com";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      <Nav />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <Link href="/" className="text-xs text-neutral-400 hover:text-neutral-600 mb-8 inline-flex items-center gap-1">
          ← Back to home
        </Link>

        <h1 className="text-4xl font-bold text-ink dark:text-white mb-2">Privacy Policy</h1>
        <p className="text-sm text-neutral-400 mb-12">Effective date: {EFFECTIVE_DATE}</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none text-sm leading-relaxed space-y-8">

          <section>
            <h2 className="text-lg font-semibold text-ink dark:text-white mb-3">1. What we collect</h2>
            <ul className="space-y-2 text-neutral-600 dark:text-neutral-400 list-disc pl-5">
              <li><strong>Account info:</strong> email address and password (hashed with bcrypt) when you register.</li>
              <li><strong>Writing samples:</strong> text you paste into the DNA training flow. We store these to extract your writing style and personalize rewrites.</li>
              <li><strong>Rewrite content:</strong> input text and output text when you use the rewrite feature. This powers semantic caching and quality scoring.</li>
              <li><strong>Usage data:</strong> rewrite count, plan, timestamps — used to enforce plan limits and improve the service.</li>
              <li><strong>Payment info:</strong> handled entirely by Stripe. We never see or store your card number.</li>
              <li><strong>Analytics:</strong> anonymized product usage events via PostHog (page views, feature interactions). No personally identifiable information is sent.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink dark:text-white mb-3">2. How we use it</h2>
            <ul className="space-y-2 text-neutral-600 dark:text-neutral-400 list-disc pl-5">
              <li>Authenticate your account and enforce plan limits.</li>
              <li>Extract your Writing DNA profile and personalize rewrite output.</li>
              <li>Improve the AI models and service reliability.</li>
              <li>Send transactional emails (billing receipts, account alerts) — no marketing without consent.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink dark:text-white mb-3">3. Data sharing</h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              We do not sell your data. We share it only with:
            </p>
            <ul className="space-y-2 text-neutral-600 dark:text-neutral-400 list-disc pl-5 mt-2">
              <li><strong>LLM providers</strong> (Google, Anthropic) — your rewrite input is sent to generate output. These providers have their own data policies.</li>
              <li><strong>Stripe</strong> — payment processing only.</li>
              <li><strong>PostHog</strong> — anonymous analytics only.</li>
              <li><strong>Resend</strong> — transactional email delivery.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink dark:text-white mb-3">4. Data retention</h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              We retain your account data while your account is active. You can delete your Writing DNA profile at any time from the dashboard. Deleting your account removes all associated data within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink dark:text-white mb-3">5. Security</h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              All data is transmitted over TLS. Passwords are hashed with bcrypt. JWT tokens expire after 15 minutes. We use short-lived access tokens and never store them in cookies accessible to JavaScript.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink dark:text-white mb-3">6. Your rights</h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              You can request access to, correction of, or deletion of your personal data at any time by emailing{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary-500 hover:underline">{CONTACT_EMAIL}</a>.
              We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink dark:text-white mb-3">7. Chrome extension</h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              The Chrome extension reads text from the active browser tab (Gmail compose window, LinkedIn editor, Slack message box) only when you explicitly click the &ldquo;Humanize&rdquo; button. It does not continuously monitor your browsing. Text is sent to our API over HTTPS and is subject to the same data handling described above.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink dark:text-white mb-3">8. Changes</h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              We will notify you of material changes to this policy by email or by posting a notice on the dashboard. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink dark:text-white mb-3">9. Contact</h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              Questions or requests:{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary-500 hover:underline">{CONTACT_EMAIL}</a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-neutral-100 dark:border-neutral-800 flex gap-4 text-xs text-neutral-400">
          <Link href="/terms" className="hover:text-neutral-600">Terms of Service</Link>
          <Link href="/" className="hover:text-neutral-600">Home</Link>
        </div>
      </div>
    </div>
  );
}
