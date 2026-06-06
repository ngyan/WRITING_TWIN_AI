"use client";

import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";

interface Props {
  onClose: () => void;
}

export function WaitlistModal({ onClose }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("server_error");
      track("waitlist_signup", { email });
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Join the waitlist"
    >
      <div
        className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl max-w-md w-full p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {status === "success" ? (
          <div className="text-center">
            <div className="text-4xl mb-4">🎉</div>
            <h2 className="text-xl font-bold text-ink dark:text-white mb-2">You&apos;re on the list!</h2>
            <p className="text-neutral-500 text-sm mb-6 leading-relaxed">
              We&apos;ll email you the moment the extension is approved on the Chrome Web Store — plus your founding member pricing is locked in.
            </p>
            <button onClick={onClose} className="btn-primary">
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-ink dark:text-white">Get early access</h2>
                <p className="text-neutral-500 text-sm mt-1 leading-relaxed">
                  Extension is under review. We&apos;ll notify you the moment it&apos;s live.
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-neutral-400 hover:text-neutral-600 text-2xl leading-none ml-4 flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                required
                className="input"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
              {status === "error" && (
                <p className="text-xs text-red-500">Something went wrong — try again.</p>
              )}
              <button
                type="submit"
                disabled={status === "loading"}
                className="btn-primary w-full"
              >
                {status === "loading" ? "Joining…" : "Join the waitlist — free"}
              </button>
            </form>
            <p className="text-xs text-neutral-400 mt-3 text-center">
              No spam. One email when we launch.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
