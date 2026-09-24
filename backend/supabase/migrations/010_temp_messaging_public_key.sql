-- Add public_key to temp_mail_aliases for Public-Key E2EE
ALTER TABLE public.temp_mail_aliases ADD COLUMN IF NOT EXISTS public_key TEXT NOT NULL DEFAULT '';
