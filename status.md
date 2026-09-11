# Project — Build Status & Handoff

## Current Phase: Phase 1 — Foundation & Physical Patching Canvas
## Current Step: Monorepo & Hardware Profiles Initialization (IN PROGRESS)

## ✅ Completed Steps
- [x] Initialized Git repository on branch `feat/phase-1-foundation-canvas`
- [x] Created root `.gitignore`
- [x] Created implementation plan and verified requirements against `foh-sq5-simulator-master-prompt.md`

## 🔲 Remaining Steps
- [ ] Setup monorepo `package.json` with npm workspaces (`apps/foh-sim-web`, `packages/simulation-core`, `packages/hardware-profiles`)
- [ ] Create hardware profiles (`sq5.json`, `ar2412.json`, `stage-items.json`, `church-default.json`, `scratch-default.json`)
- [ ] Build `simulation-core` package with domain types, signal propagation, and validation rules
- [ ] Add unit tests with Vitest for `simulation-core`
- [ ] Scaffold `apps/foh-sim-web` with Vite, React, TypeScript, Tailwind CSS, `@xyflow/react`, Zustand + Immer
- [ ] Build Physical Patching Canvas with interactive AR2412, SQ-5 rear panel, instruments, and Bézier cables
- [ ] Build Stage Item Palette and Node Details modal
- [ ] Build Digital Console screens and fader surfaces
- [ ] Verification and E2E test scenarios

## 🗂️ File Tree (current state)
```
/Users/jello/Documents/dev/tech-lwnra/
├── .git/
├── .gitignore
├── foh-sq5-simulator-master-prompt.md
└── status.md
```

## 🏗️ Core Architecture Decisions
- **Monorepo:** npm workspaces for zero-config integration between `simulation-core`, `hardware-profiles`, and `foh-sim-web`.
- **Pure TS Core:** `simulation-core` contains zero React/DOM dependencies so all validation, signal path math, and state logic are 100% testable and serializable.
- **Local-first Persistence:** Zustand state with IndexedDB / local storage caching ensures immediate offline usability even before remote Supabase credentials are configured.
- **Dark Console Theme:** Tailored for audio engineers with authentic signal color codes (Mic: Blue, Inst: Orange, dSNAKE: Green, IEM: Teal, Click/Comms: Yellow).

## ⚠️ User Action Required
- None at this stage. Remote Supabase project URL and anon key can be connected when ready via `.env.local`.
