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
