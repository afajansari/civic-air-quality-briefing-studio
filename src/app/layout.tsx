import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#030712',
  width: 'device-width',
  initialScale: 1
};

export const metadata: Metadata = {
  title: 'Civic Air Quality Briefing Studio | AI Civic Intelligence',
  description:
    'Turn raw air quality data into actionable local interventions for local authorities, housing societies, and ward-level teams. Grounded in verified telemetry with multi-language citizen advisories.',
  keywords: [
    'Air Quality',
    'AQI',
    'Civic Intelligence',
    'Pollution Briefing',
    'Citizen Advisory',
    'Ward Officer',
    'CPCB NAQI',
    'EPA AQI'
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-slate-950 antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-emerald-500 focus:text-slate-950 focus:font-bold focus:rounded-lg focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
