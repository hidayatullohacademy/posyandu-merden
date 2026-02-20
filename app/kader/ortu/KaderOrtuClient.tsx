'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Search, X, Shield, UserCheck } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface BasicUser {
    id: string;
    nama_lengkap: string;
    no_hp: string;
    nik: string;
    is_active: boolean;
    created_at: string;
}

export default function KaderOrtuClient() {
    const [users, setUsers] = useState<BasicUser[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<BasicUser[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        nama_lengkap: '',
        no_hp: '',
        nik: '',
        rt: '',
        rw: ''
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchData(); }, []);

    useEffect(() => {
        let result = users;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (u) =>
                    (u.nama_lengkap && u.nama_lengkap.toLowerCase().includes(q)) ||
                    (u.no_hp && u.no_hp.toLowerCase().includes(q)) ||
                    (u.nik && u.nik.toLowerCase().includes(q))
            );
        }
        setFilteredUsers(result);
    }, [searchQuery, users]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/kader/ortu/list');
            const result = await res.json();

            if (!res.ok) throw new Error(result.error || 'Gagal memuat data');

            setUsers(result.data || []);
            setFilteredUsers(result.data || []);
        } catch (e: any) {
            toast.error(e.message || 'Gagal terhubung ke database');
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
        if (!formData.nama_lengkap.trim()) errors.nama_lengkap = 'Nama wajib diisi';
        if (!formData.no_hp.trim()) errors.no_hp = 'No HP wajib diisi';
        if (!formData.nik.trim()) errors.nik = 'NIK wajib diisi (minimal 16 angka)';
        // rt and rw optional for db but enforced in UI here as requested by user scenario
        if (!formData.rt.trim()) errors.rt = 'RT wajib diisi';
        if (!formData.rw.trim()) errors.rw = 'RW wajib diisi';

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSaving(true);
        try {
            const response = await fetch('/api/kader/ortu', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData) // send rt/rw although backend might ignore them currently
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Gagal menambahkan akun orang tua');
            }

            toast.success('Akun Orangtua berhasil didaftarkan! Password: merden12345', { duration: 5000 });

            closeForm();
            fetchData();
        } catch (err: any) {
            toast.error(err.message || 'Gagal menambahkan orang tua');
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const closeForm = () => {
        setShowForm(false);
        setFormData({ nama_lengkap: '', no_hp: '', nik: '', rt: '', rw: '' });
        setFormErrors({});
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Manajemen Akun Orang Tua</h1>
                    <p className="text-sm text-slate-400 mt-1">{users.length} akun terdaftar di posyandu ini</p>
                </div>
                <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20">
                    <Plus className="h-4 w-4 mr-1" /> Buat Akun Baru
                </Button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Cari nama, No HP, atau NIK..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
            </div>

            {/* Users Table */}
            {isLoading ? (
                <Card className="p-6 animate-pulse">
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-100" />
                                <div className="flex-1">
                                    <div className="h-4 bg-slate-100 rounded w-40 mb-2" />
                                    <div className="h-3 bg-slate-50 rounded w-28" />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            ) : filteredUsers.length === 0 ? (
                <Card className="p-8 text-center">
                    <Users className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm text-slate-400">Belum ada data orang tua yang didaftarkan</p>
                </Card>
            ) : (
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-800 text-white">
                                <tr>
                                    <th className="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider">Nama & NIK</th>
                                    <th className="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider">No HP / Login Info</th>
                                    <th className="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider">Status Akses</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user, idx) => (
                                    <tr key={user.id} className={cn('border-b border-slate-50 hover:bg-slate-50 transition-colors', idx % 2 === 1 && 'bg-slate-50/50')}>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                                    {user.nama_lengkap ? user.nama_lengkap.charAt(0).toUpperCase() : '?'}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-700">{user.nama_lengkap}</p>
                                                    {user.nik && <p className="text-[10px] text-slate-400 font-medium">NIK: {user.nik}</p>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3">
                                            <p className="font-semibold text-slate-600">{user.no_hp}</p>
                                            <p className="text-[10px] text-slate-400">Akun terdaftar</p>
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-1.5">
                                                <div className={cn('w-2 h-2 rounded-full', user.is_active ? 'bg-green-500' : 'bg-slate-300')} />
                                                <span className="text-xs font-semibold">{user.is_active ? 'Bisa Login' : 'Nonaktif'}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeForm} />
                    <div className="relative w-full max-w-md bg-white rounded-2xl p-6 m-4 max-h-[90vh] overflow-y-auto animate-slide-up shadow-2xl">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">Daftarkan Akun Orangtua</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Berikan akses bagi ortu untuk cek KMS digital</p>
                            </div>
                            <button onClick={closeForm} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X className="h-5 w-5 text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input label="Nama Lengkap" placeholder="Sesuai KTP" value={formData.nama_lengkap} onChange={(e) => handleFormChange('nama_lengkap', e.target.value)} error={formErrors.nama_lengkap} />

                            <Input label="Nomor NIK" placeholder="16 Digit NIK" type="number" value={formData.nik} onChange={(e) => handleFormChange('nik', e.target.value)} error={formErrors.nik} />

                            <Input label="No WhatsApp / HP Aktif" placeholder="08xxxxxxxxxx" type="number" value={formData.no_hp} onChange={(e) => handleFormChange('no_hp', e.target.value)} error={formErrors.no_hp} helperText="Nomor ini digunakan untuk login di aplikasi" />

                            <div className="grid grid-cols-2 gap-3">
                                <Input label="RT" placeholder="Contoh: 01" type="number" value={formData.rt} onChange={(e) => handleFormChange('rt', e.target.value)} error={formErrors.rt} />
                                <Input label="RW" placeholder="Contoh: 05" type="number" value={formData.rw} onChange={(e) => handleFormChange('rw', e.target.value)} error={formErrors.rw} />
                            </div>

                            <div className="p-4 bg-sky-50 border border-sky-100 rounded-xl flex gap-3 text-sky-800 mt-6">
                                <Shield className="h-5 w-5 shrink-0 mt-0.5" />
                                <div className="text-xs">
                                    <p className="font-bold text-sky-900 mb-1">Informasi Login Default</p>
                                    <p>Sistem akan membuatkan password sementara: <b>merden12345</b></p>
                                    <p className="mt-1 opacity-80">Orangtua bisa menggantinya nanti di Pengaturan Akun di dabor merek.</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 mt-6">
                                <Button type="submit" className="w-full text-base font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30" isLoading={isSaving}>
                                    Buat dan Daftarkan Akses
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
