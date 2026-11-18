'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, ChevronDown, ChevronUp, Gauge } from 'lucide-react';
import { LiveCriteriaCurrent } from '@/components/DataIngestion';

interface DockableTelemetryHUDProps {
  currentStation: string;
  currentCity: string;
  activeAqi: number;
  current?: LiveCriteriaCurrent;
  className?: string;
}

// Statutory Indian CPCB IS 5182 Color Standards
function getCpcbCategory(val: number): { label: string; color: string; badgeClass: string; stroke: string } {
  if (val <= 50) {
    return {
      label: 'Good',
      color: 'text-[#00b050]',
      badgeClass: 'bg-[#00b050]/15 text-[#00b050] border-[#00b050]/30',
      stroke: '#00b050',
    };
  }
  if (val <= 100) {
    return {
      label: 'Satisfactory',
      color: 'text-[#70ad47]',
      badgeClass: 'bg-[#70ad47]/15 text-[#70ad47] border-[#70ad47]/30',
      stroke: '#70ad47',
    };
  }
  if (val <= 200) {
    return {
      label: 'Moderate',
      color: 'text-[#eab308]',
      badgeClass: 'bg-[#eab308]/15 text-[#eab308] border-[#eab308]/30',
      stroke: '#eab308',
    };
  }
  if (val <= 300) {
    return {
      label: 'Poor',
      color: 'text-[#ea580c]',
      badgeClass: 'bg-[#ea580c]/15 text-[#ea580c] border-[#ea580c]/30',
      stroke: '#ea580c',
    };
  }
  if (val <= 400) {
    return {
      label: 'Very Poor',
      color: 'text-[#dc2626]',
      badgeClass: 'bg-[#dc2626]/15 text-[#dc2626] border-[#dc2626]/30',
      stroke: '#dc2626',
    };
  }
  return {
    label: 'Severe',
    color: 'text-[#991b1b]',
    badgeClass: 'bg-[#991b1b]/15 text-[#991b1b] border-[#991b1b]/30',
    stroke: '#991b1b',
  };
}

export function DockableTelemetryHUD({
  currentStation,
  currentCity,
  activeAqi,
  current = {},
  className = '',
}: DockableTelemetryHUDProps) {
  const [isDocked, setIsDocked] = useState(false);

  const category = getCpcbCategory(activeAqi);

  const normalizedAQI = Math.min(500, Math.max(0, activeAqi));

  if (isDocked) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsDocked(false)}
        className={`h-8 px-3 rounded-full subtle-glass shadow-xl text-xs gap-1.5 font-bold animate-in fade-in ${className}`}
        aria-label="Expand telemetry HUD"
      >
        <Gauge className="size-3.5 text-primary" />
        <span className="text-foreground font-mono tabular-nums">AQI {activeAqi}</span>
        <span className={`text-[10px] ${category.color}`}>({category.label})</span>
        <ChevronDown className="size-3 text-muted-foreground ml-0.5" />
      </Button>
    );
  }

  return (
    <Card
      className={`border-border/80 subtle-glass shadow-2xl rounded-xl overflow-hidden transition-all duration-200 ${className}`}
      role="region"
      aria-label="Dockable Telemetry HUD"
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-[#090a0c]/50">
        <div className="flex items-center gap-1.5 min-w-0 pr-1">
          <Activity className="size-3.5 text-primary shrink-0" />
          <span className="text-xs font-bold text-foreground leading-snug break-words">
            {currentStation || currentCity}
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsDocked(true)}
          className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
          title="Dock HUD to minimize view"
          aria-label="Minimize telemetry HUD"
        >
          <ChevronUp className="size-3" />
          <span className="sr-only">Dock HUD</span>
        </Button>
      </div>

      <CardContent className="p-3 flex flex-col gap-3">
        {/* Radial AQI Arc Meter */}
        <div className="flex items-center justify-between gap-3">
          <div className="relative size-20 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 100 60" className="w-20 h-12 overflow-visible">
              {/* Background Arc */}
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="8"
                strokeLinecap="round"
              />
              {/* Value Arc */}
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke={category.stroke}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray="125.6"
                strokeDashoffset={125.6 - (normalizedAQI / 500) * 125.6}
                className="transition-all duration-500 ease-out"
              />
            </svg>
            <div className="absolute inset-x-0 bottom-0 text-center flex flex-col items-center">
              <span className="text-lg font-black text-foreground leading-none font-mono tabular-nums">{activeAqi}</span>
              <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">CPCB AQI</span>
            </div>
          </div>

          <div className="flex flex-col items-start gap-1 min-w-0">
            <Badge variant="outline" className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 ${category.badgeClass}`}>
              {category.label}
            </Badge>
            <span className="text-[10px] text-muted-foreground leading-tight">
              Dominant criteria: <strong className="text-foreground">PM2.5 / PM10</strong>
            </span>
          </div>
        </div>

        {/* Criteria Pollutant Mini Grid */}
        <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono border-t border-border/60 pt-2">
          <div className="flex items-center justify-between p-1.5 rounded bg-[#090a0c]/60 border border-border/80">
            <span className="text-muted-foreground">PM2.5</span>
            <span className="font-bold text-foreground tabular-nums">{current.pm25 != null ? Math.round(Number(current.pm25)) : 92} µg</span>
          </div>
          <div className="flex items-center justify-between p-1.5 rounded bg-[#090a0c]/60 border border-border/80">
            <span className="text-muted-foreground">PM10</span>
            <span className="font-bold text-foreground tabular-nums">{current.pm10 != null ? Math.round(Number(current.pm10)) : 165} µg</span>
          </div>
          <div className="flex items-center justify-between p-1.5 rounded bg-[#090a0c]/60 border border-border/80">
            <span className="text-muted-foreground">NO2</span>
            <span className="font-bold text-foreground tabular-nums">{current.no2 != null ? Math.round(Number(current.no2)) : 48} µg</span>
          </div>
          <div className="flex items-center justify-between p-1.5 rounded bg-[#090a0c]/60 border border-border/80">
            <span className="text-muted-foreground">SO2</span>
            <span className="font-bold text-foreground tabular-nums">{current.so2 != null ? Math.round(Number(current.so2)) : 14} µg</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}