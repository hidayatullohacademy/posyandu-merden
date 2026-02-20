import { Metadata } from 'next';
import AdminImunisasiClient from './AdminImunisasiClient';

export const metadata: Metadata = {
    title: 'Master Imunisasi | Posyandu ILP Digital',
    description: 'Manajemen data vaksin dan jadwal imunisasi untuk Posyandu Desa Merden',
};

export default function AdminImunisasiPage() {
    return <AdminImunisasiClient />;
}
