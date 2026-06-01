"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Nav } from "@/components/Nav";
import { DnaProfile, MeResponse, UsageResponse, createPortal, getDnaProfile, getMe, getToken, getUsage } from "@/lib/api";

const PLAN_LABEL: Record<string, { label: string; color: string }> = {
  free:       { label: "Free",       color: "bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300" },
  pro:        { label: "Pro",        color: "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300" },
  team:       { label: "Team",       color: "bg-accent-50 text-accent-700 dark:bg-amber-900/30 dark:text-amber-300" },
  enterprise: { label: "Enterprise", color: "bg-ink text-white" },
};

function PlanBadge({ plan }: { plan: string }) {
  const cfg = PLAN_LABEL[plan] ?? PLAN_LABEL.free;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-pill text-xs font-semibold ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function UsageBar({ count, limit }: { count: number; limit: number | null }) {
  if (!limit) return (
    <p className="text-sm text-neutral-500">Unlimited rewrites on your plan.</p>
  );
  const pct = Math.min((count / limit) * 100, 100);
  const color = pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-accent-500" : "bg-primary-500";
  return (
    <div>
      <div className="flex justify-between text-xs text-neutral-500 mb-1.5">
        <span>{count} used today</span>
        <span>{limit - count} left</span>
      </div>
      <div className="h-2 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      {pct >= 90 && (
        <p className="text-xs text-red-500 mt-1.5">
          Almost at your daily limit.{" "}
          <Link href="/pricing" className="underline font-medium">Upgrade to Pro</Link> for unlimited.
        </p>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [dna, setDna] = useState<DnaProfile | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login?next=/dashboard");
      return;
    }
    Promise.all([getMe(), getUsage(), getDnaProfile()]).then(([m, u, d]) => {
      setMe(m);
      setUsage(u);
      setDna(d);
    });
  }, [router]);

  async function handleManageBilling() {
    setPortalLoading(true);
    try {
      const url = await createPortal(window.location.href);
      window.location.href = url;
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setPortalLoading(false);
    }
  }

  if (!me) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary-200 border-t-primary-500 animate-spin" />
      </div>
    );
  }

  const dnaStatus = dna?.extraction_status;
  const dnaTrained = dnaStatus === "complete";

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <Nav />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-ink dark:text-white">Dashboard</h1>
            <p className="text-sm text-neutral-500 mt-0.5">{me.email}</p>
          </div>
          <PlanBadge plan={me.plan} />
        </div>

        <div className="grid sm:grid-cols-2 gap-5">

          {/* Usage card */}
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-ink dark:text-white mb-4">Today&apos;s usage</h2>
            {usage ? (
              <UsageBar count={usage.today_count} limit={usage.daily_limit} />
            ) : (
              <div className="h-6 bg-neutral-100 dark:bg-neutral-700 rounded animate-pulse" />
            )}
            {usage && (
              <p className="text-xs text-neutral-400 mt-3">
                {usage.monthly_count} rewrites this month
              </p>
            )}
          </div>

          {/* Plan card */}
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-ink dark:text-white mb-1">Your plan</h2>
            <div className="flex items-center gap-2 mb-4">
              <PlanBadge plan={me.plan} />
            </div>
            {me.plan === "free" ? (
              <div>
                <p className="text-sm text-neutral-500 mb-4 leading-relaxed">
                  30 rewrites/day. Upgrade to Pro for unlimited rewrites and Writing DNA personalization.
                </p>
                <Link href="/pricing" className="btn-primary text-sm">
                  Upgrade to Pro — $15/mo
                </Link>
              </div>
            ) : (
              <div>
                <p className="text-sm text-neutral-500 mb-4">Unlimited rewrites. Billing managed via Stripe.</p>
                <button
                  onClick={handleManageBilling}
                  disabled={portalLoading}
                  className="btn-secondary text-sm"
                >
                  {portalLoading ? "Opening…" : "Manage billing"}
                </button>
              </div>
            )}
          </div>

          {/* Writing DNA card */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-ink dark:text-white">Writing DNA</h2>
              {dnaTrained ? (
                <span className="text-xs font-semibold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-pill">
                  Trained ✓
                </span>
              ) : (
                <span className="text-xs text-neutral-400 bg-neutral-100 dark:bg-neutral-700 px-2 py-0.5 rounded-pill">
                  {dnaStatus === "processing" ? "Training…" : "Not trained"}
                </span>
              )}
            </div>
            <p className="text-sm text-neutral-500 mb-4 leading-relaxed">
              {dnaTrained
                ? `Your voice is trained from ${dna?.sample_count ?? 0} writing samples. Rewrites will sound like you.`
                : "Train Writing Twin on your past emails and messages to get personalized rewrites."}
            </p>
            {!dnaTrained && (
              <Link href="/onboarding/dna" className="btn-secondary text-sm">
                {dnaStatus === "processing" ? "View training progress" : "Train my writing voice"}
              </Link>
            )}
            {dnaTrained && (
              <Link href="/onboarding/dna" className="btn-ghost text-sm px-0">
                Add more samples →
              </Link>
            )}
          </div>

          {/* Extension card */}
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-ink dark:text-white mb-1">Chrome Extension</h2>
            <p className="text-sm text-neutral-500 mb-4 leading-relaxed">
              The extension puts a ✦ Humanize button in Gmail, LinkedIn, Slack, and Outlook.
            </p>
            <a
              href="https://chrome.google.com/webstore"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-sm"
            >
              Add to Chrome
            </a>
          </div>

        </div>

        {/* Empty state — first rewrite prompt */}
        {usage && usage.today_count === 0 && (
          <div className="mt-8 card p-8 text-center">
            <div className="text-4xl mb-3">✦</div>
            <h3 className="font-semibold text-ink dark:text-white mb-2">Ready for your first rewrite?</h3>
            <p className="text-sm text-neutral-500 mb-5">
              Install the Chrome extension, open Gmail, and click the Humanize button in any compose window.
            </p>
            <a
              href="https://chrome.google.com/webstore"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              Install extension
            </a>
          </div>
        )}

      </div>
    </div>
  );
}
