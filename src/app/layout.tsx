import type { Metadata } from 'next';
import './globals.css';
import { FarolHeader } from '@/components/layout/FarolHeader';
import { FarolFooter } from '@/components/layout/FarolFooter';
import { FarolWhatsAppWidget } from '@/components/ai/FarolWhatsAppWidget';

export const metadata: Metadata = {
  title: 'FAROL — Formação, Ações e Rede de Oportunidades Locais',
  description:
    'Portal de oportunidades, qualificação profissional e conexão entre talentos, empresas e startups de São Luís — SEMISPE.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-white text-[#0B2540]">
        <FarolHeader />
        <main className="flex-1">{children}</main>
        <FarolFooter />
        <FarolWhatsAppWidget />
      </body>
    </html>
  );
}
