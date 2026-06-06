import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-neutral-100 dark:border-neutral-800 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="" width={18} height={18} />
          <p>© {new Date().getFullYear()} Writing Twin AI. All rights reserved.</p>
        </div>
        <div className="flex flex-wrap gap-6 justify-center">
          <Link href="/pricing" className="hover:text-neutral-600 transition-colors">
            Pricing
          </Link>
          <Link href="/vs-grammarly" className="hover:text-neutral-600 transition-colors">
            vs Grammarly
          </Link>
          <Link href="/for/non-native-english" className="hover:text-neutral-600 transition-colors">
            Non-Native Speakers
          </Link>
          <Link href="/support" className="hover:text-neutral-600 transition-colors">
            Support
          </Link>
          <Link href="/privacy" className="hover:text-neutral-600 transition-colors">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-neutral-600 transition-colors">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}
