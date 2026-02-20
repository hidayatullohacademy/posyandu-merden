'use client';

import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

interface PasswordBannerProps {
    isDefaultPassword: boolean;
}

export function PasswordBanner({ isDefaultPassword }: PasswordBannerProps) {
    const [dismissed, setDismissed] = useState(false);

    if (!isDefaultPassword || dismissed) return null;

    return (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mx-4 mt-4">
            <div className="flex items-start gap-3">
                <div className="p-1.5 bg-amber-100 rounded-lg shrink-0">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-amber-800">
                        Password Masih Default
                    </h4>
                    <p className="text-xs text-amber-600 mt-0.5">
                        Demi keamanan, segera ganti password Anda di menu Pengaturan Akun.
                        Password default: 12345678
                    </p>
                </div>
                <button
                    onClick={() => setDismissed(true)}
                    className="shrink-0 p-1 rounded-lg hover:bg-amber-100 text-amber-400 hover:text-amber-600 transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
