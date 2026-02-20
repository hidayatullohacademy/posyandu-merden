import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdmin() {
  console.log("Creating user in auth...");
  const { data, error } = await supabase.auth.signUp({
    email: '3304046010980007@posyandu.com',
    password: 'merden12345',
  });

  if (error) {
    console.error("SignUp error:", error);
    return;
  }

  if (data.user) {
    console.log("User created in auth. Attempting to insert into users table...");
    const { error: insertError } = await supabase.from('users').insert({
      id: data.user.id,
      nik: '3304046010980007',
      no_hp: '3304046010980007', // Need an identifier, just using NIK here since both work
      nama_lengkap: 'Admin Sistem Baru',
      role: 'ADMIN',
      status: 'AKTIF'
    });
    
    if (insertError) {
      console.error("Insert error:", insertError);
    } else {
      console.log("Admin user successfully created!");
    }
  }
}

createAdmin();
