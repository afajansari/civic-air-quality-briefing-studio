import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en" className="dark scroll-smooth">
      <Head>
        <meta charSet="utf-8" />
        <link rel="preconnect" href="https://air-quality-api.open-meteo.com" />
        <link rel="preconnect" href="https://geocoding-api.open-meteo.com" />
      </Head>
      <body className="bg-slate-950 text-slate-100 antialiased overflow-x-hidden selection:bg-emerald-500 selection:text-slate-950">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
