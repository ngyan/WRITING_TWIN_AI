"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { Nav } from "@/components/Nav";
import { createCheckout, getToken } from "@/lib/api";

const PLANS = [
  {
    name: "Free Beta",
    price: 0,
    priceId: "",
    tagline: "Try Writing Twin at your own pace.",
    limit: "20 rewrites / month",
    features: [
      "20 rewrites per month",
      "All 6 writing tones",
      "Personalized rewrites",
      "Feedback submission",
      "Early access status",
    ],
    cta: "Get started free",
    badge: null,
    highlight: false,
  },
  {
    name: "Pro Early Adopter",
    price: 5,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY || "",
    tagline: "Your full writing voice, without limits.",
    limit: "300 rewrites / month",
    features: [
      "300 rewrites per month",
      "Writing Twin profile — your voice trained in",
      "All 6 writing tones",
      "Communication Memory (coming soon)",
      "Chrome Extension access",
      "Priority access to new features",
    ],
    cta: "Start Pro — $5/mo",
    badge: "Founding Member Pricing",
    highlight: true,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const posthog = usePostHog();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleCheckout(plan: typeof PLANS[0]) {
    posthog?.capture("upgrade_clicked", { plan: plan.name, price: plan.price });
    if (plan.price === 0) {
      router.push("/register");
      return;
    }
    if (!getToken()) {
      router.push("/login?next=/pricing");
      return;
    }
    if (!plan.priceId) {
      alert("This plan is not yet open for purchase. Email support@writingtwinai.com to get early access.");
      return;
    }
    setLoading(plan.name);
    try {
      const origin = window.location.origin;
      const url = await createCheckout(
        plan.priceId,
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-16 pb-24">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-ink dark:text-white mb-3">
            Simple, honest pricing
          </h1>
          <p className="text-neutral-500 max-w-md mx-auto leading-relaxed">
            Start free. Upgrade when Writing Twin becomes part of how you work.
          </p>
        </div>

        {/* Plan cards — two columns */}
        <div className="grid sm:grid-cols-2 gap-6 items-start">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`card p-7 relative ${plan.highlight ? "ring-2 ring-primary-500 shadow-glow" : ""}`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-3 left-6">
                  <span className="px-3 py-1 rounded-pill bg-accent-500 text-white text-xs font-semibold">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-6 mt-2">
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-2">
                  {plan.name}
                </p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-5xl font-bold text-ink dark:text-white">
                    ${plan.price}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-neutral-400 text-sm">/month</span>
                  )}
                </div>
                <p className="text-xs text-neutral-400 mb-3">{plan.limit}</p>
                <p className="text-sm text-neutral-500 leading-relaxed">{plan.tagline}</p>
              </div>

              <button
                onClick={() => handleCheckout(plan)}
                disabled={loading === plan.name}
                className={`w-full mb-6 ${plan.highlight ? "btn-primary" : "btn-secondary"}`}
              >
                {loading === plan.name ? "Loading…" : plan.cta}
              </button>

              <ul className="space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-300">
                    <span className="text-primary-500 mt-0.5 shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* Lock-in messaging for Pro */}
              {plan.highlight && (
                <div className="mt-6 pt-5 border-t border-neutral-100 dark:border-neutral-700">
                  <p className="text-xs text-accent-600 dark:text-accent-400 font-medium leading-relaxed">
                    🔒 Lock in this pricing forever as an early supporter.
                    Prices will increase when we exit beta.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Reassurance */}
        <div className="mt-10 text-center space-y-2">
          <p className="text-sm text-neutral-500">
            No contracts. Cancel anytime. Questions?{" "}
            <a href="mailto:support@writingtwinai.com" className="text-primary-500 hover:underline">
              Email us
            </a>
            {" "}— we reply within a day.
          </p>
          <p className="text-xs text-neutral-400">
            Team and enterprise plans available after beta — reach out if you need seats now.
          </p>
        </div>
      </div>
    </div>
  );
}
