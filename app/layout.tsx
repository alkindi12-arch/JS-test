import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hostinger Node Test',
  description: 'Minimal Next.js smoke test for Hostinger Node.js Web Apps',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
