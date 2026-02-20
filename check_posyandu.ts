import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listPosyandus() {
    const { data, error } = await supabase.from('posyandu').select('nama, id');
    if (error) {
        console.error(error);
    } else {
        fs.writeFileSync('posyandu_list.json', JSON.stringify(data, null, 2));
    }
}

listPosyandus();
