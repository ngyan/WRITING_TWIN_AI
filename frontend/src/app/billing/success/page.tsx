"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePostHog } from "posthog-js/react";

export default function BillingSuccessPage() {
  const posthog = usePostHog();

  useEffect(() => {
    posthog?.capture("billing_success", { plan: "pro_early_adopter" });
  }, [posthog]);

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900 flex flex-col items-center justify-center px-4 text-center">
      <div className="text-6xl mb-6">🎉</div>
      <h1 className="text-3xl font-bold text-ink dark:text-white mb-3">Welcome, Founding Member!</h1>
      <p className="text-neutral-500 mb-2 max-w-sm leading-relaxed">
        You&apos;re on Pro Early Adopter — 300 rewrites/month, Writing DNA personalization, and Founding Member pricing locked in forever.
      </p>
      <p className="text-xs text-neutral-400 mb-8">Thank you for supporting Writing Twin in beta.</p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/dashboard" className="btn-primary">Go to dashboard</Link>
        <Link href="/onboarding/dna" className="btn-secondary">Train my writing voice</Link>
      </div>
    </div>
  );
}
