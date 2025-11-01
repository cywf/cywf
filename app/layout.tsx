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
    <html lang="en" suppressHydrationWarning>
      <body>
        <div className="app-wrapper">
          {children}
        </div>
      </body>
    </html>
  );
}
