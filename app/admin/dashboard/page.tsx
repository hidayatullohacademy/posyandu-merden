import {
    Baby,
    Heart,
    Users,
    CalendarDays,
    TrendingUp,
    AlertTriangle,
    Bell,
    CheckCircle2,
    Download,
    ChevronRight,
    ArrowUpRight
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function AdminDashboard() {
    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Dashboard Utama</h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">
                        Ringkasan Operasional Posyandu ILP Desa Merden
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 h-10 px-4 rounded-xl shadow-sm">
                        <CalendarDays className="h-4 w-4 mr-2 text-slate-400" />
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
                            <h3 className="text-3xl font-black text-slate-800">124</h3>
                            <div className="flex items-center gap-1 mt-2">
                                <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                                <span className="text-xs font-bold text-emerald-600">+12%</span>
                                <span className="text-[10px] text-slate-400 font-medium ml-1">dari bulan lalu</span>
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
                            <h3 className="text-3xl font-black text-slate-800">86</h3>
                            <div className="flex items-center gap-1 mt-2">
                                <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                                <span className="text-xs font-bold text-emerald-600">+4%</span>
                                <span className="text-[10px] text-slate-400 font-medium ml-1">dari bulan lalu</span>
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
                            <h3 className="text-3xl font-black text-slate-800">15</h3>
                            <div className="flex items-center gap-1 mt-2">
                                <span className="text-xs font-bold text-slate-400">Tersebar di 5 Posyandu</span>
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
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Kunjungan Bulan Ini</p>
                            <h3 className="text-3xl font-black text-slate-800">210</h3>
                            <div className="flex items-center gap-1 mt-2">
                                <span className="text-xs font-bold text-slate-400">Target kunjungan: 250</span>
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
                                <div className="p-2 bg-red-100 rounded-lg">
                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                </div>
                                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Perlu Perhatian Khusus</h2>
                            </div>
                            <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-full">3 Kasus Aktif</span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-white border-b border-slate-100">
                                    <tr>
                                        <th className="px-5 py-3 font-bold text-slate-500 text-xs uppercase tracking-wider">Nama Pasien</th>
                                        <th className="px-5 py-3 font-bold text-slate-500 text-xs uppercase tracking-wider">Kategori</th>
                                        <th className="px-5 py-3 font-bold text-slate-500 text-xs uppercase tracking-wider">Indikator Status</th>
                                        <th className="px-5 py-3 font-bold text-slate-500 text-xs uppercase tracking-wider text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    <tr className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-5 py-4">
                                            <p className="font-bold text-slate-800">Mbah Sugeng</p>
                                            <p className="text-[10px] font-medium text-slate-500">Lansia • Laki-laki</p>
                                        </td>
                                        <td className="px-5 py-4"><span className="text-xs font-semibold text-slate-600">Tekanan Darah Kritis</span></td>
                                        <td className="px-5 py-4">
                                            <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold bg-red-100 text-red-700">
                                                🔴 190/100 mmHg
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <Button variant="outline" size="sm" className="h-7 text-[10px] px-2 rounded font-bold border-slate-200">
                                                Lihat Rujukan
                                            </Button>
                                        </td>
                                    </tr>
                                    <tr className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-5 py-4">
                                            <p className="font-bold text-slate-800">Budi Santoso</p>
                                            <p className="text-[10px] font-medium text-slate-500">Balita • 18 Bulan</p>
                                        </td>
                                        <td className="px-5 py-4"><span className="text-xs font-semibold text-slate-600">Gizi Kurang (Z-Score)</span></td>
                                        <td className="px-5 py-4">
                                            <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
                                                ⚠️ ZS: -2.4 (KURANG)
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <Button variant="outline" size="sm" className="h-7 text-[10px] px-2 rounded font-bold border-slate-200">
                                                Detail Grafik
                                            </Button>
                                        </td>
                                    </tr>
                                    <tr className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-5 py-4">
                                            <p className="font-bold text-slate-800">Siti Aisyah</p>
                                            <p className="text-[10px] font-medium text-slate-500">Balita • 9 Bulan</p>
                                        </td>
                                        <td className="px-5 py-4"><span className="text-xs font-semibold text-slate-600">Imunisasi Terlewat</span></td>
                                        <td className="px-5 py-4">
                                            <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold bg-red-100 text-red-700">
                                                Campak Rubella
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <Button variant="outline" size="sm" className="h-7 text-[10px] px-2 rounded font-bold border-slate-200">
                                                Ingatkan Ortu
                                            </Button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    <Card className="p-5 border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
                            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-teal-500" /> Usulan Jadwal Posyandu (Menunggu Persetujuan)
                            </h2>
                            <Link href="/admin/jadwal" className="text-xs font-bold text-teal-600 hover:text-teal-700">Lihat Semua &rarr;</Link>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-lg border border-orange-100 bg-orange-50/50">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-white rounded-lg border border-orange-100 flex flex-col items-center justify-center text-orange-600">
                                        <span className="text-[10px] font-bold uppercase">Nov</span>
                                        <span className="text-sm font-black -mt-1">12</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">Posyandu Flamboyan (Balita & Lansia)</p>
                                        <p className="text-[10px] font-medium text-slate-500 mt-0.5">Diusulkan oleh Kader: Ratna • 2 jam lalu</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" className="h-8 text-[11px] border-slate-200">Tolak</Button>
                                    <Button size="sm" className="h-8 text-[11px] bg-teal-600 hover:bg-teal-700 text-white">Setujui Jadwal</Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Column (Narrower) */}
                <div className="space-y-6">
                    <Card className="p-5 border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                                <Bell className="h-4 w-4 text-slate-400" /> Notifikasi Sistem
                            </h2>
                        </div>
                        <div className="space-y-4">
                            <div className="flex gap-3">
                                <div className="mt-0.5 h-2 w-2 rounded-full bg-teal-500 flex-shrink-0" />
                                <div>
                                    <p className="text-xs font-bold text-slate-700">14 Teks WA Siap Kirim</p>
                                    <p className="text-[10px] text-slate-500 mt-0.5">Teks reminder H-1 kunjungan Posyandu Melati telah dibuat otomatis.</p>
                                    <Link href="/admin/notifikasi" className="text-[10px] font-bold text-teal-600 hover:underline mt-1 inline-block">Buka Notifikasi</Link>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="mt-0.5 h-2 w-2 rounded-full bg-slate-300 flex-shrink-0" />
                                <div>
                                    <p className="text-xs font-bold text-slate-700">Backup Data Mingguan Selesai</p>
                                    <p className="text-[10px] text-slate-500 mt-0.5">Sistem telah membackup 420 data secara otomatis.</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="mt-0.5 h-2 w-2 rounded-full bg-amber-500 flex-shrink-0" />
                                <div>
                                    <p className="text-xs font-bold text-slate-700">Stok Vitamin A Menipis</p>
                                    <p className="text-[10px] text-slate-500 mt-0.5">Silakan cek inventaris untuk persiapan bulan Februari.</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-5 bg-slate-900 border-slate-800 text-white shadow-lg overflow-hidden relative">
                        {/* Decorative element */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10" />

                        <div className="relative z-10">
                            <h2 className="text-sm font-bold text-teal-400 uppercase tracking-wide mb-2 flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" /> Kinerja Posyandu
                            </h2>
                            <p className="text-xs text-slate-300 leading-relaxed font-medium mb-4">
                                Tingkat kehadiran Balita mencapai <span className="text-white font-bold">88%</span> bulan ini.
                                Posyandu Anggrek mencatat kunjungan tertinggi.
                            </p>
                            <Link href="/admin/laporan" className="inline-flex items-center justify-center w-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-2.5 rounded-lg border border-white/10 transition-colors">
                                Lihat Laporan Lengkap <ChevronRight className="h-3 w-3 ml-1" />
                            </Link>
                        </div>
                    </Card>
                </div>

            </div>
        </div>
    );
}
