'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import {
    BarChart3,
    TrendingUp,
    Users,
    Baby,
    Heart,
    MapPin,
    AlertCircle,
    Download,
    Calendar,
    ChevronRight,
    ArrowUpRight,
    ArrowDownRight,
    Loader2
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    AreaChart,
    Area,
    Cell
} from 'recharts';
import toast from 'react-hot-toast';

interface AnalyticsData {
    participationTrend: any[];
    posyanduPerformance: any[];
    populationGrowth: any[];
    summary: {
        avgParticipation: number;
        totalVisitsThisMonth: number;
        flaggedPosyandus: number;
        growthRate: number;
    };
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [period, setPeriod] = useState(6); // last 6 months
    const supabase = createClient();

    useEffect(() => {
        fetchAnalyticsData();
    }, [period]);

    const fetchAnalyticsData = async () => {
        setIsLoading(true);
        try {
            // 1. Fetch Basic Population
            const [balitaRes, lansiaRes, posyanduRes] = await Promise.all([
                supabase.from('balita').select('id, posyandu_id, created_at').eq('is_active', true),
                supabase.from('lansia').select('id, posyandu_id, created_at').eq('is_active', true),
                supabase.from('posyandu').select('id, nama').eq('is_active', true)
            ]);

            const posyandus = posyanduRes.data || [];
            const totalPop = (balitaRes.data?.length || 0) + (lansiaRes.data?.length || 0);

            // 2. Fetch Visits for the last X months
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - period);

            const [visitsBRes, visitsLRes] = await Promise.all([
                supabase.from('kunjungan_balita').select('id, posyandu_id, bulan, tahun, created_at').gte('created_at', startDate.toISOString()),
                supabase.from('kunjungan_lansia').select('id, posyandu_id, bulan, tahun, created_at').gte('created_at', startDate.toISOString())
            ]);

            const visitsB = visitsBRes.data || [];
            const visitsL = visitsLRes.data || [];
            const allVisits = [...visitsB, ...visitsL];

            // 3. Process Trends (Monthly)
            const months = [];
            for (let i = 0; i < period; i++) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                months.push({
                    month: d.getMonth() + 1,
                    year: d.getFullYear(),
                    label: d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })
                });
            }
            months.reverse();

            const participationTrend = months.map(m => {
                const monthVisits = allVisits.filter(v => v.bulan === m.month && v.tahun === m.year).length;
                return {
                    name: m.label,
                    visits: monthVisits,
                    rate: totalPop > 0 ? Math.round((monthVisits / totalPop) * 100) : 0
                };
            });

            // 4. Process Posyandu Performance (Last Month)
            const currentMonth = new Date().getMonth() + 1;
            const currentYear = new Date().getFullYear();

            const posyanduPerformance = posyandus.map(p => {
                const pPop = (balitaRes.data?.filter(b => b.posyandu_id === p.id).length || 0) +
                    (lansiaRes.data?.filter(l => l.posyandu_id === p.id).length || 0);
                const pVisits = allVisits.filter(v => v.posyandu_id === p.id && v.bulan === currentMonth && v.tahun === currentYear).length;

                return {
                    name: p.nama.replace('Posyandu ', ''),
                    rate: pPop > 0 ? Math.round((pVisits / pPop) * 100) : 0,
                    potential: pPop
                };
            }).sort((a, b) => b.rate - a.rate);

            // 5. Population Growth
            const populationGrowth = months.map(m => {
                const balitaAt = balitaRes.data?.filter(b => {
                    const d = new Date(b.created_at);
                    return d.getFullYear() < m.year || (d.getFullYear() === m.year && d.getMonth() + 1 <= m.month);
                }).length || 0;
                const lansiaAt = lansiaRes.data?.filter(l => {
                    const d = new Date(l.created_at);
                    return d.getFullYear() < m.year || (d.getFullYear() === m.year && d.getMonth() + 1 <= m.month);
                }).length || 0;

                return {
                    name: m.label,
                    balita: balitaAt,
                    lansia: lansiaAt,
                    total: balitaAt + lansiaAt
                };
            });

            // Summary
            const currentMonthStats = participationTrend[participationTrend.length - 1];
            const prevMonthStats = participationTrend.length > 1 ? participationTrend[participationTrend.length - 2] : null;
            const growthRate = (prevMonthStats && prevMonthStats.visits > 0)
                ? ((currentMonthStats.visits - prevMonthStats.visits) / prevMonthStats.visits) * 100
                : 0;

            setData({
                participationTrend,
                posyanduPerformance,
                populationGrowth,
                summary: {
                    avgParticipation: Math.round(participationTrend.reduce((acc, curr) => acc + curr.rate, 0) / participationTrend.length),
                    totalVisitsThisMonth: currentMonthStats.visits,
                    flaggedPosyandus: posyanduPerformance.filter(p => p.rate < 60).length,
                    growthRate: Math.round(growthRate)
                }
            });

        } catch (error) {
            console.error('Error fetching analytics:', error);
            toast.error('Gagal memuat data analitik');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 text-teal-600 animate-spin" />
                <p className="text-slate-500 font-medium italic animate-pulse">Menghimpun data masyarakat...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <BarChart3 className="h-6 w-6 text-teal-600" />
                        Analytics & Insights
                    </h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">Data partisipasi dan pertumbuhan layanan kesehatan</p>
                </div>
                <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                    {[3, 6, 12].map((m) => (
                        <button
                            key={m}
                            onClick={() => setPeriod(m)}
                            className={cn(
                                "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                                period === m
                                    ? "bg-teal-600 text-white shadow-md shadow-teal-500/20"
                                    : "text-slate-500 hover:bg-slate-50"
                            )}
                        >
                            {m} Bulan
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 bg-teal-600 text-white border-none shadow-lg shadow-teal-500/20">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Rata-rata Partisipasi</p>
                    <div className="flex items-end justify-between">
                        <h3 className="text-3xl font-black">{data?.summary.avgParticipation}%</h3>
                        <Users className="h-8 w-8 opacity-20" />
                    </div>
                </Card>

                <Card className="p-4 bg-white border-slate-200">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Kunjungan Bulan Ini</p>
                    <div className="flex items-end justify-between">
                        <div>
                            <h3 className="text-3xl font-black text-slate-800">{data?.summary.totalVisitsThisMonth}</h3>
                            <div className={cn(
                                "flex items-center gap-0.5 text-[10px] font-bold mt-1",
                                data!.summary.growthRate >= 0 ? "text-emerald-600" : "text-rose-600"
                            )}>
                                {data!.summary.growthRate >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                {Math.abs(data?.summary.growthRate || 0)}% vs bulan lalu
                            </div>
                        </div>
                        <TrendingUp className="h-8 w-8 text-slate-100" />
                    </div>
                </Card>

                <Card className="p-4 bg-white border-slate-200">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Perlu Atensi</p>
                    <div className="flex items-end justify-between">
                        <h3 className="text-3xl font-black text-slate-800">{data?.summary.flaggedPosyandus}</h3>
                        <AlertCircle className={cn("h-8 w-8", data!.summary.flaggedPosyandus > 0 ? "text-rose-500" : "text-slate-100")} />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Posyandu partisipasi {"<"} 60%</p>
                </Card>

                <Card className="p-4 bg-slate-900 border-slate-800 text-white">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Populasi Aktif</p>
                    <div className="flex items-end justify-between">
                        <h3 className="text-3xl font-black">{data?.populationGrowth[data.populationGrowth.length - 1].total}</h3>
                        <Users className="h-8 w-8 text-slate-800" />
                    </div>
                    <div className="flex gap-2 mt-1">
                        <span className="text-[9px] font-bold text-blue-400">B: {data?.populationGrowth[data.populationGrowth.length - 1].balita}</span>
                        <span className="text-[9px] font-bold text-rose-400">L: {data?.populationGrowth[data.populationGrowth.length - 1].lansia}</span>
                    </div>
                </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* 1. Trend Partisipasi */}
                <Card className="p-6 border-slate-200 shadow-sm bg-white">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-teal-600" />
                            Trend Tingkat Partisipasi (%)
                        </h2>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data?.participationTrend}>
                                <defs>
                                    <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }}
                                    domain={[0, 100]}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                                />
                                <Area type="monotone" dataKey="rate" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#colorRate)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* 2. Performance Per Posyandu */}
                <Card className="p-6 border-slate-200 shadow-sm bg-white">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-teal-600" />
                            Partisipasi Per Posyandu (%)
                        </h2>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data?.posyanduPerformance} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide domain={[0, 100]} />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    width={80}
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#475569' }}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                                />
                                <Bar
                                    dataKey="rate"
                                    radius={[0, 10, 10, 0]}
                                    barSize={20}
                                >
                                    {data?.posyanduPerformance.map((entry, index) => (
                                        <Area key={`cell-${index}`} fill={entry.rate < 60 ? '#f43f5e' : '#0d9488'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* 3. Populasi Growth */}
                <Card className="p-6 lg:col-span-2 border-slate-200 shadow-sm bg-white">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                            <Users className="h-4 w-4 text-teal-600" />
                            Pertumbuhan Populasi Terdaftar
                        </h2>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data?.populationGrowth}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                                />
                                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
                                <Bar dataKey="balita" name="Balita" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="lansia" name="Lansia" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

            </div>

            {/* Actionable Insights Section */}
            <div className="space-y-4">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest pl-1">Actionable Insights</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data?.posyanduPerformance.filter(p => p.rate < 60).map(p => (
                        <Card key={p.name} className="p-4 border-rose-100 bg-rose-50/30 flex items-start gap-4">
                            <div className="p-2 bg-rose-100 rounded-lg text-rose-600">
                                <AlertCircle className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-800">Partisipasi Rendah: Posyandu {p.name}</h4>
                                <p className="text-xs text-slate-500 mt-1">
                                    Hanya <span className="font-bold text-rose-600">{p.rate}%</span> dari total {p.potential} anggota yang hadir bulan ini.
                                </p>
                                <div className="flex items-center gap-2 mt-3">
                                    <Button size="sm" variant="outline" className="text-[10px] bg-white h-7 px-3">
                                        Lihat Daftar Absen
                                    </Button>
                                    <Button size="sm" className="text-[10px] bg-rose-600 hover:bg-rose-700 h-7 px-3">
                                        Kirim Blast Pengingat
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}

                    {data?.summary.growthRate > 10 && (
                        <Card className="p-4 border-emerald-100 bg-emerald-50/30 flex items-start gap-4">
                            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-800">Lonjakan Aktivitas Layanan</h4>
                                <p className="text-xs text-slate-500 mt-1">
                                    Ada peningkatan kunjungan sebesar <span className="font-bold text-emerald-600">{data.summary.growthRate}%</span> dibanding bulan lalu. Pastikan stok vaksin dan tim kader memadai.
                                </p>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
