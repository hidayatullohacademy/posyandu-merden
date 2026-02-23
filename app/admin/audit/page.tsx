'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import {
    History,
    Search,
    Tag,
    Info,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    Download
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn, formatDateTime } from '@/lib/utils';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

interface AuditLog {
    id: string;
    created_at: string;
    user_name: string;
    role: string;
    action: string;
    entity_type: string;
    entity_id: string;
    details: any;
    ip_address: string;
    posyandu_id: string;
}

const ACTION_COLORS: Record<string, string> = {
    CREATE: 'bg-green-100 text-green-700',
    UPDATE: 'bg-blue-100 text-blue-700',
    DELETE: 'bg-red-100 text-red-700',
    EXPORT: 'bg-purple-100 text-purple-700',
    BROADCAST: 'bg-amber-100 text-amber-700',
    LOGIN: 'bg-slate-100 text-slate-700',
};

export default function AdminAuditPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        action: '',
        entityType: '',
        dateRange: 'all', // all, today, week, month
    });
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const itemsPerPage = 20;

    const supabase = createClient();

    const fetchLogs = useCallback(async () => {
        setIsLoading(true);
        try {
            let query = supabase
                .from('audit_logs')
                .select('*', { count: 'exact' });

            // Apply Filters
            if (filters.action) query = query.eq('action', filters.action);
            if (filters.entityType) query = query.eq('entity_type', filters.entityType);

            if (filters.dateRange !== 'all') {
                const now = new Date();
                const startDate = new Date();
                if (filters.dateRange === 'today') startDate.setHours(0, 0, 0, 0);
                else if (filters.dateRange === 'week') startDate.setDate(now.getDate() - 7);
                else if (filters.dateRange === 'month') startDate.setMonth(now.getMonth() - 1);

                query = query.gte('created_at', startDate.toISOString());
            }

            if (searchQuery) {
                query = query.or(`user_name.ilike.%${searchQuery}%,action.ilike.%${searchQuery}%,entity_type.ilike.%${searchQuery}%`);
            }

            const { data, error, count } = await query
                .order('created_at', { ascending: false })
                .range((page - 1) * itemsPerPage, page * itemsPerPage - 1);

            if (error) throw error;
            setLogs(data || []);
            setTotalCount(count || 0);
        } catch (err) {
            console.error('Error fetching logs:', err);
            toast.error('Gagal memuat log audit');
        } finally {
            setIsLoading(false);
        }
    }, [page, filters, searchQuery, supabase]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleExport = () => {
        if (logs.length === 0) return;

        const exportData = logs.map(log => ({
            'Waktu': formatDateTime(log.created_at, 'Pp'),
            'User': log.user_name,
            'Role': log.role,
            'Aksi': log.action,
            'Entitas': log.entity_type,
            'ID Entitas': log.entity_id,
            'Detail': JSON.stringify(log.details),
            'IP Address': log.ip_address
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Audit Logs");
        XLSX.writeFile(wb, `Audit_Logs_${new Date().toISOString().slice(0, 10)}.xlsx`);
        toast.success('Log berhasil diekspor');
    };

    const totalPages = Math.ceil(totalCount / itemsPerPage);

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <History className="h-6 w-6 text-teal-600" />
                        Audit Log System
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Lacak semua aktivitas dan perubahan data dalam sistem</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchLogs()}
                        className="bg-white"
                    >
                        <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                        Refresh
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={handleExport}
                        disabled={logs.length === 0}
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Ekspor Excel
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card className="p-4 bg-white border-slate-200 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari user, aksi..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-50"
                        />
                    </div>

                    <select
                        value={filters.action}
                        onChange={(e) => setFilters(p => ({ ...p, action: e.target.value }))}
                        className="bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500/20"
                    >
                        <option value="">Semua Aksi</option>
                        <option value="CREATE">CREATE</option>
                        <option value="UPDATE">UPDATE</option>
                        <option value="DELETE">DELETE</option>
                        <option value="EXPORT">EXPORT</option>
                        <option value="BROADCAST">BROADCAST</option>
                    </select>

                    <select
                        value={filters.entityType}
                        onChange={(e) => setFilters(p => ({ ...p, entityType: e.target.value }))}
                        className="bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500/20"
                    >
                        <option value="">Semua Entitas</option>
                        <option value="USER">USER</option>
                        <option value="BALITA">BALITA</option>
                        <option value="LANSIA">LANSIA</option>
                        <option value="VAKSIN">VAKSIN</option>
                        <option value="LAPORAN">LAPORAN</option>
                        <option value="POSYANDU">POSYANDU</option>
                    </select>

                    <select
                        value={filters.dateRange}
                        onChange={(e) => setFilters(p => ({ ...p, dateRange: e.target.value }))}
                        className="bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500/20"
                    >
                        <option value="all">Semua Waktu</option>
                        <option value="today">Hari Ini</option>
                        <option value="week">7 Hari Terakhir</option>
                        <option value="month">30 Hari Terakhir</option>
                    </select>
                </div>
            </Card>

            {/* Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x_auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-200">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Waktu</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Entitas</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Detail</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">IP Address</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-6 py-4">
                                            <div className="h-4 bg-slate-100 rounded w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                        Tidak ada log ditemukan
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-xs font-medium text-slate-600">
                                                {formatDateTime(log.created_at, 'Pp')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="h-7 w-7 rounded-full bg-teal-50 flex items-center justify-center text-[10px] font-bold text-teal-600">
                                                    {log.user_name?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-slate-700">{log.user_name || 'System'}</div>
                                                    <div className="text-[10px] text-slate-400 uppercase tracking-tighter">{log.role}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={cn(
                                                "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                                ACTION_COLORS[log.action] || 'bg-slate-100 text-slate-600'
                                            )}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5 font-medium text-slate-600 text-xs">
                                                <Tag className="h-3 w-3 text-slate-400" />
                                                {log.entity_type}
                                                <span className="text-[10px] text-slate-300 font-mono">#{log.entity_id?.slice(0, 8)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs text-slate-500 max-w-xs truncate">
                                                {typeof log.details === 'object'
                                                    ? Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(', ')
                                                    : log.details}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                                                <Info className="h-3 w-3" />
                                                {log.ip_address || '—'}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-200 flex items-center justify-between">
                        <p className="text-xs text-slate-500">
                            Menampilkan <span className="font-bold">{(page - 1) * itemsPerPage + 1}</span> - <span className="font-bold">{Math.min(page * itemsPerPage, totalCount)}</span> dari <span className="font-bold">{totalCount}</span> log
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-xs font-bold text-slate-600 px-2">
                                {page} / {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
