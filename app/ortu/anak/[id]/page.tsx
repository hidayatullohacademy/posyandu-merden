'use client';

import { useState, useEffect, use } from 'react';
import { createClient } from '@/lib/supabase';
import { ArrowLeft, TrendingUp, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn, formatDate, hitungUsiaBulan, formatNumber } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface BalitaDetail {
    id: string;
    nik: string;
    nik_status: string;
    nama: string;
    nama_ibu: string;
    tanggal_lahir: string;
    jenis_kelamin: string;
}

interface KunjunganRecord {
    id: string;
    bulan: number;
    tahun: number;
    berat_badan: number;
    tinggi_badan: number;
    lingkar_kepala: number | null;
    lingkar_lengan: number | null;
    vitamin_a: boolean;
    obat_cacing: boolean;
    status_gizi: string | null;
    catatan: string | null;
}

const BULAN_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];

export default function OrtuAnakDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [balita, setBalita] = useState<BalitaDetail | null>(null);
    const [kunjungan, setKunjungan] = useState<KunjunganRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchData(); }, [id]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [bRes, kRes] = await Promise.all([
                supabase.from('balita').select('*').eq('id', id).single(),
                supabase.from('kunjungan_balita').select('*').eq('balita_id', id)
                    .order('tahun', { ascending: false }).order('bulan', { ascending: false }),
            ]);
            if (bRes.error) throw bRes.error;
            setBalita(bRes.data);
            setKunjungan(kRes.data || []);
        } catch {
            toast.error('Gagal memuat data');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4 animate-fade-in">
                <div className="h-6 bg-slate-100 rounded w-32 animate-pulse" />
                <div className="bg-white rounded-2xl border p-6 animate-pulse">
                    <div className="h-10 bg-slate-100 rounded mb-3" />
                    <div className="h-4 bg-slate-50 rounded w-40" />
                </div>
            </div>
        );
    }

    if (!balita) {
        return (
            <div className="text-center py-12">
                <p className="text-sm text-slate-400">Data tidak ditemukan</p>
                <Link href="/ortu/anak"><Button variant="ghost" size="sm" className="mt-3"><ArrowLeft className="h-4 w-4" /> Kembali</Button></Link>
            </div>
        );
    }

    const usia = hitungUsiaBulan(balita.tanggal_lahir);
    const lastK = kunjungan[0];

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-3">
                <Link href="/ortu/anak" className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                    <ArrowLeft className="h-5 w-5 text-slate-500" />
                </Link>
                <h1 className="text-lg font-bold text-slate-800">Data Anak</h1>
            </div>

            {/* Profile */}
            <Card className="p-5">
                <div className="flex items-center gap-4 mb-4">
                    <div className={cn(
                        'w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl',
                        balita.jenis_kelamin === 'L' ? 'bg-gradient-to-br from-blue-400 to-blue-600' : 'bg-gradient-to-br from-pink-400 to-pink-600'
                    )}>
                        {balita.nama.charAt(0)}
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">{balita.nama}</h2>
                        <p className="text-xs text-slate-400">Ibu: {balita.nama_ibu}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-[10px] text-slate-400 mb-0.5">Usia</p>
                        <p className="font-semibold text-slate-700">
                            {usia < 12 ? `${usia} bulan` : `${Math.floor(usia / 12)} thn ${usia % 12} bln`}
                        </p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-[10px] text-slate-400 mb-0.5">Lahir</p>
                        <p className="font-semibold text-slate-700 text-xs">{formatDate(balita.tanggal_lahir)}</p>
                    </div>
                </div>
            </Card>

            {/* Last Measurement */}
            {lastK && (
                <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-semibold text-blue-700">Pengukuran Terakhir — {BULAN_NAMES[lastK.bulan]} {lastK.tahun}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <p className="text-[10px] text-blue-500">Berat</p>
                            <p className="text-lg font-bold text-blue-800">{formatNumber(lastK.berat_badan)} <span className="text-xs font-normal">kg</span></p>
                        </div>
                        <div>
                            <p className="text-[10px] text-blue-500">Tinggi</p>
                            <p className="text-lg font-bold text-blue-800">{formatNumber(lastK.tinggi_badan)} <span className="text-xs font-normal">cm</span></p>
                        </div>
                    </div>
                    {lastK.status_gizi && (
                        <div className="mt-2">
                            <span className={cn(
                                'text-[10px] font-medium px-2 py-0.5 rounded-full',
                                lastK.status_gizi === 'NORMAL' && 'bg-green-100 text-green-700',
                                lastK.status_gizi === 'KURANG' && 'bg-amber-100 text-amber-700',
                                lastK.status_gizi === 'BURUK' && 'bg-red-100 text-red-700',
                                lastK.status_gizi === 'LEBIH' && 'bg-blue-100 text-blue-700',
                            )}>
                                Status Gizi: {lastK.status_gizi}
                            </span>
                        </div>
                    )}
                </Card>
            )}

            {/* History */}
            <h3 className="text-sm font-semibold text-slate-700">Riwayat Timbang</h3>

            {kunjungan.length === 0 ? (
                <Card className="p-6 text-center">
                    <p className="text-sm text-slate-400">Belum ada data timbang</p>
                    <p className="text-xs text-slate-300 mt-1">Data akan muncul setelah kunjungan Posyandu</p>
                </Card>
            ) : (
                <div className="space-y-2">
                    {kunjungan.map((k) => (
                        <Card key={k.id} className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                    <span className="text-xs font-semibold text-slate-600">{BULAN_NAMES[k.bulan]} {k.tahun}</span>
                                </div>
                                {k.status_gizi && (
                                    <span className={cn(
                                        'text-[10px] font-medium px-2 py-0.5 rounded-full',
                                        k.status_gizi === 'NORMAL' && 'bg-green-50 text-green-600',
                                        k.status_gizi === 'KURANG' && 'bg-amber-50 text-amber-600',
                                        k.status_gizi === 'BURUK' && 'bg-red-50 text-red-600',
                                        k.status_gizi === 'LEBIH' && 'bg-blue-50 text-blue-600',
                                    )}>
                                        {k.status_gizi}
                                    </span>
                                )}
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-xs">
                                <div>
                                    <p className="text-slate-400">BB</p>
                                    <p className="font-semibold text-slate-700">{formatNumber(k.berat_badan)} kg</p>
                                </div>
                                <div>
                                    <p className="text-slate-400">TB</p>
                                    <p className="font-semibold text-slate-700">{formatNumber(k.tinggi_badan)} cm</p>
                                </div>
                                <div>
                                    <p className="text-slate-400">LK</p>
                                    <p className="font-semibold text-slate-700">{formatNumber(k.lingkar_kepala)}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400">LiLA</p>
                                    <p className="font-semibold text-slate-700">{formatNumber(k.lingkar_lengan)}</p>
                                </div>
                            </div>
                            {(k.vitamin_a || k.obat_cacing) && (
                                <div className="flex gap-2 mt-2">
                                    {k.vitamin_a && <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">Vitamin A</span>}
                                    {k.obat_cacing && <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">Obat Cacing</span>}
                                </div>
                            )}
                            {k.catatan && <p className="text-xs text-slate-500 mt-2 italic">{k.catatan}</p>}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
