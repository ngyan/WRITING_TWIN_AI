import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({})) as { email?: unknown };
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  const { error } = await getSupabase()
    .from("waitlist")
    .insert({ email });

  if (error) {
    // 23505 = unique_violation — email already on the list
    if (error.code === "23505") {
      return NextResponse.json({ success: true, already: true });
    }
    console.error("[waitlist] insert error:", error.message);
    return NextResponse.json(
      { error: "Could not save your email. Please try again." },
      { status: 500 },
    );
  }

  // Notify support@writingtwinai.com — fire-and-forget, never blocks the user response
  if (process.env.RESEND_API_KEY) {
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Writing Twin AI <noreply@writingtwinai.com>",
        to: ["support@writingtwinai.com"],
        subject: `New waitlist signup: ${email}`,
        text: `New waitlist signup\n\nEmail: ${email}\nTime: ${new Date().toISOString()}`,
      }),
    }).catch((err) => console.error("[waitlist] notify email failed:", err));
  }

  return NextResponse.json({ success: true });
}
