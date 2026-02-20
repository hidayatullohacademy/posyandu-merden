import { Metadata } from 'next';
import KaderOrtuClient from './KaderOrtuClient';

export const metadata: Metadata = {
    title: 'Akun Orang Tua | Dashboard Kader',
    description: 'Manajemen pendaftaran akun orang tua',
};

export default function KaderOrtuPage() {
    return <KaderOrtuClient />;
}
