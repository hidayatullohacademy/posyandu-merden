import {
    Baby,
    Users,
    Activity,
    HeartPulse,
    Syringe,
    CalendarDays,
    Bell,
    UserCircle,
    ChevronRight
} from 'lucide-react';

import Link from 'next/link';

export default function KaderDashboard() {
    return (
        <div className="space-y-6 pb-20 animate-fade-in bg-slate-50 min-h-screen -m-4 sm:-m-8 p-4 sm:p-8">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                        <UserCircle className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-medium">Selamat datang kembali,</p>
                        <h1 className="text-lg font-bold text-slate-800">Kader Posyandu</h1>
                    </div>
                </div>
                <div className="relative">
                    <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                        <Bell className="h-5 w-5 text-slate-600" />
                        <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
                    </div>
                </div>
            </div>

            {/* Horizontal Stats Scroll */}
            <div className="flex overflow-x-auto hide-scrollbar gap-4 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="min-w-[240px] flex-shrink-0 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl p-5 text-white shadow-md shadow-teal-500/20">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                            <CalendarDays className="h-5 w-5 text-white" />
                        </div>
                    </div>
                    <p className="text-sm font-medium text-teal-50">Jadwal Hari Ini</p>
                    <h3 className="text-lg font-bold mt-1">Posyandu Flamboyan</h3>
                </div>

                <div className="min-w-[160px] flex-shrink-0 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-blue-50 p-2 rounded-xl">
                            <Baby className="h-5 w-5 text-blue-500" />
                        </div>
                    </div>
                    <p className="text-xs font-medium text-slate-500">Total Balita</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">85</h3>
                </div>

                <div className="min-w-[160px] flex-shrink-0 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-rose-50 p-2 rounded-xl">
                            <Users className="h-5 w-5 text-rose-500" />
                        </div>
                    </div>
                    <p className="text-xs font-medium text-slate-500">Total Lansia</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">42</h3>
                </div>
            </div>

            {/* Main Action Grid */}
            <div>
                <h2 className="text-sm font-bold text-slate-800 mb-4 px-1">Menu Utama</h2>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <Link href="/kader/balita" className="group">
                        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-all group-hover:border-teal-100 group-hover:bg-teal-50/30">
                            <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Baby className="h-6 w-6 text-blue-600" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-800">Daftar Balita</h3>
                            <p className="text-xs text-slate-500 mt-1">Registrasi & Biodata</p>
                        </div>
                    </Link>

                    <Link href="/kader/lansia" className="group">
                        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-all group-hover:border-teal-100 group-hover:bg-teal-50/30">
                            <div className="h-12 w-12 bg-rose-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Users className="h-6 w-6 text-rose-600" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-800">Daftar Lansia</h3>
                            <p className="text-xs text-slate-500 mt-1">Registrasi & Biodata</p>
                        </div>
                    </Link>

                    <Link href="/kader/balita" className="group">
                        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-all group-hover:border-teal-100 group-hover:bg-teal-50/30">
                            <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Activity className="h-6 w-6 text-emerald-600" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-800">Kunjungan Balita</h3>
                            <p className="text-xs text-slate-500 mt-1">Timbang & Ukur</p>
                        </div>
                    </Link>

                    <Link href="/kader/lansia" className="group">
                        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-all group-hover:border-teal-100 group-hover:bg-teal-50/30">
                            <div className="h-12 w-12 bg-purple-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <HeartPulse className="h-6 w-6 text-purple-600" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-800">Kunjungan Lansia</h3>
                            <p className="text-xs text-slate-500 mt-1">Cek Kesehatan</p>
                        </div>
                    </Link>

                    <Link href="/kader/imunisasi" className="group">
                        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-all group-hover:border-teal-100 group-hover:bg-teal-50/30">
                            <div className="h-12 w-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Syringe className="h-6 w-6 text-amber-600" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-800">Imunisasi</h3>
                            <p className="text-xs text-slate-500 mt-1">Jadwal & Riwayat</p>
                        </div>
                    </Link>

                    <Link href="/kader/jadwal" className="group">
                        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-all group-hover:border-teal-100 group-hover:bg-teal-50/30">
                            <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <CalendarDays className="h-6 w-6 text-indigo-600" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-800">Jadwal Posyandu</h3>
                            <p className="text-xs text-slate-500 mt-1">Cek & Usulkan</p>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Recent Activity */}
            <div>
                <h2 className="text-sm font-bold text-slate-800 mb-4 px-1">Aktivitas Terbaru</h2>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-4 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-amber-50 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Syringe className="h-5 w-5 text-amber-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">Imunisasi Terlambat</p>
                                    <p className="text-xs text-slate-500">2 Anak perlu segera diimunisasi</p>
                                </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-400" />
                        </div>
                        <div className="h-px bg-slate-50 w-full"></div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-teal-50 rounded-full flex items-center justify-center flex-shrink-0">
                                    <CalendarDays className="h-5 w-5 text-teal-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">Jadwal Paling Dekat</p>
                                    <p className="text-xs text-slate-500">12 Nov 2025 - Posyandu Melati</p>
                                </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Styles for scrollbar */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}} />
        </div>
    );
}
