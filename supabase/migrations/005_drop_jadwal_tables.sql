-- ============================================================
-- Posyandu ILP Digital — Desa Merden
-- Migration: Drop Jadwal Posyandu and Usulan Jadwal
-- ============================================================

-- Drop triggers related to jadwal if any
DROP TRIGGER IF EXISTS update_jadwal_posyandu_updated_at ON jadwal_posyandu;

-- Drop tables
DROP TABLE IF EXISTS usulan_jadwal;
DROP TABLE IF EXISTS jadwal_posyandu;

-- Drop related enums if they are no longer used anywhere else
-- Note: PostgreSQL doesn't have a simple DROP TYPE IF EXISTS IF NOT USED, 
-- but we know they were only used in these tables, so it's safe to drop them cascade if needed.
-- But to be safe and avoid breaking anything unexpectedly, we can just leave the ENUM types in the database, 
-- or drop them explicitly:
DROP TYPE IF EXISTS status_usulan_jadwal CASCADE;
DROP TYPE IF EXISTS jenis_perubahan_jadwal CASCADE;
DROP TYPE IF EXISTS alasan_perubahan_jadwal CASCADE;
