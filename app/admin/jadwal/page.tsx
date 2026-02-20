'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { CalendarDays, Plus, Check, X, Clock, MapPin } from 'lucide-react';
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
    status: 'DIUSULKAN' | 'DISETUJUI' | 'DITOLAK' | 'SELESAI';
    posyandu_id: string;
    posyandu?: { nama: string };
    created_by?: string;
}

interface PosyanduItem { id: string; nama: string; }

const STATUS_COLORS: Record<string, string> = {
    DIUSULKAN: 'bg-amber-50 text-amber-600 border-amber-200',
    DISETUJUI: 'bg-green-50 text-green-600 border-green-200',
    DITOLAK: 'bg-red-50 text-red-600 border-red-200',
    SELESAI: 'bg-slate-50 text-slate-500 border-slate-200',
};

export default function AdminJadwalPage() {
    const [jadwalList, setJadwalList] = useState<JadwalItem[]>([]);
    const [posyanduList, setPosyanduList] = useState<PosyanduItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const supabase = createClient();

    const [formData, setFormData] = useState({
        tanggal: '', waktu_mulai: '08:00', waktu_selesai: '12:00',
        jenis: 'BALITA', lokasi: '', keterangan: '', posyandu_id: '',
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [jRes, pRes] = await Promise.all([
                supabase.from('jadwal_posyandu').select('*, posyandu:posyandu_id(nama)').order('tanggal', { ascending: false }),
                supabase.from('posyandu').select('id, nama').order('nama'),
            ]);
            if (jRes.error) throw jRes.error;
            setJadwalList(jRes.data || []);
            setPosyanduList(pRes.data || []);
        } catch {
            toast.error('Gagal memuat jadwal');
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (jadwal: JadwalItem) => {
        try {
            const { error } = await supabase.from('jadwal_posyandu').update({ status: 'DISETUJUI' }).eq('id', jadwal.id);
            if (error) throw error;

            // Generate WA Text
            const teksWA = `*PENGUMUMAN POSYANDU*\n\nBapak/Ibu, jadwal Posyandu ${jadwal.posyandu?.nama} akan dilaksanakan pada:\n\nHari/Tanggal: ${formatDate(jadwal.tanggal)}\nPukul: ${jadwal.waktu_mulai} - ${jadwal.waktu_selesai} WIB\nLokasi: ${jadwal.lokasi}\nKegiatan: Layanan ${jadwal.jenis}\n\n${jadwal.keterangan ? `Catatan: ${jadwal.keterangan}\n\n` : ''}Mohon kehadirannya tepat waktu membawa buku KIA/KMS. Terima kasih.`;

            await supabase.from('notifikasi').insert({
                posyandu_id: jadwal.posyandu_id,
                jenis: 'PENGINGAT_JADWAL',
                teks_wa: teksWA,
                status: 'BELUM_DIKIRIM',
                ref_id: jadwal.id,
                ref_type: 'JADWAL',
            });

            toast.success('Jadwal disetujui & Teks WA dibuat');
            fetchData();
        } catch { toast.error('Gagal menyetujui jadwal'); }
    };

    const handleReject = async (jadwal: JadwalItem) => {
        try {
            const { error } = await supabase.from('jadwal_posyandu').update({ status: 'DITOLAK' }).eq('id', jadwal.id);
            if (error) throw error;

            const teksWA = `*INFO KADER*\n\nUsulan jadwal Posyandu ${jadwal.posyandu?.nama} untuk tanggal ${formatDate(jadwal.tanggal)} telah DITOLAK oleh Admin. Silakan ajukan jadwal pengganti.`;

            await supabase.from('notifikasi').insert({
                posyandu_id: jadwal.posyandu_id,
                jenis: 'UMUM',
                teks_wa: teksWA,
                status: 'BELUM_DIKIRIM',
                ref_id: jadwal.id,
                ref_type: 'JADWAL_DITOLAK',
            });

            toast.success('Jadwal ditolak');
            fetchData();
        } catch { toast.error('Gagal menolak jadwal'); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { toast.error('Sesi habis'); return; }

            // Cek konflik
            const { data: konflik } = await supabase
                .from('jadwal_posyandu')
                .select('id')
                .eq('posyandu_id', formData.posyandu_id)
                .eq('tanggal', formData.tanggal)
                .neq('status', 'DITOLAK')
                .lte('waktu_mulai', formData.waktu_selesai)
                .gte('waktu_selesai', formData.waktu_mulai)
                .limit(1);

            if (konflik && konflik.length > 0) {
                toast.error('Gagal: Jadwal bentrok dengan jadwal aktif di posyandu tersebut!');
                setIsSaving(false);
                return;
            }

            const tgl = new Date(formData.tanggal);
            const { data: newJadwal, error } = await supabase.from('jadwal_posyandu').insert({
                ...formData,
                bulan: tgl.getMonth() + 1,
                tahun: tgl.getFullYear(),
                keterangan: formData.keterangan || null,
                status: 'DISETUJUI',
                created_by: user.id,
            }).select().single();
            if (error) throw error;

            const posyandu = posyanduList.find(p => p.id === formData.posyandu_id);
            const teksWA = `*PENGUMUMAN POSYANDU*\n\nBapak/Ibu, jadwal Posyandu ${posyandu?.nama || ''} akan dilaksanakan pada:\n\nHari/Tanggal: ${formatDate(formData.tanggal)}\nPukul: ${formData.waktu_mulai} - ${formData.waktu_selesai} WIB\nLokasi: ${formData.lokasi}\nKegiatan: Layanan ${formData.jenis}\n\n${formData.keterangan ? `Catatan: ${formData.keterangan}\n\n` : ''}Mohon kehadirannya tepat waktu membawa buku KIA/KMS. Terima kasih.`;

            await supabase.from('notifikasi').insert({
                posyandu_id: formData.posyandu_id,
                jenis: 'PENGINGAT_JADWAL',
                teks_wa: teksWA,
                status: 'BELUM_DIKIRIM',
                ref_id: newJadwal?.id,
                ref_type: 'JADWAL',
            });

            toast.success('Jadwal berhasil ditambahkan & Teks WA dibuat');
            setShowForm(false);
            setFormData({ tanggal: '', waktu_mulai: '08:00', waktu_selesai: '12:00', jenis: 'BALITA', lokasi: '', keterangan: '', posyandu_id: '' });
            fetchData();
        } catch { toast.error('Gagal menambahkan jadwal'); }
        finally { setIsSaving(false); }
    };

    const pendingCount = jadwalList.filter(j => j.status === 'DIUSULKAN').length;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Jadwal Posyandu</h1>
                    <p className="text-sm text-slate-400 mt-1">
                        {pendingCount > 0 && <span className="text-amber-500 font-medium">{pendingCount} jadwal menunggu persetujuan · </span>}
                        {jadwalList.length} total jadwal
                    </p>
                </div>
                <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> Tambah Jadwal</Button>
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-2xl border p-5 h-24 animate-pulse" />)}
                </div>
            ) : jadwalList.length === 0 ? (
                <Card className="p-8 text-center">
                    <CalendarDays className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm text-slate-400">Belum ada jadwal</p>
                </Card>
            ) : (
                <div className="space-y-3">
                    {jadwalList.map(j => (
                        <Card key={j.id} className="p-5">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <p className="text-sm font-bold text-slate-800">{formatDate(j.tanggal)}</p>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {j.waktu_mulai}–{j.waktu_selesai}</span>
                                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {j.lokasi}</span>
                                    </div>
                                </div>
                                <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border', STATUS_COLORS[j.status])}>
                                    {j.status}
                                </span>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{j.jenis}</span>
                                    <span className="text-xs text-slate-400">{j.posyandu?.nama}</span>
                                </div>
                                {j.status === 'DIUSULKAN' && (
                                    <div className="flex gap-1">
                                        <button onClick={() => handleApprove(j)} className="p-1.5 hover:bg-green-50 rounded-lg text-green-600 transition-colors"><Check className="h-4 w-4" /></button>
                                        <button onClick={() => handleReject(j)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors"><X className="h-4 w-4" /></button>
                                    </div>
                                )}
                            </div>
                            {j.keterangan && <p className="text-xs text-slate-400 mt-2 italic">{j.keterangan}</p>}
                        </Card>
                    ))}
                </div>
            )}

            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
                    <div className="relative w-full max-w-md bg-white rounded-2xl p-6 m-4 max-h-[90vh] overflow-y-auto animate-slide-up">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-slate-800">Tambah Jadwal</h2>
                            <button onClick={() => setShowForm(false)} className="p-1 hover:bg-slate-100 rounded-lg"><X className="h-5 w-5 text-slate-400" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-slate-700">Posyandu</label>
                                <select value={formData.posyandu_id} onChange={(e) => setFormData(p => ({ ...p, posyandu_id: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" required>
                                    <option value="">Pilih posyandu...</option>
                                    {posyanduList.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                                </select>
                            </div>
                            <Input label="Tanggal" type="date" value={formData.tanggal} onChange={(e) => setFormData(p => ({ ...p, tanggal: e.target.value }))} />
                            <div className="grid grid-cols-2 gap-3">
                                <Input label="Waktu Mulai" type="time" value={formData.waktu_mulai} onChange={(e) => setFormData(p => ({ ...p, waktu_mulai: e.target.value }))} />
                                <Input label="Waktu Selesai" type="time" value={formData.waktu_selesai} onChange={(e) => setFormData(p => ({ ...p, waktu_selesai: e.target.value }))} />
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
                            <Input label="Keterangan" placeholder="Opsional" value={formData.keterangan} onChange={(e) => setFormData(p => ({ ...p, keterangan: e.target.value }))} />
                            <div className="pt-2"><Button type="submit" className="w-full" isLoading={isSaving}>Simpan Jadwal</Button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
