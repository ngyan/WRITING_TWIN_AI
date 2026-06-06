const PILLS = [
  "✓ Free to start",
  "✓ No credit card",
  "✓ Works in Gmail · Outlook · LinkedIn · Slack",
  "✓ Manifest V3",
];

export function TrustPills() {
  return (
    <div className="flex flex-wrap justify-center items-center gap-y-1.5 text-xs text-neutral-400">
      {PILLS.map((pill, i) => (
        <span key={pill} className="flex items-center">
          <span>{pill}</span>
          {i < PILLS.length - 1 && (
            <span className="mx-2 text-neutral-300 dark:text-neutral-600 select-none" aria-hidden>
              ·
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
