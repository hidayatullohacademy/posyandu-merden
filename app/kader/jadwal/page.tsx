'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { CalendarDays, Plus, Clock, MapPin, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface JadwalItem {
    id: string;
    tanggal: string;
    waktu_mulai: string;
    waktu_selesai: string;
    jenis: string;
    lokasi: string;
    keterangan: string | null;
    status: string;
    posyandu?: { nama: string };
}

const STATUS_COLORS: Record<string, string> = {
    DIUSULKAN: 'bg-amber-50 text-amber-600',
    DISETUJUI: 'bg-green-50 text-green-600',
    DITOLAK: 'bg-red-50 text-red-600',
    SELESAI: 'bg-slate-50 text-slate-500',
};

export default function KaderJadwalPage() {
    const [jadwalList, setJadwalList] = useState<JadwalItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const supabase = createClient();

    const [formData, setFormData] = useState({
        tanggal: '', waktu_mulai: '08:00', waktu_selesai: '12:00',
        jenis: 'BALITA', lokasi: '',
        jenis_perubahan: 'Jadwal Baru', alasan: 'Lainnya', keterangan: '',
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchJadwal(); }, []);

    const fetchJadwal = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('jadwal_posyandu')
                .select('*, posyandu:posyandu_id(nama)')
                .order('tanggal', { ascending: false });

            if (error) throw error;
            setJadwalList(data || []);
        } catch {
            toast.error('Gagal memuat jadwal');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { toast.error('Sesi habis'); return; }

            const { data: userData } = await supabase.from('users').select('posyandu_id').eq('id', user.id).single();
            if (!userData?.posyandu_id) { toast.error('Posyandu belum diatur'); return; }

            // 1. Cek konflik jadwal (tanggal & jam overlap)
            const { data: konflik } = await supabase
                .from('jadwal_posyandu')
                .select('id')
                .eq('posyandu_id', userData.posyandu_id)
                .eq('tanggal', formData.tanggal)
                .neq('status', 'DITOLAK')
                .lte('waktu_mulai', formData.waktu_selesai)
                .gte('waktu_selesai', formData.waktu_mulai)
                .limit(1);

            if (konflik && konflik.length > 0) {
                toast.error('Jadwal bentrok dengan jadwal lain!');
                setIsSaving(false);
                return;
            }

            // 2. Tandai MENDESAK jika usulan < 2 hari
            const pDay = new Date(formData.tanggal);
            const today = new Date();
            const diffTime = pDay.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            const isMendesak = diffDays < 2;

            // Format keterangan untuk Admin dan Notifikasi WA
            let finalKeterangan = `[${formData.jenis_perubahan}] Alasan: ${formData.alasan}`;
            if (formData.keterangan) {
                finalKeterangan += ` - Catatan: ${formData.keterangan}`;
            }
            if (isMendesak) {
                finalKeterangan = `[🔴 MENDESAK] ${finalKeterangan}`.trim();
            }

            const { error } = await supabase.from('jadwal_posyandu').insert({
                ...formData,
                keterangan: finalKeterangan, // we map back formatted keterangan
                bulan: pDay.getMonth() + 1,
                tahun: pDay.getFullYear(),
                posyandu_id: userData.posyandu_id,
                status: 'DIUSULKAN',
                created_by: user.id,
            });
            if (error) throw error;

            toast.success('Usulan jadwal dikirim ke Admin');
            setShowForm(false);
            setFormData({ tanggal: '', waktu_mulai: '08:00', waktu_selesai: '12:00', jenis: 'BALITA', lokasi: '', jenis_perubahan: 'Jadwal Baru', alasan: 'Lainnya', keterangan: '' });
            fetchJadwal();
        } catch { toast.error('Gagal mengusulkan jadwal'); }
        finally { setIsSaving(false); }
    };

    const isPast = (tanggal: string) => new Date(tanggal) < new Date();
    const upcoming = jadwalList.filter(j => !isPast(j.tanggal) && j.status === 'DISETUJUI');

    return (
        <div className="space-y-5 animate-fade-in">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-bold text-slate-800">Jadwal Posyandu</h1>
                <Button size="sm" onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> Usulkan</Button>
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2].map(i => <div key={i} className="bg-white rounded-2xl border p-5 h-20 animate-pulse" />)}
                </div>
            ) : (
                <>
                    {upcoming.length > 0 && (
                        <div>
                            <h2 className="text-xs font-semibold text-teal-600 uppercase tracking-wider mb-2">Akan Datang</h2>
                            <div className="space-y-2">
                                {upcoming.map(j => (
                                    <Card key={j.id} className="p-4 border-l-4 border-l-teal-500">
                                        <p className="text-sm font-bold text-slate-800">{formatDate(j.tanggal)}</p>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {j.waktu_mulai}–{j.waktu_selesai}</span>
                                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {j.lokasi}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-xs bg-teal-50 text-teal-600 px-2 py-0.5 rounded-full">{j.jenis}</span>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {jadwalList.filter(j => j.status === 'DIUSULKAN').length > 0 && (
                        <div>
                            <h2 className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">Menunggu Persetujuan</h2>
                            <div className="space-y-2">
                                {jadwalList.filter(j => j.status === 'DIUSULKAN').map(j => (
                                    <Card key={j.id} className="p-4 border-l-4 border-l-amber-400">
                                        <p className="text-sm font-bold text-slate-800">{formatDate(j.tanggal)}</p>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {j.waktu_mulai}–{j.waktu_selesai}</span>
                                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {j.lokasi}</span>
                                        </div>
                                        <span className={cn('mt-2 inline-block text-[10px] font-medium px-2 py-0.5 rounded-full', STATUS_COLORS[j.status])}>{j.status}</span>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {jadwalList.length === 0 && (
                        <Card className="p-8 text-center">
                            <CalendarDays className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                            <p className="text-sm text-slate-400">Belum ada jadwal</p>
                        </Card>
                    )}
                </>
            )}

            {showForm && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
                    <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-slate-800">Usulkan Jadwal</h2>
                            <button onClick={() => setShowForm(false)} className="p-1 hover:bg-slate-100 rounded-lg"><X className="h-5 w-5 text-slate-400" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input label="Tanggal" type="date" value={formData.tanggal} onChange={(e) => setFormData(p => ({ ...p, tanggal: e.target.value }))} />
                            <div className="grid grid-cols-2 gap-3">
                                <Input label="Mulai" type="time" value={formData.waktu_mulai} onChange={(e) => setFormData(p => ({ ...p, waktu_mulai: e.target.value }))} />
                                <Input label="Selesai" type="time" value={formData.waktu_selesai} onChange={(e) => setFormData(p => ({ ...p, waktu_selesai: e.target.value }))} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-slate-700">Jenis</label>
                                <select value={formData.jenis} onChange={(e) => setFormData(p => ({ ...p, jenis: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">
                                    <option value="BALITA">Balita</option>
                                    <option value="LANSIA">Lansia</option>
                                    <option value="ILP">ILP (Integrasi)</option>
                                </select>
                            </div>
                            <Input label="Lokasi" placeholder="Lokasi kegiatan" value={formData.lokasi} onChange={(e) => setFormData(p => ({ ...p, lokasi: e.target.value }))} />
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-slate-700">Jenis Usulan</label>
                                <select value={formData.jenis_perubahan} onChange={(e) => setFormData(p => ({ ...p, jenis_perubahan: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">
                                    <option value="Jadwal Baru">Jadwal Baru</option>
                                    <option value="Geser Tanggal">Perubahan: Geser Tanggal</option>
                                    <option value="Ganti Lokasi Saja">Perubahan: Ganti Lokasi Saja</option>
                                    <option value="Tanggal & Lokasi">Perubahan: Tanggal & Lokasi</option>
                                    <option value="Tunda Bulan Depan">Perubahan: Tunda Bulan Depan (Force Majeure)</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-slate-700">Alasan</label>
                                <select value={formData.alasan} onChange={(e) => setFormData(p => ({ ...p, alasan: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">
                                    <option value="Jadwal Rutin">Jadwal Rutin (Normal)</option>
                                    <option value="Hari Libur Nasional">Hari libur nasional</option>
                                    <option value="Hari Besar Keagamaan">Hari besar keagamaan</option>
                                    <option value="Cuaca Ekstrem / Bencana">Cuaca ekstrem/bencana</option>
                                    <option value="Lokasi Tidak Bisa Dipakai">Lokasi tidak bisa dipakai</option>
                                    <option value="Kader Sakit">Kader sakit</option>
                                    <option value="Bidan Tidak Hadir">Bidan tidak hadir</option>
                                    <option value="Kegiatan Desa Bentrok">Kegiatan desa bentrok</option>
                                    <option value="Lainnya">Lainnya</option>
                                </select>
                            </div>
                            <Input label="Catatan Tambahan" placeholder="Opsional" value={formData.keterangan} onChange={(e) => setFormData(p => ({ ...p, keterangan: e.target.value }))} />
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                <p className="text-xs text-amber-700">Jadwal yang diusulkan perlu disetujui oleh Admin sebelum ditampilkan.</p>
                            </div>
                            <div className="pt-2"><Button type="submit" className="w-full" isLoading={isSaving}>Kirim Usulan</Button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
