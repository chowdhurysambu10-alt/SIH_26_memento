-- 005_new_dashboards_and_tables.sql
-- Migration for Memento 3-Dashboard Architecture (SIH 2026 Problem Statement 26043)

-- 1. Ensure columns exist on challenges table
ALTER TABLE IF EXISTS challenges 
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS priority_score NUMERIC(5, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS support_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_summary TEXT,
  ADD COLUMN IF NOT EXISTS ai_confidence NUMERIC(3, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS model_used TEXT DEFAULT 'gemma-2',
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Backfill user_id from submitted_by if present
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='challenges' AND column_name='submitted_by') THEN
    UPDATE challenges SET user_id = submitted_by WHERE user_id IS NULL AND submitted_by IS NOT NULL;
  END IF;
END $$;

-- 2. Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('university', 'industry', 'govt')),
  contact_info JSONB DEFAULT '{}'::jsonb,
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create challenge_assignments table
CREATE TABLE IF NOT EXISTS challenge_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  claimed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'claimed' CHECK (status IN ('claimed', 'in_progress', 'resolved', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create ai_analysis_log table
CREATE TABLE IF NOT EXISTS ai_analysis_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  model_used TEXT NOT NULL, -- 'gemma-2' | 'ollama-local' | 'human_override'
  ai_category TEXT,
  ai_priority_score NUMERIC(5, 2) DEFAULT 0.00,
  ai_confidence NUMERIC(3, 2) DEFAULT 0.00,
  ai_summary TEXT,
  raw_response JSONB,
  override_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_challenges_priority_support ON challenges(priority_score DESC, support_count DESC);
CREATE INDEX IF NOT EXISTS idx_challenges_district_category ON challenges(district, category);
CREATE INDEX IF NOT EXISTS idx_challenges_status_created ON challenges(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_challenges_user_id ON challenges(user_id);

CREATE INDEX IF NOT EXISTS idx_assignments_challenge ON challenge_assignments(challenge_id);
CREATE INDEX IF NOT EXISTS idx_assignments_org ON challenge_assignments(org_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON challenge_assignments(status);

CREATE INDEX IF NOT EXISTS idx_ai_log_challenge ON ai_analysis_log(challenge_id);
CREATE INDEX IF NOT EXISTS idx_ai_log_created ON ai_analysis_log(created_at DESC);

-- 6. Enable Row-Level Security (RLS)
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analysis_log ENABLE ROW LEVEL SECURITY;

-- 7. Define Non-Recursive Clean RLS Policies

-- Challenges: Public read; authenticated insert; owner or claimed org update
DROP POLICY IF EXISTS challenges_public_read ON challenges;
CREATE POLICY challenges_public_read ON challenges 
  FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS challenges_auth_insert ON challenges;
CREATE POLICY challenges_auth_insert ON challenges 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS challenges_owner_or_org_update ON challenges;
CREATE POLICY challenges_owner_or_org_update ON challenges 
  FOR UPDATE 
  USING (
    auth.uid() = user_id 
    OR auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM challenge_assignments ca
      WHERE ca.challenge_id = id AND ca.claimed_by_user_id = auth.uid()
    )
  );

-- Organizations: Public read; insert/update restricted to org admin or service_role
DROP POLICY IF EXISTS organizations_public_read ON organizations;
CREATE POLICY organizations_public_read ON organizations 
  FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS organizations_admin_insert ON organizations;
CREATE POLICY organizations_admin_insert ON organizations 
  FOR INSERT 
  WITH CHECK (auth.uid() = admin_user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS organizations_admin_update ON organizations;
CREATE POLICY organizations_admin_update ON organizations 
  FOR UPDATE 
  USING (auth.uid() = admin_user_id OR auth.role() = 'service_role');

-- Challenge Assignments: Public read; insert only by authenticated users; update by claimer
DROP POLICY IF EXISTS challenge_assignments_public_read ON challenge_assignments;
CREATE POLICY challenge_assignments_public_read ON challenge_assignments 
  FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS challenge_assignments_auth_insert ON challenge_assignments;
CREATE POLICY challenge_assignments_auth_insert ON challenge_assignments 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS challenge_assignments_claimer_update ON challenge_assignments;
CREATE POLICY challenge_assignments_claimer_update ON challenge_assignments 
  FOR UPDATE 
  USING (auth.uid() = claimed_by_user_id OR auth.role() = 'service_role');

-- AI Analysis Log: Public read; insert via service_role or authenticated admin override
DROP POLICY IF EXISTS ai_analysis_log_public_read ON ai_analysis_log;
CREATE POLICY ai_analysis_log_public_read ON ai_analysis_log 
  FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS ai_analysis_log_insert_policy ON ai_analysis_log;
CREATE POLICY ai_analysis_log_insert_policy ON ai_analysis_log 
  FOR INSERT 
  WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- 8. Enable Realtime Publications for Dashboards
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE challenges;
  ALTER PUBLICATION supabase_realtime ADD TABLE challenge_assignments;
  ALTER PUBLICATION supabase_realtime ADD TABLE ai_analysis_log;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_object THEN null;
END $$;
