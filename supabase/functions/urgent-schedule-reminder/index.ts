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

        // Calculate the time 4 hours ago
        const fourHoursAgo = new Date();
        fourHoursAgo.setHours(fourHoursAgo.getHours() - 4);
        const timeString = fourHoursAgo.toISOString();

        // 1. Find all schedules that are 'DIUSULKAN', have '[🔴 MENDESAK]', and were created > 4 hours ago
        const { data: urgentSchedules, error: fetchError } = await supabaseClient
            .from('jadwal_posyandu')
            .select(`
                id,
                tanggal,
                created_at,
                keterangan,
                posyandu_id,
                posyandu:posyandu_id (nama)
            `)
            .eq('status', 'DIUSULKAN')
            .ilike('keterangan', '%[🔴 MENDESAK]%')
            .lte('created_at', timeString);

        if (fetchError) throw fetchError;

        let notificationsCreated = 0;

        // 2. If we found any ignored urgent schedules, create a notification entry
        if (urgentSchedules && urgentSchedules.length > 0) {
            for (const schedule of urgentSchedules) {
                const teksWA = `*PENGINGAT ADMIN* [🔴 MENDESAK]\n\nUsulan jadwal untuk Posyandu ${schedule.posyandu.nama} tanggal ${schedule.tanggal} belum direspon selama > 4 jam. Mohon bantuan Admin untuk segera meninjau usulan ini.`;

                await supabaseClient.from('notifikasi').insert({
                    posyandu_id: schedule.posyandu_id,
                    jenis: 'UMUM',
                    teks_wa: teksWA,
                    status: 'BELUM_DIKIRIM',
                    ref_id: schedule.id,
                    ref_type: 'JADWAL_URGENT'
                });
                
                notificationsCreated++;
            }
        }

        return new Response(
            JSON.stringify({ 
                success: true, 
                message: `Found ${urgentSchedules?.length || 0} stuck urgent schedules, created ${notificationsCreated} WA notifications.` 
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        )

    } catch (error) {
        console.error('Error in urgent-schedule-reminder:', error);
        return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
    }
})
