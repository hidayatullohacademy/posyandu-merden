'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Clock, Calendar, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn, formatDate } from '@/lib/utils';
import Link from 'next/link';

interface UpcomingVaccine {
    id: string;
    childName: string;
    vaccineName: string;
    date: string;
    childId: string;
}

export function UpcomingVaccines() {
    const [vaccines, setVaccines] = useState<UpcomingVaccine[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchUpcoming();
    }, []);

    const fetchUpcoming = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Get linked children
            const { data: links } = await supabase
                .from('orang_tua_balita')
                .select('balita_id')
                .eq('user_id', user.id);

            if (!links || links.length === 0) {
                setVaccines([]);
                return;
            }

            const balitaIds = links.map((l: { balita_id: string }) => l.balita_id);

            // 2. Fetch upcoming immunizations for these children
            const { data: imunData } = await supabase
                .from('imunisasi_balita')
                .select(`
                    id, 
                    balita_id, 
                    tanggal_jadwal, 
                    status, 
                    balita:balita_id(nama), 
                    master:master_imun_id(nama)
                `)
                .in('balita_id', balitaIds)
                .eq('status', 'BELUM')
                .gte('tanggal_jadwal', new Date().toISOString().split('T')[0])
                .order('tanggal_jadwal', { ascending: true })
                .limit(3);

            const upcoming: UpcomingVaccine[] = (imunData || []).map((item: any) => ({
                id: item.id,
                childName: item.balita?.nama || 'Anak',
                vaccineName: item.master?.nama || 'Vaksin',
                date: item.tanggal_jadwal,
                childId: item.balita_id
            }));

            setVaccines(upcoming);
        } catch (error) {
            console.error('Error fetching upcoming vaccines:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return (
        <div className="space-y-3">
            <div className="h-6 w-32 bg-slate-100 rounded animate-pulse" />
            <div className="space-y-2">
                {[1, 2].map(i => (
                    <div key={i} className="h-20 bg-white rounded-2xl border border-slate-100 animate-pulse" />
                ))}
            </div>
        </div>
    );

    if (vaccines.length === 0) return null;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-orange-500" />
                    Vaksin Berikutnya
                </h2>
            </div>
            <div className="space-y-2">
                {vaccines.map((v) => (
                    <Link key={v.id} href={`/ortu/anak/${v.childId}`}>
                        <Card className="p-3 border-transparent bg-white shadow-sm hover:shadow-md transition-all group active:scale-[0.98]">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-orange-50 rounded-xl flex items-center justify-center shrink-0 border border-orange-100">
                                    <Clock className="h-5 w-5 text-orange-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className="text-sm font-bold text-slate-700 truncate">{v.childName}</h3>
                                        <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                            {formatDate(v.date)}
                                        </span>
                                    </div>
                                    <p className="text-[11px] font-medium text-slate-500 truncate mt-0.5">Jadwal: {v.vaccineName}</p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                            </div>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
