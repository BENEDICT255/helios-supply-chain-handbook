import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { siteInfo } from '@/data/siteInfo';

export const metadata: Metadata = {
  title: {
    default: siteInfo.title,
    template: `%s | ${siteInfo.title}`,
  },
  description: siteInfo.description,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="flex min-h-full flex-col bg-white text-[var(--text-primary)] antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
