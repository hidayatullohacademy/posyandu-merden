'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Syringe, Check, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn, formatDate, hitungUsiaBulan } from '@/lib/utils';
import toast from 'react-hot-toast';

interface ImunisasiMaster {
    id: string;
    nama: string;
    usia_bulan: number;
}

interface ChildImunisasi {
    balitaId: string;
    balitaNama: string;
    tanggalLahir: string;
    records: { master_imun_id: string; tanggal_realisasi: string | null; status: string }[];
}

export default function OrtuImunisasiPage() {
    const [masterList, setMasterList] = useState<ImunisasiMaster[]>([]);
    const [childrenData, setChildrenData] = useState<ChildImunisasi[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get linked children
            const { data: links } = await supabase.from('orang_tua_balita').select('balita_id').eq('user_id', user.id);
            if (!links || links.length === 0) { setIsLoading(false); return; }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const balitaIds = links.map((l: any) => l.balita_id);

            const [masterRes, balitaRes, recordsRes] = await Promise.all([
                supabase.from('master_imunisasi').select('*').order('usia_bulan'),
                supabase.from('balita').select('id, nama, tanggal_lahir').in('id', balitaIds),
                supabase.from('imunisasi_balita').select('balita_id, master_imun_id, tanggal_realisasi, status').in('balita_id', balitaIds).eq('status', 'SELESAI'),
            ]);

            if (masterRes.error) throw masterRes.error;
            setMasterList(masterRes.data || []);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const children = (balitaRes.data || []).map((b: any) => ({
                balitaId: b.id,
                balitaNama: b.nama,
                tanggalLahir: b.tanggal_lahir,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                records: (recordsRes.data || []).filter((r: any) => r.balita_id === b.id),
            }));
            setChildrenData(children);
        } catch {
            toast.error('Gagal memuat data imunisasi');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4 animate-fade-in">
                <h1 className="text-lg font-bold text-slate-800">Status Imunisasi</h1>
                <div className="bg-white rounded-2xl border p-6 animate-pulse">
                    <div className="h-6 bg-slate-100 rounded w-40 mb-4" />
                    <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-10 bg-slate-50 rounded" />)}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5 animate-fade-in">
            <h1 className="text-lg font-bold text-slate-800">Status Imunisasi</h1>

            {childrenData.length === 0 ? (
                <Card className="p-8 text-center">
                    <Syringe className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm text-slate-400">Belum ada data anak terhubung</p>
                    <p className="text-xs text-slate-300 mt-1">Hubungi Kader untuk menghubungkan data anak Anda</p>
                </Card>
            ) : (
                childrenData.map(child => {
                    const usia = hitungUsiaBulan(child.tanggalLahir);
                    const completed = child.records.length;
                    const total = masterList.length;
                    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

                    return (
                        <Card key={child.balitaId} className="p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-sm font-bold text-slate-800">{child.balitaNama}</h2>
                                    <p className="text-[10px] text-slate-400">{usia < 12 ? `${usia} bulan` : `${Math.floor(usia / 12)} tahun ${usia % 12} bulan`}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-teal-600">{pct}%</p>
                                    <p className="text-[10px] text-slate-400">{completed}/{total} vaksin</p>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full h-2 bg-slate-100 rounded-full mb-4 overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                            </div>

                            {/* Vaccine Checklist */}
                            <div className="space-y-2">
                                {masterList.map(v => {
                                    const record = child.records.find(r => r.master_imun_id === v.id);
                                    const isDone = !!record && record.status === 'SELESAI';

                                    return (
                                        <div key={v.id} className={cn(
                                            'flex items-center justify-between py-2 px-3 rounded-xl text-xs',
                                            isDone ? 'bg-green-50/50' : 'bg-slate-50/50'
                                        )}>
                                            <div className="flex items-center gap-2">
                                                <div className={cn(
                                                    'w-5 h-5 rounded-full flex items-center justify-center',
                                                    isDone ? 'bg-green-500' : 'bg-slate-200'
                                                )}>
                                                    {isDone ? <Check className="h-3 w-3 text-white" /> : <X className="h-3 w-3 text-slate-400" />}
                                                </div>
                                                <span className={cn('font-medium', isDone ? 'text-green-700' : 'text-slate-500')}>
                                                    {v.nama}
                                                </span>
                                            </div>
                                            <span className="text-slate-400">
                                                {isDone && record.tanggal_realisasi ? formatDate(record.tanggal_realisasi) : `usia ${v.usia_bulan} bln`}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    );
                })
            )}

            <Card className="p-4 bg-amber-50/50 border-amber-100">
                <p className="text-xs text-amber-700 leading-relaxed">
                    💉 Pastikan anak Anda mendapat imunisasi lengkap sesuai jadwal. Hubungi Kader Posyandu untuk informasi lebih lanjut.
                </p>
            </Card>
        </div>
    );
}
