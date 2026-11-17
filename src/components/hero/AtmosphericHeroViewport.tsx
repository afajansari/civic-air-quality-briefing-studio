'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Box, Map } from 'lucide-react';
import { LiveTelemetryData } from '@/components/DataIngestion';
import { GeospatialStationMap } from '@/components/hero/GeospatialStationMap';
import { DiurnalTimelineScrubber } from '@/components/hero/DiurnalTimelineScrubber';
import { DockableTelemetryHUD } from '@/components/hud/DockableTelemetryHUD';
import { PolicyScenarioSimulator } from '@/components/PolicyScenarioSimulator';

const Atmospheric3DChamber = dynamic(
  () => import('@/components/3d/Atmospheric3DChamber').then((mod) => mod.Atmospheric3DChamber),
  {
    ssr: false,
    loading: () => (
      <div className="h-72 sm:h-80 w-full animate-pulse bg-slate-950 rounded-xl border border-border flex items-center justify-center">
        <span className="text-xs font-mono text-muted-foreground">
          Initializing 60 FPS WebGL Atmospheric Chamber...
        </span>
      </div>
    ),
  }
);

interface AtmosphericHeroViewportProps {
  currentStation: string;
  currentCity: string;
  activeAqi: number;
  activePm25: number;
  activePm10: number;
  latestTelemetry?: LiveTelemetryData | null;
  pm25Diurnal?: number[];
  activeHour: number;
  onHourChange: (hour: number) => void;
  onSelectStation: (cityName: string) => void;
  simulatedReductionPct: number;
  onSimulationChange: (reductionPct: number) => void;
  className?: string;
}

export function AtmosphericHeroViewport({
  currentStation,
  currentCity,
  activeAqi,
  activePm25,
  activePm10,
  latestTelemetry,
  pm25Diurnal = [],
  activeHour,
  onHourChange,
  onSelectStation,
  simulatedReductionPct,
  onSimulationChange,
  className = '',
}: AtmosphericHeroViewportProps) {
  const [viewportMode, setViewportMode] = useState<'3d' | 'map'>('3d');

  return (
    <section
      aria-label="Interactive Atmospheric & Geospatial Studio Viewport"
      className={`flex flex-col gap-3 ${className}`}
    >
      {/* Viewport Canvas Card with Mode Selector Toolbar */}
      <Card className="border-border bg-card shadow-lg rounded-xl overflow-hidden relative">
        {/* Top Floating Viewport Toolbar */}
        <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-[#0e1015]/90 backdrop-blur-md border-b border-border/60 gap-2 relative z-20">
          <div className="flex items-center gap-2 min-w-0">
            <div className="size-2 rounded-full bg-primary animate-ping shrink-0" />
            <span className="text-xs sm:text-sm font-bold text-foreground tracking-wide flex items-center gap-1.5 truncate">
              ATMOSPHERIC BRIEFING STUDIO
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                {viewportMode === '3d' ? '3D WebGL Particulate Engine' : 'Survey of India CAAQMS Grid'}
              </span>
            </span>
          </div>

          {/* Mode Switcher Pill */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#090a0c] border border-border">
            <Button
              type="button"
              variant={viewportMode === '3d' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewportMode('3d')}
              className="h-7 px-3 text-xs font-semibold gap-1.5"
            >
              <Box className="size-3.5" />
              <span>3D Chamber</span>
            </Button>

            <Button
              type="button"
              variant={viewportMode === 'map' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewportMode('map')}
              className="h-7 px-3 text-xs font-semibold gap-1.5"
            >
              <Map className="size-3.5" />
              <span>Geospatial Map</span>
            </Button>
          </div>
        </div>

        {/* Canvas Body */}
        <CardContent className="p-0 relative min-h-[380px] sm:min-h-[440px] bg-[#090a0c]">
          {viewportMode === '3d' ? (
            <Atmospheric3DChamber
              aqi={activeAqi}
              pm25={activePm25}
              pm10={activePm10}
              cityName={currentCity}
              stationName={currentStation}
              simulatedReductionPct={simulatedReductionPct}
              activeHour={activeHour}
              className="border-0 rounded-none h-full"
            />
          ) : (
            <GeospatialStationMap
              currentStation={currentStation}
              currentCity={currentCity}
              activeAqi={activeAqi}
              onSelectStation={onSelectStation}
              className="border-0 rounded-none h-full"
            />
          )}

          {/* Top-Left Floating Dockable Telemetry HUD */}
          <div className="absolute top-3 left-3 z-20 max-w-[280px] sm:max-w-[320px]">
            <DockableTelemetryHUD
              currentStation={currentStation}
              currentCity={currentCity}
              activeAqi={activeAqi}
              current={latestTelemetry?.current}
            />
          </div>

          {/* Top-Right Floating Policy Scenario Sandbox */}
          <div className="absolute top-3 right-3 z-20 w-auto max-w-[calc(100vw-2rem)] sm:max-w-[420px] hidden md:block">
            <PolicyScenarioSimulator
              baseAqi={activeAqi}
              basePm25={activePm25}
              cityName={currentCity}
              onSimulationChange={onSimulationChange}
              isFloating={true}
              className="border-border/60 subtle-glass shadow-2xl"
            />
          </div>
        </CardContent>

        {/* Base 24-Hour Diurnal Timeline Scrubber */}
        <div className="p-3 bg-[#090a0c] border-t border-border/60 relative z-20">
          <DiurnalTimelineScrubber
            activeHour={activeHour}
            onHourChange={onHourChange}
            pm25Diurnal={pm25Diurnal}
            cityName={currentCity}
          />
        </div>
      </Card>

      {/* Mobile Policy Simulator Accordion (for smaller screens where floating card is hidden) */}
      <div className="block md:hidden">
        <PolicyScenarioSimulator
          baseAqi={activeAqi}
          basePm25={activePm25}
          cityName={currentCity}
          onSimulationChange={onSimulationChange}
          isFloating={false}
        />
      </div>
    </section>
  );
}
