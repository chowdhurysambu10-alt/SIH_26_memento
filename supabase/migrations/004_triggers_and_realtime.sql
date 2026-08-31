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
