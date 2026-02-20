import { Metadata } from 'next';
import AdminPengaturanClient from './AdminPengaturanClient';

export const metadata: Metadata = {
    title: 'Pengaturan Sistem | Posyandu ILP Digital',
    description: 'Konfigurasi data Posyandu dan pengaturan sistem aplikasi Posyandu ILP Digital',
};

export default function AdminPengaturanPage() {
    return <AdminPengaturanClient />;
}
