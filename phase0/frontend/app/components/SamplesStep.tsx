"use client";

import { useState } from "react";

interface Props {
  samples: string[];
  onChange: (s: string[]) => void;
  onNext: () => void;
}

const PLACEHOLDER = [
  "Hi Sarah,\n\nJust wanted to follow up on the deployment timeline we discussed. I think we can move faster if we parallelize the DB migration — let me know if you want to jump on a quick call to align.\n\nThanks,\nGyan",
  "Hey team,\n\nHeads up — the test environment is flaky again this morning. Seeing intermittent 502s on the validation endpoint. I've opened a ticket but wanted to flag it here so nobody wastes time debugging locally.\n\nWill update when it's stable.",
];

export default function SamplesStep({ samples, onChange, onNext }: Props) {
  const [error, setError] = useState("");

  const update = (i: number, val: string) => {
    const next = [...samples];
    next[i] = val;
    onChange(next);
  };

  const addSample = () => {
    if (samples.length < 5) onChange([...samples, ""]);
  };

  const removeSample = (i: number) => {
    if (samples.length > 1) onChange(samples.filter((_, idx) => idx !== i));
  };

  const handleNext = () => {
    const filled = samples.filter((s) => s.trim().length >= 50);
    if (filled.length === 0) {
      setError("Paste at least one writing sample (50+ characters) so we can learn your style.");
      return;
    }
    setError("");
    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Paste some of your writing
        </h1>
        <p className="mt-2 text-gray-500 text-sm leading-relaxed">
          Add 1–5 emails, messages, or posts you&apos;ve actually written. We&apos;ll learn
          your vocabulary, rhythm, and tone. The more samples you add, the better.
        </p>
      </div>

      <div className="space-y-4">
        {samples.map((s, i) => (
          <div key={i} className="relative">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Sample {i + 1}
              </label>
              {samples.length > 1 && (
                <button
                  onClick={() => removeSample(i)}
                  className="text-xs text-gray-400 hover:text-red-500"
                >
                  Remove
                </button>
              )}
            </div>
            <textarea
              value={s}
              onChange={(e) => update(i, e.target.value)}
              placeholder={PLACEHOLDER[i % 2]}
              rows={6}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-300 focus:border-gray-400 focus:outline-none resize-none"
            />
            <div className="text-right text-xs text-gray-300 mt-0.5">
              {s.length} chars
            </div>
          </div>
        ))}
      </div>

      {samples.length < 5 && (
        <button
          onClick={addSample}
          className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1"
        >
          <span className="text-lg leading-none">+</span> Add another sample
        </button>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="pt-2">
        <button
          onClick={handleNext}
          className="w-full rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
        >
          Continue →
        </button>
        <p className="text-xs text-gray-400 text-center mt-3">
          Your writing is only used to personalize this session. It is not stored permanently.
        </p>
      </div>
    </div>
  );
}
