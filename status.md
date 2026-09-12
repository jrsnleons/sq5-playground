# Project: Build Status & Handoff

### Current Phase: UI/UX Redesign for the Masses (Minimalist Dark Mode & Clutter Purge)
## Current Step: Complete — Obsidian Precision UI/UX Deployed Across All Modules

## ✅ Completed Improvements & Enhancements
- [x] **UI/UX Redesign (Option 1: Obsidian Precision):** Fully transformed entire application to pitch black (`#000000`) surfaces, card elevations (`#0A0A0A`), hairline borders (`border-white/[0.08]`), Apple-inspired segmented controls, and Next.js / Claude monochrome minimalism.
- [x] **Anti-Slop & Clutter Purge:** Purged redundant technical glossary text from bottom status strip, removed all diffuse neon arcade glows (`shadow-[0_0_...`), eradicated all em dashes across the codebase (Anti-Slop R-02 compliance), and replaced neon accents with functional studio broadcast cues (red MUTE, amber live mix warning, broadcast green/yellow/red metering).
- [x] **Full Screen & Modal Modernization:** Redesigned all views including Digital Console (Faders, Processing, Meters, Routing, FX, Setup, Scenes, IO Patch), Physical Stage Canvas, Inventory Screen & Modals, Auth Modal, Simulations Modal, Custom Node Editor, and Cable Trace HUD to Obsidian Precision.
- [x] **P0 (Critical Audio Fidelity):** Dual signal presence in `signal-flow.ts` and `types.ts` (`rawInputsWithSignal`). Pre-fade IEM sends (`send.preFade === true`) tap raw unmuted input signal, ensuring musician IEM mixes never drop out when FOH mutes a channel.
- [x] **P0 (Audio Fidelity):** Input metering in `FaderStrip.tsx` bound to `rawInputsWithSignal` so channel LED meter ladder displays live physical input signal even when channel is muted.
- [x] **P1 (Console Surface):** Implemented functional 28-band GEQ motorized fader flip on `DigitalConsoleView.tsx` with Page 1 (31.5Hz–630Hz), Page 2 (800Hz–16kHz), ±12 dB faders, and Flat All utility.
- [x] **P1 (Console Navigation):** Restored `ProcessingScreen` and `MetersScreen` in Digital Console navigation sub-bar, and wired channel strip `SEL` double-click directly to Processing.
- [x] **P1 (Surface Ergonomics):** Added Layers [A] through [F] and bank quick-jumps ([1–16], [17–32], [33–48]) to continuous faders surface.
- [x] **P1 (Master Strip):** Wired Master Strip `SEL` button to select Main LR / Mix Master for processing.
- [x] **P1 (Scene Management):** Expanded `recallSceneWithFilter` snapshot restore scope to include DCAs, Main LR level/mute, Matrices, and Mute Groups.
- [x] **P2 (Physical Stage):** Prevented Stage Item Palette from concealing stage items by offsetting default node positions and setting `fitViewOptions={{ padding: 0.25 }}`.
- [x] **P2 (Physical Rules):** Added validation preventing plugging multiple cables into a single physical XLR socket (`PORT_ALREADY_CONNECTED`), and port direction rules rejecting out-to-out and in-to-in (`INVALID_DIRECTION`).
- [x] **P2 (Responsive UI):** Fixed text wrapping, clipping, and overflow in top nav and bottom status strip on tablet portrait (768px).
- [x] **P2 (UX Feedback):** Replaced native blocking `window.confirm()` with accessible custom `ConfirmDialogModal.tsx` and added floating toast notifications for invalid cable connections.
- [x] **P2 (Gear Inspection):** Wired gear photo upload (max 2MB base64), preview, and reset-to-stock system into `NodeDetailModal.tsx` and `simulationStore.ts`.
- [x] **P3 (FX Simulation):** Added interactive parameter sliders (decay/time, pre-delay/feedback, wet mix) and active bypass toggles for all 8 RackExtra FX engines in `FXScreen.tsx`.
- [x] **P3 (Matrix Feeds):** Added interactive source selection ('main-lr' | 'mix'), stereo toggle, fader, and mute controls to Matrix cards in `RoutingScreen.tsx`.
- [x] **P3 (Scratch Defaults):** Created generic default Mixes 1–12 and DCAs 1–8 for scratch mode in `factory.ts`.
- [x] **P3 (DX & Typing):** Added `"typecheck": "tsc --noEmit"` across all packages, verified zero TS errors, and code-split routes via `React.lazy()` to eliminate bundle warnings.
- [x] **P1 (Security & Auth):** Authentic Supabase Authentication backed by PostgreSQL `public.profiles`, with automatic Admin assignment for the initial registrant and strict Guest lockouts for unauthenticated visitors.
- [x] **P1 (User Management & Provisioning):** Added Admin Dashboard & Team tab in Settings (`SetupScreen.tsx`) to provision team accounts (Email + Initial Password + Display Name + Role) using ephemeral Supabase client (`persistSession: false`) to safeguard active admin session. Added PostgreSQL RPC function `admin_delete_user` and RLS policies on `profiles`. Added "Account & Security" tab in Settings for members to self-service change their password via `supabase.auth.updateUser({ password })`.
- [x] **P1 (Mixer Config Restoration & Settings Clean Separation):** Restored pure Allen & Heath SQ-5 mixer configuration screen (`MixerConfigScreen.tsx`) inside the Digital Console (`DigitalConsoleView.tsx` under `Mixer Config`), dedicated to Mix 1-12 Bus Configuration (Aux/Group, Stereo/Mono, Main LR sum), Channels 1-48 Stereo Pairing, Matrices 1-3, Global Aux Send Tap Point Defaults, and 28-Band GEQ Fader Flip. All administrative user provisioning, password management, and rig presets are strictly isolated in the global Settings screen (`SetupScreen.tsx`).


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
