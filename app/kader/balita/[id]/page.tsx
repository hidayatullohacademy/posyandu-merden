'use client';

import { useState, useEffect, use } from 'react';
import { createClient } from '@/lib/supabase';
import { ArrowLeft, Scale, Plus, X, TrendingUp, Calendar, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn, formatDate, hitungUsiaBulan, getZScoreBBU, getStatusGizi, formatNumber, parseNumber } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface BalitaDetail {
    id: string;
    nik: string;
    nik_status: string;
    nama: string;
    nama_ibu: string;
    tanggal_lahir: string;
    jenis_kelamin: string;
    posyandu_id: string;
    is_active: boolean;
}

interface KunjunganRecord {
    id: string;
    bulan: number;
    tahun: number;
    berat_badan: number;
    tinggi_badan: number;
    lingkar_kepala: number | null;
    lingkar_lengan: number | null;
    vitamin_a: boolean;
    obat_cacing: boolean;
    status_gizi: string | null;
    catatan: string | null;
    created_at: string;
}

const BULAN_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];

export default function BalitaDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [balita, setBalita] = useState<BalitaDetail | null>(null);
    const [kunjungan, setKunjungan] = useState<KunjunganRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [showEditForm, setShowEditForm] = useState(false);
    const [editFormData, setEditFormData] = useState({
        nama: '',
        nama_ibu: '',
        tanggal_lahir: '',
        jenis_kelamin: '',
        nik: ''
    });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const supabase = createClient();

    const now = new Date();
    // Default val date: 'YYYY-MM-DD' taking local timezone into account
    const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const [formData, setFormData] = useState({
        berat_badan: '',
        tinggi_badan: '',
        lingkar_kepala: '',
        lingkar_lengan: '',
        vitamin_a: false,
        obat_cacing: false,
        catatan: '',
        periode_kunjungan: localDate,
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(() => {
        fetchData();
    }, [id]);
    /* eslint-enable react-hooks/exhaustive-deps */

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [balitaRes, kunjunganRes] = await Promise.all([
                supabase.from('balita').select('*').eq('id', id).single(),
                supabase
                    .from('kunjungan_balita')
                    .select('*')
                    .eq('balita_id', id)
                    .order('tahun', { ascending: false })
                    .order('bulan', { ascending: false }),
            ]);

            if (balitaRes.error) throw balitaRes.error;
            setBalita(balitaRes.data);
            setKunjungan(kunjunganRes.data || []);
        } catch {
            toast.error('Gagal memuat data balita');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditBalita = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('balita')
                .update({
                    nama: editFormData.nama,
                    nama_ibu: editFormData.nama_ibu,
                    tanggal_lahir: editFormData.tanggal_lahir,
                    jenis_kelamin: editFormData.jenis_kelamin,
                    nik: editFormData.nik || null,
                    nik_status: editFormData.nik ? 'ASLI' : 'SEMENTARA'
                })
                .eq('id', id);

            if (error) throw error;
            toast.success('Data berhasil diperbarui');
            setShowEditForm(false);
            fetchData();
        } catch {
            toast.error('Gagal memperbarui data');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteBalita = async () => {
        setIsDeleting(true);
        try {
            const { error } = await supabase
                .from('balita')
                .update({ is_active: false })
                .eq('id', id);

            if (error) throw error;
            toast.success('Data berhasil dihapus');
            window.location.href = '/kader/balita';
        } catch {
            toast.error('Gagal menghapus data');
            setIsDeleting(false);
        }
    };

    const handleSubmitKunjungan = async (e: React.FormEvent) => {
        e.preventDefault();
        const errors: Record<string, string> = {};
        if (!formData.berat_badan || parseNumber(formData.berat_badan) <= 0) errors.berat_badan = 'Berat badan wajib diisi';
        if (!formData.tinggi_badan || parseNumber(formData.tinggi_badan) <= 0) errors.tinggi_badan = 'Tinggi badan wajib diisi';
        setFormErrors(errors);
        if (Object.keys(errors).length > 0) return;

        setIsSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error('Sesi habis');
                return;
            }

            const bb = parseNumber(formData.berat_badan);
            const tb = parseNumber(formData.tinggi_badan);

            // Calculate Status Gizi
            const usiaM = hitungUsiaBulan(balita!.tanggal_lahir);
            const zScore = getZScoreBBU(balita!.jenis_kelamin as 'L' | 'P', usiaM, bb);
            const statusGizi = getStatusGizi(zScore);

            const { error } = await supabase.from('kunjungan_balita').insert({
                balita_id: id,
                posyandu_id: balita!.posyandu_id,
                tanggal_kunjungan: formData.periode_kunjungan, // record absolute date value
                bulan: parseInt(formData.periode_kunjungan.split('-')[1]),
                tahun: parseInt(formData.periode_kunjungan.split('-')[0]),
                berat_badan: bb,
                tinggi_badan: tb,
                lingkar_kepala: formData.lingkar_kepala ? parseNumber(formData.lingkar_kepala) : null,
                lingkar_lengan: formData.lingkar_lengan ? parseNumber(formData.lingkar_lengan) : null,
                vitamin_a: formData.vitamin_a,
                obat_cacing: formData.obat_cacing,
                status_gizi: statusGizi,
                catatan: formData.catatan || null,
                dicatat_oleh: user.id,
            });

            if (error) {
                if (error.code === '23505') {
                    toast.error('Data kunjungan bulan ini sudah ada');
                } else {
                    throw error;
                }
                return;
            }

            toast.success('Kunjungan berhasil dicatat!');
            setShowForm(false);
            setFormData({
                berat_badan: '', tinggi_badan: '', lingkar_kepala: '', lingkar_lengan: '',
                vitamin_a: false, obat_cacing: false, catatan: '',
                periode_kunjungan: localDate,
            });
            fetchData();
        } catch {
            toast.error('Gagal menyimpan kunjungan');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4 animate-fade-in">
                <div className="h-8 bg-slate-100 rounded w-40 animate-pulse" />
                <div className="bg-white rounded-2xl border p-6 animate-pulse">
                    <div className="h-12 bg-slate-100 rounded mb-4" />
                    <div className="h-4 bg-slate-50 rounded w-48" />
                </div>
            </div>
        );
    }

    if (!balita) {
        return (
            <div className="text-center py-12">
                <p className="text-sm text-slate-400">Data balita tidak ditemukan</p>
                <Link href="/kader/balita">
                    <Button variant="ghost" size="sm" className="mt-3">
                        <ArrowLeft className="h-4 w-4" /> Kembali
                    </Button>
                </Link>
            </div>
        );
    }

    const usia = hitungUsiaBulan(balita.tanggal_lahir);
    const lastKunjungan = kunjungan[0];

    return (
        <div className="space-y-4 animate-fade-in">
            {/* Back + Header */}
            <div className="flex items-center gap-3">
                <Link href="/kader/balita" className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                    <ArrowLeft className="h-5 w-5 text-slate-500" />
                </Link>
                <div>
                    <h1 className="text-lg font-bold text-slate-800">Profil Balita</h1>
                </div>
                <div className="ml-auto flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => {
                        setEditFormData({
                            nama: balita.nama,
                            nama_ibu: balita.nama_ibu,
                            tanggal_lahir: balita.tanggal_lahir,
                            jenis_kelamin: balita.jenis_kelamin,
                            nik: balita.nik_status === 'ASLI' ? balita.nik : ''
                        });
                        setShowEditForm(true);
                    }}>
                        <Edit2 className="h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => setShowDeleteConfirm(true)}>
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            {/* Profile Card */}
            <Card className="p-5">
                <div className="flex items-center gap-4 mb-4">
                    <div className={cn(
                        'w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl',
                        balita.jenis_kelamin === 'L'
                            ? 'bg-gradient-to-br from-blue-400 to-blue-600'
                            : 'bg-gradient-to-br from-pink-400 to-pink-600'
                    )}>
                        {balita.nama.charAt(0)}
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">{balita.nama}</h2>
                        <p className="text-xs text-slate-400">Ibu: {balita.nama_ibu}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-[10px] text-slate-400 mb-0.5">Usia</p>
                        <p className="font-semibold text-slate-700">
                            {usia < 12 ? `${usia} bulan` : `${Math.floor(usia / 12)} thn ${usia % 12} bln`}
                        </p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-[10px] text-slate-400 mb-0.5">Jenis Kelamin</p>
                        <p className="font-semibold text-slate-700">
                            {balita.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                        </p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-[10px] text-slate-400 mb-0.5">Tanggal Lahir</p>
                        <p className="font-semibold text-slate-700">{formatDate(balita.tanggal_lahir)}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-[10px] text-slate-400 mb-0.5">NIK</p>
                        <p className="font-semibold text-slate-700 text-xs">
                            {balita.nik_status === 'SEMENTARA' ? (
                                <span className="text-amber-500">Sementara</span>
                            ) : (
                                balita.nik
                            )}
                        </p>
                    </div>
                </div>
            </Card>

            {/* Last Measurement */}
            {lastKunjungan && (
                <Card className="p-4 bg-gradient-to-r from-teal-50 to-emerald-50 border-teal-100">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-teal-600" />
                        <span className="text-xs font-semibold text-teal-700">Pengukuran Terakhir</span>
                        <span className="text-[10px] text-teal-500 ml-auto">
                            {BULAN_NAMES[lastKunjungan.bulan]} {lastKunjungan.tahun}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <p className="text-[10px] text-teal-500">Berat</p>
                            <p className="text-lg font-bold text-teal-800">{formatNumber(lastKunjungan.berat_badan)} <span className="text-xs font-normal">kg</span></p>
                        </div>
                        <div>
                            <p className="text-[10px] text-teal-500">Tinggi</p>
                            <p className="text-lg font-bold text-teal-800">{formatNumber(lastKunjungan.tinggi_badan)} <span className="text-xs font-normal">cm</span></p>
                        </div>
                    </div>
                </Card>
            )}

            {/* History + Add Button */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">Riwayat Kunjungan</h3>
                <Button size="sm" onClick={() => setShowForm(true)}>
                    <Plus className="h-4 w-4" />
                    Timbang
                </Button>
            </div>

            {kunjungan.length === 0 ? (
                <Card className="p-6 text-center">
                    <Scale className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">Belum ada data kunjungan</p>
                </Card>
            ) : (
                <div className="space-y-2">
                    {kunjungan.map((k) => (
                        <Card key={k.id} className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                    <span className="text-xs font-semibold text-slate-600">
                                        {BULAN_NAMES[k.bulan]} {k.tahun}
                                    </span>
                                </div>
                                {k.status_gizi && (
                                    <span className={cn(
                                        'text-[10px] font-medium px-2 py-0.5 rounded-full',
                                        k.status_gizi === 'NORMAL' && 'bg-green-50 text-green-600',
                                        k.status_gizi === 'KURANG' && 'bg-amber-50 text-amber-600',
                                        k.status_gizi === 'BURUK' && 'bg-red-50 text-red-600',
                                        k.status_gizi === 'LEBIH' && 'bg-blue-50 text-blue-600',
                                    )}>
                                        {k.status_gizi}
                                    </span>
                                )}
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-xs">
                                <div>
                                    <p className="text-slate-400">BB</p>
                                    <p className="font-semibold text-slate-700">{formatNumber(k.berat_badan)} kg</p>
                                </div>
                                <div>
                                    <p className="text-slate-400">TB</p>
                                    <p className="font-semibold text-slate-700">{formatNumber(k.tinggi_badan)} cm</p>
                                </div>
                                <div>
                                    <p className="text-slate-400">LK</p>
                                    <p className="font-semibold text-slate-700">{formatNumber(k.lingkar_kepala)}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400">LiLA</p>
                                    <p className="font-semibold text-slate-700">{formatNumber(k.lingkar_lengan)}</p>
                                </div>
                            </div>
                            {(k.vitamin_a || k.obat_cacing) && (
                                <div className="flex gap-2 mt-2">
                                    {k.vitamin_a && <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">Vitamin A</span>}
                                    {k.obat_cacing && <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">Obat Cacing</span>}
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}

            {/* Visit Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
                    <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-slate-800">Catat Kunjungan</h2>
                            <button onClick={() => setShowForm(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                                <X className="h-5 w-5 text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitKunjungan} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-slate-700">Tanggal Kunjungan</label>
                                <input
                                    type="date"
                                    value={formData.periode_kunjungan}
                                    onChange={(e) => setFormData(prev => ({ ...prev, periode_kunjungan: e.target.value }))}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <Input
                                    label="Berat Badan (kg)"
                                    type="number"
                                    step="0.1"
                                    placeholder="0.0"
                                    value={formData.berat_badan}
                                    onChange={(e) => setFormData(prev => ({ ...prev, berat_badan: e.target.value }))}
                                    error={formErrors.berat_badan}
                                />
                                <Input
                                    label="Tinggi Badan (cm)"
                                    type="number"
                                    step="0.1"
                                    placeholder="0.0"
                                    value={formData.tinggi_badan}
                                    onChange={(e) => setFormData(prev => ({ ...prev, tinggi_badan: e.target.value }))}
                                    error={formErrors.tinggi_badan}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <Input
                                    label="Lingkar Kepala (cm)"
                                    type="number"
                                    step="0.1"
                                    placeholder="Opsional"
                                    value={formData.lingkar_kepala}
                                    onChange={(e) => setFormData(prev => ({ ...prev, lingkar_kepala: e.target.value }))}
                                />
                                <Input
                                    label="LiLA (cm)"
                                    type="number"
                                    step="0.1"
                                    placeholder="Opsional"
                                    value={formData.lingkar_lengan}
                                    onChange={(e) => setFormData(prev => ({ ...prev, lingkar_lengan: e.target.value }))}
                                />
                            </div>

                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.vitamin_a}
                                        onChange={(e) => setFormData(prev => ({ ...prev, vitamin_a: e.target.checked }))}
                                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                                    />
                                    <span className="text-sm text-slate-600">Vitamin A</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.obat_cacing}
                                        onChange={(e) => setFormData(prev => ({ ...prev, obat_cacing: e.target.checked }))}
                                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                                    />
                                    <span className="text-sm text-slate-600">Obat Cacing</span>
                                </label>
                            </div>

                            <Input
                                label="Catatan"
                                placeholder="Catatan tambahan (opsional)"
                                value={formData.catatan}
                                onChange={(e) => setFormData(prev => ({ ...prev, catatan: e.target.value }))}
                            />

                            <div className="pt-2">
                                <Button type="submit" className="w-full" isLoading={isSaving}>
                                    Simpan Kunjungan
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Profile Modal */}
            {showEditForm && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowEditForm(false)} />
                    <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-slate-800">Edit Profil Balita</h2>
                            <button onClick={() => setShowEditForm(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                                <X className="h-5 w-5 text-slate-400" />
                            </button>
                        </div>
                        <form onSubmit={handleEditBalita} className="space-y-4">
                            <Input label="Nama Balita" value={editFormData.nama} onChange={(e) => setEditFormData(p => ({ ...p, nama: e.target.value }))} required />
                            <Input label="Nama Ibu" value={editFormData.nama_ibu} onChange={(e) => setEditFormData(p => ({ ...p, nama_ibu: e.target.value }))} required />
                            <Input label="Tanggal Lahir" type="date" value={editFormData.tanggal_lahir} onChange={(e) => setEditFormData(p => ({ ...p, tanggal_lahir: e.target.value }))} required />
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-slate-700">Jenis Kelamin</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button type="button" onClick={() => setEditFormData(p => ({ ...p, jenis_kelamin: 'L' }))} className={cn('py-2 rounded-xl border text-sm transition-all', editFormData.jenis_kelamin === 'L' ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold' : 'bg-white border-slate-200')}>Laki-laki</button>
                                    <button type="button" onClick={() => setEditFormData(p => ({ ...p, jenis_kelamin: 'P' }))} className={cn('py-2 rounded-xl border text-sm transition-all', editFormData.jenis_kelamin === 'P' ? 'bg-pink-50 border-pink-300 text-pink-700 font-bold' : 'bg-white border-slate-200')}>Perempuan</button>
                                </div>
                            </div>
                            <Input label="NIK (Opsional)" value={editFormData.nik} onChange={(e) => setEditFormData(p => ({ ...p, nik: e.target.value }))} />
                            <div className="pt-2">
                                <Button type="submit" className="w-full" isLoading={isSaving}>Simpan Perubahan</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
                    <div className="relative w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl animate-fade-in">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
                                <AlertCircle className="h-6 w-6 text-red-500" />
                            </div>
                            <h3 className="text-base font-bold text-slate-900">Hapus Data Balita?</h3>
                            <p className="text-xs text-slate-500 mt-2">Data akan dipindahkan ke arsip dan tidak akan muncul di daftar aktif. Tindakan ini tidak dapat dibatalkan.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-6">
                            <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>Batal</Button>
                            <Button variant="danger" onClick={handleDeleteBalita} isLoading={isDeleting}>Ya, Hapus</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
