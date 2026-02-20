'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Bell, Send, Clock, CheckCircle, Filter, RefreshCw, MessageSquare, CalendarDays, Syringe, AlertTriangle } from 'lucide-react';
import { Card, StatCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface NotifikasiItem {
    id: string;
    jenis: string;
    teks_wa: string;
    status: 'BELUM_DIKIRIM' | 'TERKIRIM';
    dikirim_at: string | null;
    created_at: string;
    posyandu?: { nama: string };
}

type FilterStatus = 'ALL' | 'BELUM_DIKIRIM' | 'TERKIRIM';

const JENIS_ICONS: Record<string, React.ReactNode> = {
    PENGINGAT_JADWAL: <CalendarDays className="h-4 w-4 text-blue-500" />,
    PENGINGAT_IMUNISASI: <Syringe className="h-4 w-4 text-teal-500" />,
    PERINGATAN_GIZI: <AlertTriangle className="h-4 w-4 text-amber-500" />,
    UMUM: <MessageSquare className="h-4 w-4 text-slate-500" />,
};

const JENIS_LABELS: Record<string, string> = {
    PENGINGAT_JADWAL: 'Pengingat Jadwal',
    PENGINGAT_IMUNISASI: 'Pengingat Imunisasi',
    PERINGATAN_GIZI: 'Peringatan Gizi',
    UMUM: 'Umum',
};

export default function AdminNotifikasiPage() {
    const [list, setList] = useState<NotifikasiItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
    const [isSending, setIsSending] = useState<string | null>(null);
    const supabase = createClient();

    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(() => { fetchData(); }, []);
    /* eslint-enable react-hooks/exhaustive-deps */

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('notifikasi')
                .select('*, posyandu:posyandu_id(nama)')
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) throw error;
            setList(data || []);
        } catch {
            toast.error('Gagal memuat data notifikasi');
        } finally {
            setIsLoading(false);
        }
    };

    const markAsSent = async (id: string) => {
        setIsSending(id);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { error } = await supabase
                .from('notifikasi')
                .update({
                    status: 'TERKIRIM',
                    dikirim_oleh: user?.id,
                    dikirim_at: new Date().toISOString(),
                })
                .eq('id', id);

            if (error) throw error;
            toast.success('Notifikasi ditandai sudah dikirim');
            fetchData();
        } catch {
            toast.error('Gagal memperbarui status');
        } finally {
            setIsSending(null);
        }
    };

    const filteredList = list.filter(item => {
        if (filterStatus === 'ALL') return true;
        return item.status === filterStatus;
    });

    const totalBelum = list.filter(n => n.status === 'BELUM_DIKIRIM').length;
    const totalTerkirim = list.filter(n => n.status === 'TERKIRIM').length;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Notifikasi WhatsApp</h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Kelola pengiriman notifikasi ke orang tua
                    </p>
                </div>
                <Button variant="ghost" onClick={fetchData}>
                    <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} /> Refresh
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                    title="Total Notifikasi"
                    value={String(list.length)}
                    icon={<Bell className="h-5 w-5" />}
                    color="blue"
                />
                <StatCard
                    title="Belum Dikirim"
                    value={String(totalBelum)}
                    icon={<Clock className="h-5 w-5" />}
                    color="amber"
                />
                <StatCard
                    title="Sudah Terkirim"
                    value={String(totalTerkirim)}
                    icon={<CheckCircle className="h-5 w-5" />}
                    color="teal"
                />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400" />
                {(['ALL', 'BELUM_DIKIRIM', 'TERKIRIM'] as FilterStatus[]).map(status => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={cn(
                            'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                            filterStatus === status
                                ? 'bg-teal-500 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        )}
                    >
                        {status === 'ALL' ? 'Semua' : status === 'BELUM_DIKIRIM' ? 'Belum Dikirim' : 'Terkirim'}
                        {status === 'BELUM_DIKIRIM' && totalBelum > 0 && (
                            <span className="ml-1.5 bg-white/20 px-1.5 py-0.5 rounded-full text-[10px]">{totalBelum}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Notifications List */}
            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="p-5 animate-pulse">
                            <div className="h-4 bg-slate-100 rounded w-32 mb-3" />
                            <div className="h-16 bg-slate-50 rounded" />
                        </Card>
                    ))}
                </div>
            ) : filteredList.length === 0 ? (
                <Card className="p-12 text-center">
                    <Bell className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-sm text-slate-400 mb-1">
                        {filterStatus === 'ALL' ? 'Belum ada notifikasi' : `Tidak ada notifikasi ${filterStatus === 'BELUM_DIKIRIM' ? 'pending' : 'terkirim'}`}
                    </p>
                    <p className="text-xs text-slate-300">
                        Notifikasi akan otomatis dibuat saat ada jadwal atau pengingat imunisasi
                    </p>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filteredList.map(notif => (
                        <Card
                            key={notif.id}
                            className={cn(
                                'p-5 transition-all',
                                notif.status === 'BELUM_DIKIRIM' && 'border-l-4 border-l-amber-400'
                            )}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        {JENIS_ICONS[notif.jenis] || JENIS_ICONS.UMUM}
                                        <span className="text-xs font-semibold text-slate-600">
                                            {JENIS_LABELS[notif.jenis] || notif.jenis}
                                        </span>
                                        <span className={cn(
                                            'text-[10px] font-medium px-2 py-0.5 rounded-full',
                                            notif.status === 'TERKIRIM'
                                                ? 'bg-green-50 text-green-600'
                                                : 'bg-amber-50 text-amber-600'
                                        )}>
                                            {notif.status === 'TERKIRIM' ? '✓ Terkirim' : '● Pending'}
                                        </span>
                                    </div>

                                    <div className="bg-slate-50 rounded-xl p-3 mb-2">
                                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                                            {notif.teks_wa}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3 text-[10px] text-slate-400">
                                        <span>Dibuat: {formatDate(notif.created_at)}</span>
                                        {notif.posyandu?.nama && <span>• {notif.posyandu.nama}</span>}
                                        {notif.dikirim_at && <span>• Dikirim: {formatDate(notif.dikirim_at)}</span>}
                                    </div>
                                </div>

                                {notif.status === 'BELUM_DIKIRIM' && (
                                    <Button
                                        size="sm"
                                        onClick={() => markAsSent(notif.id)}
                                        isLoading={isSending === notif.id}
                                        className="shrink-0"
                                    >
                                        <Send className="h-3.5 w-3.5" /> Kirim
                                    </Button>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Info Box */}
            <Card className="p-4 bg-blue-50/50 border-blue-100">
                <p className="text-xs text-blue-700 leading-relaxed">
                    💡 <strong>Tip:</strong> Notifikasi WhatsApp dikirim secara manual melalui tombol &quot;Kirim&quot;.
                    Salin teks pesan lalu kirimkan melalui WhatsApp ke nomor orang tua yang terdaftar.
                    Setelah terkirim, tandai sebagai &quot;Terkirim&quot; untuk histori.
                </p>
            </Card>
        </div>
    );
}
