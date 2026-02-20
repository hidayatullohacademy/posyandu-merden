import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('role, nik, no_hp, nama_lengkap')
    .in('role', ['ADMIN', 'KADER', 'ORANG_TUA']);

  if (error) {
    console.error('Error:', error);
    return;
  }

  // Get one of each
  const admin = data.find(u => u.role === 'ADMIN');
  const kader = data.find(u => u.role === 'KADER');
  const ortu = data.find(u => u.role === 'ORANG_TUA');

  console.log('--- LOGIN CREDENTIALS ---');
  console.log('Use No. HP or NIK as the identifier. Default password is usually "password" or "password123".');
  console.log('\nADMIN:');
  console.log(admin);
  console.log('\nKADER:');
  console.log(kader);
  console.log('\nORANG_TUA:');
  console.log(ortu);
}

getUsers();
