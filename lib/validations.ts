import { z } from 'zod';

// --- Login ---
export const loginSchema = z.object({
    identifier: z
        .string()
        .min(1, 'No. HP atau NIK wajib diisi'),
    password: z
        .string()
        .min(1, 'Password wajib diisi'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// --- Pendaftaran Balita ---
export const balitaSchema = z.object({
    nik: z.string().optional(),
    nama: z.string().min(1, 'Nama wajib diisi').max(100),
    nama_ibu: z.string().min(1, 'Nama ibu wajib diisi').max(100),
    tanggal_lahir: z.string().min(1, 'Tanggal lahir wajib diisi'),
    jenis_kelamin: z.enum(['L', 'P'], { message: 'Jenis kelamin wajib dipilih' }),
    posyandu_id: z.string().min(1, 'Posyandu wajib dipilih'),
});

export type BalitaInput = z.infer<typeof balitaSchema>;

// --- Pendaftaran Lansia ---
export const lansiaSchema = z.object({
    nik: z.string().optional(),
    nama_lengkap: z.string().min(1, 'Nama lengkap wajib diisi').max(100),
    jenis_kelamin: z.enum(['L', 'P'], { message: 'Jenis kelamin wajib dipilih' }),
    tempat_lahir: z.string().min(1, 'Tempat lahir wajib diisi').max(100),
    tanggal_lahir: z.string().min(1, 'Tanggal lahir wajib diisi'),
    alamat: z.string().min(1, 'Alamat wajib diisi').max(255),
    posyandu_id: z.string().min(1, 'Posyandu wajib dipilih'),
});

export type LansiaInput = z.infer<typeof lansiaSchema>;

// --- Kunjungan Balita ---
export const kunjunganBalitaSchema = z.object({
    balita_id: z.string().min(1),
    posyandu_id: z.string().min(1),
    bulan: z.number().min(1).max(12),
    tahun: z.number().min(2020).max(2100),
    berat_badan: z.number().positive('Berat badan harus lebih dari 0'),
    tinggi_badan: z.number().positive('Tinggi badan harus lebih dari 0'),
    lingkar_kepala: z.number().positive().nullable().optional(),
    lingkar_lengan: z.number().positive().nullable().optional(),
    vitamin_a: z.boolean().default(false),
    obat_cacing: z.boolean().default(false),
    catatan: z.string().optional(),
});

export type KunjunganBalitaInput = z.infer<typeof kunjunganBalitaSchema>;

// --- Kunjungan Lansia ---
export const kunjunganLansiaSchema = z.object({
    lansia_id: z.string().min(1),
    posyandu_id: z.string().min(1),
    bulan: z.number().min(1).max(12),
    tahun: z.number().min(2020).max(2100),
    berat_badan: z.number().positive('Berat badan harus lebih dari 0'),
    tinggi_badan: z.number().positive('Tinggi badan harus lebih dari 0'),
    lingkar_perut: z.number().positive().nullable().optional(),
    sistolik: z.number().positive().nullable().optional(),
    diastolik: z.number().positive().nullable().optional(),
    gula_darah: z.number().positive().nullable().optional(),
    kolesterol: z.number().positive().nullable().optional(),
    asam_urat: z.number().positive().nullable().optional(),
    perlu_rujukan: z.boolean().default(false),
    keluhan: z.string().optional(),
    catatan: z.string().optional(),
});

export type KunjunganLansiaInput = z.infer<typeof kunjunganLansiaSchema>;

// --- User Management ---
export const userSchema = z.object({
    nama_lengkap: z.string().min(1, 'Nama lengkap wajib diisi').max(100),
    nik: z.string().min(1, 'NIK wajib diisi').max(16),
    no_hp: z.string().min(1, 'No. HP wajib diisi').max(15),
    role: z.enum(['ADMIN', 'KADER', 'ORANG_TUA'], { message: 'Role wajib dipilih' }),
    posyandu_id: z.string().nullable().optional(),
});

export type UserInput = z.infer<typeof userSchema>;

// --- Ubah Password ---
export const changePasswordSchema = z.object({
    current_password: z.string().min(1, 'Password lama wajib diisi'),
    new_password: z.string().min(8, 'Password baru minimal 8 karakter'),
    confirm_password: z.string().min(1, 'Konfirmasi password wajib diisi'),
}).refine((data) => data.new_password === data.confirm_password, {
    message: 'Password baru tidak cocok',
    path: ['confirm_password'],
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
