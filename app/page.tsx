import Link from 'next/link';
import { Shield, ArrowRight, Baby, Heart, Users } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-100 rounded-full opacity-20 blur-3xl" />
          <div className="absolute top-20 -left-20 w-60 h-60 bg-emerald-100 rounded-full opacity-20 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-50 rounded-full opacity-30 blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 py-12 md:py-24">
          {/* Header */}
          <header className="flex items-center justify-between mb-16 md:mb-24">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl shadow-lg shadow-teal-500/20">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-slate-800 text-sm">Posyandu ILP</h1>
                <p className="text-[10px] text-slate-400 font-medium">Desa Merden</p>
              </div>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-teal-500/25 hover:from-teal-700 hover:to-emerald-700 transition-all duration-200"
            >
              Masuk
              <ArrowRight className="h-4 w-4" />
            </Link>
          </header>

          {/* Hero Content */}
          <div className="text-center space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-50 border border-teal-100 rounded-full">
              <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-teal-700">Integrasi Layanan Primer</span>
            </div>

            <h2 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Posyandu Digital
              <span className="block text-gradient">Desa Merden</span>
            </h2>

            <p className="max-w-xl mx-auto text-slate-500 text-base md:text-lg leading-relaxed">
              Sistem digital untuk pengelolaan layanan kesehatan Balita dan Lansia
              dalam satu posyandu terintegrasi
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/30 hover:from-teal-700 hover:to-emerald-700 transition-all duration-300"
              >
                Mulai Sekarang
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-16 md:mt-24 max-w-lg mx-auto">
            <div className="text-center animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="inline-flex p-3 bg-blue-50 rounded-2xl mb-2">
                <Baby className="h-6 w-6 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-slate-800">Balita</p>
              <p className="text-xs text-slate-400">0–59 bulan</p>
            </div>
            <div className="text-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="inline-flex p-3 bg-rose-50 rounded-2xl mb-2">
                <Heart className="h-6 w-6 text-rose-500" />
              </div>
              <p className="text-2xl font-bold text-slate-800">Lansia</p>
              <p className="text-xs text-slate-400">≥ 60 tahun</p>
            </div>
            <div className="text-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="inline-flex p-3 bg-teal-50 rounded-2xl mb-2">
                <Users className="h-6 w-6 text-teal-500" />
              </div>
              <p className="text-2xl font-bold text-slate-800">ILP</p>
              <p className="text-xs text-slate-400">Terintegrasi</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-6">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-xs text-slate-400">
            © 2025 Posyandu ILP Digital — Desa Merden. Semua hak dilindungi.
          </p>
        </div>
      </footer>
    </div>
  );
}
