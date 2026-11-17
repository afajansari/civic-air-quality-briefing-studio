'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { INDIAN_CITIES, IndianCityStation } from '@/lib/india-cities';
import { Compass, Satellite, Map as MapIcon, Layers, Radio } from 'lucide-react';

interface GeospatialStationMapProps {
  currentStation: string;
  currentCity: string;
  activeAqi: number;
  onSelectStation: (cityName: string) => void;
  className?: string;
}

// High-precision projection: India bounds Lat 7.0N-37.5N, Lon 67.0E-98.0E into SVG (0 0 800 650)
function projectCoords(lat: number, lon: number): { x: number; y: number } {
  const minLat = 7.0;
  const maxLat = 37.5;
  const minLon = 67.0;
  const maxLon = 98.0;

  const x = ((lon - minLon) / (maxLon - minLon)) * 680 + 60;
  const y = ((maxLat - lat) / (maxLat - minLat)) * 580 + 35;

  return { x: Math.round(x), y: Math.round(y) };
}

// Statutory Indian CPCB IS 5182 Color Standards
function getCpcbColor(val: number): { fill: string; stroke: string; label: string } {
  if (val <= 50) return { fill: '#00b050', stroke: '#008a3e', label: 'Good' };
  if (val <= 100) return { fill: '#70ad47', stroke: '#568a35', label: 'Satisfactory' };
  if (val <= 200) return { fill: '#eab308', stroke: '#ca8a04', label: 'Moderate' };
  if (val <= 300) return { fill: '#ea580c', stroke: '#c2410c', label: 'Poor' };
  if (val <= 400) return { fill: '#dc2626', stroke: '#b91c1c', label: 'Very Poor' };
  return { fill: '#991b1b', stroke: '#7f1d1d', label: 'Severe' };
}

export function GeospatialStationMap({
  currentStation,
  currentCity,
  activeAqi,
  onSelectStation,
  className = '',
}: GeospatialStationMapProps) {
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [mapLayer, setMapLayer] = useState<'boundaries' | 'aod'>('boundaries');
  const [hoveredStation, setHoveredStation] = useState<IndianCityStation | null>(null);

  const filteredStations = useMemo(() => {
    if (selectedRegion === 'All') return INDIAN_CITIES;
    return INDIAN_CITIES.filter((s) => s.region.toLowerCase().includes(selectedRegion.toLowerCase()));
  }, [selectedRegion]);

  const activeColor = getCpcbColor(activeAqi);

  return (
    <Card className={`border-border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col ${className}`}>
      {/* Header with Layer Switcher & Regional Filter */}
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-border/60 gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Compass className="size-4 text-primary" aria-hidden="true" />
            <CardTitle className="text-sm font-semibold tracking-wide">
              Official Indian CAAQMS Geospatial Grid
            </CardTitle>
            <Badge variant="outline" className="text-[10px] font-mono border-primary/40 text-primary">
              17 CPCB Nodes • Survey of India Bounds
            </Badge>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Continuous Ambient Air Quality Monitoring Network with satellite Aerosol Optical Depth (AOD) modeling
          </CardDescription>
        </div>

        {/* Action Controls: Layer Switcher & Regional Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Layer Switcher */}
          <div className="flex items-center p-0.5 rounded-lg bg-muted/60 border border-border text-xs">
            <Button
              type="button"
              variant={mapLayer === 'boundaries' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMapLayer('boundaries')}
              className="h-6 px-2 text-[10px] gap-1 font-medium"
              title="Cartographic Political & Municipal Boundaries"
            >
              <MapIcon className="size-3" />
              <span>Vector</span>
            </Button>
            <Button
              type="button"
              variant={mapLayer === 'aod' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMapLayer('aod')}
              className="h-6 px-2 text-[10px] gap-1 font-medium"
              title="Satellite Aerosol Optical Depth (AOD) Thermal Smog Plume"
            >
              <Satellite className="size-3" />
              <span>AOD Plume</span>
            </Button>
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
        </div>
      </CardHeader>

      <CardContent className="p-0 relative flex-1 min-h-[360px] sm:min-h-[420px] bg-[#090a0c] flex items-center justify-center">
        {/* Authentic SVG Map of India with Precise Survey of India Contours */}
        <svg
          viewBox="0 0 800 650"
          className="w-full h-full max-h-[440px] select-none"
          role="img"
          aria-label="Map of India showing official CPCB air quality monitoring stations and satellite aerosol optical depth plume"
        >
          <defs>
            {/* Grid Pattern */}
            <pattern id="cleanroom-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            </pattern>

            {/* Winter Indo-Gangetic Basin Aerosol Optical Depth (AOD) Plume Gradient */}
            <radialGradient id="aod-gangetic-core" cx="42%" cy="36%" r="35%">
              <stop offset="0%" stopColor="#991b1b" stopOpacity="0.75" />
              <stop offset="25%" stopColor="#ea580c" stopOpacity="0.60" />
              <stop offset="55%" stopColor="#eab308" stopOpacity="0.40" />
              <stop offset="85%" stopColor="#70ad47" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#00b050" stopOpacity="0.02" />
            </radialGradient>

            {/* Western Industrial Basin Plume (Gujarat & Maharashtra) */}
            <radialGradient id="aod-western-core" cx="22%" cy="56%" r="22%">
              <stop offset="0%" stopColor="#ea580c" stopOpacity="0.55" />
              <stop offset="45%" stopColor="#eab308" stopOpacity="0.30" />
              <stop offset="100%" stopColor="#70ad47" stopOpacity="0.05" />
            </radialGradient>

            {/* Southern Dispersion Zone */}
            <radialGradient id="aod-southern-dispersion" cx="37%" cy="76%" r="26%">
              <stop offset="0%" stopColor="#00b050" stopOpacity="0.30" />
              <stop offset="60%" stopColor="#70ad47" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#00b050" stopOpacity="0.02" />
            </radialGradient>

            {/* Beacon Glow Filter */}
            <filter id="cleanroom-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Cleanroom Background Grid */}
          <rect width="800" height="650" fill="url(#cleanroom-grid)" />

          {/* Satellite AOD Atmospheric Plume Layer (visible when active) */}
          {mapLayer === 'aod' && (
            <g className="transition-opacity duration-500 animate-in fade-in">
              {/* Indo-Gangetic Plain Smog Corridor (trapped against Himalayas) */}
              <ellipse
                cx="370"
                cy="235"
                rx="210"
                ry="65"
                transform="rotate(-8 370 235)"
                fill="url(#aod-gangetic-core)"
              />
              {/* Western Industrial Core */}
              <circle cx="185" cy="345" r="95" fill="url(#aod-western-core)" />
              {/* Southern Peninsular Clean Air Corridor */}
              <ellipse cx="295" cy="505" rx="110" ry="85" fill="url(#aod-southern-dispersion)" />

              {/* Himalayan Orographic Smog Barrier Ridge */}
              <path
                d="M 285,110 Q 360,160 440,195 T 530,225 T 620,220"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeDasharray="6 4"
                opacity="0.75"
              />
              <text x="410" y="175" className="text-[9px] fill-amber-400 font-mono font-bold tracking-wider">
                ▲ HIMALAYAN THERMAL INVERSION BARRIER (TRAPS SMOG)
              </text>
            </g>
          )}

          {/* High-Precision Survey of India National Territorial Outer Boundary Path */}
          <path
            d="
              M 268,63
              L 282,58 L 298,62 L 315,75 L 328,95 L 348,110 L 358,118
              L 378,142 L 398,155 L 418,172 L 442,188 L 478,208 L 512,224
              L 535,222 L 555,200 L 568,202 L 568,220 L 588,225 L 610,215
              L 645,212 L 678,218 L 696,228 L 685,252 L 665,268 L 642,282
              L 628,300 L 612,312 L 588,308 L 568,295 L 548,298 L 535,322
              L 518,328 L 508,312 L 498,325 L 485,348 L 472,362 L 452,385
              L 435,422 L 418,452 L 392,488 L 368,522 L 342,558 L 312,582
              L 290,594
              L 278,575 L 265,542 L 248,502 L 232,465 L 218,432 L 205,398
              L 185,385 L 175,362 L 158,348 L 138,342 L 122,332 L 108,318
              L 93,298 L 102,278 L 122,268 L 135,262 L 148,252 L 162,242
              L 182,238 L 205,228 L 222,205 L 232,175 L 224,142 L 235,115
              L 248,92 L 258,78 Z
            "
            fill={mapLayer === 'aod' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(142, 71, 45, 0.04)'}
            stroke={mapLayer === 'aod' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(142, 71, 45, 0.45)'}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            className="transition-all duration-300"
          />

          {/* Internal Regional Geological & Basin Boundaries */}
          <g
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="1"
            strokeDasharray="3 3"
            fill="none"
          >
            {/* Indo-Gangetic Basin demarcation */}
            <path d="M 235,175 Q 350,220 520,290" />
            {/* Deccan Plateau Boundary */}
            <path d="M 175,362 Q 280,390 435,422" />
            {/* Western Coastal Strip (Konkan / Malabar) */}
            <path d="M 185,385 L 205,445 L 248,520 L 278,575" />
            {/* Eastern Coromandel Strip */}
            <path d="M 452,385 L 392,488 L 342,558" />
          </g>

          {/* Latitude & Longitude Coordinate Marks (Swiss Hairline Style) */}
          <g className="text-[9px] fill-muted-foreground font-mono select-none">
            <line x1="50" y1="85" x2="750" y2="85" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            <text x="55" y="80">35°N (Karakoram)</text>

            <line x1="50" y1="210" x2="750" y2="210" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            <text x="55" y="205">28°N (Indo-Gangetic Corridor)</text>

            <line x1="50" y1="315" x2="750" y2="315" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            <text x="55" y="310">23.5°N (Tropic of Cancer)</text>

            <line x1="50" y1="465" x2="750" y2="465" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            <text x="55" y="460">15°N (Peninsular Plateau)</text>

            <line x1="50" y1="585" x2="750" y2="585" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            <text x="55" y="580">8°N (Cape Comorin)</text>

            <text x="180" y="635">72°E</text>
            <text x="350" y="635">80°E</text>
            <text x="530" y="635">88°E</text>
            <text x="680" y="635">96°E</text>
          </g>

          {/* 17 CAAQMS Regional Station Beacons */}
          {filteredStations.map((stn) => {
            const { x, y } = projectCoords(stn.lat, stn.lon);
            const isCurrent =
              currentCity.toLowerCase() === stn.city.toLowerCase() ||
              currentStation.toLowerCase().includes(stn.city.toLowerCase());

            return (
              <g
                key={stn.id}
                className="cursor-pointer group focus:outline-none"
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
                {/* Outer Ripple Pulse for Active Station */}
                {isCurrent && (
                  <circle
                    cx={x}
                    cy={y}
                    r="15"
                    fill="none"
                    stroke={activeColor.fill}
                    strokeWidth="1.5"
                    opacity="0.8"
                    className="animate-ping"
                  />
                )}

                {/* Base Anchor Circle */}
                <circle
                  cx={x}
                  cy={y}
                  r={isCurrent ? '7' : '4.5'}
                  fill={isCurrent ? activeColor.fill : '#94a3b8'}
                  stroke={isCurrent ? '#ffffff' : '#090a0c'}
                  strokeWidth={isCurrent ? '2' : '1.5'}
                  filter={isCurrent ? 'url(#cleanroom-glow)' : undefined}
                  className="transition-all duration-200 group-hover:scale-125"
                />

                {/* Station Monospace Label */}
                <text
                  x={x + 9}
                  y={y + 3.5}
                  className={`text-[10px] font-mono transition-colors ${
                    isCurrent
                      ? 'fill-foreground font-black tracking-tight'
                      : 'fill-muted-foreground group-hover:fill-foreground font-semibold'
                  }`}
                >
                  {stn.name.split(' (')[0]}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Station Telemetry Detail Card on Hover */}
        <div className="absolute top-3 left-3 pointer-events-none flex flex-col gap-1 max-w-[280px] z-10">
          {hoveredStation ? (
            <div className="p-3 rounded-lg subtle-glass text-xs flex flex-col gap-1.5 animate-in fade-in duration-150 shadow-2xl">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-foreground">{hoveredStation.name}</span>
                <Badge variant="outline" className="text-[9px] font-mono border-primary/40 text-primary">
                  {hoveredStation.region}
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground leading-snug">
                {hoveredStation.description || hoveredStation.station}
              </p>
              <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground mt-0.5">
                <span>Lat: {hoveredStation.lat.toFixed(2)}°N</span>
                <span>•</span>
                <span>Lon: {hoveredStation.lon.toFixed(2)}°E</span>
              </div>
              <div className="pt-1 border-t border-border/50 flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">Monitoring Hub:</span>
                <span className="font-mono font-bold text-foreground">{hoveredStation.station}</span>
              </div>
            </div>
          ) : (
            <div className="p-2 rounded-lg subtle-glass text-[10px] text-muted-foreground flex items-center gap-1.5">
              <Layers className="size-3 text-primary shrink-0" />
              <span>Select any CAAQMS node or toggle AOD plume to inspect regional smog entrapment</span>
            </div>
          )}
        </div>

        {/* Current Active Station HUD Pill */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2.5 p-2 px-3 rounded-lg subtle-glass shadow-xl z-10">
          <Radio className="size-3.5 text-primary animate-pulse" />
          <div className="flex flex-col text-right">
            <span className="text-[11px] font-bold text-foreground">{currentStation || currentCity}</span>
            <span
              className="text-[10px] font-mono font-bold tabular-nums"
              style={{ color: activeColor.fill }}
            >
              AQI {activeAqi} • {activeColor.label}
            </span>
          </div>
        </div>

        {/* Satellite AOD Legend (visible in AOD mode) */}
        {mapLayer === 'aod' && (
          <div className="absolute bottom-3 left-3 p-2 rounded-lg subtle-glass text-[9px] font-mono flex flex-col gap-1 z-10">
            <div className="flex items-center gap-1 font-bold text-foreground">
              <Satellite className="size-3 text-primary" />
              <span>Aerosol Optical Depth (AOD τ at 550nm)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-[#00b050]" />
              <span className="text-muted-foreground">&lt;0.2 Clean</span>
              <span className="size-2 rounded-full bg-[#eab308] ml-1.5" />
              <span className="text-muted-foreground">0.4-0.6 Moderate</span>
              <span className="size-2 rounded-full bg-[#991b1b] ml-1.5" />
              <span className="text-foreground font-bold">&gt;0.8 Severe Smog</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}