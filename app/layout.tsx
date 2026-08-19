import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { FirstVisitIntro } from '@/components/FirstVisitIntro';

const themeInitScript = "(function(){var key='sis-theme-v1';var theme;try{var stored=window.localStorage.getItem(key);theme=stored==='light'||stored==='dark'?stored:window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}catch(error){theme=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.dataset.theme=theme;})();";

export const metadata: Metadata = {
  title: 'SIS Jornal',
  description: 'Portal premium do Simulado Interno Sidarta'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <Script id="sis-theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <FirstVisitIntro />
        <Header />
        <main className="min-h-[calc(100vh-200px)]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
