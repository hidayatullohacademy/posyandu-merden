'use client';

import { useState, useEffect, use, useMemo } from 'react';
import { createClient } from '@/lib/supabase';
import { ArrowLeft, Activity, Plus, X, Calendar, AlertTriangle, HeartPulse, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn, formatDate, hitungUsiaTahun, hitungIMT, getStatusIMT, evaluateRisikoLansia, formatNumber, parseNumber, formatUsiaDetail, isValidNumber } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface LansiaDetail {
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

interface KunjunganLansiaRecord {
    id: string;
    bulan: number;
    tahun: number;
    berat_badan: number;
    tinggi_badan: number;
    lingkar_perut: number | null;
    imt: number | null;
    sistolik: number | null;
    diastolik: number | null;
    gula_darah: number | null;
    kolesterol: number | null;
    asam_urat: number | null;
    perlu_rujukan: boolean;
    keluhan: string | null;
    catatan: string | null;
    created_at: string;
}

const BULAN_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];

export default function LansiaDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [lansia, setLansia] = useState<LansiaDetail | null>(null);
    const [kunjungan, setKunjungan] = useState<KunjunganLansiaRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [showEditForm, setShowEditForm] = useState(false);
    const [editFormData, setEditFormData] = useState({
        nama_lengkap: '',
        tempat_lahir: '',
        tanggal_lahir: '',
        jenis_kelamin: '',
        nik: '',
        alamat: ''
    });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [editVisitId, setEditVisitId] = useState<string | null>(null);
    const [showDeleteVisitConfirm, setShowDeleteVisitConfirm] = useState(false);
    const [visitToDeleteId, setVisitToDeleteId] = useState<string | null>(null);

    const supabase = createClient();

    const now = new Date();
    const [formData, setFormData] = useState({
        berat_badan: '', tinggi_badan: '', lingkar_perut: '',
        sistolik: '', diastolik: '', gula_darah: '', kolesterol: '', asam_urat: '',
        perlu_rujukan: false, keluhan: '', catatan: '',
        periode_kunjungan: now.toISOString().slice(0, 7),
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchData(); }, [id]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [lansiaRes, kunjunganRes] = await Promise.all([
                supabase.from('lansia').select('*').eq('id', id).single(),
                supabase.from('kunjungan_lansia').select('*').eq('lansia_id', id)
                    .order('tahun', { ascending: false }).order('bulan', { ascending: false }),
            ]);
            if (lansiaRes.error) throw lansiaRes.error;
            setLansia(lansiaRes.data);
            setKunjungan(kunjunganRes.data || []);
        } catch {
            toast.error('Gagal memuat data lansia');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditLansia = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('lansia')
                .update({
                    nama_lengkap: editFormData.nama_lengkap,
                    tempat_lahir: editFormData.tempat_lahir,
                    tanggal_lahir: editFormData.tanggal_lahir,
                    jenis_kelamin: editFormData.jenis_kelamin,
                    alamat: editFormData.alamat,
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

    const handleDeleteLansia = async () => {
        setIsDeleting(true);
        try {
            const { error } = await supabase
                .from('lansia')
                .update({ is_active: false })
                .eq('id', id);

            if (error) throw error;
            toast.success('Data berhasil dihapus');
            window.location.href = '/kader/lansia';
        } catch {
            toast.error('Gagal menghapus data');
            setIsDeleting(false);
        }
    };

    const handleSubmitKunjungan = async (e: React.FormEvent) => {
        e.preventDefault();
        const errors: Record<string, string> = {};
        if (!isValidNumber(formData.berat_badan) || parseNumber(formData.berat_badan) <= 0) errors.berat_badan = 'Wajib diisi';
        if (!isValidNumber(formData.tinggi_badan) || parseNumber(formData.tinggi_badan) <= 0) errors.tinggi_badan = 'Wajib diisi';
        setFormErrors(errors);
        if (Object.keys(errors).length > 0) return;

        setIsSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { toast.error('Sesi habis'); return; }

            const bb = parseNumber(formData.berat_badan);
            const tb = parseNumber(formData.tinggi_badan);
            const imt = hitungIMT(bb, tb);

            const sistolik = formData.sistolik ? parseInt(formData.sistolik) : null;
            const diastolik = formData.diastolik ? parseInt(formData.diastolik) : null;
            const gulaDarah = formData.gula_darah ? parseNumber(formData.gula_darah) : null;
            const kolesterol = formData.kolesterol ? parseNumber(formData.kolesterol) : null;
            const asamUrat = formData.asam_urat ? parseNumber(formData.asam_urat) : null;
            const lingkarPerut = formData.lingkar_perut ? parseNumber(formData.lingkar_perut) : null;

            // Auto-calculate risk flags and referral recommendations
            const { flags, rekomendasiRujukan } = evaluateRisikoLansia({
                jk: lansia!.jenis_kelamin as 'L' | 'P',
                sistolik,
                diastolik,
                gulaDarah,
                kolesterol,
                asamUrat,
                lingkarPerut,
                imt
            });

            const visitData = {
                lansia_id: id,
                posyandu_id: lansia!.posyandu_id,
                bulan: parseInt(formData.periode_kunjungan.split('-')[1]),
                tahun: parseInt(formData.periode_kunjungan.split('-')[0]),
                berat_badan: bb,
                tinggi_badan: tb,
                lingkar_perut: lingkarPerut,
                imt,
                sistolik,
                diastolik,
                gula_darah: gulaDarah,
                kolesterol,
                asam_urat: asamUrat,
                perlu_rujukan: formData.perlu_rujukan || rekomendasiRujukan,
                flag_risiko: flags,
                keluhan: formData.keluhan || null,
                catatan: formData.catatan || null,
                dicatat_oleh: user.id,
            };

            const { error } = editVisitId
                ? await supabase.from('kunjungan_lansia').update(visitData).eq('id', editVisitId)
                : await supabase.from('kunjungan_lansia').insert(visitData);

            if (error) {
                if (error.code === '23505') { toast.error('Data bulan ini sudah ada'); return; }
                throw error;
            }

            toast.success(editVisitId ? 'Kunjungan diperbarui!' : 'Kunjungan berhasil dicatat!');
            setShowForm(false);
            setEditVisitId(null);
            setFormData({
                berat_badan: '', tinggi_badan: '', lingkar_perut: '',
                sistolik: '', diastolik: '', gula_darah: '', kolesterol: '', asam_urat: '',
                perlu_rujukan: false, keluhan: '', catatan: '',
                periode_kunjungan: now.toISOString().slice(0, 7),
            });
            fetchData();
        } catch (error: any) {
            console.error('Error saving kunjungan lansia:', error);
            toast.error(`Gagal menyimpan: ${error.message || 'Error tidak diketahui'}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteVisit = async () => {
        if (!visitToDeleteId) return;
        setIsDeleting(true);
        try {
            const { error } = await supabase
                .from('kunjungan_lansia')
                .delete()
                .eq('id', visitToDeleteId);

            if (error) throw error;
            toast.success('Riwayat kunjungan dihapus');
            setShowDeleteVisitConfirm(false);
            setVisitToDeleteId(null);
            fetchData();
        } catch (error: any) {
            toast.error('Gagal menghapus data: ' + (error.message || ''));
        } finally {
            setIsDeleting(false);
        }
    };

    const bbVal = parseNumber(formData.berat_badan);
    const tbVal = parseNumber(formData.tinggi_badan);
    const currentIMT = useMemo(() => (bbVal && tbVal ? hitungIMT(bbVal, tbVal) : null), [bbVal, tbVal]);

    const currentRisk = useMemo(() => {
        if (!lansia) return { flags: {}, rekomendasiRujukan: false };
        const currentSistolik = formData.sistolik ? parseInt(formData.sistolik) : null;
        const currentDiastolik = formData.diastolik ? parseInt(formData.diastolik) : null;
        const currentGDS = formData.gula_darah ? parseNumber(formData.gula_darah) : null;
        const currentKolesterol = formData.kolesterol ? parseNumber(formData.kolesterol) : null;
        const currentAsamUrat = formData.asam_urat ? parseNumber(formData.asam_urat) : null;
        const currentLingkarPerut = formData.lingkar_perut ? parseNumber(formData.lingkar_perut) : null;

        return evaluateRisikoLansia({
            jk: lansia.jenis_kelamin as 'L' | 'P',
            sistolik: currentSistolik,
            diastolik: currentDiastolik,
            gulaDarah: currentGDS,
            kolesterol: currentKolesterol,
            asamUrat: currentAsamUrat,
            lingkarPerut: currentLingkarPerut,
            imt: currentIMT
        });
    }, [
        lansia, formData.sistolik,
        formData.diastolik, formData.gula_darah, formData.kolesterol, formData.asam_urat,
        formData.lingkar_perut, currentIMT
    ]);

    // Auto-sync form state for referral if system recommends it
    useEffect(() => {
        if (showForm && currentRisk.rekomendasiRujukan && !formData.perlu_rujukan) {
            setFormData(prev => ({ ...prev, perlu_rujukan: true }));
        }
    }, [currentRisk.rekomendasiRujukan, showForm, formData.perlu_rujukan]);

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

    if (!lansia) {
        return (
            <div className="text-center py-12">
                <p className="text-sm text-slate-400">Data lansia tidak ditemukan</p>
                <Link href="/kader/lansia"><Button variant="ghost" size="sm" className="mt-3"><ArrowLeft className="h-4 w-4" /> Kembali</Button></Link>
            </div>
        );
    }

    const usia = hitungUsiaTahun(lansia.tanggal_lahir);
    const lastK = kunjungan[0];

    const getTensiColor = (sistolik: number | null) => {
        if (!sistolik) return 'text-slate-400';
        if (sistolik >= 180) return 'text-red-600';
        if (sistolik >= 140) return 'text-amber-600';
        return 'text-green-600';
    };

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-3">
                <Link href="/kader/lansia" className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                    <ArrowLeft className="h-5 w-5 text-slate-500" />
                </Link>
                <h1 className="text-lg font-bold text-slate-800">Profil Lansia</h1>
                <div className="ml-auto flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => {
                        setEditFormData({
                            nama_lengkap: lansia.nama_lengkap,
                            tempat_lahir: lansia.tempat_lahir,
                            tanggal_lahir: lansia.tanggal_lahir,
                            jenis_kelamin: lansia.jenis_kelamin,
                            alamat: lansia.alamat,
                            nik: lansia.nik_status === 'ASLI' ? lansia.nik : ''
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

            {/* Profile */}
            <Card className="p-5">
                <div className="flex items-center gap-4 mb-4">
                    <div className={cn(
                        'w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl',
                        lansia.jenis_kelamin === 'L' ? 'bg-gradient-to-br from-blue-400 to-blue-600' : 'bg-gradient-to-br from-pink-400 to-pink-600'
                    )}>
                        {lansia.nama_lengkap.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">{lansia.nama_lengkap}</h2>
                        <p className="text-xs text-slate-400">{lansia.alamat}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-[10px] text-slate-400 mb-0.5">Usia</p>
                        <p className="font-semibold text-slate-700">{formatUsiaDetail(lansia.tanggal_lahir)}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-[10px] text-slate-400 mb-0.5">Jenis Kelamin</p>
                        <p className="font-semibold text-slate-700">{lansia.jenis_kelamin === 'L' ? 'LAKI-LAKI' : 'PEREMPUAN'}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-[10px] text-slate-400 mb-0.5">TTL</p>
                        <p className="font-semibold text-slate-700 text-xs">{lansia.tempat_lahir}, {formatDate(lansia.tanggal_lahir)}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-[10px] text-slate-400 mb-0.5">NIK</p>
                        <p className="font-semibold text-slate-700 text-xs">
                            {lansia.nik_status === 'SEMENTARA' ? <span className="text-amber-500">Sementara</span> : lansia.nik}
                        </p>
                    </div>
                </div>
            </Card>

            {/* Last Visit Quick Stats */}
            {lastK && (
                <Card className="p-4 bg-gradient-to-r from-rose-50 to-orange-50 border-rose-100">
                    <div className="flex items-center gap-2 mb-3">
                        <Activity className="h-4 w-4 text-rose-600" />
                        <span className="text-xs font-semibold text-rose-700">Pemeriksaan Terakhir — {BULAN_NAMES[lastK.bulan]} {lastK.tahun}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                            <p className="text-rose-400">Tensi</p>
                            <p className={cn('font-bold', getTensiColor(lastK.sistolik))}>
                                {lastK.sistolik && lastK.diastolik ? `${lastK.sistolik}/${lastK.diastolik}` : '—'}
                            </p>
                        </div>
                        <div>
                            <p className="text-rose-400">GDS</p>
                            <p className="font-bold text-slate-700">{formatNumber(lastK.gula_darah)}</p>
                        </div>
                        <div>
                            <p className="text-rose-400">IMT</p>
                            <p className="font-bold text-slate-700">{lastK.imt ? `${formatNumber(lastK.imt)} (${getStatusIMT(lastK.imt)})` : '—'}</p>
                        </div>
                    </div>
                    {lastK.perlu_rujukan && (
                        <div className="flex items-center gap-2 mt-2 text-xs text-red-600">
                            <AlertTriangle className="h-3.5 w-3.5" /> Perlu rujukan
                        </div>
                    )}
                </Card>
            )}

            {/* History */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">Riwayat Kunjungan</h3>
                <Button size="sm" onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> Periksa</Button>
            </div>

            {kunjungan.length === 0 ? (
                <Card className="p-6 text-center">
                    <Activity className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">Belum ada data kunjungan</p>
                </Card>
            ) : (
                <div className="space-y-2">
                    {kunjungan.map((k) => (
                        <Card key={k.id} className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                    <span className="text-xs font-semibold text-slate-600">{BULAN_NAMES[k.bulan]} {k.tahun}</span>
                                    {k.perlu_rujukan && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600">Rujukan</span>}
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => {
                                            setEditVisitId(k.id);
                                            setFormData({
                                                berat_badan: k.berat_badan.toString().replace('.', ','),
                                                tinggi_badan: k.tinggi_badan.toString().replace('.', ','),
                                                lingkar_perut: k.lingkar_perut?.toString().replace('.', ',') || '',
                                                sistolik: k.sistolik?.toString() || '',
                                                diastolik: k.diastolik?.toString() || '',
                                                gula_darah: k.gula_darah?.toString().replace('.', ',') || '',
                                                kolesterol: k.kolesterol?.toString().replace('.', ',') || '',
                                                asam_urat: k.asam_urat?.toString().replace('.', ',') || '',
                                                perlu_rujukan: k.perlu_rujukan,
                                                keluhan: k.keluhan || '',
                                                catatan: k.catatan || '',
                                                periode_kunjungan: `${k.tahun}-${k.bulan.toString().padStart(2, '0')}`
                                            });
                                            setShowForm(true);
                                        }}
                                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
                                    >
                                        <Edit2 className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setVisitToDeleteId(k.id);
                                            setShowDeleteVisitConfirm(true);
                                        }}
                                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                                <div><p className="text-slate-400">BB</p><p className="font-semibold text-slate-700">{formatNumber(k.berat_badan)} kg</p></div>
                                <div><p className="text-slate-400">TB</p><p className="font-semibold text-slate-700">{formatNumber(k.tinggi_badan)} cm</p></div>
                                <div><p className="text-slate-400">Tensi</p><p className={cn('font-semibold', getTensiColor(k.sistolik))}>{k.sistolik && k.diastolik ? `${k.sistolik}/${k.diastolik}` : '—'}</p></div>
                                <div><p className="text-slate-400">GDS</p><p className="font-semibold text-slate-700">{formatNumber(k.gula_darah)}</p></div>
                                <div><p className="text-slate-400">Kolesterol</p><p className="font-semibold text-slate-700">{formatNumber(k.kolesterol)}</p></div>
                                <div><p className="text-slate-400">Asam Urat</p><p className="font-semibold text-slate-700">{formatNumber(k.asam_urat)}</p></div>
                            </div>
                            {k.keluhan && <p className="text-xs text-slate-500 mt-2 italic">Keluhan: {k.keluhan}</p>}
                        </Card>
                    ))}
                </div>
            )}

            {/* Visit Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => { setShowForm(false); setEditVisitId(null); }} />
                    <div className="relative w-full max-w-lg bg-slate-50 rounded-t-[2rem] sm:rounded-2xl shadow-2xl animate-slide-up h-[90vh] sm:h-auto sm:max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10 rounded-t-[2rem] sm:rounded-t-2xl">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">{editVisitId ? 'Edit Data Pemeriksaan' : 'Kunjungan Lansia'}</h2>
                                <p className="text-sm font-medium text-teal-600">{lansia.nama_lengkap} ({lansia.jenis_kelamin})</p>
                            </div>
                            <button onClick={() => { setShowForm(false); setEditVisitId(null); }} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors">
                                <X className="h-5 w-5 text-slate-500" />
                            </button>
                        </div>
                        <div className="overflow-y-auto flex-1 p-6 space-y-6">
                            <form id="kunjunganLansiaForm" onSubmit={handleSubmitKunjungan} className="space-y-6">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Bulan & Tahun Kunjungan</label>
                                    <input
                                        type="month"
                                        value={formData.periode_kunjungan}
                                        onChange={(e) => setFormData(prev => ({ ...prev, periode_kunjungan: e.target.value }))}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium shadow-sm focus:border-teal-500 focus:ring-teal-500"
                                        required
                                    />
                                </div>
                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                            <Activity className="h-4 w-4 text-teal-500" /> Antropometri
                                        </h3>
                                        {currentIMT && (
                                            <span className={cn(
                                                "text-[10px] font-bold px-2 py-1 rounded-full",
                                                currentRisk.flags.imt?.includes('Kurus') ? "bg-amber-100 text-amber-700" :
                                                    currentRisk.flags.imt?.includes('Gemuk') ? "bg-amber-100 text-amber-700" :
                                                        "bg-teal-100 text-teal-700"
                                            )}>
                                                IMT: {formatNumber(currentIMT)} {currentRisk.flags.imt || '(✅ Normal)'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label="Berat Badan (kg)" type="text" inputMode="decimal" placeholder="0,0" value={formData.berat_badan} onChange={(e) => setFormData(prev => ({ ...prev, berat_badan: e.target.value }))} error={formErrors.berat_badan} />
                                        <Input label="Tinggi Badan (cm)" type="text" inputMode="decimal" placeholder="0,0" value={formData.tinggi_badan} onChange={(e) => setFormData(prev => ({ ...prev, tinggi_badan: e.target.value }))} error={formErrors.tinggi_badan} />
                                    </div>
                                    <div className="relative">
                                        <Input label="Lingkar Perut (cm)" type="text" inputMode="decimal" placeholder="Opsional" value={formData.lingkar_perut} onChange={(e) => setFormData(prev => ({ ...prev, lingkar_perut: e.target.value }))} />
                                        {currentRisk.flags.lingkarPerut && (
                                            <span className="absolute top-0 right-2 mt-[2px] text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                                {currentRisk.flags.lingkarPerut}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2">
                                        <HeartPulse className="h-4 w-4 text-rose-500" /> Pemeriksaan Medis
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="relative">
                                            <p className="text-xs font-semibold text-slate-700 mb-1.5">Tekanan Darah (mmHg)</p>
                                            <div className="grid grid-cols-2 gap-4">
                                                <Input type="text" inputMode="decimal" placeholder="Sistolik" value={formData.sistolik} onChange={(e) => setFormData(prev => ({ ...prev, sistolik: e.target.value }))} />
                                                <Input type="text" inputMode="decimal" placeholder="Diastolik" value={formData.diastolik} onChange={(e) => setFormData(prev => ({ ...prev, diastolik: e.target.value }))} />
                                            </div>
                                            {currentRisk.flags.tensi && (
                                                <div className="mt-1 flex justify-end">
                                                    <span className={cn(
                                                        "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                                        currentRisk.flags.tensi.includes('Kritis') ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                                                    )}>
                                                        {currentRisk.flags.tensi}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="relative">
                                                <Input label="GDS (mg/dL)" type="text" inputMode="decimal" placeholder="-" value={formData.gula_darah} onChange={(e) => setFormData(prev => ({ ...prev, gula_darah: e.target.value }))} />
                                                {currentRisk.flags.gulaDarah && (
                                                    <span className="absolute -top-1 -right-1 text-[8px] font-bold text-white bg-red-500 px-1.5 py-[1px] rounded flex items-center shadow-sm">
                                                        {currentRisk.flags.gulaDarah.includes('Kritis') || currentRisk.flags.gulaDarah.includes('Tinggi') ? '🔴' : '⚠️'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="relative">
                                                <Input label="Kolesterol" type="text" inputMode="decimal" placeholder="-" value={formData.kolesterol} onChange={(e) => setFormData(prev => ({ ...prev, kolesterol: e.target.value }))} />
                                                {currentRisk.flags.kolesterol && (
                                                    <span className="absolute -top-1 -right-1 text-[8px] font-bold text-white bg-red-500 px-1.5 py-[1px] rounded flex items-center shadow-sm">
                                                        {currentRisk.flags.kolesterol.includes('Kritis') ? '🔴' : '⚠️'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="relative">
                                                <Input label="Asam Urat" type="text" inputMode="decimal" placeholder="-" value={formData.asam_urat} onChange={(e) => setFormData(prev => ({ ...prev, asam_urat: e.target.value }))} />
                                                {currentRisk.flags.asamUrat && (
                                                    <span className="absolute -top-1 -right-1 text-[8px] font-bold text-white bg-amber-500 px-1.5 py-[1px] rounded flex items-center shadow-sm">⚠️</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className={cn(
                                    "p-5 rounded-2xl border transition-colors",
                                    currentRisk.rekomendasiRujukan ? "bg-amber-50 border-amber-200" : "bg-white border-slate-100 shadow-sm"
                                )}>
                                    {currentRisk.rekomendasiRujukan && (
                                        <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-100 rounded-xl text-xs flex items-start gap-2 animate-fade-in">
                                            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                                            <p><b>Peringatan:</b> Sistem menyarankan Rujukan karena terdeteksi indikator Kritis atau Tinggi. Opsi rujukan telah dicentang otomatis.</p>
                                        </div>
                                    )}
                                    <label className="flex items-center gap-3 cursor-pointer p-2 rounded-xl hover:bg-slate-50 transition-colors">
                                        <div className="relative flex items-center">
                                            <input type="checkbox" checked={formData.perlu_rujukan} onChange={(e) => setFormData(prev => ({ ...prev, perlu_rujukan: e.target.checked }))} className="w-5 h-5 rounded border-slate-300 text-red-600 focus:ring-red-500 transition-all peer" />
                                        </div>
                                        <div>
                                            <span className="text-sm font-bold text-slate-800 block">Tandai Perlu Rujukan</span>
                                            <span className="text-[10px] text-slate-500">Rujuk ke Puskesmas / Faskes lanjutan</span>
                                        </div>
                                    </label>
                                </div>
                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                                    <Input label="Keluhan" placeholder="Keluhan pasien (opsional)" value={formData.keluhan} onChange={(e) => setFormData(prev => ({ ...prev, keluhan: e.target.value }))} />
                                    <Input label="Catatan Tambahan" placeholder="Catatan kader (opsional)" value={formData.catatan} onChange={(e) => setFormData(prev => ({ ...prev, catatan: e.target.value }))} />
                                </div>
                                <div className="h-4"></div>
                            </form>
                        </div>
                        <div className="bg-white p-4 border-t border-slate-100 sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pt-4 pb-8 sm:pb-4">
                            <Button form="kunjunganLansiaForm" type="submit" className="w-full h-12 text-base font-bold bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-500/30 rounded-xl" isLoading={isSaving}>
                                {editVisitId ? 'Simpan Perubahan' : 'Simpan Data Pemeriksaan'}
                            </Button>
                        </div>
                    </div>
                </div>
            )
            }

            {/* Edit Profile Modal */}
            {
                showEditForm && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowEditForm(false)} />
                        <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-lg font-bold text-slate-800">Edit Profil Lansia</h2>
                                <button onClick={() => setShowEditForm(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                                    <X className="h-5 w-5 text-slate-400" />
                                </button>
                            </div>
                            <form onSubmit={handleEditLansia} className="space-y-4">
                                <Input label="Nama Lengkap" value={editFormData.nama_lengkap} onChange={(e) => setEditFormData(p => ({ ...p, nama_lengkap: e.target.value.toUpperCase() }))} required />
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-slate-700">Jenis Kelamin</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button type="button" onClick={() => setEditFormData(p => ({ ...p, jenis_kelamin: 'L' }))} className={cn('py-2 rounded-xl border text-[10px] font-bold transition-all uppercase tracking-wider', editFormData.jenis_kelamin === 'L' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-slate-200 text-slate-400')}>♂ LAKI-LAKI</button>
                                        <button type="button" onClick={() => setEditFormData(p => ({ ...p, jenis_kelamin: 'P' }))} className={cn('py-2 rounded-xl border text-[10px] font-bold transition-all uppercase tracking-wider', editFormData.jenis_kelamin === 'P' ? 'bg-pink-50 border-pink-300 text-pink-700' : 'bg-white border-slate-200 text-slate-400')}>♀ PEREMPUAN</button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <Input label="Tempat Lahir" value={editFormData.tempat_lahir} onChange={(e) => setEditFormData(p => ({ ...p, tempat_lahir: e.target.value.toUpperCase() }))} required />
                                    <Input label="Tanggal Lahir" type="date" value={editFormData.tanggal_lahir} onChange={(e) => setEditFormData(p => ({ ...p, tanggal_lahir: e.target.value }))} required />
                                </div>
                                <Input label="NIK (Opsional)" value={editFormData.nik} onChange={(e) => setEditFormData(p => ({ ...p, nik: e.target.value }))} />
                                <Input label="Alamat" value={editFormData.alamat} onChange={(e) => setEditFormData(p => ({ ...p, alamat: e.target.value.toUpperCase() }))} required />
                                <div className="pt-2">
                                    <Button type="submit" className="w-full" isLoading={isSaving}>Simpan Perubahan</Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Delete Confirmation */}
            {
                showDeleteConfirm && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
                        <div className="relative w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl animate-fade-in">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
                                    <AlertCircle className="h-6 w-6 text-red-500" />
                                </div>
                                <h3 className="text-base font-bold text-slate-900">Hapus Data Lansia?</h3>
                                <p className="text-xs text-slate-500 mt-2">Data akan dipindahkan ke arsip dan tidak akan muncul di daftar aktif. Tindakan ini tidak dapat dibatalkan.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mt-6">
                                <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>Batal</Button>
                                <Button variant="danger" onClick={handleDeleteLansia} isLoading={isDeleting}>Ya, Hapus</Button>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Delete Visit Confirmation */}
            {
                showDeleteVisitConfirm && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteVisitConfirm(false)} />
                        <div className="relative w-full max-w-sm bg-white rounded-2xl p-6 animate-scale-in flex flex-col items-center">
                            <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
                                <Trash2 className="h-6 w-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2 text-center">Hapus Riwayat?</h3>
                            <p className="text-sm text-slate-500 mb-6 text-center">
                                Tindakan ini tidak dapat dibatalkan. Riwayat kunjungan ini akan dihapus secara permanen.
                            </p>
                            <div className="flex gap-3 w-full">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setShowDeleteVisitConfirm(false)}
                                    disabled={isDeleting}
                                >
                                    Batal
                                </Button>
                                <Button
                                    className="flex-1 bg-red-600 hover:bg-red-700 font-bold"
                                    onClick={handleDeleteVisit}
                                    isLoading={isDeleting}
                                >
                                    Hapus
                                </Button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
