"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Nav } from "@/components/Nav";
import { DnaProfile, getDnaProfile, getToken, submitDnaSamples } from "@/lib/api";

const SAMPLE_PLACEHOLDER = `Hi Marcus,

Just following up on our conversation from last week. I think the approach we discussed makes a lot of sense and I'd love to move forward when you're ready.

Let me know if you need anything else from my end.

---

Hey Sarah — saw your post about the product launch. Really impressive work. The way you handled the positioning was spot on.

Quick question: would you be open to a 20-minute call sometime this week? I have a few ideas I think could be relevant.

---

Team update for this week:

Shipped the new onboarding flow yesterday. Early numbers look good — completion rate is up 12%. Still some rough edges on mobile that I want to fix before we push harder on acquisition.

No blockers. Will share the full analytics in Friday's review.`;

function parseSamples(raw: string): string[] {
  return raw
    .split(/\n---\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 50);
}

function ProgressStep({ label, active, done }: { label: string; active?: boolean; done?: boolean }) {
  return (
    <div className={`flex items-center gap-2 text-sm ${done ? "text-green-600" : active ? "text-primary-600 font-medium" : "text-neutral-400"}`}>
      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
        done ? "bg-green-100 text-green-600" : active ? "bg-primary-100 text-primary-600" : "bg-neutral-100 text-neutral-400"
      }`}>
        {done ? "✓" : active ? "→" : "·"}
      </span>
      {label}
    </div>
  );
}

export default function DnaOnboardingPage() {
  const router = useRouter();
  const [raw, setRaw] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "polling" | "done" | "error">("idle");
  const [profile, setProfile] = useState<DnaProfile | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const samples = parseSamples(raw);
  const sampleCount = samples.length;

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login?next=/onboarding/dna");
      return;
    }
    getDnaProfile().then((p) => {
      if (p) {
        setProfile(p);
        if (p.extraction_status === "complete") setStatus("done");
        if (p.extraction_status === "processing") {
          setStatus("polling");
          startPolling();
        }
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startPolling() {
    const interval = setInterval(async () => {
      const p = await getDnaProfile();
      if (p?.extraction_status === "complete") {
        setProfile(p);
        setStatus("done");
        clearInterval(interval);
      } else if (p?.extraction_status === "failed") {
        setStatus("error");
        setErrorMsg("Extraction failed. Try submitting again.");
        clearInterval(interval);
      }
    }, 4000);
  }

  async function handleSubmit() {
    if (sampleCount < 3) {
      setErrorMsg("Add at least 3 samples (separated by ---) to get a good result.");
      return;
    }
    setErrorMsg("");
    setStatus("submitting");
    try {
      await submitDnaSamples(samples);
      setStatus("polling");
      startPolling();
    } catch (err) {
      setStatus("error");
      setErrorMsg((err as Error).message);
    }
  }

  const isProcessing = status === "submitting" || status === "polling";

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <Nav />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">

        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-xs text-neutral-400 hover:text-neutral-600 mb-4 inline-flex items-center gap-1">
            ← Back to dashboard
          </Link>
          <h1 className="text-3xl font-bold text-ink dark:text-white mb-2">Train your writing voice</h1>
          <p className="text-neutral-500 leading-relaxed">
            Paste 3–20 of your own emails, Slack messages, or LinkedIn posts below.
            Writing Twin will extract your style and use it for every rewrite.
          </p>
        </div>

        {/* Progress steps */}
        <div className="card p-5 mb-6 space-y-2">
          <ProgressStep label="Paste writing samples" done={status !== "idle" || sampleCount > 0} active={status === "idle"} />
          <ProgressStep label="Extract your writing DNA" done={status === "done"} active={isProcessing} />
          <ProgressStep label="Start getting personalized rewrites" done={status === "done"} />
        </div>

        {/* Done state */}
        {status === "done" && profile && (
          <div className="card p-8 text-center">
            <div className="text-5xl mb-4">🧬</div>
            <h2 className="text-xl font-bold text-ink dark:text-white mb-2">Your voice is trained!</h2>
            <p className="text-neutral-500 mb-2">
              Extracted from {profile.sample_count} writing samples.
            </p>
            <p className="text-sm text-neutral-400 mb-6">
              The Chrome extension will now personalize rewrites to sound like you.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/dashboard" className="btn-primary">Go to dashboard</Link>
              <button
                onClick={() => { setStatus("idle"); setRaw(""); setProfile(null); }}
                className="btn-secondary"
              >
                Add more samples
              </button>
            </div>
          </div>
        )}

        {/* Input form */}
        {status !== "done" && (
          <>
            <div className="card p-6 mb-4">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium text-ink dark:text-white">
                  Your writing samples
                </label>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-pill ${
                  sampleCount >= 3
                    ? "bg-green-50 text-green-600 dark:bg-green-900/20"
                    : "bg-neutral-100 text-neutral-500 dark:bg-neutral-700"
                }`}>
                  {sampleCount} {sampleCount === 1 ? "sample" : "samples"}
                  {sampleCount > 0 && sampleCount < 3 && " (need 3 min)"}
                  {sampleCount >= 3 && " ✓"}
                </span>
              </div>

              <textarea
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                disabled={isProcessing}
                rows={14}
                className="input font-mono text-xs resize-none leading-relaxed disabled:opacity-60"
                placeholder={SAMPLE_PLACEHOLDER}
              />

              <p className="text-xs text-neutral-400 mt-2">
                Separate each sample with <code className="bg-neutral-100 dark:bg-neutral-700 px-1 py-0.5 rounded text-[10px]">---</code> on its own line.
                Minimum 3 samples, 50+ characters each.
              </p>
            </div>

            {errorMsg && (
              <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl mb-4">
                {errorMsg}
              </p>
            )}

            {isProcessing ? (
              <div className="card p-6 text-center">
                <div className="flex justify-center mb-3">
                  <div className="w-8 h-8 rounded-full border-2 border-primary-200 border-t-primary-500 animate-spin" />
                </div>
                <p className="font-medium text-ink dark:text-white mb-1">
                  {status === "submitting" ? "Uploading samples…" : "Extracting your writing DNA…"}
                </p>
                <p className="text-sm text-neutral-400">This takes about 20–40 seconds.</p>
              </div>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={sampleCount < 1}
                className="btn-primary w-full"
              >
                🧬 Train my writing voice
              </button>
            )}
          </>
        )}

        {/* Tips */}
        <div className="mt-8 p-5 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800">
          <p className="text-xs font-semibold text-primary-700 dark:text-primary-300 mb-2">Tips for better results</p>
          <ul className="space-y-1 text-xs text-primary-600 dark:text-primary-400">
            <li>• Use real messages you actually sent — not polished writing</li>
            <li>• Mix contexts: emails, Slack messages, LinkedIn posts</li>
            <li>• More samples = better voice match (try 10+)</li>
            <li>• Avoid forwarded emails or text you didn&apos;t write</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
