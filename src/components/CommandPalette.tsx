'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Search,
  MapPin,
  ShieldCheck,
  Building2,
  School,
  HeartPulse,
  RefreshCw,
  Sparkles,
  FileDown,
  History,
  Key,
  X,
  CornerDownLeft
} from 'lucide-react';
import { PersonaType } from '@/types';

export interface CommandItem {
  id: string;
  category: 'station' | 'persona' | 'action';
  categoryLabel: string;
  title: string;
  subtitle?: string;
  keywords?: string[];
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
  perform: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStation: (stationName: string) => void;
  onSelectPersona: (persona: PersonaType) => void;
  onRefreshLive: () => void;
  onSynthesizeBrief: () => void;
  onExportMarkdown: () => void;
  onOpenHistory: () => void;
  onOpenApiKey: () => void;
  currentStation?: string;
  currentPersona?: PersonaType;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectStation,
  onSelectPersona,
  onRefreshLive,
  onSynthesizeBrief,
  onExportMarkdown,
  onOpenHistory,
  onOpenApiKey,
  currentStation,
  currentPersona
}) => {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Define command items
  const allItems: CommandItem[] = useMemo(() => {
    return [
      // --- Operational Actions ---
      {
        id: 'action-refresh',
        category: 'action',
        categoryLabel: 'Actions',
        title: 'Refresh Live Telemetry',
        subtitle: 'Pull latest CAAQMS telemetry stream & recalculate AQI breakpoints',
        keywords: ['refresh', 'reload', 'fetch', 'live', 'telemetry', 'update', 'cpcb'],
        icon: RefreshCw,
        badge: 'Action',
        badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        perform: () => {
          onRefreshLive();
        }
      },
      {
        id: 'action-synthesize',
        category: 'action',
        categoryLabel: 'Actions',
        title: 'Synthesize Civic Intelligence Brief',
        subtitle: 'Run AI streaming synthesis with GRAP regulatory directives',
        keywords: ['synthesize', 'generate', 'brief', 'ai', 'analyze', 'interpret', 'grap'],
        icon: Sparkles,
        badge: 'AI Engine',
        badgeColor: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
        perform: () => {
          onSynthesizeBrief();
        }
      },
      {
        id: 'action-export-md',
        category: 'action',
        categoryLabel: 'Actions',
        title: 'Export Brief as Markdown',
        subtitle: 'Download verified administrative memo as standard Markdown (.md)',
        keywords: ['export', 'markdown', 'download', 'save', 'memo', 'file'],
        icon: FileDown,
        badge: 'Export',
        badgeColor: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
        perform: () => {
          onExportMarkdown();
        }
      },
      {
        id: 'action-history',
        category: 'action',
        categoryLabel: 'Actions',
        title: 'View History & Saved Briefs Archive',
        subtitle: 'Open the retrospective drawer and compare historical reports',
        keywords: ['history', 'archive', 'saved', 'past', 'briefs', 'records'],
        icon: History,
        badge: 'Archive',
        badgeColor: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
        perform: () => {
          onOpenHistory();
        }
      },
      {
        id: 'action-api-key',
        category: 'action',
        categoryLabel: 'Actions',
        title: 'Configure Gemini / OpenRouter API Key',
        subtitle: 'Manage local API credentials and switch generative AI models',
        keywords: ['api', 'key', 'configure', 'gemini', 'openrouter', 'model', 'settings'],
        icon: Key,
        badge: 'Config',
        badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        perform: () => {
          onOpenApiKey();
        }
      },

      // --- Civic Personas ---
      {
        id: 'persona-ward-officer',
        category: 'persona',
        categoryLabel: 'Personas',
        title: 'Ward Officer & Municipal Team',
        subtitle: 'Mist cannons, mechanized sweeping, C&D site dust enforcement, DG set bans',
        keywords: ['ward', 'officer', 'municipal', 'government', 'enforcement', 'sprinkling'],
        icon: ShieldCheck,
        badge: currentPersona === 'ward_officer' ? 'Active' : 'Persona',
        badgeColor: currentPersona === 'ward_officer' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-800 text-slate-300 border-slate-700',
        perform: () => {
          onSelectPersona('ward_officer');
        }
      },
      {
        id: 'persona-housing-society',
        category: 'persona',
        categoryLabel: 'Personas',
        title: 'Housing Society & Apartment RWA',
        subtitle: 'Common HEPA air purifiers, DG restrictions, damp mopping, resident advisories',
        keywords: ['housing', 'society', 'rwa', 'apartment', 'residential', 'community'],
        icon: Building2,
        badge: currentPersona === 'housing_society' ? 'Active' : 'Persona',
        badgeColor: currentPersona === 'housing_society' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-800 text-slate-300 border-slate-700',
        perform: () => {
          onSelectPersona('housing_society');
        }
      },
      {
        id: 'persona-school',
        category: 'persona',
        categoryLabel: 'Personas',
        title: 'School Administrator & Education',
        subtitle: 'Sports cancellation, indoor assembly, classroom filtration, asthma alerts',
        keywords: ['school', 'education', 'children', 'students', 'sports', 'principal'],
        icon: School,
        badge: currentPersona === 'school' ? 'Active' : 'Persona',
        badgeColor: currentPersona === 'school' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-800 text-slate-300 border-slate-700',
        perform: () => {
          onSelectPersona('school');
        }
      },
      {
        id: 'persona-healthcare',
        category: 'persona',
        categoryLabel: 'Personas',
        title: 'Healthcare Provider & Elder Care',
        subtitle: 'Nebulizer surge prep, vulnerable patient SMS outreach, clean air wards',
        keywords: ['healthcare', 'elder', 'senior', 'hospital', 'clinic', 'copd', 'asthma', 'doctor'],
        icon: HeartPulse,
        badge: currentPersona === 'healthcare' ? 'Active' : 'Persona',
        badgeColor: currentPersona === 'healthcare' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-800 text-slate-300 border-slate-700',
        perform: () => {
          onSelectPersona('healthcare');
        }
      },

      // --- Regional Monitoring Stations ---
      {
        id: 'station-delhi-anand-vihar',
        category: 'station',
        categoryLabel: 'Regional Stations',
        title: 'Delhi (Anand Vihar)',
        subtitle: 'Trans-Yamuna ISBT transit corridor • High PM2.5 inversion hotspot',
        keywords: ['delhi', 'anand vihar', 'isbt', 'ncr', 'station', 'hotspot'],
        icon: MapPin,
        badge: 'NCR',
        badgeColor: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        perform: () => onSelectStation('Delhi (Anand Vihar)')
      },
      {
        id: 'station-delhi-rohini',
        category: 'station',
        categoryLabel: 'Regional Stations',
        title: 'Delhi (Rohini)',
        subtitle: 'North-West Delhi residential & commercial belt near outer ring road',
        keywords: ['delhi', 'rohini', 'ncr', 'station', 'north west'],
        icon: MapPin,
        badge: 'NCR',
        badgeColor: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        perform: () => onSelectStation('Delhi (Rohini)')
      },
      {
        id: 'station-delhi-igi',
        category: 'station',
        categoryLabel: 'Regional Stations',
        title: 'Delhi (IGI Airport)',
        subtitle: 'Indira Gandhi International Airport aviation & highway boundary monitoring',
        keywords: ['delhi', 'igi', 'airport', 'palam', 'terminal 3', 'ncr'],
        icon: MapPin,
        badge: 'NCR',
        badgeColor: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        perform: () => onSelectStation('Delhi (IGI Airport)')
      },
      {
        id: 'station-delhi-rk-puram',
        category: 'station',
        categoryLabel: 'Regional Stations',
        title: 'Delhi (RK Puram)',
        subtitle: 'South Delhi institutional & residential zone • Urban background baseline',
        keywords: ['delhi', 'rk puram', 'r k puram', 'south delhi', 'ncr'],
        icon: MapPin,
        badge: 'NCR',
        badgeColor: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        perform: () => onSelectStation('Delhi (RK Puram)')
      },
      {
        id: 'station-mumbai-bandra',
        category: 'station',
        categoryLabel: 'Regional Stations',
        title: 'Mumbai (Bandra)',
        subtitle: 'Western coastal suburb • Sea-breeze diurnal dispersion boundary',
        keywords: ['mumbai', 'bandra', 'west', 'maharashtra', 'station'],
        icon: MapPin,
        badge: 'West',
        badgeColor: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
        perform: () => onSelectStation('Mumbai (Bandra)')
      },
      {
        id: 'station-mumbai-colaba',
        category: 'station',
        categoryLabel: 'Regional Stations',
        title: 'Mumbai (Colaba)',
        subtitle: 'South Mumbai coastal background station • Maritime influence',
        keywords: ['mumbai', 'colaba', 'south mumbai', 'west', 'station'],
        icon: MapPin,
        badge: 'West',
        badgeColor: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
        perform: () => onSelectStation('Mumbai (Colaba)')
      },
      {
        id: 'station-bengaluru',
        category: 'station',
        categoryLabel: 'Regional Stations',
        title: 'Bengaluru (BTM Layout)',
        subtitle: 'Southern tech corridor & ring road traffic corridor',
        keywords: ['bengaluru', 'bangalore', 'btm', 'south', 'karnataka'],
        icon: MapPin,
        badge: 'South',
        badgeColor: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
        perform: () => onSelectStation('Bengaluru (BTM)')
      },
      {
        id: 'station-kolkata',
        category: 'station',
        categoryLabel: 'Regional Stations',
        title: 'Kolkata (Victoria)',
        subtitle: 'Victoria Memorial metropolitan heritage & green belt CAAQMS',
        keywords: ['kolkata', 'calcutta', 'victoria', 'east', 'west bengal'],
        icon: MapPin,
        badge: 'East',
        badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        perform: () => onSelectStation('Kolkata (Victoria)')
      },
      {
        id: 'station-chennai',
        category: 'station',
        categoryLabel: 'Regional Stations',
        title: 'Chennai (Alandur)',
        subtitle: 'Corridor transit & coastal urban monitoring in Tamil Nadu',
        keywords: ['chennai', 'madras', 'alandur', 'south', 'tamil nadu'],
        icon: MapPin,
        badge: 'South',
        badgeColor: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
        perform: () => onSelectStation('Chennai (Alandur)')
      },
      {
        id: 'station-lucknow',
        category: 'station',
        categoryLabel: 'Regional Stations',
        title: 'Lucknow',
        subtitle: 'Central Indo-Gangetic plain • High winter particulate trapping',
        keywords: ['lucknow', 'up', 'uttar pradesh', 'north', 'gangetic'],
        icon: MapPin,
        badge: 'North',
        badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        perform: () => onSelectStation('Lucknow')
      },
      {
        id: 'station-patna',
        category: 'station',
        categoryLabel: 'Regional Stations',
        title: 'Patna',
        subtitle: 'Middle-Gangetic alluvial basin • River basin thermal inversion',
        keywords: ['patna', 'bihar', 'east', 'gangetic', 'station'],
        icon: MapPin,
        badge: 'East',
        badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        perform: () => onSelectStation('Patna')
      },
      {
        id: 'station-jaipur',
        category: 'station',
        categoryLabel: 'Regional Stations',
        title: 'Jaipur',
        subtitle: 'Semi-arid urban basin • Mineral dust & vehicular resuspension',
        keywords: ['jaipur', 'rajasthan', 'north', 'arid', 'pink city'],
        icon: MapPin,
        badge: 'North',
        badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        perform: () => onSelectStation('Jaipur')
      },
      {
        id: 'station-ahmedabad',
        category: 'station',
        categoryLabel: 'Regional Stations',
        title: 'Ahmedabad',
        subtitle: 'Western industrial & commerce corridor in Gujarat',
        keywords: ['ahmedabad', 'gujarat', 'west', 'industrial'],
        icon: MapPin,
        badge: 'West',
        badgeColor: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
        perform: () => onSelectStation('Ahmedabad')
      },
      {
        id: 'station-pune',
        category: 'station',
        categoryLabel: 'Regional Stations',
        title: 'Pune',
        subtitle: 'Deccan plateau valley basin & automobile industrial corridor',
        keywords: ['pune', 'maharashtra', 'west', 'deccan'],
        icon: MapPin,
        badge: 'West',
        badgeColor: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
        perform: () => onSelectStation('Pune')
      },
      {
        id: 'station-hyderabad',
        category: 'station',
        categoryLabel: 'Regional Stations',
        title: 'Hyderabad (Sanathnagar)',
        subtitle: 'Deccan urban commercial & industrial cluster',
        keywords: ['hyderabad', 'sanathnagar', 'telangana', 'south'],
        icon: MapPin,
        badge: 'South',
        badgeColor: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
        perform: () => onSelectStation('Hyderabad (Sanathnagar)')
      },
      {
        id: 'station-kanpur',
        category: 'station',
        categoryLabel: 'Regional Stations',
        title: 'Kanpur',
        subtitle: 'Industrial Gangetic city with heavy leather & manufacturing grid',
        keywords: ['kanpur', 'up', 'uttar pradesh', 'north', 'industrial'],
        icon: MapPin,
        badge: 'North',
        badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        perform: () => onSelectStation('Kanpur')
      },
      {
        id: 'station-varanasi',
        category: 'station',
        categoryLabel: 'Regional Stations',
        title: 'Varanasi',
        subtitle: 'Eastern UP Gangetic river basin & heritage transit corridor',
        keywords: ['varanasi', 'banaras', 'kashi', 'up', 'east'],
        icon: MapPin,
        badge: 'East',
        badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        perform: () => onSelectStation('Varanasi')
      }
    ];
  }, [
    currentPersona,
    onRefreshLive,
    onSynthesizeBrief,
    onExportMarkdown,
    onOpenHistory,
    onOpenApiKey,
    onSelectPersona,
    onSelectStation
  ]);

  // Filter items based on user query
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allItems;
    return allItems.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSubtitle = item.subtitle ? item.subtitle.toLowerCase().includes(q) : false;
      const matchCategory = item.categoryLabel.toLowerCase().includes(q);
      const matchKeywords = item.keywords ? item.keywords.some((k) => k.toLowerCase().includes(q)) : false;
      return matchTitle || matchSubtitle || matchCategory || matchKeywords;
    });
  }, [allItems, query]);

  // Reset active index when query changes or palette opens
  useEffect(() => {
    setActiveIndex(0);
  }, [query, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Handle execution of item
  const executeItem = useCallback(
    (item: CommandItem) => {
      item.perform();
      onClose();
    },
    [onClose]
  );

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (filteredItems.length === 0 ? 0 : (prev + 1) % filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (filteredItems.length === 0 ? 0 : (prev - 1 + filteredItems.length) % filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems.length > 0 && filteredItems[activeIndex]) {
        executeItem(filteredItems[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector(`[data-index="${activeIndex}"]`) as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeIndex]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Universal Command Palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] border-t-slate-700/60"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <Search className="w-5 h-5 text-slate-400 shrink-0 mr-3" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-autocomplete="list"
            aria-controls="command-palette-results"
            aria-activedescendant={filteredItems[activeIndex] ? filteredItems[activeIndex].id : undefined}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a station (Delhi, Mumbai, Bengaluru...), persona, or action..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              aria-label="Clear search input"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-semibold text-slate-400 bg-slate-800 border border-slate-700 rounded-md">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-700">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 space-y-2">
              <Search className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="font-semibold text-slate-300">No commands or stations found for &ldquo;{query}&rdquo;</p>
              <p className="text-[11px] text-slate-500">
                Try searching for &apos;Anand Vihar&apos;, &apos;Mumbai&apos;, &apos;School&apos;, &apos;Refresh&apos;, or &apos;Synthesize&apos;.
              </p>
            </div>
          ) : (
            <ul
              id="command-palette-results"
              role="listbox"
              ref={listRef}
              className="space-y-1"
            >
              {filteredItems.map((item, idx) => {
                const IconComponent = item.icon;
                const isSelected = idx === activeIndex;
                const isCurrentStation =
                  item.category === 'station' &&
                  currentStation &&
                  item.title.toLowerCase().includes(currentStation.toLowerCase());

                return (
                  <li
                    key={item.id}
                    id={item.id}
                    data-index={idx}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => executeItem(item)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition select-none ${
                      isSelected
                        ? 'bg-slate-800/90 text-white ring-1 ring-cyan-500/40 shadow-md'
                        : 'text-slate-300 hover:bg-slate-850 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div
                        className={`p-2 rounded-lg shrink-0 ${
                          isSelected
                            ? 'bg-cyan-500/20 text-cyan-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold truncate text-white">
                            {item.title}
                          </span>
                          {isCurrentStation && (
                            <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Selected
                            </span>
                          )}
                        </div>
                        {item.subtitle && (
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {item.subtitle}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.badge && (
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            item.badgeColor || 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      {isSelected && (
                        <CornerDownLeft className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer Keyboard Hints */}
        <div className="px-4 py-2.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] font-mono text-slate-300">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] font-mono text-slate-300">↓</kbd>
              <span className="ml-1">Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] font-mono text-slate-300">↵</kbd>
              <span className="ml-1">Select</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] font-mono text-slate-300">ESC</kbd>
              <span className="ml-1">Close</span>
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-500 font-mono">
            <span>CPCB • CAAQMS Network</span>
          </div>
        </div>
      </div>
    </div>
  );
};
