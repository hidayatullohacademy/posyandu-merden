import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Safety check for build-time static generation
    if (!supabaseUrl || !supabaseAnonKey) {
        return {} as unknown as any; 
    }

    return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
