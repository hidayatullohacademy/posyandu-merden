'use client';

import { useState, useEffect } from 'react';
import {
    Baby,
    Heart,
    Users,
    TrendingUp,
    AlertTriangle,
    Bell,
    CheckCircle2,
    Download,
    Clock,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalBalita: 0,
        totalLansia: 0,
        totalKader: 0,
        totalKunjungan: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchStats = async () => {
            setIsLoading(true);
            try {
                const [balitaCount, lansiaCount, kaderCount, kunjunganBalitaCount, kunjunganLansiaCount] = await Promise.all([
                    supabase.from('balita').select('*', { count: 'exact', head: true }),
                    supabase.from('lansia').select('*', { count: 'exact', head: true }),
                    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'KADER'),
                    supabase.from('kunjungan_balita').select('*', { count: 'exact', head: true }),
                    supabase.from('kunjungan_lansia').select('*', { count: 'exact', head: true }),
                ]);

                setStats({
                    totalBalita: balitaCount.count || 0,
                    totalLansia: lansiaCount.count || 0,
                    totalKader: kaderCount.count || 0,
                    totalKunjungan: (kunjunganBalitaCount.count || 0) + (kunjunganLansiaCount.count || 0)
                });
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, [supabase]);

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Dashboard Admin Desa Merden</h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">
                        Monitoring Real-time Operasional Posyandu ILP
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 h-10 px-4 rounded-xl shadow-sm">
                        <Clock className="h-4 w-4 mr-2 text-slate-400" />
                        Pilih Periode
                    </Button>
                    <Link href="/admin/laporan">
                        <Button className="bg-teal-600 hover:bg-teal-700 text-white h-10 px-4 rounded-xl shadow-sm shadow-teal-500/20">
                            <Download className="h-4 w-4 mr-2" />
                            Export Laporan
                        </Button>
                    </Link>
                </div>
            </div>

            {/* High-Contrast Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-5 border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Balita</p>
                            <h3 className="text-3xl font-black text-slate-800">
                                {isLoading ? '...' : stats.totalBalita}
                            </h3>
                            <div className="flex items-center gap-1 mt-2">
                                <span className="text-[10px] text-slate-400 font-medium lowercase italic">Total terdaftar di sistem</span>
                            </div>
                        </div>
                        <div className="p-2.5 bg-blue-50/80 rounded-xl text-blue-600">
                            <Baby className="h-5 w-5" />
                        </div>
                    </div>
                </Card>

                <Card className="p-5 border-l-4 border-l-rose-500 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Lansia</p>
                            <h3 className="text-3xl font-black text-slate-800">
                                {isLoading ? '...' : stats.totalLansia}
                            </h3>
                            <div className="flex items-center gap-1 mt-2">
                                <span className="text-[10px] text-slate-400 font-medium lowercase italic">Total terdaftar di sistem</span>
                            </div>
                        </div>
                        <div className="p-2.5 bg-rose-50/80 rounded-xl text-rose-600">
                            <Heart className="h-5 w-5" />
                        </div>
                    </div>
                </Card>

                <Card className="p-5 border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Kader Aktif</p>
                            <h3 className="text-3xl font-black text-slate-800">
                                {isLoading ? '...' : stats.totalKader}
                            </h3>
                            <div className="flex items-center gap-1 mt-2">
                                <span className="text-[10px] text-slate-400 font-medium lowercase italic">Petugas lapangan aktif</span>
                            </div>
                        </div>
                        <div className="p-2.5 bg-purple-50/80 rounded-xl text-purple-600">
                            <Users className="h-5 w-5" />
                        </div>
                    </div>
                </Card>

                <Card className="p-5 border-l-4 border-l-teal-500 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Kunjungan</p>
                            <h3 className="text-3xl font-black text-slate-800">
                                {isLoading ? '...' : stats.totalKunjungan}
                            </h3>
                            <div className="flex items-center gap-1 mt-2">
                                <span className="text-[10px] text-slate-400 font-medium lowercase italic">Riwayat pemeriksaan rill</span>
                            </div>
                        </div>
                        <div className="p-2.5 bg-teal-50/80 rounded-xl text-teal-600">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Main Content Area - Density Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column (Wider) - Perlu Perhatian */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="overflow-hidden border-slate-200 shadow-sm">
                        <div className="bg-slate-50/80 border-b border-slate-100 p-5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 rounded-lg">
                                    <AlertTriangle className="h-4 w-4 text-slate-400" />
                                </div>
                                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Peringatan Kesehatan</h2>
                            </div>
                            <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-full">Sistem Monitoring</span>
                        </div>

                        <div className="p-12 text-center bg-white">
                            <CheckCircle2 className="h-10 w-10 text-teal-100 mx-auto mb-3" />
                            <p className="text-sm text-slate-400 font-medium">Semua data kesehatan dalam batas normal atau belum ada rujukan masuk.</p>
                        </div>
                    </Card>

                    <Card className="p-5 border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
                            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-teal-500" /> Ringkasan Aktivitas
                            </h2>
                        </div>
                        <div className="p-12 text-center">
                            <CheckCircle2 className="h-10 w-10 text-slate-100 mx-auto mb-3" />
                            <p className="text-sm text-slate-400 font-medium">Semua data operasional terpusat dan aman.</p>
                        </div>
                    </Card>
                </div>

                {/* Right Column (Narrower) */}
                <div className="space-y-6">
                    <Card className="p-5 border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                                <Bell className="h-4 w-4 text-slate-400" /> Pusat Notifikasi
                            </h2>
                        </div>
                        <div className="py-10 text-center">
                            <Bell className="h-10 w-10 text-slate-100 mx-auto mb-3" />
                            <p className="text-sm text-slate-400 font-medium">Belum ada pesan sistem baru.</p>
                        </div>
                    </Card>

                    <Card className="p-6 bg-slate-900 border-slate-800 text-white shadow-lg overflow-hidden relative">
                        {/* Decorative element */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10" />

                        <div className="relative z-10 text-center py-4">
                            <h2 className="text-sm font-bold text-teal-400 uppercase tracking-wide mb-3 flex items-center gap-2 justify-center">
                                <TrendingUp className="h-4 w-4" /> Kinerja Layanan
                            </h2>
                            <p className="text-xs text-slate-300 leading-relaxed font-medium mb-6">
                                Pantau perkembangan kesehatan masyarakat Desa Merden melalui data statistik yang terhimpun.
                            </p>
                            <Link href="/admin/laporan" className="inline-flex items-center justify-center w-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-3 rounded-xl border border-white/10 transition-colors shadow-sm">
                                Buka Laporan Lengkap
                            </Link>
                        </div>
                    </Card>
                </div>

            </div>
        </div>
    );
}
