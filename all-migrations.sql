-- 001_initial_schema.sql
-- Societal Innovation Collaboration Portal - Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'citizen',
        'pri_ulb_official',
        'university_admin',
        'faculty',
        'student',
        'industry_partner',
        'govt_viewer',
        'super_admin'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE institution_type AS ENUM (
        'university',
        'industry',
        'govt'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE challenge_status AS ENUM (
        'submitted',
        'under_review',
        'routed',
        'team_formed',
        'in_progress',
        'completed',
        'validated'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE milestone_status AS ENUM (
        'pending',
        'in_progress',
        'submitted',
        'completed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE approval_status AS ENUM (
        'pending',
        'approved',
        'rejected'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Institutions Table
CREATE TABLE IF NOT EXISTS institutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type institution_type NOT NULL,
    domain_expertise TEXT[] NOT NULL DEFAULT '{}',
    location TEXT NOT NULL,
    district TEXT NOT NULL,
    contact_email TEXT,
    contact_phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Users Table (Linked to auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'citizen',
    org_id UUID REFERENCES institutions(id) ON DELETE SET NULL,
    contact TEXT,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    district TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Challenges Table
CREATE TABLE IF NOT EXISTS challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submitted_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    status challenge_status NOT NULL DEFAULT 'submitted',
    location_text TEXT,
    district TEXT NOT NULL,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    media_urls TEXT[] NOT NULL DEFAULT '{}',
    duplicate_of UUID REFERENCES challenges(id) ON DELETE SET NULL,
    assigned_institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL,
    ai_classification JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Project Teams Table
CREATE TABLE IF NOT EXISTS project_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    university_id UUID NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
    faculty_ids UUID[] NOT NULL DEFAULT '{}',
    student_ids UUID[] NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_challenge_team UNIQUE (challenge_id, university_id)
);

-- 7. Industry Engagements Table
CREATE TABLE IF NOT EXISTS industry_engagements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    industry_id UUID NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
    engagement_type TEXT NOT NULL, -- funding, mentorship, technology, internships
    status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, declined
    proposal_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_challenge_industry UNIQUE (challenge_id, industry_id)
);

-- 8. Milestones Table
CREATE TABLE IF NOT EXISTS milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES project_teams(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ,
    status milestone_status NOT NULL DEFAULT 'pending',
    deliverable_url TEXT,
    approval_status approval_status NOT NULL DEFAULT 'pending',
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approval_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- challenge_routed, team_assigned, milestone_submitted, milestone_approved, engagement_requested
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    read_status BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity TEXT NOT NULL,
    action TEXT NOT NULL,
    actor_id UUID,
    entity_id UUID,
    changes JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for high-frequency queries
CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);
CREATE INDEX IF NOT EXISTS idx_challenges_category ON challenges(category_id);
CREATE INDEX IF NOT EXISTS idx_challenges_district ON challenges(district);
CREATE INDEX IF NOT EXISTS idx_challenges_assigned_inst ON challenges(assigned_institution_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_org ON users(org_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id, read_status);
CREATE INDEX IF NOT EXISTS idx_milestones_project ON milestones(project_id);
-- 002_rls_policies.sql
-- Row-Level Security (RLS) Policies for all roles

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE industry_engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTIONS (in public schema for modern Supabase)
-- =====================================================

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role AS $$
    SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Helper function to get current user org_id
CREATE OR REPLACE FUNCTION public.current_user_org_id()
RETURNS UUID AS $$
    SELECT org_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Helper function to check if current user is Super Admin or Govt
CREATE OR REPLACE FUNCTION public.is_admin_or_govt()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role IN ('super_admin', 'govt_viewer')
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Grant execution permissions on helper functions
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.current_user_org_id() TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin_or_govt() TO authenticated, anon, service_role;

-- =====================================================
-- 1. USERS POLICIES
-- =====================================================
DROP POLICY IF EXISTS users_select_policy ON users;
CREATE POLICY users_select_policy ON users
    FOR SELECT
    USING (
        auth.uid() = id 
        OR public.is_admin_or_govt() 
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('university_admin', 'faculty', 'pri_ulb_official'))
    );

DROP POLICY IF EXISTS users_update_own ON users;
CREATE POLICY users_update_own ON users
    FOR UPDATE
    USING (auth.uid() = id);

DROP POLICY IF EXISTS users_admin_all ON users;
CREATE POLICY users_admin_all ON users
    FOR ALL
    USING (public.current_user_role() = 'super_admin');

DROP POLICY IF EXISTS users_insert_policy ON users;
CREATE POLICY users_insert_policy ON users
    FOR INSERT
    WITH CHECK (auth.uid() = id OR public.current_user_role() = 'super_admin');

-- =====================================================
-- 2. INSTITUTIONS POLICIES
-- =====================================================
DROP POLICY IF EXISTS institutions_read_all ON institutions;
CREATE POLICY institutions_read_all ON institutions
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS institutions_admin_write ON institutions;
CREATE POLICY institutions_admin_write ON institutions
    FOR ALL
    USING (public.is_admin_or_govt());

-- =====================================================
-- 3. CATEGORIES POLICIES
-- =====================================================
DROP POLICY IF EXISTS categories_read_all ON categories;
CREATE POLICY categories_read_all ON categories
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS categories_admin_modify ON categories;
CREATE POLICY categories_admin_modify ON categories
    FOR ALL
    USING (public.current_user_role() = 'super_admin');

-- =====================================================
-- 4. CHALLENGES POLICIES
-- =====================================================
-- Citizens can view their own challenges
-- University accounts (Admin, Faculty, Student) can view challenges routed to their institution or in 'routed'/'team_formed'/'in_progress'
-- Govt and Super Admin can view all challenges
-- PRI/ULB officials can view challenges in their district
DROP POLICY IF EXISTS challenges_select_policy ON challenges;
CREATE POLICY challenges_select_policy ON challenges
    FOR SELECT
    USING (
        public.is_admin_or_govt()
        OR (auth.uid() = submitted_by)
        OR (assigned_institution_id = public.current_user_org_id())
        OR (status IN ('routed', 'team_formed', 'in_progress', 'completed', 'validated') AND public.current_user_role() IN ('university_admin', 'faculty', 'student', 'industry_partner'))
        OR (public.current_user_role() = 'pri_ulb_official' AND district = (SELECT district FROM users WHERE id = auth.uid()))
    );

-- Citizens can insert challenges (with submitted_by set to themselves)
DROP POLICY IF EXISTS challenges_insert_citizen ON challenges;
CREATE POLICY challenges_insert_citizen ON challenges
    FOR INSERT
    WITH CHECK (auth.uid() = submitted_by);

-- Citizens can update their own challenge ONLY if it is still in 'submitted' state
DROP POLICY IF EXISTS challenges_update_citizen ON challenges;
CREATE POLICY challenges_update_citizen ON challenges
    FOR UPDATE
    USING (
        auth.uid() = submitted_by 
        AND status = 'submitted'
    );

-- Super Admin and Govt can update any challenge
DROP POLICY IF EXISTS challenges_update_admin ON challenges;
CREATE POLICY challenges_update_admin ON challenges
    FOR UPDATE
    USING (public.is_admin_or_govt());

-- =====================================================
-- 5. PROJECT TEAMS POLICIES
-- =====================================================
-- Super admin and Govt can read all teams
-- University members can read teams of their own institution
-- Assigned faculty and students can read their own team
DROP POLICY IF EXISTS project_teams_select ON project_teams;
CREATE POLICY project_teams_select ON project_teams
    FOR SELECT
    USING (
        public.is_admin_or_govt()
        OR university_id = public.current_user_org_id()
        OR auth.uid() = ANY(faculty_ids)
        OR auth.uid() = ANY(student_ids)
    );

-- University Admins & Faculty can manage teams for their institution
DROP POLICY IF EXISTS project_teams_manage ON project_teams;
CREATE POLICY project_teams_manage ON project_teams
    FOR ALL
    USING (
        public.is_admin_or_govt()
        OR (university_id = public.current_user_org_id() AND public.current_user_role() IN ('university_admin', 'faculty'))
    );

-- =====================================================
-- 6. INDUSTRY ENGAGEMENTS POLICIES
-- =====================================================
DROP POLICY IF EXISTS industry_engagements_select ON industry_engagements;
CREATE POLICY industry_engagements_select ON industry_engagements
    FOR SELECT
    USING (
        public.is_admin_or_govt()
        OR industry_id = public.current_user_org_id()
        OR EXISTS (
            SELECT 1 FROM project_teams pt 
            WHERE pt.challenge_id = industry_engagements.challenge_id 
            AND pt.university_id = public.current_user_org_id()
        )
    );

DROP POLICY IF EXISTS industry_engagements_manage ON industry_engagements;
CREATE POLICY industry_engagements_manage ON industry_engagements
    FOR ALL
    USING (
        public.is_admin_or_govt()
        OR (industry_id = public.current_user_org_id() AND public.current_user_role() = 'industry_partner')
    );

-- =====================================================
-- 7. MILESTONES POLICIES
-- =====================================================
DROP POLICY IF EXISTS milestones_select ON milestones;
CREATE POLICY milestones_select ON milestones
    FOR SELECT
    USING (
        public.is_admin_or_govt()
        OR EXISTS (
            SELECT 1 FROM project_teams pt
            WHERE pt.id = milestones.project_id
            AND (
                pt.university_id = public.current_user_org_id()
                OR auth.uid() = ANY(pt.faculty_ids)
                OR auth.uid() = ANY(pt.student_ids)
            )
        )
    );

DROP POLICY IF EXISTS milestones_manage_team ON milestones;
CREATE POLICY milestones_manage_team ON milestones
    FOR ALL
    USING (
        public.is_admin_or_govt()
        OR EXISTS (
            SELECT 1 FROM project_teams pt
            WHERE pt.id = milestones.project_id
            AND (
                pt.university_id = public.current_user_org_id()
                AND public.current_user_role() IN ('university_admin', 'faculty')
            )
        )
    );

-- =====================================================
-- 8. NOTIFICATIONS POLICIES
-- =====================================================
-- Users can only see and update their own notifications
DROP POLICY IF EXISTS notifications_select_own ON notifications;
CREATE POLICY notifications_select_own ON notifications
    FOR SELECT
    USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS notifications_update_own ON notifications;
CREATE POLICY notifications_update_own ON notifications
    FOR UPDATE
    USING (recipient_id = auth.uid());

-- Service role & Admin can insert notifications
DROP POLICY IF EXISTS notifications_insert_all ON notifications;
CREATE POLICY notifications_insert_all ON notifications
    FOR INSERT
    WITH CHECK (true);

-- =====================================================
-- 9. AUDIT LOGS POLICIES
-- =====================================================
-- Only Super Admin and Govt Viewers can view audit logs
DROP POLICY IF EXISTS audit_logs_select ON audit_logs;
CREATE POLICY audit_logs_select ON audit_logs
    FOR SELECT
    USING (public.is_admin_or_govt());

-- Log entries can be inserted by authenticated triggers / backend
DROP POLICY IF EXISTS audit_logs_insert ON audit_logs;
CREATE POLICY audit_logs_insert ON audit_logs
    FOR INSERT
    WITH CHECK (true);
-- 003_seed_data.sql
-- Seed 10 core categories and initial Jharkhand institutions

-- 1. Insert Categories
INSERT INTO categories (id, name, slug, description) VALUES
    ('c1000000-0000-0000-0000-000000000001', 'Education', 'education', 'Primary, secondary, vocational training, smart classrooms, and digital literacy in rural & tribal areas.'),
    ('c1000000-0000-0000-0000-000000000002', 'Agriculture', 'agriculture', 'Crop protection, soil health, drip irrigation, post-harvest storage, and millet mission.'),
    ('c1000000-0000-0000-0000-000000000003', 'Healthcare', 'healthcare', 'Primary health centers, maternal care, telemedicine, tribal nutrition, and endemic disease control.'),
    ('c1000000-0000-0000-0000-000000000004', 'Water & Sanitation', 'water', 'Drinking water access, groundwater recharge, pond revival, and Jal Jeevan Mission monitoring.'),
    ('c1000000-0000-0000-0000-000000000005', 'Environment & Forestry', 'environment', 'Forest conservation, mine reclamation, pollution tracking, and biodiversity preservation.'),
    ('c1000000-0000-0000-0000-000000000006', 'Clean Energy', 'energy', 'Solar mini-grids, biomass power, clean cooking fuels, and renewable storage.'),
    ('c1000000-0000-0000-0000-000000000007', 'Urban Infrastructure', 'urban_development', 'Traffic management, waste segregation, stormwater drainage, and smart streetlighting in cities.'),
    ('c1000000-0000-0000-0000-000000000008', 'Accessibility & Inclusion', 'accessibility', 'Assistive technologies for persons with disabilities, elder care, and accessible public infrastructure.'),
    ('c1000000-0000-0000-0000-000000000009', 'Public Administration', 'public_administration', 'Grievance redressal, direct benefit transfer auditing, citizen charter tracking, and transparent ULB portals.'),
    ('c1000000-0000-0000-0000-000000000010', 'Rural Livelihoods', 'rural_livelihoods', 'Lac cultivation, silk weaving, minor forest produce processing, SHG market linkages, and handicrafts.')
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description;

-- 2. Insert Jharkhand Institutions (Universities, Industry, Govt)
INSERT INTO institutions (id, name, type, domain_expertise, location, district, contact_email) VALUES
    (
        'a1000000-0000-0000-0000-000000000001',
        'Birsa Institute of Technology (BIT) Sindri',
        'university',
        ARRAY['engineering', 'environment', 'energy', 'water', 'urban_development'],
        'Dhanbad, Jharkhand',
        'Dhanbad',
        'innovations@bitsindri.ac.in'
    ),
    (
        'a1000000-0000-0000-0000-000000000002',
        'Birsa Agricultural University (BAU)',
        'university',
        ARRAY['agriculture', 'rural_livelihoods', 'water', 'environment'],
        'Kanke, Ranchi, Jharkhand',
        'Ranchi',
        'vc@bauranchi.org'
    ),
    (
        'a1000000-0000-0000-0000-000000000003',
        'National Institute of Technology (NIT) Jamshedpur',
        'university',
        ARRAY['technology', 'education', 'accessibility', 'energy', 'urban_development'],
        'Adityapur, Jamshedpur, Jharkhand',
        'East Singhbhum',
        'dean.rnc@nitjsr.ac.in'
    ),
    (
        'a1000000-0000-0000-0000-000000000004',
        'Rajendra Institute of Medical Sciences (RIMS)',
        'university',
        ARRAY['healthcare', 'nutrition', 'tribal_health', 'accessibility'],
        'Bariatu, Ranchi, Jharkhand',
        'Ranchi',
        'director@rimsranchi.ac.in'
    ),
    (
        'a1000000-0000-0000-0000-000000000005',
        'Tata Steel CSR Foundation',
        'industry',
        ARRAY['rural_livelihoods', 'healthcare', 'education', 'water'],
        'Jamshedpur, Jharkhand',
        'East Singhbhum',
        'csr@tatasteel.com'
    ),
    (
        'a1000000-0000-0000-0000-000000000006',
        'Central Coalfields Limited (CCL) Innovation Cell',
        'industry',
        ARRAY['environment', 'clean_energy', 'mine_reclamation', 'water'],
        'Darbhanga House, Ranchi, Jharkhand',
        'Ranchi',
        'csr.ccl@coalindia.in'
    ),
    (
        'a1000000-0000-0000-0000-000000000007',
        'Jharkhand State Livelihood Promotion Society (JSLPS)',
        'govt',
        ARRAY['rural_livelihoods', 'agriculture', 'women_empowerment', 'shg'],
        'Ranchi, Jharkhand',
        'Ranchi',
        'support@jslps.in'
    )
ON CONFLICT (id) DO NOTHING;
-- 004_triggers_and_realtime.sql
-- Automation triggers and Supabase Realtime publication setup

-- 1. Auto-update `updated_at` timestamps
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_timestamp_users
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE OR REPLACE TRIGGER set_timestamp_institutions
BEFORE UPDATE ON institutions
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE OR REPLACE TRIGGER set_timestamp_challenges
BEFORE UPDATE ON challenges
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE OR REPLACE TRIGGER set_timestamp_project_teams
BEFORE UPDATE ON project_teams
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE OR REPLACE TRIGGER set_timestamp_milestones
BEFORE UPDATE ON milestones
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE OR REPLACE TRIGGER set_timestamp_industry_engagements
BEFORE UPDATE ON industry_engagements
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- 2. Audit Logging Trigger for Challenges, Milestones, and Teams
CREATE OR REPLACE FUNCTION process_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    actor UUID;
BEGIN
    actor := auth.uid();
    
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_logs (entity, action, actor_id, entity_id, changes, timestamp)
        VALUES (TG_TABLE_NAME, 'DELETE', actor, OLD.id, row_to_json(OLD)::jsonb, NOW());
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit_logs (entity, action, actor_id, entity_id, changes, timestamp)
        VALUES (TG_TABLE_NAME, 'UPDATE', actor, NEW.id, jsonb_build_object('old', row_to_json(OLD)::jsonb, 'new', row_to_json(NEW)::jsonb), NOW());
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_logs (entity, action, actor_id, entity_id, changes, timestamp)
        VALUES (TG_TABLE_NAME, 'INSERT', actor, NEW.id, row_to_json(NEW)::jsonb, NOW());
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER audit_challenges_trigger
AFTER INSERT OR UPDATE OR DELETE ON challenges
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

CREATE OR REPLACE TRIGGER audit_milestones_trigger
AFTER INSERT OR UPDATE OR DELETE ON milestones
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

CREATE OR REPLACE TRIGGER audit_project_teams_trigger
AFTER INSERT OR UPDATE OR DELETE ON project_teams
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- 3. Automatic Notification Trigger on Challenge Status Updates
CREATE OR REPLACE FUNCTION notify_challenge_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- If challenge status moved to 'routed' and has an assigned institution
    IF (NEW.status = 'routed' AND (OLD.status IS NULL OR OLD.status != 'routed') AND NEW.assigned_institution_id IS NOT NULL) THEN
        -- Insert notification for the university admin of the assigned institution
        INSERT INTO notifications (recipient_id, type, payload)
        SELECT u.id, 'challenge_routed', jsonb_build_object(
            'challenge_id', NEW.id,
            'title', NEW.title,
            'district', NEW.district,
            'status', NEW.status
        )
        FROM users u
        WHERE u.org_id = NEW.assigned_institution_id AND u.role = 'university_admin';
    END IF;

    -- If challenge status moved to 'completed'
    IF (NEW.status = 'completed' AND OLD.status != 'completed') THEN
        -- Notify citizen who submitted it
        INSERT INTO notifications (recipient_id, type, payload)
        VALUES (
            NEW.submitted_by,
            'challenge_completed',
            jsonb_build_object('challenge_id', NEW.id, 'title', NEW.title, 'status', NEW.status)
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER challenge_notification_trigger
AFTER UPDATE ON challenges
FOR EACH ROW
EXECUTE FUNCTION notify_challenge_status_change();

-- 4. Enable Supabase Realtime for Notifications and Challenges
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    ALTER PUBLICATION supabase_realtime ADD TABLE challenges;
    ALTER PUBLICATION supabase_realtime ADD TABLE milestones;
EXCEPTION
    WHEN undefined_object THEN null;
    WHEN duplicate_object THEN null;
END $$;
-- 005_new_dashboards_and_tables.sql
-- Migration for Memento 3-Dashboard Architecture (SIH 2026 Problem Statement 26043)

-- 1. Ensure columns exist on challenges table
ALTER TABLE IF EXISTS challenges 
  ADD COLUMN IF NOT EXISTS category TEXT,
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
  ai_confidence NUMERIC(3, 2) DEFAULT 0.00,
  ai_summary TEXT,
  raw_response JSONB,
  override_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_challenges_support ON challenges(support_count DESC);
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
