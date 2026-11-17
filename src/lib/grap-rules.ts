/**
 * CPCB & CAQM Graded Response Action Plan (GRAP) Regulatory Engine
 * Implements statutory emergency measures across Stages I to IV for Indian urban centers.
 */

export type GrapStageId = 'NORMAL' | 'STAGE_1' | 'STAGE_2' | 'STAGE_3' | 'STAGE_4';

export interface GrapAction {
  category: 'Transport' | 'Construction' | 'Industrial' | 'Civic & Municipal' | 'Education & Public';
  measure: string;
  enforcingAuthority: string;
  mandatory: boolean;
  legalBasis: string;
}

export interface GrapStageDetails {
  id: GrapStageId;
  stageName: string;
  aqiRange: string;
  minAqi: number;
  maxAqi: number;
  severityLevel: 'Normal' | 'Poor' | 'Very Poor' | 'Severe' | 'Severe+ Emergency';
  badgeColor: string;
  bannerBg: string;
  borderColor: string;
  textColor: string;
  primaryMandate: string;
  actions: GrapAction[];
}

export const GRAP_STAGES: Record<GrapStageId, GrapStageDetails> = {
  NORMAL: {
    id: 'NORMAL',
    stageName: 'Standard Operations (Pre-GRAP)',
    aqiRange: '0 - 200',
    minAqi: 0,
    maxAqi: 200,
    severityLevel: 'Normal',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    bannerBg: 'bg-emerald-950/40',
    borderColor: 'border-emerald-800/60',
    textColor: 'text-emerald-400',
    primaryMandate: 'Routine urban air monitoring and standard ambient dust suppression.',
    actions: [
      {
        category: 'Civic & Municipal',
        measure: 'Routine street sweeping and municipal solid waste collection to prevent open dumping.',
        enforcingAuthority: 'Municipal Corporation Sanitation Dept',
        mandatory: true,
        legalBasis: 'Solid Waste Management Rules, 2016'
      },
      {
        category: 'Construction',
        measure: 'Basic perimeter dust fencing and tarpaulin covering for construction aggregate.',
        enforcingAuthority: 'Building Environment Cell',
        mandatory: true,
        legalBasis: 'C&D Waste Management Rules, 2016'
      }
    ]
  },
  STAGE_1: {
    id: 'STAGE_1',
    stageName: 'GRAP Stage I (Poor Air Quality)',
    aqiRange: '201 - 300',
    minAqi: 201,
    maxAqi: 300,
    severityLevel: 'Poor',
    badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    bannerBg: 'bg-orange-950/40',
    borderColor: 'border-orange-800/60',
    textColor: 'text-orange-400',
    primaryMandate: 'Mechanized dust control, ban on open biomass burning, and strict C&D inspections.',
    actions: [
      {
        category: 'Construction',
        measure: 'Enforce strict dust mitigation at all active C&D sites > 500 sq.m; halt non-compliant plots.',
        enforcingAuthority: 'Ward Enforcement Squad & Building Dept',
        mandatory: true,
        legalBasis: 'CAQM Statutory Directive No. 71'
      },
      {
        category: 'Civic & Municipal',
        measure: 'Heavy mechanized road sweeping and scheduled water sprinkling on identified dust corridors.',
        enforcingAuthority: 'Municipal Sanitation & PWD Unit',
        mandatory: true,
        legalBasis: 'Air (Prevention & Control of Pollution) Act 1981'
      },
      {
        category: 'Civic & Municipal',
        measure: 'Deploy mobile Anti-Smog Guns at high-density traffic intersections and congestion choke points.',
        enforcingAuthority: 'Traffic Warden Division & Urban Local Body',
        mandatory: true,
        legalBasis: 'CPCB Clean Air Directive'
      },
      {
        category: 'Civic & Municipal',
        measure: 'Zero tolerance enforcement against open burning of municipal solid waste, biomass, and dry leaves.',
        enforcingAuthority: 'Municipal Pollution Cell & Police',
        mandatory: true,
        legalBasis: 'NGT Order in OA No. 21/2014'
      }
    ]
  },
  STAGE_2: {
    id: 'STAGE_2',
    stageName: 'GRAP Stage II (Very Poor Air Quality)',
    aqiRange: '301 - 400',
    minAqi: 301,
    maxAqi: 400,
    severityLevel: 'Very Poor',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    bannerBg: 'bg-rose-950/40',
    borderColor: 'border-rose-800/60',
    textColor: 'text-rose-400',
    primaryMandate: 'Curbs on diesel generators, daily chemical dust suppressants, and transit frequency surge.',
    actions: [
      {
        category: 'Industrial',
        measure: 'Ban on operation of Diesel Generator (DG) sets across commercial/residential clusters (emergency services exempted).',
        enforcingAuthority: 'State Pollution Control Board & DISCOMs',
        mandatory: true,
        legalBasis: 'CAQM Directive No. 73'
      },
      {
        category: 'Civic & Municipal',
        measure: 'Daily mechanized road sweeping and targeted application of chemical dust suppressants before morning peak.',
        enforcingAuthority: 'Municipal Corporation & PWD',
        mandatory: true,
        legalBasis: 'National Clean Air Programme (NCAP)'
      },
      {
        category: 'Transport',
        measure: 'Augment metro and CNG bus service frequencies; implement differential/enhanced parking charges to deter personal vehicle use.',
        enforcingAuthority: 'Transport Dept & Metro Rail Corp',
        mandatory: true,
        legalBasis: 'Unified Metropolitan Transport Authority Policy'
      },
      {
        category: 'Education & Public',
        measure: 'Issue public health advisory cautioning senior citizens and respiratory patients to curtail outdoor morning exertion.',
        enforcingAuthority: 'Directorate of Health Services',
        mandatory: false,
        legalBasis: 'CPCB Health Advisory Framework'
      }
    ]
  },
  STAGE_3: {
    id: 'STAGE_3',
    stageName: 'GRAP Stage III (Severe Air Quality)',
    aqiRange: '401 - 450',
    minAqi: 401,
    maxAqi: 450,
    severityLevel: 'Severe',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    bannerBg: 'bg-purple-950/40',
    borderColor: 'border-purple-800/60',
    textColor: 'text-purple-400',
    primaryMandate: 'Complete cessation of all non-essential construction and strict ban on BS-III petrol & BS-IV diesel LMVs.',
    actions: [
      {
        category: 'Construction',
        measure: 'Enforce complete halt on all non-essential construction and demolition (C&D) operations across the municipality.',
        enforcingAuthority: 'Building Dept, Police & Municipal Vigilance',
        mandatory: true,
        legalBasis: 'CAQM Statutory Directive No. 75'
      },
      {
        category: 'Industrial',
        measure: 'Complete closure of all stone crushers, mining operations, and brick kilns not operating on PNG or clean biomass.',
        enforcingAuthority: 'State Pollution Control Board & Mining Dept',
        mandatory: true,
        legalBasis: 'EPA Act 1986'
      },
      {
        category: 'Transport',
        measure: 'Enforce statutory ban on the plying of BS-III Petrol and BS-IV Diesel 4-wheeler Light Motor Vehicles (LMVs).',
        enforcingAuthority: 'Traffic Police & Transport Enforcement',
        mandatory: true,
        legalBasis: 'Motor Vehicles Act & CAQM Notification'
      },
      {
        category: 'Education & Public',
        measure: 'Recommend suspension of physical classes for primary schools (Nursery to Class V) with transition to online learning.',
        enforcingAuthority: 'Directorate of Education',
        mandatory: true,
        legalBasis: 'State Disaster Management Authority Directive'
      }
    ]
  },
  STAGE_4: {
    id: 'STAGE_4',
    stageName: 'GRAP Stage IV (Severe+ Emergency)',
    aqiRange: '> 450',
    minAqi: 451,
    maxAqi: 999,
    severityLevel: 'Severe+ Emergency',
    badgeColor: 'bg-fuchsia-500/30 text-fuchsia-200 border-fuchsia-500/50 animate-pulse',
    bannerBg: 'bg-fuchsia-950/50',
    borderColor: 'border-fuchsia-700/80',
    textColor: 'text-fuchsia-300',
    primaryMandate: 'Emergency vehicle bans, mandatory 50% remote work, and suspension of physical school classes.',
    actions: [
      {
        category: 'Transport',
        measure: 'Complete ban on entry of commercial diesel trucks into urban boundaries (essential commodities & LNG/CNG/EV exempted).',
        enforcingAuthority: 'Border Traffic Police & Toll Management',
        mandatory: true,
        legalBasis: 'CAQM Emergency Directive No. 77'
      },
      {
        category: 'Transport',
        measure: 'Ban on plying of all non-BS-VI Diesel medium and heavy goods vehicles (MGVs/HGVs) registered locally.',
        enforcingAuthority: 'Transport Enforcement Wing',
        mandatory: true,
        legalBasis: 'Supreme Court EPCA Directives'
      },
      {
        category: 'Education & Public',
        measure: 'Mandatory closure of physical classes for all grades (Class VI to IX, Class XI) and university campuses.',
        enforcingAuthority: 'Department of Higher & School Education',
        mandatory: true,
        legalBasis: 'Disaster Management Act 2005'
      },
      {
        category: 'Civic & Municipal',
        measure: 'Mandate 50% physical office attendance for municipal and private corporate establishments; enable universal WFH.',
        enforcingAuthority: 'District Magistrate & Labour Commissioner',
        mandatory: true,
        legalBasis: 'Section 144 CrPC & Disaster Management Act'
      }
    ]
  }
};

/**
 * Determine the applicable CPCB/CAQM GRAP Stage from calculated AQI
 */
export function resolveGrapStage(aqi: number): GrapStageDetails {
  if (aqi > 450) return GRAP_STAGES.STAGE_4;
  if (aqi >= 401) return GRAP_STAGES.STAGE_3;
  if (aqi >= 301) return GRAP_STAGES.STAGE_2;
  if (aqi >= 201) return GRAP_STAGES.STAGE_1;
  return GRAP_STAGES.NORMAL;
}
