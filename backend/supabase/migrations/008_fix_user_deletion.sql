ALTER TABLE challenges ALTER COLUMN submitted_by DROP NOT NULL;
ALTER TABLE challenges DROP CONSTRAINT challenges_submitted_by_fkey;
ALTER TABLE challenges ADD CONSTRAINT challenges_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE SET NULL;