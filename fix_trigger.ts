import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || ''
);

async function runSQL() {
    const rawSql = `
        CREATE OR REPLACE FUNCTION generate_imunisasi_schedule()
        RETURNS TRIGGER AS $$
        DECLARE
            imun_record RECORD;
            schedule_date DATE;
            v_user_id UUID;
        BEGIN
            -- Ambil user_id yang sedang insert jika ada, jika tidak biarkan null
            v_user_id := auth.uid();
            
            -- Loop through all active vaccines in master_imunisasi
            FOR imun_record IN 
                SELECT id, usia_bulan
                FROM master_imunisasi
                WHERE is_active = true
            LOOP
                -- Calculate the scheduled date based on the child's birth date + the vaccine's required age in months
                schedule_date := NEW.tanggal_lahir + (imun_record.usia_bulan || ' months')::INTERVAL;
                
                -- Insert the scheduled vaccine into the imunisasi_balita table
                INSERT INTO imunisasi_balita (
                    balita_id,
                    master_imun_id,
                    tanggal_jadwal,
                    status,
                    dicatat_oleh
                ) VALUES (
                    NEW.id,
                    imun_record.id,
                    schedule_date,
                    'BELUM',
                    v_user_id
                );
            END LOOP;
        
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    `;

    console.log("SQL to execute:\\n", rawSql);
    // Kita tidak bisa eksekusi raw SQL standar dari SDK Supabase js (client). 
    // Oleh karena itu solusinya adalah memberitahu user untuk menjalankan fix.sql di Supabase SQL Editor.
}

runSQL();
