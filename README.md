# Civic Air Quality Briefing Studio 🌍💨

> **An AI-Driven Civic Intelligence Solution** that empowers local authorities, housing societies, ward-level teams, schools, and healthcare facilities to transform raw, messy air quality data into actionable, grounded, and life-saving local interventions.

Built with **Next.js 14 App Router**, **React 18**, **TypeScript**, **Tailwind CSS**, and **Google Gemini Generative AI**.

---

## 🏛️ Why Civic Air Quality Briefing Studio?

Municipal ward officers, apartment resident welfare associations (RWAs), school administrators, and health clinics are on the frontline of air pollution exposure. However, raw data from monitors or citizen sensors is often:
- **Messy & Inconsistent**: Mixed units (µg/m³, ppm, ppb, mg/m³), varying column headers, unaligned delimiters.
- **Unreliable**: Sensor hardware freezes, negative calibration drift, and multi-hour telemetry dropouts create false alarms or blind spots.
- **Lacking Civic Context**: Raw numbers don't tell a school principal whether to cancel recess, or a ward officer where to route anti-smog mist cannons.
- **Inaccessible to Citizens**: Complex meteorological jargon fails to communicate emergency precautions to parents, seniors, and non-English speaking residents.

**Civic Air Quality Briefing Studio** solves these challenges by combining strict statistical data validation with state-of-the-art Generative AI.

---

## ✨ Core Capabilities

### 1. 🧹 Messy Tabular Data Interpreter & Unit Normalizer
- Automatically detects delimiters (CSV `,`, TSV `\t`, European semicolon `;`, pipe `|`, or JSON).
- Fuzzy column alias matcher: recognizes variants of `PM2.5`, `pm_25`, `pm2.5_atm`, `fine_particles`, `station`, `site`, `ward`, `datetime`, `observed_at`, etc.
- In-flight unit extraction & conversion: extracts numbers from text like `"185 ug/m3"`, `"0.035 ppm"`, `"78 ppb"` and converts to standard air quality units.

### 2. 🛡️ Data Gap & Sensor Anomaly Audit
- **Sensor Freeze / Flatline**: Flags 4+ identical consecutive non-zero readings as hardware lockups.
- **Negative Baseline Drift**: Flags sensor readings `< 0 µg/m³` (optical chamber drift) and normalizes to zero baseline.
- **Telemetry Dropouts**: Identifies gaps `> 2 hours` between expected readings per station.
- **Completeness Score**: Computes real percentage of expected vs received telemetry cells.

### 3. 🎯 Persona-Specific Action Prioritization
Air quality interventions must be suited to who is asking:
- 🏛️ **Ward Officer & Municipal Team**: Mechanized street sweeping, anti-smog mist cannon deployment along hotspot corridors, stop-work orders for non-compliant construction (C&D dust), commercial diesel generator bans, and freight traffic diversions.
- 🏢 **Housing Society & Apartment RWA**: Common area HEPA air filtration schedules, diesel generator runtime shifts, damp-mop sweeping (prohibiting dry sweeping), leaf blower suspensions, and resident fitness alerts.
- 🏫 **School & Educational Institution**: Cancellation of outdoor physical education (PE) and morning assemblies, zero-idling vehicle zones, school infirmary asthma inhaler verification, and N95 masks for bus commutes.
- 🏥 **Healthcare Facility & Elder Care**: Nebulizer station triage readiness, automated outpatient SMS alerts for COPD/cardiac patients, positive-pressure clean-air sanctuary rooms, and N95 distribution.

### 4. 🔍 100% Traceable Grounded Findings
- **Zero Hallucination Guarantee**: Every claim cites the exact station name, timestamp, metric value, confidence level, and **1-based row index** in the source data.
- Clicking any row link instantly scrolls to and highlights the corresponding observation in the **Traceability & Telemetry Table**.

### 5. 🔄 Previous Brief Comparison (Delta Engine)
- Persists brief history across sessions (`data/briefs-store.json`).
- Automatically computes changes compared to the preceding brief:
  - **AQI Delta** (+/- points and trend: improving, worsening, stable).
  - **Hotspot Evolution**: Newly emerged hotspots, persistent hotspots, and resolved hotspots.
  - **Station Diff Matrix**: Side-by-side progression table.
  - **Sensor Health Deltas**: Tracks whether telemetry completeness improved or dropped.

### 6. 🌐 Multilingual Citizen Advisory & Vulnerable Group Care
- Multi-language generation:
  - **English**
  - **Hindi (हिंदी)**
  - **Spanish (Español)**
  - **Marathi (मराठी)**
  - **Tamil (தமிழ்)**
  - **Bengali (বাংলা)**
- Reading Levels:
  - **Simple / Everyday (Grade 6)**: Clear, jargon-free conversational terms.
  - **General Public Community Advisory**: Civic recommendations.
  - **Sensitive Groups Protocol**: Clinical symptom focus.
- Dedicated Care Cards:
  - 👶 **Children & Schools** (developing lungs, recess guidelines, mask fit).
  - 👵 **Older Adults & Seniors** (thermal inversion morning walk risks, indoor sealing).
  - 🫁 **Sensitive Individuals** (asthma/COPD inhaler access, cardiac safety, clean-air room).
- One-Click **WhatsApp & Telegram Broadcast Formatter** with emoji highlights.
- Styled **Printable Public Health Flyer** & Official Memo.

### 7. 🤖 Interactive "Ask Briefing Studio" AI Assistant
- Conversational Q&A grounded strictly in the current dataset.
- Ask questions like:
  - *"What was the highest peak reading and where was it recorded?"*
  - *"What precautions should primary schools take today?"*
  - *"Are there any sensor freeze or telemetry gaps detected?"*

### 8. 📊 Authentic Real-World Data (No Fake Data)
- Built-in curated official datasets:
  - **CPCB Delhi Winter Smog Episode** (Anand Vihar, Punjabi Bagh, RK Puram CAAQMS stations).
  - **US EPA California Wildfire Smoke Episode** (San Jose, Oakland, Fresno AirNow network).
  - **London Marylebone Road Urban Traffic Canyon** (Defra UK roadside continuous monitoring).
  - **Messy Community Low-Cost Sensor Mesh** (Plantower / PurpleAir logs with real field anomalies).
- **Live OpenAQ Feed Query**: Direct connection to global continuous monitoring stations.

---

## 📁 Project Architecture

```
pwarh2sbpl/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── analyze/route.ts      # Data ingestion, AQI calculation, AI brief generation
│   │   │   ├── compare/route.ts      # Previous brief comparison engine
│   │   │   ├── chat/route.ts         # Conversational Q&A grounded in brief
│   │   │   ├── datasets/route.ts     # Authentic real-world datasets
│   │   │   ├── openaq/route.ts       # Live real-time OpenAQ queries
│   │   │   └── briefs/route.ts       # Persistent brief storage
│   │   ├── globals.css               # Tailwind CSS & print media stylesheets
│   │   ├── layout.tsx                # Accessible root layout with metadata
│   │   └── page.tsx                  # Interactive Next.js single-page application
│   ├── components/
│   │   ├── Header.tsx                # App header, API key trigger, brief history
│   │   ├── DataIngestion.tsx         # File upload, paste raw table, authentic datasets, live feed
│   │   ├── PersonaConfigBar.tsx      # Persona, AQI standard, language, reading level
│   │   ├── KpiMetrics.tsx            # KPI metric cards (AQI, Peak Hotspot, Pollutant, Completeness)
│   │   ├── AirQualityCharts.tsx      # Canvas timeline trend & hotspot ranking bar charts
│   │   ├── DataIntegrityPanel.tsx    # Anomaly audit (freezes, baseline drift, dropouts)
│   │   ├── BriefComparisonModal.tsx  # Change delta modal
│   │   ├── BriefingNoteTab.tsx       # Formal internal executive note with action checklist
│   │   ├── CitizenAdvisoryTab.tsx    # Multilingual advisory with vulnerable population cards
│   │   ├── TraceabilityTable.tsx     # Filterable telemetry audit table with row citations
│   │   ├── AiChatAssistant.tsx       # Grounded interactive AI assistant
│   │   └── ApiKeyModal.tsx           # Google Gemini API key configuration
│   ├── lib/
│   │   ├── aqi-engine.ts             # US EPA and Indian NAQI (CPCB) breakpoint engines
│   │   ├── parser.ts                 # Messy table interpreter, unit normalizer, anomaly auditor
│   │   ├── translator.ts             # Multilingual generator across reading levels
│   │   ├── brief-comparator.ts       # Brief delta and trend comparison
│   │   ├── authentic-datasets.ts     # Verified real-world dataset presets
│   │   ├── gemini.ts                 # Google Gemini client + Grounded Civic Intelligence Engine
│   │   └── storage.ts                # Server-side persistent storage
│   └── types/
│       └── index.ts                  # Comprehensive TypeScript type definitions
├── data/
│   └── briefs-store.json             # Persistent historical briefs store
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+ or v20+ (v24 supported)
- **npm** v9+

### 1. Installation
```bash
npm install
```

### 2. Configure Google Gemini API Key (Optional)
The application includes a comprehensive **Grounded Civic Intelligence Rule Engine** that works immediately without any API key.

To activate Google Gemini for multimodal reasoning and enhanced natural language synthesis:
- Set environment variable:
  ```env
  GEMINI_API_KEY=your_gemini_api_key_here
  ```
- Or click **"Configure Gemini"** in the top navigation bar and enter your key directly. It is saved in your browser's local storage and used securely.

### 3. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm start
```

### 5. Deploy to Vercel ⚡
This project is pre-configured for zero-friction deployment to Vercel:
1. Push this repository to GitHub / GitLab / Bitbucket.
2. Import the project in the [Vercel Dashboard](https://vercel.com/new).
3. (Optional) In **Environment Variables**, add:
   - `GEMINI_API_KEY`: Your Google Gemini API key (users can also provide their own key in the UI).
4. Click **Deploy**. Vercel will automatically build the Next.js App Router project and deploy it on global edge servers.

The application includes built-in serverless storage support (using `os.tmpdir()` and in-memory cache) ensuring zero filesystem errors on Vercel's read-only runtime.

---

## 🔒 Security & Privacy

1. **Client-Side Data Parsing**: Messy CSVs are audited and parsed before sending to analytical endpoints.
2. **API Key Confidentiality**: Keys are stored locally in the user's browser or as environment variables on the server.
3. **Prompt Injection Hardening**: Tabular data is strictly structured with delimiters, schema constraints, and system prompts preventing speculative hallucination.
4. **Sanitized Output**: Citizen advisory and briefing notes are structured safely without raw HTML injection.
5. **Security Headers**: Uses Next.js native security defaults.

---

## ♿ Accessibility (WCAG 2.1 AA)

- **Color Independence**: Every air quality category combines high-contrast color badges with explicit textual names (`Good`, `Moderate`, `Poor`, `Severe`).
- **Semantic HTML**: Fully accessible headings (`<h1>`-`<h3>`), tables with `<th scope="col">`, ARIA labels, and keyboard-navigable tabs.
- **Focus Rings**: Clear visual focus states on interactive elements.

---

## 📄 License
MIT License. Built for civic intelligence and public health impact.
