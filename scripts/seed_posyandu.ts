import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const DEFAULT_POSYANDU = [
    { nama: 'Posyandu Lestari 7', hari_buka: '1', alamat: 'Kediaman Pak Imam' },
    { nama: 'Posyandu Lestari 3', hari_buka: '2', alamat: 'Kediaman Pak Sudewo' },
    { nama: 'Posyandu Lestari 5', hari_buka: '3', alamat: 'Kediaman Pak Redun Gligir' },
    { nama: 'Posyandu Lestari 8', hari_buka: '4', alamat: 'Kediaman Bu Sujinah Batokan' },
    { nama: 'Posyandu Lestari 6', hari_buka: '5', alamat: 'Kediaman Pak Jasrun' },
    { nama: 'Posyandu Lestari 11', hari_buka: '6', alamat: 'Kediaman Bu Tuti' },
    { nama: 'Posyandu Lestari 4', hari_buka: '7', alamat: 'Kediaman Pak Afif' },
    { nama: 'Posyandu Lestari 1', hari_buka: '8', alamat: 'Balai Desa Merden' },
    { nama: 'Posyandu Lestari 2', hari_buka: '9', alamat: 'Kediaman Pak Iif' },
    { nama: 'Posyandu Lestari 9', hari_buka: '10', alamat: 'Aula Masjid Al Falaah' },
    { nama: 'Posyandu Lestari 10', hari_buka: '11', alamat: 'Kediaman Pak Supriyanto' },
    { nama: 'Posyandu Lestari 12', hari_buka: '12', alamat: 'Gedung Tani Rawawungu' },
];

async function seedPosyandu() {
    console.log('Seeding Posyandu...');

    // Delete existing posyandu
    const { error: deleteError } = await supabase.from('posyandu').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (deleteError) {
        console.error('Error deleting old data:', deleteError);
    }

    // Insert new Posyandu Data
    for (const p of DEFAULT_POSYANDU) {
        const { data, error } = await supabase.from('posyandu').insert({
            nama: p.nama,
            hari_buka: p.hari_buka,
            alamat: p.alamat,
            rt_rw: '',
            kelurahan: 'Merden',
            kecamatan: 'Purwanegara',
            jam_buka: '08:00',
            jam_tutup: '12:00',
            is_active: true
        });

        if (error) {
            console.error(`Error inserting ${p.nama}:`, error);
        } else {
            console.log(`Inserted ${p.nama}`);
        }
    }
    console.log('Done!');
}

seedPosyandu();
