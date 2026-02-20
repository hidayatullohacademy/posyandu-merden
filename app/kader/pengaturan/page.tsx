import { Metadata } from 'next';
import KaderPengaturanClient from './KaderPengaturanClient';

export const metadata: Metadata = {
    title: 'Pengaturan Akun | Posyandu ILP Digital',
    description: 'Pengaturan akun dan profil Kader Posyandu ILP Digital',
};

export default function KaderPengaturanPage() {
    return <KaderPengaturanClient />;
}
