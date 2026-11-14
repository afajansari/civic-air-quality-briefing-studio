'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { CivicBrief } from '@/types';
import { BarChart3, TrendingUp } from 'lucide-react';

interface AirQualityChartsProps {
  brief: CivicBrief;
}

export const AirQualityCharts: React.FC<AirQualityChartsProps> = ({ brief }) => {
  const trendCanvasRef = useRef<HTMLCanvasElement>(null);
  const barCanvasRef = useRef<HTMLCanvasElement>(null);

  const drawTrendChart = useCallback(() => {
    const canvas = trendCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    const records = (brief.stations[0]?.records || []).slice(0, 30);
    if (records.length === 0) return;

    const padding = { top: 30, right: 20, bottom: 40, left: 45 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    const aqiVals = records.map(r => r.aqi);
    const maxVal = Math.max(...aqiVals, 100) * 1.15;

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 0.5;
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#64748b';

    const steps = 4;
    for (let i = 0; i <= steps; i++) {
      const yVal = Math.round((maxVal / steps) * i);
      const y = padding.top + chartH - (i / steps) * chartH;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();

      ctx.fillText(String(yVal), 10, y + 3);
    }

    ctx.beginPath();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;

    records.forEach((r, idx) => {
      const x = padding.left + (idx / (records.length - 1 || 1)) * chartW;
      const y = padding.top + chartH - (r.aqi / maxVal) * chartH;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    records.forEach((r, idx) => {
      const x = padding.left + (idx / (records.length - 1 || 1)) * chartW;
      const y = padding.top + chartH - (r.aqi / maxVal) * chartH;
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = r.aqi > 250 ? '#ef4444' : (r.aqi > 150 ? '#f97316' : '#10b981');
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    const interval = Math.ceil(records.length / 5);
    records.forEach((r, idx) => {
      if (idx % interval === 0 || idx === records.length - 1) {
        const x = padding.left + (idx / (records.length - 1 || 1)) * chartW;
        const timeShort = r.timestamp.split(' ').pop() || r.timestamp;
        ctx.fillText(timeShort, x, h - 15);
      }
    });
  }, [brief]);

  const drawBarChart = useCallback(() => {
    const canvas = barCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    const stations = (brief.stations || []).slice(0, 6);
    if (stations.length === 0) return;

    const padding = { top: 20, right: 20, bottom: 40, left: 110 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    const maxAQI = Math.max(...stations.map(s => s.averageAQI), 100) * 1.15;
    const barHeight = Math.min(24, (chartH / stations.length) * 0.65);
    const gap = chartH / stations.length;

    stations.forEach((st, idx) => {
      const y = padding.top + idx * gap + (gap - barHeight) / 2;
      const barW = (st.averageAQI / maxAQI) * chartW;

      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#e2e8f0';
      ctx.textAlign = 'right';
      const truncatedName = st.station.length > 14 ? st.station.slice(0, 13) + '…' : st.station;
      ctx.fillText(truncatedName, padding.left - 10, y + barHeight / 2 + 4);

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(padding.left, y, chartW, barHeight);

      const barColor = st.averageAQI > 300 ? '#701a75' : (st.averageAQI > 200 ? '#ef4444' : (st.averageAQI > 100 ? '#f97316' : '#10b981'));
      ctx.fillStyle = barColor;
      ctx.fillRect(padding.left, y, barW, barHeight);

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(`${st.averageAQI} (${st.category})`, padding.left + barW + 8, y + barHeight / 2 + 3.5);
    });
  }, [brief]);

  useEffect(() => {
    drawTrendChart();
    drawBarChart();

    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        drawTrendChart();
        drawBarChart();
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [drawTrendChart, drawBarChart]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Chart 1: Time Series Trend */}
      <section aria-labelledby="chart-trend-heading" className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            <h3 id="chart-trend-heading" className="text-xs font-bold text-white uppercase tracking-wider">
              Chronological AQI Progression
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">
            Primary Station Telemetry
          </span>
        </div>
        <div className="h-56 w-full">
          <canvas
            ref={trendCanvasRef}
            role="img"
            aria-label={`Time series trend chart showing AQI values across readings peaking at ${brief.summary.peakAQI} AQI`}
            className="w-full h-full block"
          >
            <p className="sr-only">
              Time series chart showing chronological AQI values. Average AQI is {brief.summary.averageAQI}, peaking at {brief.summary.peakAQI} at {brief.summary.peakTimestamp}.
            </p>
          </canvas>
        </div>
        <div className="flex items-center justify-center gap-4 text-[10px] text-slate-400 pt-2 border-t border-slate-800" aria-hidden="true">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Good/Mod (&lt;150)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> Poor (151-250)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Very Poor / Severe (&gt;250)
          </span>
        </div>
      </section>

      {/* Chart 2: Station Hotspot Ranking */}
      <section aria-labelledby="chart-hotspots-heading" className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" aria-hidden="true" />
            <h3 id="chart-hotspots-heading" className="text-xs font-bold text-white uppercase tracking-wider">
              Hotspot Severity Comparison
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">
            Ranked by Average AQI
          </span>
        </div>
        <div className="h-56 w-full">
          <canvas
            ref={barCanvasRef}
            role="img"
            aria-label={`Hotspot severity bar chart ranking stations by average AQI`}
            className="w-full h-full block"
          >
            <p className="sr-only">
              Bar chart ranking monitored stations by severity: {brief.stations.map(s => `${s.station}: ${s.averageAQI} AQI`).join(', ')}.
            </p>
          </canvas>
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800">
          <span>Priority interventions target top ranked zones</span>
          <span className="text-cyan-400 font-semibold">{brief.stations.length} total monitored sites</span>
        </div>
      </section>
    </div>
  );
};
