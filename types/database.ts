// ============================================================
// Posyandu ILP Digital — Database Type Definitions
// 15 Tabel sesuai Master Document v4.0
// ============================================================

// --- Enum Types ---
export type UserRole = 'ADMIN' | 'KADER' | 'ORANG_TUA';
export type NikStatus = 'ASLI' | 'SEMENTARA';
export type JenisKelamin = 'L' | 'P';
export type StatusImunisasi = 'BELUM' | 'SEGERA' | 'SELESAI' | 'TERLAMBAT';
export type TempatImunisasi = 'POSYANDU' | 'PUSKESMAS' | 'RS' | 'LAINNYA';
export type StatusNotifikasi = 'BELUM_DIKIRIM' | 'TERKIRIM';
export type StatusGizi = 'NORMAL' | 'KURANG' | 'BURUK' | 'LEBIH';
export type StatusUser = 'AKTIF' | 'NONAKTIF';

// --- 1. users ---
export interface User {
  id: string;
  nama_lengkap: string;
  nik: string;
  no_hp: string;
  password_hash: string;
  role: UserRole;
  posyandu_id: string | null;
  status: StatusUser;
  is_default_password: boolean;
  last_login: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// --- 2. posyandu ---
export interface Posyandu {
  id: string;
  nama: string;
  alamat: string;
  rt_rw: string;
  kelurahan: string;
  kecamatan: string;
  hari_buka: string;
  jam_buka: string;
  jam_tutup: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// --- 3. balita ---
export interface Balita {
  id: string;
  nik: string;
  nik_status: NikStatus;
  nama: string;
  nama_ibu: string;
  tanggal_lahir: string;
  jenis_kelamin: JenisKelamin;
  posyandu_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// --- 4. lansia ---
export interface Lansia {
  id: string;
  nik: string;
  nik_status: NikStatus;
  nama_lengkap: string;
  jenis_kelamin: JenisKelamin;
  tempat_lahir: string;
  tanggal_lahir: string;
  alamat: string;
  posyandu_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// --- 5. orang_tua_balita ---
export interface OrangTuaBalita {
  id: string;
  user_id: string;
  balita_id: string;
  created_at: string;
}

// --- 6. kunjungan_balita ---
export interface KunjunganBalita {
  id: string;
  balita_id: string;
  posyandu_id: string;
  bulan: number;
  tahun: number;
  berat_badan: number;
  tinggi_badan: number;
  lingkar_kepala: number | null;
  lingkar_lengan: number | null;
  vitamin_a: boolean;
  obat_cacing: boolean;
  status_gizi: StatusGizi | null;
  z_score: number | null;
  catatan: string | null;
  dicatat_oleh: string;
  created_at: string;
}

// --- 7. kunjungan_lansia ---
export interface FlagRisiko {
  tekanan_darah?: string;
  gula_darah?: string;
  kolesterol?: string;
  asam_urat?: string;
  lingkar_perut?: string;
  imt?: string;
}

export interface KunjunganLansia {
  id: string;
  lansia_id: string;
  posyandu_id: string;
  bulan: number;
  tahun: number;
  berat_badan: number;
  tinggi_badan: number;
  lingkar_perut: number | null;
  imt: number | null;
  sistolik: number | null;
  diastolik: number | null;
  gula_darah: number | null;
  kolesterol: number | null;
  asam_urat: number | null;
  flag_risiko: FlagRisiko | null;
  perlu_rujukan: boolean;
  keluhan: string | null;
  catatan: string | null;
  dicatat_oleh: string;
  created_at: string;
}

// --- 8. master_imunisasi ---
export interface MasterImunisasi {
  id: string;
  nama: string;
  usia_bulan: number;
  toleransi_minggu: number;
  urutan: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// --- 9. imunisasi_balita ---
export interface ImunisasiBalita {
  id: string;
  balita_id: string;
  master_imun_id: string;
  tanggal_jadwal: string;
  tanggal_realisasi: string | null;
  tempat: TempatImunisasi | null;
  status: StatusImunisasi;
  catatan: string | null;
  dicatat_oleh: string | null;
  created_at: string;
  updated_at: string;
}

// --- 12. laporan_bulanan_balita ---
export interface LaporanBulananBalita {
  id: string;
  posyandu_id: string;
  bulan: number;
  tahun: number;
  total_balita: number;
  total_hadir: number;
  total_gizi_normal: number;
  total_gizi_kurang: number;
  total_gizi_buruk: number;
  total_gizi_lebih: number;
  total_vitamin_a: number;
  total_obat_cacing: number;
  total_nik_lengkap: number;
  total_nik_sementara: number;
  snapshot_data: Record<string, unknown> | null;
  generated_by: string;
  created_at: string;
}

// --- 13. laporan_bulanan_lansia ---
export interface LaporanBulananLansia {
  id: string;
  posyandu_id: string;
  bulan: number;
  tahun: number;
  total_lansia: number;
  total_hadir: number;
  total_tensi_tinggi: number;
  total_tensi_kritis: number;
  total_gds_waspada: number;
  total_gds_tinggi: number;
  total_kolesterol_tinggi: number;
  total_asam_urat_tinggi: number;
  total_rujukan: number;
  snapshot_data: Record<string, unknown> | null;
  generated_by: string;
  created_at: string;
}

// --- 14. notifikasi ---
export interface Notifikasi {
  id: string;
  posyandu_id: string;
  jenis: string;
  teks_wa: string;
  ref_id: string | null;
  ref_type: string | null;
  status: StatusNotifikasi;
  dikirim_oleh: string | null;
  dikirim_at: string | null;
  created_at: string;
}

// --- 15. log_aktivitas ---
export interface LogAktivitas {
  id: string;
  user_id: string;
  aksi: string;
  detail: string | null;
  ip_address: string | null;
  created_at: string;
}

// --- Helper types for forms ---
export type BalitaInsert = Omit<Balita, 'id' | 'created_at' | 'updated_at'>;
export type LansiaInsert = Omit<Lansia, 'id' | 'created_at' | 'updated_at'>;
export type KunjunganBalitaInsert = Omit<KunjunganBalita, 'id' | 'created_at'>;
export type KunjunganLansiaInsert = Omit<KunjunganLansia, 'id' | 'created_at'>;
