'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Baby, Plus, Search, ChevronRight, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn, formatUsiaDetail } from '@/lib/utils';
import { logAudit } from '@/lib/audit';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface BalitaItem {
    id: string;
    nik: string;
    nik_status: string;
    nama: string;
    nama_ibu: string;
    tanggal_lahir: string;
    jenis_kelamin: string;
    posyandu_id: string;
    is_active: boolean;
    posyandu?: { nama: string };
}

export default function KaderBalitaPage() {
    const [balitaList, setBalitaList] = useState<BalitaItem[]>([]);
    const [filteredList, setFilteredList] = useState<BalitaItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const supabase = createClient();

    // Form state
    const [formData, setFormData] = useState({
        nik: '',
        nama: '',
        nama_ibu: '',
        tanggal_lahir: '',
        jenis_kelamin: '' as 'L' | 'P' | '',
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);

    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(() => {
        fetchBalita();
    }, []);
    /* eslint-enable react-hooks/exhaustive-deps */

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredList(balitaList);
        } else {
            const q = searchQuery.toLowerCase();
            setFilteredList(
                balitaList.filter(
                    (b) =>
                        b.nama.toLowerCase().includes(q) ||
                        b.nama_ibu.toLowerCase().includes(q) ||
                        b.nik.toLowerCase().includes(q)
                )
            );
        }
    }, [searchQuery, balitaList]);

    const fetchBalita = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('balita')
                .select('*, posyandu:posyandu_id(nama)')
                .eq('is_active', true)
                .order('nama', { ascending: true });

            if (error) throw error;
            setBalitaList(data || []);
            setFilteredList(data || []);
        } catch {
            toast.error('Gagal memuat data balita');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFormChange = (field: string, value: string) => {
        // Auto capitalize for text fields (excluding date and select if they were text, but here we enforce capitalize)
        const capitalizedValue = (field === 'nama' || field === 'nama_ibu') ? value.toUpperCase() : value;

        setFormData((prev) => ({ ...prev, [field]: capitalizedValue }));
        if (formErrors[field]) {
            setFormErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };

    const validateForm = () => {
        const errors: Record<string, string> = {};
        if (!formData.nama.trim()) errors.nama = 'Nama wajib diisi';
        if (!formData.nama_ibu.trim()) errors.nama_ibu = 'Nama ibu wajib diisi';
        if (!formData.tanggal_lahir) errors.tanggal_lahir = 'Tanggal lahir wajib diisi';
        if (!formData.jenis_kelamin) errors.jenis_kelamin = 'Jenis kelamin wajib dipilih';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSaving(true);
        try {
            // Get current user's posyandu_id
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error('Sesi habis, silakan login ulang');
                return;
            }

            const { data: userData } = await supabase
                .from('users')
                .select('posyandu_id')
                .eq('id', user.id)
                .single();

            if (!userData?.posyandu_id) {
                toast.error('Posyandu belum diatur untuk akun Anda');
                return;
            }

            // Generate temp NIK if empty
            let nikValue = formData.nik.trim();
            const nikStatus = nikValue ? 'ASLI' : 'SEMENTARA';

            if (!nikValue) {
                const currentYear = new Date().getFullYear();
                const { data: lastTemp } = await supabase
                    .from('balita')
                    .select('nik')
                    .ilike('nik', `TEMP-MERDEN-${currentYear}-%`)
                    .order('nik', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                let nextUrut = 1;
                if (lastTemp?.nik) {
                    const parts = lastTemp.nik.split('-');
                    if (parts.length === 4) {
                        nextUrut = parseInt(parts[3], 10) + 1;
                    }
                }
                nikValue = `TEMP-MERDEN-${currentYear}-${String(nextUrut).padStart(4, '0')}`;
            }

            const { error } = await supabase.from('balita').insert({
                nik: nikValue,
                nik_status: nikStatus,
                nama: formData.nama.trim(),
                nama_ibu: formData.nama_ibu.trim(),
                tanggal_lahir: formData.tanggal_lahir,
                jenis_kelamin: formData.jenis_kelamin,
                posyandu_id: userData.posyandu_id,
            });

            if (error) throw error;

            await logAudit({
                action: 'CREATE',
                entityType: 'BALITA',
                details: { name: formData.nama.trim(), nik: nikValue }
            });

            toast.success('Balita berhasil didaftarkan!');
            setShowForm(false);
            setFormData({ nik: '', nama: '', nama_ibu: '', tanggal_lahir: '', jenis_kelamin: '' });
            fetchBalita();
        } catch (error: any) {
            console.error("Gagal mendaftar balita:", error);
            toast.error(error.message || 'Gagal mendaftarkan balita');
        } finally {
            setIsSaving(false);
        }
    };

    const getUsiaLabel = (tanggalLahir: string) => {
        return formatUsiaDetail(tanggalLahir);
    };

    return (
        <div className="space-y-4 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-bold text-slate-800">Data Balita</h1>
                    <p className="text-xs text-slate-400 mt-0.5">{balitaList.length} balita terdaftar</p>
                </div>
                <Button size="sm" onClick={() => setShowForm(true)}>
                    <Plus className="h-4 w-4" />
                    Tambah
                </Button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Cari nama, ibu, atau NIK..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
            </div>

            {/* List */}
            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 animate-pulse">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-100" />
                                <div className="flex-1">
                                    <div className="h-4 bg-slate-100 rounded w-32 mb-2" />
                                    <div className="h-3 bg-slate-50 rounded w-24" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredList.length === 0 ? (
                <Card className="p-8 text-center">
                    <Baby className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm text-slate-400">
                        {searchQuery ? 'Tidak ada balita ditemukan' : 'Belum ada balita terdaftar'}
                    </p>
                    {!searchQuery && (
                        <Button size="sm" className="mt-3" onClick={() => setShowForm(true)}>
                            <Plus className="h-4 w-4" />
                            Daftarkan Balita
                        </Button>
                    )}
                </Card>
            ) : (
                <div className="space-y-2">
                    {filteredList.map((balita) => (
                        <Link key={balita.id} href={`/kader/balita/${balita.id}`}>
                            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        'w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm',
                                        balita.jenis_kelamin === 'L'
                                            ? 'bg-gradient-to-br from-blue-400 to-blue-600'
                                            : 'bg-gradient-to-br from-pink-400 to-pink-600'
                                    )}>
                                        {balita.nama.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-semibold text-slate-700 truncate">
                                                {balita.nama}
                                            </h3>
                                            <span className={cn(
                                                'shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                                                balita.jenis_kelamin === 'L'
                                                    ? 'bg-blue-50 text-blue-600'
                                                    : 'bg-pink-50 text-pink-600'
                                            )}>
                                                {balita.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400 truncate">
                                            Ibu: {balita.nama_ibu} · {getUsiaLabel(balita.tanggal_lahir)}
                                        </p>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}

            {/* Registration Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
                    <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-slate-800">Daftarkan Balita</h2>
                            <button onClick={() => setShowForm(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                                <X className="h-5 w-5 text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                label="NIK Anak (opsional)"
                                placeholder="16 digit NIK"
                                value={formData.nik}
                                onChange={(e) => handleFormChange('nik', e.target.value)}
                                error={formErrors.nik}
                                helperText="Kosongkan jika belum punya NIK"
                            />
                            <Input
                                label="Nama Anak"
                                placeholder="Nama lengkap anak"
                                value={formData.nama}
                                onChange={(e) => handleFormChange('nama', e.target.value)}
                                error={formErrors.nama}
                            />
                            <Input
                                label="Nama Ibu"
                                placeholder="Nama lengkap ibu"
                                value={formData.nama_ibu}
                                onChange={(e) => handleFormChange('nama_ibu', e.target.value)}
                                error={formErrors.nama_ibu}
                            />
                            <Input
                                label="Tanggal Lahir"
                                type="date"
                                value={formData.tanggal_lahir}
                                onChange={(e) => handleFormChange('tanggal_lahir', e.target.value)}
                                error={formErrors.tanggal_lahir}
                            />

                            {/* Gender Selection */}
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-slate-700">Jenis Kelamin</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => handleFormChange('jenis_kelamin', 'L')}
                                        className={cn(
                                            'py-2.5 rounded-xl border text-[10px] font-bold transition-all uppercase tracking-wider',
                                            formData.jenis_kelamin === 'L'
                                                ? 'bg-blue-50 border-blue-300 text-blue-700'
                                                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                        )}
                                    >
                                        ♂ LAKI-LAKI
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleFormChange('jenis_kelamin', 'P')}
                                        className={cn(
                                            'py-2.5 rounded-xl border text-[10px] font-bold transition-all uppercase tracking-wider',
                                            formData.jenis_kelamin === 'P'
                                                ? 'bg-pink-50 border-pink-300 text-pink-700'
                                                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                        )}
                                    >
                                        ♀ PEREMPUAN
                                    </button>
                                </div>
                                {formErrors.jenis_kelamin && (
                                    <p className="text-xs text-red-500 font-medium">{formErrors.jenis_kelamin}</p>
                                )}
                            </div>

                            <div className="pt-2">
                                <Button type="submit" className="w-full" isLoading={isSaving}>
                                    Daftarkan Balita
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
