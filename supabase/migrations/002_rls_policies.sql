-- ============================================================
-- Posyandu ILP Digital — Desa Merden
-- Row Level Security (RLS) Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE posyandu ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE balita ENABLE ROW LEVEL SECURITY;
ALTER TABLE lansia ENABLE ROW LEVEL SECURITY;
ALTER TABLE orang_tua_balita ENABLE ROW LEVEL SECURITY;
ALTER TABLE kunjungan_balita ENABLE ROW LEVEL SECURITY;
ALTER TABLE kunjungan_lansia ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_imunisasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE imunisasi_balita ENABLE ROW LEVEL SECURITY;
ALTER TABLE jadwal_posyandu ENABLE ROW LEVEL SECURITY;
ALTER TABLE usulan_jadwal ENABLE ROW LEVEL SECURITY;
ALTER TABLE laporan_bulanan_balita ENABLE ROW LEVEL SECURITY;
ALTER TABLE laporan_bulanan_lansia ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifikasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_aktivitas ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Helper function: get user role
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: get user posyandu_id
CREATE OR REPLACE FUNCTION get_user_posyandu_id()
RETURNS UUID AS $$
  SELECT posyandu_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- POSYANDU - semua authenticated user bisa lihat
-- ============================================================

CREATE POLICY "posyandu_select_all" ON posyandu
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "posyandu_admin_all" ON posyandu
  FOR ALL TO authenticated USING (get_user_role() = 'ADMIN');

-- ============================================================
-- USERS
-- ============================================================

-- Admin bisa lihat semua user
CREATE POLICY "users_admin_select" ON users
  FOR SELECT TO authenticated USING (get_user_role() = 'ADMIN');

-- Admin bisa CRUD semua user
CREATE POLICY "users_admin_all" ON users
  FOR ALL TO authenticated USING (get_user_role() = 'ADMIN');

-- User bisa lihat data sendiri
CREATE POLICY "users_self_select" ON users
  FOR SELECT TO authenticated USING (id = auth.uid());

-- User bisa update data sendiri (ganti password, dll)
CREATE POLICY "users_self_update" ON users
  FOR UPDATE TO authenticated USING (id = auth.uid());

-- ============================================================
-- BALITA
-- ============================================================

-- Admin bisa lihat semua balita
CREATE POLICY "balita_admin_select" ON balita
  FOR SELECT TO authenticated USING (get_user_role() = 'ADMIN');

-- Admin bisa CRUD semua balita
CREATE POLICY "balita_admin_all" ON balita
  FOR ALL TO authenticated USING (get_user_role() = 'ADMIN');

-- Kader hanya lihat & kelola balita di posyandunya
CREATE POLICY "balita_kader_select" ON balita
  FOR SELECT TO authenticated
  USING (get_user_role() = 'KADER' AND posyandu_id = get_user_posyandu_id());

CREATE POLICY "balita_kader_insert" ON balita
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'KADER' AND posyandu_id = get_user_posyandu_id());

CREATE POLICY "balita_kader_update" ON balita
  FOR UPDATE TO authenticated
  USING (get_user_role() = 'KADER' AND posyandu_id = get_user_posyandu_id());

-- Orang tua hanya lihat balita yang terhubung
CREATE POLICY "balita_ortu_select" ON balita
  FOR SELECT TO authenticated
  USING (
    get_user_role() = 'ORANG_TUA' AND
    id IN (SELECT balita_id FROM orang_tua_balita WHERE user_id = auth.uid())
  );

-- ============================================================
-- LANSIA
-- ============================================================

CREATE POLICY "lansia_admin_select" ON lansia
  FOR SELECT TO authenticated USING (get_user_role() = 'ADMIN');

CREATE POLICY "lansia_admin_all" ON lansia
  FOR ALL TO authenticated USING (get_user_role() = 'ADMIN');

CREATE POLICY "lansia_kader_select" ON lansia
  FOR SELECT TO authenticated
  USING (get_user_role() = 'KADER' AND posyandu_id = get_user_posyandu_id());

CREATE POLICY "lansia_kader_insert" ON lansia
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'KADER' AND posyandu_id = get_user_posyandu_id());

CREATE POLICY "lansia_kader_update" ON lansia
  FOR UPDATE TO authenticated
  USING (get_user_role() = 'KADER' AND posyandu_id = get_user_posyandu_id());

-- ============================================================
-- ORANG_TUA_BALITA
-- ============================================================

CREATE POLICY "otb_admin_all" ON orang_tua_balita
  FOR ALL TO authenticated USING (get_user_role() = 'ADMIN');

CREATE POLICY "otb_self_select" ON orang_tua_balita
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ============================================================
-- KUNJUNGAN_BALITA
-- ============================================================

CREATE POLICY "kb_admin_select" ON kunjungan_balita
  FOR SELECT TO authenticated USING (get_user_role() = 'ADMIN');

CREATE POLICY "kb_admin_all" ON kunjungan_balita
  FOR ALL TO authenticated USING (get_user_role() = 'ADMIN');

CREATE POLICY "kb_kader_select" ON kunjungan_balita
  FOR SELECT TO authenticated
  USING (get_user_role() = 'KADER' AND posyandu_id = get_user_posyandu_id());

CREATE POLICY "kb_kader_insert" ON kunjungan_balita
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'KADER' AND posyandu_id = get_user_posyandu_id());

CREATE POLICY "kb_ortu_select" ON kunjungan_balita
  FOR SELECT TO authenticated
  USING (
    get_user_role() = 'ORANG_TUA' AND
    balita_id IN (SELECT balita_id FROM orang_tua_balita WHERE user_id = auth.uid())
  );

-- ============================================================
-- KUNJUNGAN_LANSIA
-- ============================================================

CREATE POLICY "kl_admin_select" ON kunjungan_lansia
  FOR SELECT TO authenticated USING (get_user_role() = 'ADMIN');

CREATE POLICY "kl_admin_all" ON kunjungan_lansia
  FOR ALL TO authenticated USING (get_user_role() = 'ADMIN');

CREATE POLICY "kl_kader_select" ON kunjungan_lansia
  FOR SELECT TO authenticated
  USING (get_user_role() = 'KADER' AND posyandu_id = get_user_posyandu_id());

CREATE POLICY "kl_kader_insert" ON kunjungan_lansia
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'KADER' AND posyandu_id = get_user_posyandu_id());

-- ============================================================
-- MASTER_IMUNISASI - semua authenticated bisa lihat
-- ============================================================

CREATE POLICY "mi_select_all" ON master_imunisasi
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "mi_admin_all" ON master_imunisasi
  FOR ALL TO authenticated USING (get_user_role() = 'ADMIN');

-- ============================================================
-- IMUNISASI_BALITA
-- ============================================================

CREATE POLICY "ib_admin_all" ON imunisasi_balita
  FOR ALL TO authenticated USING (get_user_role() = 'ADMIN');

CREATE POLICY "ib_kader_select" ON imunisasi_balita
  FOR SELECT TO authenticated
  USING (
    get_user_role() = 'KADER' AND
    balita_id IN (SELECT id FROM balita WHERE posyandu_id = get_user_posyandu_id())
  );

CREATE POLICY "ib_kader_insert" ON imunisasi_balita
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role() = 'KADER' AND
    balita_id IN (SELECT id FROM balita WHERE posyandu_id = get_user_posyandu_id())
  );

CREATE POLICY "ib_kader_update" ON imunisasi_balita
  FOR UPDATE TO authenticated
  USING (
    get_user_role() = 'KADER' AND
    balita_id IN (SELECT id FROM balita WHERE posyandu_id = get_user_posyandu_id())
  );

CREATE POLICY "ib_ortu_select" ON imunisasi_balita
  FOR SELECT TO authenticated
  USING (
    get_user_role() = 'ORANG_TUA' AND
    balita_id IN (SELECT balita_id FROM orang_tua_balita WHERE user_id = auth.uid())
  );

-- ============================================================
-- JADWAL_POSYANDU - semua authenticated bisa lihat
-- ============================================================

CREATE POLICY "jp_select_all" ON jadwal_posyandu
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "jp_admin_all" ON jadwal_posyandu
  FOR ALL TO authenticated USING (get_user_role() = 'ADMIN');

-- ============================================================
-- USULAN_JADWAL
-- ============================================================

CREATE POLICY "uj_admin_all" ON usulan_jadwal
  FOR ALL TO authenticated USING (get_user_role() = 'ADMIN');

CREATE POLICY "uj_kader_select" ON usulan_jadwal
  FOR SELECT TO authenticated
  USING (get_user_role() = 'KADER' AND diusulkan_oleh = auth.uid());

CREATE POLICY "uj_kader_insert" ON usulan_jadwal
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role() = 'KADER' AND
    posyandu_id = get_user_posyandu_id() AND
    diusulkan_oleh = auth.uid()
  );

-- ============================================================
-- LAPORAN - hanya Admin
-- ============================================================

CREATE POLICY "lbb_admin_all" ON laporan_bulanan_balita
  FOR ALL TO authenticated USING (get_user_role() = 'ADMIN');

CREATE POLICY "lbl_admin_all" ON laporan_bulanan_lansia
  FOR ALL TO authenticated USING (get_user_role() = 'ADMIN');

-- ============================================================
-- NOTIFIKASI
-- ============================================================

CREATE POLICY "notif_admin_all" ON notifikasi
  FOR ALL TO authenticated USING (get_user_role() = 'ADMIN');

CREATE POLICY "notif_kader_select" ON notifikasi
  FOR SELECT TO authenticated
  USING (get_user_role() = 'KADER' AND posyandu_id = get_user_posyandu_id());

CREATE POLICY "notif_kader_update" ON notifikasi
  FOR UPDATE TO authenticated
  USING (get_user_role() = 'KADER' AND posyandu_id = get_user_posyandu_id());

-- ============================================================
-- LOG_AKTIVITAS - Admin semua, user sendiri
-- ============================================================

CREATE POLICY "log_admin_select" ON log_aktivitas
  FOR SELECT TO authenticated USING (get_user_role() = 'ADMIN');

CREATE POLICY "log_insert_all" ON log_aktivitas
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "log_self_select" ON log_aktivitas
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ============================================================
-- DONE
-- ============================================================
