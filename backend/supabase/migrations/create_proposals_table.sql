-- Migration: Create Proposals Table for Tender Workflow

CREATE TABLE IF NOT EXISTS public.proposals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'approved', 'rejected')),
    budget_estimate TEXT,
    timeline_estimate TEXT,
    proposal_text TEXT NOT NULL,
    contact_email TEXT,
    contact_phone TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure a single institution can't bid multiple times on the same challenge (optional, but good practice)
ALTER TABLE public.proposals ADD CONSTRAINT unique_proposal_per_institution UNIQUE (challenge_id, institution_id);

-- Add RLS policies for proposals
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- Allow institutions to read their own proposals
CREATE POLICY "Institutions can view their own proposals"
ON public.proposals FOR SELECT
USING (auth.uid() = institution_id OR auth.uid() IN (SELECT id FROM users WHERE org_id = proposals.institution_id));

-- Allow admins to read all proposals
CREATE POLICY "Admins can view all proposals"
ON public.proposals FOR SELECT
USING (auth.uid() IN (SELECT id FROM users WHERE role = 'super_admin' OR role = 'govt_viewer'));

-- Allow institutions to create proposals
CREATE POLICY "Institutions can insert proposals"
ON public.proposals FOR INSERT
WITH CHECK (true);

-- Allow admins to update proposals (e.g. approve/reject)
CREATE POLICY "Admins can update proposals"
ON public.proposals FOR UPDATE
USING (true);
