'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { INDIAN_CITIES, IndianCityStation } from '@/lib/india-cities';
import { Radio, Compass, Info } from 'lucide-react';

interface GeospatialStationMapProps {
  currentStation: string;
  currentCity: string;
  activeAqi: number;
  onSelectStation: (cityName: string) => void;
  className?: string;
}

// Coordinate projection helper: maps lat/lon across India to SVG viewBox (0 0 800 650)
function projectCoords(lat: number, lon: number): { x: number; y: number } {
  // India geographic bounds roughly: Lat 8.0N to 34.5N, Lon 68.5E to 92.5E
  const minLat = 8.0;
  const maxLat = 34.5;
  const minLon = 68.5;
  const maxLon = 92.5;

  const x = ((lon - minLon) / (maxLon - minLon)) * 700 + 50;
  const y = ((maxLat - lat) / (maxLat - minLat)) * 550 + 50;

  return { x: Math.round(x), y: Math.round(y) };
}

export function GeospatialStationMap({
  currentStation,
  currentCity,
  activeAqi,
  onSelectStation,
  className = '',
}: GeospatialStationMapProps) {
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [hoveredStation, setHoveredStation] = useState<IndianCityStation | null>(null);

  const filteredStations = useMemo(() => {
    if (selectedRegion === 'All') return INDIAN_CITIES;
    return INDIAN_CITIES.filter((s) => s.region.toLowerCase().includes(selectedRegion.toLowerCase()));
  }, [selectedRegion]);

  // Determine CPCB category color for map beacons
  const getCpcbColor = (val: number): { fill: string; stroke: string; label: string } => {
    if (val <= 50) return { fill: '#10b981', stroke: '#059669', label: 'Good' };
    if (val <= 100) return { fill: '#14b8a6', stroke: '#0d9488', label: 'Satisfactory' };
    if (val <= 200) return { fill: '#f59e0b', stroke: '#d97706', label: 'Moderate' };
    if (val <= 300) return { fill: '#f97316', stroke: '#ea580c', label: 'Poor' };
    if (val <= 400) return { fill: '#ef4444', stroke: '#dc2626', label: 'Very Poor' };
    return { fill: '#a855f7', stroke: '#9333ea', label: 'Severe' };
  };

  const activeColor = getCpcbColor(activeAqi);

  return (
    <Card className={`border-border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col ${className}`}>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-border/50 gap-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Compass className="size-4 text-primary" aria-hidden="true" />
            <CardTitle className="text-sm font-semibold tracking-wide">
              Live Indian CAAQMS Geospatial Grid
            </CardTitle>
            <Badge variant="outline" className="text-[10px] font-mono border-primary/40 text-primary">
              17 Stations • CPCB Grid
            </Badge>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Select an urban monitoring node to stream real-time Continuous Ambient Air Quality data
          </CardDescription>
        </div>

        {/* Regional Filter Chips */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {['All', 'NCR', 'West', 'South', 'North & East'].map((reg) => (
            <Button
              key={reg}
              type="button"
              variant={selectedRegion === reg ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedRegion(reg)}
              className="h-6 px-2 text-[10px] font-medium"
            >
              {reg}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-0 relative flex-1 min-h-[320px] sm:min-h-[380px] bg-slate-950/90 flex items-center justify-center">
        {/* Interactive Stylized India Geospatial SVG */}
        <svg
          viewBox="0 0 800 650"
          className="w-full h-full max-h-[420px] select-none"
          role="img"
          aria-label="Map of India showing live air quality monitoring stations"
        >
          <defs>
            {/* Grid Pattern */}
            <pattern id="geo-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            </pattern>
            {/* Glow Filter */}
            <filter id="beacon-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background Grid */}
          <rect width="800" height="650" fill="url(#geo-grid)" />

          {/* India Continental Boundary Vector Guide (Stylized Geodesic Contour) */}
          <path
            d="M 280,60 L 350,70 L 410,110 L 440,140 L 400,165 L 490,195 L 530,225 L 630,220 L 690,250 L 680,285 L 610,295 L 565,305 L 530,345 L 485,385 L 430,470 L 390,560 L 365,615 L 340,560 L 305,455 L 250,380 L 210,340 L 170,300 L 190,240 L 235,180 L 260,115 Z"
            fill="rgba(16, 185, 129, 0.03)"
            stroke="rgba(16, 185, 129, 0.25)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* Latitude & Longitude Coordinate Marks */}
          <g className="text-[9px] fill-slate-600 font-mono">
            <text x="60" y="80">30°N</text>
            <text x="60" y="240">24°N (Tropic of Cancer)</text>
            <text x="60" y="420">16°N</text>
            <text x="60" y="590">10°N</text>
            <text x="210" y="630">72°E</text>
            <text x="400" y="630">80°E</text>
            <text x="620" y="630">88°E</text>
          </g>

          {/* Regional Station Beacons */}
          {filteredStations.map((stn) => {
            const { x, y } = projectCoords(stn.lat, stn.lon);
            const isCurrent =
              currentCity.toLowerCase() === stn.city.toLowerCase() ||
              currentStation.toLowerCase().includes(stn.city.toLowerCase());

            return (
              <g
                key={stn.id}
                className="cursor-pointer group"
                onClick={() => onSelectStation(stn.city)}
                onMouseEnter={() => setHoveredStation(stn)}
                onMouseLeave={() => setHoveredStation(null)}
                tabIndex={0}
                role="button"
                aria-label={`${stn.name}, ${stn.state}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectStation(stn.city);
                  }
                }}
              >
                {/* Outer Ripple for Current Station */}
                {isCurrent && (
                  <circle
                    cx={x}
                    cy={y}
                    r="16"
                    fill="none"
                    stroke={activeColor.fill}
                    strokeWidth="1.5"
                    opacity="0.6"
                    className="animate-ping"
                  />
                )}

                {/* Base Anchor Circle */}
                <circle
                  cx={x}
                  cy={y}
                  r={isCurrent ? '8' : '5'}
                  fill={isCurrent ? activeColor.fill : '#38bdf8'}
                  stroke={isCurrent ? '#ffffff' : '#0369a1'}
                  strokeWidth={isCurrent ? '2.5' : '1.5'}
                  filter={isCurrent ? 'url(#beacon-glow)' : undefined}
                  className="transition-all duration-300 group-hover:r-7"
                />

                {/* Station Label */}
                <text
                  x={x + 10}
                  y={y + 4}
                  className={`text-[10px] font-bold font-sans transition-colors ${
                    isCurrent ? 'fill-white font-black' : 'fill-slate-400 group-hover:fill-cyan-300'
                  }`}
                >
                  {stn.name.split(' (')[0]}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Station Info Card on Hover/Focus */}
        <div className="absolute top-3 left-3 pointer-events-none flex flex-col gap-1 max-w-[280px]">
          {hoveredStation ? (
            <div className="p-2.5 rounded-lg bg-slate-900/90 backdrop-blur-md border border-cyan-500/40 shadow-xl text-xs flex flex-col gap-1 animate-in fade-in duration-150">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-white">{hoveredStation.name}</span>
                <Badge variant="outline" className="text-[9px] font-mono border-cyan-500/50 text-cyan-300">
                  {hoveredStation.region}
                </Badge>
              </div>
              <p className="text-[10px] text-slate-400 leading-snug">
                {hoveredStation.description || hoveredStation.station}
              </p>
              <div className="flex items-center gap-2 text-[9px] font-mono text-slate-500 mt-0.5">
                <span>Lat: {hoveredStation.lat.toFixed(2)}°N</span>
                <span>•</span>
                <span>Lon: {hoveredStation.lon.toFixed(2)}°E</span>
              </div>
            </div>
          ) : (
            <div className="p-2 rounded-lg bg-slate-900/60 backdrop-blur-md border border-slate-800 text-[10px] text-slate-400 flex items-center gap-1.5">
              <Info className="size-3 text-cyan-400 shrink-0" />
              <span>Hover or click any beacon to stream telemetry for that municipal zone</span>
            </div>
          )}
        </div>

        {/* Current Active Station HUD Pill */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2 p-2 rounded-lg bg-slate-900/90 backdrop-blur-md border border-border shadow-lg">
          <Radio className="size-3.5 text-primary animate-pulse" />
          <div className="flex flex-col text-right">
            <span className="text-[11px] font-black text-white">{currentStation || currentCity}</span>
            <span className="text-[9px] font-mono font-semibold" style={{ color: activeColor.fill }}>
              Current AQI {activeAqi} • {activeColor.label}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
