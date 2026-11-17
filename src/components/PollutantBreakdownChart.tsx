import React, { useMemo } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, ShieldCheck, AlertCircle } from "lucide-react"

interface PollutantBreakdownChartProps {
  currentTelemetry: {
    pm25?: number | null
    pm10?: number | null
    no2?: number | null
    so2?: number | null
    co?: number | null
    o3?: number | null
  }
}

// CPCB 24-hour National Ambient Air Quality Standards (NAAQS)
const CPCB_LIMITS = {
  pm25: 60,   // µg/m³
  pm10: 100,  // µg/m³
  no2: 80,    // µg/m³
  so2: 80,    // µg/m³
  co: 2.0,    // mg/m³
  o3: 100,    // µg/m³ (8-hour)
}

const breakdownConfig: ChartConfig = {
  value: {
    label: "Observed Concentration",
    color: "hsl(var(--primary))",
  },
  pctOfStandard: {
    label: "% of CPCB Standard",
    color: "hsl(var(--chart-3))",
  },
}

export function PollutantBreakdownChart({ currentTelemetry }: PollutantBreakdownChartProps) {
  const chartData = useMemo(() => {
    const raw = [
      {
        pollutant: "PM2.5",
        name: "Fine Particulate",
        value: currentTelemetry.pm25 ?? 0,
        unit: "µg/m³",
        limit: CPCB_LIMITS.pm25,
        color: "hsl(var(--chart-1))",
      },
      {
        pollutant: "PM10",
        name: "Coarse Dust",
        value: currentTelemetry.pm10 ?? 0,
        unit: "µg/m³",
        limit: CPCB_LIMITS.pm10,
        color: "hsl(var(--chart-2))",
      },
      {
        pollutant: "NO2",
        name: "Nitrogen Dioxide",
        value: currentTelemetry.no2 ?? 0,
        unit: "µg/m³",
        limit: CPCB_LIMITS.no2,
        color: "hsl(var(--chart-3))",
      },
      {
        pollutant: "SO2",
        name: "Sulphur Dioxide",
        value: currentTelemetry.so2 ?? 0,
        unit: "µg/m³",
        limit: CPCB_LIMITS.so2,
        color: "hsl(var(--chart-4))",
      },
      {
        pollutant: "CO",
        name: "Carbon Monoxide",
        value: currentTelemetry.co ?? 0,
        unit: "mg/m³",
        limit: CPCB_LIMITS.co,
        color: "hsl(var(--chart-5))",
      },
      {
        pollutant: "O3",
        name: "Tropospheric Ozone",
        value: currentTelemetry.o3 ?? 0,
        unit: "µg/m³",
        limit: CPCB_LIMITS.o3,
        color: "hsl(var(--chart-1))",
      },
    ]

    return raw.map((item) => {
      const pct = item.limit > 0 ? Math.round((item.value / item.limit) * 100) : 0
      const isExceeded = pct > 100
      return {
        ...item,
        pct,
        isExceeded,
      }
    })
  }, [currentTelemetry])

  const exceededCount = chartData.filter((d) => d.isExceeded).length

  return (
    <Card className="border-border bg-card text-card-foreground shadow-sm overflow-hidden">
      <CardHeader className="flex flex-col gap-2 pb-2.5 border-b border-border/50">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <BarChart3 className="size-4 text-primary shrink-0" />
            <CardTitle className="text-sm font-semibold tracking-wide truncate">
              CPCB NAAQS Criteria Standard Compliance
            </CardTitle>
          </div>

          <div className="shrink-0">
            {exceededCount > 0 ? (
              <Badge variant="destructive" className="text-xs gap-1">
                <AlertCircle className="size-3" />
                {exceededCount} Exceeded
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs gap-1 border-primary/30 text-primary">
                <ShieldCheck className="size-3" />
                All Criteria Compliant
              </Badge>
            )}
          </div>
        </div>

        <CardDescription className="text-xs text-muted-foreground truncate">
          Current concentration relative to Indian statutory 24-hr safe limits (100% = Standard)
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-3 flex flex-col gap-3">
        <ChartContainer config={breakdownConfig} className="h-52 w-full min-w-0">
          <BarChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="pollutant"
              tickLine={false}
              axisLine={false}
              tickMargin={6}
              tick={{ fontSize: 10 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={6}
              unit="%"
              domain={[0, "dataMax + 20"]}
              width={35}
              tick={{ fontSize: 10 }}
            />
            {/* 100% Statutory Baseline */}
            <ReferenceLine
              y={100}
              stroke="hsl(var(--destructive))"
              strokeDasharray="4 4"
              label={{
                value: "100% Limit",
                position: "insideTopLeft",
                fill: "hsl(var(--destructive))",
                fontSize: 9,
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  indicator="dot"
                  formatter={(value, _name, item) => (
                    <div className="flex items-center justify-between w-full gap-3">
                      <span className="text-muted-foreground">{item.payload.name}:</span>
                      <span className="font-mono font-bold">
                        {item.payload.value} {item.payload.unit} ({value}%)
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.pct > 100 ? "hsl(var(--destructive))" : entry.color}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
