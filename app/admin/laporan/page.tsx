'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { FileText, Download, TrendingUp, BarChart3, Baby, Heart } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn, namaBulan } from '@/lib/utils';
import { logAudit } from '@/lib/audit';
import toast from 'react-hot-toast';

type ReportType = 'balita' | 'lansia' | 'rekapitulasi';


interface PosyanduItem {
    id: string;
    nama: string;
}

interface TrendItem {
    month: string;
    balita: number;
    lansia: number;
}

export default function AdminLaporanPage() {
    const now = new Date();
    const [periode, setPeriode] = useState(now.toISOString().slice(0, 7));
    const bulan = parseInt(periode.split('-')[1]);
    const tahun = parseInt(periode.split('-')[0]);
    const [reportType, setReportType] = useState<ReportType>('balita');
    const [isGenerating, setIsGenerating] = useState(false);
    const [stats, setStats] = useState({
        totalBalita: 0,
        totalLansia: 0,
        kunjunganBalita: 0,
        kunjunganLansia: 0,
    });
    const [posyanduList, setPosyanduList] = useState<PosyanduItem[]>([]);
    const [selectedPosyanduId, setSelectedPosyanduId] = useState<string>('ALL');
    const [isLoadingStats, setIsLoadingStats] = useState(false);
    const [trendData, setTrendData] = useState<TrendItem[]>([]);
    const [isLoadingTrend, setIsLoadingTrend] = useState(false);
    const supabase = createClient();

    const loadStats = useCallback(async () => {
        setIsLoadingStats(true);
        try {
            let balitaQuery = supabase.from('balita').select('id', { count: 'exact', head: true }).eq('is_active', true);
            let lansiaQuery = supabase.from('lansia').select('id', { count: 'exact', head: true }).eq('is_active', true);
            let kbQuery = supabase.from('kunjungan_balita').select('id', { count: 'exact', head: true }).eq('bulan', bulan).eq('tahun', tahun);
            let klQuery = supabase.from('kunjungan_lansia').select('id', { count: 'exact', head: true }).eq('bulan', bulan).eq('tahun', tahun);

            if (selectedPosyanduId !== 'ALL') {
                balitaQuery = balitaQuery.eq('posyandu_id', selectedPosyanduId);
                lansiaQuery = lansiaQuery.eq('posyandu_id', selectedPosyanduId);
                kbQuery = kbQuery.eq('posyandu_id', selectedPosyanduId);
                klQuery = klQuery.eq('posyandu_id', selectedPosyanduId);
            }

            const [balitaRes, lansiaRes, kbRes, klRes] = await Promise.all([
                balitaQuery,
                lansiaQuery,
                kbQuery,
                klQuery,
            ]);

            setStats({
                totalBalita: balitaRes.count || 0,
                totalLansia: lansiaRes.count || 0,
                kunjunganBalita: kbRes.count || 0,
                kunjunganLansia: klRes.count || 0,
            });
        } catch {
            toast.error('Gagal memuat statistik');
        } finally {
            setIsLoadingStats(false);
        }
    }, [bulan, tahun, selectedPosyanduId, supabase]);

    const loadTrendData = useCallback(async () => {
        setIsLoadingTrend(true);
        try {
            const months = [];
            for (let i = 5; i >= 0; i--) {
                const d = new Date();
                d.setDate(1); // Avoid month skipping
                d.setMonth(d.getMonth() - i);
                months.push({
                    bulan: d.getMonth() + 1,
                    tahun: d.getFullYear(),
                    label: namaBulan(d.getMonth() + 1).slice(0, 3)
                });
            }

            const trendResults = await Promise.all(months.map(async (m) => {
                let kbQuery = supabase.from('kunjungan_balita').select('id', { count: 'exact', head: true }).eq('bulan', m.bulan).eq('tahun', m.tahun);
                let klQuery = supabase.from('kunjungan_lansia').select('id', { count: 'exact', head: true }).eq('bulan', m.bulan).eq('tahun', m.tahun);

                if (selectedPosyanduId !== 'ALL') {
                    kbQuery = kbQuery.eq('posyandu_id', selectedPosyanduId);
                    klQuery = klQuery.eq('posyandu_id', selectedPosyanduId);
                }

                const [kbRes, klRes] = await Promise.all([kbQuery, klQuery]);
                return {
                    month: m.label,
                    balita: kbRes.count || 0,
                    lansia: klRes.count || 0
                };
            }));

            setTrendData(trendResults);
        } catch {
            toast.error('Gagal memuat tren data');
        } finally {
            setIsLoadingTrend(false);
        }
    }, [selectedPosyanduId, supabase]);

    const fetchPosyandu = useCallback(async () => {
        try {
            const { data } = await supabase.from('posyandu').select('id, nama').eq('is_active', true);
            if (data) {
                const sortedData = [...data].sort((a, b) =>
                    a.nama.localeCompare(b.nama, undefined, { numeric: true, sensitivity: 'base' })
                );
                setPosyanduList(sortedData);
            }
        } catch (error) {
            console.error('Error fetching posyandu:', error);
        }
    }, [supabase]);

    useEffect(() => {
        fetchPosyandu();
    }, [fetchPosyandu]);

    // Auto load stats when month/year/posyandu changes
    useEffect(() => {
        loadStats();
        loadTrendData();
    }, [loadStats, loadTrendData]);

    const handleExport = async () => {
        setIsGenerating(true);
        try {
            // Dynamic import to keep bundle small
            const xlsx = await import('xlsx');

            let data: Record<string, unknown>[] = [];
            let filename = '';

            if (reportType === 'balita') {
                let query = supabase
                    .from('kunjungan_balita')
                    .select('*, balita:balita_id(nama, nama_ibu, jenis_kelamin, tanggal_lahir)')
                    .eq('bulan', bulan)
                    .eq('tahun', tahun);

                if (selectedPosyanduId !== 'ALL') {
                    query = query.eq('posyandu_id', selectedPosyanduId);
                }

                const { data: kunjunganData, error } = await query.order('created_at');

                if (error) throw error;

                data = (kunjunganData || []).map((k: any, i: number) => ({
                    'No': i + 1,
                    'Nama': (k.balita as { nama: string })?.nama || '',
                    'Nama Ibu': (k.balita as { nama_ibu: string })?.nama_ibu || '',
                    'JK': (k.balita as { jenis_kelamin: string })?.jenis_kelamin || '',
                    'BB (kg)': k.berat_badan,
                    'TB (cm)': k.tinggi_badan,
                    'LK (cm)': k.lingkar_kepala ?? '',
                    'LiLA (cm)': k.lingkar_lengan ?? '',
                    'Vitamin A': k.vitamin_a ? 'Ya' : 'Tidak',
                    'Obat Cacing': k.obat_cacing ? 'Ya' : 'Tidak',
                    'Status Gizi': k.status_gizi || '',
                    'Catatan': k.catatan || '',
                }));

                filename = `Laporan_Balita_${namaBulan(bulan)}_${tahun}.xlsx`;
            } else if (reportType === 'lansia') {
                let query = supabase
                    .from('kunjungan_lansia')
                    .select('*, lansia:lansia_id(nama_lengkap, jenis_kelamin, tanggal_lahir, alamat)')
                    .eq('bulan', bulan)
                    .eq('tahun', tahun);

                if (selectedPosyanduId !== 'ALL') {
                    query = query.eq('posyandu_id', selectedPosyanduId);
                }

                const { data: kunjunganData, error } = await query.order('created_at');

                if (error) throw error;

                data = (kunjunganData || []).map((k: any, i: number) => ({
                    'No': i + 1,
                    'Nama': (k.lansia as { nama_lengkap: string })?.nama_lengkap || '',
                    'JK': (k.lansia as { jenis_kelamin: string })?.jenis_kelamin || '',
                    'BB (kg)': k.berat_badan,
                    'TB (cm)': k.tinggi_badan,
                    'IMT': k.imt ?? '',
                    'Sistolik': k.sistolik ?? '',
                    'Diastolik': k.diastolik ?? '',
                    'GDS': k.gula_darah ?? '',
                    'Kolesterol': k.kolesterol ?? '',
                    'Asam Urat': k.asam_urat ?? '',
                    'Perlu Rujukan': k.perlu_rujukan ? 'Ya' : 'Tidak',
                    'Keluhan': k.keluhan || '',
                    'Catatan': k.catatan || '',
                }));

                filename = `Laporan_Lansia_${namaBulan(bulan)}_${tahun}.xlsx`;
            } else {
                // Rekapitulasi
                await loadStats();
                data = [
                    { 'Item': 'Total Balita Aktif', 'Jumlah': stats.totalBalita },
                    { 'Item': 'Total Lansia Aktif', 'Jumlah': stats.totalLansia },
                    { 'Item': `Kunjungan Balita — ${namaBulan(bulan)} ${tahun} `, 'Jumlah': stats.kunjunganBalita },
                    { 'Item': `Kunjungan Lansia — ${namaBulan(bulan)} ${tahun} `, 'Jumlah': stats.kunjunganLansia },
                ];
                filename = `Rekapitulasi_${namaBulan(bulan)}_${tahun}.xlsx`;
            }

            if (data.length === 0) {
                toast.error('Tidak ada data untuk periode ini');
                return;
            }

            const ws = xlsx.utils.json_to_sheet(data);
            const wb = xlsx.utils.book_new();
            xlsx.utils.book_append_sheet(wb, ws, 'Laporan');
            xlsx.writeFile(wb, filename);

            await logAudit({
                action: 'EXPORT',
                entityType: 'LAPORAN',
                details: { filename, reportType, posyandu: selectedPosyanduId }
            });

            toast.success(`Laporan berhasil diunduh: ${filename} `);
        } catch {
            toast.error('Gagal mengunduh laporan');
        } finally {
            setIsGenerating(false);
        }
    };

    // Calculate percentages for basic chart visualization
    const balitaPercentage = stats.totalBalita > 0 ? Math.min(100, Math.round((stats.kunjunganBalita / stats.totalBalita) * 100)) : 0;
    const lansiaPercentage = stats.totalLansia > 0 ? Math.min(100, Math.round((stats.kunjunganLansia / stats.totalLansia) * 100)) : 0;

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Laporan & Analitik</h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">
                        Pantau kinerja Posyandu dan unduh rekapitulasi data bulanan.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column - Analytics (Density Layout) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                        <Card className="p-5 border-l-4 border-l-blue-500 hover:shadow-md transition-all">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Balita Terdaftar</p>
                                    <h3 className="text-3xl font-black text-slate-800">
                                        {isLoadingStats ? '...' : stats.totalBalita}
                                    </h3>
                                </div>
                                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                                    <Baby className="h-5 w-5" />
                                </div>
                            </div>
                        </Card>

                        <Card className="p-5 border-l-4 border-l-rose-500 hover:shadow-md transition-all">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Lansia Terdaftar</p>
                                    <h3 className="text-3xl font-black text-slate-800">
                                        {isLoadingStats ? '...' : stats.totalLansia}
                                    </h3>
                                </div>
                                <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                                    <Heart className="h-5 w-5" />
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Chart Card */}
                    <Card className="p-6 border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                                <BarChart3 className="h-4 w-4 text-teal-500" /> Analisis Kunjungan ({namaBulan(bulan)} {tahun})
                            </h2>
                            <span className="text-xs font-bold bg-teal-50 text-teal-700 px-3 py-1 rounded-full border border-teal-100 uppercase">
                                Real-time
                            </span>
                        </div>

                        {/* CSS Bar Charts */}
                        <div className="space-y-8">
                            {/* Balita Chart */}
                            <div>
                                <div className="flex items-end justify-between mb-2">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                            Kunjungan Balita <Baby className="h-4 w-4 text-blue-500" />
                                        </h3>
                                        <p className="text-[10px] text-slate-400 font-medium">
                                            {stats.kunjunganBalita} dari {stats.totalBalita} Balita hadir
                                        </p>
                                    </div>
                                    <span className="text-2xl font-black text-blue-600">{balitaPercentage}%</span>
                                </div>
                                <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex flex-row shadow-inner">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-1000 ease-out flex items-center justify-end px-2"
                                        style={{ width: `${balitaPercentage}% ` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Lansia Chart */}
                            <div>
                                <div className="flex items-end justify-between mb-2">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                            Kunjungan Lansia <Heart className="h-4 w-4 text-rose-500" />
                                        </h3>
                                        <p className="text-[10px] text-slate-400 font-medium">
                                            {stats.kunjunganLansia} dari {stats.totalLansia} Lansia hadir
                                        </p>
                                    </div>
                                    <span className="text-2xl font-black text-rose-600">{lansiaPercentage}%</span>
                                </div>
                                <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex flex-row shadow-inner">
                                    <div
                                        className="h-full bg-gradient-to-r from-rose-400 to-rose-600 transition-all duration-1000 ease-out flex items-center justify-end px-2"
                                        style={{ width: `${lansiaPercentage}% ` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-5 border-t border-slate-100 flex items-center gap-3">
                            <TrendingUp className="h-5 w-5 text-emerald-500" />
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                Insight: Tingkat partisipasi dapat ditingkatkan. Pertimbangkan untuk mengirim pengingat WhatsApp secara bulk H-1 sebelum jadwal Posyandu bulan depan.
                            </p>
                        </div>
                    </Card>

                    {/* Trend Analytics Card */}
                    <Card className="p-6 border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-teal-500" /> Tren Kunjungan (6 Bulan Terakhir)
                            </h2>
                        </div>

                        {isLoadingTrend ? (
                            <div className="h-64 flex items-center justify-center bg-slate-50 rounded-xl animate-pulse">
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Memuat Grafik...</p>
                            </div>
                        ) : (
                            <div className="relative pt-10 pb-4">
                                {/* Chart Area */}
                                <div className="flex items-end justify-between h-48 gap-2 px-2">
                                    {trendData.map((item, idx) => {
                                        const maxVal = Math.max(...trendData.map(d => Math.max(d.balita, d.lansia, 1)));
                                        const balitaHeight = (item.balita / maxVal) * 100;
                                        const lansiaHeight = (item.lansia / maxVal) * 100;

                                        return (
                                            <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                                                {/* Tooltip on hover */}
                                                <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] p-2 rounded-lg z-20 whitespace-nowrap shadow-xl pointer-events-none">
                                                    <p className="font-bold border-b border-white/20 mb-1 pb-1">{item.month}</p>
                                                    <p className="flex justify-between gap-4">Balita: <span>{item.balita}</span></p>
                                                    <p className="flex justify-between gap-4">Lansia: <span>{item.lansia}</span></p>
                                                </div>

                                                <div className="w-full flex justify-center items-end gap-1 h-full">
                                                    {/* Balita Bar */}
                                                    <div
                                                        className="w-3 sm:w-5 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-sm transition-all duration-700 ease-out delay-75 hover:from-blue-600 hover:to-blue-400 cursor-pointer"
                                                        style={{ height: `${balitaHeight}%` }}
                                                    />
                                                    {/* Lansia Bar */}
                                                    <div
                                                        className="w-3 sm:w-5 bg-gradient-to-t from-rose-500 to-rose-300 rounded-t-sm transition-all duration-700 ease-out delay-150 hover:from-rose-600 hover:to-rose-400 cursor-pointer"
                                                        style={{ height: `${lansiaHeight}%` }}
                                                    />
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter sm:tracking-normal">{item.month}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Legend */}
                                <div className="mt-8 flex justify-center gap-6 border-t border-slate-50 pt-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-blue-500 rounded-sm" />
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kunjungan Balita</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-rose-500 rounded-sm" />
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kunjungan Lansia</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Right Column - Export Configuration */}
                <div className="lg:col-span-1">
                    <div className="sticky top-6">
                        <Card className="overflow-hidden border-slate-200 shadow-md">
                            <div className="bg-slate-900 border-b border-slate-800 p-5">
                                <h2 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
                                    <Download className="h-4 w-4 text-teal-400" /> Konfigurasi Laporan
                                </h2>
                                <p className="text-[10px] text-slate-400 mt-1">Unduh data operasional Posyandu ke Excel.</p>
                            </div>

                            <div className="p-5 space-y-5 bg-white">
                                {/* Report Type Matrix */}
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Pilih Modul</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setReportType('balita')}
                                            className={cn(
                                                'flex flex-col items-center justify-center gap-2 p-3 text-center rounded-xl border transition-all',
                                                reportType === 'balita'
                                                    ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-sm'
                                                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                                            )}
                                        >
                                            <Baby className={cn("h-5 w-5", reportType === 'balita' ? "text-blue-500" : "")} />
                                            <span className="text-[10px] font-bold uppercase tracking-wide">Data Balita</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setReportType('lansia')}
                                            className={cn(
                                                'flex flex-col items-center justify-center gap-2 p-3 text-center rounded-xl border transition-all',
                                                reportType === 'lansia'
                                                    ? 'bg-rose-50 border-rose-400 text-rose-700 shadow-sm'
                                                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                                            )}
                                        >
                                            <Heart className={cn("h-5 w-5", reportType === 'lansia' ? "text-rose-500" : "")} />
                                            <span className="text-[10px] font-bold uppercase tracking-wide">Data Lansia</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setReportType('rekapitulasi')}
                                            className={cn(
                                                'flex flex-col items-center justify-center col-span-2 gap-2 p-3 text-center rounded-xl border transition-all',
                                                reportType === 'rekapitulasi'
                                                    ? 'bg-teal-50 border-teal-400 text-teal-700 shadow-sm'
                                                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                                            )}
                                        >
                                            <FileText className={cn("h-5 w-5", reportType === 'rekapitulasi' ? "text-teal-500" : "")} />
                                            <span className="text-[10px] font-bold uppercase tracking-wide">Rekapitulasi Total</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Period Selector */}
                                <div className="pt-1">
                                    <div className="space-y-1.5 border border-slate-200 p-1.5 rounded-xl bg-slate-50">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 pt-1">Periode Laporan</label>
                                        <input
                                            type="month"
                                            value={periode}
                                            onChange={(e) => setPeriode(e.target.value)}
                                            className="w-full bg-slate-50 border-none text-sm font-bold text-slate-800 focus:ring-0 cursor-pointer px-2 py-1.5"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="pt-1">
                                    <div className="space-y-1.5 border border-slate-200 p-1.5 rounded-xl bg-slate-50">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 pt-1">Filter Posyandu</label>
                                        <select
                                            value={selectedPosyanduId}
                                            onChange={(e) => setSelectedPosyanduId(e.target.value)}
                                            className="w-full bg-slate-50 border-none text-sm font-bold text-slate-800 focus:ring-0 cursor-pointer px-2 py-1.5"
                                        >
                                            <option value="ALL">Semua Posyandu</option>
                                            {posyanduList.map((p) => (
                                                <option key={p.id} value={p.id}>{p.nama}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleExport}
                                    disabled={isLoadingStats || isGenerating}
                                    isLoading={isGenerating}
                                    className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl flex shadow-lg shadow-teal-500/20 group"
                                >
                                    {!isGenerating && <Download className="h-5 w-5 mr-2 group-hover:-translate-y-1 group-hover:scale-110 transition-transform" />}
                                    Generate Laporan .XLSX
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
