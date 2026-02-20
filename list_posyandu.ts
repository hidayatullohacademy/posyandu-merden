import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function list() {
    console.log('Fetching posyandus...');
    const { data, error } = await supabase.from('posyandu').select('id, nama');
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Posyandus found:', data?.length);
        fs.writeFileSync('posyandu_list.json', JSON.stringify(data, null, 2));
    }
}

list();
