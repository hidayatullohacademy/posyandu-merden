import {
    Baby,
    CalendarDays,
    Syringe,
    BookOpen,
    UserCircle,
    Bell,
    ChevronRight,
    Sparkles
} from 'lucide-react';
import Link from 'next/link';

export default function OrtuDashboard() {
    return (
        <div className="space-y-6 pb-20 animate-fade-in bg-orange-50/30 min-h-screen -m-4 sm:-m-8 p-4 sm:p-8">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                        <UserCircle className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-medium">Selamat datang, Bunda</p>
                        <h1 className="text-lg font-bold text-slate-800">Orang Tua</h1>
                    </div>
                </div>
                <div className="relative">
                    <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                        <Bell className="h-5 w-5 text-slate-600" />
                        <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
                    </div>
                </div>
            </div>

            {/* Main Greeting Banner */}
            <div className="bg-gradient-to-br from-orange-400 to-rose-500 rounded-3xl p-6 text-white shadow-lg shadow-orange-500/20 relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-5 w-5 text-orange-200" />
                        <p className="text-sm font-medium text-orange-100">Pantauan Harian</p>
                    </div>
                    <h2 className="text-2xl font-bold mb-1">Semua Sehat!</h2>
                    <p className="text-sm text-orange-50 opacity-90">
                        Pertumbuhan anak-anak berada di grafik normal.
                    </p>
                </div>
                {/* Decorative circles */}
                <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute top-0 right-0 w-24 h-24 bg-rose-400/30 rounded-full blur-xl"></div>
            </div>

            {/* Menu Sections (Card Stack) */}
            <div>
                <h3 className="text-sm font-bold text-slate-800 mb-4 px-1">Menu Layanan</h3>
                <div className="space-y-4">
                    <Link href="/ortu/anak" className="block group">
                        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-all sm:p-5 flex items-center gap-4">
                            <div className="p-3 bg-blue-50 rounded-2xl group-hover:bg-blue-100 group-hover:scale-105 transition-all">
                                <Baby className="h-6 w-6 text-blue-500" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-slate-800">Pantauan Anak</h4>
                                <p className="text-xs text-slate-500 mt-1">Grafik Tumbuh Kembang</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-1 rounded-full">
                                    Normal
                                </span>
                                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                            </div>
                        </div>
                    </Link>

                    <Link href="/ortu/jadwal" className="block group">
                        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-all sm:p-5 flex items-center gap-4">
                            <div className="p-3 bg-purple-50 rounded-2xl group-hover:bg-purple-100 group-hover:scale-105 transition-all">
                                <CalendarDays className="h-6 w-6 text-purple-500" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-slate-800">Jadwal Posyandu</h4>
                                <p className="text-xs text-slate-500 mt-1">Estimasi kedatangan</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="bg-rose-50 text-rose-600 text-[10px] font-bold px-2 py-1 rounded-full">
                                    Segera
                                </span>
                                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-purple-500 transition-colors" />
                            </div>
                        </div>
                    </Link>

                    <Link href="/ortu/imunisasi" className="block group">
                        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-all sm:p-5 flex items-center gap-4">
                            <div className="p-3 bg-amber-50 rounded-2xl group-hover:bg-amber-100 group-hover:scale-105 transition-all">
                                <Syringe className="h-6 w-6 text-amber-500" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-slate-800">Status Imunisasi</h4>
                                <p className="text-xs text-slate-500 mt-1">Bulan Imunisasi Anak</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-amber-500 transition-colors" />
                            </div>
                        </div>
                    </Link>

                    <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-200/50 flex items-center gap-4 opacity-70 cursor-not-allowed">
                        <div className="p-3 bg-slate-100 rounded-2xl">
                            <BookOpen className="h-6 w-6 text-slate-400" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-bold text-slate-500">Buku KIA Digital</h4>
                            <p className="text-xs text-slate-400 mt-1">Segera hadir</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="bg-slate-200 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-full">
                                Lock
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info */}
            <div className="bg-orange-50/80 border border-orange-100 rounded-2xl p-4 flex gap-3">
                <div className="text-2xl">💡</div>
                <p className="text-xs text-orange-800 leading-relaxed font-medium">
                    Data anak Anda diperbarui secara real-time setiap kali selesai kunjungan ke Posyandu.
                    Hubungi Kader jika ada ketidaksesuaian data.
                </p>
            </div>
        </div>
    );
}
