import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "Terms of Service — Writing Twin AI",
  description: "Terms governing your use of Writing Twin AI.",
};

const EFFECTIVE_DATE = "June 1, 2026";
const CONTACT_EMAIL = "support@writingtwinai.com";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      <Nav />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <Link href="/" className="text-xs text-neutral-400 hover:text-neutral-600 mb-8 inline-flex items-center gap-1">
          ← Back to home
        </Link>

        <h1 className="text-4xl font-bold text-ink dark:text-white mb-2">Terms of Service</h1>
        <p className="text-sm text-neutral-400 mb-12">Effective date: {EFFECTIVE_DATE}</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none text-sm leading-relaxed space-y-8">

          <section>
            <h2 className="text-lg font-semibold text-ink dark:text-white mb-3">1. Acceptance</h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              By creating an account or using Writing Twin AI (&ldquo;the Service&rdquo;), you agree to these Terms. If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink dark:text-white mb-3">2. Service description</h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              Writing Twin AI is an AI-powered writing assistant that learns your writing style and rewrites text to match your voice. It is provided as a web application and Chrome extension.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink dark:text-white mb-3">3. Account</h2>
            <ul className="space-y-2 text-neutral-600 dark:text-neutral-400 list-disc pl-5">
              <li>You must provide a valid email address and keep your password secure.</li>
              <li>You are responsible for all activity on your account.</li>
              <li>You must be 13 years or older to use the Service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink dark:text-white mb-3">4. Acceptable use</h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-2">You may not use the Service to:</p>
            <ul className="space-y-2 text-neutral-600 dark:text-neutral-400 list-disc pl-5">
              <li>Generate spam, phishing messages, or fraudulent content.</li>
              <li>Impersonate another person or entity.</li>
              <li>Violate any applicable law or third-party rights.</li>
              <li>Attempt to reverse-engineer or extract the underlying models or prompts.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink dark:text-white mb-3">5. Plans and billing</h2>
            <ul className="space-y-2 text-neutral-600 dark:text-neutral-400 list-disc pl-5">
              <li>The Free plan includes 20 rewrites per calendar month at no charge.</li>
              <li>The Pro Early Adopter plan is $5/month and includes 300 rewrites/month. This price is locked for the lifetime of your subscription while we are in beta.</li>
              <li>Billing is handled by Stripe. Subscriptions renew automatically unless cancelled.</li>
              <li>Refunds are handled on a case-by-case basis — contact {CONTACT_EMAIL}.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink dark:text-white mb-3">6. Intellectual property</h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              You retain ownership of all text you submit. You grant Writing Twin AI a limited license to process your text solely to provide the Service. We do not use your writing samples to train shared models without explicit consent.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink dark:text-white mb-3">7. AI output disclaimer</h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              AI-generated output may be inaccurate, incomplete, or unsuitable for your purpose. You are responsible for reviewing all output before sending or publishing it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink dark:text-white mb-3">8. Limitation of liability</h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              The Service is provided &ldquo;as is.&rdquo; To the maximum extent permitted by law, Writing Twin AI is not liable for indirect, incidental, or consequential damages arising from your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink dark:text-white mb-3">9. Termination</h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              We may suspend or terminate your account for violations of these Terms. You may delete your account at any time by contacting {CONTACT_EMAIL}.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink dark:text-white mb-3">10. Changes</h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              We may update these Terms. Material changes will be communicated by email or dashboard notice. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink dark:text-white mb-3">11. Contact</h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary-500 hover:underline">{CONTACT_EMAIL}</a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-neutral-100 dark:border-neutral-800 flex gap-4 text-xs text-neutral-400">
          <Link href="/privacy" className="hover:text-neutral-600">Privacy Policy</Link>
          <Link href="/" className="hover:text-neutral-600">Home</Link>
        </div>
      </div>
    </div>
  );
}
