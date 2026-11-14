'use client';

import React from 'react';
import { Building2, School, HeartPulse, ShieldCheck, Languages, BookOpen, Sliders } from 'lucide-react';
import { AqiStandard, LanguageCode, PersonaType, ReadingLevel } from '@/types';

interface PersonaConfigBarProps {
  persona: PersonaType;
  setPersona: (p: PersonaType) => void;
  standard: AqiStandard;
  setStandard: (s: AqiStandard) => void;
  language: LanguageCode;
  setLanguage: (l: LanguageCode) => void;
  readingLevel: ReadingLevel;
  setReadingLevel: (r: ReadingLevel) => void;
}

export const PersonaConfigBar: React.FC<PersonaConfigBarProps> = ({
  persona,
  setPersona,
  standard,
  setStandard,
  language,
  setLanguage,
  readingLevel,
  setReadingLevel
}) => {
  const personas: { id: PersonaType; label: string; icon: React.ElementType; desc: string }[] = [
    {
      id: 'ward_officer',
      label: 'Ward Officer / Municipal',
      icon: ShieldCheck,
      desc: 'Mist cannons, street cleaning, C&D dust, DG set bans'
    },
    {
      id: 'housing_society',
      label: 'Housing Society / RWA',
      icon: Building2,
      desc: 'Common air purifiers, DG shift, sealing, walks alert'
    },
    {
      id: 'school',
      label: 'School / Education',
      icon: School,
      desc: 'Sports cancellation, indoor assembly, asthma alert'
    },
    {
      id: 'healthcare',
      label: 'Healthcare / Elder Care',
      icon: HeartPulse,
      desc: 'Nebulizer triage, outpatient SMS, clean air rooms'
    }
  ];

  return (
    <section aria-labelledby="persona-config-heading" className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-4">
      {/* Persona Selection */}
      <div>
        <div id="persona-config-heading" className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
          <Sliders className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
          <span>Who is Asking? (Tailors Prioritized Interventions)</span>
        </div>
        <div role="radiogroup" aria-labelledby="persona-config-heading" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {personas.map((p) => {
            const Icon = p.icon;
            const isSelected = persona === p.id;
            return (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setPersona(p.id)}
                className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                  isSelected
                    ? 'bg-cyan-950/50 border-cyan-500 text-white shadow-md shadow-cyan-500/10'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    isSelected ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}
                  aria-hidden="true"
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white leading-tight">{p.label}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{p.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Standards, Language & Reading Level Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800">
        {/* AQI Standard */}
        <div>
          <label htmlFor="aqi-standard-select" className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mb-1">
            AQI Calculation Standard
          </label>
          <select
            id="aqi-standard-select"
            value={standard}
            onChange={(e) => setStandard(e.target.value as AqiStandard)}
            className="w-full bg-slate-950 text-xs text-white border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          >
            <option value="cpcb">Indian NAQI (CPCB 6-Category Standard)</option>
            <option value="epa">US EPA AQI Standard (AirNow)</option>
          </select>
        </div>

        {/* Citizen Advisory Language */}
        <div>
          <label htmlFor="advisory-lang-select" className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mb-1">
            <Languages className="w-3 h-3 text-emerald-400" aria-hidden="true" />
            Advisory Language
          </label>
          <select
            id="advisory-lang-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value as LanguageCode)}
            className="w-full bg-slate-950 text-xs text-white border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          >
            <option value="en">English</option>
            <option value="hi">Hindi (हिंदी)</option>
            <option value="es">Spanish (Español)</option>
            <option value="mr">Marathi (मराठी)</option>
            <option value="ta">Tamil (தமிழ்)</option>
            <option value="bn">Bengali (বাংলা)</option>
          </select>
        </div>

        {/* Reading Level */}
        <div>
          <label htmlFor="reading-level-select" className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mb-1">
            <BookOpen className="w-3 h-3 text-purple-400" aria-hidden="true" />
            Citizen Reading Level
          </label>
          <select
            id="reading-level-select"
            value={readingLevel}
            onChange={(e) => setReadingLevel(e.target.value as ReadingLevel)}
            className="w-full bg-slate-950 text-xs text-white border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          >
            <option value="simple">Simple / Everyday (Grade 6 level)</option>
            <option value="general">General Community (Clear & Actionable)</option>
            <option value="sensitive">Sensitive Groups (High-Alert Protocol)</option>
          </select>
        </div>
      </div>
    </section>
  );
};
