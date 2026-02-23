'use client';

import { useState, useEffect, use } from 'react';
import { createClient } from '@/lib/supabase';
import { ArrowLeft, TrendingUp, Calendar, Scale, Activity, BellRing } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn, formatDate, hitungUsiaBulan, formatNumber, getZScoreBBU, formatUsiaDetail } from '@/lib/utils';
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

interface UpcomingVaccine {
    id: string;
    nama: string;
    tanggal: string;
}

const BULAN_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];

export default function OrtuAnakDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [balita, setBalita] = useState<BalitaDetail | null>(null);
    const [kunjungan, setKunjungan] = useState<KunjunganRecord[]>([]);
    const [nextVaccine, setNextVaccine] = useState<UpcomingVaccine | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchData(); }, [id]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [bRes, kRes, vRes] = await Promise.all([
                supabase.from('balita').select('*').eq('id', id).single(),
                supabase.from('kunjungan_balita').select('*').eq('balita_id', id)
                    .order('tahun', { ascending: false }).order('bulan', { ascending: false }),
                supabase.from('imunisasi_balita')
                    .select('id, master:master_imun_id(nama), tanggal_jadwal')
                    .eq('balita_id', id)
                    .eq('status', 'BELUM')
                    .gte('tanggal_jadwal', new Date().toISOString().split('T')[0])
                    .order('tanggal_jadwal', { ascending: true })
                    .limit(1)
                    .maybeSingle()
            ]);

            if (bRes.error) throw bRes.error;
            setBalita(bRes.data);
            setKunjungan(kRes.data || []);

            if (vRes.data) {
                setNextVaccine({
                    id: vRes.data.id,
                    nama: (vRes.data.master as any)?.nama || 'Vaksin',
                    tanggal: vRes.data.tanggal_jadwal
                });
            }
        } catch (error) {
            console.error('Error fetching data:', error);
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
                <h1 className="text-lg font-bold text-slate-800">Detail Perkembangan</h1>
            </div>

            {/* Profile Card */}
            <Card className="p-5 border-none shadow-sm bg-gradient-to-br from-white to-slate-50/50">
                <div className="flex items-center gap-4 mb-4">
                    <div className={cn(
                        'w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg border-2 border-white',
                        balita.jenis_kelamin === 'L' ? 'bg-gradient-to-br from-blue-400 to-blue-600' : 'bg-gradient-to-br from-pink-400 to-pink-600'
                    )}>
                        {balita.nama.charAt(0)}
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight leading-tight">{balita.nama}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Anak Bunda {balita.nama_ibu}</span>
                            <span className="h-1 w-1 bg-slate-300 rounded-full"></span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{balita.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {/* Age Badge */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-3 border border-slate-100 shadow-sm">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Usia Saat Ini</p>
                        <p className="font-black text-slate-800">
                            {formatUsiaDetail(balita.tanggal_lahir)}
                        </p>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-3 border border-slate-100 shadow-sm">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Tanggal Lahir</p>
                        <p className="font-black text-slate-800 text-xs">{formatDate(balita.tanggal_lahir)}</p>
                    </div>
                </div>
            </Card>

            {/* Clinical Snapshot Section (Expert Feature) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Last Visit Expertise */}
                <Card className="p-4 border-orange-100 bg-orange-50/20 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Scale className="h-20 w-20 text-orange-600" />
                    </div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-orange-500" />
                            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.1em]">Status Terakhir</h3>
                        </div>
                        {lastK ? (
                            <span className="text-[10px] font-bold text-slate-400">
                                {BULAN_NAMES[lastK.bulan]} {lastK.tahun}
                            </span>
                        ) : (
                            <span className="text-[10px] font-bold text-slate-400">Belum Ada Data</span>
                        )}
                    </div>

                    {lastK ? (
                        <div className="space-y-3">
                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Interpretasi Berat</p>
                                    <h4 className={cn(
                                        "text-lg font-black tracking-tight",
                                        lastK.status_gizi === 'NORMAL' ? 'text-emerald-600' :
                                            lastK.status_gizi === 'KURANG' ? 'text-amber-600' : 'text-rose-600'
                                    )}>
                                        {lastK.status_gizi || 'Belum Ada'}
                                    </h4>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Z-Score (BB/U)</p>
                                    <p className="font-black text-slate-800">
                                        {lastK.berat_badan ? getZScoreBBU(balita.jenis_kelamin as 'L' | 'P', hitungUsiaBulan(balita.tanggal_lahir), lastK.berat_badan) : '-'}
                                    </p>
                                </div>
                            </div>
                            <div className="pt-2 border-t border-orange-200/30 flex gap-4">
                                <div>
                                    <p className="text-[9px] text-slate-400 font-black uppercase">BB</p>
                                    <p className="text-xs font-black text-slate-700">{formatNumber(lastK.berat_badan)} kg</p>
                                </div>
                                <div>
                                    <p className="text-[9px] text-slate-400 font-black uppercase">TB</p>
                                    <p className="text-xs font-black text-slate-700">{formatNumber(lastK.tinggi_badan)} cm</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-4 text-center">
                            <p className="text-xs text-slate-400 font-medium">Bawa si kecil ke Posyandu untuk update status gizi</p>
                        </div>
                    )}
                </Card>

                {/* Next Vaccine Expertise */}
                <Card className="p-4 border-indigo-100 bg-indigo-50/20 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <BellRing className="h-20 w-20 text-indigo-600" />
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar className="h-4 w-4 text-indigo-500" />
                        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.1em]">Jadwal Terdekat</h3>
                    </div>

                    {nextVaccine ? (
                        <div className="space-y-2">
                            <div>
                                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Vaksin</p>
                                <h4 className="text-lg font-black text-indigo-700 tracking-tight leading-tight">{nextVaccine.nama}</h4>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-indigo-200/30">
                                <div>
                                    <p className="text-[9px] text-slate-400 font-black uppercase">Prediksi Tanggal</p>
                                    <p className="text-sm font-black text-slate-700">{formatDate(nextVaccine.tanggal)}</p>
                                </div>
                                <div className="bg-indigo-100/50 px-2 py-1 rounded-lg">
                                    <span className="text-[10px] font-black text-indigo-700 uppercase">{hitungUsiaBulan(nextVaccine.tanggal)} Bln</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-4 text-center">
                            <p className="text-xs text-slate-400 font-medium">Semua jadwal rutin telah terpenuhi atau belum diatur</p>
                        </div>
                    )}
                </Card>
            </div>

            {/* Growth Chart */}
            <Card className="p-4 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-800">Grafik Berat Badan</h3>
                    <span className="text-[10px] text-slate-400">Terakhir 6 bulan</span>
                </div>

                {kunjungan.length < 2 ? (
                    <div className="h-32 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <TrendingUp className="h-6 w-6 text-slate-200 mb-1" />
                        <p className="text-[10px] text-slate-400">Butuh minimal 2 data timbang</p>
                    </div>
                ) : (
                    <div className="relative h-40 w-full pt-2">
                        {/* Simple SVG Line Chart */}
                        <svg className="w-full h-full" viewBox="0 0 400 150" preserveAspectRatio="none">
                            {/* Grid Lines */}
                            {[0, 1, 2, 3].map(i => (
                                <line
                                    key={i}
                                    x1="0" y1={150 - (i * 50)}
                                    x2="400" y2={150 - (i * 50)}
                                    stroke="#f1f5f9"
                                    strokeWidth="1"
                                />
                            ))}

                            {(() => {
                                const data = [...kunjungan].reverse().slice(-6);
                                const maxBB = Math.max(...data.map(d => d.berat_badan)) * 1.2;
                                const minBB = Math.min(...data.map(d => d.berat_badan)) * 0.8;
                                const range = maxBB - minBB;

                                const points = data.map((d, i) => {
                                    const x = (i / (data.length - 1)) * 400;
                                    const y = 150 - ((d.berat_badan - minBB) / range) * 120 - 15;
                                    return { x, y, val: d.berat_badan };
                                });

                                const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                                const areaData = pathData + ` L ${points[points.length - 1].x} 150 L 0 150 Z`;

                                return (
                                    <>
                                        {/* Area under curve */}
                                        <path d={areaData} fill="url(#grad)" opacity="0.1" />
                                        <defs>
                                            <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                                                <stop offset="0%" stopColor="#3b82f6" />
                                                <stop offset="100%" stopColor="white" />
                                            </linearGradient>
                                        </defs>

                                        {/* Line */}
                                        <path
                                            d={pathData}
                                            fill="none"
                                            stroke="#3b82f6"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />

                                        {/* Points */}
                                        {points.map((p, i) => (
                                            <g key={i}>
                                                <circle cx={p.x} cy={p.y} r="4" fill="white" stroke="#3b82f6" strokeWidth="2" />
                                                <text
                                                    x={p.x} y={p.y - 10}
                                                    textAnchor="middle"
                                                    fontSize="10"
                                                    fontWeight="bold"
                                                    fill="#64748b"
                                                >
                                                    {formatNumber(p.val)}
                                                </text>
                                            </g>
                                        ))}
                                    </>
                                );
                            })()}
                        </svg>
                    </div>
                )}
            </Card>

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
