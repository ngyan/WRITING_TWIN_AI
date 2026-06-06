// Replace placeholders with real testimonials before launch
const TESTIMONIALS = [
  {
    name: "[Name — e.g. Shreya M.]",
    role: "Product Manager",
    company: "[Company]",
    photo: null as string | null,
    quote:
      "[PLACEHOLDER: Real testimonial from a non-native English professional — e.g. 'I used to spend 20 minutes editing every email. Now I paste my draft, click once, and it sounds exactly like me — but better.']",
  },
  {
    name: "[Name — e.g. Carlos R.]",
    role: "Founder",
    company: "[Company]",
    photo: null as string | null,
    quote:
      "[PLACEHOLDER: Testimonial about confidence in English — e.g. 'My LinkedIn messages finally sound like something I'd actually write. Not like ChatGPT.']",
  },
  {
    name: "[Name — e.g. Aiko T.]",
    role: "Sales Lead",
    company: "[Company]",
    photo: null as string | null,
    quote:
      "[PLACEHOLDER: Testimonial about the workflow — e.g. 'The one-click workflow is the whole product. I don't think about it anymore — it just works.']",
  },
];

export function SocialProof() {
  return (
    <section className="py-24 max-w-5xl mx-auto px-4 sm:px-6">
      <h2 className="text-2xl font-bold text-center text-ink dark:text-white mb-4">
        What early users say
      </h2>

      {/* Chrome Web Store rating badge slot */}
      <div className="flex justify-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-pill border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-500">
          <span className="text-yellow-400">★★★★★</span>
          <span>[Chrome Web Store rating — fill after approval]</span>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-6">
        {TESTIMONIALS.map((t, i) => (
          <div key={i} className="card p-6 flex flex-col">
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed mb-4 flex-1">
              &ldquo;{t.quote}&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-xs text-neutral-400 flex-shrink-0 overflow-hidden">
                {t.photo ? (
                  <img src={t.photo} alt={t.name} className="w-full h-full object-cover" />
                ) : (
                  <span>?</span>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-ink dark:text-white">{t.name}</p>
                <p className="text-xs text-neutral-400">
                  {t.role}
                  {t.company ? `, ${t.company}` : ""}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
