"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearSession, getToken } from "@/lib/api";

export function Nav() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsLoggedIn(!!getToken());
  }, []);

  function handleLogout() {
    clearSession();
    router.push("/");
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-100 dark:bg-neutral-900/80 dark:border-neutral-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-ink dark:text-white">
          <img src="/logo.svg" alt="Writing Twin AI" width={32} height={32} className="rounded-lg" />
          <span>Writing Twin</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link href="/pricing" className="btn-ghost hidden sm:inline-flex">
            Pricing
          </Link>
          {isLoggedIn ? (
            <>
              <Link href="/dashboard" className="btn-ghost">
                Dashboard
              </Link>
              <button onClick={handleLogout} className="btn-ghost text-neutral-400">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">
                Sign in
              </Link>
              <Link href="/register" className="btn-primary">
                Get started free
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
