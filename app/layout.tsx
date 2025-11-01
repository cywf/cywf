import type { Metadata } from 'next';
import '../styles/globals.css';
import { prefixPath } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'CYWF Analytics Dashboard',
  description: 'Grafana-style analytics dashboard for GitHub activity and intelligence briefs',
  icons: {
    icon: prefixPath('/favicon.ico'),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="dark" />
        <meta name="theme-color" content="#0a0f0d" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div className="app-wrapper">
          {children}
        </div>
      </body>
    </html>
  );
}
