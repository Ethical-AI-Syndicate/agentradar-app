import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AgentRadar Status | Real-time System Monitoring',
  description: 'Live status monitoring for AgentRadar - Real Estate Intelligence Platform. Monitor API health, service availability, and performance metrics in real-time.',
  keywords: 'AgentRadar, status, monitoring, real estate, API health, system status',
  authors: [{ name: 'AgentRadar Team' }],
  robots: 'noindex, nofollow', // Status pages typically shouldn't be indexed
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#10b981',
  openGraph: {
    title: 'AgentRadar Status',
    description: 'Live system status and performance monitoring',
    type: 'website',
    siteName: 'AgentRadar Status',
  },
  twitter: {
    card: 'summary',
    title: 'AgentRadar Status',
    description: 'Live system status monitoring',
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
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="msapplication-TileColor" content="#10b981" />
        <meta name="theme-color" content="#10b981" />
      </head>
      <body className={`${inter.className} antialiased min-h-screen bg-background`}>
        <div className="flex flex-col min-h-screen">
          {children}
        </div>
        
        {/* Auto-refresh script for real-time updates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Auto-refresh every 30 seconds
              let refreshInterval = setInterval(() => {
                if (document.visibilityState === 'visible') {
                  window.location.reload();
                }
              }, 30000);
              
              // Pause refresh when tab is not visible
              document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') {
                  refreshInterval = setInterval(() => {
                    window.location.reload();
                  }, 30000);
                } else {
                  clearInterval(refreshInterval);
                }
              });
            `,
          }}
        />
      </body>
    </html>
  );
}