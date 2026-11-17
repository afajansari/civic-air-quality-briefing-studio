'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, RotateCcw, Clock, Sun, Moon, Sunrise, Sunset, FastForward } from 'lucide-react';

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
    onHourChange(new Date().getHours());
  }, [onHourChange]);

  const cycleSpeed = useCallback(() => {
    setPlaybackSpeed((prev) => (prev === 1 ? 2 : prev === 2 ? 4 : 1));
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      onHourChange((activeHour + 1) % 24);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onHourChange((activeHour - 1 + 24) % 24);
    } else if (e.key === ' ') {
      e.preventDefault();
      togglePlay();
    }
  };

  // Atmospheric diurnal phase descriptor
  const getDiurnalPhase = (h: number): { label: string; icon: React.ReactNode; color: string } => {
    if (h >= 5 && h < 8) {
      return {
        label: 'Dawn Inversion Breakup',
        icon: <Sunrise className="size-3 text-amber-400" />,
        color: 'text-amber-400',
      };
    }
    if (h >= 8 && h < 12) {
      return {
        label: 'Morning Traffic Peak',
        icon: <Sun className="size-3 text-orange-400" />,
        color: 'text-orange-400',
      };
    }
    if (h >= 12 && h < 17) {
      return {
        label: 'Afternoon Vertical Mixing',
        icon: <Sun className="size-3 text-emerald-400" />,
        color: 'text-emerald-400',
      };
    }
    if (h >= 17 && h < 21) {
      return {
        label: 'Dusk Traffic & Cooling',
        icon: <Sunset className="size-3 text-amber-500" />,
        color: 'text-amber-500',
      };
    }
    return {
      label: 'Nocturnal Inversion Trap',
      icon: <Moon className="size-3 text-rose-400" />,
      color: 'text-rose-400',
    };
  };

  const currentPhase = getDiurnalPhase(activeHour);
  const activePM25 = pm25Diurnal[activeHour] ?? (activeHour < 12 ? 140 : 85);

  return (
    <div
      className={`p-3 rounded-xl border border-border/70 subtle-glass shadow-lg flex flex-col gap-2.5 ${className}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="24-Hour Diurnal Timeline Scrubber"
    >
      {/* Top Header: Controls & Active Timestamp */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Play/Pause Button */}
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={togglePlay}
            className="h-7 px-2.5 gap-1.5 text-xs font-semibold"
            aria-label={isPlaying ? 'Pause 24-hr time lapse' : 'Play 24-hr time lapse'}
          >
            {isPlaying ? <Pause className="size-3" /> : <Play className="size-3" />}
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
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 text-xs font-semibold text-foreground">
            <Clock className="size-3.5 text-primary" />
            <span className="font-mono text-xs sm:text-sm font-black text-primary tabular-nums">
              {String(activeHour).padStart(2, '0')}:00 IST
            </span>
          </div>

          <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-medium bg-[#090a0c]/60 px-2 py-0.5 rounded border border-border/60">
            {currentPhase.icon}
            <span className={currentPhase.color}>{currentPhase.label}</span>
          </div>

          <Badge variant="outline" className="text-[10px] font-mono border-border text-foreground tabular-nums">
            PM2.5: {Math.round(activePM25)} µg/m³
          </Badge>
        </div>
      </div>

      {/* Scrubber Track & Hourly Marks */}
      <div className="flex flex-col gap-1">
        <div className="relative w-full h-7 flex items-center">
          {/* Background Diurnal Sparkline Grid */}
          <div className="absolute inset-0 flex items-end gap-0.5 opacity-25 pointer-events-none px-1">
            {Array.from({ length: 24 }).map((_, i) => {
              const val = pm25Diurnal[i] ?? (i < 10 ? 120 : 60);
              const heightPct = Math.min(100, Math.max(15, (val / 250) * 100));
              const isSelected = i === activeHour;
              return (
                <div
                  key={i}
                  style={{ height: `${heightPct}%` }}
                  className={`flex-1 rounded-t-sm transition-all ${
                    isSelected ? 'bg-primary opacity-100' : 'bg-muted-foreground/40'
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
            className="w-full h-2 bg-muted/60 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none focus:ring-1 focus:ring-primary relative z-10"
          />
        </div>

        {/* 24-Hour Markers */}
        <div className="flex justify-between text-[9px] font-mono text-muted-foreground px-0.5 select-none tabular-nums">
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
