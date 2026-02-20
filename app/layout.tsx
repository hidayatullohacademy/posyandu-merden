import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { SecurityBanner } from '@/components/SecurityBanner';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Posyandu ILP Digital — Desa Merden',
  description: 'Sistem digital pengelolaan layanan kesehatan Posyandu ILP (Integrasi Layanan Primer) Desa Merden untuk Balita dan Lansia.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/icon-192x192.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0d9488',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>
        <SecurityBanner />
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#0f172a',
              color: '#f8fafc',
              borderRadius: '12px',
              fontSize: '14px',
              padding: '12px 16px',
            },
          }}
        />
      </body>
    </html>
  );
}
