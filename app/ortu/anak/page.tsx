'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Baby, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn, hitungUsiaBulan, formatNumber, formatUsiaDetail } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface AnakItem {
    id: string;
    nama: string;
    tanggal_lahir: string;
    jenis_kelamin: string;
    nik: string;
    nik_status: string;
    last_kunjungan?: {
        berat_badan: number;
        tinggi_badan: number;
        bulan: number;
        tahun: number;
    };
}

export default function OrtuAnakPage() {
    const [anakList, setAnakList] = useState<AnakItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchAnak(); }, []);

    const fetchAnak = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get balita linked to this parent
            const { data: links } = await supabase
                .from('orang_tua_balita')
                .select('balita_id')
                .eq('user_id', user.id);

            if (!links || links.length === 0) {
                setAnakList([]);
                return;
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const balitaIds = links.map((l: any) => l.balita_id);
            const { data: balitaData, error } = await supabase
                .from('balita')
                .select('*')
                .in('id', balitaIds)
                .order('nama');

            if (error) throw error;

            // Get latest kunjungan for each balita
            const anakWithKunjungan = await Promise.all(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (balitaData || []).map(async (b: any) => {
                    const { data: kunjunganData } = await supabase
                        .from('kunjungan_balita')
                        .select('berat_badan, tinggi_badan, bulan, tahun')
                        .eq('balita_id', b.id)
                        .order('tahun', { ascending: false })
                        .order('bulan', { ascending: false })
                        .limit(1);

                    return {
                        ...b,
                        last_kunjungan: kunjunganData?.[0] || undefined,
                    };
                })
            );

            setAnakList(anakWithKunjungan);
        } catch {
            toast.error('Gagal memuat data anak');
        } finally {
            setIsLoading(false);
        }
    };

    const getUsiaLabel = (tanggalLahir: string) => {
        return formatUsiaDetail(tanggalLahir);
    };

    if (isLoading) {
        return (
            <div className="space-y-4 animate-fade-in">
                <h1 className="text-lg font-bold text-slate-800">Anak Saya</h1>
                {[1, 2].map((i) => (
                    <div key={i} className="bg-white rounded-2xl border p-5 animate-pulse">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100" />
                            <div className="flex-1">
                                <div className="h-4 bg-slate-100 rounded w-32 mb-2" />
                                <div className="h-3 bg-slate-50 rounded w-24" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-fade-in">
            <h1 className="text-lg font-bold text-slate-800">Anak Saya</h1>

            {anakList.length === 0 ? (
                <Card className="p-8 text-center">
                    <Baby className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-slate-500">Belum Ada Data Anak</h3>
                    <p className="text-xs text-slate-400 mt-1">
                        Hubungi Kader Posyandu untuk mendaftarkan dan menghubungkan data anak Anda.
                    </p>
                </Card>
            ) : (
                <div className="space-y-3">
                    {anakList.map((anak) => (
                        <Link key={anak.id} href={`/ortu/anak/${anak.id}`}>
                            <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer">
                                <div className="flex items-center gap-4 mb-3">
                                    <div className={cn(
                                        'w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg',
                                        anak.jenis_kelamin === 'L'
                                            ? 'bg-gradient-to-br from-blue-400 to-blue-600'
                                            : 'bg-gradient-to-br from-pink-400 to-pink-600'
                                    )}>
                                        {anak.nama.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-bold text-slate-800 truncate">{anak.nama}</h3>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            {anak.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'} · {getUsiaLabel(anak.tanggal_lahir)}
                                        </p>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-slate-300" />
                                </div>

                                {anak.last_kunjungan && (
                                    <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between">
                                        <div className="text-xs">
                                            <span className="text-slate-400">Pengukuran terakhir:</span>
                                            <span className="font-semibold text-slate-700 ml-1">
                                                {formatNumber(anak.last_kunjungan.berat_badan)} kg / {formatNumber(anak.last_kunjungan.tinggi_badan)} cm
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        </Link>
                    ))}
                </div>
            )}

            <Card className="p-4 bg-blue-50/50 border-blue-100">
                <p className="text-xs text-blue-700 leading-relaxed">
                    ℹ️ Data anak diperbarui setiap kunjungan Posyandu. Untuk perubahan data, hubungi Kader atau Admin.
                </p>
            </Card>
        </div>
    );
}
