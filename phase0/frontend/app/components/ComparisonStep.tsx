"use client";

import { useState, useRef } from "react";
import { submitFeedback, RewriteResponse } from "../lib/api";
import { getSessionId } from "../lib/session";

interface Props {
  result: RewriteResponse;
  onDone: () => void;
  onRetry: () => void;
}

export default function ComparisonStep({ result, onDone, onRetry }: Props) {
  const [chosen, setChosen] = useState<"option1" | "option2" | "nodiff" | null>(null);
  const [wouldSend, setWouldSend] = useState<boolean | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [validationMsg, setValidationMsg] = useState("");
  const optionsRef = useRef<HTMLDivElement>(null);

  const optionAText =
    result.option_order[0] === "generic" ? result.generic : result.personalized;
  const optionBText =
    result.option_order[1] === "generic" ? result.generic : result.personalized;

  const handleSubmit = async () => {
    if (!chosen) {
      setValidationMsg("Please select Version A, Version B, or No Difference above.");
      optionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (wouldSend === null) {
      setValidationMsg("Please answer whether you'd send it as-is.");
      return;
    }
    setValidationMsg("");
    setSubmitting(true);
    try {
      await submitFeedback({
        session_id: result.session_id,
        chosen_option: chosen,
        option_order: result.option_order,
        would_send: wouldSend,
        confidence: confidence ?? undefined,
        comment: comment.trim() || undefined,
        email: email.trim() || undefined,
        role: role.trim() || undefined,
      });
      setSubmitted(true);
      setTimeout(onDone, 600);
    } catch {
      setSubmitted(true);
      setTimeout(onDone, 600);
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

      {/* Version cards */}
      <div className="space-y-4" ref={optionsRef}>
        {[
          { id: "option1" as const, label: "Version A", text: optionAText },
          { id: "option2" as const, label: "Version B", text: optionBText },
        ].map(({ id, label, text }) => (
          <button
            key={id}
            onClick={() => { setChosen(id); setValidationMsg(""); }}
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

        {/* No difference */}
        <button
          onClick={() => { setChosen("nodiff"); setValidationMsg(""); }}
          className={`w-full rounded-xl border-2 px-5 py-3 text-sm transition-all ${
            chosen === "nodiff"
              ? "border-gray-900 bg-gray-50 text-gray-900 font-medium"
              : "border-dashed border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600"
          }`}
        >
          No difference — they sound the same to me
        </button>
      </div>

      {/* Inline error below options */}
      {validationMsg && !chosen && (
        <p className="text-sm text-red-500 -mt-2">{validationMsg}</p>
      )}

      {/* Would you send it? */}
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
              onClick={() => { setWouldSend(val); setValidationMsg(""); }}
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

      {/* Confidence */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700">
          How confident are you in your pick?
        </p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setConfidence(n)}
              className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-all ${
                confidence === n
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 text-gray-500 hover:border-gray-400"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-300 px-1">
          <span>Not sure</span>
          <span>Very sure</span>
        </div>
      </div>

      {/* Comment */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">
          Any feedback? <span className="font-normal text-gray-400">(optional)</span>
        </p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="e.g. Version A felt too formal, Version B sounded exactly like me..."
          rows={3}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-300 focus:border-gray-400 focus:outline-none resize-none"
        />
      </div>

      {/* Waitlist */}
      <div className="rounded-xl bg-amber-50 border border-amber-100 px-5 py-4 space-y-3">
        <div>
          <p className="text-sm font-medium text-gray-900">
            Want early access when Writing Twin launches?
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Chrome Extension for Gmail + LinkedIn. One email, no spam.
          </p>
        </div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-amber-400"
        />
        <input
          type="text"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="Your role (e.g. Product Manager, Engineer, Founder)"
          className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-amber-400"
        />
      </div>

      {/* Error below would-send if that's the missing field */}
      {validationMsg && chosen && (
        <p className="text-sm text-red-500 -mb-2">{validationMsg}</p>
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
          disabled={submitting || submitted}
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
