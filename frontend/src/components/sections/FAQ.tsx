"use client";

import { useState } from "react";
import { FAQ_ITEMS } from "@/data/faq";

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-24 max-w-3xl mx-auto px-4 sm:px-6">
      <h2 className="text-3xl font-bold text-center text-ink dark:text-white mb-12">
        Frequently asked questions
      </h2>

      <div className="space-y-2">
        {FAQ_ITEMS.map((item, i) => (
          <div
            key={i}
            className="border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden"
          >
            <button
              className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 font-medium text-ink dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors min-h-[44px]"
              onClick={() => setOpen(open === i ? null : i)}
              aria-expanded={open === i}
            >
              <span>{item.q}</span>
              <span
                className={`text-neutral-400 flex-shrink-0 transition-transform duration-200 ${
                  open === i ? "rotate-180" : ""
                }`}
              >
                ▾
              </span>
            </button>

            {open === i && (
              <div className="px-6 pb-5 text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                {item.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
