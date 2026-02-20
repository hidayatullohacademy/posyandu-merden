import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkKader() {
    const { data, error } = await supabase.from('users').select('*').eq('role', 'KADER');
    if (error) {
        fs.writeFileSync('kader_out.json', JSON.stringify({error}, null, 2));
    } else {
        fs.writeFileSync('kader_out.json', JSON.stringify(data, null, 2));
    }
}

checkKader();
