const STEPS = [
  {
    n: "1",
    title: "Add to Chrome",
    body: "Install Writing Twin from the Chrome Web Store in one click. No account required to start.",
  },
  {
    n: "2",
    title: "Paste a few messages",
    body: "Drop in 3–5 emails or messages you've written. Writing Twin learns your voice in under 30 seconds.",
  },
  {
    n: "3",
    title: "One click rewrites in your voice",
    body: "Open Gmail, Outlook, LinkedIn, or Slack. Hit the Writing Twin button. Your AI draft becomes your voice, instantly.",
  },
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

        <div className="grid sm:grid-cols-3 gap-10">
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
      </div>
    </section>
  );
}
