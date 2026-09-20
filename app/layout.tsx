import type { Metadata, Viewport } from 'next';
import { Syne, Figtree } from 'next/font/google';
import './globals.css';

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  display: 'swap',
  weight: ['500', '600', '700', '800'],
});

const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-figtree',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: {
    default: 'App Hub',
    template: '%s · App Hub',
  },
  description:
    'Multi-app portal on Hostinger — Lineage equipment history and future tools on one domain.',
  applicationName: 'App Hub',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0e1a1c',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${syne.variable} ${figtree.variable}`}>
      <body className="atmosphere">{children}</body>
    </html>
  );
}
