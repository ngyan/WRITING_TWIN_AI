"use client";

import { useEffect, useState } from "react";

interface Props {
  className?: string;
}

export function WaitlistCounter({ className = "" }: Props) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/waitlist-count")
      .then((r) => r.json())
      .then((d: { count: number }) => setCount(d.count))
      .catch(() => {}); // fail silently — component stays hidden
  }, []);

  if (count === null) return null;

  const text =
    count < 10
      ? "Be among the first — early access open now"
      : `Join ${count.toLocaleString()} professionals on the early access list`;

  return (
    <p className={`text-xs text-neutral-400 text-center ${className}`}>{text}</p>
  );
}
