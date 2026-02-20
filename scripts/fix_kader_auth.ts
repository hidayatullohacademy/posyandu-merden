import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; 

const supabase = createClient(supabaseUrl, supabaseKey);

const kaderData = [
  {
    nama: 'Parsini',
    nik: '3304044407900005',
    no_hp: '0882003859478',
    password: 'merden12345'
  },
  {
    nama: 'Ambar',
    nik: '3304045508800004',
    no_hp: '085876381303',
    password: 'merden12345'
  }
];

async function fixKaderAuth() {
  console.log('Fixing Kader Auth Accounts...');

  // Get current users from our public.users table to find their auth IDs
  for (const kader of kaderData) {
      console.log(`\nProcessing ${kader.nama}...`);
      
      const { data: dbUser, error: dbError } = await supabase
          .from('users')
          .select('id')
          .eq('nik', kader.nik)
          .single();

      if (dbError || !dbUser) {
          console.error(`Could not find ${kader.nama} in public.users:`, dbError?.message);
          continue;
      }

      const userId = dbUser.id;
      const correctEmail = `${kader.no_hp}@posyandu.local`;

      // Update the Auth user's email to match the expected login format
      const { data, error: updateError } = await supabase.auth.admin.updateUserById(userId, {
          email: correctEmail,
          password: kader.password // Ensure password is correct just in case
      });

      if (updateError) {
           if (updateError.message.includes("Email address already registered")) {
                console.log(`Error updating ${kader.nama}: The email ${correctEmail} is already taken by another account. We need to delete the old one first or it belongs to them.`);
                // For safety, let's just log this for now, though we should probably check if it belongs to them.
                // It likely implies they were created successfully in the past. If the login is broken, we might need a more aggressive recreate.
           } else {
               console.error(`Failed to update auth for ${kader.nama}:`, updateError.message);
           }
      } else {
          console.log(`✅ Successfully updated auth email for ${kader.nama} to ${correctEmail}`);
      }
  }
  console.log('\nDone!');
}

fixKaderAuth();
