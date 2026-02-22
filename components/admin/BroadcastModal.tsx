'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { X, Send, Copy, Check, MessageSquare, Users, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface PosyanduItem {
    id: string;
    nama: string;
    hari_buka: string;
    jam_buka: string;
}

interface UserRecipient {
    id: string;
    nama_lengkap: string;
    no_hp: string;
}

interface BroadcastModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function BroadcastModal({ isOpen, onClose }: BroadcastModalProps) {
    const [posyanduList, setPosyanduList] = useState<PosyanduItem[]>([]);
    const [selectedPosyandu, setSelectedPosyandu] = useState<PosyanduItem | null>(null);
    const [recipients, setRecipients] = useState<UserRecipient[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        if (isOpen) {
            fetchPosyandu();
        }
    }, [isOpen]);

    const fetchPosyandu = async () => {
        const { data } = await supabase.from('posyandu').select('id, nama, hari_buka, jam_buka').eq('is_active', true);
        if (data) {
            const sortedData = [...data].sort((a, b) =>
                a.nama.localeCompare(b.nama, undefined, { numeric: true, sensitivity: 'base' })
            );
            setPosyanduList(sortedData);
        }
    };

    const fetchRecipients = async (posyanduId: string) => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('users')
                .select('id, nama_lengkap, no_hp')
                .eq('posyandu_id', posyanduId)
                .eq('role', 'ORANG_TUA')
                .eq('status', 'AKTIF');

            if (error) throw error;
            setRecipients(data || []);
        } catch {
            toast.error('Gagal memuat daftar warga');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectPosyandu = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        const pos = posyanduList.find(p => p.id === id) || null;
        setSelectedPosyandu(pos);
        if (id) fetchRecipients(id);
        else setRecipients([]);
    };

    const generateMessage = () => {
        if (!selectedPosyandu) return '';
        return `Halo Ayah/Bunda warga Desa Merden,\n\nMengingatkan kembali bahwa besok ada jadwal Posyandu di *${selectedPosyandu.nama}* mulai jam *${selectedPosyandu.jam_buka}*. \n\nMohon kehadirannya untuk pemeriksaan kesehatan rutin. Terima kasih! 🙏`;
    };

    const copyAllNumbers = () => {
        const numbers = recipients.map(r => r.no_hp).filter(Boolean).join(',');
        if (!numbers) {
            toast.error('Tidak ada nomor untuk disalin');
            return;
        }
        navigator.clipboard.writeText(numbers);
        setIsCopied(true);
        toast.success('Daftar nomor berhasil disalin');
        setTimeout(() => setIsCopied(false), 2000);
    };

    const openWhatsApp = (no_hp: string) => {
        const cleanPhone = no_hp.replace(/[^0-9]/g, '');
        const finalPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
        const message = encodeURIComponent(generateMessage());
        window.open(`https://wa.me/${finalPhone}?text=${message}`, '_blank');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl animate-slide-up overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-teal-100 text-teal-700 rounded-xl">
                            <MessageSquare className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Broadcast Pengingat</h2>
                            <p className="text-xs text-slate-500 font-medium tracking-tight">Kirim pesan WhatsApp bulk ke warga</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">
                    {/* Step 1: Select Posyandu */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Building2 className="h-3 w-3" /> Pilih Posyandu
                        </label>
                        <select
                            onChange={handleSelectPosyandu}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-teal-500 focus:border-teal-500 block p-3 transition-all"
                        >
                            <option value="">-- Pilih Lokasi --</option>
                            {posyanduList.map(p => (
                                <option key={p.id} value={p.id}>{p.nama}</option>
                            ))}
                        </select>
                    </div>

                    {selectedPosyandu && (
                        <>
                            {/* Step 2: Message Preview */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Preview Pesan</label>
                                <div className="p-4 bg-teal-50/50 border border-teal-100/50 rounded-xl">
                                    <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed italic">
                                        "{generateMessage()}"
                                    </p>
                                </div>
                            </div>

                            {/* Step 3: Recipients */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <Users className="h-3 w-3" /> Daftar Penerima ({recipients.length})
                                    </label>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={copyAllNumbers}
                                        disabled={recipients.length === 0}
                                        className="h-8 text-[10px] font-black tracking-wide rounded-lg"
                                    >
                                        {isCopied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                                        {isCopied ? 'SALIN BERHASIL' : 'SALIN SEMUA NOMOR'}
                                    </Button>
                                </div>

                                {isLoading ? (
                                    <div className="py-10 text-center animate-pulse">
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Mencari data warga...</p>
                                    </div>
                                ) : recipients.length > 0 ? (
                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                        {recipients.map(r => (
                                            <div key={r.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between group border border-transparent hover:border-teal-100 hover:bg-white transition-all shadow-sm">
                                                <div>
                                                    <p className="text-xs font-bold text-slate-800">{r.nama_lengkap}</p>
                                                    <p className="text-[10px] font-medium text-slate-400">{r.no_hp}</p>
                                                </div>
                                                <button
                                                    onClick={() => openWhatsApp(r.no_hp)}
                                                    className="p-2 bg-emerald-50 text-emerald-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Kirim Pesan"
                                                >
                                                    <Send className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                        <p className="text-xs text-slate-400 font-medium italic">Tidak ada orang tua terdaftar di Posyandu ini.</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
                    <p className="text-[10px] text-slate-400 leading-relaxed font-medium max-w-xs mx-auto">
                        Klik <strong>Salin Semua Nomor</strong> untuk memudahkan pembuatan Broadcast List di WhatsApp smartphone Anda.
                    </p>
                </div>
            </div>
        </div>
    );
}
