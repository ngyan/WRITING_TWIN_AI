"use client";

import { useState } from "react";
import { rewrite, RewriteResponse } from "../lib/api";
import { getSessionId } from "../lib/session";

interface Props {
  draft: string;
  samples: string[];
  onChange: (d: string) => void;
  onResult: (r: RewriteResponse) => void;
  onBack: () => void;
}

const PLACEHOLDER =
  "Hi Alex,\n\nWanted to check in on the Q2 review. I think we should reschedule because the data is not complete yet. Let me know what works for you.\n\nThanks";

export default function DraftStep({ draft, samples, onChange, onResult, onBack }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (draft.trim().length < 20) {
      setError("Paste a message of at least 20 characters.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const validSamples = samples.filter((s) => s.trim().length >= 20);
      const result = await rewrite({
        samples: validSamples,
        draft: draft.trim(),
        session_id: getSessionId(),
      });
      onResult(result);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setError(msg.includes("fetch") ? "Cannot reach the API. Is the backend running?" : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Paste a message you want to send
        </h1>
        <p className="mt-2 text-gray-500 text-sm leading-relaxed">
          This is the draft you want to rewrite. It could be an email, a LinkedIn message,
          a Slack update — anything you&apos;d normally spend time polishing.
        </p>
      </div>

      <div>
        <textarea
          value={draft}
          onChange={(e) => onChange(e.target.value)}
          placeholder={PLACEHOLDER}
          rows={8}
          className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-300 focus:border-gray-400 focus:outline-none resize-none"
          disabled={loading}
        />
        <div className="text-right text-xs text-gray-300 mt-0.5">{draft.length} / 2000</div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {loading && (
        <div className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-700">
          <div className="flex items-center gap-2">
            <Spinner />
            <span>Generating two versions... (first request may take up to 30s)</span>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={loading}
          className="rounded-lg border border-gray-200 px-5 py-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
        >
          ← Back
        </button>
        <button
          onClick={handleGenerate}
          disabled={loading || draft.trim().length < 20}
          className="flex-1 rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-700 transition-colors disabled:opacity-40"
        >
          {loading ? "Generating..." : "Generate comparison →"}
        </button>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-amber-600" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v8H4z"
      />
    </svg>
  );
}
