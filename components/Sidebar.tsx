'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    FileText,
    CalendarDays,
    Users,
    Syringe,
    Bell,
    Settings,
    LogOut,
    Shield,
    Menu,
    X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase';

const adminMenuItems = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Laporan', href: '/admin/laporan', icon: FileText },
    { label: 'Jadwal', href: '/admin/jadwal', icon: CalendarDays },
    { label: 'Pengguna', href: '/admin/pengguna', icon: Users },
    { label: 'Imunisasi', href: '/admin/imunisasi', icon: Syringe },
    { label: 'Notifikasi', href: '/admin/notifikasi', icon: Bell },
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const supabase = createClient();

    // Close sidebar on route change (mobile)
    useEffect(() => {
        if (isOpen) {
            queueMicrotask(() => setIsOpen(false));
        }
    }, [pathname, isOpen]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <>
            {/* Mobile Header (Light theme for top bar to blend with main content in mobile) */}
            <div className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-4 md:hidden animate-fade-in">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-slate-900 rounded-lg shadow-sm">
                        <Shield className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-bold text-slate-800 text-sm">Posyandu ILP</span>
                </div>
                <button
                    onClick={() => setIsOpen(true)}
                    className="p-2 -mr-2 text-slate-500 hover:bg-slate-50 rounded-lg"
                >
                    <Menu className="h-6 w-6" />
                </button>
            </div>

            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden animate-fade-in"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* High-Contrast Navy Sidebar */}
            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-40 w-64 bg-slate-950 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out shadow-2xl md:translate-x-0',
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                {/* Logo Area */}
                <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl shadow-[0_0_15px_rgba(20,184,166,0.3)]">
                            <Shield className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-white text-sm tracking-wide">POSYANDU ILP</h1>
                            <p className="text-[10px] text-teal-400 font-medium uppercase tracking-widest mt-0.5">Desa Merden</p>
                        </div>
                    </div>
                    {/* Close Button (Mobile) */}
                    <button
                        onClick={() => setIsOpen(false)}
                        className="md:hidden p-1.5 text-slate-400 hover:bg-slate-800 rounded-lg hover:text-white transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-4 mt-2">
                        Menu Utama
                    </p>
                    {adminMenuItems.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden',
                                    isActive
                                        ? 'bg-teal-500/10 text-teal-400'
                                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                                )}
                            >
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-teal-500 rounded-r-full shadow-[0_0_10px_rgba(20,184,166,0.5)]" />
                                )}
                                <item.icon className={cn('h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-110 ml-1', isActive ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-300')} />
                                <span className="tracking-wide">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* User Header / Footer Indicator */}
                <div className="p-4 border-t border-slate-800/80">
                    <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 flex items-center gap-3 mb-4">
                        <div className="h-9 w-9 bg-slate-800 rounded-full flex items-center justify-center flex-shrink-0 border border-slate-700">
                            <Shield className="h-4 w-4 text-slate-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-200 truncate">Administrator</p>
                            <p className="text-[10px] text-teal-500 font-medium">Online</p>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Link
                            href="/admin/pengaturan"
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-colors"
                        >
                            <Settings className="h-4.5 w-4.5 ml-1" />
                            Pengaturan
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-colors group"
                        >
                            <LogOut className="h-4.5 w-4.5 ml-1 group-hover:translate-x-1 transition-transform" />
                            Keluar
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
