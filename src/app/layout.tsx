import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/app/providers';

export const metadata: Metadata = {
  title: 'LATENT — лаборатория расхождения моделей',
  description: 'Измените одно условие и наблюдайте, как расходятся параллельные ответы ИИ.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
