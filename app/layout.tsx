import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'Supply Chain Control Tower | AI-Powered Logistics Intelligence',
  description:
    'Real-time predictive logistics platform. Monitor shipments, detect disruptions, and optimize routes with AI-powered risk scoring.',
  keywords: ['supply chain', 'logistics', 'control tower', 'AI', 'predictive analytics'],
  authors: [{ name: 'Smart Supply Chain Team' }],
  openGraph: {
    title: 'Smart Supply Chain Control Tower',
    description: 'AI-powered logistics intelligence platform',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#080c14" />
      </head>
      <body>
        <div className="app-layout">
          <Sidebar />
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
