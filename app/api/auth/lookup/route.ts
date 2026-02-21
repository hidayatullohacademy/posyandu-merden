import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { identifier } = await request.json();

        if (!identifier) {
            return NextResponse.json({ error: 'Identifier dibutuhkan' }, { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        // Use service role to bypass RLS for this specific lookup
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data: userData, error: lookupError } = await supabase
            .from('users')
            .select('id, no_hp, nik, role, status')
            .or(`no_hp.eq.${identifier},nik.eq.${identifier}`)
            .single();

        if (lookupError || !userData) {
            return NextResponse.json({ error: 'No. HP atau NIK tidak ditemukan' }, { status: 404 });
        }

        if (userData.status === 'NONAKTIF') {
            return NextResponse.json({ error: 'Akun Anda sudah dinonaktifkan. Hubungi Admin.', status: 'NONAKTIF' }, { status: 403 });
        }

        // Fetch exact email from auth.users to prevent sync issues if an Admin edited their no_hp
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userData.id);
        const email = (!authError && authUser?.user?.email) 
            ? authUser.user.email 
            : `${userData.no_hp}@posyandu.local`;

        return NextResponse.json({ 
            email: email,
            role: userData.role,
            status: userData.status 
        });

    } catch (error) {
        console.error("Auth lookup error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
