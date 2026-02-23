'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import {
    Scale,
    Plus,
    Edit2,
    Trash2,
    RefreshCw,
    Baby,
    ChevronRight,
    Search,
    Info
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface MasterGizi {
    id: string;
    jenis_kelamin: 'L' | 'P';
    umur_bulan: number;
    median: number;
    sd_minus_3: number;
    sd_minus_2: number;
    sd_minus_1: number;
    sd_plus_1: number;
    sd_plus_2: number;
    sd_plus_3: number;
}

export default function AdminGiziClient() {
    const [standards, setStandards] = useState<MasterGizi[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [genderFilter, setGenderFilter] = useState<'All' | 'L' | 'P'>('All');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const supabase = createClient();

    const [formData, setFormData] = useState<Omit<MasterGizi, 'id'>>({
        jenis_kelamin: 'L',
        umur_bulan: 0,
        median: 0,
        sd_minus_3: 0,
        sd_minus_2: 0,
        sd_minus_1: 0,
        sd_plus_1: 0,
        sd_plus_2: 0,
        sd_plus_3: 0
    });

    const fetchStandards = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('master_gizi')
                .select('*')
                .order('jenis_kelamin', { ascending: true })
                .order('umur_bulan', { ascending: true });

            if (error) throw error;
            setStandards(data || []);
        } catch (err) {
            console.error('Error fetching standards:', err);
            toast.error('Gagal memuat standar gizi');
        } finally {
            setIsLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        fetchStandards();
    }, [fetchStandards]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                const { error } = await supabase
                    .from('master_gizi')
                    .update(formData)
                    .eq('id', editingId);
                if (error) throw error;
                toast.success('Standar diperbarui');
            } else {
                const { error } = await supabase
                    .from('master_gizi')
                    .insert(formData);
                if (error) throw error;
                toast.success('Standar ditambahkan');
            }
            setShowForm(false);
            setEditingId(null);
            fetchStandards();
        } catch (err: any) {
            if (err.code === '23505') {
                toast.error('Standar untuk umur & jenis kelamin ini sudah ada');
            } else {
                toast.error('Gagal menyimpan data');
            }
        }
    };

    const handleEdit = (item: MasterGizi) => {
        setFormData({
            jenis_kelamin: item.jenis_kelamin,
            umur_bulan: item.umur_bulan,
            median: item.median,
            sd_minus_3: item.sd_minus_3,
            sd_minus_2: item.sd_minus_2,
            sd_minus_1: item.sd_minus_1,
            sd_plus_1: item.sd_plus_1,
            sd_plus_2: item.sd_plus_2,
            sd_plus_3: item.sd_plus_3
        });
        setEditingId(item.id);
        setShowForm(true);
    };

    const filteredStandards = standards.filter(s => {
        const matchesSearch = s.umur_bulan.toString().includes(searchQuery);
        const matchesGender = genderFilter === 'All' || s.jenis_kelamin === genderFilter;
        return matchesSearch && matchesGender;
    });

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <Scale className="h-6 w-6 text-teal-600" />
                        Master Interpretasi Gizi
                    </h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">Kelola ambang batas Z-Score Standar WHO</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchStandards()}
                        className="bg-white"
                    >
                        <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                        Refresh
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                            setEditingId(null);
                            setShowForm(true);
                        }}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Tambah Standar
                    </Button>
                </div>
            </div>

            {/* Info Card */}
            <Card className="p-4 bg-blue-50/50 border-blue-100 flex items-start gap-4">
                <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="text-xs text-blue-700 leading-relaxed">
                    <p className="font-bold mb-1 underline">Informasi Standar:</p>
                    Data ini digunakan untuk menghitung Z-Score Berat Badan menurut Umur (BB/U).
                    Status gizi ditentukan dengan:
                    <span className="font-bold"> {"<"}-3 (Buruk), -3 s/d -2 (Kurang), -2 s/d +1 (Normal), {">"}+1 (Lebih)</span>.
                    Nilai SD (Standard Deviation) harus sesuai dengan tabel referensi resmi Kemenkes/WHO.
                </div>
            </Card>

            {/* Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari umur (bulan)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 outline-none"
                    />
                </div>
                <div className="flex p-1 bg-slate-100 rounded-xl">
                    {(['All', 'L', 'P'] as const).map((g) => (
                        <button
                            key={g}
                            onClick={() => setGenderFilter(g)}
                            className={cn(
                                "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all",
                                genderFilter === g ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            {g === 'All' ? 'Semua' : g === 'L' ? 'Laki-laki' : 'Perempuan'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            {isLoading ? (
                <div className="h-64 flex flex-col items-center justify-center gap-3">
                    <RefreshCw className="h-8 w-8 text-teal-600 animate-spin" />
                    <p className="text-slate-400 text-sm italic">Memuat referensi standar...</p>
                </div>
            ) : showForm ? (
                <Card className="p-6 border-teal-100 shadow-xl max-w-2xl mx-auto animate-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between mb-6 border-b pb-4">
                        <h2 className="font-bold text-slate-800 flex items-center gap-2">
                            <Plus className="h-4 w-4 text-teal-600" />
                            {editingId ? 'Edit Referensi' : 'Tambah Referensi Baru'}
                        </h2>
                        <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-800">
                            Batal
                        </Button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Jenis Kelamin</label>
                                <select
                                    value={formData.jenis_kelamin}
                                    onChange={(e) => setFormData(p => ({ ...p, jenis_kelamin: e.target.value as 'L' | 'P' }))}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500/20"
                                >
                                    <option value="L">Laki-laki</option>
                                    <option value="P">Perempuan</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Umur (Bulan)</label>
                                <input
                                    type="number"
                                    required
                                    value={formData.umur_bulan}
                                    onChange={(e) => setFormData(p => ({ ...p, umur_bulan: parseInt(e.target.value) }))}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500/20"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Median (Kg)</label>
                                <input
                                    type="number" step="0.01" required
                                    value={formData.median}
                                    onChange={(e) => setFormData(p => ({ ...p, median: parseFloat(e.target.value) }))}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500/20"
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Standar Deviasi (SD) Weight</h3>
                            <div className="grid grid-cols-3 gap-4">
                                {(['sd_minus_3', 'sd_minus_2', 'sd_minus_1', 'sd_plus_1', 'sd_plus_2', 'sd_plus_3'] as const).map((field) => (
                                    <div key={field} className="space-y-1.5 focus-within:scale-105 transition-transform">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter pl-1">
                                            {field.replace(/_/g, ' ').toUpperCase()}
                                        </label>
                                        <input
                                            type="number" step="0.01" required
                                            value={formData[field]}
                                            onChange={(e) => setFormData(p => ({ ...p, [field]: parseFloat(e.target.value) }))}
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500/20"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold h-11 rounded-xl shadow-lg shadow-teal-500/20">
                            {editingId ? 'Simpan Perubahan' : 'Tambah Referensi'}
                        </Button>
                    </form>
                </Card>
            ) : filteredStandards.length === 0 ? (
                <div className="py-20 text-center">
                    <Scale className="h-12 w-12 text-slate-100 mx-auto mb-4" />
                    <p className="text-slate-400 font-medium">Belum ada standar gizi yang tercatat.</p>
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-200">
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Umur (Bln)</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">JK</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center bg-teal-50/30">Median</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">SD -1 s/d -3</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">SD +1 s/d +3</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredStandards.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-white border border-transparent group-hover:border-slate-200 transition-all">
                                                <Baby className="h-4 w-4 text-slate-500" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-700">{item.umur_bulan} bln</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={cn(
                                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                                            item.jenis_kelamin === 'L' ? "bg-blue-100 text-blue-600" : "bg-rose-100 text-rose-600"
                                        )}>
                                            {item.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center bg-teal-50/20">
                                        <span className="text-sm font-black text-teal-600">{item.median} kg</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-rose-500">
                                            <span>{item.sd_minus_1}</span>
                                            <ChevronRight className="h-3 w-3 opacity-30" />
                                            <span>{item.sd_minus_2}</span>
                                            <ChevronRight className="h-3 w-3 opacity-30" />
                                            <span>{item.sd_minus_3}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-emerald-600">
                                            <span>{item.sd_plus_1}</span>
                                            <ChevronRight className="h-3 w-3 opacity-30" />
                                            <span>{item.sd_plus_2}</span>
                                            <ChevronRight className="h-3 w-3 opacity-30" />
                                            <span>{item.sd_plus_3}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEdit(item)}
                                                className="h-8 w-8 p-0 text-slate-400 hover:text-teal-600 hover:bg-teal-50"
                                            >
                                                <Edit2 className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
