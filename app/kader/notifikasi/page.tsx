'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Bell, ArrowLeft, Search, Filter, Mail, CheckCircle2, Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn, formatDate } from '@/lib/utils';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface NotifikasiItem {
    id: string;
    jenis: string;
    teks_wa: string;
    status: 'BELUM_DIKIRIM' | 'TERKIRIM';
    created_at: string;
    dikirim_at: string | null;
}

export default function KaderNotifikasiPage() {
    const [notifList, setNotifList] = useState<NotifikasiItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const supabase = createClient();

    useEffect(() => {
        fetchNotifikasi();
    }, []);

    const fetchNotifikasi = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: userData } = await supabase
                .from('users')
                .select('posyandu_id')
                .eq('id', user.id)
                .single();

            if (!userData?.posyandu_id) return;

            const { data, error } = await supabase
                .from('notifikasi')
                .select('*')
                .eq('posyandu_id', userData.posyandu_id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setNotifList(data || []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            toast.error('Gagal memuat notifikasi');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredNotif = notifList.filter(n =>
        n.teks_wa.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.jenis.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-20 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/kader/dashboard">
                    <Button variant="ghost" size="sm" className="rounded-full h-10 w-10 p-0 bg-white shadow-sm border border-slate-100">
                        <ArrowLeft className="h-5 w-5 text-slate-600" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Pesan Sistem</h1>
                    <p className="text-xs text-slate-500 font-medium">Riwayat pengingat & pesan otomatis</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Cari pesan atau jenis..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 animate-pulse">
                            <div className="flex gap-4">
                                <div className="h-10 w-10 rounded-full bg-slate-100 shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-slate-100 rounded w-1/4" />
                                    <div className="h-3 bg-slate-50 rounded w-3/4" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredNotif.length === 0 ? (
                <Card className="p-12 text-center">
                    <div className="bg-slate-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100/50">
                        <Mail className="h-8 w-8 text-slate-300" />
                    </div>
                    <h3 className="text-slate-600 font-bold mb-1">Belum Ada Pesan</h3>
                    <p className="text-slate-400 text-xs max-w-[200px] mx-auto leading-relaxed">
                        Pesan otomatis untuk pengingat jadwal akan muncul di sini.
                    </p>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filteredNotif.map((notif) => (
                        <Card key={notif.id} className="p-4 border border-slate-100 hover:shadow-md transition-all">
                            <div className="flex gap-4">
                                <div className={cn(
                                    "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border",
                                    notif.status === 'TERKIRIM'
                                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                        : "bg-amber-50 text-amber-600 border-amber-100"
                                )}>
                                    <Bell className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            {notif.jenis.replace(/_/g, ' ')}
                                        </span>
                                        <span className="text-[10px] font-medium text-slate-400">
                                            {formatDate(notif.created_at)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-700 font-medium leading-relaxed mb-3">
                                        {notif.teks_wa}
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tight border",
                                            notif.status === 'TERKIRIM'
                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200/50"
                                                : "bg-amber-50 text-amber-700 border-amber-200/50"
                                        )}>
                                            {notif.status === 'TERKIRIM' ? (
                                                <><CheckCircle2 className="h-3 w-3" /> Terkirim</>
                                            ) : (
                                                <><Clock className="h-3 w-3" /> Menunggu</>
                                            )}
                                        </div>
                                        {notif.dikirim_at && (
                                            <span className="text-[9px] font-medium text-slate-400 italic">
                                                Dikirim pada {formatDate(notif.dikirim_at)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
