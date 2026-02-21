import { Sidebar } from '@/components/Sidebar';
import { BottomNav } from '@/components/BottomNav';

export default function KaderLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-50/50 flex flex-col md:block relative z-10 pb-20 md:pb-0">
            <Sidebar role="KADER" />
            <main className="flex-1 pl-0 md:pl-64 pt-16 md:pt-0">
                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
            <div className="md:hidden">
                <BottomNav role="KADER" />
            </div>
        </div>
    );
}
