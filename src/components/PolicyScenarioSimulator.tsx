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
  X,
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
  const [isDocked, setIsDocked] = useState(isFloating); // Default docked when floating to keep hero clean

  // Source apportionment weights based on Indian urban CPCB air quality studies:
  // Transport: ~32%, Construction: ~18%, Industry: ~25%, Road Dust: ~15%
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

    // Statutory GRAP Stage
    let projectedStage = 'Standard';
    let projectedStageColor = 'text-primary border-primary/30';
    if (projectedAqi > 450) {
      projectedStage = 'GRAP IV (Severe+)';
      projectedStageColor = 'text-[#991b1b] border-[#991b1b]/30';
    } else if (projectedAqi > 400) {
      projectedStage = 'GRAP III (Severe)';
      projectedStageColor = 'text-[#dc2626] border-[#dc2626]/30';
    } else if (projectedAqi > 300) {
      projectedStage = 'GRAP II (Very Poor)';
      projectedStageColor = 'text-[#ea580c] border-[#ea580c]/30';
    } else if (projectedAqi > 200) {
      projectedStage = 'GRAP I (Poor)';
      projectedStageColor = 'text-[#eab308] border-[#eab308]/30';
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

  if (isFloating && isDocked) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsDocked(false)}
        className="h-8 px-3 rounded-full subtle-glass shadow-xl text-xs gap-1.5 font-bold animate-in fade-in cursor-pointer hover:border-primary/60"
        aria-label="Open CPCB Policy Simulator sandbox"
      >
        <Sliders className="size-3.5 text-primary" />
        <span className="text-foreground">Policy Sandbox</span>
        {simulationResults.reductionPct > 0 ? (
          <Badge variant="secondary" className="px-1.5 py-0 text-[10px] bg-primary/20 text-primary border border-primary/30">
            -{simulationResults.reductionPct}% Active
          </Badge>
        ) : (
          <span className="text-[10px] text-muted-foreground font-normal">What-If</span>
        )}
        <ChevronDown className="size-3 text-muted-foreground ml-0.5" />
      </Button>
    );
  }

  return (
    <Card className={`border-border bg-card text-card-foreground shadow-2xl rounded-xl overflow-hidden ${className}`}>
      <CardHeader className="flex flex-col gap-2 p-3 sm:p-4 border-b border-border/60 bg-[#090a0c]/60">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Sliders className="size-4 text-primary shrink-0" />
            <CardTitle className="text-xs sm:text-sm font-bold tracking-wide truncate">
              CPCB &quot;What-If&quot; Statutory Policy Simulator
            </CardTitle>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Badge variant="outline" className="text-[9px] font-mono border-primary/40 text-primary">
              Interactive
            </Badge>
            {isFloating && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsDocked(true)}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                title="Minimize simulator"
                aria-label="Minimize policy simulator"
              >
                <X className="size-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Action Preset Buttons Strip */}
        <div className="flex items-center justify-between gap-1.5 flex-wrap pt-0.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleApplyPresetGrap4}
              className="h-6 px-2 text-[10px] gap-1 border-destructive/40 text-destructive hover:bg-destructive/10"
              title="Apply Stage IV Emergency curbs"
            >
              <ShieldAlert className="size-2.5" />
              <span>GRAP IV</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleApplyPresetGrap3}
              className="h-6 px-2 text-[10px] gap-1 border-primary/40 text-primary hover:bg-primary/10"
              title="Apply Stage III curbs"
            >
              <ShieldAlert className="size-2.5" />
              <span>GRAP III</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-6 px-2 text-[10px] gap-1 text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="size-2.5" />
              <span>Reset</span>
            </Button>
          </div>

          <span className="text-[10px] text-muted-foreground truncate hidden sm:inline">
            {cityName} urban airshed
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-4 flex flex-col gap-3">
        {/* Real-time Projected KPI Delta Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          <div className="rounded-lg border border-border/50 bg-muted/20 p-2 flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider truncate">
              Projected AQI
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-base sm:text-lg font-mono font-black text-foreground tabular-nums">
                {simulationResults.projectedAqi}
              </span>
              {simulationResults.aqiDelta > 0 && (
                <span className="text-[10px] font-mono font-bold text-primary">
                  (-{simulationResults.aqiDelta})
                </span>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border/50 bg-muted/20 p-2 flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider truncate">
              Projected PM2.5
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-base sm:text-lg font-mono font-black text-foreground tabular-nums">
                {simulationResults.projectedPm25}
              </span>
              <span className="text-[9px] text-muted-foreground font-mono">µg</span>
            </div>
          </div>

          <div className="rounded-lg border border-border/50 bg-muted/20 p-2 flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider truncate">
              Emissions Cut
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-base sm:text-lg font-mono font-black text-primary tabular-nums">
                -{simulationResults.reductionPct}%
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-border/50 bg-muted/20 p-2 flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider truncate">
              Statutory Stage
            </span>
            <div className="flex items-baseline gap-1">
              <span className={`text-[10px] font-mono font-bold truncate ${simulationResults.projectedStageColor}`}>
                {simulationResults.projectedStage}
              </span>
            </div>
          </div>
        </div>

        {/* 4 Policy Sliders with proper layout */}
        <div className={`grid gap-2.5 ${isFloating ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
          {/* 1. Vehicular Traffic */}
          <div className="flex flex-col gap-1 p-2 rounded-lg border border-border/40 bg-muted/10">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-foreground truncate">
                <Car className="size-3 text-sky-400 shrink-0" />
                <span className="truncate">Vehicular Curb (Odd-Even)</span>
              </span>
              <span className="font-mono text-[11px] font-bold text-primary shrink-0 tabular-nums">
                {trafficCut}%
              </span>
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
              className="w-full accent-primary h-1 bg-muted rounded-lg cursor-pointer"
            />
          </div>

          {/* 2. Construction & Demolition */}
          <div className="flex flex-col gap-1 p-2 rounded-lg border border-border/40 bg-muted/10">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-foreground truncate">
                <Hammer className="size-3 text-amber-400 shrink-0" />
                <span className="truncate">C&D Dust Moratorium</span>
              </span>
              <span className="font-mono text-[11px] font-bold text-primary shrink-0 tabular-nums">
                {constructionHalt}%
              </span>
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
              className="w-full accent-primary h-1 bg-muted rounded-lg cursor-pointer"
            />
          </div>

          {/* 3. Industrial Scrubbing */}
          <div className="flex flex-col gap-1 p-2 rounded-lg border border-border/40 bg-muted/10">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-foreground truncate">
                <Factory className="size-3 text-orange-400 shrink-0" />
                <span className="truncate">Industrial Gas Transition</span>
              </span>
              <span className="font-mono text-[11px] font-bold text-primary shrink-0 tabular-nums">
                {industryScrubbing}%
              </span>
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
              className="w-full accent-primary h-1 bg-muted rounded-lg cursor-pointer"
            />
          </div>

          {/* 4. Mechanized Road Sweeping */}
          <div className="flex flex-col gap-1 p-2 rounded-lg border border-border/40 bg-muted/10">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-foreground truncate">
                <Droplets className="size-3 text-emerald-400 shrink-0" />
                <span className="truncate">Anti-Smog Guns / Mist</span>
              </span>
              <span className="font-mono text-[11px] font-bold text-primary shrink-0 tabular-nums">
                {dustSuppression}%
              </span>
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
              className="w-full accent-primary h-1 bg-muted rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Dynamic Action Directive Summary */}
        <div className="p-2 rounded-lg border border-primary/20 bg-primary/5 flex items-center justify-between text-[11px] gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Sparkles className="size-3.5 text-primary shrink-0" />
            <span className="text-foreground truncate">
              {simulationResults.reductionPct > 0
                ? `Averts ${simulationResults.aqiDelta} AQI index points.`
                : 'Adjust levers to preview airshed clearance.'}
            </span>
          </div>
          <span className="font-mono font-bold text-primary shrink-0 text-[10px]">
            {simulationResults.reductionPct > 0 ? `-${simulationResults.reductionPct}% Emission` : 'Baseline'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
