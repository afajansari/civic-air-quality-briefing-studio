import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Wind, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Custom404() {
  return (
    <>
      <Head>
        <title>404 - Monitoring Station Not Found | Civic Air Quality Studio</title>
        <meta name="robots" content="noindex, follow" />
      </Head>
      <div className="min-h-screen bg-[#090a0c] text-foreground flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-xl subtle-glass flex flex-col items-center text-center gap-4">
          <div className="size-12 rounded-xl bg-destructive/15 border border-destructive/30 flex items-center justify-center text-destructive">
            <AlertCircle className="size-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight">404 - Grid Node Not Found</h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The requested monitoring station or URL does not exist in the official CAAQMS telemetry network.
            </p>
          </div>
          <Link href="/" passHref>
            <Button variant="default" size="sm" className="gap-2 text-xs font-semibold mt-2">
              <ArrowLeft className="size-3.5" />
              <span>Return to Command Studio</span>
            </Button>
          </Link>
          <div className="pt-4 border-t border-border/50 w-full flex items-center justify-center gap-2 text-[10px] text-muted-foreground font-mono">
            <Wind className="size-3 text-primary" />
            <span>Civic Air Quality Briefing Studio</span>
          </div>
        </div>
      </div>
    </>
  );
}
