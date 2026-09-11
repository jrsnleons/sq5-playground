# Project — Build Status & Handoff

## Current Phase: Phase 1 & 2 — Foundation, Physical Canvas & Digital Console
## Current Step: Complete & Verified (READY)

## ✅ Completed Steps
- [x] Initialized Git repository on branch `feat/phase-1-foundation-canvas`
- [x] Monorepo npm workspaces configured (`@foh-sim/hardware-profiles`, `@foh-sim/simulation-core`, `@foh-sim/web`)
- [x] Hardware profiles implemented:
  - `sq5.json` (16 local in, 12 out, ST1-ST3, Talkback, AES, SLink 40in/20out, 48 ch, 12 mixes, 3 matrices, 8 DCAs)
  - `ar2412.json` (24 XLR in, 12 out, dSNAKE, Expander, Monitor ports)
  - `stage-items.json` (Full equipment catalog with connector rules & stock references)
  - `church-default.json` (Real church rig preset per MP §16)
  - `scratch-default.json` (Blank stage free-play mode)
- [x] Simulation Core (`@foh-sim/simulation-core`):
  - Pure TypeScript state model & types
  - Validation engine (DI requirement, phantom on dynamic warnings, SLink 2-remote limits, click/comms to FOH alerts)
  - Signal presence propagation graph
  - 7/7 Vitest unit tests passing
- [x] Web Application (`@foh-sim/web`):
  - React 18 + TypeScript + Vite 6 + Tailwind CSS v4
  - TopBar with live SLink network status, scene indicator, and preset switcher
  - LeftRail navigation (Stage, Console, Meters, Scenes, Setup, Help)
  - Physical Patching Canvas with ReactFlow:
    - Custom AR2412 AudioRack faceplate node (24 in / 12 out)
    - Custom SQ-5 rear panel node
    - Custom StageItem node with category icons & connector handles
    - Custom Bézier cable edge with signal-type colors & active signal animation
    - Stage Item Palette with categorized drag-and-drop inventory
    - Equipment Inspector modal with connection status & editable notes
  - Digital Console Surface (SQ-MixPad workflow):
    - 16+1 fader strips with chromatic LED meters, Sel, Mute, PAFL
    - Context-sensitive Master Fader
    - Sends-on-Faders mode with Pre/Post tap point toggles
    - Screens: Home, I/O Patch Matrix, Processing (Preamp/HPF/Gate/4-band PEQ/Comp), Routing, FX (8 stereo engines), Meters & RTA, Scenes (300 slots), Setup (GEQ Fader Flip), and Help/Glossary
  - PWA manifest & Cloudflare Pages SPA `_redirects`
  - Production build passing (`npm run build` succeeds in 1.25s)

## 🔲 Remaining Steps
- [ ] Connect remote Supabase project credentials in `.env.local` when live cloud sync is desired
- [ ] Add Playwright E2E browser test suite for browser automation

## 🗂️ File Tree (current state)
```
/Users/jello/Documents/dev/tech-lwnra/
├── apps/
│   └── foh-sim-web/
│       ├── dist/
│       ├── public/
│       │   ├── _redirects
│       │   ├── favicon.svg
│       │   └── manifest.json
│       ├── src/
│       │   ├── components/
│       │   │   ├── layout/ (TopBar, LeftRail, BottomStatusStrip)
│       │   │   └── modals/ (NoticesModal, EntryModeModal)
│       │   ├── features/
│       │   │   ├── digital/ (FaderStrip, MasterStrip, DigitalConsoleView, screens/*)
│       │   │   └── physical/ (PhysicalCanvas, StageItemPalette, NodeDetailModal, nodes/*, edges/*)
│       │   ├── store/ (simulationStore.ts)
│       │   ├── App.tsx
│       │   ├── index.css
│       │   └── main.tsx
│       ├── package.json
│       ├── tsconfig.json
│       └── vite.config.ts
├── packages/
│   ├── hardware-profiles/
│   │   ├── presets/ (church-default.json, scratch-default.json)
│   │   ├── profiles/ (sq5.json, ar2412.json, stage-items.json)
│   │   ├── src/index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── simulation-core/
│       ├── src/
│       │   ├── __tests__/simulation-core.test.ts
│       │   ├── factory.ts
│       │   ├── index.ts
│       │   ├── signal-flow.ts
│       │   ├── types.ts
│       │   └── validation.ts
│       ├── package.json
│       └── tsconfig.json
├── foh-sq5-simulator-master-prompt.md
├── package.json
├── README.md
├── status.md
└── tsconfig.base.json
```

## 🏗️ Core Architecture Decisions
- **Monorepo Structure:** npm workspaces cleanly separates data profiles, domain logic, and web view.
- **Signal Graph in Pure TS:** Deterministic and fast; can run headless or in test suites without DOM.
- **Local-first Persistence:** Zustand state with full preset and scene recall works out of the box offline.
- **Audio Aesthetic:** Slate-950 dark console theme with authentic color-coded signal paths (Mic: Blue, Inst: Orange, dSNAKE: Green, IEM: Teal, Click/Comms: Yellow).

## ⚠️ User Action Required
- Launch the development server with `npm run dev` to explore the simulator locally at `http://localhost:5173`.
