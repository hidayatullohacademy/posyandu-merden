// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // This function is meant to be run via pg_cron on Feb 1st and Aug 1st
        const today = new Date();
        const month = today.getMonth() + 1; // 1 = Jan, 2 = Feb, 8 = Aug
        const isBulanVitaminA = month === 2 || month === 8;
        const namaBulan = month === 2 ? 'Februari' : 'Agustus';

        if (!isBulanVitaminA) {
             return new Response(
                JSON.stringify({ 
                    success: true, 
                    message: 'Not a Vitamin A month. Skipping.' 
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } },
            )
        }

        let notificationsCreated = 0;

        // 1. Get unique Posyandu IDs that have kaders
        const { data: posyandus, error: fetchError } = await supabaseClient
            .from('users')
            .select('posyandu_id')
            .eq('role', 'KADER')
            .not('posyandu_id', 'is', null);

        if (fetchError) throw fetchError;

        // Use a Set to get unique posyandu IDs
        const uniquePosyanduIds = [...new Set(posyandus.map((p: {posyandu_id: string}) => p.posyandu_id))];

        if (uniquePosyanduIds.length > 0) {
            for (const posyanduId of uniquePosyanduIds) {
                const teksWA = `*PENGINGAT BULAN VITAMIN A*\n\nBapak/Ibu, bulan ${namaBulan} ini adalah jadwal pemberian *Vitamin A* dan *Obat Cacing* serentak di Posyandu.\n\nMohon kehadirannya membawa Balita ke Posyandu terdekat untuk mendapatkan layanan ini guna mendukung tumbuh kembang dan cegah stunting. Terima kasih.`;

                await supabaseClient.from('notifikasi').insert({
                    posyandu_id: posyanduId,
                    jenis: 'UMUM',
                    teks_wa: teksWA,
                    status: 'BELUM_DIKIRIM',
                    ref_type: 'VITAMIN_A'
                });
                
                notificationsCreated++;
            }
        }

        return new Response(
            JSON.stringify({ 
                success: true, 
                message: `Created ${notificationsCreated} Vitamin A WA notifications for unique Posyandus.` 
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        )

    } catch (error) {
        console.error('Error in vitamin-a-reminder:', error);
        return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
    }
})
