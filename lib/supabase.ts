import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Safety check for build-time static generation and runtime environment
    if (!supabaseUrl || !supabaseAnonKey) {
        if (process.env.NODE_ENV === 'development') {
            console.warn('Supabase credentials missing. Returning a proxy that will throw on property access.');
        }
        return new Proxy({}, {
            get: (_, prop) => {
                throw new Error(`Supabase client accessed but its credentials (NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY) are not defined. Check your .env.local file. Property accessed: ${String(prop)}`);
            }
        }) as any;
    }

    return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
