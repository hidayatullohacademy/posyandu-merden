'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Syringe, Check, Clock, AlertCircle, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface ImunisasiBalitaRecord {
    id: string;
    balita_id: string;
    master_imun_id: string;
    tanggal_jadwal: string;
    tanggal_realisasi: string | null;
    status: 'BELUM' | 'SELESAI';
    catatan: string | null;
    balita?: { nama: string; jenis_kelamin: string };
    master_imunisasi?: { nama: string; toleransi_minggu: number };
}

export default function KaderImunisasiPage() {
    const [records, setRecords] = useState<ImunisasiBalitaRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<ImunisasiBalitaRecord | null>(null);
    const supabase = createClient();

    const [formData, setFormData] = useState({
        tanggal_realisasi: new Date().toISOString().split('T')[0],
        catatan: '',
        tempat: 'Posyandu'
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('imunisasi_balita')
                .select(`
                    *,
                    balita:balita_id(nama, jenis_kelamin),
                    master_imunisasi:master_imun_id(nama, toleransi_minggu)
                `)
                .order('tanggal_jadwal', { ascending: true })
                .limit(100);

            if (error) throw error;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setRecords((data as any) || []);
        } catch {
            toast.error('Gagal memuat jadwal imunisasi');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenForm = (record: ImunisasiBalitaRecord) => {
        setSelectedRecord(record);
        setFormData({
            tanggal_realisasi: new Date().toISOString().split('T')[0],
            catatan: record.catatan || '',
            tempat: 'Posyandu'
        });
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRecord) return;

        setIsSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { toast.error('Sesi habis'); return; }

            const { error } = await supabase
                .from('imunisasi_balita')
                .update({
                    status: 'SELESAI',
                    tanggal_realisasi: formData.tanggal_realisasi,
                    catatan: formData.catatan || null,
                    dicatat_oleh: user.id,
                })
                .eq('id', selectedRecord.id);

            if (error) throw error;

            toast.success('Imunisasi berhasil ditandai selesai!');
            setShowForm(false);
            setSelectedRecord(null);
            fetchData();
        } catch (error: unknown) {
            const e = error as Error;
            toast.error(`Gagal memperbarui status: ${e.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    // Calculate dynamic status for overdue
    const getComputedStatus = (record: ImunisasiBalitaRecord) => {
        if (record.status === 'SELESAI') return { text: 'Selesai', color: 'text-green-600 bg-green-50', icon: Check };

        const scheduleDate = new Date(record.tanggal_jadwal);
        const toleranceWeeks = record.master_imunisasi?.toleransi_minggu || 4;
        const deadlineDate = new Date(scheduleDate);
        deadlineDate.setDate(deadlineDate.getDate() + (toleranceWeeks * 7));

        const today = new Date();

        if (today > deadlineDate) {
            return { text: 'Terlambat', color: 'text-red-600 bg-red-50', icon: AlertCircle };
        }

        return { text: 'Belum', color: 'text-amber-600 bg-amber-50', icon: Clock };
    };

    return (
        <div className="space-y-5 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-bold text-slate-800">Jadwal & Riwayat Imunisasi</h1>
                    <p className="text-xs text-slate-500 mt-1">Daftar jadwal yang digenerate otomatis</p>
                </div>
            </div>

            {/* Records List */}
            {isLoading ? (
                <Card className="p-8 text-center animate-pulse">
                    <div className="h-6 w-32 bg-slate-200 rounded mx-auto mb-4"></div>
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl w-full"></div>)}
                    </div>
                </Card>
            ) : records.length === 0 ? (
                <Card className="p-8 text-center">
                    <Syringe className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-600">Belum ada data imunisasi balita</p>
                    <p className="text-xs text-slate-400 mt-1">Jadwal akan muncul otomatis saat Balita baru didaftarkan.</p>
                </Card>
            ) : (
                <div className="space-y-3">
                    {records.map(r => {
                        const statusIndicator = getComputedStatus(r);
                        const StatusIcon = statusIndicator.icon;

                        return (
                            <Card key={r.id} className="p-4 overflow-hidden relative">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className={cn(
                                            'w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0',
                                            r.balita?.jenis_kelamin === 'L' ? 'bg-blue-500' : 'bg-pink-500'
                                        )}>
                                            {r.balita?.nama?.[0] || '?'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">{r.balita?.nama}</p>
                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                <span className="text-xs font-semibold text-slate-700">
                                                    Vaksin {r.master_imunisasi?.nama}
                                                </span>
                                                <span className="text-slate-300">•</span>
                                                <span className="text-[11px] text-slate-500">
                                                    Jadwal: {formatDate(r.tanggal_jadwal)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-slate-100">
                                        <div className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', statusIndicator.color)}>
                                            <StatusIcon className="h-3.5 w-3.5" />
                                            {statusIndicator.text}
                                        </div>
                                        {r.status === 'BELUM' && (
                                            <Button size="sm" onClick={() => handleOpenForm(r)}>Tandai Selesai</Button>
                                        )}
                                        {r.status === 'SELESAI' && r.tanggal_realisasi && (
                                            <div className="text-[10px] text-slate-400 text-right">
                                                Diberikan tgl<br />
                                                <span className="font-medium text-slate-600">{formatDate(r.tanggal_realisasi)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Record Form Modal */}
            {showForm && selectedRecord && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
                    <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">Tandai Imunisasi Selesai</h2>
                                <p className="text-xs text-slate-500 mt-0.5">{selectedRecord.balita?.nama} - {selectedRecord.master_imunisasi?.nama}</p>
                            </div>
                            <button onClick={() => setShowForm(false)} className="p-1 hover:bg-slate-100 rounded-lg"><X className="h-5 w-5 text-slate-400" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-slate-700">Tanggal Realisasi Pemberian</label>
                                <input type="date" value={formData.tanggal_realisasi} onChange={(e) => setFormData(p => ({ ...p, tanggal_realisasi: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" required />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-slate-700">Tempat Imunisasi</label>
                                <select value={formData.tempat} onChange={(e) => setFormData(p => ({ ...p, tempat: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" required>
                                    <option value="Posyandu">Posyandu</option>
                                    <option value="Puskesmas">Puskesmas</option>
                                    <option value="Rumah Sakit">Rumah Sakit</option>
                                    <option value="Klinik Sweasta">Klinik Swasta</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-slate-700">Keterangan (opsional)</label>
                                <input type="text" placeholder="Catatan medis/kondisi anak" value={formData.catatan} onChange={(e) => setFormData(p => ({ ...p, catatan: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Batal</Button>
                                <Button type="submit" className="flex-1" isLoading={isSaving}>Simpan Data</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
