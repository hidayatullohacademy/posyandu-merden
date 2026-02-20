import Link from 'next/link';
import { Shield, Home } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="text-center space-y-6 max-w-md animate-fade-in">
                <div className="inline-flex p-4 bg-white rounded-3xl shadow-xl shadow-slate-200/50 mb-2">
                    <Shield className="h-12 w-12 text-teal-500" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">404</h1>
                    <h2 className="text-xl font-bold text-slate-700">Halaman Tidak Ditemukan</h2>
                    <p className="text-slate-500">
                        Maaf, halaman yang Anda cari tidak tersedia atau telah dipindahkan.
                    </p>
                </div>

                <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-colors shadow-lg shadow-teal-500/25"
                >
                    <Home className="h-4 w-4" />
                    Kembali ke Beranda
                </Link>
            </div>
        </div>
    );
}
