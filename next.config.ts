import type { NextConfig } from "next";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require('next-pwa')({
    dest: 'public',
    disable: process.env.NODE_ENV === 'development',
    register: true,
    skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'nswggiksxhxsbvorrkmu.supabase.co',
                pathname: '/storage/v1/object/public/**',
            },
        ],
    },
};

const isDev = process.env.NODE_ENV === 'development';

// Only wrap with PWA if not in development to avoid Turbopack conflicts
export default isDev ? nextConfig : withPWA(nextConfig);
