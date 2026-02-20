'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, KeyRound, LogOut, User as UserIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
            router.push('/login');
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
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Pengaturan</h1>
                <p className="text-sm text-slate-400 mt-1">Kelola profil dan keamanan akun Anda</p>
            </div>

            {/* Profile Info */}
            <Card className="p-5 md:p-6 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-full -translate-y-16 translate-x-16" />

                <div className="relative flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-teal-500/20">
                        <UserIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">{profile?.nama_lengkap}</h2>
                        <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-[10px] font-medium bg-teal-50 text-teal-600 border border-teal-100">
                            <Shield className="h-3 w-3" /> Kader
                        </span>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-xs text-slate-400 mb-1">Posyandu</p>
                        <p className="font-medium text-slate-700">{profile?.posyandu?.nama || '-'}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-xs text-slate-400 mb-1">No. Handphone</p>
                        <p className="font-medium text-slate-700">{profile?.no_hp || '-'}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2">
                        <p className="text-xs text-slate-400 mb-1">NIK</p>
                        <p className="font-medium text-slate-700">{profile?.nik || '-'}</p>
                    </div>
                </div>
            </Card>

            {/* Change Password */}
            <Card className="p-5 md:p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-amber-50 rounded-lg text-amber-500">
                        <KeyRound className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">Ganti Password</h3>
                        <p className="text-xs text-slate-400">Pastikan password baru Anda aman</p>
                    </div>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-4">
                    <Input
                        label="Password Baru"
                        type="password"
                        placeholder="Minimal 6 karakter"
                        value={passwords.newPassword}
                        onChange={(e) => setPasswords(p => ({ ...p, newPassword: e.target.value }))}
                        required
                    />
                    <Input
                        label="Konfirmasi Password Baru"
                        type="password"
                        placeholder="Ulangi password baru"
                        value={passwords.confirmPassword}
                        onChange={(e) => setPasswords(p => ({ ...p, confirmPassword: e.target.value }))}
                        required
                    />

                    <Button type="submit" className="w-full mt-2" isLoading={isSaving}>
                        Simpan Password
                    </Button>
                </form>
            </Card>

            {/* Logout */}
            <Button
                variant="outline"
                className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100"
                onClick={handleLogout}
            >
                <LogOut className="h-4 w-4 mr-2" />
                Keluar dari Aplikasi
            </Button>
        </div>
    );
}
