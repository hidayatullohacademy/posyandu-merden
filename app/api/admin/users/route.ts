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

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        const body = await request.json();
        const { email, password, userData } = body;

        // 1. Create User in Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: userData.nama }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('Failed to create user');

        // 2. Insert into Public Users Table
        const { error: dbError } = await supabaseAdmin
            .from('users')
            .insert({
                id: authData.user.id,
                ...userData
            });

        if (dbError) {
            // Attempt rollback: Delete the created auth user if DB insert fails
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            throw dbError;
        }

        return NextResponse.json({ success: true, user: authData.user });

    } catch (error: unknown) {
        console.error('Create user error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        );
    }
}
