const TRUST_BULLETS = [
  {
    icon: "🔒",
    title: "Your data is never sold",
    body: "We do not sell, rent, or share your writing with advertisers or third parties. Your words are yours.",
  },
  {
    icon: "✂️",
    title: "Messages processed, not stored",
    body: "Your text is sent to our AI to rewrite it and is not stored after the request completes. We do not build datasets from your messages.",
  },
  {
    icon: "🛡️",
    title: "Delete your data anytime",
    body: "Email support@writingtwinai.com and we will permanently delete your voice profile and all stored data within 48 hours.",
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
