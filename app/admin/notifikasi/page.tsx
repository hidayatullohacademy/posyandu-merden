import { Metadata } from 'next';
import AdminNotifikasiClient from './AdminNotifikasiClient';

export const metadata: Metadata = {
    title: 'Notifikasi WhatsApp | Posyandu ILP Digital',
    description: 'Kelola pengiriman notifikasi jadwal dan imunisasi ke WhatsApp orang tua',
};

export default function AdminNotifikasiPage() {
    return <AdminNotifikasiClient />;
}
