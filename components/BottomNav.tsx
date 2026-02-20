'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Baby,
    Heart,
    CalendarDays,
    Syringe,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavProps {
    role: 'KADER' | 'ORANG_TUA';
}

const kaderMenuItems = [
    { label: 'Beranda', href: '/kader/dashboard', icon: LayoutDashboard },
    { label: 'Balita', href: '/kader/balita', icon: Baby },
    { label: 'Lansia', href: '/kader/lansia', icon: Heart },
    { label: 'Imunisasi', href: '/kader/imunisasi', icon: Syringe },
    { label: 'Jadwal', href: '/kader/jadwal', icon: CalendarDays },
];

const ortuMenuItems = [
    { label: 'Beranda', href: '/ortu/dashboard', icon: LayoutDashboard },
    { label: 'Anak Saya', href: '/ortu/anak', icon: Baby },
    { label: 'Jadwal', href: '/ortu/jadwal', icon: CalendarDays },
    { label: 'Imunisasi', href: '/ortu/imunisasi', icon: Syringe },
];

export function BottomNav({ role }: BottomNavProps) {
    const pathname = usePathname();
    const menuItems = role === 'KADER' ? kaderMenuItems : ortuMenuItems;

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/80 backdrop-blur-xl border-t border-slate-100 safe-area-bottom">
            <div className="flex items-center justify-around px-2 py-1">
                {menuItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl min-w-0 transition-all duration-200',
                                isActive
                                    ? 'text-teal-600'
                                    : 'text-slate-400 hover:text-slate-600'
                            )}
                        >
                            <div className={cn(
                                'p-1.5 rounded-xl transition-all duration-200',
                                isActive && 'bg-teal-50'
                            )}>
                                <item.icon className="h-5 w-5" />
                            </div>
                            <span className={cn(
                                'text-[10px] font-medium truncate',
                                isActive && 'font-semibold'
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
