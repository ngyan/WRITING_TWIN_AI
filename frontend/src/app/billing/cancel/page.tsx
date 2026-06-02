import Link from "next/link";

export default function BillingCancelPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900 flex flex-col items-center justify-center px-4 text-center">
      <img src="/logo.png" alt="" width={56} height={56} className="mx-auto mb-6" />
      <h1 className="text-2xl font-bold text-ink dark:text-white mb-3">No worries</h1>
      <p className="text-neutral-500 mb-8 max-w-sm leading-relaxed">
        You&apos;re still on the free plan — 20 rewrites/month, no credit card needed. Upgrade anytime when you&apos;re ready.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/dashboard" className="btn-primary">Back to dashboard</Link>
        <Link href="/pricing" className="btn-secondary">See plans again</Link>
      </div>
    </div>
  );
}
