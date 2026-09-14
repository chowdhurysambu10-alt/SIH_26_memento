-- Create Platform Settings Table
CREATE TABLE IF NOT EXISTS platform_settings (
  id integer PRIMARY KEY DEFAULT 1,
  maintenance_mode boolean DEFAULT false,
  ai_auto_triage boolean DEFAULT true,
  allow_public_comments boolean DEFAULT true,
  data_retention_days integer DEFAULT 365,
  enforce_geolocation boolean DEFAULT false,
  max_attachment_size_mb integer DEFAULT 10,
  enable_community_chat boolean DEFAULT true,
  enable_email_service boolean DEFAULT true,
  system_banner_text text DEFAULT ''
);

-- Insert the default row
INSERT INTO platform_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Grant permissions to standard API roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.platform_settings TO anon;
GRANT ALL ON TABLE public.platform_settings TO authenticated;
GRANT ALL ON TABLE public.platform_settings TO service_role;
