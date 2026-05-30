"use client";

import { useState } from "react";
import LandingStep from "./components/LandingStep";
import SamplesStep from "./components/SamplesStep";
import DraftStep from "./components/DraftStep";
import ComparisonStep from "./components/ComparisonStep";
import ThankYouStep from "./components/ThankYouStep";
import { RewriteResponse } from "./lib/api";

type Step = "landing" | "samples" | "draft" | "comparison" | "thankyou";

export default function Home() {
  const [step, setStep] = useState<Step>("landing");
  const [samples, setSamples] = useState<string[]>([""]);
  const [draft, setDraft] = useState("");
  const [result, setResult] = useState<RewriteResponse | null>(null);

  const inDemo = step !== "landing";

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setStep("landing")}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity"
          >
            <span className="font-semibold text-gray-900">Writing Twin</span>
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              Early demo
            </span>
          </button>
          {inDemo && <StepIndicator current={step} />}
        </div>
      </header>

      <div className="flex-1 max-w-2xl w-full mx-auto px-6 py-10">
        {step === "landing" && (
          <LandingStep onTryDemo={() => setStep("samples")} />
        )}
        {step === "samples" && (
          <SamplesStep
            samples={samples}
            onChange={setSamples}
            onNext={() => setStep("draft")}
          />
        )}
        {step === "draft" && (
          <DraftStep
            draft={draft}
            samples={samples}
            onChange={setDraft}
            onResult={(r) => {
              setResult(r);
              setStep("comparison");
            }}
            onBack={() => setStep("samples")}
          />
        )}
        {step === "comparison" && result && (
          <ComparisonStep
            result={result}
            onDone={() => setStep("thankyou")}
            onRetry={() => setStep("draft")}
          />
        )}
        {step === "thankyou" && <ThankYouStep />}
      </div>
    </main>
  );
}

function StepIndicator({ current }: { current: Step }) {
  const steps: Step[] = ["samples", "draft", "comparison", "thankyou"];
  const labels = ["Your Writing", "Message", "Compare", "Done"];
  const idx = steps.indexOf(current);
  return (
    <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-1.5">
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
              i < idx
                ? "bg-green-500 text-white"
                : i === idx
                ? "bg-gray-900 text-white"
                : "bg-gray-200 text-gray-400"
            }`}
          >
            {i < idx ? "✓" : i + 1}
          </div>
          <span className={i === idx ? "text-gray-900 font-medium" : "hidden sm:inline"}>
            {labels[i]}
          </span>
          {i < steps.length - 1 && <span className="text-gray-300">·</span>}
        </div>
      ))}
    </div>
  );
}
