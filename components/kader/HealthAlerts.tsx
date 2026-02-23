'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { AlertTriangle, ChevronRight, Activity, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface HealthAlert {
    id: string;
    type: 'BALITA' | 'LANSIA';
    name: string;
    reason: string;
    severity: 'CRITICAL' | 'WARNING';
}

export function HealthAlerts({ posyanduId }: { posyanduId: string }) {
    const [alerts, setAlerts] = useState<HealthAlert[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        if (!posyanduId) return;
        fetchAlerts();
    }, [posyanduId]);

    const fetchAlerts = async () => {
        setIsLoading(true);
        try {
            // 1. Fetch Balita with potential risks (Status Gizi Kurang/Buruk)
            const { data: balitaRes } = await supabase
                .from('kunjungan_balita')
                .select('balita_id, status_gizi, balita:balita_id(nama, posyandu_id)')
                .eq('balita.posyandu_id', posyanduId)
                .in('status_gizi', ['KURANG', 'BURUK'])
                .order('created_at', { ascending: false })
                .limit(2);

            // 2. Fetch Lansia with critical vitals
            // Simplified for now: just looking for 'perlu_rujukan'
            const { data: lansiaRes } = await supabase
                .from('kunjungan_lansia')
                .select('lansia_id, perlu_rujukan, keluhan, lansia:lansia_id(nama_lengkap, posyandu_id)')
                .eq('lansia.posyandu_id', posyanduId)
                .eq('perlu_rujukan', true)
                .order('created_at', { ascending: false })
                .limit(2);

            const newAlerts: HealthAlert[] = [];

            (balitaRes || []).forEach((item: any) => {
                if (!item.balita) return;
                newAlerts.push({
                    id: item.balita_id,
                    type: 'BALITA',
                    name: item.balita.nama,
                    reason: `Gizi ${item.status_gizi.toLowerCase()}`,
                    severity: item.status_gizi === 'BURUK' ? 'CRITICAL' : 'WARNING'
                });
            });

            (lansiaRes || []).forEach((item: any) => {
                if (!item.lansia) return;
                newAlerts.push({
                    id: item.lansia_id,
                    type: 'LANSIA',
                    name: item.lansia.nama_lengkap,
                    reason: 'Memerlukan Rujukan',
                    severity: 'CRITICAL'
                });
            });

            setAlerts(newAlerts);
        } catch (error) {
            console.error('Error fetching health alerts:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return (
        <div className="space-y-3">
            <div className="h-6 w-40 bg-slate-100 rounded animate-pulse" />
            <div className="space-y-2">
                {[1, 2].map(i => (
                    <div key={i} className="h-20 bg-white rounded-2xl border border-slate-100 animate-pulse" />
                ))}
            </div>
        </div>
    );

    if (alerts.length === 0) return null;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                    Peringatan Kesehatan
                </h2>
            </div>
            <div className="space-y-2">
                {alerts.map((alert) => (
                    <Link key={alert.id} href={`/kader/${alert.type.toLowerCase()}/${alert.id}`}>
                        <Card className={cn(
                            "p-3 border-l-4 transition-all group active:scale-[0.98]",
                            alert.severity === 'CRITICAL'
                                ? "border-l-rose-500 bg-rose-50/30 hover:bg-rose-50"
                                : "border-l-amber-500 bg-amber-50/30 hover:bg-amber-50"
                        )}>
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border",
                                    alert.severity === 'CRITICAL'
                                        ? "bg-rose-100 text-rose-600 border-rose-200"
                                        : "bg-amber-100 text-amber-600 border-amber-200"
                                )}>
                                    {alert.severity === 'CRITICAL' ? <Activity className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className="text-sm font-bold text-slate-800 truncate">{alert.name}</h3>
                                        <span className={cn(
                                            "text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter",
                                            alert.severity === 'CRITICAL'
                                                ? "bg-rose-500 text-white"
                                                : "bg-amber-500 text-white"
                                        )}>
                                            {alert.severity}
                                        </span>
                                    </div>
                                    <p className="text-[11px] font-semibold text-slate-600 mt-0.5">{alert.reason}</p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 transition-all" />
                            </div>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
