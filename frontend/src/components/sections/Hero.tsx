import { InstallButton } from "@/components/InstallButton";

export function Hero() {
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill bg-primary-50 border border-primary-100 text-primary-600 text-xs font-medium mb-6">
        <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
        Extension under review · Early access open
      </div>

      <h1 className="text-5xl sm:text-6xl font-bold text-ink dark:text-white leading-[1.05] tracking-tight mb-6">
        Sound like yourself in English —
        <br className="hidden sm:block" />
        <span className="text-primary-500"> not like AI.</span>
      </h1>

      <p className="text-lg text-neutral-500 max-w-2xl mx-auto mb-10 leading-relaxed">
        Writing Twin learns your voice and rewrites stiff, AI-sounding drafts into natural,
        professional messages that are unmistakably you — right inside Gmail, Outlook,
        LinkedIn, and Slack.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-4">
        <InstallButton location="hero" size="lg" />
        <a href="#how-it-works" className="btn-secondary text-base px-7 h-12">
          See how it works
        </a>
      </div>
      <p className="text-xs text-neutral-400">Free: 20 rewrites/month · No credit card required</p>

      {/* Demo GIF — drop your screen recording here */}
      <div className="mt-12 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-700 shadow-card bg-neutral-50 dark:bg-neutral-800 aspect-video max-w-3xl mx-auto flex items-center justify-center">
        <p className="text-sm text-neutral-400">[Demo GIF — place your screen recording here]</p>
      </div>
    </section>
  );
}
