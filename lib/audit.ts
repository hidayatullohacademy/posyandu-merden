import { createClient } from './supabase';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'BROADCAST';
export type AuditEntityType = 'BALITA' | 'LANSIA' | 'USER' | 'VAKSIN' | 'POSYANDU' | 'NOTIFIKASI' | 'LAPORAN';

interface AuditLogParams {
    action: AuditAction;
    entityType: AuditEntityType;
    entityId?: string;
    details?: any;
    posyanduId?: string;
}

/**
 * Log an action to the audit_logs table.
 * Can be used in both Client and Server components.
 */
export async function logAudit({
    action,
    entityType,
    entityId,
    details,
    posyanduId
}: AuditLogParams) {
    const supabase = createClient();
    
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get user profile for extra context
        const { data: profile } = await supabase
            .from('users')
            .select('nama_lengkap, role, posyandu_id')
            .eq('id', user.id)
            .single();

        const { error } = await supabase.from('audit_logs').insert({
            user_id: user.id,
            user_name: profile?.nama_lengkap || user.email,
            role: profile?.role || 'USER',
            action,
            entity_type: entityType,
            entity_id: entityId,
            details,
            posyandu_id: posyanduId || profile?.posyandu_id,
            // IP address could be added if used in an API route context
        });

        if (error) {
            console.error('Audit Log Error:', error);
        }
    } catch (err) {
        console.error('Failed to log audit:', err);
    }
}
