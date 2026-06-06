// Fill in the PLACEHOLDER text with actual data-handling policy before launch
const TRUST_BULLETS = [
  {
    icon: "🔒",
    title: "Your data is never sold",
    body: "[PLACEHOLDER: e.g. 'We never sell, share, or use your messages to train shared AI models. Your writing stays yours.']",
  },
  {
    icon: "✂️",
    title: "Messages processed, not stored",
    body: "[PLACEHOLDER: e.g. 'Your messages are sent to our API for rewriting and immediately discarded. Only your Writing DNA profile is stored — and only you can access it.']",
  },
  {
    icon: "🛡️",
    title: "Delete your data anytime",
    body: "[PLACEHOLDER: e.g. 'Delete your Writing DNA from the dashboard at any time. Instant, permanent, no questions asked.']",
  },
];

export function TrustPrivacy() {
  return (
    <section className="py-24 max-w-5xl mx-auto px-4 sm:px-6">
      <h2 className="text-3xl font-bold text-center text-ink dark:text-white mb-3">
        Your words stay yours.
      </h2>
      <p className="text-center text-neutral-500 mb-12">
        Built for professionals who need discretion.
      </p>

      <div className="grid sm:grid-cols-3 gap-6">
        {TRUST_BULLETS.map((b) => (
          <div key={b.title} className="card p-6">
            <div className="text-3xl mb-4">{b.icon}</div>
            <h3 className="font-semibold text-ink dark:text-white mb-2">{b.title}</h3>
            <p className="text-sm text-neutral-500 leading-relaxed">{b.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
