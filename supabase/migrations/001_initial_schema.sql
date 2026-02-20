-- ============================================================
-- Posyandu ILP Digital — Desa Merden
-- Database Schema Migration: 15 Tables
-- Sesuai Master Document v4.0
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE user_role AS ENUM ('ADMIN', 'KADER', 'ORANG_TUA');
CREATE TYPE nik_status AS ENUM ('ASLI', 'SEMENTARA');
CREATE TYPE jenis_kelamin AS ENUM ('L', 'P');
CREATE TYPE status_user AS ENUM ('AKTIF', 'NONAKTIF');
CREATE TYPE status_usulan_jadwal AS ENUM ('PENDING', 'DISETUJUI', 'DITOLAK');
CREATE TYPE jenis_perubahan_jadwal AS ENUM ('GESER_TANGGAL', 'GANTI_LOKASI', 'TANGGAL_DAN_LOKASI', 'DITUNDA');
CREATE TYPE alasan_perubahan_jadwal AS ENUM (
  'HARI_LIBUR_NASIONAL', 'HARI_BESAR_KEAGAMAAN', 'CUACA_EKSTREM',
  'LOKASI_TIDAK_BISA', 'KADER_SAKIT', 'BIDAN_TIDAK_HADIR',
  'KEGIATAN_DESA_BENTROK', 'LAINNYA'
);
CREATE TYPE status_imunisasi AS ENUM ('BELUM', 'SEGERA', 'SELESAI', 'TERLAMBAT');
CREATE TYPE tempat_imunisasi AS ENUM ('POSYANDU', 'PUSKESMAS', 'RS', 'LAINNYA');
CREATE TYPE status_notifikasi AS ENUM ('BELUM_DIKIRIM', 'TERKIRIM');
CREATE TYPE status_gizi AS ENUM ('NORMAL', 'KURANG', 'BURUK', 'LEBIH');
CREATE TYPE status_jadwal AS ENUM ('AKTIF', 'DIUBAH', 'DITUNDA');

-- ============================================================
-- HELPER: auto-update updated_at trigger
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================
-- 1. POSYANDU
-- ============================================================

CREATE TABLE posyandu (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama VARCHAR(100) NOT NULL,
  alamat TEXT NOT NULL,
  rt_rw VARCHAR(20) DEFAULT '',
  kelurahan VARCHAR(100) DEFAULT 'Merden',
  kecamatan VARCHAR(100) DEFAULT 'Purwanegara',
  hari_buka VARCHAR(20) NOT NULL,
  jam_buka TIME DEFAULT '08:00',
  jam_tutup TIME DEFAULT '12:00',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_posyandu_updated_at
  BEFORE UPDATE ON posyandu
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 2. USERS
-- ============================================================

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nama_lengkap VARCHAR(100) NOT NULL,
  nik VARCHAR(20) UNIQUE NOT NULL,
  no_hp VARCHAR(15) UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'ORANG_TUA',
  posyandu_id UUID REFERENCES posyandu(id) ON DELETE SET NULL,
  status status_user DEFAULT 'AKTIF',
  is_default_password BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_posyandu ON users(posyandu_id);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_no_hp ON users(no_hp);
CREATE INDEX idx_users_nik ON users(nik);

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 3. BALITA
-- ============================================================

CREATE TABLE balita (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nik VARCHAR(30) NOT NULL,
  nik_status nik_status NOT NULL DEFAULT 'ASLI',
  nama VARCHAR(100) NOT NULL,
  nama_ibu VARCHAR(100) NOT NULL,
  tanggal_lahir DATE NOT NULL,
  jenis_kelamin jenis_kelamin NOT NULL,
  posyandu_id UUID NOT NULL REFERENCES posyandu(id) ON DELETE RESTRICT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_balita_posyandu ON balita(posyandu_id);
CREATE INDEX idx_balita_nik ON balita(nik);
CREATE INDEX idx_balita_nama_ibu ON balita(nama_ibu);

CREATE TRIGGER update_balita_updated_at
  BEFORE UPDATE ON balita
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 4. LANSIA
-- ============================================================

CREATE TABLE lansia (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nik VARCHAR(30) NOT NULL,
  nik_status nik_status NOT NULL DEFAULT 'ASLI',
  nama_lengkap VARCHAR(100) NOT NULL,
  jenis_kelamin jenis_kelamin NOT NULL,
  tempat_lahir VARCHAR(100) NOT NULL,
  tanggal_lahir DATE NOT NULL,
  alamat TEXT NOT NULL,
  posyandu_id UUID NOT NULL REFERENCES posyandu(id) ON DELETE RESTRICT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lansia_posyandu ON lansia(posyandu_id);
CREATE INDEX idx_lansia_nik ON lansia(nik);

CREATE TRIGGER update_lansia_updated_at
  BEFORE UPDATE ON lansia
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 5. ORANG_TUA_BALITA (many-to-many)
-- ============================================================

CREATE TABLE orang_tua_balita (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balita_id UUID NOT NULL REFERENCES balita(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, balita_id)
);

CREATE INDEX idx_otb_user ON orang_tua_balita(user_id);
CREATE INDEX idx_otb_balita ON orang_tua_balita(balita_id);

-- ============================================================
-- 6. KUNJUNGAN_BALITA
-- ============================================================

CREATE TABLE kunjungan_balita (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  balita_id UUID NOT NULL REFERENCES balita(id) ON DELETE CASCADE,
  posyandu_id UUID NOT NULL REFERENCES posyandu(id) ON DELETE RESTRICT,
  bulan INTEGER NOT NULL CHECK (bulan BETWEEN 1 AND 12),
  tahun INTEGER NOT NULL CHECK (tahun >= 2020),
  berat_badan DECIMAL(5,2) NOT NULL,
  tinggi_badan DECIMAL(5,2) NOT NULL,
  lingkar_kepala DECIMAL(5,2),
  lingkar_lengan DECIMAL(5,2),
  vitamin_a BOOLEAN DEFAULT FALSE,
  obat_cacing BOOLEAN DEFAULT FALSE,
  status_gizi status_gizi,
  z_score DECIMAL(5,2),
  catatan TEXT,
  dicatat_oleh UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(balita_id, bulan, tahun)
);

CREATE INDEX idx_kb_balita ON kunjungan_balita(balita_id);
CREATE INDEX idx_kb_posyandu ON kunjungan_balita(posyandu_id);
CREATE INDEX idx_kb_periode ON kunjungan_balita(bulan, tahun);

-- ============================================================
-- 7. KUNJUNGAN_LANSIA
-- ============================================================

CREATE TABLE kunjungan_lansia (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lansia_id UUID NOT NULL REFERENCES lansia(id) ON DELETE CASCADE,
  posyandu_id UUID NOT NULL REFERENCES posyandu(id) ON DELETE RESTRICT,
  bulan INTEGER NOT NULL CHECK (bulan BETWEEN 1 AND 12),
  tahun INTEGER NOT NULL CHECK (tahun >= 2020),
  berat_badan DECIMAL(5,2) NOT NULL,
  tinggi_badan DECIMAL(5,2) NOT NULL,
  lingkar_perut DECIMAL(5,2),
  imt DECIMAL(5,2),
  sistolik INTEGER,
  diastolik INTEGER,
  gula_darah DECIMAL(6,2),
  kolesterol DECIMAL(6,2),
  asam_urat DECIMAL(5,2),
  flag_risiko JSONB DEFAULT '{}',
  perlu_rujukan BOOLEAN DEFAULT FALSE,
  keluhan TEXT,
  catatan TEXT,
  dicatat_oleh UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lansia_id, bulan, tahun)
);

CREATE INDEX idx_kl_lansia ON kunjungan_lansia(lansia_id);
CREATE INDEX idx_kl_posyandu ON kunjungan_lansia(posyandu_id);
CREATE INDEX idx_kl_periode ON kunjungan_lansia(bulan, tahun);

-- ============================================================
-- 8. MASTER_IMUNISASI
-- ============================================================

CREATE TABLE master_imunisasi (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama VARCHAR(100) NOT NULL,
  usia_bulan INTEGER NOT NULL,
  toleransi_minggu INTEGER NOT NULL DEFAULT 4,
  urutan INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_master_imunisasi_updated_at
  BEFORE UPDATE ON master_imunisasi
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 9. IMUNISASI_BALITA
-- ============================================================

CREATE TABLE imunisasi_balita (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  balita_id UUID NOT NULL REFERENCES balita(id) ON DELETE CASCADE,
  master_imun_id UUID NOT NULL REFERENCES master_imunisasi(id) ON DELETE RESTRICT,
  tanggal_jadwal DATE NOT NULL,
  tanggal_realisasi DATE,
  tempat tempat_imunisasi,
  status status_imunisasi DEFAULT 'BELUM',
  catatan TEXT,
  dicatat_oleh UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(balita_id, master_imun_id)
);

CREATE INDEX idx_ib_balita ON imunisasi_balita(balita_id);
CREATE INDEX idx_ib_status ON imunisasi_balita(status);
CREATE INDEX idx_ib_jadwal ON imunisasi_balita(tanggal_jadwal);

CREATE TRIGGER update_imunisasi_balita_updated_at
  BEFORE UPDATE ON imunisasi_balita
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 10. JADWAL_POSYANDU
-- ============================================================

CREATE TABLE jadwal_posyandu (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  posyandu_id UUID NOT NULL REFERENCES posyandu(id) ON DELETE RESTRICT,
  bulan INTEGER NOT NULL CHECK (bulan BETWEEN 1 AND 12),
  tahun INTEGER NOT NULL CHECK (tahun >= 2020),
  tanggal DATE NOT NULL,
  lokasi TEXT NOT NULL,
  status status_jadwal DEFAULT 'AKTIF',
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(posyandu_id, bulan, tahun)
);

CREATE INDEX idx_jp_posyandu ON jadwal_posyandu(posyandu_id);
CREATE INDEX idx_jp_tanggal ON jadwal_posyandu(tanggal);

CREATE TRIGGER update_jadwal_posyandu_updated_at
  BEFORE UPDATE ON jadwal_posyandu
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 11. USULAN_JADWAL
-- ============================================================

CREATE TABLE usulan_jadwal (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  posyandu_id UUID NOT NULL REFERENCES posyandu(id) ON DELETE RESTRICT,
  diusulkan_oleh UUID NOT NULL REFERENCES users(id),
  bulan INTEGER NOT NULL CHECK (bulan BETWEEN 1 AND 12),
  tahun INTEGER NOT NULL CHECK (tahun >= 2020),
  jenis_perubahan jenis_perubahan_jadwal NOT NULL,
  alasan alasan_perubahan_jadwal NOT NULL,
  alasan_detail TEXT,
  tanggal_baru DATE,
  lokasi_baru TEXT,
  status status_usulan_jadwal DEFAULT 'PENDING',
  is_mendesak BOOLEAN DEFAULT FALSE,
  diproses_oleh UUID REFERENCES users(id),
  alasan_penolakan TEXT,
  diproses_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_uj_posyandu ON usulan_jadwal(posyandu_id);
CREATE INDEX idx_uj_status ON usulan_jadwal(status);
CREATE INDEX idx_uj_diusulkan ON usulan_jadwal(diusulkan_oleh);

-- ============================================================
-- 12. LAPORAN_BULANAN_BALITA
-- ============================================================

CREATE TABLE laporan_bulanan_balita (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  posyandu_id UUID NOT NULL REFERENCES posyandu(id) ON DELETE RESTRICT,
  bulan INTEGER NOT NULL CHECK (bulan BETWEEN 1 AND 12),
  tahun INTEGER NOT NULL CHECK (tahun >= 2020),
  total_balita INTEGER DEFAULT 0,
  total_hadir INTEGER DEFAULT 0,
  total_gizi_normal INTEGER DEFAULT 0,
  total_gizi_kurang INTEGER DEFAULT 0,
  total_gizi_buruk INTEGER DEFAULT 0,
  total_gizi_lebih INTEGER DEFAULT 0,
  total_vitamin_a INTEGER DEFAULT 0,
  total_obat_cacing INTEGER DEFAULT 0,
  total_nik_lengkap INTEGER DEFAULT 0,
  total_nik_sementara INTEGER DEFAULT 0,
  snapshot_data JSONB,
  generated_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(posyandu_id, bulan, tahun)
);

-- ============================================================
-- 13. LAPORAN_BULANAN_LANSIA
-- ============================================================

CREATE TABLE laporan_bulanan_lansia (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  posyandu_id UUID NOT NULL REFERENCES posyandu(id) ON DELETE RESTRICT,
  bulan INTEGER NOT NULL CHECK (bulan BETWEEN 1 AND 12),
  tahun INTEGER NOT NULL CHECK (tahun >= 2020),
  total_lansia INTEGER DEFAULT 0,
  total_hadir INTEGER DEFAULT 0,
  total_tensi_tinggi INTEGER DEFAULT 0,
  total_tensi_kritis INTEGER DEFAULT 0,
  total_gds_waspada INTEGER DEFAULT 0,
  total_gds_tinggi INTEGER DEFAULT 0,
  total_kolesterol_tinggi INTEGER DEFAULT 0,
  total_asam_urat_tinggi INTEGER DEFAULT 0,
  total_rujukan INTEGER DEFAULT 0,
  snapshot_data JSONB,
  generated_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(posyandu_id, bulan, tahun)
);

-- ============================================================
-- 14. NOTIFIKASI
-- ============================================================

CREATE TABLE notifikasi (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  posyandu_id UUID NOT NULL REFERENCES posyandu(id) ON DELETE RESTRICT,
  jenis VARCHAR(50) NOT NULL,
  teks_wa TEXT NOT NULL,
  ref_id UUID,
  ref_type VARCHAR(50),
  status status_notifikasi DEFAULT 'BELUM_DIKIRIM',
  dikirim_oleh UUID REFERENCES users(id),
  dikirim_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notif_posyandu ON notifikasi(posyandu_id);
CREATE INDEX idx_notif_status ON notifikasi(status);
CREATE INDEX idx_notif_jenis ON notifikasi(jenis);

-- ============================================================
-- 15. LOG_AKTIVITAS
-- ============================================================

CREATE TABLE log_aktivitas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  aksi VARCHAR(100) NOT NULL,
  detail TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_log_user ON log_aktivitas(user_id);
CREATE INDEX idx_log_created ON log_aktivitas(created_at DESC);

-- ============================================================
-- SEED DATA: Default Master Imunisasi
-- ============================================================

INSERT INTO master_imunisasi (nama, usia_bulan, toleransi_minggu, urutan) VALUES
  ('Hepatitis B-0', 0, 1, 1),
  ('BCG', 1, 4, 2),
  ('Polio 1 (OPV)', 1, 4, 3),
  ('DPT-HB-Hib 1', 2, 4, 4),
  ('Polio 2 (OPV)', 2, 4, 5),
  ('DPT-HB-Hib 2', 3, 4, 6),
  ('Polio 3 (OPV)', 3, 4, 7),
  ('DPT-HB-Hib 3', 4, 4, 8),
  ('Polio 4 (OPV)', 4, 4, 9),
  ('IPV', 4, 4, 10),
  ('Campak/MR 1', 9, 4, 11),
  ('DPT-HB-Hib Lanjutan', 18, 4, 12),
  ('Campak/MR 2', 18, 4, 13);

-- ============================================================
-- DONE
-- ============================================================
