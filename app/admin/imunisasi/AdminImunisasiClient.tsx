'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Syringe, Plus, X, Edit, ToggleLeft, ToggleRight, GripVertical } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface ImunisasiItem {
    id: string;
    nama: string;
    usia_bulan: number;
    toleransi_minggu: number;
    urutan: number;
    is_active: boolean;
    created_at: string;
}

export default function AdminImunisasiPage() {
    const [list, setList] = useState<ImunisasiItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const supabase = createClient();

    const [formData, setFormData] = useState({
        nama: '',
        usia_bulan: '',
        toleransi_minggu: '4',
        urutan: '',
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(() => { fetchData(); }, []);
    /* eslint-enable react-hooks/exhaustive-deps */

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('master_imunisasi')
                .select('*')
                .order('urutan', { ascending: true });

            if (error) throw error;
            setList(data || []);
        } catch {
            toast.error('Gagal memuat data imunisasi');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFormChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: '' }));
    };

    const validateForm = () => {
        const errors: Record<string, string> = {};
        if (!formData.nama.trim()) errors.nama = 'Nama vaksin wajib diisi';
        if (!formData.usia_bulan) errors.usia_bulan = 'Usia pemberian wajib diisi';
        if (!formData.urutan) errors.urutan = 'Urutan wajib diisi';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const resetForm = () => {
        setFormData({ nama: '', usia_bulan: '', toleransi_minggu: '4', urutan: '' });
        setFormErrors({});
        setEditId(null);
        setShowForm(false);
    };

    const openEditForm = (item: ImunisasiItem) => {
        setFormData({
            nama: item.nama,
            usia_bulan: String(item.usia_bulan),
            toleransi_minggu: String(item.toleransi_minggu),
            urutan: String(item.urutan),
        });
        setEditId(item.id);
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSaving(true);
        try {
            const payload = {
                nama: formData.nama.trim(),
                usia_bulan: parseInt(formData.usia_bulan),
                toleransi_minggu: parseInt(formData.toleransi_minggu) || 4,
                urutan: parseInt(formData.urutan),
            };

            if (editId) {
                const { error } = await supabase.from('master_imunisasi').update(payload).eq('id', editId);
                if (error) throw error;
                toast.success('Data imunisasi diperbarui!');
            } else {
                const { data: { user } } = await supabase.auth.getUser();
                const { error } = await supabase.from('master_imunisasi').insert({
                    ...payload,
                    created_by: user?.id,
                });
                if (error) throw error;
                toast.success('Vaksin baru ditambahkan!');
            }

            resetForm();
            fetchData();
        } catch {
            toast.error('Gagal menyimpan data');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleActive = async (item: ImunisasiItem) => {
        try {
            const { error } = await supabase
                .from('master_imunisasi')
                .update({ is_active: !item.is_active })
                .eq('id', item.id);

            if (error) throw error;
            toast.success(item.is_active ? 'Vaksin dinonaktifkan' : 'Vaksin diaktifkan');
            fetchData();
        } catch {
            toast.error('Gagal mengubah status');
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Master Imunisasi</h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Kelola daftar vaksin dan jadwal imunisasi
                    </p>
                </div>
                <Button onClick={() => { resetForm(); setShowForm(true); }}>
                    <Plus className="h-4 w-4" /> Tambah Vaksin
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="p-4 flex items-center gap-3">
                    <div className="p-2.5 bg-teal-50 rounded-xl">
                        <Syringe className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-800">{list.length}</p>
                        <p className="text-xs text-slate-400">Total Vaksin</p>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-3">
                    <div className="p-2.5 bg-green-50 rounded-xl">
                        <ToggleRight className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-800">{list.filter(v => v.is_active).length}</p>
                        <p className="text-xs text-slate-400">Aktif</p>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-3">
                    <div className="p-2.5 bg-red-50 rounded-xl">
                        <ToggleLeft className="h-5 w-5 text-red-400" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-800">{list.filter(v => !v.is_active).length}</p>
                        <p className="text-xs text-slate-400">Nonaktif</p>
                    </div>
                </Card>
            </div>

            {/* Table */}
            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-800 text-white">
                                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider">#</th>
                                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider">Nama Vaksin</th>
                                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider">Usia (bulan)</th>
                                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider">Toleransi (minggu)</th>
                                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider">Status</th>
                                <th className="text-center px-4 py-3 font-semibold text-xs uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i} className="border-b border-slate-50">
                                        <td colSpan={6} className="px-4 py-4">
                                            <div className="h-4 bg-slate-100 rounded animate-pulse" />
                                        </td>
                                    </tr>
                                ))
                            ) : list.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-slate-400">
                                        <Syringe className="h-10 w-10 mx-auto mb-3 text-slate-200" />
                                        <p>Belum ada data master imunisasi</p>
                                    </td>
                                </tr>
                            ) : (
                                list.map((item, idx) => (
                                    <tr key={item.id} className={cn(
                                        'border-b border-slate-50 transition-colors',
                                        idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white',
                                        !item.is_active && 'opacity-50'
                                    )}>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1 text-slate-400">
                                                <GripVertical className="h-3.5 w-3.5" />
                                                <span className="font-medium">{item.urutan}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-slate-700">{item.nama}</td>
                                        <td className="px-4 py-3 text-slate-600">
                                            <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-xs font-medium">
                                                {item.usia_bulan} bulan
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-500">{item.toleransi_minggu} minggu</td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => toggleActive(item)}
                                                className={cn(
                                                    'flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-colors',
                                                    item.is_active
                                                        ? 'bg-green-50 text-green-600 hover:bg-green-100'
                                                        : 'bg-red-50 text-red-500 hover:bg-red-100'
                                                )}
                                            >
                                                {item.is_active ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                                                {item.is_active ? 'Aktif' : 'Nonaktif'}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => openEditForm(item)}
                                                className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors text-blue-500"
                                                title="Edit"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={resetForm} />
                    <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl animate-slide-up">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-slate-800">
                                {editId ? 'Edit Vaksin' : 'Tambah Vaksin Baru'}
                            </h2>
                            <button onClick={resetForm} className="p-1 hover:bg-slate-100 rounded-lg">
                                <X className="h-5 w-5 text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                label="Nama Vaksin"
                                placeholder="Contoh: BCG, DPT-HB-Hib 1"
                                value={formData.nama}
                                onChange={e => handleFormChange('nama', e.target.value)}
                                error={formErrors.nama}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Usia Pemberian (bulan)"
                                    type="number"
                                    placeholder="0"
                                    value={formData.usia_bulan}
                                    onChange={e => handleFormChange('usia_bulan', e.target.value)}
                                    error={formErrors.usia_bulan}
                                />
                                <Input
                                    label="Toleransi (minggu)"
                                    type="number"
                                    placeholder="4"
                                    value={formData.toleransi_minggu}
                                    onChange={e => handleFormChange('toleransi_minggu', e.target.value)}
                                />
                            </div>
                            <Input
                                label="Urutan"
                                type="number"
                                placeholder="Urutan tampil"
                                value={formData.urutan}
                                onChange={e => handleFormChange('urutan', e.target.value)}
                                error={formErrors.urutan}
                            />

                            <div className="pt-2">
                                <Button type="submit" className="w-full" isLoading={isSaving}>
                                    {editId ? 'Simpan Perubahan' : 'Tambah Vaksin'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
