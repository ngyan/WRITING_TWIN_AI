import Link from "next/link";
import { InstallButton } from "@/components/InstallButton";

export function PricingTeaser() {
  return (
    <section className="py-24 max-w-3xl mx-auto px-4 sm:px-6 text-center">
      <span className="inline-flex items-center px-3 py-1 rounded-pill bg-accent-50 border border-accent-100 text-accent-700 text-xs font-semibold mb-4">
        Founding Member Pricing
      </span>
      <h2 className="text-3xl font-bold text-ink dark:text-white mb-3">
        Start free. Upgrade for $5/mo as a founding member.
      </h2>
      <p className="text-neutral-500 mb-2 leading-relaxed max-w-sm mx-auto">
        300 rewrites per month. Lock in this price forever — it goes up when we exit beta.
      </p>
      <p className="text-sm text-neutral-400 mb-8">
        Free plan: 20 rewrites/month, no card needed.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
        <InstallButton location="pricing_teaser" />
        <Link href="/pricing" className="btn-secondary">
          See full plans
        </Link>
      </div>
    </section>
  );
}
