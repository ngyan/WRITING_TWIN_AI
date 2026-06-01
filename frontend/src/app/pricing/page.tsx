"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Nav } from "@/components/Nav";
import { createCheckout, getToken } from "@/lib/api";

const PLANS = [
  {
    name: "Free",
    price: { monthly: 0, yearly: 0 },
    priceId: { monthly: "", yearly: "" },
    description: "Try Writing Twin at your own pace.",
    limit: "30 rewrites / day",
    features: [
      "30 rewrites per day",
      "All 6 tones",
      "Gmail + LinkedIn + Slack",
      "Chrome extension",
    ],
    cta: "Get started free",
    highlight: false,
  },
  {
    name: "Pro",
    price: { monthly: 15, yearly: 10 },
    priceId: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY || "",
      yearly:  process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY  || "",
    },
    description: "Unlimited rewrites, personalized to your voice.",
    limit: "Unlimited rewrites",
    features: [
      "Unlimited rewrites",
      "Writing DNA — your voice trained in",
      "All 6 tones",
      "Outlook support",
      "Quality retry (auto-regenerate low scores)",
      "Priority support",
    ],
    cta: "Start Pro",
    highlight: true,
  },
  {
    name: "Team",
    price: { monthly: 49, yearly: 35 },
    priceId: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_TEAM_MONTHLY || "",
      yearly:  "",
    },
    description: "One voice per person, one coherent team.",
    limit: "5 seats included",
    features: [
      "Everything in Pro",
      "5 seats (add more at $10/seat)",
      "Team admin dashboard",
      "Shared tone presets",
      "Priority onboarding call",
    ],
    cta: "Start Team",
    highlight: false,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState<string | null>(null);

  async function handleCheckout(plan: typeof PLANS[0]) {
    if (plan.price.monthly === 0) {
      router.push("/register");
      return;
    }
    if (!getToken()) {
      router.push(`/login?next=/pricing`);
      return;
    }
    const priceId = plan.priceId[billing];
    if (!priceId) {
      alert("This plan is not yet available for purchase. Contact support@writingtwinai.com");
      return;
    }
    setLoading(plan.name);
    try {
      const origin = window.location.origin;
      const url = await createCheckout(
        priceId,
        `${origin}/billing/success`,
        `${origin}/billing/cancel`,
      );
      window.location.href = url;
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      <Nav />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-24">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-ink dark:text-white mb-3">
            Simple pricing
          </h1>
          <p className="text-neutral-500 mb-8">
            Start free. Upgrade when you need unlimited rewrites.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-pill p-1">
            {(["monthly", "yearly"] as const).map((b) => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                className={`px-4 h-8 rounded-pill text-sm font-medium transition-all duration-150 ${
                  billing === b
                    ? "bg-white dark:bg-neutral-700 text-ink dark:text-white shadow-sm"
                    : "text-neutral-500 hover:text-neutral-700"
                }`}
              >
                {b === "monthly" ? "Monthly" : "Yearly (save 33%)"}
              </button>
            ))}
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid sm:grid-cols-3 gap-6 items-start">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`card p-6 relative ${plan.highlight ? "ring-2 ring-primary-500 shadow-glow" : ""}`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-pill bg-primary-500 text-white text-xs font-semibold">
                    Most popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-1">
                  {plan.name}
                </p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-bold text-ink dark:text-white">
                    ${billing === "yearly" ? plan.price.yearly : plan.price.monthly}
                  </span>
                  {plan.price.monthly > 0 && (
                    <span className="text-neutral-400 text-sm">/mo</span>
                  )}
                </div>
                {billing === "yearly" && plan.price.yearly > 0 && (
                  <p className="text-xs text-accent-600 font-medium">
                    billed ${plan.price.yearly * 12}/year
                  </p>
                )}
                <p className="text-xs text-neutral-400 mt-1">{plan.limit}</p>
                <p className="text-sm text-neutral-500 mt-3 leading-relaxed">{plan.description}</p>
              </div>

              <button
                onClick={() => handleCheckout(plan)}
                disabled={loading === plan.name}
                className={`w-full mb-6 ${plan.highlight ? "btn-primary" : "btn-secondary"}`}
              >
                {loading === plan.name ? "Loading…" : plan.cta}
              </button>

              <ul className="space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-300">
                    <span className="text-primary-500 mt-0.5 shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-16 text-center">
          <p className="text-sm text-neutral-400">
            Questions?{" "}
            <a href="mailto:support@writingtwinai.com" className="text-primary-500 hover:underline">
              Email us
            </a>
            {" "}— we reply within a day.
          </p>
        </div>
      </div>
    </div>
  );
}
