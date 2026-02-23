'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Clock, Calendar, ChevronRight, User } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn, formatDate } from '@/lib/utils';
import Link from 'next/link';

interface UpcomingTask {
    id: string;
    type: 'IMUNISASI' | 'KUNJUNGAN';
    name: string;
    date: string;
    description: string;
    patientId: string;
}

export function UpcomingSchedule({ posyanduId }: { posyanduId: string }) {
    const [tasks, setTasks] = useState<UpcomingTask[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        if (!posyanduId) return;
        fetchUpcoming();
    }, [posyanduId]);

    const fetchUpcoming = async () => {
        setIsLoading(true);
        try {
            // 1. Fetch upcoming immunizations
            const { data: imunData } = await supabase
                .from('imunisasi_balita')
                .select('id, balita_id, tanggal_jadwal, status, balita:balita_id(nama), master:master_imun_id(nama)')
                .eq('status', 'BELUM')
                .gte('tanggal_jadwal', new Date().toISOString().split('T')[0])
                .order('tanggal_jadwal', { ascending: true })
                .limit(3);

            const upcomingTasks: UpcomingTask[] = (imunData || []).map((item: any) => ({
                id: item.id,
                type: 'IMUNISASI',
                name: item.balita?.nama || 'Anonim',
                date: item.tanggal_jadwal,
                description: `Imunisasi: ${item.master?.nama}`,
                patientId: item.balita_id
            }));

            setTasks(upcomingTasks);
        } catch (error) {
            console.error('Error fetching upcoming schedule:', error);
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

    if (tasks.length === 0) return null;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-teal-600" />
                    Jadwal Terdekat
                </h2>
            </div>
            <div className="space-y-2">
                {tasks.map((task) => (
                    <Link key={task.id} href={`/kader/balita/${task.patientId}`}>
                        <Card className="p-3 border-transparent bg-white shadow-sm hover:shadow-md transition-all group active:scale-[0.98]">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-teal-50 rounded-xl flex items-center justify-center shrink-0 border border-teal-100">
                                    <Clock className="h-5 w-5 text-teal-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className="text-sm font-bold text-slate-800 truncate">{task.name}</h3>
                                        <span className="text-[10px] font-black text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                            {formatDate(task.date)}
                                        </span>
                                    </div>
                                    <p className="text-[11px] font-medium text-slate-500 truncate mt-0.5">{task.description}</p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-teal-500 group-hover:translate-x-1 transition-all" />
                            </div>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
