"use client";

interface Props {
  onTryDemo: () => void;
}

const BEFORE =
  "Hi Alex,\n\nI hope this message finds you well. I am writing to follow up on our previous discussion regarding the project timeline. Could you please share your availability for a meeting next week so we can align on next steps?\n\nBest regards";

const AFTER =
  "Hey Alex — wanted to loop back on the timeline chat. When are you free to sync this week? Trying to lock in the dates before EOD.\n\nThanks";

export default function LandingStep({ onTryDemo }: Props) {
  return (
    <div className="space-y-16">
      {/* Hero */}
      <div className="text-center space-y-6 pt-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-100 px-4 py-1.5 text-xs font-medium text-amber-700">
          Free early demo · No sign-up required
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight tracking-tight">
          Write Like Yourself.<br />
          <span className="text-gray-400">Not Like AI.</span>
        </h1>

        <p className="text-gray-500 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
          AI tools write formally and generically. Writing Twin learns your vocabulary,
          rhythm, and tone — then rewrites your drafts so they sound exactly like
          <em> you</em> wrote them.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onTryDemo}
            className="rounded-xl bg-gray-900 px-8 py-3.5 text-sm font-semibold text-white hover:bg-gray-700 transition-colors"
          >
            Try the Demo →
          </button>
          <a
            href="#example"
            className="rounded-xl border border-gray-200 px-8 py-3.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            See Example ↓
          </a>
        </div>

        <p className="text-xs text-gray-400">
          Takes 2 minutes · Your writing never leaves your browser session
        </p>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-3 gap-4 text-center">
        {[
          { step: "1", label: "Paste your writing", desc: "A few emails, messages, or posts you've written" },
          { step: "2", label: "Paste a draft", desc: "Something you want to send but want to polish" },
          { step: "3", label: "See the difference", desc: "Compare generic AI vs. your personal style" },
        ].map(({ step, label, desc }) => (
          <div key={step} className="space-y-2">
            <div className="w-8 h-8 rounded-full bg-gray-900 text-white text-sm font-semibold flex items-center justify-center mx-auto">
              {step}
            </div>
            <p className="text-sm font-medium text-gray-900">{label}</p>
            <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {/* Example */}
      <div id="example" className="space-y-4 scroll-mt-8">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Example</p>
          <p className="text-lg font-semibold text-gray-900 mt-1">Same message. Completely different voice.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-xl border-2 border-gray-100 bg-white px-5 py-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Generic AI</span>
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Formal · Corporate</span>
            </div>
            <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{BEFORE}</p>
          </div>

          <div className="rounded-xl border-2 border-gray-900 bg-gray-50 px-5 py-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-900">Writing Twin</span>
              <span className="text-xs bg-gray-900 text-white px-2 py-0.5 rounded-full">Sounds like you</span>
            </div>
            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{AFTER}</p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400">
          Writing Twin learned this person writes casually, concisely, and skips the filler phrases.
        </p>
      </div>

      {/* Bottom CTA */}
      <div className="text-center pb-6 space-y-3">
        <button
          onClick={onTryDemo}
          className="rounded-xl bg-gray-900 px-10 py-4 text-sm font-semibold text-white hover:bg-gray-700 transition-colors"
        >
          Try it with your own writing →
        </button>
        <p className="text-xs text-gray-400">No account. No credit card. 2 minutes.</p>
      </div>
    </div>
  );
}
