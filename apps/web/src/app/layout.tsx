import type { Metadata, Viewport } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import { SiteHeader } from '@/components/site-header';
import { Toaster } from '@/components/ui/sonner';
import { Providers } from './providers';
import './globals.css';

const beVietnam = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-be-vietnam',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'ShareCar — Đặt xe ghép 5/7 chỗ', template: '%s · ShareCar' },
  description: 'Tìm và đặt ghế xe ghép liên tỉnh 5 chỗ, 7 chỗ.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f9f7a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={beVietnam.variable}>
      <body className="min-h-dvh font-sans">
        <Providers>
          <SiteHeader />
          <main className="mx-auto w-full max-w-6xl px-4 py-6 md:py-10">{children}</main>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
