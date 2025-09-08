// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from '../components/providers/Providers';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'School Management System',
  description: 'Comprehensive K-12 School Management System for Nigerian Schools',
  keywords: 'school management, education, students, grades, attendance, Nigeria',
  authors: [{ name: 'School Management Team' }],
  creator: 'School Management System',
  publisher: 'School Management System',
  robots: 'index, follow',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'School Management System',
    title: 'School Management System - Comprehensive K-12 Solution',
    description: 'Modern school management system designed for Nigerian schools with features for student management, academics, finance, and communication.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'School Management System',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'School Management System',
    description: 'Comprehensive K-12 School Management System for Nigerian Schools',
    images: ['/twitter-image.jpg'],
    creator: '@schoolmanagementsystem',
  },
};

export const generateViewport = () => ({
  themeColor: '#f97316',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakarta.variable}`}>
      <body className="antialiased">
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#374151',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
