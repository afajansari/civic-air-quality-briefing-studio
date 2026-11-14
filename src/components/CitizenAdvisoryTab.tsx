'use client';

import React, { useState } from 'react';
import { Heart, Baby, Users, ShieldAlert, Copy, Check, Printer } from 'lucide-react';
import { CivicBrief, LanguageCode, ReadingLevel } from '@/types';
import { generateLocalizedAdvisory } from '@/lib/translator';

interface CitizenAdvisoryTabProps {
  brief: CivicBrief;
  onPrint: () => void;
}

export const CitizenAdvisoryTab: React.FC<CitizenAdvisoryTabProps> = ({ brief, onPrint }) => {
  const [selectedLang, setSelectedLang] = useState<LanguageCode>(brief.language || 'en');
  const [selectedReadingLevel, setSelectedReadingLevel] = useState<ReadingLevel>(brief.readingLevel || 'general');
  const [copied, setCopied] = useState<boolean>(false);

  // Generate localized version on the fly if user changes language/level in this tab
  const advisory = generateLocalizedAdvisory(
    {
      summary: brief.summary,
      totalRecords: brief.summary.totalStations,
      completenessPercent: brief.completenessPercent,
      standard: 'cpcb',
      headerMap: {},
      stations: brief.stations,
      records: [],
      anomalies: brief.anomalies,
      dataGaps: brief.dataGaps,
      success: true,
      formatDetected: 'csv'
    },
    selectedLang,
    selectedReadingLevel
  );

  const handleCopyWhatsAppBroadcast = () => {
    const text = `🚨 *${advisory.urgency}* 🚨
*${advisory.title}*

📢 *Community Summary:*
${advisory.summary}

👶 *For Children & Schools:*
${advisory.sections.children.tips.map(t => `• ${t}`).join('\n')}

👵 *For Older Adults & Seniors:*
${advisory.sections.seniors.tips.map(t => `• ${t}`).join('\n')}

🫁 *For Asthma & Heart Patients:*
${advisory.sections.sensitive.tips.map(t => `• ${t}`).join('\n')}

✅ *What To Do:*
${advisory.sections.dos.map(t => `✓ ${t}`).join('\n')}

❌ *What To Avoid:*
${advisory.sections.donts.map(t => `✗ ${t}`).join('\n')}

Issued by Civic Air Quality Briefing Studio`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-5">
      {/* Action Header & Language Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-400" />
            Citizen Air Quality Advisory
          </h2>
          <p className="text-xs text-slate-400">
            Public health advisories in multiple languages, written for different reading levels
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Language Filter */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {(['en', 'hi', 'es', 'mr'] as LanguageCode[]).map((l) => (
              <button
                key={l}
                onClick={() => setSelectedLang(l)}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  selectedLang === l
                    ? 'bg-rose-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Quick Reading Level */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {(['simple', 'general', 'sensitive'] as ReadingLevel[]).map((rl) => (
              <button
                key={rl}
                onClick={() => setSelectedReadingLevel(rl)}
                className={`px-2.5 py-1 rounded-lg font-medium capitalize transition ${
                  selectedReadingLevel === rl
                    ? 'bg-purple-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {rl}
              </button>
            ))}
          </div>

          <button
            onClick={handleCopyWhatsAppBroadcast}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-slate-950 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Broadcast!' : 'WhatsApp Broadcast'}</span>
          </button>

          <button
            onClick={onPrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white border border-slate-700 transition"
          >
            <Printer className="w-3.5 h-3.5 text-slate-300" />
            Print Public Flyer
          </button>
        </div>
      </div>

      {/* Styled Public Health Flyer Poster */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl print:bg-white print:text-black print:border-none print:shadow-none">
        {/* Banner Alert */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/70 via-red-950/60 to-purple-950/70 border border-rose-800/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500 text-slate-950">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-300">
                {advisory.urgency}
              </span>
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
                {advisory.title}
              </h1>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl font-black text-rose-400">AQI {brief.summary.averageAQI}</div>
            <div className="text-[11px] text-slate-400">Status: {brief.summary.category}</div>
          </div>
        </div>

        {/* Plain Language Summary */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
          {advisory.summary}
        </div>

        {/* 3 Dedicated Care Cards for Vulnerable Groups */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-cyan-400" />
            Dedicated Health Precautions by Vulnerable Audience
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Children & Schools */}
            <div className="bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 rounded-xl p-4 transition space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs pb-2 border-b border-slate-800">
                <Baby className="w-4 h-4" />
                <span>{advisory.sections.children.title}</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300 leading-relaxed">
                {advisory.sections.children.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Card 2: Older Adults & Seniors */}
            <div className="bg-slate-950/80 border border-slate-800 hover:border-purple-500/40 rounded-xl p-4 transition space-y-2">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-xs pb-2 border-b border-slate-800">
                <Users className="w-4 h-4" />
                <span>{advisory.sections.seniors.title}</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300 leading-relaxed">
                {advisory.sections.seniors.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-purple-400 font-bold">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Card 3: Sensitive Groups (Asthma & Heart) */}
            <div className="bg-slate-950/80 border border-slate-800 hover:border-rose-500/40 rounded-xl p-4 transition space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs pb-2 border-b border-slate-800">
                <Heart className="w-4 h-4" />
                <span>{advisory.sections.sensitive.title}</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300 leading-relaxed">
                {advisory.sections.sensitive.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-rose-400 font-bold">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Actionable Community Dos & Don'ts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Do's */}
          <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-xl p-4 space-y-2">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-emerald-900/40">
              What To Do (Recommended Citizen Steps)
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-200">
              {advisory.sections.dos.map((d, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Don'ts */}
          <div className="bg-rose-950/20 border border-rose-900/40 rounded-xl p-4 space-y-2">
            <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-rose-900/40">
              What To Avoid (High-Risk Activities)
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-200">
              {advisory.sections.donts.map((d, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-rose-400 font-bold">✗</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
