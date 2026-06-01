"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Nav } from "@/components/Nav";
import {
  DnaProfile,
  MeResponse,
  UsageResponse,
  createPortal,
  getDnaProfile,
  getMe,
  getToken,
  getUsage,
} from "@/lib/api";

const PLAN_DISPLAY: Record<string, { label: string; color: string; description: string }> = {
  free: {
    label: "Free Beta",
    color: "bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300",
    description: "20 rewrites per month.",
  },
  pro: {
    label: "Pro Early Adopter",
    color: "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300",
    description: "300 rewrites per month. Founding Member pricing locked in.",
  },
  enterprise: {
    label: "Enterprise",
    color: "bg-ink text-white",
    description: "Unlimited rewrites.",
  },
};

function PlanBadge({ plan }: { plan: string }) {
  const cfg = PLAN_DISPLAY[plan] ?? PLAN_DISPLAY.free;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-pill text-xs font-semibold ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function MonthlyUsageBar({ count, limit }: { count: number; limit: number | null }) {
  if (!limit) {
    return <p className="text-sm text-neutral-500">Unlimited rewrites on your plan.</p>;
  }
  const pct = Math.min((count / limit) * 100, 100);
  const remaining = limit - count;
  const nearLimit = pct >= 80;
  const atLimit = count >= limit;
  const barColor = atLimit ? "bg-red-500" : nearLimit ? "bg-accent-500" : "bg-primary-500";

  return (
    <div>
      <div className="flex justify-between text-xs text-neutral-500 mb-1.5">
        <span>{count} of {limit} used this month</span>
        <span>{remaining > 0 ? `${remaining} left` : "Limit reached"}</span>
      </div>
      <div className="h-2 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {atLimit && (
        <div className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800">
          <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-2">
            You&apos;ve used all {limit} rewrites for this month.
          </p>
          <p className="text-xs text-red-500 dark:text-red-400 mb-3">
            Continue writing in your own voice with up to 300 rewrites per month.
          </p>
          <Link href="/pricing" className="btn-primary text-xs h-8 px-4">
            Upgrade to Pro — $5/mo
          </Link>
        </div>
      )}
      {nearLimit && !atLimit && (
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5">
          Running low.{" "}
          <Link href="/pricing" className="underline font-medium">
            Upgrade to Pro
          </Link>{" "}
          for 300 rewrites/month at $5.
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

  const dnaTrained = dna?.extraction_status === "complete";
  const dnaProcessing = dna?.extraction_status === "processing";
  const planCfg = PLAN_DISPLAY[me.plan] ?? PLAN_DISPLAY.free;

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

          {/* Monthly usage */}
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-ink dark:text-white mb-4">Monthly usage</h2>
            {usage ? (
              <MonthlyUsageBar count={usage.monthly_count} limit={usage.monthly_limit} />
            ) : (
              <div className="h-6 bg-neutral-100 dark:bg-neutral-700 rounded animate-pulse" />
            )}
          </div>

          {/* Plan */}
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-ink dark:text-white mb-2">Your plan</h2>
            <div className="flex items-center gap-2 mb-3">
              <PlanBadge plan={me.plan} />
            </div>
            <p className="text-sm text-neutral-500 mb-4 leading-relaxed">{planCfg.description}</p>
            {me.plan === "free" ? (
              <Link href="/pricing" className="btn-primary text-sm">
                Upgrade to Pro — $5/mo
              </Link>
            ) : (
              <button
                onClick={handleManageBilling}
                disabled={portalLoading}
                className="btn-secondary text-sm"
              >
                {portalLoading ? "Opening…" : "Manage billing"}
              </button>
            )}
          </div>

          {/* Writing DNA */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-ink dark:text-white">Writing DNA</h2>
              {dnaTrained ? (
                <span className="text-xs font-semibold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-pill">
                  Trained ✓
                </span>
              ) : dnaProcessing ? (
                <span className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-pill">
                  Training…
                </span>
              ) : (
                <span className="text-xs text-neutral-400 bg-neutral-100 dark:bg-neutral-700 px-2 py-0.5 rounded-pill">
                  Not trained
                </span>
              )}
            </div>
            <p className="text-sm text-neutral-500 mb-4 leading-relaxed">
              {dnaTrained
                ? `Trained from ${dna?.sample_count ?? 0} writing samples. Your rewrites will sound like you.`
                : "Paste a few of your emails or messages to train your writing voice."}
            </p>
            <Link href="/onboarding/dna" className={dnaTrained ? "btn-ghost text-sm px-0" : "btn-secondary text-sm"}>
              {dnaTrained ? "Add more samples →" : "Train my writing voice"}
            </Link>
          </div>

          {/* Chrome Extension */}
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-ink dark:text-white mb-2">Chrome Extension</h2>
            <p className="text-sm text-neutral-500 mb-4 leading-relaxed">
              Puts a ✦ Humanize button in Gmail, LinkedIn, Slack, and Outlook. One click rewrites in your voice.
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

        {/* Empty state — first rewrite */}
        {usage && usage.monthly_count === 0 && (
          <div className="mt-8 card p-8 text-center">
            <div className="text-4xl mb-3">✦</div>
            <h3 className="font-semibold text-ink dark:text-white mb-2">Make your first rewrite</h3>
            <p className="text-sm text-neutral-500 mb-5 max-w-sm mx-auto leading-relaxed">
              Install the extension, open Gmail, and click the Humanize button in any compose window.
              Your first rewrite takes under 5 seconds.
            </p>
            <a
              href="https://chrome.google.com/webstore"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              Install Chrome Extension
            </a>
          </div>
        )}

      </div>
    </div>
  );
}
