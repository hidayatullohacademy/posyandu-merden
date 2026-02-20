import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
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

        // 3. Initialize Admin Client
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        const body = await request.json();
        const { nik, nama_lengkap, no_hp } = body; // rt/rw ignored as it's not in user table schema
        
        // Auto-generate email based on NIK if not provided
        const email = `${nik}@posyandu.local`;
        const password = 'merden12345';

        // 4. Create User in Auth
        const { data: newAuthData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: nama_lengkap }
        });

        if (authError) {
            // Check if error is due to email or phone already exists
            if (authError.message.includes('already registered')) {
                return NextResponse.json({ error: 'Email atau NIK tersebut sudah terdaftar' }, { status: 400 });
            }
            throw authError;
        }
        if (!newAuthData.user) throw new Error('Failed to create user');

        // 5. Insert into Public Users Table
        const { error: dbError } = await supabaseAdmin
            .from('users')
            .insert({
                id: newAuthData.user.id,
                nama_lengkap,
                nik,
                no_hp,
                role: 'ORANG_TUA',
                posyandu_id: currentUserData.posyandu_id,
                status: 'AKTIF',
                is_default_password: true,
                created_by: user.id
            });

        if (dbError) {
            // Attempt rollback: Delete the created auth user
            await supabaseAdmin.auth.admin.deleteUser(newAuthData.user.id);
            if (dbError.code === '23505') {
                 // Temukan posyandu user yang bentrok
                 const { data: existingUser } = await supabaseAdmin
                     .from('users')
                     .select('posyandu:posyandu_id(nama)')
                     .or(`nik.eq.${nik},no_hp.eq.${no_hp}`)
                     .single();

                 let posyanduName = 'Posyandu lain';
                 if (existingUser?.posyandu) {
                     // Handle both single object and array return types from Supabase relational queries
                     const posyanduData = Array.isArray(existingUser.posyandu) 
                        ? existingUser.posyandu[0] 
                        : existingUser.posyandu;
                     posyanduName = (posyanduData as any)?.nama || 'Posyandu lain';
                 }

                 if (dbError.message.includes('nik')) return NextResponse.json({ error: `NIK sudah terdaftar di kader ${posyanduName}` }, { status: 400 });
                 if (dbError.message.includes('no_hp')) return NextResponse.json({ error: `Nomor HP sudah terdaftar di kader ${posyanduName}` }, { status: 400 });
            }
            throw dbError;
        }

        return NextResponse.json({ success: true, user: newAuthData.user });

    } catch (error: any) {
        console.error('Create ortu user error:', error);
        return NextResponse.json(
            { error: error?.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
