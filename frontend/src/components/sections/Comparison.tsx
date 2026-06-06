type ToolKey = "grammarly" | "jasper" | "twin";

type ComparisonRow = {
  feature: string;
} & Record<ToolKey, boolean>;

const ROWS: ComparisonRow[] = [
  { feature: "Fixes grammar and spelling",             grammarly: true,  jasper: false, twin: true  },
  { feature: "Writes in your personal voice",          grammarly: false, jasper: false, twin: true  },
  { feature: "Works inside Gmail / Outlook",           grammarly: true,  jasper: false, twin: true  },
  { feature: "Works inside LinkedIn / Slack",          grammarly: true,  jasper: false, twin: true  },
  { feature: "Learns from your own writing",           grammarly: false, jasper: false, twin: true  },
  { feature: "One-click rewrite",                      grammarly: false, jasper: false, twin: true  },
  { feature: "Doesn't sound like AI after rewriting",  grammarly: false, jasper: false, twin: true  },
];

const COLS: { name: string; key: ToolKey; highlight?: boolean }[] = [
  { name: "Grammarly",       key: "grammarly" },
  { name: "Jasper AI",       key: "jasper"    },
  { name: "Writing Twin ✦", key: "twin",  highlight: true },
];

function Check({ yes }: { yes: boolean }) {
  return yes ? (
    <span className="text-green-500 font-bold text-base">✓</span>
  ) : (
    <span className="text-neutral-300 dark:text-neutral-600 text-base">–</span>
  );
}

export function Comparison() {
  return (
    <section className="bg-neutral-50 dark:bg-neutral-800/50 py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <h2 className="text-3xl font-bold text-center text-ink dark:text-white mb-3">
          Not just another AI writer.
        </h2>
        <p className="text-center text-neutral-500 mb-12">
          The only tool that rewrites AI output in your specific voice.
        </p>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-100 dark:bg-neutral-700/50">
                <th className="text-left px-6 py-4 font-semibold text-ink dark:text-white">
                  Feature
                </th>
                {COLS.map((c) => (
                  <th
                    key={c.key}
                    className={`text-center px-4 py-4 font-semibold ${
                      c.highlight
                        ? "text-primary-500 bg-primary-50 dark:bg-primary-900/20"
                        : "text-neutral-500"
                    }`}
                  >
                    {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r, i) => (
                <tr
                  key={r.feature}
                  className={
                    i % 2 === 0
                      ? "bg-white dark:bg-neutral-800"
                      : "bg-neutral-50/50 dark:bg-neutral-800/50"
                  }
                >
                  <td className="px-6 py-3 text-neutral-700 dark:text-neutral-300">
                    {r.feature}
                  </td>
                  {COLS.map((c) => (
                    <td
                      key={c.key}
                      className={`px-4 py-3 text-center ${
                        c.highlight ? "bg-primary-50/30 dark:bg-primary-900/10" : ""
                      }`}
                    >
                      <Check yes={r[c.key]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile stacked cards */}
        <div className="sm:hidden space-y-4">
          {COLS.map((col) => (
            <div
              key={col.key}
              className={`card p-5 ${col.highlight ? "ring-2 ring-primary-300 dark:ring-primary-700" : ""}`}
            >
              <h3
                className={`font-semibold mb-3 ${
                  col.highlight ? "text-primary-500" : "text-ink dark:text-white"
                }`}
              >
                {col.name}
              </h3>
              <ul className="space-y-2">
                {ROWS.map((r) => (
                  <li key={r.feature} className="flex items-center gap-2 text-sm min-h-[44px]">
                    <Check yes={r[col.key]} />
                    <span className="text-neutral-600 dark:text-neutral-400">{r.feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
