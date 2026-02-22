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
    MessageSquare,
} from 'lucide-react';
import BroadcastModal from '@/components/admin/BroadcastModal';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalBalita: 0,
        totalLansia: 0,
        totalKader: 0,
        totalKunjungan: 0
    });
    const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
    const [healthAlerts, setHealthAlerts] = useState<{
        id: string;
        name: string;
        type: 'BALITA' | 'LANSIA';
        issue: string;
        date: string;
    }[]>([]);
    const [activities, setActivities] = useState<{
        id: string;
        type: 'KUNJUNGAN_BALITA' | 'KUNJUNGAN_LANSIA';
        name: string;
        description: string;
        time: string;
    }[]>([]);
    const [participationData, setParticipationData] = useState<any[]>([]);
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

                // Fetch Health Alerts (Balita - Gizi)
                const { data: balitaAlerts } = await supabase
                    .from('kunjungan_balita')
                    .select('id, created_at, status_gizi, balita:balita_id(nama)')
                    .in('status_gizi', ['KURANG', 'BURUK'])
                    .order('created_at', { ascending: false })
                    .limit(5);

                // Fetch Health Alerts (Lansia - Tensi/Gula/Rujukan)
                const { data: lansiaAlerts } = await supabase
                    .from('kunjungan_lansia')
                    .select('id, created_at, sistolik, diastolik, gula_darah, perlu_rujukan, lansia:lansia_id(nama_lengkap)')
                    .or('sistolik.gte.140,diastolik.gte.90,gula_darah.gte.200,perlu_rujukan.eq.true')
                    .order('created_at', { ascending: false })
                    .limit(5);

                const alerts: any[] = [];
                balitaAlerts?.forEach((a: any) => {
                    alerts.push({
                        id: a.id,
                        name: a.balita?.nama || 'Anonim',
                        type: 'BALITA',
                        issue: `Gizi ${a.status_gizi?.toLowerCase()}`,
                        date: new Date(a.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                    });
                });
                lansiaAlerts?.forEach((a: any) => {
                    let issues = [];
                    if (a.sistolik >= 140 || a.diastolik >= 90) issues.push('Hipertensi');
                    if (a.gula_darah >= 200) issues.push('Gula Darah Tinggi');
                    if (a.perlu_rujukan) issues.push('Perlu Rujukan');

                    alerts.push({
                        id: a.id,
                        name: a.lansia?.nama_lengkap || 'Anonim',
                        type: 'LANSIA',
                        issue: issues.join(', ') || 'Kondisi Risiko',
                        date: new Date(a.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                    });
                });
                setHealthAlerts(alerts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5));

                // Fetch Recent Activities
                const [recentKB, recentKL] = await Promise.all([
                    supabase.from('kunjungan_balita').select('id, created_at, balita:balita_id(nama)').order('created_at', { ascending: false }).limit(3),
                    supabase.from('kunjungan_lansia').select('id, created_at, lansia:lansia_id(nama_lengkap)').order('created_at', { ascending: false }).limit(3)
                ]);

                const combinedActivities: any[] = [];
                recentKB.data?.forEach((r: any) => {
                    combinedActivities.push({
                        id: r.id,
                        type: 'KUNJUNGAN_BALITA',
                        name: r.balita?.nama,
                        description: 'Pemeriksaan Balita',
                        time: r.created_at
                    });
                });
                recentKL.data?.forEach((r: any) => {
                    combinedActivities.push({
                        id: r.id,
                        type: 'KUNJUNGAN_LANSIA',
                        name: r.lansia?.nama_lengkap,
                        description: 'Pemeriksaan Lansia',
                        time: r.created_at
                    });
                });
                setActivities(combinedActivities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5));

                // Fetch Participation Data for Chart
                const now = new Date();
                const currentMonth = now.getMonth() + 1;
                const currentYear = now.getFullYear();

                const [posyandus, allBalita, allLansia, currentVisitsB, currentVisitsL] = await Promise.all([
                    supabase.from('posyandu').select('id, nama').eq('is_active', true).order('nama'),
                    supabase.from('balita').select('id, posyandu_id').eq('is_active', true),
                    supabase.from('lansia').select('id, posyandu_id').eq('is_active', true),
                    supabase.from('kunjungan_balita').select('posyandu_id').eq('bulan', currentMonth).eq('tahun', currentYear),
                    supabase.from('kunjungan_lansia').select('posyandu_id').eq('bulan', currentMonth).eq('tahun', currentYear),
                ]);

                const chartData = posyandus.data?.map(p => {
                    const pPop = (allBalita.data?.filter(b => b.posyandu_id === p.id).length || 0) +
                        (allLansia.data?.filter(l => l.posyandu_id === p.id).length || 0);
                    const pVisits = (currentVisitsB.data?.filter(v => v.posyandu_id === p.id).length || 0) +
                        (currentVisitsL.data?.filter(v => v.posyandu_id === p.id).length || 0);

                    return {
                        name: p.nama.replace('Posyandu ', ''),
                        rate: pPop > 0 ? Math.round((pVisits / pPop) * 100) : 0,
                    };
                }) || [];
                setParticipationData(chartData);

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

                        <div className="bg-white">
                            {healthAlerts.length > 0 ? (
                                <div className="divide-y divide-slate-50">
                                    {healthAlerts.map((alert) => (
                                        <div key={alert.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-2 h-2 rounded-full",
                                                    alert.type === 'BALITA' ? "bg-amber-500" : "bg-rose-500"
                                                )} />
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">{alert.name}</p>
                                                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-tight">
                                                        {alert.type} • <span className="text-rose-600">{alert.issue}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-slate-400">{alert.date}</p>
                                                <Link href={alert.type === 'BALITA' ? `/admin/balita` : `/admin/lansia`} className="text-[10px] font-bold text-teal-600 hover:underline">Detail</Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 text-center">
                                    <CheckCircle2 className="h-10 w-10 text-teal-100 mx-auto mb-3" />
                                    <p className="text-sm text-slate-400 font-medium">Semua data kesehatan dalam batas normal.</p>
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card className="p-5 border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-50">
                            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-teal-500" /> Cakupan Layanan (%)
                            </h2>
                            <Link href="/admin/analytics" className="text-[10px] font-bold text-teal-600 hover:underline">Lihat Detail</Link>
                        </div>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={participationData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }}
                                        domain={[0, 100]}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px' }}
                                    />
                                    <Bar dataKey="rate" radius={[4, 4, 0, 0]} barSize={32}>
                                        {participationData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.rate < 60 ? '#f43f5e' : '#0d9488'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-4 italic font-medium">Data partisipasi masyarakat bulan ini.</p>
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
                        <div className="bg-white">
                            {activities.length > 0 ? (
                                <div className="divide-y divide-slate-50">
                                    {activities.map((activity) => (
                                        <div key={activity.id} className="p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors">
                                            <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-white">
                                                {activity.type === 'KUNJUNGAN_BALITA' ? <Baby className="h-3.5 w-3.5 text-blue-500" /> : <Heart className="h-3.5 w-3.5 text-rose-500" />}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[11px] font-bold text-slate-800 leading-tight">{activity.name}</p>
                                                <p className="text-[10px] font-medium text-slate-400">{activity.description}</p>
                                            </div>
                                            <span className="text-[9px] font-bold text-slate-300 uppercase">
                                                {new Date(activity.time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-10 text-center">
                                    <Bell className="h-10 w-10 text-slate-100 mx-auto mb-3" />
                                    <p className="text-sm text-slate-400 font-medium">Belum ada pesan sistem baru.</p>
                                </div>
                            )}
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

                    <Card className="p-5 border-slate-200 shadow-sm bg-teal-50/30 border-dashed border-2 border-teal-200">
                        <div className="text-center py-2">
                            <div className="w-10 h-10 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                                <MessageSquare className="h-5 w-5" />
                            </div>
                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Broadcast Pengingat</h3>
                            <p className="text-[10px] text-slate-500 font-medium mb-4 leading-relaxed">
                                Kirim pengingat jadwal posyandu ke seluruh orang tua melalui WhatsApp.
                            </p>
                            <Button
                                onClick={() => setIsBroadcastOpen(true)}
                                className="w-full bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-black tracking-widest h-10 rounded-xl"
                            >
                                MULAI BROADCAST
                            </Button>
                        </div>
                    </Card>
                </div>

            </div>

            {/* Modals */}
            <BroadcastModal
                isOpen={isBroadcastOpen}
                onClose={() => setIsBroadcastOpen(false)}
            />
        </div>
    );
}
