"use client";

import { useEffect } from "react";
import { trackScrollDepth } from "@/lib/analytics";

export function ScrollDepthTracker() {
  useEffect(() => {
    window.addEventListener("scroll", trackScrollDepth, { passive: true });
    return () => window.removeEventListener("scroll", trackScrollDepth);
  }, []);

  return null;
}
