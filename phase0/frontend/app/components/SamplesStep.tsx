"use client";

import { useState } from "react";

interface Props {
  samples: string[];
  onChange: (s: string[]) => void;
  onNext: () => void;
}

const SAMPLE_DATA = `Hey Sarah,

Just a quick heads up — I'm going to push the Monday deadline to Wednesday. The data pipeline's not fully stable yet and I'd rather ship it right than rush it. I'll send a proper update tomorrow once I've stress-tested it.

— Gyan

---

Hey team, the staging deploy is live. Couple of things to flag before you test:
- The auth flow has a known redirect issue on Firefox — skip that for now
- The new onboarding wizard is behind the ONBOARDING_V2 flag, turn it on manually if you want to test it
- Performance on the dashboard is slower than expected, I'm looking into it

Let me know what you find.

---

Hi Marcus,

Wanted to follow up on the Q3 planning doc — I've added my comments but I'm still unclear on the budget allocation for infra. Can we get 15 mins this week to walk through it? I'd rather align early than discover a gap during the board review.

Thanks`;

export default function SamplesStep({ samples, onChange, onNext }: Props) {
  const [error, setError] = useState("");
  const [usedSample, setUsedSample] = useState(false);

  const text = samples[0] ?? "";

  const handleNext = () => {
    if (text.trim().length < 50) {
      setError("Paste at least 50 characters of your writing so we can learn your style.");
      return;
    }
    setError("");
    onNext();
  };

  const loadSampleData = () => {
    onChange([SAMPLE_DATA]);
    setUsedSample(true);
    setError("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Share some of your writing
        </h1>
        <p className="mt-2 text-gray-500 text-sm leading-relaxed">
          Paste anything you&apos;ve written — emails, Slack messages, LinkedIn posts,
          status updates, meeting notes. The more you share, the better it learns your voice.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Your writing
          </label>
          <button
            onClick={loadSampleData}
            className="text-xs text-amber-600 hover:text-amber-700 font-medium border border-amber-200 bg-amber-50 hover:bg-amber-100 px-3 py-1 rounded-full transition-colors"
          >
            {usedSample ? "✓ Sample loaded" : "Try with sample data"}
          </button>
        </div>
        <textarea
          value={text}
          onChange={(e) => { onChange([e.target.value]); setUsedSample(false); setError(""); }}
          placeholder={"Paste your writing here — a few emails, messages, or posts you've actually written.\n\nYou can paste multiple examples separated by a blank line or \"---\". The more you share, the better Writing Twin learns your style."}
          rows={12}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-300 focus:border-gray-400 focus:outline-none resize-none"
        />
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-gray-400">
            {text.length < 50
              ? `${Math.max(0, 50 - text.length)} more characters needed`
              : "Ready to continue"}
          </p>
          <span className="text-xs text-gray-300">{text.length} chars</span>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="pt-2 space-y-3">
        <button
          onClick={handleNext}
          className="w-full rounded-xl bg-gray-900 px-6 py-3.5 text-sm font-semibold text-white hover:bg-gray-700 transition-colors"
        >
          Continue →
        </button>
        <p className="text-xs text-gray-400 text-center">
          Your writing is only used to personalize this session. It is not stored permanently.
        </p>
      </div>
    </div>
  );
}
