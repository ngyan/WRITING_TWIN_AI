/* eslint-disable @typescript-eslint/no-explicit-any */

export function track(event: string, props?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  const w = window as any;
  // PostHog (primary — initialized via PostHogProvider)
  w.posthog?.capture?.(event, props);
  // Plausible (wire in via _app or script tag)
  w.plausible?.(event, { props });
  // GA4 (wire in via Script tag)
  w.gtag?.("event", event, props);
}

const DEPTHS_FIRED = new Set<number>();

export function trackScrollDepth(): void {
  const depth = Math.round(
    ((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight) * 100,
  );
  for (const threshold of [25, 50, 75, 100] as const) {
    if (depth >= threshold && !DEPTHS_FIRED.has(threshold)) {
      DEPTHS_FIRED.add(threshold);
      track("scroll_depth", { depth: threshold });
    }
  }
}
