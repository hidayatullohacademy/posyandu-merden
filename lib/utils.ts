import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Format tanggal ke format Indonesia
 * @example formatDate('2025-01-15') → '15 Januari 2025'
 */
export function formatDate(date: string | Date | null | undefined): string {
    if (!date) return '-';
    try {
        const d = typeof date === 'string' ? new Date(date) : date;
        if (isNaN(d.getTime())) return '-';
        return format(d, 'd MMMM yyyy', { locale: id });
    } catch {
        return '-';
    }
}

/**
 * Format tanggal dan waktu ke format Indonesia
 * @example formatDateTime('2025-01-15T10:00:00Z') → '15 Jan 2025, 17:00'
 */
export function formatDateTime(date: string | Date | null | undefined, formatStr: string = 'd MMM yyyy, HH:mm'): string {
    if (!date) return '-';
    try {
        const d = typeof date === 'string' ? new Date(date) : date;
        if (isNaN(d.getTime())) return '-';
        return format(d, formatStr, { locale: id });
    } catch {
        return '-';
    }
}

/**
 * Format tanggal singkat
 * @example formatDateShort('2025-01-15') → '15 Jan 2025'
 */
export function formatDateShort(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return format(d, 'd MMM yyyy', { locale: id });
}

/**
 * Generate NIK Sementara
 * Format: TEMP-MERDEN-[TAHUN]-[NOMORURUT]
 * @example generateTempNIK(2025, 1) → 'TEMP-MERDEN-2025-0001'
 */
export function generateTempNIK(tahun: number, nomorUrut: number): string {
    return `TEMP-MERDEN-${tahun}-${String(nomorUrut).padStart(4, '0')}`;
}

/**
 * Hitung usia dalam bulan dari tanggal lahir
 */
export function hitungUsiaBulan(tanggalLahir: string | Date): number {
    const lahir = typeof tanggalLahir === 'string' ? new Date(tanggalLahir) : tanggalLahir;
    const now = new Date();
    const months = (now.getFullYear() - lahir.getFullYear()) * 12 + (now.getMonth() - lahir.getMonth());
    return Math.max(0, months);
}

/**
 * Hitung usia dalam tahun
 */
export function hitungUsiaTahun(tanggalLahir: string | Date): number {
    const lahir = typeof tanggalLahir === 'string' ? new Date(tanggalLahir) : tanggalLahir;
    const now = new Date();
    let age = now.getFullYear() - lahir.getFullYear();
    const monthDiff = now.getMonth() - lahir.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < lahir.getDate())) {
        age--;
    }
    return Math.max(0, age);
}

/**
 * Hitung usia detail (tahun, bulan, hari)
 */
export function hitungUsiaDetail(tanggalLahir: string | Date) {
    const lahir = typeof tanggalLahir === 'string' ? new Date(tanggalLahir) : tanggalLahir;
    const sekarang = new Date();

    let tahun = sekarang.getFullYear() - lahir.getFullYear();
    let bulan = sekarang.getMonth() - lahir.getMonth();
    let hari = sekarang.getDate() - lahir.getDate();

    if (hari < 0) {
        bulan--;
        // Dapatkan jumlah hari di bulan sebelumnya
        const bulanLalu = new Date(sekarang.getFullYear(), sekarang.getMonth(), 0).getDate();
        hari += bulanLalu;
    }

    if (bulan < 0) {
        tahun--;
        bulan += 12;
    }

    return { tahun, bulan, hari };
}

/**
 * Format usia detail menjadi string "X thn Y bln Z hari"
 */
export function formatUsiaDetail(tanggalLahir: string | Date): string {
    const { tahun, bulan, hari } = hitungUsiaDetail(tanggalLahir);
    const parts = [];
    
    if (tahun > 0) {
        parts.push(`${tahun} thn`);
        parts.push(`${bulan} bln`);
        parts.push(`${hari} hari`);
    } else if (bulan > 0) {
        parts.push(`${bulan} bln`);
        parts.push(`${hari} hari`);
    } else {
        parts.push(`${hari} hari`);
    }
    
    return parts.join(' ');
}

/**
 * Hitung IMT (Indeks Massa Tubuh)
 * IMT = BB (kg) / (TB (m))²
 */
export function hitungIMT(beratBadan: number, tinggiBadan: number): number {
    const tinggiMeter = tinggiBadan / 100;
    if (tinggiMeter <= 0) return 0;
    return Math.round((beratBadan / (tinggiMeter * tinggiMeter)) * 100) / 100;
}

/**
 * Get status IMT Lansia
 */
export function getStatusIMT(imt: number): string {
    if (imt < 18.5) return '⚠️ Kurus';
    if (imt < 25) return '✅ Normal';
    if (imt < 27) return '⚠️ Gemuk';
    return '⚠️ Obesitas';
}

/**
 * Format nama bulan Indonesia
 */
export const NAMA_BULAN = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export function namaBulan(bulan: number): string {
    return NAMA_BULAN[bulan - 1] || '';
}

/**
 * Hitung Z-Score BB/U (Aproksimasi Standar WHO)
 */
export function getZScoreBBU(jk: 'L' | 'P', umurBulan: number, beratKg: number): number {
    const medianL = [3.3, 4.5, 5.6, 6.4, 7.0, 7.5, 7.9, 8.3, 8.6, 8.9, 9.2, 9.4, 9.6];
    const medianP = [3.2, 4.2, 5.1, 5.8, 6.4, 6.9, 7.3, 7.6, 7.9, 8.2, 8.5, 8.7, 8.9];

    let m = 0;
    if (umurBulan <= 12) {
        m = jk === 'L' ? (medianL[umurBulan] || 9.6) : (medianP[umurBulan] || 8.9);
    } else {
        if (jk === 'L') {
            m = 9.6 + ((umurBulan - 12) * 0.18);
        } else {
            m = 8.9 + ((umurBulan - 12) * 0.19);
        }
    }

    // Estimasi SD ~10% dari Median BB
    const sd = m * 0.10;
    if (sd === 0) return 0; // Guard terhadap division by zero
    const zScore = (beratKg - m) / sd;
    return Math.round(zScore * 100) / 100;
}

/**
 * Hitung Z-Score BB/U menggunakan Master Data dari Database
 */
export function calculateZScoreFromMaster(beratKg: number, master: any): number {
    if (!master || !beratKg) return 0;
    
    const { median, sd_minus_1, sd_plus_1 } = master;
    
    let zScore = 0;
    if (beratKg === median) {
        zScore = 0;
    } else if (beratKg > median) {
        // SD Positif
        zScore = (beratKg - median) / (sd_plus_1 - median);
    } else {
        // SD Negatif
        zScore = (beratKg - median) / (median - sd_minus_1);
    }

    return Math.round(zScore * 100) / 100;
}

export function getStatusGizi(zScore: number): string {
    if (zScore < -3) return 'BURUK';
    if (zScore >= -3 && zScore < -2) return 'KURANG';
    if (zScore >= -2 && zScore <= 1) return 'NORMAL';
    return 'LEBIH';
}

/**
 * Validasi risiko kesehatan lansia
 */
interface LansiaHealthVars {
    jk: 'L' | 'P';
    sistolik: number | null;
    diastolik: number | null;
    gulaDarah: number | null;
    kolesterol: number | null;
    asamUrat: number | null;
    lingkarPerut: number | null;
    imt: number | null;
}

export function evaluateRisikoLansia(vars: LansiaHealthVars) {
    const flags: Record<string, string> = {};
    let countKritis = 0;
    let countTinggi = 0;

    // Tensi
    if (vars.sistolik && vars.diastolik) {
        if (vars.sistolik >= 180 || vars.diastolik >= 110) {
            flags.tensi = '🔴 Kritis';
            countKritis++;
        } else if (vars.sistolik >= 140 || vars.diastolik >= 90) {
            flags.tensi = '⚠️ Tinggi';
            countTinggi++;
        }
    }

    // GDS
    if (vars.gulaDarah) {
        if (vars.gulaDarah >= 200) {
            flags.gulaDarah = '🔴 Tinggi'; // Treated as Kritis per icon spec
            countKritis++;
        } else if (vars.gulaDarah >= 100) {
            flags.gulaDarah = '⚠️ Waspada';
        }
    }

    // Kolesterol
    if (vars.kolesterol) {
        if (vars.kolesterol >= 240) {
            flags.kolesterol = '🔴 Kritis';
            countKritis++;
        } else if (vars.kolesterol >= 200) {
            flags.kolesterol = '⚠️ Tinggi';
            countTinggi++;
        }
    }

    // Asam Urat
    if (vars.asamUrat) {
        if ((vars.jk === 'L' && vars.asamUrat >= 7.0) || (vars.jk === 'P' && vars.asamUrat >= 6.0)) {
            flags.asamUrat = '⚠️ Tinggi';
            countTinggi++;
        }
    }

    // Lingkar Perut
    if (vars.lingkarPerut) {
        if ((vars.jk === 'L' && vars.lingkarPerut >= 90) || (vars.jk === 'P' && vars.lingkarPerut >= 80)) {
            flags.lingkarPerut = '⚠️ Obesitas';
        }
    }

    // IMT
    if (vars.imt) {
        if (vars.imt < 18.5) flags.imt = '⚠️ Kurus';
        if (vars.imt >= 27.0) flags.imt = '⚠️ Gemuk';
    }

    const rekomendasiRujukan = countKritis >= 1 || countTinggi >= 2;

    return { flags, rekomendasiRujukan };
}
/**
 * Format angka desimal ke format Indonesia (koma)
 * @example formatNumber(36.2) → "36,2"
 */
export function formatNumber(value: number | string | null | undefined, decimals: number = 2): string {
    if (value === null || value === undefined || value === '') return '-';
    const num = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
    if (isNaN(num)) return '-';

    return new Intl.NumberFormat('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
    }).format(num);
}

/**
 * Parse string dengan format Indonesia (koma) ke number
 * @example parseNumber("36,2") → 36.2
 */
export function parseNumber(value: string): number {
    if (!value) return 0;
    return parseFloat(value.replace(',', '.'));
}

/**
 * Cek apakah string input adalah angka yang valid (termasuk format Indonesia)
 */
export function isValidNumber(value: string): boolean {
    if (!value) return false;
    const num = parseNumber(value);
    return !isNaN(num) && isFinite(num);
}
