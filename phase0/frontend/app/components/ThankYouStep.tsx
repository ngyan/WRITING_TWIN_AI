export default function ThankYouStep() {
  return (
    <div className="text-center space-y-6 py-10">
      <div className="text-5xl">✓</div>
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Thanks for testing!</h1>
        <p className="mt-3 text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
          Your feedback helps us validate whether Writing Twin creates a meaningful
          &ldquo;sounds like me&rdquo; experience before we build the full product.
        </p>
      </div>

      <div className="rounded-xl bg-gray-50 border border-gray-100 px-6 py-5 text-left max-w-md mx-auto space-y-3">
        <p className="text-sm font-medium text-gray-700">What happens next</p>
        <ul className="text-sm text-gray-500 space-y-2">
          <li className="flex gap-2">
            <span className="text-gray-300">→</span>
            We&apos;re running this demo with ~20 professionals to validate the core hypothesis.
          </li>
          <li className="flex gap-2">
            <span className="text-gray-300">→</span>
            If 70%+ prefer the personalized version, we&apos;ll build the Chrome Extension next.
          </li>
          <li className="flex gap-2">
            <span className="text-gray-300">→</span>
            Early access users will get a 60-day free Pro trial when it launches.
          </li>
        </ul>
      </div>

      <button
        onClick={() => window.location.reload()}
        className="text-sm text-gray-500 hover:text-gray-900 underline underline-offset-2"
      >
        Test another message
      </button>
    </div>
  );
}
