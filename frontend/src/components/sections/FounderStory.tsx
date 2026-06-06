export function FounderStory() {
  return (
    <section className="bg-neutral-50 dark:bg-neutral-800/50 py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
          <div className="w-20 h-20 rounded-full bg-neutral-200 dark:bg-neutral-700 flex-shrink-0 overflow-hidden">
            <img src="/founder.jpg" alt="Founder" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-ink dark:text-white mb-4">
              Why I built this
            </h2>
            <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed text-sm mb-2">
              I&apos;m an engineer from India, living and working in South Korea. English is
              my professional language — I use it every day for emails, messages, and client
              communication. When AI writing tools arrived I thought they&apos;d finally make it
              effortless. Instead every draft came back sounding like the same robot. Formal,
              hollow, nobody&apos;s voice. I built Writing Twin because I wanted something that
              learned how I actually write — not what AI thinks professional English should
              sound like.
            </p>
            <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed text-sm mb-5">
              Writing Twin is the only tool that starts with your voice — not a generic
              template of what professional English is supposed to sound like.
            </p>
            <p className="text-xs text-neutral-400">Founder, Writing Twin AI</p>
          </div>
        </div>
      </div>
    </section>
  );
}
