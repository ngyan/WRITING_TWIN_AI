import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// Revalidate cached response every 60 seconds
export const revalidate = 60;

export async function GET() {
  // Return 0 at build time when env vars are absent (prerender produces a stub)
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ count: 0 });
  }

  const { count, error } = await getSupabase()
    .from("waitlist")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("[waitlist-count]", error.message);
    return NextResponse.json({ count: 0 });
  }

  return NextResponse.json({ count: count ?? 0 });
}
