export function FounderStory() {
  return (
    <section className="bg-neutral-50 dark:bg-neutral-800/50 py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
          {/* Founder photo slot */}
          <div className="w-20 h-20 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-neutral-400 text-xs flex-shrink-0 overflow-hidden">
            [Photo]
          </div>
          <div>
            <h2 className="text-2xl font-bold text-ink dark:text-white mb-4">
              Why I built this
            </h2>
            <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed text-sm mb-2">
              [PLACEHOLDER: 2–3 sentence founder note. Make it personal and specific — e.g. the
              exact moment you realized stiff AI-sounding emails were costing you professionally,
              or a colleague who was brilliant but invisible because their English didn&apos;t
              match their thinking.]
            </p>
            <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed text-sm mb-5">
              [PLACEHOLDER: Second paragraph — what Writing Twin does that nothing else does, in
              one sentence.]
            </p>
            <p className="text-sm font-semibold text-ink dark:text-white">[Founder Name]</p>
            <p className="text-xs text-neutral-400">Founder, Writing Twin AI</p>
          </div>
        </div>
      </div>
    </section>
  );
}
