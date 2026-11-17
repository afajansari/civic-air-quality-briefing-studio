# Workspace Rules: Civic Air Quality Briefing Studio

## 1. Installed Skills & Customizations Library

The agent has access to the full repository of installed skills located at:
- **Primary Installed Skills Path**: `C:\Users\Afaj-Ansari\.gemini\skills`
- **User Skills Path**: `C:\Users\Afaj-Ansari\.agents\skills`
- **Configured Discovery**: Declared in `.agents/skills.json` and `~/.gemini/config/skills.json`.

### Skill Discovery & Progressive Disclosure
1. **Search & Consult**: When addressing tasks involving specialized frameworks, libraries, or architectural patterns, inspect the corresponding skill's `SKILL.md` under `C:\Users\Afaj-Ansari\.gemini\skills\<skill-name>\SKILL.md`.
2. **Key Available Domains in Installed Skills**:
   - **UI & Design Systems**: `shadcn`, `tailwindcss`, `react`, `nextjs`, `lucide`, `design-systems`
   - **3D & Visualizations**: `3d-web-experience`, `threejs`, `webgl`, `canvas-graphics`
   - **Architecture & Performance**: `nextjs`, `api-design`, `caching`, `streaming`, `sse`
   - **Quality & Reliability**: `accessibility-compliance-accessibility-audit`, `zero-trust`, `security`, `vitest`, `jest`, `unit-testing`
3. **Execution Protocol**: Before executing multi-step specialized workflows, review the procedures, examples, and verification steps in the relevant `SKILL.md`.

---

## 2. Workspace Architectural Directives

- **Framework**: Next.js 16.4.6 locked in `package.json`.
- **Routing Engine**: Pages Router (`src/pages/`). All page views reside in `src/pages/index.tsx`, `_app.tsx`, `_document.tsx`, and API routes in `src/pages/api/`.
- **Design System**: shadcn/ui configured for Pages Router (`rsc: false`). Always use semantic Tailwind color tokens (`bg-background`, `bg-card`, `text-foreground`, `border-border`, `text-primary`). Do not hardcode opaque slate shades for backgrounds when semantic tokens apply.
- **3D WebGL Isolation**: Three.js WebGL rendering components (such as `Atmospheric3DChamber.tsx`) must be loaded dynamically with `next/dynamic` and `{ ssr: false }` to guarantee zero SSR hydration mismatches.
- **Telemetry & Edge Caching**: Live Indian CAAQMS data via `/api/live-aqi` enforces a 15-minute ISR cache policy (`s-maxage=900, stale-while-revalidate=300`) and standard CPCB sub-index calculation.
- **Synthetic Audio**: Audio alerts utilize zero-dependency browser Web Audio API, defaulting to muted for accessibility and autoplay policy compliance.
- **Quality Gates**: Every modification must pass `npm test` (all unit and contract tests) and `npm run lint` (ESLint 9 with zero errors and zero warnings).
