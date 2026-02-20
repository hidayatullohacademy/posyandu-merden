import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; 

const supabase = createClient(supabaseUrl, supabaseKey);

const kaderData = [
  {
    nama: 'Parsini',
    posyandu: 'Posyandu Lestari 10',
    nik: '3304044407900005',
    no_hp: '0882003859478',
    password: 'merden12345'
  },
  {
    nama: 'Ambar',
    posyandu: 'Posyandu Lestari 9',
    nik: '3304045508800004',
    no_hp: '085876381303',
    password: 'merden12345'
  }
];

async function createKader() {
  console.log('Starting Kader account creation...');
  for (const kader of kaderData) {
    console.log(`\nProcessing ${kader.nama} for ${kader.posyandu}...`);
    
    // 1. Get Posyandu ID
    const { data: posyanduData, error: posError } = await supabase
      .from('posyandu')
      .select('id')
      .eq('nama', kader.posyandu)
      .single();

    if (posError || !posyanduData) {
      console.error(`Failed to find Posyandu '${kader.posyandu}' for ${kader.nama}. Error:`, posError?.message);
      continue;
    }
    
    const posyanduId = posyanduData.id;
    console.log(`Found Posyandu ID: ${posyanduId}`);

    // 2. Create Auth User
    const email = `${kader.nik}@posyandu.com`;
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: kader.password,
      email_confirm: true
    });

    if (authError) {
      if (authError.message.includes("already registered")) {
          console.log(`User ${email} already exists in auth. Skipping auth creation.`);
          // Try to get the existing user id
          const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
          const existingUser = existingUsers.users.find(u => u.email === email);
          if (existingUser) {
              console.log(`Found existing user ID: ${existingUser.id}`);
              await insertPublicUser(existingUser.id, kader, posyanduId);
          } else {
              console.error(`Failed to find existing user ${email} in list.`);
          }
      } else {
        console.error(`Auth signup error for ${kader.nama}:`, authError.message);
      }
      continue;
    }

    const userId = authData?.user?.id;
    if (userId) {
        await insertPublicUser(userId, kader, posyanduId);
    } else {
        console.log("Could not get user ID from auth.");
    }
  }
}

async function insertPublicUser(userId: string, kader: any, posyanduId: string) {
    console.log(`Inserting/Updating public.users record for ${kader.nama} (ID: ${userId})...`);
    const { error: insertError } = await supabase.from('users').upsert({
      id: userId,
      nama_lengkap: kader.nama,
      nik: kader.nik,
      no_hp: kader.no_hp,
      role: 'KADER',
      posyandu_id: posyanduId,
      status: 'AKTIF',
      is_default_password: true
    });

    if (insertError) {
      console.error(`Error inserting ${kader.nama} into public.users:`, insertError.message);
    } else {
      console.log(`✅ Kader ${kader.nama} successfully created/updated!`);
    }
}

createKader();
