import { Sidebar } from '@/components/Sidebar';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-50/50">
            <Sidebar />
            <main className="pl-0 md:pl-64 pt-16 md:pt-0">
                <div className="p-6 md:p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
