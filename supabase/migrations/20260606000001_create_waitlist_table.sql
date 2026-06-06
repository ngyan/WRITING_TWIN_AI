-- Writing Twin AI — Waitlist table
-- Stores emails captured while the Chrome extension is pending Web Store review.
-- Switch NEXT_PUBLIC_CTA_MODE=install once the extension is live.

CREATE TABLE IF NOT EXISTS public.waitlist (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Case-insensitive unique constraint so foo@Bar.com and foo@bar.com are the same signup
CREATE UNIQUE INDEX IF NOT EXISTS waitlist_email_lower_idx
  ON public.waitlist (LOWER(email));

-- Enable RLS (server-side route uses the service role key and bypasses this,
-- but enabling RLS ensures the anon key can never read the list accidentally)
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- No policies needed for anon — service role bypasses RLS entirely.
-- Add a policy here if you want anon SELECT (e.g. admin UI):
-- CREATE POLICY "service role only" ON public.waitlist USING (false);

COMMENT ON TABLE  public.waitlist IS 'Early-access waitlist emails collected before Chrome Web Store approval.';
COMMENT ON COLUMN public.waitlist.email IS 'Normalised to lowercase on insert via the API route.';
