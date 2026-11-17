import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Wind, RotateCcw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Custom500() {
  return (
    <>
      <Head>
        <title>500 - Internal Studio Telemetry Exception | Civic Air Quality Studio</title>
        <meta name="robots" content="noindex, follow" />
      </Head>
      <div className="min-h-screen bg-[#090a0c] text-foreground flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-xl subtle-glass flex flex-col items-center text-center gap-4">
          <div className="size-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <AlertTriangle className="size-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight">500 - Telemetry Processing Interrupted</h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              An unexpected telemetry processing exception occurred. System telemetry failsafe preserved local session data.
            </p>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="gap-2 text-xs font-semibold"
            >
              <RotateCcw className="size-3.5" />
              <span>Retry Session</span>
            </Button>
            <Link href="/" passHref>
              <Button variant="default" size="sm" className="text-xs font-semibold">
                <span>Return to Studio</span>
              </Button>
            </Link>
          </div>
          <div className="pt-4 border-t border-border/50 w-full flex items-center justify-center gap-2 text-[10px] text-muted-foreground font-mono">
            <Wind className="size-3 text-primary" />
            <span>Civic Air Quality Briefing Studio</span>
          </div>
        </div>
      </div>
    </>
  );
}
