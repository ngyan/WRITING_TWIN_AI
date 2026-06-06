"use client";

import { useState } from "react";

// Replace placeholder content with real examples before launch
const PAIRS = [
  {
    id: "email",
    label: "Follow-up email",
    before:
      "I wanted to circle back on the proposal we discussed in our previous meeting. I believe there are significant synergies we should leverage to maximize our mutual value proposition going forward.",
    after:
      "Hey — following up on the proposal. There's real overlap here and I think it's worth a proper call. Free for 30 minutes this week?",
  },
  {
    id: "linkedin",
    label: "LinkedIn message",
    before:
      "I hope this message finds you well. I am reaching out to express my interest in connecting with you to explore potential collaboration opportunities that may be mutually beneficial.",
    after:
      "Hi — I saw your post on building in public and it matched something I've been working on. Would love to exchange notes. Open to a quick chat?",
  },
  {
    id: "nonnative",
    label: "Non-native → natural",
    before:
      "Dear Sir, I am writing to you in regards to the project status. As per our last discussion I want to update you that things are going in progress and I will revert back with details.",
    after:
      "Quick update — we're on track from our last chat. I'll send the full breakdown by Thursday.",
  },
];

export function BeforeAfter() {
  const [active, setActive] = useState("email");
  const pair = PAIRS.find((p) => p.id === active)!;

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-24">
      <h2 className="text-3xl font-bold text-center text-ink dark:text-white mb-3">
        See the difference one click makes.
      </h2>
      <p className="text-center text-neutral-500 mb-8">
        Toggle between examples to see Writing Twin in action.
      </p>

      <div className="flex gap-2 justify-center mb-6 flex-wrap">
        {PAIRS.map((p) => (
          <button
            key={p.id}
            onClick={() => setActive(p.id)}
            className={`px-4 h-9 min-h-[44px] rounded-pill text-sm font-medium transition-colors ${
              active === p.id
                ? "bg-primary-500 text-white"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-0 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-700 shadow-card">
        <div className="p-6 bg-neutral-50 dark:bg-neutral-800">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">
            Before
          </p>
          <p className="text-sm text-neutral-500 font-mono leading-relaxed">{pair.before}</p>
        </div>
        <div className="p-6 bg-accent-50 dark:bg-neutral-700/50 sm:border-l border-t sm:border-t-0 border-neutral-200 dark:border-neutral-600">
          <p className="text-xs font-semibold text-accent-600 uppercase tracking-widest mb-3">
            After ✦
          </p>
          <p className="text-sm text-neutral-800 dark:text-neutral-100 font-mono leading-relaxed">
            {pair.after}
          </p>
        </div>
      </div>
    </section>
  );
}
