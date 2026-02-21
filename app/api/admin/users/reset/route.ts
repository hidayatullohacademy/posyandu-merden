import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

        if (!serviceRoleKey || !supabaseUrl) {
            return NextResponse.json(
                { error: 'Server misconfiguration: Missing Service Role Key or URL' },
                { status: 503 }
            );
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

        const body = await request.json();
        const { id } = body;

        if (!id) {
            return NextResponse.json({ error: 'User ID dibutuhkan' }, { status: 400 });
        }

        // 1. Reset password in Auth
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, {
            password: '12345678'
        });

        if (authError) throw authError;

        // 2. Update status in public.users
        const { error: dbError } = await supabaseAdmin
            .from('users')
            .update({ is_default_password: true })
            .eq('id', id);

        if (dbError) throw dbError;

        return NextResponse.json({ success: true, message: 'Password berhasil direset' });

    } catch (error: unknown) {
        console.error('Reset password error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        );
    }
}
