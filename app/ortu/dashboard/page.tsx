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
import { cn, formatNumber, formatUsiaDetail } from '@/lib/utils';

interface ChildSummary {
    id: string;
    nama: string;
    tanggal_lahir: string;
    last_kunjungan?: {
        berat_badan: number;
        tinggi_badan: number;
        status_gizi: string;
    }
}

import { UpcomingVaccines } from '@/components/ortu/UpcomingVaccines';

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

            const balitaIds = links.map((l: any) => l.balita_id);
            const { data: balitaData } = await supabase
                .from('balita')
                .select('id, nama, tanggal_lahir')
                .in('id', balitaIds);

            const childrenWithStats = await Promise.all(
                (balitaData || []).map(async (b: any) => {
                    const { data: k } = await supabase
                        .from('kunjungan_balita')
                        .select('berat_badan, tinggi_badan, status_gizi')
                        .eq('balita_id', b.id)
                        .order('tahun', { ascending: false })
                        .order('bulan', { ascending: false })
                        .limit(1)
                        .maybeSingle();

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
        <div className="space-y-6 pb-20 animate-fade-in">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center border-2 border-white shadow-sm shrink-0">
                        <UserCircle className="h-7 w-7" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">Hai, Bunda!</h1>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                            {children.length} Anak Terdaftar
                        </p>
                    </div>
                </div>
                <Link href="/ortu/notifikasi" className="relative group">
                    <div className="h-11 w-11 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 group-hover:border-orange-200 group-hover:bg-orange-50 transition-all">
                        <Bell className="h-5 w-5 text-slate-600 group-hover:text-orange-500 transition-colors" />
                        <span className="absolute top-2.5 right-2.5 h-2.5 w-2.5 bg-rose-500 rounded-full border-2 border-white scale-100 group-hover:scale-110 transition-transform"></span>
                    </div>
                </Link>
            </div>

            {/* Main Greeting Banner */}
            <div className={cn(
                "rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden transition-all duration-700",
                allNormal ? "bg-gradient-to-br from-teal-400 to-emerald-600 shadow-teal-500/20" : "bg-gradient-to-br from-orange-400 to-rose-600 shadow-orange-500/20"
            )}>
                <div className="relative z-10 flex flex-col gap-1">
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="h-4 w-4 text-white/60" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Monitoring Kesehatan</span>
                    </div>
                    <h2 className="text-2xl font-black">{allNormal ? 'Kondisi Prima!' : 'Pantauan Rutin'}</h2>
                    <p className="text-sm text-white/90 font-medium max-w-[240px] leading-relaxed">
                        {children.length === 0
                            ? 'Daftarkan anak Anda di Posyandu untuk mulai memantau tumbuh kembangnya.'
                            : allNormal
                                ? 'Alhamdulillah, semua anak Bunda berada di grafik pertumbuhan yang sehat.'
                                : 'Tetap pantau grafik pertumbuhan dan jadwal imunisasi si kecil setiap bulan.'}
                    </p>
                </div>
                {/* Decorative Elements */}
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-[80px]"></div>
                <div className="absolute top-0 right-10 w-24 h-24 bg-white/10 rounded-full blur-[40px]"></div>
                <Baby className="absolute -right-8 bottom-0 h-48 w-48 text-white/5 rotate-12" />
            </div>

            {/* Proactive Widgets */}
            <UpcomingVaccines />

            {/* Children Cards List */}
            {children.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Profil Anak</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {children.map(child => (
                            <Link key={child.id} href={`/ortu/anak/${child.id}`}>
                                <Card className="p-4 bg-white/60 backdrop-blur-md border border-white hover:shadow-lg transition-all group active:scale-[0.98]">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 border border-blue-100">
                                                <Baby className="h-5 w-5" />
                                            </div>
                                            <span className="text-sm font-black text-slate-800 tracking-tight">{child.nama}</span>
                                        </div>
                                        {/* Age Display */}
                                        <div className="px-2 py-1 bg-slate-50 rounded-lg border border-slate-100">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Usia</p>
                                            <p className="text-[11px] font-bold text-slate-700">{formatUsiaDetail(child.tanggal_lahir)}</p>
                                        </div>
                                        {child.last_kunjungan?.status_gizi && (
                                            <span className={cn(
                                                "text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider",
                                                child.last_kunjungan.status_gizi === 'NORMAL' ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"
                                            )}>
                                                {child.last_kunjungan.status_gizi}
                                            </span>
                                        )}
                                    </div>
                                    {child.last_kunjungan ? (
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-slate-50/50 rounded-xl p-2.5 border border-slate-100/50">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Berat</p>
                                                <p className="text-sm font-black text-slate-800">{formatNumber(child.last_kunjungan.berat_badan)} kg</p>
                                            </div>
                                            <div className="bg-slate-50/50 rounded-xl p-2.5 border border-slate-100/50">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Tinggi</p>
                                                <p className="text-sm font-black text-slate-800">{formatNumber(child.last_kunjungan.tinggi_badan)} cm</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100/50 text-center">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Belum Ada Pengukuran</p>
                                        </div>
                                    )}
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Service Grid Section */}
            <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Menu Layanan</h3>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    <Link href="/ortu/anak" className="block group">
                        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-all sm:p-5 flex items-center gap-4 active:scale-[0.98]">
                            <div className="p-3 bg-blue-50 rounded-2xl group-hover:bg-blue-100 transition-all border border-blue-100 shadow-sm shadow-blue-500/10">
                                <TrendingUp className="h-6 w-6 text-blue-500" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-black text-slate-800 tracking-tight">Perkembangan Anak</h4>
                                <p className="text-[11px] text-slate-500 font-medium mt-0.5">Grafik Tumbuh Kembang & Berat Badan</p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                        </div>
                    </Link>

                    <Link href="/ortu/imunisasi" className="block group">
                        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-all sm:p-5 flex items-center gap-4 active:scale-[0.98]">
                            <div className="p-3 bg-amber-50 rounded-2xl group-hover:bg-amber-100 transition-all border border-amber-100 shadow-sm shadow-amber-500/10">
                                <Syringe className="h-6 w-6 text-amber-500" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-black text-slate-800 tracking-tight">Status Imunisasi</h4>
                                <p className="text-[11px] text-slate-500 font-medium mt-0.5">Cek kelengkapan vaksin si kecil</p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
                        </div>
                    </Link>

                    <Link href="/ortu/notifikasi" className="block group">
                        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-all sm:p-5 flex items-center gap-4 active:scale-[0.98]">
                            <div className="p-3 bg-orange-50 rounded-2xl group-hover:bg-orange-100 transition-all border border-orange-100 shadow-sm shadow-orange-500/10">
                                <Bell className="h-6 w-6 text-orange-500" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-black text-slate-800 tracking-tight">Pesan & Info</h4>
                                <p className="text-[11px] text-slate-500 font-medium mt-0.5">Riwayat pengingat & pesan sistem</p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                        </div>
                    </Link>

                    <div className="bg-slate-50/50 rounded-2xl p-4 border border-dashed border-slate-200 flex items-center gap-4 opacity-70 cursor-not-allowed">
                        <div className="p-3 bg-slate-100 rounded-2xl border border-slate-200">
                            <BookOpen className="h-6 w-6 text-slate-400" />
                        </div>
                        <div className="flex-1" >
                            <h4 className="text-sm font-black text-slate-500">Buku KIA Digital</h4>
                            <p className="text-[11px] text-slate-400 font-medium mt-0.5" >Fitur eksklusif akan segera hadir</p>
                        </div>
                        <div className="flex items-center gap-2" >
                            <span className="bg-slate-200 text-slate-500 text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-tighter" >
                                Locked
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Help & Tip Section */}
            <div className="bg-orange-50/50 border border-orange-100 rounded-[2rem] p-5 flex gap-4 mt-4 shadow-sm" >
                <div className="bg-white h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border border-orange-100 shadow-sm">
                    <div className="text-xl">💡</div>
                </div>
                <div className="space-y-1">
                    <p className="text-xs text-orange-900 leading-relaxed font-black uppercase tracking-widest">Tips Posyandu</p>
                    <p className="text-xs text-orange-800/80 leading-relaxed font-medium" >
                        Pastikan Bunda membawa Buku KIA setiap kunjungan. Data kesehatan anak akan otomatis sinkron ke aplikasi ini setelah ditimbang oleh Kader.
                    </p>
                </div>
            </div>
        </div>
    );
}

