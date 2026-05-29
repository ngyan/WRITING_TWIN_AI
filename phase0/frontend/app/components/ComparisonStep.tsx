"use client";

import { useState } from "react";
import { submitFeedback, RewriteResponse } from "../lib/api";
import { getSessionId } from "../lib/session";

interface Props {
  result: RewriteResponse;
  onDone: () => void;
  onRetry: () => void;
}

export default function ComparisonStep({ result, onDone, onRetry }: Props) {
  const [chosen, setChosen] = useState<"option1" | "option2" | null>(null);
  const [wouldSend, setWouldSend] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Map display order to content
  const option1Text =
    result.option_order[0] === "generic" ? result.generic : result.personalized;
  const option2Text =
    result.option_order[1] === "generic" ? result.generic : result.personalized;

  const canSubmit = chosen !== null && wouldSend !== null;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await submitFeedback({
        session_id: result.session_id,
        chosen_option: chosen!,
        option_order: result.option_order,
        would_send: wouldSend!,
        email: email.trim() || undefined,
      });
      setSubmitted(true);
      setTimeout(onDone, 800);
    } catch {
      // Non-blocking — proceed anyway
      setSubmitted(true);
      setTimeout(onDone, 800);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Which version sounds more like you?
        </h1>
        <p className="mt-2 text-gray-500 text-sm">
          Read both. Pick the one that feels like something you would actually write and send.
        </p>
      </div>

      {/* Blind comparison cards */}
      <div className="space-y-4">
        {[
          { id: "option1" as const, label: "Option 1", text: option1Text },
          { id: "option2" as const, label: "Option 2", text: option2Text },
        ].map(({ id, label, text }) => (
          <button
            key={id}
            onClick={() => setChosen(id)}
            className={`w-full text-left rounded-xl border-2 px-5 py-4 transition-all ${
              chosen === id
                ? "border-gray-900 bg-gray-50 shadow-sm"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {label}
              </span>
              {chosen === id && (
                <span className="text-xs font-medium text-gray-900 bg-gray-100 px-2 py-0.5 rounded-full">
                  Selected
                </span>
              )}
            </div>
            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{text}</p>
          </button>
        ))}
      </div>

      {/* Would you send it? */}
      {chosen && (
        <div className="space-y-3 pt-2 border-t border-gray-100">
          <p className="text-sm font-medium text-gray-700">
            Would you send the version you chose without editing it?
          </p>
          <div className="flex gap-3">
            {[
              { val: true, label: "Yes, I'd send it as-is" },
              { val: false, label: "I'd still edit it a bit" },
            ].map(({ val, label }) => (
              <button
                key={String(val)}
                onClick={() => setWouldSend(val)}
                className={`flex-1 rounded-lg border px-4 py-2.5 text-sm transition-all ${
                  wouldSend === val
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 text-gray-600 hover:border-gray-400"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Waitlist */}
      {chosen && wouldSend !== null && (
        <div className="rounded-xl bg-amber-50 border border-amber-100 px-5 py-4 space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-900">
              Want early access when Writing Twin launches?
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              We&apos;ll email you when the Chrome Extension (Gmail + LinkedIn) is ready.
            </p>
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-amber-400"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onRetry}
          className="rounded-lg border border-gray-200 px-5 py-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Try another message
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting || submitted}
          className="flex-1 rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-700 transition-colors disabled:opacity-40"
        >
          {submitted ? "✓ Saved" : submitting ? "Saving..." : "Submit feedback →"}
        </button>
      </div>

      <p className="text-xs text-gray-400 text-center">
        Your selection is anonymous. No email stored unless you add it above.
      </p>
    </div>
  );
}
