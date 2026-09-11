# Project — Build Status & Handoff

## Current Phase: Verification, Antislop & Modern Web Audit Complete
## Current Step: Dev Server Running at http://localhost:5173 (ACTIVE)

## ✅ Completed Steps
- [x] Monorepo npm workspaces configured (`@foh-sim/hardware-profiles`, `@foh-sim/simulation-core`, `@foh-sim/web`)
- [x] Full AC-1 through AC-16 automated unit test suite + feature tests (18/18 Vitest unit tests passing)
- [x] Canvas Performance: 60fps local dragging using `useNodesState`/`useEdgesState` and memoized components with fine-grained Zustand selectors
- [x] Daisy-Chained Speakers: Front Fills and Subwoofers split into individual units with `IN` and `THRU` handles and signal propagation
- [x] Shure SVX Dual Wireless: SVX288 receiver modeled with dual RF inputs and dual console XLR outputs
- [x] Cable Disconnection: 1-click Unplug buttons in Node Inspector, wide hit-target on cables with floating disconnect badge, and Backspace/Delete keyboard removal
- [x] SQ-MixPad I/O Patch Matrix: Rebuilt into authentic Allen & Heath 2D crosspoint matrix with source banks (SLink/Local/USB), channel banks (1-16/17-32/33-48), live socket signal LEDs, 1:1 auto-patching, and Safe I/O Lockout toggle
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
