-- ============================================================
-- Modul 8: Automatic Immunization Scheduling Trigger
-- ============================================================

-- Function to generate immunization schedules automatically when a new Balita is registered.
-- It reads from master_imunisasi and creates rows in imunisasi_balita.
CREATE OR REPLACE FUNCTION generate_imunisasi_schedule()
RETURNS TRIGGER AS $$
DECLARE
    imun_record RECORD;
    schedule_date DATE;
BEGIN
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
            NEW.dicatat_oleh
        );
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to run automatically AFTER a new balita row is inserted
DROP TRIGGER IF EXISTS trigger_generate_imunisasi ON balita;
CREATE TRIGGER trigger_generate_imunisasi
    AFTER INSERT ON balita
    FOR EACH ROW
    EXECUTE FUNCTION generate_imunisasi_schedule();
