import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
    helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, icon, helperText, className, id, ...props }, ref) => {
        const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

        return (
            <div className="space-y-1.5">
                {label && (
                    <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {icon && (
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            {icon}
                        </div>
                    )}
                    <input
                        id={inputId}
                        ref={ref}
                        className={cn(
                            'w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400',
                            'transition-all duration-200',
                            'focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500',
                            'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
                            icon && 'pl-10',
                            error
                                ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                                : 'border-slate-200 hover:border-slate-300',
                            className
                        )}
                        {...props}
                    />
                </div>
                {error && (
                    <p className="text-xs text-red-500 font-medium">{error}</p>
                )}
                {helperText && !error && (
                    <p className="text-xs text-slate-400">{helperText}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
