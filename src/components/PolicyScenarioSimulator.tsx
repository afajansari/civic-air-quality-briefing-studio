import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sliders,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Car,
  Hammer,
  Factory,
  Droplets,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { playStatusChime } from '@/lib/audio-alerts';

interface PolicyScenarioSimulatorProps {
  baseAqi: number;
  basePm25: number;
  cityName: string;
  onSimulationChange: (reductionPct: number) => void;
  isFloating?: boolean;
  className?: string;
}

export function PolicyScenarioSimulator({
  baseAqi,
  basePm25,
  cityName,
  onSimulationChange,
  isFloating = false,
  className = '',
}: PolicyScenarioSimulatorProps) {
  const [trafficCut, setTrafficCut] = useState(0); // 0 to 50%
  const [constructionHalt, setConstructionHalt] = useState(0); // 0 to 100%
  const [industryScrubbing, setIndustryScrubbing] = useState(0); // 0 to 60%
  const [dustSuppression, setDustSuppression] = useState(0); // 0 to 100%
  const [isDocked, setIsDocked] = useState(false);

  // Source apportionment weights based on Indian urban CPCB air quality studies:
  // Transport: ~30%, Construction: ~20%, Industry: ~25%, Dust: ~15%
  const simulationResults = useMemo(() => {
    const trafficWeight = 0.32;
    const constWeight = 0.18;
    const indWeight = 0.25;
    const dustWeight = 0.15;

    const trafficReduction = (trafficCut / 100) * trafficWeight;
    const constReduction = (constructionHalt / 100) * constWeight;
    const indReduction = (industryScrubbing / 100) * indWeight;
    const dustReduction = (dustSuppression / 100) * dustWeight;

    const totalReductionFactor = trafficReduction + constReduction + indReduction + dustReduction;
    const reductionPct = Math.round(totalReductionFactor * 100);

    const projectedAqi = Math.max(25, Math.round(baseAqi * (1 - totalReductionFactor)));
    const aqiDelta = baseAqi - projectedAqi;

    const projectedPm25 = Math.max(10, Math.round(basePm25 * (1 - totalReductionFactor)));

    // Projected GRAP stage
    let projectedStage = 'Standard Vigilance';
    let projectedStageColor = 'text-emerald-400 border-emerald-500/30';
    if (projectedAqi > 450) {
      projectedStage = 'GRAP IV (Severe+)';
      projectedStageColor = 'text-purple-400 border-purple-500/30';
    } else if (projectedAqi > 400) {
      projectedStage = 'GRAP III (Severe)';
      projectedStageColor = 'text-rose-400 border-rose-500/30';
    } else if (projectedAqi > 300) {
      projectedStage = 'GRAP II (Very Poor)';
      projectedStageColor = 'text-orange-400 border-orange-500/30';
    } else if (projectedAqi > 200) {
      projectedStage = 'GRAP I (Poor)';
      projectedStageColor = 'text-amber-400 border-amber-500/30';
    }

    return {
      reductionPct,
      projectedAqi,
      aqiDelta,
      projectedPm25,
      projectedStage,
      projectedStageColor,
    };
  }, [trafficCut, constructionHalt, industryScrubbing, dustSuppression, baseAqi, basePm25]);

  const handleUpdate = (type: string, val: number) => {
    let nextTraffic = trafficCut;
    let nextConst = constructionHalt;
    let nextInd = industryScrubbing;
    let nextDust = dustSuppression;

    if (type === 'traffic') nextTraffic = val;
    if (type === 'const') nextConst = val;
    if (type === 'ind') nextInd = val;
    if (type === 'dust') nextDust = val;

    const totalFactor =
      (nextTraffic / 100) * 0.32 +
      (nextConst / 100) * 0.18 +
      (nextInd / 100) * 0.25 +
      (nextDust / 100) * 0.15;

    const totalPct = Math.round(totalFactor * 100);
    onSimulationChange(totalPct);
    playStatusChime(600 + totalPct * 10, 0.08);
  };

  const handleReset = () => {
    setTrafficCut(0);
    setConstructionHalt(0);
    setIndustryScrubbing(0);
    setDustSuppression(0);
    onSimulationChange(0);
    playStatusChime(440, 0.1);
  };

  const handleApplyPresetGrap3 = () => {
    setTrafficCut(40);
    setConstructionHalt(100);
    setIndustryScrubbing(30);
    setDustSuppression(80);
    const factor = (40 / 100) * 0.32 + 1.0 * 0.18 + (30 / 100) * 0.25 + (80 / 100) * 0.15;
    const totalPct = Math.round(factor * 100);
    onSimulationChange(totalPct);
    playStatusChime(750, 0.15);
  };

  const handleApplyPresetGrap4 = () => {
    setTrafficCut(50);
    setConstructionHalt(100);
    setIndustryScrubbing(60);
    setDustSuppression(100);
    const factor = (50 / 100) * 0.32 + 1.0 * 0.18 + (60 / 100) * 0.25 + (100 / 100) * 0.15;
    const totalPct = Math.round(factor * 100);
    onSimulationChange(totalPct);
    playStatusChime(880, 0.2);
  };

  const handleApplyPresetCleanCommute = () => {
    setTrafficCut(40);
    setConstructionHalt(20);
    setIndustryScrubbing(10);
    setDustSuppression(50);
    const factor = (40 / 100) * 0.32 + (20 / 100) * 0.18 + (10 / 100) * 0.25 + (50 / 100) * 0.15;
    const totalPct = Math.round(factor * 100);
    onSimulationChange(totalPct);
    playStatusChime(660, 0.15);
  };

  if (isFloating && isDocked) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsDocked(false)}
        className="h-8 px-3 rounded-full bg-slate-900/90 backdrop-blur-md border border-primary/50 shadow-xl text-xs gap-1.5 font-bold animate-in fade-in"
        aria-label="Expand policy scenario simulator"
      >
        <Sliders className="size-3.5 text-primary" />
        <span className="text-white">Policy Sandbox</span>
        {simulationResults.reductionPct > 0 && (
          <Badge variant="secondary" className="px-1.5 py-0 text-[10px] bg-primary/20 text-primary">
            -{simulationResults.reductionPct}%
          </Badge>
        )}
        <ChevronDown className="size-3 text-slate-400 ml-0.5" />
      </Button>
    );
  }

  return (
    <Card className={`border-border bg-card text-card-foreground shadow-sm ${className}`}>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-border/50 gap-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Sliders className="size-4 text-primary" />
            <CardTitle className="text-sm font-semibold tracking-wide">
              CPCB &quot;What-If&quot; Statutory Policy Simulator
            </CardTitle>
            <Badge variant="outline" className="text-[10px] font-mono border-primary/40 text-primary">
              Interactive Sandbox
            </Badge>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Simulate the atmospheric impact of source emission curbs across {cityName}
          </CardDescription>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleApplyPresetGrap4}
            className="h-7 px-2 text-xs gap-1 border-purple-500/40 text-purple-400 hover:bg-purple-500/10"
            title="Apply Stage IV Emergency curbs"
          >
            <ShieldAlert className="size-3" />
            <span className="hidden sm:inline">GRAP IV</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleApplyPresetGrap3}
            className="h-7 px-2 text-xs gap-1 border-primary/40 text-primary hover:bg-primary/10"
            title="Apply Stage III curbs"
          >
            <ShieldAlert className="size-3" />
            <span className="hidden sm:inline">GRAP III</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="size-3" />
            <span>Reset</span>
          </Button>

          {isFloating && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsDocked(true)}
              className="h-7 px-1.5 text-slate-400 hover:text-white"
              title="Dock simulator to pill"
              aria-label="Minimize policy simulator"
            >
              <ChevronUp className="size-3" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-4 flex flex-col gap-4">
        {/* Real-time Projected KPI Delta Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="rounded-lg border border-border/50 bg-muted/20 p-2.5 flex flex-col gap-0.5">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              Projected AQI
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-mono font-black text-foreground">
                {simulationResults.projectedAqi}
              </span>
              {simulationResults.aqiDelta > 0 && (
                <span className="text-xs font-mono font-bold text-emerald-400">
                  (-{simulationResults.aqiDelta})
                </span>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border/50 bg-muted/20 p-2.5 flex flex-col gap-0.5">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              Projected PM2.5
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-mono font-black text-foreground">
                {simulationResults.projectedPm25}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">µg/m³</span>
            </div>
          </div>

          <div className="rounded-lg border border-border/50 bg-muted/20 p-2.5 flex flex-col gap-0.5">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              Emissions Averted
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-mono font-black text-primary">
                -{simulationResults.reductionPct}%
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-border/50 bg-muted/20 p-2.5 flex flex-col gap-0.5">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              Statutory Classification
            </span>
            <div className="flex items-baseline gap-1">
              <span className={`text-xs font-mono font-bold ${simulationResults.projectedStageColor}`}>
                {simulationResults.projectedStage}
              </span>
            </div>
          </div>
        </div>

        {/* 4 Interactive Policy Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* 1. Vehicular Traffic */}
          <div className="flex flex-col gap-1.5 p-3 rounded-lg border border-border/40 bg-muted/10">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-foreground">
                <Car className="size-3.5 text-sky-400" />
                Vehicular Curb (Odd-Even / BS-III Ban)
              </span>
              <span className="font-mono font-bold text-primary">{trafficCut}% Cut</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="5"
              value={trafficCut}
              onChange={(e) => {
                const val = Number(e.target.value);
                setTrafficCut(val);
                handleUpdate('traffic', val);
              }}
              className="w-full accent-primary h-1.5 bg-muted rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-muted-foreground">
              Restricts non-essential diesel LMVs and heavy commercial freight
            </span>
          </div>

          {/* 2. Construction & Demolition */}
          <div className="flex flex-col gap-1.5 p-3 rounded-lg border border-border/40 bg-muted/10">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-foreground">
                <Hammer className="size-3.5 text-amber-400" />
                C&D Dust Moratorium
              </span>
              <span className="font-mono font-bold text-primary">{constructionHalt}% Halt</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={constructionHalt}
              onChange={(e) => {
                const val = Number(e.target.value);
                setConstructionHalt(val);
                handleUpdate('const', val);
              }}
              className="w-full accent-primary h-1.5 bg-muted rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-muted-foreground">
              Mandatory stoppage on excavation, earthmoving, and building demolition
            </span>
          </div>

          {/* 3. Industrial Scrubbing */}
          <div className="flex flex-col gap-1.5 p-3 rounded-lg border border-border/40 bg-muted/10">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-foreground">
                <Factory className="size-3.5 text-orange-400" />
                Industrial Fuel Transition (PNG/Gas)
              </span>
              <span className="font-mono font-bold text-primary">{industryScrubbing}% Transition</span>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              step="5"
              value={industryScrubbing}
              onChange={(e) => {
                const val = Number(e.target.value);
                setIndustryScrubbing(val);
                handleUpdate('ind', val);
              }}
              className="w-full accent-primary h-1.5 bg-muted rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-muted-foreground">
              Shifts thermal/brick kilns and non-compliant factories to approved clean fuels
            </span>
          </div>

          {/* 4. Mechanized Road Sweeping */}
          <div className="flex flex-col gap-1.5 p-3 rounded-lg border border-border/40 bg-muted/10">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-foreground">
                <Droplets className="size-3.5 text-emerald-400" />
                Mechanized Sweeping & Anti-Smog Guns
              </span>
              <span className="font-mono font-bold text-primary">{dustSuppression}% Intensity</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={dustSuppression}
              onChange={(e) => {
                const val = Number(e.target.value);
                setDustSuppression(val);
                handleUpdate('dust', val);
              }}
              className="w-full accent-primary h-1.5 bg-muted rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-muted-foreground">
              Daily vacuum sweeping and water mist suppression across high-density road corridors
            </span>
          </div>
        </div>

        {/* Dynamic Action Directive Summary */}
        <div className="p-2.5 rounded-lg border border-primary/20 bg-primary/5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary shrink-0" />
            <span className="text-foreground">
              {simulationResults.reductionPct > 0
                ? `Simulated intervention clears ~${simulationResults.reductionPct}% of atmospheric particulates, averting ${simulationResults.aqiDelta} AQI index points.`
                : 'Adjust policy levers to preview immediate air basin clearance in the 3D Atmospheric Chamber.'}
            </span>
          </div>
          <span className="font-mono font-bold text-primary shrink-0">
            {simulationResults.reductionPct > 0 ? 'Simulation Active' : 'Baseline State'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
