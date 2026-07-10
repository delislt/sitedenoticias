import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: 'SIS Jornal',
  description: 'Portal premium do Simulado Interno Sidarta'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Header />
        <main className="min-h-[calc(100vh-200px)]">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
