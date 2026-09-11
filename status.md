# Project — Build Status & Handoff

## Current Phase: Verification, Antislop & Modern Web Audit Complete
## Current Step: Dev Server Running at http://localhost:5173 (ACTIVE)

## ✅ Completed Steps
- [x] Monorepo npm workspaces configured (`@foh-sim/hardware-profiles`, `@foh-sim/simulation-core`, `@foh-sim/web`)
- [x] Full AC-1 through AC-16 automated unit test suite implemented in `@foh-sim/simulation-core`:
  - AC-1: Physical patch -> digital visibility
  - AC-2: DI-required source blocking and DI insertion
  - AC-3: Two-remote SLink limit
  - AC-4: Channel processing order and bounds
  - AC-5: IEM routing (Keys to IEM KEYS, Click to IEM KEYS)
  - AC-6: Click/comms FOH warning
  - AC-7: GEQ Fader Flip (28 bands, cycling, band modification, reset)
  - AC-8: FX Send-Return architecture & return PEQ
  - AC-9: Matrix fed from Main LR post-fade for PA arrays
  - AC-10: Scene recall with Recall Filter (blockPEQ preserves PEQ)
  - AC-11: Invalid / disconnected patch updates state to unavailable
  - AC-12: Node photo system catalog & user override
  - AC-13: Start from scratch initializes blank stage with hardware only
  - AC-14: Preset management JSON export & import
  - AC-15: Editability — deleting instrument cleans up connected cables
  - AC-16: DCA / Mute Group with IEM cuts presence across Main LR and IEM mixes
  - **16/16 Vitest unit tests passing**
- [x] Antislop Code (`/antislop-code`):
  - Removed all obvious narration comments, decorative separators, and empty labels
  - Preserved authentic domain models and architectural rationale
- [x] Antislop Copywriting (`/antislop-copywriting`):
  - Zero generic AI buzzwords (*seamless, elevate, unlock, robust, game-changer, etc.*)
  - Authentic Allen & Heath audio terminology (*Sel, PAFL, Mute, Assign, Pre Fade, dSNAKE, SLink, EtherCon, PEQ, GEQ, DCA*)
- [x] Antislop UI & Human Accessibility (`/antislop-ui`, `/antislop-human`):
  - WCAG AA contrast compliance across all text labels (`text-slate-400` / `text-slate-300` on dark background)
  - Full keyboard accessibility: `:focus-visible` ring outlines on buttons and inputs
  - Modal dialogs support light dismiss (backdrop click) and platform `Escape` key listeners
  - Sliders implemented with full ARIA attributes (`role="slider"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-valuetext`)
  - No random AI purple/blue gradients: authentic pro-audio console color system (Chassis Slate 900/950, Mic Blue, Inst Orange, dSNAKE Green, IEM Teal, Click/Comms Yellow)
- [x] Modern Web Guidance (`/modern-web-guidance`):
  - Dialog semantics with `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
  - High-performance Vite 6 bundling (builds in ~1.23s)

## 🔲 Remaining Steps
- [ ] Connect remote Supabase project credentials in `.env.local` if remote cloud sync is needed
- [ ] Add Playwright browser test spec if automated headless browser testing is desired

## 🗂️ File Tree
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
- **Monorepo:** Clean separation between JSON hardware definitions, headless simulation core, and React web client.
- **Signal Graph in Pure TS:** Deterministic algebraic graph propagation without DSP overhead.
- **WCAG AA Accessibility:** Keyboard navigable with explicit focus styling, ARIA slider semantics, and contrast-checked color pairs.
- **Pro Audio Theme:** Clean vector-styled rack and fader panels matching real hardware without trademark infringement.
