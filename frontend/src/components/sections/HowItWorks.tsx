const STEPS = [
  {
    n: "1",
    title: "Add to Chrome",
    body: "Install Writing Twin from the Chrome Web Store in one click. No account required to start.",
  },
  {
    n: "2",
    title: "Train your Writing DNA",
    body: "Paste 3–5 emails or messages you've written. Our 6-dimension engine extracts your tone, rhythm, vocabulary, formality gradient, signature patterns, and context style.",
  },
  {
    n: "3",
    title: "One click rewrites in your voice",
    body: "Open Gmail, hit the Writing Twin button. It auto-detects your recipient and subject, picks the right tone, and rewrites in your exact voice — instantly.",
  },
];

const DIMENSIONS = [
  { icon: "🎙️", label: "Tone" },
  { icon: "🎵", label: "Rhythm" },
  { icon: "📚", label: "Vocabulary" },
  { icon: "📊", label: "Formality" },
  { icon: "✍️", label: "Signature" },
  { icon: "🎯", label: "Context" },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="bg-neutral-50 dark:bg-neutral-800/50 py-24"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <h2 className="text-3xl font-bold text-center text-ink dark:text-white mb-3">
          Your voice, in three steps.
        </h2>
        <p className="text-center text-neutral-500 mb-14">
          No complex setup. No writing prompts. Just your voice.
        </p>

        <div className="grid sm:grid-cols-3 gap-10 mb-16">
          {STEPS.map((s) => (
            <div key={s.n} className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary-500 text-white font-bold text-lg flex items-center justify-center mb-4 shadow-glow">
                {s.n}
              </div>
              <h3 className="font-semibold text-ink dark:text-white mb-2">{s.title}</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>

        {/* 6-dimension framework */}
        <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 text-center mb-4">
            6 Writing Dimensions Captured
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
            {DIMENSIONS.map((d) => (
              <div key={d.label} className="flex flex-col items-center gap-1.5">
                <span className="text-2xl">{d.icon}</span>
                <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
