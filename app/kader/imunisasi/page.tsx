'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Check, Clock, AlertCircle, X, Search, Filter, History, Calendar } from 'lucide-react';
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

    const [activeTab, setActiveTab] = useState<'agenda' | 'history'>('agenda');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterMonth, setFilterMonth] = useState<string>('');
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
                .order('tanggal_jadwal', { ascending: true });

            if (error) throw error;
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
        if (record.status === 'SELESAI') return { text: 'Selesai', color: 'text-green-600 bg-green-50', icon: Check, weight: 0 };

        const scheduleDate = new Date(record.tanggal_jadwal);
        const toleranceWeeks = record.master_imunisasi?.toleransi_minggu || 4;
        const deadlineDate = new Date(scheduleDate);
        deadlineDate.setDate(deadlineDate.getDate() + (toleranceWeeks * 7));

        const today = new Date();

        if (today > deadlineDate) {
            return { text: 'Terlambat', color: 'text-red-600 bg-red-50', icon: AlertCircle, weight: 2 };
        }

        return { text: 'Belum', color: 'text-amber-600 bg-amber-50', icon: Clock, weight: 1 };
    };

    const filteredRecords = records
        .filter(r => {
            const matchesTab = activeTab === 'agenda' ? r.status === 'BELUM' : r.status === 'SELESAI';
            const matchesSearch = r.balita?.nama?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesMonth = !filterMonth || r.tanggal_jadwal.startsWith(filterMonth);
            return matchesTab && matchesSearch && matchesMonth;
        })
        .sort((a, b) => {
            if (activeTab === 'agenda') {
                const statusA = getComputedStatus(a);
                const statusB = getComputedStatus(b);
                // Overdue first
                if (statusA.weight !== statusB.weight) return statusB.weight - statusA.weight;
            }
            return new Date(a.tanggal_jadwal).getTime() - new Date(b.tanggal_jadwal).getTime();
        });

    return (
        <div className="space-y-5 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-lg font-bold text-slate-800 tracking-tight">Manajemen Imunisasi</h1>
                    <p className="text-[11px] text-slate-500 mt-0.5">Pantau agenda dan riwayat vaksinasi balita</p>
                </div>
            </div>

            {/* Tabs & Filters */}
            <div className="space-y-4">
                <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
                    <button
                        onClick={() => setActiveTab('agenda')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                            activeTab === 'agenda' ? "bg-white text-teal-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <Calendar className="h-3.5 w-3.5" />
                        Agenda
                        {records.filter(r => r.status === 'BELUM').length > 0 && (
                            <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px]">
                                {records.filter(r => r.status === 'BELUM').length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                            activeTab === 'history' ? "bg-white text-teal-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <History className="h-3.5 w-3.5" />
                        Riwayat
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Cari nama balita..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm"
                        />
                    </div>
                    <div className="relative group">
                        <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                        <input
                            type="month"
                            value={filterMonth}
                            onChange={(e) => setFilterMonth(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Records List */}
            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="p-4 animate-pulse">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-100" />
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 bg-slate-100 rounded w-1/3" />
                                    <div className="h-3 bg-slate-50 rounded w-1/2" />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : filteredRecords.length === 0 ? (
                <Card className="p-10 text-center border-dashed bg-slate-50/50">
                    <div className="bg-white w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                        {activeTab === 'agenda' ? <Calendar className="h-8 w-8 text-slate-300" /> : <History className="h-8 w-8 text-slate-300" />}
                    </div>
                    <p className="text-sm font-bold text-slate-700">Tidak ada data ditemukan</p>
                    <p className="text-xs text-slate-400 mt-1">
                        {searchQuery || filterMonth ? 'Coba ubah kata kunci atau filter Anda' :
                            activeTab === 'agenda' ? 'Semua jadwal imunisasi telah terpenuhi!' : 'Belum ada riwayat imunisasi tercatat.'}
                    </p>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filteredRecords.map(r => {
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
