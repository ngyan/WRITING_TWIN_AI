"use client";

import { useState } from "react";

interface SnapshotResult {
  avg_sentence_length: number;
  vocabulary_diversity: number;
  avg_word_length: number;
  formality_score: number;
  writing_archetype: string;
  signature_patterns: string[];
  famous_author_match: string;
  famous_author_reason: string;
}

const AUTHOR_EMOJI: Record<string, string> = {
  Hemingway: "🗡️",
  Orwell:    "🔦",
  Austen:    "🌹",
  Woolf:     "🌊",
  Twain:     "🎭",
  Obama:     "🎤",
};

function DimensionBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-neutral-600 dark:text-neutral-400">{label}</span>
        <span className="font-medium text-neutral-800 dark:text-neutral-200">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-700">
        <div
          className="h-2 rounded-full bg-indigo-500 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ResultCard({ result }: { result: SnapshotResult }) {
  const formalityPct = result.formality_score * 10;
  const diversityPct = Math.round(result.vocabulary_diversity * 100);
  const rhythmScore = Math.min(Math.round((20 / Math.max(result.avg_sentence_length, 1)) * 10), 10);

  return (
    <div className="mt-8 rounded-2xl border border-indigo-100 dark:border-indigo-900 bg-white dark:bg-neutral-900 shadow-xl overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="bg-indigo-600 px-6 py-5 text-white">
        <p className="text-xs font-semibold tracking-widest uppercase opacity-70 mb-1">
          Writing DNA Snapshot
        </p>
        <h3 className="text-2xl font-bold">{result.writing_archetype}</h3>
        <p className="mt-1 text-indigo-100 text-sm">
          {AUTHOR_EMOJI[result.famous_author_match] ?? "✍️"} Closest match:{" "}
          <span className="font-semibold">{result.famous_author_match}</span> — {result.famous_author_reason}
        </p>
      </div>

      <div className="px-6 py-5 grid gap-6 sm:grid-cols-2">
        {/* Dimensions */}
        <div className="space-y-4">
          <p className="text-xs font-semibold tracking-widest uppercase text-neutral-400">
            Writing Dimensions
          </p>
          <DimensionBar label="Formality" value={result.formality_score} max={10} />
          <DimensionBar label="Vocabulary Richness" value={diversityPct} max={100} />
          <DimensionBar label="Sentence Rhythm" value={rhythmScore} max={10} />
          <DimensionBar label="Word Density" value={Math.round(result.avg_word_length * 10)} max={80} />
        </div>

        {/* Signature patterns */}
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-neutral-400 mb-3">
            Signature Patterns
          </p>
          <ul className="space-y-2">
            {result.signature_patterns.map((p, i) => (
              <li key={i} className="flex gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                <span className="text-indigo-500 font-bold shrink-0">→</span>
                {p}
              </li>
            ))}
          </ul>

          {/* Raw metrics */}
          <div className="mt-5 pt-4 border-t border-neutral-100 dark:border-neutral-800 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xl font-bold text-indigo-600">{result.avg_sentence_length}</p>
              <p className="text-xs text-neutral-500">words/sentence</p>
            </div>
            <div>
              <p className="text-xl font-bold text-indigo-600">{diversityPct}%</p>
              <p className="text-xs text-neutral-500">vocab diversity</p>
            </div>
            <div>
              <p className="text-xl font-bold text-indigo-600">{result.formality_score}/10</p>
              <p className="text-xs text-neutral-500">formality</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 pb-5 text-center">
        <p className="text-sm text-neutral-500 mb-3">
          Install Writing Twin AI to automatically apply this profile every time you write.
        </p>
        <a
          href="https://chromewebstore.google.com/detail/writing-twin-ai/pjagoopeamgadpgmlnjmdbplhfejeecb"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
        >
          Add to Chrome — Free
        </a>
      </div>
    </div>
  );
}

export function DnaSnapshot() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SnapshotResult | null>(null);
  const [error, setError] = useState("");

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const ready = wordCount >= 30;

  async function handleAnalyze() {
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/dna-snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");
      setResult(data as SnapshotResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="py-20 bg-neutral-50 dark:bg-neutral-950">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <span className="inline-block rounded-full bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 px-4 py-1 text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-4">
            Free — No Account Required
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white">
            See Your Writing DNA
          </h2>
          <p className="mt-3 text-neutral-500 dark:text-neutral-400 text-lg">
            Paste anything you've written. Get your style fingerprint in seconds.
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm p-6">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste 3–5 sentences from an email, Slack message, or anything you've written..."
            rows={6}
            className="w-full resize-none rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-4 py-3 text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="mt-3 flex items-center justify-between">
            <span className={`text-xs ${ready ? "text-green-600" : "text-neutral-400"}`}>
              {wordCount} words {!ready && `— need ${30 - wordCount} more`}
            </span>
            <button
              onClick={handleAnalyze}
              disabled={!ready || loading}
              className="rounded-full bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Analysing…" : "Analyse My Writing"}
            </button>
          </div>
          {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
        </div>

        {result && <ResultCard result={result} />}
      </div>
    </section>
  );
}
