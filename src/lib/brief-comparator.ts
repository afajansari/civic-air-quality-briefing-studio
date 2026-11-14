/**
 * Civic Air Quality Briefing Studio - Brief Comparator Engine
 * Compares current analysis brief with previous brief to highlight:
 * - AQI & pollutant deltas
 * - Hotspot emergence, persistence, or improvement
 * - Sensor health / coverage changes
 * - Operational intervention progress
 */

import { BriefComparison, CivicBrief, StationDelta } from '../types';

export function compareBriefs(currentBrief: CivicBrief, previousBrief: CivicBrief | null): BriefComparison {
  if (!previousBrief || !previousBrief.summary) {
    return {
      hasPrevious: false,
      message: 'This is the baseline brief for this monitoring period. Future briefs will automatically track deltas against this one.'
    };
  }

  const currSum = currentBrief.summary;
  const prevSum = previousBrief.summary;

  const aqiDelta = (currSum.averageAQI || 0) - (prevSum.averageAQI || 0);
  const peakDelta = (currSum.peakAQI || 0) - (prevSum.peakAQI || 0);

  let aqiTrend: 'worsening' | 'improving' | 'stable' = 'stable';
  if (aqiDelta > 10) aqiTrend = 'worsening';
  else if (aqiDelta < -10) aqiTrend = 'improving';

  let peakTrend: 'worsening' | 'improving' | 'stable' = 'stable';
  if (peakDelta > 15) peakTrend = 'worsening';
  else if (peakDelta < -15) peakTrend = 'improving';

  const currHotspots = (currentBrief.stations || []).filter(s => s.isHotspot).map(s => s.station);
  const prevHotspots = (previousBrief.stations || []).filter(s => s.isHotspot).map(s => s.station);

  const newlyEmergedHotspots = currHotspots.filter(h => !prevHotspots.includes(h));
  const resolvedHotspots = prevHotspots.filter(h => !currHotspots.includes(h));
  const persistentHotspots = currHotspots.filter(h => prevHotspots.includes(h));

  const stationDeltas: StationDelta[] = [];
  (currentBrief.stations || []).forEach(currSt => {
    const prevSt = (previousBrief.stations || []).find(s => s.station === currSt.station);
    if (prevSt) {
      const stAqiDiff = currSt.averageAQI - prevSt.averageAQI;
      stationDeltas.push({
        station: currSt.station,
        currentAQI: currSt.averageAQI,
        previousAQI: prevSt.averageAQI,
        aqiDelta: stAqiDiff,
        status: stAqiDiff > 10 ? 'worsened' : (stAqiDiff < -10 ? 'improved' : 'stable'),
        currentCategory: currSt.category,
        previousCategory: prevSt.category
      });
    } else {
      stationDeltas.push({
        station: currSt.station,
        currentAQI: currSt.averageAQI,
        previousAQI: null,
        aqiDelta: null,
        status: 'new_sensor',
        currentCategory: currSt.category,
        previousCategory: 'Not Monitored'
      });
    }
  });

  const currGaps = (currentBrief.dataGaps || []).length;
  const prevGaps = (previousBrief.dataGaps || []).length;
  const currAnomalies = (currentBrief.anomalies || []).length;
  const prevAnomalies = (previousBrief.anomalies || []).length;
  const completenessDelta = (currentBrief.completenessPercent || 100) - (previousBrief.completenessPercent || 100);

  let changeSummaryText = '';
  if (aqiTrend === 'worsening') {
    changeSummaryText = `Air quality has deteriorated by +${aqiDelta} AQI points (from ${prevSum.averageAQI} [${prevSum.category}] to ${currSum.averageAQI} [${currSum.category}]). Peak spike shifted from ${prevSum.peakAQI} to ${currSum.peakAQI}. Immediate escalation of local mitigation measures is advised.`;
  } else if (aqiTrend === 'improving') {
    changeSummaryText = `Air quality shows noticeable improvement with an average reduction of ${Math.abs(aqiDelta)} AQI points (from ${prevSum.averageAQI} [${prevSum.category}] down to ${currSum.averageAQI} [${currSum.category}]). Continue active suppression measures to sustain clean air recovery.`;
  } else {
    changeSummaryText = `Air quality conditions remain largely steady around AQI ${currSum.averageAQI} (${currSum.category}) compared to previous AQI ${prevSum.averageAQI} (delta: ${aqiDelta > 0 ? '+' : ''}${aqiDelta}). Hotspots remain localized.`;
  }

  return {
    hasPrevious: true,
    previousBriefId: previousBrief.id || 'N/A',
    previousGeneratedAt: previousBrief.generatedAt || 'Earlier Record',
    aqiDelta,
    aqiTrend,
    peakDelta,
    peakTrend,
    previousAverageAQI: prevSum.averageAQI,
    currentAverageAQI: currSum.averageAQI,
    previousCategory: prevSum.category,
    currentCategory: currSum.category,
    hotspots: {
      currentCount: currHotspots.length,
      previousCount: prevHotspots.length,
      newlyEmerged: newlyEmergedHotspots,
      resolved: resolvedHotspots,
      persistent: persistentHotspots
    },
    stationDeltas,
    reliability: {
      completenessDelta,
      currentGaps: currGaps,
      previousGaps: prevGaps,
      gapDelta: currGaps - prevGaps,
      currentAnomalies: currAnomalies,
      previousAnomalies: prevAnomalies
    },
    changeSummaryText
  };
}
