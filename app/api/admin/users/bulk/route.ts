import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
    try {
        const { users } = await request.json();

        if (!Array.isArray(users) || users.length === 0) {
            return NextResponse.json({ error: 'Array pengguna kosong atau tidak valid' }, { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceRoleKey) {
             console.error("Missing Supabase URL or Service Role Key");
             return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        // Initialize client inside the handler so build doesn't crash if env vars are missing during static generation
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[]
        };

        // We process sequentially to avoid overwhelming the auth API,
        // but this could be chunked for very large lists
        for (const user of users) {
             try {
                // 1. Create Auth User
                const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                    email: user.email,
                    password: user.password,
                    email_confirm: true,
                });

                if (authError) {
                    if (authError.message.includes('already registered')) {
                         results.errors.push(`Email/No HP ${user.no_hp} sudah terdaftar.`);
                    } else {
                         results.errors.push(`Gagal membuat Auth untuk ${user.nama}: ${authError.message}`);
                    }
                    results.failed++;
                    continue; 
                }

                // 2. Create Public User Record
                const { error: dbError } = await supabaseAdmin
                    .from('users')
                    .insert({
                        id: authData.user.id,
                        nama: user.nama.trim(),
                        no_hp: user.no_hp.trim(),
                        nik: user.nik?.trim() || null,
                        role: user.role,
                        posyandu_id: user.posyandu_id || null,
                        is_active: true,
                        is_default_password: true,
                    });

                if (dbError) {
                    // Rollback Auth user if DB insert fails
                     await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
                     results.errors.push(`Gagal menyimpan data ${user.nama}: ${dbError.message}`);
                     results.failed++;
                } else {
                     results.success++;
                }

             } catch (err: unknown) {
                 const e = err as Error;
                 results.errors.push(`Error memproses ${user.nama}: ${e.message}`);
                 results.failed++;
             }
        }

        return NextResponse.json({
            message: `Selesai: ${results.success} berhasil, ${results.failed} gagal.`,
            results
        });

    } catch (error: unknown) {
        console.error('Bulk user creation error:', error);
        return NextResponse.json(
            { error: 'Terjadi kesalahan sistem saat import data.' },
            { status: 500 }
        );
    }
}
