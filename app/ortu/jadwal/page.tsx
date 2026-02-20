'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { CalendarDays, Clock, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface JadwalItem {
    id: string;
    tanggal: string;
    waktu_mulai: string;
    waktu_selesai: string;
    jenis: string;
    lokasi: string;
    keterangan: string | null;
    posyandu?: { nama: string };
}

export default function OrtuJadwalPage() {
    const [jadwalList, setJadwalList] = useState<JadwalItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchJadwal(); }, []);

    const fetchJadwal = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('jadwal_posyandu')
                .select('*, posyandu:posyandu_id(nama)')
                .eq('status', 'DISETUJUI')
                .gte('tanggal', new Date().toISOString().split('T')[0])
                .order('tanggal', { ascending: true });

            if (error) throw error;
            setJadwalList(data || []);
        } catch {
            toast.error('Gagal memuat jadwal');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4 animate-fade-in">
                <h1 className="text-lg font-bold text-slate-800">Jadwal Posyandu</h1>
                {[1, 2].map(i => <div key={i} className="bg-white rounded-2xl border p-5 h-20 animate-pulse" />)}
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-fade-in">
            <h1 className="text-lg font-bold text-slate-800">Jadwal Posyandu</h1>

            {jadwalList.length === 0 ? (
                <Card className="p-8 text-center">
                    <CalendarDays className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm text-slate-400">Tidak ada jadwal mendatang</p>
                    <p className="text-xs text-slate-300 mt-1">Jadwal akan ditampilkan setelah disetujui oleh Admin</p>
                </Card>
            ) : (
                <div className="space-y-3">
                    {jadwalList.map(j => (
                        <Card key={j.id} className="p-5 border-l-4 border-l-blue-500">
                            <p className="text-sm font-bold text-slate-800">{formatDate(j.tanggal)}</p>
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {j.waktu_mulai} – {j.waktu_selesai}</span>
                                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {j.lokasi}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{j.jenis}</span>
                                {j.posyandu?.nama && <span className="text-xs text-slate-400">{j.posyandu.nama}</span>}
                            </div>
                            {j.keterangan && <p className="text-xs text-slate-400 mt-2 italic">{j.keterangan}</p>}
                        </Card>
                    ))}
                </div>
            )}

            <Card className="p-4 bg-blue-50/50 border-blue-100">
                <p className="text-xs text-blue-700 leading-relaxed">
                    📅 Jadwal yang ditampilkan hanya jadwal yang sudah disetujui oleh Admin Posyandu.
                </p>
            </Card>
        </div>
    );
}
