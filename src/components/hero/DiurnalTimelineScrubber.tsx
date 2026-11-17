'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, FastForward, Clock, Sun, Moon, CloudFog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DiurnalTimelineScrubberProps {
  activeHour: number; // 0 to 23
  onHourChange: (hour: number) => void;
  pm25Diurnal?: number[]; // 24 hourly readings
  cityName: string;
  className?: string;
}

export function DiurnalTimelineScrubber({
  activeHour,
  onHourChange,
  pm25Diurnal = [],
  cityName,
  className = '',
}: DiurnalTimelineScrubberProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2 | 4>(1);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const activeHourRef = useRef(activeHour);
  useEffect(() => {
    activeHourRef.current = activeHour;
  }, [activeHour]);

  // Auto-play loop
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.round(1000 / playbackSpeed);
      timerRef.current = setInterval(() => {
        onHourChange((activeHourRef.current + 1) % 24);
      }, intervalMs);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed, onHourChange]);

  const togglePlay = useCallback(() => {
    setIsPlaying((p) => !p);
  }, []);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    onHourChange(new Date().getHours()); // Reset to real current hour
  }, [onHourChange]);

  const cycleSpeed = useCallback(() => {
    setPlaybackSpeed((prev) => {
      if (prev === 1) return 2;
      if (prev === 2) return 4;
      return 1;
    });
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      togglePlay();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      onHourChange((activeHour + 1) % 24);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onHourChange((activeHour - 1 + 24) % 24);
    }
  };

  // Atmospheric diurnal phase descriptor
  const getDiurnalPhase = (h: number): { label: string; icon: React.ReactNode; color: string } => {
    if (h >= 0 && h < 5) {
      return {
        label: 'Nocturnal Boundary Inversion (Severe Trapping)',
        icon: <CloudFog className="size-3 text-purple-400" />,
        color: 'text-purple-400',
      };
    }
    if (h >= 5 && h < 10) {
      return {
        label: 'Morning Rush Hour & Cool Air Pooling',
        icon: <Moon className="size-3 text-amber-400" />,
        color: 'text-amber-400',
      };
    }
    if (h >= 10 && h < 17) {
      return {
        label: 'Solar Heating & Convective Boundary Dispersion',
        icon: <Sun className="size-3 text-emerald-400" />,
        color: 'text-emerald-400',
      };
    }
    return {
      label: 'Evening Commute & Surface Temperature Collapse',
      icon: <CloudFog className="size-3 text-orange-400" />,
      color: 'text-orange-400',
    };
  };

  const currentPhase = getDiurnalPhase(activeHour);
  const activePM25 = pm25Diurnal[activeHour] ?? (activeHour < 12 ? 140 : 85);

  return (
    <div
      className={`p-3 rounded-xl border border-border/80 bg-slate-900/90 backdrop-blur-md shadow-lg flex flex-col gap-2.5 ${className}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="24-Hour Diurnal Timeline Scrubber"
    >
      {/* Top Header: Controls & Active Timestamp */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Play/Pause Button */}
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={togglePlay}
            className="h-7 px-2.5 gap-1.5 text-xs font-bold"
            aria-label={isPlaying ? 'Pause 24-hr time lapse' : 'Play 24-hr time lapse'}
          >
            {isPlaying ? <Pause className="size-3 text-slate-950" /> : <Play className="size-3 text-slate-950" />}
            <span>{isPlaying ? 'Pause' : 'Time-Lapse'}</span>
          </Button>

          {/* Speed Toggle */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={cycleSpeed}
            className="h-7 px-2 text-[11px] font-mono font-bold border-border bg-background hover:bg-accent"
            title="Cycle playback speed (1x, 2x, 4x)"
          >
            <FastForward className="size-3 text-primary mr-1" />
            {playbackSpeed}x
          </Button>

          {/* Reset Button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
            title="Reset to current hour"
          >
            <RotateCcw className="size-3" />
          </Button>
        </div>

        {/* Active Hour Indicator with Diurnal Phase */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Clock className="size-3.5 text-primary" />
            <span className="font-mono text-sm font-black text-cyan-400">
              {String(activeHour).padStart(2, '0')}:00
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[11px] font-medium bg-slate-950/70 px-2 py-0.5 rounded border border-slate-800">
            {currentPhase.icon}
            <span className={currentPhase.color}>{currentPhase.label}</span>
          </div>

          <Badge variant="outline" className="text-[10px] font-mono border-border text-foreground">
            PM2.5: {Math.round(activePM25)} µg/m³
          </Badge>
        </div>
      </div>

      {/* Scrubber Track & Hourly Marks */}
      <div className="flex flex-col gap-1">
        <div className="relative w-full h-7 flex items-center">
          {/* Background Diurnal Sparkline Grid */}
          <div className="absolute inset-0 flex items-end gap-0.5 opacity-20 pointer-events-none px-1">
            {Array.from({ length: 24 }).map((_, i) => {
              const val = pm25Diurnal[i] ?? (i < 10 ? 120 : 60);
              const heightPct = Math.min(100, Math.max(15, (val / 250) * 100));
              const isSelected = i === activeHour;
              return (
                <div
                  key={i}
                  style={{ height: `${heightPct}%` }}
                  className={`flex-1 rounded-t-sm transition-all ${
                    isSelected ? 'bg-cyan-400 opacity-100' : 'bg-slate-400'
                  }`}
                />
              );
            })}
          </div>

          {/* HTML5 Range Slider */}
          <input
            type="range"
            min="0"
            max="23"
            step="1"
            value={activeHour}
            onChange={(e) => onHourChange(parseInt(e.target.value, 10))}
            aria-label={`Select hour of diurnal air quality cycle for ${cityName}, currently ${activeHour}:00`}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 relative z-10"
          />
        </div>

        {/* 24-Hour Markers */}
        <div className="flex justify-between text-[9px] font-mono text-slate-500 px-0.5 select-none">
          <span>00:00</span>
          <span className="hidden sm:inline">04:00</span>
          <span>08:00</span>
          <span className="hidden sm:inline">12:00</span>
          <span>16:00</span>
          <span className="hidden sm:inline">20:00</span>
          <span>23:00</span>
        </div>
      </div>
    </div>
  );
}
