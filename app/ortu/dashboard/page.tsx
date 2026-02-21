'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import {
    Baby,
    CalendarDays,
    Syringe,
    BookOpen,
    UserCircle,
    Bell,
    ChevronRight,
    Sparkles,
    TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { cn, formatNumber } from '@/lib/utils';

interface ChildSummary {
    id: string;
    nama: string;
    last_kunjungan?: {
        berat_badan: number;
        tinggi_badan: number;
        status_gizi: string;
    }
}

export default function OrtuDashboard() {
    const [children, setChildren] = useState<ChildSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: links } = await supabase
                .from('orang_tua_balita')
                .select('balita_id')
                .eq('user_id', user.id);

            if (!links || links.length === 0) {
                setChildren([]);
                return;
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const balitaIds = links.map((l: any) => l.balita_id);
            const { data: balitaData } = await supabase
                .from('balita')
                .select('id, nama')
                .in('id', balitaIds);

            const childrenWithStats = await Promise.all(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (balitaData || []).map(async (b: any) => {
                    const { data: k } = await supabase
                        .from('kunjungan_balita')
                        .select('berat_badan, tinggi_badan, status_gizi')
                        .eq('balita_id', b.id)
                        .order('tahun', { ascending: false })
                        .order('bulan', { ascending: false })
                        .limit(1)
                        .single();

                    return {
                        id: b.id,
                        nama: b.nama,
                        last_kunjungan: k || undefined
                    };
                })
            );

            setChildren(childrenWithStats);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const allNormal = children.length > 0 && children.every(c => !c.last_kunjungan || c.last_kunjungan.status_gizi === 'NORMAL');

    return (
        <div className="space-y-6 pb-20 animate-fade-in bg-orange-50/30 min-h-screen -m-4 sm:-m-8 p-4 sm:p-8">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                        <UserCircle className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-medium">Selamat datang, Bunda</p>
                        <h1 className="text-lg font-bold text-slate-800">Orang Tua</h1>
                    </div>
                </div>
                <div className="relative">
                    <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                        <Bell className="h-5 w-5 text-slate-600" />
                        <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
                    </div>
                </div>
            </div>

            {/* Main Greeting Banner */}
            <div className={cn(
                "rounded-3xl p-6 text-white shadow-lg relative overflow-hidden transition-all duration-500",
                allNormal ? "bg-gradient-to-br from-teal-400 to-emerald-500 shadow-teal-500/20" : "bg-gradient-to-br from-orange-400 to-rose-500 shadow-orange-500/20"
            )}>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-5 w-5 text-white/50" />
                        <p className="text-sm font-medium text-white/80">Pantauan Harian</p>
                    </div>
                    <h2 className="text-2xl font-bold mb-1">{allNormal ? 'Semua Sehat!' : 'Status Pantauan'}</h2>
                    <p className="text-sm text-white/90">
                        {children.length === 0
                            ? 'Daftarkan anak Anda di Posyandu untuk mulai memantau.'
                            : allNormal
                                ? 'Pertumbuhan anak-anak berada di grafik normal.'
                                : 'Terus pantau tumbuh kembang anak secara rutin.'}
                    </p>
                </div>
                <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
            </div>

            {/* Quick Stats Grid */}
            {children.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {children.map(child => (
                        <Card key={child.id} className="p-4 bg-white/50 backdrop-blur-sm border-white/40">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
                                        <Baby className="h-4 w-4" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-700">{child.nama}</span>
                                </div>
                                {child.last_kunjungan?.status_gizi && (
                                    <span className={cn(
                                        "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                        child.last_kunjungan.status_gizi === 'NORMAL' ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                                    )}>
                                        {child.last_kunjungan.status_gizi}
                                    </span>
                                )}
                            </div>
                            {child.last_kunjungan ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white rounded-xl p-2 border border-slate-50">
                                        <p className="text-[10px] text-slate-400">Berat Badan</p>
                                        <p className="text-sm font-bold text-slate-800">{formatNumber(child.last_kunjungan.berat_badan)} kg</p>
                                    </div>
                                    <div className="bg-white rounded-xl p-2 border border-slate-50">
                                        <p className="text-[10px] text-slate-400">Tinggi Badan</p>
                                        <p className="text-sm font-bold text-slate-800">{formatNumber(child.last_kunjungan.tinggi_badan)} cm</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-[10px] text-slate-400 italic">Belum ada data pengukuran.</p>
                            )}
                        </Card>
                    ))}
                </div>
            )}

            {/* Menu Sections (Card Stack) */}
            <div>
                <h3 className="text-sm font-bold text-slate-800 mb-4 px-1">Menu Layanan</h3>
                <div className="space-y-4">
                    <Link href="/ortu/anak" className="block group">
                        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-all sm:p-5 flex items-center gap-4">
                            <div className="p-3 bg-blue-50 rounded-2xl group-hover:bg-blue-100 group-hover:scale-105 transition-all">
                                <TrendingUp className="h-6 w-6 text-blue-500" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-slate-800">Riwayat Perkembangan</h4>
                                <p className="text-xs text-slate-500 mt-1">Grafik Tumbuh Kembang</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                            </div>
                        </div>
                    </Link>

                    <Link href="/ortu/jadwal" className="block group">
                        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-all sm:p-5 flex items-center gap-4">
                            <div className="p-3 bg-purple-50 rounded-2xl group-hover:bg-purple-100 group-hover:scale-105 transition-all">
                                <CalendarDays className="h-6 w-6 text-purple-500" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-slate-800">Jadwal Posyandu</h4>
                                <p className="text-xs text-slate-500 mt-1">Estimasi kedatangan</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-purple-500 transition-colors" />
                            </div>
                        </div>
                    </Link>

                    <Link href="/ortu/imunisasi" className="block group">
                        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-all sm:p-5 flex items-center gap-4">
                            <div className="p-3 bg-amber-50 rounded-2xl group-hover:bg-amber-100 group-hover:scale-105 transition-all">
                                <Syringe className="h-6 w-6 text-amber-500" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-slate-800">Status Imunisasi</h4>
                                <p className="text-xs text-slate-500 mt-1">Bulan Imunisasi Anak</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-amber-500 transition-colors" />
                            </div>
                        </div>
                    </Link>

                    <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-200/50 flex items-center gap-4 opacity-70 cursor-not-allowed">
                        <div className="p-3 bg-slate-100 rounded-2xl">
                            <BookOpen className="h-6 w-6 text-slate-400" />
                        </div>
                        <div className="flex-1" >
                            <h4 className="text-sm font-bold text-slate-500" > Buku KIA Digital</h4>
                            <p className="text-xs text-slate-400 mt-1" > Segera hadir</p>
                        </div>
                        <div className="flex items-center gap-2" >
                            <span className="bg-slate-200 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-full" >
                                Lock
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info */}
            <div className="bg-orange-50/80 border border-orange-100 rounded-2xl p-4 flex gap-3" >
                <div className="text-2xl" > 💡</div>
                <p className="text-xs text-orange-800 leading-relaxed font-medium" >
                    Data anak Anda diperbarui secara real-time setiap kali selesai kunjungan ke Posyandu.
                    Hubungi Kader jika ada ketidaksesuaian data.
                </p>
            </div>
        </div>
    );
}
