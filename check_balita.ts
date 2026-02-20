import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

async function testInsert() {
  const { data, error } = await supabase.from('balita').insert({
    nik: 'TEMP-TEST',
    nik_status: 'ASLI',
    nama: 'test',
    nama_ibu: 'testibu',
    tanggal_lahir: '2024-01-01',
    jenis_kelamin: 'L',
    posyandu_id: '5d7bdad5-b7ed-4171-aafe-bc5d3c8c2bb6' // dummy uuid
  });
  console.log('Insert Error:', JSON.stringify(error, null, 2));
}

testInsert();
