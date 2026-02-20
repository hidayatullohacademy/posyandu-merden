'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, KeyRound, LogOut, User as UserIcon, Phone, MapPin, Building2 } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface UserProfile {
    nama_lengkap: string;
    no_hp: string;
    nik: string | null;
    posyandu: { nama: string } | null;
}

export default function KaderPengaturanClient() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'profil' | 'keamanan'>('profil');

    const [passwords, setPasswords] = useState({
        newPassword: '',
        confirmPassword: ''
    });

    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        fetchProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not logged in');

            const { data, error } = await supabase
                .from('users')
                .select('nama_lengkap, no_hp, nik, posyandu:posyandu_id(nama)')
                .eq('id', user.id)
                .single();

            if (error) throw error;
            setProfile(data);
        } catch {
            toast.error('Gagal memuat profil');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwords.newPassword.length < 6) {
            toast.error('Password minimal 6 karakter');
            return;
        }

        if (passwords.newPassword !== passwords.confirmPassword) {
            toast.error('Konfirmasi password tidak cocok');
            return;
        }

        setIsSaving(true);
        try {
            const { error: authError } = await supabase.auth.updateUser({
                password: passwords.newPassword
            });

            if (authError) throw authError;

            // Update is_default_password di tabel public.users
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('users').update({ is_default_password: false }).eq('id', user.id);
            }

            toast.success('Password berhasil diubah');
            setPasswords({ newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            toast.error(error.message || 'Gagal mengubah password');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            router.push('/');
            router.refresh();
        } catch {
            toast.error('Gagal keluar');
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-8 bg-slate-200 rounded w-1/3 mb-6" />
                <Card className="p-6">
                    <div className="h-6 bg-slate-200 rounded w-1/4 mb-4" />
                    <div className="space-y-3">
                        <div className="h-10 bg-slate-100 rounded w-full" />
                        <div className="h-10 bg-slate-100 rounded w-full" />
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Akun Anda</h1>
                <p className="text-sm text-slate-400 mt-1">Kelola informasi profil dan keamanan akun</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100/80 rounded-xl p-1 shadow-inner">
                <button
                    onClick={() => setActiveTab('profil')}
                    className={cn(
                        'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300',
                        activeTab === 'profil'
                            ? 'bg-white text-teal-700 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                    )}
                >
                    <UserIcon className="h-4 w-4" />
                    Profil
                </button>
                <button
                    onClick={() => setActiveTab('keamanan')}
                    className={cn(
                        'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300',
                        activeTab === 'keamanan'
                            ? 'bg-white text-teal-700 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                    )}
                >
                    <Shield className="h-4 w-4" />
                    Keamanan
                </button>
            </div>

            {/* Profil Tab */}
            {activeTab === 'profil' && (
                <div className="space-y-6 animate-fade-in">
                    <Card className="p-5 md:p-6 overflow-hidden relative">
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 w-48 h-48 bg-teal-50 rounded-full -translate-y-24 translate-x-24 opacity-60 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-50 rounded-full translate-y-16 -translate-x-16 opacity-60 pointer-events-none" />

                        <div className="relative flex items-center gap-4 mb-8">
                            <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-teal-500/30 ring-4 ring-white">
                                <UserIcon className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">{profile?.nama_lengkap}</h2>
                                <span className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-100 text-teal-700 border border-teal-200/50 uppercase tracking-widest shadow-sm">
                                    <Shield className="h-3 w-3" /> Kader Posyandu
                                </span>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 relative z-10">
                            <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-1.5 bg-indigo-50 text-indigo-500 rounded-md">
                                        <Building2 className="h-4 w-4" />
                                    </div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Posyandu</p>
                                </div>
                                <p className="font-semibold text-slate-700 ml-10">{profile?.posyandu?.nama || '-'}</p>
                            </div>

                            <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-1.5 bg-blue-50 text-blue-500 rounded-md">
                                        <Phone className="h-4 w-4" />
                                    </div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">No. Handphone</p>
                                </div>
                                <p className="font-semibold text-slate-700 ml-10">{profile?.no_hp || '-'}</p>
                            </div>

                            <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow sm:col-span-2">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-1.5 bg-amber-50 text-amber-500 rounded-md">
                                        <MapPin className="h-4 w-4" />
                                    </div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">NIK (Nomor Induk Kependudukan)</p>
                                </div>
                                <p className="font-medium text-slate-700 ml-10 text-lg tracking-wider">{profile?.nik || '-'}</p>
                                {!profile?.nik && (
                                    <p className="text-xs text-amber-500 mt-2 ml-10 bg-amber-50 p-2 rounded-md border border-amber-100 inline-block">
                                        NIK belum dilengkapi. Silakan hubungi Admin.
                                    </p>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Keamanan Tab */}
            {activeTab === 'keamanan' && (
                <div className="space-y-6 animate-fade-in">
                    <Card className="p-5 md:p-6 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full -translate-y-16 translate-x-16 opacity-60 pointer-events-none" />

                        <div className="relative flex items-center gap-4 mb-6">
                            <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-lg shadow-amber-500/20 text-white">
                                <KeyRound className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">Ganti Password</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Disarankan rutin mengganti password untuk keamanan</p>
                            </div>
                        </div>

                        <form onSubmit={handlePasswordChange} className="space-y-4 relative z-10">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
                                <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Persyaratan Keamanan:</h4>
                                <ul className="text-xs text-slate-500 space-y-1.5 ml-4 list-disc">
                                    <li>Minimal terdiri dari 6 karakter</li>
                                    <li>Tidak menggunakan kombinasi yang mudah ditebak (seperti: 123456)</li>
                                    <li>Password akan tersimpan dalam bentuk terenkripsi</li>
                                </ul>
                            </div>

                            <Input
                                label="Password Baru"
                                type="password"
                                placeholder="Masukkan minimal 6 karakter..."
                                value={passwords.newPassword}
                                onChange={(e) => setPasswords(p => ({ ...p, newPassword: e.target.value }))}
                                required
                            />
                            <Input
                                label="Konfirmasi Password Baru"
                                type="password"
                                placeholder="Ulangi password baru Anda..."
                                value={passwords.confirmPassword}
                                onChange={(e) => setPasswords(p => ({ ...p, confirmPassword: e.target.value }))}
                                required
                            />

                            <div className="pt-2">
                                <Button type="submit" className="w-full sm:w-auto mt-2" isLoading={isSaving}>
                                    Simpan Password Baru
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* Separator */}
            <hr className="border-slate-200/60" />

            {/* Logout Action */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                    <h3 className="text-sm font-bold text-slate-800">Sesi Akun</h3>
                    <p className="text-xs text-slate-500">Keluar dari aplikasi jika Anda menggunakan perangkat umum</p>
                </div>
                <Button
                    variant="outline"
                    className="w-full sm:w-auto text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300 font-medium transition-colors"
                    onClick={handleLogout}
                >
                    <LogOut className="h-4 w-4 mr-2" />
                    Keluar dari Aplikasi
                </Button>
            </div>
        </div>
    );
}
