"use client";

import { useState } from "react";
import { track } from "@/lib/analytics";
import { WaitlistModal } from "./WaitlistModal";

// Single source of truth for the Chrome Web Store URL.
// All CTAs across the site use this component — never hardcode the URL elsewhere.
const CHROME_STORE_URL = process.env.NEXT_PUBLIC_CHROME_STORE_URL ?? "#";
const CTA_MODE = (process.env.NEXT_PUBLIC_CTA_MODE ?? "waitlist") as "waitlist" | "install";

interface Props {
  location: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "inverse";
}

export function InstallButton({
  location,
  className = "",
  size = "md",
  variant = "default",
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  function handleClick() {
    track("cta_clicked", { location, mode: CTA_MODE });
    if (CTA_MODE === "install") {
      window.open(CHROME_STORE_URL, "_blank", "noopener,noreferrer");
    } else {
      setModalOpen(true);
    }
  }

  const sizeClass =
    size === "lg" ? "text-base px-7 h-12" : size === "sm" ? "text-xs px-4 h-9" : "";

  const variantClass =
    variant === "inverse"
      ? "inline-flex items-center justify-center gap-2 rounded-pill bg-white text-primary-600 font-semibold shadow-md hover:bg-primary-50 transition-all duration-150 active:scale-[0.98]"
      : "btn-primary";

  const label = CTA_MODE === "install" ? "Add to Chrome — Free" : "Get early access — Free";

  return (
    <>
      <button
        onClick={handleClick}
        className={`${variantClass} ${sizeClass} ${className}`.trim()}
      >
        ✦ {label}
      </button>
      {modalOpen && <WaitlistModal onClose={() => setModalOpen(false)} />}
    </>
  );
}
