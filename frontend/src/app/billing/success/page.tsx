import Link from "next/link";

export default function BillingSuccessPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900 flex flex-col items-center justify-center px-4 text-center">
      <div className="text-6xl mb-6">🎉</div>
      <h1 className="text-3xl font-bold text-ink dark:text-white mb-3">You&apos;re on Pro!</h1>
      <p className="text-neutral-500 mb-8 max-w-sm leading-relaxed">
        Your subscription is active. Unlimited rewrites, Writing DNA personalization, and all Pro features are now unlocked.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/dashboard" className="btn-primary">Go to dashboard</Link>
        <Link href="/onboarding/dna" className="btn-secondary">Train my writing voice</Link>
      </div>
    </div>
  );
}
