'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Heart, Plus, Search, ChevronRight, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn, hitungUsiaTahun, formatUsiaDetail } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface LansiaItem {
    id: string;
    nik: string;
    nik_status: string;
    nama_lengkap: string;
    jenis_kelamin: string;
    tempat_lahir: string;
    tanggal_lahir: string;
    alamat: string;
    posyandu_id: string;
    is_active: boolean;
}

export default function KaderLansiaPage() {
    const [lansiaList, setLansiaList] = useState<LansiaItem[]>([]);
    const [filteredList, setFilteredList] = useState<LansiaItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const supabase = createClient();

    const [formData, setFormData] = useState({
        nik: '',
        nama_lengkap: '',
        jenis_kelamin: '' as 'L' | 'P' | '',
        tempat_lahir: '',
        tanggal_lahir: '',
        alamat: '',
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchLansia(); }, []);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredList(lansiaList);
        } else {
            const q = searchQuery.toLowerCase();
            setFilteredList(
                lansiaList.filter(
                    (l) =>
                        l.nama_lengkap.toLowerCase().includes(q) ||
                        l.nik.toLowerCase().includes(q) ||
                        l.alamat.toLowerCase().includes(q)
                )
            );
        }
    }, [searchQuery, lansiaList]);

    const fetchLansia = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('lansia')
                .select('*')
                .eq('is_active', true)
                .order('nama_lengkap', { ascending: true });

            if (error) throw error;
            setLansiaList(data || []);
            setFilteredList(data || []);
        } catch {
            toast.error('Gagal memuat data lansia');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFormChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: '' }));
    };

    const validateForm = () => {
        const errors: Record<string, string> = {};
        if (!formData.nama_lengkap.trim()) errors.nama_lengkap = 'Nama lengkap wajib diisi';
        if (!formData.jenis_kelamin) errors.jenis_kelamin = 'Jenis kelamin wajib dipilih';
        if (!formData.tempat_lahir.trim()) errors.tempat_lahir = 'Tempat lahir wajib diisi';
        if (!formData.tanggal_lahir) errors.tanggal_lahir = 'Tanggal lahir wajib diisi';
        if (!formData.alamat.trim()) errors.alamat = 'Alamat wajib diisi';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { toast.error('Sesi habis'); return; }

            const { data: userData } = await supabase
                .from('users').select('posyandu_id').eq('id', user.id).single();

            if (!userData?.posyandu_id) { toast.error('Posyandu belum diatur'); return; }

            let nikValue = formData.nik.trim();
            const nikStatus = nikValue ? 'ASLI' : 'SEMENTARA';

            if (!nikValue) {
                const currentYear = new Date().getFullYear();
                const { data: lastTemp } = await supabase
                    .from('lansia')
                    .select('nik')
                    .ilike('nik', `TEMP-MERDEN-${currentYear}-%`)
                    .order('nik', { ascending: false })
                    .limit(1)
                    .single();

                let nextUrut = 1;
                if (lastTemp?.nik) {
                    const parts = lastTemp.nik.split('-');
                    if (parts.length === 4) {
                        nextUrut = parseInt(parts[3], 10) + 1;
                    }
                }
                nikValue = `TEMP-MERDEN-${currentYear}-${String(nextUrut).padStart(4, '0')}`;
            }

            const { error } = await supabase.from('lansia').insert({
                nik: nikValue,
                nik_status: nikStatus,
                nama_lengkap: formData.nama_lengkap.trim(),
                jenis_kelamin: formData.jenis_kelamin,
                tempat_lahir: formData.tempat_lahir.trim(),
                tanggal_lahir: formData.tanggal_lahir,
                alamat: formData.alamat.trim(),
                posyandu_id: userData.posyandu_id,
            });

            if (error) throw error;

            toast.success('Lansia berhasil didaftarkan!');
            setShowForm(false);
            setFormData({ nik: '', nama_lengkap: '', jenis_kelamin: '', tempat_lahir: '', tanggal_lahir: '', alamat: '' });
            fetchLansia();
        } catch {
            toast.error('Gagal mendaftarkan lansia');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-bold text-slate-800">Data Lansia</h1>
                    <p className="text-xs text-slate-400 mt-0.5">{lansiaList.length} lansia terdaftar</p>
                </div>
                <Button size="sm" onClick={() => setShowForm(true)}>
                    <Plus className="h-4 w-4" /> Tambah
                </Button>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Cari nama, NIK, atau alamat..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 animate-pulse">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-100" />
                                <div className="flex-1"><div className="h-4 bg-slate-100 rounded w-32 mb-2" /><div className="h-3 bg-slate-50 rounded w-24" /></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredList.length === 0 ? (
                <Card className="p-8 text-center">
                    <Heart className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm text-slate-400">{searchQuery ? 'Tidak ada lansia ditemukan' : 'Belum ada lansia terdaftar'}</p>
                    {!searchQuery && (
                        <Button size="sm" className="mt-3" onClick={() => setShowForm(true)}>
                            <Plus className="h-4 w-4" /> Daftarkan Lansia
                        </Button>
                    )}
                </Card>
            ) : (
                <div className="space-y-2">
                    {filteredList.map((lansia) => (
                        <Link key={lansia.id} href={`/kader/lansia/${lansia.id}`}>
                            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        'w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm',
                                        lansia.jenis_kelamin === 'L'
                                            ? 'bg-gradient-to-br from-emerald-400 to-emerald-600'
                                            : 'bg-gradient-to-br from-rose-400 to-rose-600'
                                    )}>
                                        {lansia.nama_lengkap.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-semibold text-slate-700 truncate">{lansia.nama_lengkap}</h3>
                                            <span className={cn(
                                                'shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                                                lansia.jenis_kelamin === 'L' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                            )}>
                                                {lansia.jenis_kelamin === 'L' ? 'L' : 'P'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400 truncate">
                                            {formatUsiaDetail(lansia.tanggal_lahir)} · {lansia.alamat}
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
                            <h2 className="text-lg font-bold text-slate-800">Daftarkan Lansia</h2>
                            <button onClick={() => setShowForm(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                                <X className="h-5 w-5 text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input label="NIK (opsional)" placeholder="16 digit NIK" value={formData.nik} onChange={(e) => handleFormChange('nik', e.target.value)} helperText="Kosongkan jika belum punya NIK" />
                            <Input label="Nama Lengkap" placeholder="Nama lengkap" value={formData.nama_lengkap} onChange={(e) => handleFormChange('nama_lengkap', e.target.value)} error={formErrors.nama_lengkap} />

                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-slate-700">Jenis Kelamin</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button type="button" onClick={() => handleFormChange('jenis_kelamin', 'L')} className={cn('py-2.5 rounded-xl border text-sm font-medium transition-all', formData.jenis_kelamin === 'L' ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300')}>♂ Laki-laki</button>
                                    <button type="button" onClick={() => handleFormChange('jenis_kelamin', 'P')} className={cn('py-2.5 rounded-xl border text-sm font-medium transition-all', formData.jenis_kelamin === 'P' ? 'bg-rose-50 border-rose-300 text-rose-700' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300')}>♀ Perempuan</button>
                                </div>
                                {formErrors.jenis_kelamin && <p className="text-xs text-red-500 font-medium">{formErrors.jenis_kelamin}</p>}
                            </div>

                            <Input label="Tempat Lahir" placeholder="Tempat lahir" value={formData.tempat_lahir} onChange={(e) => handleFormChange('tempat_lahir', e.target.value)} error={formErrors.tempat_lahir} />
                            <Input label="Tanggal Lahir" type="date" value={formData.tanggal_lahir} onChange={(e) => handleFormChange('tanggal_lahir', e.target.value)} error={formErrors.tanggal_lahir} />
                            <Input label="Alamat" placeholder="Alamat lengkap" value={formData.alamat} onChange={(e) => handleFormChange('alamat', e.target.value)} error={formErrors.alamat} />

                            <div className="pt-2">
                                <Button type="submit" className="w-full" isLoading={isSaving}>Daftarkan Lansia</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
