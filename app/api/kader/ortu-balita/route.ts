import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { user_id, balita_id } = body;

        if (!user_id || !balita_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
        }

        // Use service role to bypass RLS
        const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

        const { error } = await supabaseAdmin.from('orang_tua_balita').insert({
            user_id,
            balita_id
        });

        if (error) {
            if (error.code === '23505') {
                 return NextResponse.json({ error: 'Akun sudah ditautkan' }, { status: 409 });
            }
            throw error;
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const body = await request.json();
        const { user_id, balita_id } = body;

        if (!user_id || !balita_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
        }

        // Use service role to bypass RLS
        const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

        const { error } = await supabaseAdmin
            .from('orang_tua_balita')
            .delete()
            .match({ user_id, balita_id });

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
    }
}
