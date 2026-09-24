-- Migration for E2EE Internal Messaging System

-- Create temporary mail aliases table
CREATE TABLE IF NOT EXISTS public.temp_mail_aliases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    alias_id TEXT NOT NULL UNIQUE, -- e.g. "student-8f2a@memento.com"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Index for quick lookups by alias
CREATE INDEX IF NOT EXISTS idx_temp_mail_aliases_alias_id ON public.temp_mail_aliases(alias_id);

-- Create temporary messages table
CREATE TABLE IF NOT EXISTS public.temp_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_alias_id TEXT NOT NULL REFERENCES public.temp_mail_aliases(alias_id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    encrypted_subject TEXT NOT NULL,
    encrypted_body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Index for fetching messages for a recipient quickly
CREATE INDEX IF NOT EXISTS idx_temp_messages_recipient ON public.temp_messages(recipient_alias_id);

-- Set up Row Level Security (RLS)
ALTER TABLE public.temp_mail_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temp_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for temp_mail_aliases
CREATE POLICY "Users can view their own aliases" 
ON public.temp_mail_aliases FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own aliases" 
ON public.temp_mail_aliases FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own aliases" 
ON public.temp_mail_aliases FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for temp_messages
CREATE POLICY "Users can view messages sent to their aliases" 
ON public.temp_messages FOR SELECT 
USING (
    recipient_alias_id IN (
        SELECT alias_id FROM public.temp_mail_aliases WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Anyone authenticated can insert messages" 
ON public.temp_messages FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete messages sent to their aliases" 
ON public.temp_messages FOR DELETE 
USING (
    recipient_alias_id IN (
        SELECT alias_id FROM public.temp_mail_aliases WHERE user_id = auth.uid()
    )
);
