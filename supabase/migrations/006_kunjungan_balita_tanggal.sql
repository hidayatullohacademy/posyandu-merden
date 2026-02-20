-- Migration 006: Tambah Kolom Tanggal Kunjungan Penuh 

-- Menambahkan kolom tanggal_kunjungan ke kunjungan_balita
ALTER TABLE kunjungan_balita ADD COLUMN IF NOT EXISTS tanggal_kunjungan DATE;

-- Update row lama agar valuenya = tanggal hari terakhir di bulan & tahun tercatat (Fallback safe)
UPDATE kunjungan_balita
SET tanggal_kunjungan = (tahun || '-' || LPAD(bulan::text, 2, '0') || '-28')::DATE
WHERE tanggal_kunjungan IS NULL;

-- Opsional: Mengubah kolom agar ke depan NOT NULL
-- ALTER TABLE kunjungan_balita ALTER COLUMN tanggal_kunjungan SET NOT NULL;
