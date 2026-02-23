'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Users, Plus, Search, X, Shield, UserCheck, Edit, UploadCloud, Download, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { logAudit } from '@/lib/audit';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import * as xlsx from 'xlsx';
import Papa from 'papaparse';

type UserRole = 'ADMIN' | 'KADER' | 'ORANG_TUA';

interface UserItem {
    id: string;
    nama_lengkap: string;
    no_hp: string;
    nik: string;
    role: UserRole;
    status: 'AKTIF' | 'NONAKTIF';
    is_default_password: boolean;
    posyandu_id: string | null;
    posyandu?: { nama: string } | null;
    created_at: string;
}

interface PosyanduItem {
    id: string;
    nama: string;
}

interface ImportRow {
    nama?: string;
    Nama?: string;
    no_hp?: string | number;
    NoHP?: string | number;
    'No HP'?: string | number;
    nik?: string | number;
    NIK?: string | number;
    role?: string;
    Role?: string;
}

const ROLE_LABELS: Record<UserRole, string> = {
    ADMIN: 'Admin',
    KADER: 'Kader',
    ORANG_TUA: 'Orang Tua',
};

const ROLE_COLORS: Record<UserRole, string> = {
    ADMIN: 'bg-purple-50 text-purple-600 border-purple-200',
    KADER: 'bg-teal-50 text-teal-600 border-teal-200',
    ORANG_TUA: 'bg-blue-50 text-blue-600 border-blue-200',
};

export default function AdminPenggunaClient() {
    const [users, setUsers] = useState<UserItem[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<UserItem[]>([]);
    const [posyanduList, setPosyanduList] = useState<PosyanduItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'AKTIF' | 'NONAKTIF'>('ALL');
    const [sortConfig, setSortConfig] = useState<{ key: keyof UserItem | 'posyandu'; direction: 'asc' | 'desc' }>({ key: 'nama_lengkap', direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState<UserItem | null>(null);
    const [showImport, setShowImport] = useState(false);
    const [importData, setImportData] = useState<ImportRow[]>([]);
    const [isImporting, setIsImporting] = useState(false);
    const supabase = createClient();

    const [formData, setFormData] = useState({
        nama_lengkap: '',
        no_hp: '',
        nik: '',
        role: '' as UserRole | '',
        posyandu_id: '',
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchData(); }, []);

    useEffect(() => {
        let result = [...users];
        if (roleFilter !== 'ALL') {
            result = result.filter((u) => u.role === roleFilter);
        }
        if (statusFilter !== 'ALL') {
            result = result.filter((u) => u.status === statusFilter);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (u) =>
                    u.nama_lengkap.toLowerCase().includes(q) ||
                    u.no_hp.toLowerCase().includes(q) ||
                    u.nik.toLowerCase().includes(q)
            );
        }

        // Sorting
        result.sort((a, b) => {
            let valA: any = a[sortConfig.key as keyof UserItem];
            let valB: any = b[sortConfig.key as keyof UserItem];

            if (sortConfig.key === 'posyandu') {
                valA = a.posyandu?.nama || '';
                valB = b.posyandu?.nama || '';
            }

            // Handle null/undefined
            valA = valA || '';
            valB = valB || '';

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        setFilteredUsers(result);
        setCurrentPage(1);
    }, [searchQuery, roleFilter, statusFilter, sortConfig, users]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [usersRes, posyanduRes] = await Promise.all([
                supabase.from('users').select('*, posyandu:posyandu_id(nama)').order('nama_lengkap'),
                supabase.from('posyandu').select('id, nama'),
            ]);
            if (usersRes.error) throw usersRes.error;

            const sortedPosyandu = ((posyanduRes.data as PosyanduItem[]) || []).sort((a, b) =>
                a.nama.localeCompare(b.nama, undefined, { numeric: true, sensitivity: 'base' })
            ).map((p) => ({
                ...p,
                nama: p.nama.toUpperCase().replace('POSYANDU ', '')
            }));

            setUsers(usersRes.data || []);
            setFilteredUsers(usersRes.data || []);
            setPosyanduList(sortedPosyandu);
        } catch {
            toast.error('Gagal memuat data pengguna');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFormChange = (field: string, value: string) => {
        // Auto capitalize for text fields (excluding nik, no_hp, rt, rw which are numeric in spirit or specific)
        const capitalizedValue = (field === 'nama_lengkap') ? value.toUpperCase() : value;
        setFormData((prev) => ({ ...prev, [field]: capitalizedValue }));
        if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: '' }));
    };

    const validateForm = () => {
        const errors: Record<string, string> = {};
        if (!formData.nama_lengkap.trim()) errors.nama_lengkap = 'Nama wajib diisi';
        if (!formData.no_hp.trim()) errors.no_hp = 'No HP wajib diisi';
        if (!formData.role) errors.role = 'Role wajib dipilih';
        if (formData.role !== 'ADMIN' && !formData.posyandu_id) errors.posyandu_id = 'Posyandu wajib dipilih';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const openEditForm = (user: UserItem) => {
        setEditingUser(user);
        setFormData({
            nama_lengkap: user.nama_lengkap,
            no_hp: user.no_hp,
            nik: user.nik,
            role: user.role,
            posyandu_id: user.posyandu_id || '',
        });
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSaving(true);
        try {
            if (editingUser) {
                // Update existing user
                const { error } = await supabase
                    .from('users')
                    .update({
                        nama_lengkap: formData.nama_lengkap.trim(),
                        no_hp: formData.no_hp.trim(),
                        nik: formData.nik.trim(),
                        role: formData.role as UserRole,
                        posyandu_id: formData.posyandu_id || null,
                    })
                    .eq('id', editingUser.id);

                if (error) throw error;

                await logAudit({
                    action: 'UPDATE',
                    entityType: 'USER',
                    entityId: editingUser.id,
                    details: { name: formData.nama_lengkap, role: formData.role }
                });

                toast.success('Pengguna berhasil diperbarui');
            } else {
                // Create new user via Backend API (avoids admin logout)
                const email = `${formData.no_hp.trim()}@posyandu.local`;

                const userData = {
                    nama_lengkap: formData.nama_lengkap.trim(),
                    no_hp: formData.no_hp.trim(),
                    nik: formData.nik.trim() || null,
                    role: formData.role as UserRole,
                    posyandu_id: formData.posyandu_id || null,
                    is_default_password: true,
                };

                const response = await fetch('/api/admin/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email,
                        password: '12345678',
                        userData
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Gagal menambahkan pengguna');
                }

                const resData = await response.json();
                await logAudit({
                    action: 'CREATE',
                    entityType: 'USER',
                    entityId: resData.id,
                    details: { name: formData.nama_lengkap, role: formData.role }
                });

                toast.success('Pengguna berhasil ditambahkan (password: 12345678)');
            }

            closeForm();
            fetchData();
        } catch (err) {
            toast.error(editingUser ? 'Gagal memperbarui pengguna' : 'Gagal menambahkan pengguna');
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const parseFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();

        if (file.name.endsWith('.csv')) {
            reader.onload = (event) => {
                const text = event.target?.result as string;
                Papa.parse(text, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => setImportData(results.data as ImportRow[]),
                    error: (err: Error) => toast.error(`Gagal membaca CSV: ${err.message}`)
                });
            };
            reader.readAsText(file);
        } else if (file.name.endsWith('.xlsx')) {
            reader.onload = (event) => {
                const data = new Uint8Array(event.target?.result as ArrayBuffer);
                const workbook = xlsx.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = xlsx.utils.sheet_to_json(firstSheet);
                setImportData(jsonData as ImportRow[]);
            };
            reader.readAsArrayBuffer(file);
        } else {
            toast.error('Format file tidak didukung. Gunakan .csv atau .xlsx');
        }
    };

    const handleBulkImport = async () => {
        if (importData.length === 0) {
            toast.error('Tidak ada data untuk diimpor');
            return;
        }

        setIsImporting(true);
        try {
            const formattedUsers = importData.map(row => ({
                nama_lengkap: row.nama || row.Nama || '',
                no_hp: String(row.no_hp || row.NoHP || row['No HP'] || ''),
                nik: String(row.nik || row.NIK || ''),
                role: (row.role || row.Role || 'ORANG_TUA').toUpperCase() as UserRole,
                posyandu_id: formData.posyandu_id || null, // Default to selected posyandu
                email: `${String(row.no_hp || row.NoHP || row['No HP'] || '').trim()}@posyandu.local`,
                password: '12345678'
            })).filter(u => u.nama_lengkap && u.no_hp);

            const response = await fetch('/api/admin/users/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ users: formattedUsers })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error);

            await logAudit({
                action: 'BROADCAST',
                entityType: 'USER',
                details: { count: formattedUsers.length, action: 'BULK_IMPORT' }
            });

            toast.success(result.message);
            if (result.results?.errors?.length > 0) {
                console.error("Import errors:", result.results.errors);
                toast.error(`${result.results.errors.length} baris gagal diimpor. Periksa console.`);
            }

            setShowImport(false);
            setImportData([]);
            fetchData();
        } catch (err: unknown) {
            const e = err as Error;
            toast.error(e.message || 'Gagal melakukan import massal');
        } finally {
            setIsImporting(false);
        }
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingUser(null);
        setFormData({ nama_lengkap: '', no_hp: '', nik: '', role: '', posyandu_id: '' });
        setFormErrors({});
    };

    const toggleActive = async (user: UserItem) => {
        const newStatus = user.status === 'AKTIF' ? 'NONAKTIF' : 'AKTIF';
        try {
            const { error } = await supabase
                .from('users')
                .update({ status: newStatus })
                .eq('id', user.id);

            if (error) throw error;
            toast.success(newStatus === 'NONAKTIF' ? 'Pengguna dinonaktifkan' : 'Pengguna diaktifkan');
            fetchData();
        } catch {
            toast.error('Gagal mengubah status');
        }
    };

    const resetPassword = async (user: UserItem) => {
        if (!confirm(`Reset password ${user.nama_lengkap} ke 12345678?`)) return;
        try {
            const response = await fetch('/api/admin/users/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: user.id })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Gagal mereset password');
            }

            await logAudit({
                action: 'UPDATE',
                entityType: 'USER',
                entityId: user.id,
                details: { action: 'RESET_PASSWORD' }
            });

            toast.success('Password berhasil direset ke 12345678');
            fetchData();
        } catch (error: unknown) {
            const e = error as Error;
            toast.error(e.message || 'Gagal mereset password');
        }
    };

    const exportToExcel = async () => {
        if (filteredUsers.length === 0) {
            toast.error('Tidak ada data untuk diekspor');
            return;
        }

        const dataToExport = filteredUsers.map(user => ({
            'Nama Lengkap': user.nama_lengkap,
            'No HP': user.no_hp,
            'NIK': user.nik || '-',
            'Role': ROLE_LABELS[user.role],
            'Posyandu': user.posyandu?.nama || '-',
            'Status': user.status === 'AKTIF' ? 'Aktif' : 'Nonaktif',
            'Terdaftar Pada': new Date(user.created_at).toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        }));

        const worksheet = xlsx.utils.json_to_sheet(dataToExport);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Daftar Pengguna');

        // Set column widths
        const wscols = [
            { wch: 30 }, // Nama Lengkap
            { wch: 15 }, // No HP
            { wch: 20 }, // NIK
            { wch: 15 }, // Role
            { wch: 20 }, // Posyandu
            { wch: 12 }, // Status
            { wch: 20 }  // Terdaftar Pada
        ];
        (worksheet as any)['!cols'] = wscols;

        xlsx.writeFile(workbook, `Daftar_Pengguna_${new Date().toISOString().split('T')[0]}.xlsx`);

        await logAudit({
            action: 'EXPORT',
            entityType: 'USER',
            details: { count: dataToExport.length, format: 'XLSX' }
        });

        toast.success('File Excel berhasil diunduh');
    };


    const handleSort = (key: keyof UserItem | 'posyandu') => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const SortIcon = ({ column }: { column: keyof UserItem | 'posyandu' }) => {
        if (sortConfig.key !== column) return <ChevronUp className="h-3 w-3 opacity-20" />;
        return sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
    };

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Manajemen Pengguna</h1>
                    <p className="text-sm text-slate-400 mt-1">{users.length} pengguna terdaftar</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={exportToExcel} className="hidden sm:flex">
                        <Download className="h-4 w-4" /> Export Excel
                    </Button>
                    <Button variant="outline" onClick={() => setShowImport(true)}>
                        <UploadCloud className="h-4 w-4" /> Import CSV/Excel
                    </Button>
                    <Button onClick={() => { setEditingUser(null); setShowForm(true); }}>
                        <Plus className="h-4 w-4" /> Tambah Pengguna
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                {/* Role Filter Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-1 flex-1">
                    {(['ALL', 'ADMIN', 'KADER', 'ORANG_TUA'] as const).map((role) => (
                        <button
                            key={role}
                            onClick={() => setRoleFilter(role)}
                            className={cn(
                                'px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap',
                                roleFilter === role
                                    ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg shadow-teal-500/25'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                            )}
                        >
                            {role === 'ALL' ? 'Semua' : ROLE_LABELS[role]} {role === 'ALL' && `(${users.length})`}
                        </button>
                    ))}
                </div>

                {/* Status Filter */}
                <div className="flex bg-white rounded-xl border border-slate-200 p-1 self-start">
                    {(['ALL', 'AKTIF', 'NONAKTIF'] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                                statusFilter === status
                                    ? 'bg-slate-100 text-slate-900'
                                    : 'text-slate-500 hover:text-slate-700'
                            )}
                        >
                            {status === 'ALL' ? 'Semua Status' : status.charAt(0) + status.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Cari nama, No HP, atau NIK..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
            </div>

            {/* Users Table */}
            {isLoading ? (
                <Card className="p-6 animate-pulse">
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((i) => (
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
                    <p className="text-sm text-slate-400">Tidak ada pengguna ditemukan</p>
                </Card>
            ) : (
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-800 text-white">
                                <tr>
                                    <th className="group cursor-pointer text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider" onClick={() => handleSort('nama_lengkap')}>
                                        <div className="flex items-center gap-1">
                                            Nama <SortIcon column="nama_lengkap" />
                                        </div>
                                    </th>
                                    <th className="group cursor-pointer text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider" onClick={() => handleSort('no_hp')}>
                                        <div className="flex items-center gap-1">
                                            No HP <SortIcon column="no_hp" />
                                        </div>
                                    </th>
                                    <th className="group cursor-pointer text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider" onClick={() => handleSort('role')}>
                                        <div className="flex items-center gap-1">
                                            Role <SortIcon column="role" />
                                        </div>
                                    </th>
                                    <th className="group cursor-pointer text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider" onClick={() => handleSort('posyandu')}>
                                        <div className="flex items-center gap-1">
                                            Posyandu <SortIcon column="posyandu" />
                                        </div>
                                    </th>
                                    <th className="group cursor-pointer text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider" onClick={() => handleSort('status')}>
                                        <div className="flex items-center gap-1">
                                            Status <SortIcon column="status" />
                                        </div>
                                    </th>
                                    <th className="text-center px-5 py-3 font-semibold text-xs uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedUsers.map((user, idx) => (
                                    <tr key={user.id} className={cn('border-b border-slate-50 hover:bg-slate-50 transition-colors', idx % 2 === 1 && 'bg-slate-50/50')}>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    'w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs',
                                                    user.role === 'ADMIN' ? 'bg-purple-500' : user.role === 'KADER' ? 'bg-teal-500' : 'bg-blue-500'
                                                )}>
                                                    {user.nama_lengkap.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-700">{user.nama_lengkap}</p>
                                                    {user.nik && <p className="text-[10px] text-slate-400">{user.nik}</p>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-slate-600">{user.no_hp}</td>
                                        <td className="px-5 py-3">
                                            <span className={cn('text-xs font-medium px-2 py-1 rounded-full border', ROLE_COLORS[user.role])}>
                                                {ROLE_LABELS[user.role]}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-slate-500 text-xs">{user.posyandu?.nama || '—'}</td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-1.5">
                                                <div className={cn('w-2 h-2 rounded-full', user.status === 'AKTIF' ? 'bg-green-500' : 'bg-slate-300')} />
                                                <span className="text-xs">{user.status === 'AKTIF' ? 'Aktif' : 'Nonaktif'}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center justify-center gap-1">
                                                <button onClick={() => openEditForm(user)} className="p-1.5 hover:bg-teal-50 rounded-lg text-teal-600 transition-colors" title="Edit">
                                                    <Edit className="h-3.5 w-3.5" />
                                                </button>
                                                <button onClick={() => toggleActive(user)} className={cn('p-1.5 rounded-lg transition-colors', user.status === 'AKTIF' ? 'hover:bg-red-50 text-red-400' : 'hover:bg-green-50 text-green-500')} title={user.status === 'AKTIF' ? 'Nonaktifkan' : 'Aktifkan'}>
                                                    <UserCheck className="h-3.5 w-3.5" />
                                                </button>
                                                <button onClick={() => resetPassword(user)} className="p-1.5 hover:bg-amber-50 rounded-lg text-amber-500 transition-colors" title="Reset Password">
                                                    <Shield className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                            <p className="text-xs text-slate-500">
                                Menampilkan <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> sampai <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> dari <span className="font-medium">{filteredUsers.length}</span> pengguna
                            </p>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 disabled:opacity-50 hover:bg-slate-50 transition-colors"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>

                                {[...Array(totalPages)].map((_, i) => {
                                    const page = i + 1;
                                    // Show first, last, current, and pages around current
                                    if (
                                        page === 1 ||
                                        page === totalPages ||
                                        (page >= currentPage - 1 && page <= currentPage + 1)
                                    ) {
                                        return (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={cn(
                                                    'w-8 h-8 rounded-lg text-xs font-medium transition-all',
                                                    currentPage === page
                                                        ? 'bg-teal-600 text-white shadow-md'
                                                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                                )}
                                            >
                                                {page}
                                            </button>
                                        );
                                    } else if (
                                        page === currentPage - 2 ||
                                        page === currentPage + 2
                                    ) {
                                        return <span key={page} className="w-8 h-8 flex items-center justify-center text-slate-400">...</span>;
                                    }
                                    return null;
                                })}

                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 disabled:opacity-50 hover:bg-slate-50 transition-colors"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </Card>
            )}

            {/* Import Modal */}
            {showImport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowImport(false)} />
                    <div className="relative w-full max-w-2xl bg-white rounded-2xl p-6 m-4 max-h-[90vh] overflow-y-auto animate-slide-up">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-slate-800">Import Pengguna Massal</h2>
                            <button onClick={() => setShowImport(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                                <X className="h-5 w-5 text-slate-400" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-teal-50 border border-teal-100 rounded-xl space-y-2">
                                <h3 className="text-sm font-semibold text-teal-800">Panduan Import:</h3>
                                <ul className="text-xs text-teal-700 list-disc pl-4 space-y-1">
                                    <li>Gunakan file <strong>.csv</strong> atau <strong>.xlsx</strong> (Excel)</li>
                                    <li>Kolom wajib: <code>nama</code>, <code>no_hp</code></li>
                                    <li>Kolom opsional: <code>nik</code>, <code>role</code> (KADER atau ORANG_TUA)</li>
                                    <li>Password otomatis diset <strong>12345678</strong></li>
                                </ul>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-slate-700">Pilih Posyandu (Opsional)</label>
                                <select
                                    value={formData.posyandu_id}
                                    onChange={(e) => handleFormChange('posyandu_id', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                                >
                                    <option value="">-- Set Posyandu Massal --</option>
                                    {posyanduList.map((p) => (<option key={p.id} value={p.id}>{p.nama}</option>))}
                                </select>
                            </div>

                            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors">
                                <input
                                    type="file"
                                    accept=".csv,.xlsx"
                                    onChange={parseFileUpload}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center">
                                    <UploadCloud className="h-10 w-10 text-slate-400 mb-3" />
                                    <span className="text-sm font-medium text-slate-600">Klik untuk pilih file .csv/.xlsx</span>
                                    <span className="text-xs text-slate-400 mt-1">Atau drag and drop file kesini</span>
                                </label>
                            </div>

                            {importData.length > 0 && (
                                <div className="space-y-3">
                                    <p className="text-sm font-medium text-slate-700">Preview ({importData.length} baris):</p>
                                    <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg">
                                        <table className="w-full text-xs text-left">
                                            <thead className="bg-slate-50 sticky top-0">
                                                <tr>
                                                    <th className="px-3 py-2">Nama</th>
                                                    <th className="px-3 py-2">No HP</th>
                                                    <th className="px-3 py-2">Role</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {importData.slice(0, 5).map((row, i) => (
                                                    <tr key={i} className="border-t border-slate-100">
                                                        <td className="px-3 py-2">{row.nama || row.Nama}</td>
                                                        <td className="px-3 py-2">{row.no_hp || row.NoHP || row['No HP']}</td>
                                                        <td className="px-3 py-2">{row.role || row.Role || 'ORANG_TUA'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {importData.length > 5 && (
                                            <div className="p-2 text-center text-xs text-slate-500 bg-slate-50 border-t border-slate-200">
                                                ... dan {importData.length - 5} baris lainnya
                                            </div>
                                        )}
                                    </div>
                                    <Button onClick={handleBulkImport} className="w-full" isLoading={isImporting}>
                                        Mulai Import Data
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={closeForm} />
                    <div className="relative w-full max-w-md bg-white rounded-2xl p-6 m-4 max-h-[90vh] overflow-y-auto animate-slide-up">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-slate-800">
                                {editingUser ? 'Edit Pengguna' : 'Tambah Pengguna'}
                            </h2>
                            <button onClick={closeForm} className="p-1 hover:bg-slate-100 rounded-lg">
                                <X className="h-5 w-5 text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input label="Nama Lengkap" placeholder="Nama lengkap" value={formData.nama_lengkap} onChange={(e) => handleFormChange('nama_lengkap', e.target.value)} error={formErrors.nama_lengkap} />
                            <Input label="No HP" placeholder="08xxxxxxxxxx" value={formData.no_hp} onChange={(e) => handleFormChange('no_hp', e.target.value)} error={formErrors.no_hp} disabled={!!editingUser} helperText={editingUser ? 'No HP tidak bisa diubah' : 'Digunakan sebagai login'} />
                            <Input label="NIK (opsional)" placeholder="16 digit NIK" value={formData.nik} onChange={(e) => handleFormChange('nik', e.target.value)} />

                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-slate-700">Role</label>
                                <select value={formData.role} onChange={(e) => handleFormChange('role', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500">
                                    <option value="">Pilih role...</option>
                                    <option value="ADMIN">Admin</option>
                                    <option value="KADER">Kader</option>
                                    <option value="ORANG_TUA">Orang Tua</option>
                                </select>
                                {formErrors.role && <p className="text-xs text-red-500 font-medium">{formErrors.role}</p>}
                            </div>

                            {formData.role && formData.role !== 'ADMIN' && (
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-slate-700">Posyandu</label>
                                    <select value={formData.posyandu_id} onChange={(e) => handleFormChange('posyandu_id', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500">
                                        <option value="">Pilih posyandu...</option>
                                        {posyanduList.map((p) => (<option key={p.id} value={p.id}>{p.nama}</option>))}
                                    </select>
                                    {formErrors.posyandu_id && <p className="text-xs text-red-500 font-medium">{formErrors.posyandu_id}</p>}
                                </div>
                            )}

                            {!editingUser && (
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                    <p className="text-xs text-amber-700">
                                        <strong>Password default:</strong> 12345678<br />
                                        Pengguna diminta mengganti setelah login pertama.
                                    </p>
                                </div>
                            )}

                            <div className="pt-2">
                                <Button type="submit" className="w-full" isLoading={isSaving}>
                                    {editingUser ? 'Simpan Perubahan' : 'Tambah Pengguna'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
