import type { AppProps } from 'next/app';
import Head from 'next/head';
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
      <div className="dark min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
        <Component {...pageProps} />
      </div>
    </>
  );
}
