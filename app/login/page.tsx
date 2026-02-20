'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Phone, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { loginSchema, type LoginInput } from '@/lib/validations';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const [formData, setFormData] = useState<LoginInput>({
        identifier: '',
        password: '',
    });
    const [errors, setErrors] = useState<Partial<Record<keyof LoginInput, string>>>({});
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleChange = (field: keyof LoginInput, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        // Validate
        const result = loginSchema.safeParse(formData);
        if (!result.success) {
            const fieldErrors: Partial<Record<keyof LoginInput, string>> = {};
            result.error.issues.forEach((issue) => {
                const field = issue.path[0] as keyof LoginInput;
                fieldErrors[field] = issue.message;
            });
            setErrors(fieldErrors);
            return;
        }

        setIsLoading(true);

        try {
            // First, look up the user by NIK or phone number to get their email equivalent
            const { data: userData, error: lookupError } = await supabase
                .from('users')
                .select('id, no_hp, nik, role, status')
                .or(`no_hp.eq.${formData.identifier},nik.eq.${formData.identifier}`)
                .single();

            if (lookupError || !userData) {
                toast.error('No. HP atau NIK tidak ditemukan');
                setIsLoading(false);
                return;
            }

            if (userData.status === 'NONAKTIF') {
                toast.error('Akun Anda sudah dinonaktifkan. Hubungi Admin.');
                setIsLoading(false);
                return;
            }

            // Sign in with Supabase Auth using email (we use phone@posyandu.local as email)
            const email = `${userData.no_hp}@posyandu.local`;
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password: formData.password,
            });

            if (signInError) {
                toast.error('Password salah. Silakan coba lagi.');
                setIsLoading(false);
                return;
            }

            toast.success('Login berhasil!');

            // Redirect based on role
            switch (userData.role) {
                case 'ADMIN':
                    router.push('/admin/dashboard');
                    break;
                case 'KADER':
                    router.push('/kader/dashboard');
                    break;
                case 'ORANG_TUA':
                    router.push('/ortu/dashboard');
                    break;
                default:
                    router.push('/');
            }
        } catch {
            toast.error('Terjadi kesalahan. Silakan coba lagi.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-4">
            {/* Background decoration */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-100 rounded-full opacity-20 blur-3xl" />
                <div className="absolute bottom-0 -left-20 w-60 h-60 bg-emerald-100 rounded-full opacity-20 blur-3xl" />
            </div>

            <div className="relative w-full max-w-md animate-fade-in">
                {/* Back to Home */}
                <div className="absolute -top-12 left-0">
                    <button
                        onClick={() => router.push('/')}
                        className="group flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors text-sm font-medium"
                    >
                        <div className="p-1.5 rounded-lg bg-white border border-slate-100 shadow-sm group-hover:border-slate-200 transition-all">
                            <ArrowRight className="h-3.5 w-3.5 rotate-180" />
                        </div>
                        Kembali ke Beranda
                    </button>
                </div>

                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex p-3 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl shadow-lg shadow-teal-500/20 mb-4">
                        <Shield className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">Masuk</h1>
                    <p className="text-sm text-slate-400 mt-1">Posyandu ILP Digital — Desa Merden</p>
                </div>

                {/* Form */}
                <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 md:p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <Input
                            label="No. HP atau NIK"
                            placeholder="Masukkan No. HP atau NIK"
                            value={formData.identifier}
                            onChange={(e) => handleChange('identifier', e.target.value)}
                            error={errors.identifier}
                            icon={<Phone className="h-4 w-4" />}
                            autoComplete="username"
                        />

                        <div className="relative">
                            <Input
                                label="Password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Masukkan password"
                                value={formData.password}
                                onChange={(e) => handleChange('password', e.target.value)}
                                error={errors.password}
                                icon={<Lock className="h-4 w-4" />}
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-[34px] p-1 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            size="lg"
                            isLoading={isLoading}
                        >
                            Masuk
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </form>

                    <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                        <p className="text-xs text-slate-400">
                            Belum punya akun? Hubungi Admin Posyandu Anda.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-[10px] text-slate-300 mt-6">
                    © 2025 Posyandu ILP Digital — Desa Merden
                </p>
            </div>
        </div>
    );
}
