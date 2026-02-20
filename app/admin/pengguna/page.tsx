import { Metadata } from 'next';
import AdminPenggunaClient from './AdminPenggunaClient';

export const metadata: Metadata = {
    title: 'Manajemen Pengguna | Posyandu ILP Digital',
    description: 'Kelola data pengguna, peran, dan hak akses aplikasi Posyandu ILP Digital Desa Merden',
};

export default function AdminPenggunaPage() {
    return <AdminPenggunaClient />;
}
