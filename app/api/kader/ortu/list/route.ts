import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceRoleKey) {
            return NextResponse.json(
                { error: 'Server misconfiguration: Missing keys' },
                { status: 503 }
            );
        }

        // 1. Initialize SSR Client to check active session
        const supabaseAuth = await createServerSupabaseClient();

        const { data: { user }, error: sessionError } = await supabaseAuth.auth.getUser();

        if (sessionError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Verify role is kader
        const { data: currentUserData, error: userError } = await supabaseAuth
            .from('users')
            .select('role, posyandu_id')
            .eq('id', user.id)
            .single();

        if (userError || !currentUserData || currentUserData.role !== 'KADER') {
            return NextResponse.json({ error: 'Forbidden: Only Kader can perform this action' }, { status: 403 });
        }

        // 3. Initialize Admin Client to bypass RLS
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // 4. Fetch parents in the same posyandu
        const { data: ortuUsers, error: fetchError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('role', 'ORANG_TUA')
            .eq('posyandu_id', currentUserData.posyandu_id)
            .order('nama_lengkap');

        if (fetchError) throw fetchError;

        return NextResponse.json({ success: true, data: ortuUsers });

    } catch (error: any) {
        console.error('Fetch ortu user error:', error);
        return NextResponse.json(
            { error: error?.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
