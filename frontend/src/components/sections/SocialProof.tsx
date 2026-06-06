import { WaitlistCounter } from "@/components/ui/WaitlistCounter";

const STAT_CARDS = [
  { value: "Gmail · Outlook · LinkedIn · Slack", label: "Works in" },
  { value: "< 60 sec",                            label: "To your first rewrite" },
  { value: "Manifest V3",                         label: "Chrome standard" },
];

export function SocialProof() {
  return (
    <section className="py-24 max-w-5xl mx-auto px-4 sm:px-6">
      <h2 className="text-2xl font-bold text-center text-ink dark:text-white mb-8">
        Trusted by early users
      </h2>

      {/* Row 1 — live waitlist count */}
      <div className="mb-10">
        <WaitlistCounter className="text-sm" />
      </div>

      {/* Row 2 — stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {STAT_CARDS.map((s) => (
          <div key={s.label} className="card p-5 text-center">
            <p className="font-semibold text-ink dark:text-white text-sm mb-1">
              {s.value}
            </p>
            <p className="text-xs text-neutral-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Row 3 — single early-access testimonial */}
      {/* TODO: replace with real testimonial + real name + photo once collected */}
      <div className="max-w-xl mx-auto card p-6 border-l-4 border-l-primary-200 dark:border-l-primary-800">
        <span className="inline-flex items-center px-2 py-0.5 rounded-pill bg-primary-50 border border-primary-100 text-primary-600 text-xs font-medium mb-3">
          Early access member
        </span>
        <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed mb-4">
          &ldquo;My emails finally sound like something I&apos;d actually write.&rdquo;
        </p>
        <p className="text-xs text-neutral-400">
          Early access member · Product Manager
        </p>
      </div>
    </section>
  );
}
