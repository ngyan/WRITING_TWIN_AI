"use client";

import { useEffect, useState } from "react";
import { InstallButton } from "@/components/InstallButton";

const BEFORE =
  "Just wanted to circle back on the proposal. I think there are some synergies we could leverage to maximize our value proposition going forward.";
const AFTER =
  "Hey — following up on the proposal. I think there's real overlap here and it's worth a proper conversation. Want to find 30 minutes this week?";

const CHAR_DELAY = 22; // ms per char — full AFTER text types in ~3.2s

type Phase = "before" | "button" | "typing" | "hold" | "fading";

export function AnimatedDemo() {
  const [phase, setPhase] = useState<Phase>("before");
  const [typed, setTyped] = useState("");
  const [cardVisible, setCardVisible] = useState(true);

  // Phase transitions (everything except typewriter completion)
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    switch (phase) {
      case "before":  t = setTimeout(() => setPhase("button"),  2000); break;
      case "button":  t = setTimeout(() => setPhase("typing"),   500); break;
      case "hold":    t = setTimeout(() => setPhase("fading"),  2000); break;
      case "fading":
        setCardVisible(false);
        t = setTimeout(() => { setTyped(""); setCardVisible(true); setPhase("before"); }, 500);
        break;
    }
    return () => clearTimeout(t);
  }, [phase]);

  // Typewriter — one char per tick; transitions to "hold" on completion
  useEffect(() => {
    if (phase !== "typing") return;
    if (typed.length >= AFTER.length) { setPhase("hold"); return; }
    const t = setTimeout(
      () => setTyped(AFTER.slice(0, typed.length + 1)),
      CHAR_DELAY,
    );
    return () => clearTimeout(t);
  }, [phase, typed]);

  const showBefore  = phase === "before" || phase === "button";
  const showAfter   = phase === "typing"  || phase === "hold";
  const showButton  = phase === "button"  || phase === "typing";
  const showBadge   = phase === "hold";

  return (
    <div className="mt-12 max-w-2xl mx-auto px-1">
      {/* Card */}
      <div
        className={`rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-card overflow-hidden transition-opacity duration-500 ${
          cardVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Browser chrome bar */}
        <div className="flex items-center px-4 py-2.5 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex gap-1.5 flex-shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
          </div>
          <span className="text-xs text-neutral-400 flex-1 text-center">Gmail</span>
          {/* Spacer to visually balance the dot cluster */}
          <span className="w-[52px] flex-shrink-0" />
        </div>

        {/* Email interface */}
        <div className="bg-neutral-50 dark:bg-neutral-800 px-4 sm:px-5 pt-4 pb-5">
          <p className="text-xs text-neutral-400 mb-1">
            To:{" "}
            <span className="text-neutral-300 dark:text-neutral-600">
              sarah@acme.com
            </span>
          </p>
          <p className="text-xs text-neutral-400 mb-4">
            Subject:{" "}
            <span className="text-neutral-300 dark:text-neutral-600">
              Re: Q3 Proposal
            </span>
          </p>

          {/* Body — spacer sets height from BEFORE (longer text); content is absolute */}
          <div className="relative pb-8">
            <p
              className="invisible font-mono text-sm sm:text-base leading-relaxed"
              aria-hidden="true"
            >
              {BEFORE}
            </p>

            {/* Before text */}
            <p
              className={`absolute inset-0 font-mono text-sm sm:text-base leading-relaxed text-neutral-500 dark:text-neutral-400 transition-opacity duration-300 ${
                showBefore ? "opacity-100" : "opacity-0"
              }`}
            >
              {BEFORE}
            </p>

            {/* After text */}
            <p
              className={`absolute inset-0 font-mono text-sm sm:text-base leading-relaxed text-neutral-800 dark:text-neutral-100 transition-opacity duration-200 ${
                showAfter ? "opacity-100" : "opacity-0"
              }`}
            >
              {typed}
              {phase === "typing" && (
                <span className="animate-pulse ml-px">|</span>
              )}
            </p>

            {/* Rewrite button — bottom-right of body */}
            <div
              className={`absolute bottom-0 right-0 transition-opacity duration-200 ${
                showButton ? "opacity-100" : "opacity-0"
              }`}
              aria-hidden="true"
            >
              <span
                className={`inline-flex items-center gap-1.5 px-3 h-7 rounded-pill bg-primary-500 text-white text-xs font-semibold shadow-glow ${
                  phase === "button" ? "animate-pulse" : ""
                }`}
              >
                ✦ WritingTwin Rewrite
              </span>
            </div>

            {/* Rewritten badge — bottom-left */}
            <div
              className={`absolute bottom-0 left-0 transition-opacity duration-300 ${
                showBadge ? "opacity-100" : "opacity-0"
              }`}
              aria-hidden="true"
            >
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill bg-accent-50 border border-accent-100 text-accent-700 text-xs font-medium">
                ✦ Rewritten in your voice
              </span>
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-neutral-400 text-center mt-3 mb-5">
        Before: AI draft → After: Your voice
      </p>
      <div className="flex justify-center">
        <InstallButton location="animated-demo" />
      </div>
    </div>
  );
}
