"use client";

import { useState } from "react";

const PAYMENT_OPTIONS = [
  { val: "no", label: "No" },
  { val: "maybe", label: "Maybe" },
  { val: "$5/mo", label: "$5 / month" },
  { val: "$10/mo", label: "$10 / month" },
  { val: "$20/mo", label: "$20 / month" },
];

export default function ThankYouStep() {
  const [payIntent, setPayIntent] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handlePayIntent = (val: string) => {
    setPayIntent(val);
    setSaved(true);
    // Fire-and-forget — store in session storage for now
    try {
      const existing = JSON.parse(sessionStorage.getItem("wt_feedback") ?? "{}");
      sessionStorage.setItem("wt_feedback", JSON.stringify({ ...existing, payment_intent: val }));
    } catch {
      // best-effort
    }
  };

  return (
    <div className="space-y-8 py-6">
      {/* Payment intent */}
      {!saved ? (
        <div className="rounded-xl bg-gray-50 border border-gray-100 px-6 py-5 space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">One quick question</p>
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">
              If Writing Twin consistently saved you time and sounded like you, would you pay for it?
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {PAYMENT_OPTIONS.map(({ val, label }) => (
              <button
                key={val}
                onClick={() => handlePayIntent(val)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:border-gray-900 hover:bg-gray-900 hover:text-white transition-all"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-green-50 border border-green-100 px-6 py-4 text-sm text-green-700 font-medium">
          ✓ Got it — thanks for the honest answer.
        </div>
      )}

      {/* Thank you */}
      <div className="text-center space-y-4">
        <div className="text-4xl">✓</div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Thanks for testing!</h1>
          <p className="mt-2 text-gray-500 text-sm max-w-sm mx-auto leading-relaxed">
            Your feedback helps us prove whether AI can genuinely learn someone&apos;s
            writing voice — not just polish their prose.
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-gray-50 border border-gray-100 px-6 py-5 space-y-3 max-w-md mx-auto">
        <p className="text-sm font-medium text-gray-700">What happens next</p>
        <ul className="text-sm text-gray-500 space-y-2">
          <li className="flex gap-2">
            <span className="text-gray-300 shrink-0">→</span>
            We&apos;re running this with 30 professionals to validate the core hypothesis.
          </li>
          <li className="flex gap-2">
            <span className="text-gray-300 shrink-0">→</span>
            If 60%+ prefer the personalized version, we&apos;ll build the Chrome Extension
            for Gmail + LinkedIn.
          </li>
          <li className="flex gap-2">
            <span className="text-gray-300 shrink-0">→</span>
            Early access users get a 60-day free Pro trial at launch.
          </li>
        </ul>
      </div>

      <div className="text-center">
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-gray-500 hover:text-gray-900 underline underline-offset-2"
        >
          Test another message
        </button>
      </div>
    </div>
  );
}
