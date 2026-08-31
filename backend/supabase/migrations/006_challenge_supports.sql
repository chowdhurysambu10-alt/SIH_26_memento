-- 006_challenge_supports.sql
-- Dedicated 1-Vote-Per-User Support / Upvote System for Memento

CREATE TABLE IF NOT EXISTS challenge_supports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_challenge_support UNIQUE(challenge_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_challenge_supports_c_u ON challenge_supports(challenge_id, user_id);

ALTER TABLE challenge_supports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS challenge_supports_read ON challenge_supports;
CREATE POLICY challenge_supports_read ON challenge_supports 
  FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS challenge_supports_insert ON challenge_supports;
CREATE POLICY challenge_supports_insert ON challenge_supports 
  FOR INSERT 
  WITH CHECK (true);

DROP POLICY IF EXISTS challenge_supports_delete ON challenge_supports;
CREATE POLICY challenge_supports_delete ON challenge_supports 
  FOR DELETE 
  USING (true);

-- Realtime replication
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE challenge_supports;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_object THEN null;
END $$;
