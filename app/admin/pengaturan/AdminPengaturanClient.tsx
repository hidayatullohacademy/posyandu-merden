'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Settings, Building2, Clock, MapPin, Save, Plus, Edit, X, ToggleRight, ToggleLeft, Shield } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { logAudit } from '@/lib/audit';
import toast from 'react-hot-toast';

interface PosyanduItem {
    id: string;
    nama: string;
    alamat: string;
    rt_rw: string;
    kelurahan: string;
    kecamatan: string;
    hari_buka: string;
    jam_buka: string;
    jam_tutup: string;
    is_active: boolean;
}

export default function AdminPengaturanPage() {
    const [posyanduList, setPosyanduList] = useState<PosyanduItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'posyandu' | 'info'>('posyandu');
    const supabase = createClient();

    const [formData, setFormData] = useState({
        nama: '',
        alamat: '',
        rt_rw: '',
        kelurahan: 'Merden',
        kecamatan: 'Purwanegara',
        hari_buka: '',
        jam_buka: '08:00',
        jam_tutup: '12:00',
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(() => { fetchData(); }, []);
    /* eslint-enable react-hooks/exhaustive-deps */

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('posyandu')
                .select('*');

            if (error) throw error;
            const sortedData = (data || []).sort((a: any, b: any) =>
                a.nama.localeCompare(b.nama, undefined, { numeric: true, sensitivity: 'base' })
            );
            setPosyanduList(sortedData);
        } catch {
            toast.error('Gagal memuat data posyandu');
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
        if (!formData.nama.trim()) errors.nama = 'Nama posyandu wajib diisi';
        if (!formData.alamat.trim()) errors.alamat = 'Alamat wajib diisi';
        if (!formData.hari_buka.trim()) errors.hari_buka = 'Hari buka wajib diisi';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const resetForm = () => {
        setFormData({
            nama: '', alamat: '', rt_rw: '', kelurahan: 'Merden',
            kecamatan: 'Purwanegara', hari_buka: '', jam_buka: '08:00', jam_tutup: '12:00',
        });
        setFormErrors({});
        setEditId(null);
        setShowForm(false);
    };

    const openEditForm = (item: PosyanduItem) => {
        setFormData({
            nama: item.nama,
            alamat: item.alamat,
            rt_rw: item.rt_rw || '',
            kelurahan: item.kelurahan || 'Merden',
            kecamatan: item.kecamatan || 'Purwanegara',
            hari_buka: item.hari_buka,
            jam_buka: item.jam_buka || '08:00',
            jam_tutup: item.jam_tutup || '12:00',
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
                alamat: formData.alamat.trim(),
                rt_rw: formData.rt_rw.trim(),
                kelurahan: formData.kelurahan.trim(),
                kecamatan: formData.kecamatan.trim(),
                hari_buka: formData.hari_buka.trim(),
                jam_buka: formData.jam_buka,
                jam_tutup: formData.jam_tutup,
            };

            if (editId) {
                const { error } = await supabase.from('posyandu').update(payload).eq('id', editId);
                if (error) throw error;

                await logAudit({
                    action: 'UPDATE',
                    entityType: 'POSYANDU',
                    entityId: editId,
                    details: { name: payload.nama }
                });

                toast.success('Data posyandu diperbarui!');
            } else {
                const { error } = await supabase.from('posyandu').insert(payload);
                if (error) throw error;

                await logAudit({
                    action: 'CREATE',
                    entityType: 'POSYANDU',
                    details: { name: payload.nama }
                });

                toast.success('Posyandu baru ditambahkan!');
            }

            resetForm();
            fetchData();
        } catch {
            toast.error('Gagal menyimpan data');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleActive = async (item: PosyanduItem) => {
        try {
            const { error } = await supabase
                .from('posyandu')
                .update({ is_active: !item.is_active })
                .eq('id', item.id);

            if (error) throw error;
            toast.success(item.is_active ? 'Posyandu dinonaktifkan' : 'Posyandu diaktifkan');
            fetchData();
        } catch {
            toast.error('Gagal mengubah status');
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Pengaturan</h1>
                <p className="text-sm text-slate-400 mt-1">
                    Konfigurasi data Posyandu dan pengaturan sistem
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
                <button
                    onClick={() => setActiveTab('posyandu')}
                    className={cn(
                        'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                        activeTab === 'posyandu'
                            ? 'bg-white text-teal-700 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                    )}
                >
                    <Building2 className="h-4 w-4" />
                    Data Posyandu
                </button>
                <button
                    onClick={() => setActiveTab('info')}
                    className={cn(
                        'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                        activeTab === 'info'
                            ? 'bg-white text-teal-700 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                    )}
                >
                    <Settings className="h-4 w-4" />
                    Info Aplikasi
                </button>
            </div>

            {/* Posyandu Tab */}
            {activeTab === 'posyandu' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-500">{posyanduList.length} posyandu terdaftar</p>
                        <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
                            <Plus className="h-4 w-4" /> Tambah Posyandu
                        </Button>
                    </div>

                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2].map(i => (
                                <Card key={i} className="p-5 animate-pulse">
                                    <div className="h-5 bg-slate-100 rounded w-40 mb-3" />
                                    <div className="h-4 bg-slate-50 rounded w-64" />
                                </Card>
                            ))}
                        </div>
                    ) : posyanduList.length === 0 ? (
                        <Card className="p-12 text-center">
                            <Building2 className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-sm text-slate-400 mb-3">Belum ada posyandu terdaftar</p>
                            <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
                                <Plus className="h-4 w-4" /> Tambah Posyandu Pertama
                            </Button>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {posyanduList.map(pos => (
                                <Card key={pos.id} className={cn(
                                    'p-5 transition-all',
                                    !pos.is_active && 'opacity-50'
                                )}>
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-slate-800">{pos.nama}</h3>
                                                <span className={cn(
                                                    'text-[10px] font-medium px-2 py-0.5 rounded-full',
                                                    pos.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                                                )}>
                                                    {pos.is_active ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </div>

                                            <div className="space-y-1 mt-2">
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                                    <span>{pos.alamat}{pos.rt_rw ? `, RT/RW ${pos.rt_rw}` : ''}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                                                    <span>{pos.hari_buka} • {pos.jam_buka} – {pos.jam_tutup}</span>
                                                </div>
                                                <p className="text-xs text-slate-400">
                                                    {pos.kelurahan}, {pos.kecamatan}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                onClick={() => toggleActive(pos)}
                                                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                                                title={pos.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                            >
                                                {pos.is_active
                                                    ? <ToggleRight className="h-5 w-5 text-green-500" />
                                                    : <ToggleLeft className="h-5 w-5 text-slate-300" />
                                                }
                                            </button>
                                            <button
                                                onClick={() => openEditForm(pos)}
                                                className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors text-blue-500"
                                                title="Edit"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Info Tab */}
            {activeTab === 'info' && (
                <div className="space-y-4">
                    <Card className="p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl shadow-lg shadow-teal-500/20">
                                <Shield className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">Posyandu ILP Digital</h2>
                                <p className="text-xs text-slate-400">Desa Merden, Kec. Purwanegara</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 rounded-xl p-4">
                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Versi Aplikasi</p>
                                    <p className="text-sm font-bold text-slate-700">1.0.0</p>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-4">
                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Platform</p>
                                    <p className="text-sm font-bold text-slate-700">Web (PWA)</p>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-4">
                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Database</p>
                                    <p className="text-sm font-bold text-slate-700">Supabase</p>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-4">
                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Framework</p>
                                    <p className="text-sm font-bold text-slate-700">Next.js 16</p>
                                </div>
                            </div>

                            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl p-4 border border-teal-100">
                                <h3 className="text-xs font-bold text-teal-700 mb-2">Tentang Aplikasi</h3>
                                <p className="text-xs text-teal-600 leading-relaxed">
                                    Sistem digital pengelolaan layanan kesehatan Posyandu ILP (Integrasi Layanan Primer)
                                    Desa Merden untuk monitoring tumbuh kembang Balita dan kesehatan Lansia.
                                    Aplikasi ini mendukung pencatatan kunjungan, tracking imunisasi,
                                    manajemen jadwal, pelaporan bulanan, dan notifikasi WhatsApp.
                                </p>
                            </div>

                            <div className="bg-slate-50 rounded-xl p-4">
                                <h3 className="text-xs font-bold text-slate-600 mb-3">Fitur Utama</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        'Manajemen Balita & Lansia',
                                        'Tracking Imunisasi',
                                        'Pencatatan Kunjungan',
                                        'Manajemen Jadwal',
                                        'Laporan Bulanan',
                                        'Notifikasi WhatsApp',
                                        'Multi-Role Access',
                                        'PWA Support',
                                    ].map(feature => (
                                        <div key={feature} className="flex items-center gap-2 text-xs text-slate-500">
                                            <div className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
                                            {feature}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 bg-amber-50/50 border-amber-100">
                        <p className="text-xs text-amber-700 leading-relaxed">
                            ⚠️ <strong>Penting:</strong> Perubahan pengaturan di halaman ini mempengaruhi seluruh sistem.
                            Pastikan data yang dimasukkan sudah benar sebelum menyimpan.
                        </p>
                    </Card>
                </div>
            )}

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={resetForm} />
                    <div className="relative w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-slate-800">
                                {editId ? 'Edit Posyandu' : 'Tambah Posyandu Baru'}
                            </h2>
                            <button onClick={resetForm} className="p-1 hover:bg-slate-100 rounded-lg">
                                <X className="h-5 w-5 text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                label="Nama Posyandu"
                                placeholder="Contoh: Posyandu Lestari 1"
                                value={formData.nama}
                                onChange={e => handleFormChange('nama', e.target.value)}
                                error={formErrors.nama}
                            />
                            <Input
                                label="Alamat"
                                placeholder="Alamat lengkap"
                                value={formData.alamat}
                                onChange={e => handleFormChange('alamat', e.target.value)}
                                error={formErrors.alamat}
                            />
                            <div className="grid grid-cols-3 gap-3">
                                <Input
                                    label="RT/RW"
                                    placeholder="001/002"
                                    value={formData.rt_rw}
                                    onChange={e => handleFormChange('rt_rw', e.target.value)}
                                />
                                <Input
                                    label="Kelurahan"
                                    value={formData.kelurahan}
                                    onChange={e => handleFormChange('kelurahan', e.target.value)}
                                />
                                <Input
                                    label="Kecamatan"
                                    value={formData.kecamatan}
                                    onChange={e => handleFormChange('kecamatan', e.target.value)}
                                />
                            </div>
                            <Input
                                label="Hari Buka"
                                placeholder="Contoh: Selasa"
                                value={formData.hari_buka}
                                onChange={e => handleFormChange('hari_buka', e.target.value)}
                                error={formErrors.hari_buka}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Jam Buka"
                                    type="time"
                                    value={formData.jam_buka}
                                    onChange={e => handleFormChange('jam_buka', e.target.value)}
                                />
                                <Input
                                    label="Jam Tutup"
                                    type="time"
                                    value={formData.jam_tutup}
                                    onChange={e => handleFormChange('jam_tutup', e.target.value)}
                                />
                            </div>

                            <div className="pt-2 flex gap-3">
                                <Button type="button" variant="ghost" onClick={resetForm} className="flex-1">
                                    Batal
                                </Button>
                                <Button type="submit" className="flex-1" isLoading={isSaving}>
                                    <Save className="h-4 w-4" />
                                    {editId ? 'Simpan Perubahan' : 'Tambah Posyandu'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
