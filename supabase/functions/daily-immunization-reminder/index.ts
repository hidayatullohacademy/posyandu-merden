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

        // Calculate the date 7 days from now
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 7);
        const dateString = targetDate.toISOString().split('T')[0];

        // 1. Find all immunizations scheduled for 7 days from now that aren't done yet
        const { data: immunizations, error: fetchError } = await supabaseClient
            .from('imunisasi_balita')
            .select(`
                id,
                tanggal_jadwal,
                balita:balita_id (
                    nama,
                    posyandu_id
                ),
                master_imunisasi:master_imun_id (
                    nama
                )
            `)
            .eq('tanggal_jadwal', dateString)
            .eq('status', 'BELUM');

        if (fetchError) throw fetchError;

        let notificationsCreated = 0;

        // 2. For each upcoming immunization, create a notification entry
        if (immunizations && immunizations.length > 0) {
            for (const imun of immunizations) {
                const teksWA = `*PENGINGAT IMUNISASI (H-7)*\n\nHalo Ayah/Bunda,\n\nMohon kehadirannya di Posyandu untuk imunisasi anak tercinta:\n\nNama: ${imun.balita.nama}\nVaksin: ${imun.master_imunisasi.nama}\nJadwal: ${imun.tanggal_jadwal}\n\nJangan lupa membawa buku KIA/KMS. Terima kasih.`;

                await supabaseClient.from('notifikasi').insert({
                    posyandu_id: imun.balita.posyandu_id,
                    jenis: 'PENGINGAT_IMUNISASI',
                    teks_wa: teksWA,
                    status: 'BELUM_DIKIRIM',
                    ref_id: imun.id,
                    ref_type: 'IMUNISASI'
                });
                
                notificationsCreated++;
            }
        }

        return new Response(
            JSON.stringify({ 
                success: true, 
                message: `Processed ${immunizations?.length || 0} scheduled immunizations, created ${notificationsCreated} WA notifications.` 
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        )

    } catch (error) {
        console.error('Error in daily-immunization-reminder:', error);
        return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
    }
})
