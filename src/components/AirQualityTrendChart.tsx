import React, { useMemo, useState } from "react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Badge } from "@/components/ui/badge"
import { Activity, Clock, TrendingUp } from "lucide-react"

interface TelemetryPoint {
  time: string
  fullTime: string
  pm25: number
  pm10: number
  no2: number
  so2: number
  co: number
  o3: number
}

interface AirQualityTrendChartProps {
  csvData: string
  stationName: string
  city: string
  latestAqi?: number | null
}

const chartConfig: ChartConfig = {
  pm25: {
    label: "PM2.5 (Fine Particulate)",
    color: "hsl(var(--chart-1))",
  },
  pm10: {
    label: "PM10 (Coarse Particulate)",
    color: "hsl(var(--chart-2))",
  },
}

export function AirQualityTrendChart({
  csvData,
  stationName,
  city,
  latestAqi,
}: AirQualityTrendChartProps) {
  const [timeRange, setTimeRange] = useState<"24" | "48" | "72">("24")

  // Parse CSV data into typed time-series points
  const points: TelemetryPoint[] = useMemo(() => {
    if (!csvData) return []
    const lines = csvData.trim().split("\n")
    if (lines.length <= 1) return []

    const parsed: TelemetryPoint[] = []
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(",")
      if (parts.length >= 8) {
        const fullTime = parts[1] || ""
        const shortTime = fullTime.includes(" ")
          ? fullTime.split(" ")[1]?.slice(0, 5) || fullTime
          : fullTime.slice(11, 16) || fullTime

        const p25 = parseFloat(parts[2]) || 0
        const p10 = parseFloat(parts[3]) || 0
        const no2 = parseFloat(parts[4]) || 0
        const so2 = parseFloat(parts[5]) || 0
        const co = parseFloat(parts[6]) || 0
        const o3 = parseFloat(parts[7]) || 0

        parsed.push({
          time: shortTime,
          fullTime,
          pm25: p25,
          pm10: p10,
          no2,
          so2,
          co,
          o3,
        })
      }
    }

    const rangeCount = timeRange === "24" ? 24 : timeRange === "48" ? 48 : 72
    return parsed.slice(-rangeCount)
  }, [csvData, timeRange])

  // Compute peak and average metrics
  const stats = useMemo(() => {
    if (points.length === 0) return { maxPM25: 0, avgPM25: 0, maxPM10: 0 }
    let max25 = 0
    let sum25 = 0
    let max10 = 0

    points.forEach((p) => {
      if (p.pm25 > max25) max25 = p.pm25
      if (p.pm10 > max10) max10 = p.pm10
      sum25 += p.pm25
    })

    return {
      maxPM25: Math.round(max25),
      avgPM25: Math.round(sum25 / points.length),
      maxPM10: Math.round(max10),
    }
  }, [points])

  return (
    <Card className="border-border bg-card text-card-foreground shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-3 border-b border-border/50">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-primary" />
            <CardTitle className="text-sm font-semibold tracking-wide">
              Diurnal Telemetry & CPCB Concentration Curves
            </CardTitle>
            {latestAqi != null && (
              <Badge variant="outline" className="text-[10px] font-mono border-primary/40 text-primary">
                Live AQI: {latestAqi}
              </Badge>
            )}
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            {stationName} • Criteria particulate trend and regulatory threshold boundaries
          </CardDescription>
        </div>

        {/* Time Horizon Selector */}
        <div className="flex items-center gap-2">
          <Clock className="size-3.5 text-muted-foreground" />
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(val) => {
              if (val) setTimeRange(val as "24" | "48" | "72")
            }}
            variant="outline"
            size="sm"
            className="bg-background/50 border border-border/60 rounded-md p-0.5"
          >
            <ToggleGroupItem value="24" className="px-2.5 py-1 text-xs">
              24h
            </ToggleGroupItem>
            <ToggleGroupItem value="48" className="px-2.5 py-1 text-xs">
              48h
            </ToggleGroupItem>
            <ToggleGroupItem value="72" className="px-2.5 py-1 text-xs">
              72h
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>

      <CardContent className="pt-4 flex flex-col gap-3">
        {/* KPI Strip */}
        <div className="grid grid-cols-3 gap-2 py-1">
          <div className="rounded-md border border-border/40 bg-muted/20 p-2 flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Peak PM2.5
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold font-mono text-foreground">{stats.maxPM25}</span>
              <span className="text-[10px] text-muted-foreground">µg/m³</span>
            </div>
          </div>

          <div className="rounded-md border border-border/40 bg-muted/20 p-2 flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Window Avg PM2.5
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold font-mono text-foreground">{stats.avgPM25}</span>
              <span className="text-[10px] text-muted-foreground">µg/m³</span>
            </div>
          </div>

          <div className="rounded-md border border-border/40 bg-muted/20 p-2 flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Peak PM10
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold font-mono text-foreground">{stats.maxPM10}</span>
              <span className="text-[10px] text-muted-foreground">µg/m³</span>
            </div>
          </div>
        </div>

        {/* Chart View */}
        {points.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-xs text-muted-foreground border border-dashed border-border rounded-md">
            No hourly telemetry series available for {city}
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-64 w-full">
            <AreaChart data={points} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="fillPm25" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="fillPm10" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval="preserveStartEnd"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                domain={[0, "auto"]}
              />

              {/* CPCB Regulatory Threshold Reference Lines */}
              <ReferenceLine
                y={60}
                stroke="hsl(var(--chart-2))"
                strokeDasharray="4 4"
                label={{
                  value: "CPCB 24h Standard (60 µg/m³)",
                  position: "insideTopRight",
                  fill: "hsl(var(--muted-foreground))",
                  fontSize: 9,
                }}
              />
              <ReferenceLine
                y={120}
                stroke="hsl(var(--chart-3))"
                strokeDasharray="3 3"
                label={{
                  value: "GRAP I Threshold (120 µg/m³)",
                  position: "insideTopRight",
                  fill: "hsl(var(--destructive))",
                  fontSize: 9,
                }}
              />

              <ChartTooltip
                cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    labelFormatter={(_, payload) => {
                      if (payload && payload[0]?.payload) {
                        return payload[0].payload.fullTime
                      }
                      return ""
                    }}
                  />
                }
              />
              <Area
                dataKey="pm10"
                type="natural"
                fill="url(#fillPm10)"
                stroke="hsl(var(--chart-2))"
                strokeWidth={1.5}
                stackId="b"
              />
              <Area
                dataKey="pm25"
                type="natural"
                fill="url(#fillPm25)"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                stackId="a"
              />
              <ChartLegend content={(props: any) => <ChartLegendContent {...props} />} />
            </AreaChart>
          </ChartContainer>
        )}

        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="size-3 text-primary" />
            <span>Diurnal peak occurs during nocturnal temperature inversion (22:00 - 06:00 IST)</span>
          </div>
          <span className="font-mono text-[10px]">Source: CPCB & Open-Meteo Grid</span>
        </div>
      </CardContent>
    </Card>
  )
}
