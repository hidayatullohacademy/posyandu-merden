'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import {
    Baby,
    Users,
    Activity,
    Syringe,
    Bell,
    UserCircle,
} from 'lucide-react';
import Link from 'next/link';
import { UpcomingSchedule } from '@/components/kader/UpcomingSchedule';
import { HealthAlerts } from '@/components/kader/HealthAlerts';

interface Stats {
    balitaCount: number;
    lansiaCount: number;
    posyanduName: string;
    posyanduOpening: string;
    posyanduId: string;
}

export default function KaderDashboard() {
    const [userName, setUserName] = useState<string>('Kader');
    const [stats, setStats] = useState<Stats>({
        balitaCount: 0,
        lansiaCount: 0,
        posyanduName: 'Posyandu ...',
        posyanduOpening: '...',
        posyanduId: '',
    });
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true);
            try {
                // 1. Get current user
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: userData } = await supabase
                        .from('users')
                        .select('nama_lengkap, posyandu_id')
                        .eq('id', user.id)
                        .single();

                    if (userData) {
                        setUserName(userData.nama_lengkap);

                        // 2. Fetch stats & posyandu details
                        const [balitaRes, lansiaRes, posRes] = await Promise.all([
                            supabase.from('balita').select('*', { count: 'exact', head: true }).eq('posyandu_id', userData.posyandu_id).eq('is_active', true),
                            supabase.from('lansia').select('*', { count: 'exact', head: true }).eq('posyandu_id', userData.posyandu_id).eq('is_active', true),
                            supabase.from('posyandu').select('nama, hari_buka, jam_buka, jam_tutup').eq('id', userData.posyandu_id).single(),
                        ]);

                        setStats({
                            balitaCount: balitaRes.count || 0,
                            lansiaCount: lansiaRes.count || 0,
                            posyanduName: posRes.data?.nama || 'Posyandu',
                            posyanduOpening: posRes.data ? `${posRes.data.hari_buka} (${posRes.data.jam_buka.slice(0, 5)}-${posRes.data.jam_tutup.slice(0, 5)})` : '...',
                            posyanduId: userData.posyandu_id,
                        });
                    }
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, [supabase]);

    return (
        <div className="space-y-6 pb-20 animate-fade-in">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                        {isLoading ? '...' : stats.posyanduName}
                    </h1>
                    <p className="text-teal-600 font-bold text-xs uppercase tracking-widest flex items-center gap-1.5 mt-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
                        Jadwal: {stats.posyanduOpening}
                    </p>
                </div>
                <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                    <div className="h-10 w-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center border border-teal-100">
                        <UserCircle className="h-6 w-6" />
                    </div>
                    <div className="pr-4">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-1">Status Anda</p>
                        <h2 className="text-sm font-bold text-slate-800 leading-none">{isLoading ? '...' : userName}</h2>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="relative overflow-hidden group">
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-xl shadow-slate-200 min-h-[180px] transition-all duration-300">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                            <Activity className="h-24 w-24" />
                        </div>
                        <div className="relative z-10">
                            <div className="bg-white/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md border border-white/20">
                                <Activity className="h-6 w-6 text-emerald-400" />
                            </div>
                            <p className="text-slate-400 font-medium text-sm">Status Posyandu</p>
                            <h3 className="text-xl font-bold mt-1">Aktif & Terintegrasi</h3>
                            <div className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-400/10 w-fit px-3 py-1.5 rounded-full border border-emerald-400/20">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                Desa Merden Terintegrasi
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-6">
                        <div className="bg-blue-50 p-3 rounded-2xl group-hover:bg-blue-100 transition-colors">
                            <Baby className="h-6 w-6 text-blue-500" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2.5 py-1 rounded-full">Data Balita</span>
                    </div>
                    <p className="text-sm font-medium text-slate-500">Total Balita Terdaftar</p>
                    <div className="flex items-end gap-3 mt-1">
                        <h3 className="text-3xl font-black text-slate-900">{isLoading ? '...' : stats.balitaCount}</h3>
                        {!isLoading && stats.balitaCount > 0 && (
                            <p className="text-xs font-bold text-emerald-500 mb-1.5 flex items-center">Aktif</p>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-6">
                        <div className="bg-rose-50 p-3 rounded-2xl group-hover:bg-rose-100 transition-colors">
                            <Users className="h-6 w-6 text-rose-500" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2.5 py-1 rounded-full">Data Lansia</span>
                    </div>
                    <p className="text-sm font-medium text-slate-500">Total Lansia Terdaftar</p>
                    <div className="flex items-end gap-3 mt-1">
                        <h3 className="text-3xl font-black text-slate-900">{isLoading ? '...' : stats.lansiaCount}</h3>
                        {!isLoading && stats.lansiaCount > 0 && (
                            <p className="text-xs font-bold text-emerald-500 mb-1.5 flex items-center">Aktif</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Proactive Expert Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <UpcomingSchedule posyanduId={stats.posyanduId} />
                <HealthAlerts posyanduId={stats.posyanduId} />
            </div>

            {/* Main Action Grid */}
            <div className="pt-2">
                <div className="flex items-center justify-between mb-4 px-1">
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Menu Layanan</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <Link href="/kader/balita" className="group">
                        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                            <div className="h-14 w-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-sm border border-blue-100/50">
                                <Baby className="h-7 w-7 text-blue-600" />
                            </div>
                            <h3 className="text-sm font-black text-slate-900 tracking-tight">Database Balita</h3>
                            <p className="text-[11px] font-medium text-slate-500 mt-1 leading-relaxed">Kelola pendaftaran & biodata balita desa</p>
                        </div>
                    </Link>

                    <Link href="/kader/lansia" className="group">
                        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                            <div className="h-14 w-14 bg-rose-50 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-sm border border-rose-100/50">
                                <Users className="h-7 w-7 text-rose-600" />
                            </div>
                            <h3 className="text-sm font-black text-slate-900 tracking-tight">Database Lansia</h3>
                            <p className="text-[11px] font-medium text-slate-500 mt-1 leading-relaxed">Kelola pendaftaran & biodata lansia desa</p>
                        </div>
                    </Link>

                    <Link href="/kader/balita" className="group">
                        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                            <div className="h-14 w-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-sm border border-emerald-100/50">
                                <Activity className="h-7 w-7 text-emerald-600" />
                            </div>
                            <h3 className="text-sm font-black text-slate-900 tracking-tight">Pemeriksaan</h3>
                            <p className="text-[11px] font-medium text-slate-500 mt-1 leading-relaxed">Input timbang, ukur & kesehatan berkala</p>
                        </div>
                    </Link>

                    <Link href="/kader/imunisasi" className="group">
                        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                            <div className="h-14 w-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-sm border border-amber-100/50">
                                <Syringe className="h-7 w-7 text-amber-600" />
                            </div>
                            <h3 className="text-sm font-black text-slate-900 tracking-tight">Vaksinasi</h3>
                            <p className="text-[11px] font-medium text-slate-500 mt-1 leading-relaxed">Monitor jadwal & riwayat imunisasi balita</p>
                        </div>
                    </Link>

                    <Link href="/kader/notifikasi" className="group">
                        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                            <div className="h-14 w-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-sm border border-indigo-100/50">
                                <Bell className="h-7 w-7 text-indigo-600" />
                            </div>
                            <h3 className="text-sm font-black text-slate-900 tracking-tight">Pesan Sistem</h3>
                            <p className="text-[11px] font-medium text-slate-500 mt-1 leading-relaxed">Pemberitahuan & pengingat dari puskesmas</p>
                        </div>
                    </Link>

                    <Link href="/kader/ortu" className="group">
                        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                            <div className="h-14 w-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-sm border border-slate-200/50">
                                <Users className="h-7 w-7 text-slate-600" />
                            </div>
                            <h3 className="text-sm font-black text-slate-900 tracking-tight">Data Orang Tua</h3>
                            <p className="text-[11px] font-medium text-slate-500 mt-1 leading-relaxed">Kelola informasi kontak orang tua/wali</p>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Help & Support */}
            <div className="pb-12">
                <div className="bg-teal-600 rounded-[2rem] p-8 text-white relative overflow-hidden flex flex-col justify-center shadow-lg shadow-teal-100">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Bell className="h-32 w-32" />
                    </div>
                    <div className="relative z-10 max-w-lg">
                        <h3 className="text-xl font-bold mb-2">Butuh Bantuan?</h3>
                        <p className="text-teal-50 font-medium text-sm leading-relaxed mb-6">Jika Anda mengalami kendala saat menginput data atau penggunaan aplikasi, hubungi admin desa.</p>
                        <button className="bg-white text-teal-600 px-6 py-2.5 rounded-2xl text-xs font-bold hover:bg-teal-50 transition-colors shadow-sm uppercase tracking-wider">Hubungi Admin</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
