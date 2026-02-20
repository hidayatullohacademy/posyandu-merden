import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

export function Card({ children, className }: CardProps) {
    return (
        <div className={cn(
            'bg-white rounded-2xl border border-slate-100 shadow-sm',
            'hover:shadow-md transition-shadow duration-200',
            className
        )}>
            {children}
        </div>
    );
}

interface StatCardProps {
    title: string;
    value: string | number;
    icon?: React.ReactNode;
    trend?: {
        value: number;
        label: string;
    };
    color?: 'teal' | 'blue' | 'amber' | 'red' | 'purple';
    className?: string;
}

export function StatCard({ title, value, icon, trend, color = 'teal', className }: StatCardProps) {
    const colors = {
        teal: 'from-teal-500 to-emerald-500',
        blue: 'from-blue-500 to-indigo-500',
        amber: 'from-amber-500 to-orange-500',
        red: 'from-red-500 to-rose-500',
        purple: 'from-purple-500 to-violet-500',
    };

    const iconBg = {
        teal: 'bg-teal-50 text-teal-600',
        blue: 'bg-blue-50 text-blue-600',
        amber: 'bg-amber-50 text-amber-600',
        red: 'bg-red-50 text-red-600',
        purple: 'bg-purple-50 text-purple-600',
    };

    return (
        <Card className={cn('p-5', className)}>
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <p className={cn(
                        'text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r',
                        colors[color]
                    )}>
                        {value}
                    </p>
                    {trend && (
                        <div className="flex items-center gap-1">
                            <span className={cn(
                                'text-xs font-semibold',
                                trend.value >= 0 ? 'text-emerald-500' : 'text-red-500'
                            )}>
                                {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
                            </span>
                            <span className="text-xs text-slate-400">{trend.label}</span>
                        </div>
                    )}
                </div>
                {icon && (
                    <div className={cn('p-3 rounded-xl', iconBg[color])}>
                        {icon}
                    </div>
                )}
            </div>
        </Card>
    );
}
