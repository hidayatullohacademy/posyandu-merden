-- ============================================================
-- 10. MASTER_GIZI (Standard WHO Weight-for-Age)
-- ============================================================

CREATE TABLE master_gizi (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  jenis_kelamin jenis_kelamin NOT NULL,
  umur_bulan INTEGER NOT NULL,
  median DECIMAL(5,2) NOT NULL,
  sd_minus_3 DECIMAL(5,2) NOT NULL,
  sd_minus_2 DECIMAL(5,2) NOT NULL,
  sd_minus_1 DECIMAL(5,2) NOT NULL,
  sd_plus_1 DECIMAL(5,2) NOT NULL,
  sd_plus_2 DECIMAL(5,2) NOT NULL,
  sd_plus_3 DECIMAL(5,2) NOT NULL,
  kategori_imt BOOLEAN DEFAULT FALSE, -- Untuk membedakan BB/U dengan IMT (TB/BB) jika dibutuhkan nanti
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(jenis_kelamin, umur_bulan, kategori_imt)
);

CREATE TRIGGER update_master_gizi_updated_at
  BEFORE UPDATE ON master_gizi
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Optional: Initial data for 0-12 months (Approximate WHO values as used in current utils.ts)
-- Laki-laki
INSERT INTO master_gizi (jenis_kelamin, umur_bulan, median, sd_minus_3, sd_minus_2, sd_minus_1, sd_plus_1, sd_plus_2, sd_plus_3) VALUES 
('L', 0, 3.3, 2.4, 2.7, 3.0, 3.7, 4.1, 4.6),
('L', 1, 4.5, 3.3, 3.7, 4.1, 5.0, 5.5, 6.1),
('L', 2, 5.6, 4.1, 4.6, 5.1, 6.2, 6.8, 7.5),
('L', 3, 6.4, 4.8, 5.3, 5.9, 7.1, 7.8, 8.6),
('L', 4, 7.0, 5.3, 5.9, 6.4, 7.7, 8.5, 9.4),
('L', 5, 7.5, 5.8, 6.4, 6.9, 8.3, 9.1, 10.1),
('L', 6, 7.9, 6.2, 6.8, 7.4, 8.7, 9.6, 10.7),
('L', 7, 8.3, 6.5, 7.1, 7.7, 9.1, 10.0, 11.2),
('L', 8, 8.6, 6.8, 7.4, 8.0, 9.5, 10.4, 11.6),
('L', 9, 8.9, 7.0, 7.7, 8.3, 9.8, 10.7, 12.0),
('L', 10, 9.2, 7.3, 8.0, 8.6, 10.1, 11.1, 12.4),
('L', 11, 9.4, 7.5, 8.2, 8.8, 10.4, 11.4, 12.7),
('L', 12, 9.6, 7.7, 8.4, 9.0, 10.6, 11.6, 13.0);

-- Perempuan
INSERT INTO master_gizi (jenis_kelamin, umur_bulan, median, sd_minus_3, sd_minus_2, sd_minus_1, sd_plus_1, sd_plus_2, sd_plus_3) VALUES 
('P', 0, 3.2, 2.3, 2.6, 2.9, 3.6, 4.0, 4.5),
('P', 1, 4.2, 3.1, 3.5, 3.8, 4.7, 5.2, 5.9),
('P', 2, 5.1, 3.8, 4.2, 4.6, 5.7, 6.2, 7.0),
('P', 3, 5.8, 4.3, 4.8, 5.3, 6.5, 7.1, 8.0),
('P', 4, 6.4, 4.8, 5.4, 5.9, 7.1, 7.8, 8.8),
('P', 5, 6.9, 5.3, 5.9, 6.4, 7.6, 8.4, 9.5),
('P', 6, 7.3, 5.7, 6.2, 6.8, 8.1, 8.9, 10.0),
('P', 7, 7.6, 6.0, 6.5, 7.1, 8.5, 9.3, 10.5),
('P', 8, 7.9, 6.2, 6.8, 7.4, 8.8, 9.7, 11.0),
('P', 9, 8.2, 6.5, 7.0, 7.7, 9.1, 10.0, 11.3),
('P', 10, 8.5, 6.7, 7.3, 7.9, 9.4, 10.3, 11.7),
('P', 11, 8.7, 6.9, 7.5, 8.1, 9.6, 10.6, 12.0),
('P', 12, 8.9, 7.1, 7.7, 8.3, 9.9, 10.9, 12.4);

-- Add comment to table
COMMENT ON TABLE master_gizi IS 'Tabel referensi standar Z-Score Berat Badan menurut Umur (BB/U) sesuai WHO untuk interpretasi gizi balita.';
