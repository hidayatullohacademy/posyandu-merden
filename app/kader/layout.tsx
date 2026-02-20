import { BottomNav } from '@/components/BottomNav';

export default function KaderLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            {/* Top bar */}
            <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-100">
                <div className="px-4 py-3 flex items-center justify-between">
                    <div>
                        <h1 className="font-bold text-slate-800 text-sm">Posyandu ILP</h1>
                        <p className="text-[10px] text-slate-400">Kader</p>
                    </div>
                    <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">K</span>
                    </div>
                </div>
            </header>

            <main className="px-4 py-4 max-w-lg mx-auto">
                {children}
            </main>

            <BottomNav role="KADER" />
        </div>
    );
}
