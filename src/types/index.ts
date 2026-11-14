/**
 * Civic Air Quality Briefing Studio - TypeScript Type Definitions
 */

export type PersonaType = 'ward_officer' | 'housing_society' | 'school' | 'healthcare';
export type AqiStandard = 'cpcb' | 'epa';
export type LanguageCode = 'en' | 'hi' | 'es' | 'mr' | 'ta' | 'bn';
export type ReadingLevel = 'simple' | 'general' | 'sensitive';

export interface PollutantValues {
  pm25?: number | null;
  pm10?: number | null;
  no2?: number | null;
  so2?: number | null;
  co?: number | null;
  o3?: number | null;
  aqi?: number | null;
  temperature?: number | null;
  humidity?: number | null;
  wind_speed?: number | null;
  [key: string]: number | null | undefined;
}

export interface ReadingIssue {
  type: 'missing_reading' | 'negative_drift' | 'sensor_freeze' | 'outlier';
  parameter: string;
  message: string;
}

export interface AirQualityRecord {
  rowIndex: number;
  station: string;
  timestamp: string;
  isoTimestamp: string | null;
  epoch: number | null;
  pollutants: PollutantValues;
  aqi: number;
  dominantPollutant: string;
  category: string;
  level: string;
  badgeColor: string;
  bgColor: string;
  textColor: string;
  issues: ReadingIssue[];
  raw?: Record<string, unknown>;
}

export interface StationSummary {
  station: string;
  readingCount: number;
  averageAQI: number;
  peakAQI: number;
  peakTime: string;
  peakRow: number | null;
  averagePM25: number | null;
  peakPM25: number | null;
  category: string;
  badgeColor: string;
  isHotspot: boolean;
  records: AirQualityRecord[];
}

export interface DataAnomaly {
  rowIndex: number;
  station: string;
  timestamp: string;
  parameter: string;
  type: string;
  detail: string;
  severity: 'warning' | 'alert';
}

export interface DataGap {
  station: string;
  startTime: string;
  endTime: string;
  gapHours: string;
  detail: string;
}

export interface ParsedDataSummary {
  averageAQI: number;
  peakAQI: number;
  category: string;
  badgeColor: string;
  dominantPollutant: string;
  peakLocation: string;
  peakTimestamp: string;
  peakRowIndex: number | null;
  hotspotCount: number;
  totalStations: number;
}

export interface ParsedDataSet {
  success: boolean;
  error?: string;
  formatDetected: string;
  totalRecords: number;
  completenessPercent: number;
  standard: AqiStandard;
  headerMap: Record<string, string>;
  summary: ParsedDataSummary;
  stations: StationSummary[];
  records: AirQualityRecord[];
  anomalies: DataAnomaly[];
  dataGaps: DataGap[];
}

export interface PrioritizedAction {
  id: string;
  action: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  timeframe: string;
  responsible: string;
  impact: string;
  groundedIn: string;
  status: 'Recommended' | 'In Progress' | 'Deployed' | 'Completed';
}

export interface HotspotDiagnosis {
  station: string;
  severity: string;
  peakAQI: number;
  peakTime: string;
  peakRow: number | null;
  likelyCauses: string;
  recommendedIntervention: string;
}

export interface BriefingNote {
  docRef: string;
  date: string;
  targetAudience: string;
  classification: string;
  executiveSummary: string;
  metrics: {
    overallAQI: number;
    category: string;
    peakAQI: number;
    peakLocation: string;
    peakTime: string;
    dominantPollutant: string;
    completenessScore: string;
    activeHotspots: number;
  };
  hotspotAnalysis: HotspotDiagnosis[];
  prioritizedActions: PrioritizedAction[];
  dataIntegrityAudit: {
    sensorAnomaliesCount: number;
    dataGapsCount: number;
    anomaliesList: DataAnomaly[];
    dataGapsList: DataGap[];
  };
  complianceDirectives: string[];
}

export interface AdvisorySection {
  title: string;
  tips: string[];
}

export interface CitizenAdvisory {
  language: string;
  readingLevel: ReadingLevel;
  title: string;
  urgency: string;
  summary: string;
  sections: {
    children: AdvisorySection;
    seniors: AdvisorySection;
    sensitive: AdvisorySection;
    dos: string[];
    donts: string[];
  };
}

export interface TraceabilityItem {
  claim: string;
  source: string;
  peakRow: number | null;
  timestamp: string;
  metricValue: string;
  confidence: string;
}

export interface CivicBrief {
  id: string;
  generatedAt: string;
  persona: PersonaType;
  personaTitle: string;
  language: LanguageCode;
  readingLevel: ReadingLevel;
  aiModelUsed: string;
  isAiEnriched?: boolean;
  geminiError?: string;
  summary: ParsedDataSummary;
  traceabilityList: TraceabilityItem[];
  internalBriefingNote: BriefingNote;
  citizenAdvisory: CitizenAdvisory;
  stations: StationSummary[];
  anomalies: DataAnomaly[];
  dataGaps: DataGap[];
  completenessPercent: number;
}

export interface StationDelta {
  station: string;
  currentAQI: number;
  previousAQI: number | null;
  aqiDelta: number | null;
  status: 'worsened' | 'improved' | 'stable' | 'new_sensor';
  currentCategory: string;
  previousCategory: string;
}

export interface BriefComparison {
  hasPrevious: boolean;
  message?: string;
  previousBriefId?: string;
  previousGeneratedAt?: string;
  aqiDelta?: number;
  aqiTrend?: 'worsening' | 'improving' | 'stable';
  peakDelta?: number;
  peakTrend?: 'worsening' | 'improving' | 'stable';
  previousAverageAQI?: number;
  currentAverageAQI?: number;
  previousCategory?: string;
  currentCategory?: string;
  hotspots?: {
    currentCount: number;
    previousCount: number;
    newlyEmerged: string[];
    resolved: string[];
    persistent: string[];
  };
  stationDeltas?: StationDelta[];
  reliability?: {
    completenessDelta: number;
    currentGaps: number;
    previousGaps: number;
    gapDelta: number;
    currentAnomalies: number;
    previousAnomalies: number;
  };
  changeSummaryText?: string;
}
