import type { AppProps } from 'next/app';
import Head from 'next/head';
import { ThemeProvider } from 'next-themes';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Civic Air Quality Briefing Studio | CPCB Live Telemetry & AI Intelligence</title>
        <meta
          name="description"
          content="Real-time CPCB criteria air quality monitoring, GRAP emergency regulatory mandates, and automated civic intelligence briefing studio for Indian municipalities, schools, and housing societies."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem themes={['light', 'dark', 'theme-cpcb']}>
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground">
          <Component {...pageProps} />
        </div>
      </ThemeProvider>
    </>
  );
}
