'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { ShieldAlert, X, ChevronRight } from 'lucide-react';
import Link from 'next/link';


export function SecurityBanner() {
    const [isVisible, setIsVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const checkSecurity = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setIsVisible(false);
                    return;
                }

                const { data, error } = await supabase
                    .from('users')
                    .select('is_default_password')
                    .eq('id', user.id)
                    .single();

                if (error) throw error;

                if (data?.is_default_password) {
                    setIsVisible(true);
                }
            } catch (err) {
                console.error('Error checking security status:', err);
            } finally {
                setIsLoading(false);
            }
        };

        checkSecurity();
    }, [supabase]);

    if (!isVisible || isLoading) return null;

    return (
        <div className="bg-amber-500 text-white px-4 py-2.5 flex items-center justify-between gap-3 animate-slide-down relative z-[60] shadow-lg">
            <div className="flex items-center gap-3">
                <div className="bg-white/20 p-1.5 rounded-lg shrink-0">
                    <ShieldAlert className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold leading-tight">Keamanan Akun Berisiko!</p>
                    <p className="text-[10px] sm:text-xs text-amber-50 leading-tight mt-0.5 opacity-90">
                        Anda masih menggunakan password default. Segera ganti demi keamanan data Posyandu.
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                <Link
                    href="/pengaturan"
                    className="bg-white text-amber-600 px-3 py-1 rounded-full text-xs font-bold hover:bg-amber-50 transition-colors flex items-center gap-1 shadow-sm"
                >
                    Ganti <ChevronRight className="h-3 w-3" />
                </Link>
                <button
                    onClick={() => setIsVisible(false)}
                    className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                    <X className="h-4 w-4 text-white/80" />
                </button>
            </div>
        </div>
    );
}
