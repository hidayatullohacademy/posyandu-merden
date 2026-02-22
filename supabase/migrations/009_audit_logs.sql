-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_name TEXT,
    role TEXT,
    action TEXT NOT NULL, -- e.g. 'CREATE', 'UPDATE', 'DELETE', 'LOGIN'
    entity_type TEXT NOT NULL, -- e.g. 'balita', 'lansia', 'user'
    entity_id TEXT,
    details JSONB, -- Stores changes: { "old": {...}, "new": {...} }
    ip_address TEXT,
    posyandu_id UUID REFERENCES public.posyandu(id) ON DELETE SET NULL
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON public.audit_logs (entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_posyandu_id ON public.audit_logs (posyandu_id);

-- RLS Policies
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- Authenticated users (kader/admin) can insert logs
CREATE POLICY "Authenticated users can insert audit logs" ON public.audit_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
