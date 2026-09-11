# FOH SQ-5 Simulator

A high-fidelity desktop-web simulator for church front-of-house (FOH) sound engineers and trainees, modeling an **Allen & Heath AR2412 stage box (24 in / 12 out)** connected via **dSNAKE Cat5e** to an **Allen & Heath SQ-5 digital console (V1.6.0)**.

Built against official Allen & Heath reference manuals and the [foh-sq5-simulator-master-prompt.md](./foh-sq5-simulator-master-prompt.md) specification.

---

## Features

- **Physical Patching Canvas (Stage View):**
  - Interactive, zoomable, pannable 2D canvas powered by ReactFlow.
  - Logical zones: **STAGE** (sources, instruments, DIs, AR2412) and **FOH/CONSOLE** (SQ-5 local I/O, PA & streaming).
  - AR2412 AudioRack faceplate with 24 XLR inputs, 12 XLR outputs, dSNAKE/Expander/Monitor EtherCon ports.
  - SQ-5 rear panel with 16 local XLR inputs, ST1/ST2/ST3, 12 XLR outputs, AES out, SLink port, USB-B streaming.
  - Bézier curved cable engine with signal-type color coding (Mic=Blue, Instrument=Orange, dSNAKE=Green, Speaker=Grey, IEM=Teal, Click/Comms=Yellow).
  - Collapsible Stage Item Palette with categorized inventory (Vocals, Instruments, DI Boxes, Playback, Click, Comms, Outputs).
  - Equipment Inspector with stock gear previews, connection status, and editable operator notes.

- **Digital Console Surface (SQ-5 / SQ-MixPad Workflow):**
  - Navigation Banner: **Home | I/O | Processing | Routing | FX | Meters | Scenes | Setup | Help**.
  - 16+1 Fader strips with high-density chromatic metering, Sel, Mute (with DCA mute flashing), and PAFL.
  - **Sends-on-Faders Mode:** selecting any Mix (1–12) flips faders to adjust channel send levels with inline Pre/Post fader toggles.
  - Context-sensitive Master Fader on the right (controls Main LR or the active Mix master).
  - **I/O Matrix Patching Screen:** Physical sockets to digital channels 1–48 and bus outputs to physical outputs, with striped visual indication when dSNAKE is unplugged.
  - **Channel Strip Processing:** Documented order (Preamp +48V/Gain/Trim/Pad → HPF → Gate → Insert → 4-band PEQ with interactive curve → Compressor → Delay).
  - **Routing Matrix:** Mix aux sends, Main LR assign, Pan, DCA 1–8 bitmask assignments, Mute groups.
  - **IEM & Click/Comms Isolation:** Prominent warnings if click tracks or comms talkback mics are accidentally assigned to Main LR or audience speakers.
  - **28-Band GEQ Fader Flip:** 3-press cycling (bands 1–14, 15–28, exit).
  - **Scene Management:** Store and recall scene snapshots.
  - **Audio Knowledge Base & Glossary:** Embedded definitions for dSNAKE, Pre-fade, PEQ, DCA, DI boxes, and +48V phantom rules.

---

## Monorepo Structure

```
/
├── apps/
│   └── foh-sim-web/              # React 18 + Vite 6 + Tailwind CSS v4 web application
├── packages/
│   ├── hardware-profiles/        # Data-driven JSON hardware profiles & presets
│   │   ├── profiles/             # sq5.json, ar2412.json, stage-items.json
│   │   └── presets/              # church-default.json, scratch-default.json
│   └── simulation-core/          # Pure TypeScript signal graph, validation rules, state factory
├── foh-sq5-simulator-master-prompt.md # Canonical technical specification
├── status.md                     # Handoff and build status
└── package.json                  # Root npm workspaces configuration
```

---

## Quick Start

### 1. Prerequisites
- Node.js `v20+` or `v24+`
- npm `v10+`

### 2. Installation
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 4. Run Unit Tests
```bash
npm run test
```

### 5. Build for Production
```bash
npm run build
```
Production build artifacts are emitted to `apps/foh-sim-web/dist`.

---

## Deployment (Cloudflare Pages)

The web application is configured for deployment to **Cloudflare Pages** (Free Tier):

1. Connect your GitHub repository to Cloudflare Pages.
2. Configure build settings:
   - **Framework Preset:** `None` or `Vite`
   - **Build command:** `npm run build`
   - **Build output directory:** `apps/foh-sim-web/dist`
3. Single Page Application (SPA) routing is handled automatically by `apps/foh-sim-web/public/_redirects` (`/* /index.html 200`).
4. Custom domains and automatic SSL can be enabled in the Cloudflare Pages dashboard.

---

## Registering New Hardware Profiles

Console and stage-box capabilities are data-driven. To add or update a stage-box model:

1. Create a new JSON file in `packages/hardware-profiles/profiles/your-stagebox.json` conforming to `StageBoxProfile`:
   - Socket IDs, labels, connector types (`XLR-in`, `XLR-out`, `EtherCon`, `TRS`).
   - Transport protocols (`dSnake`, `DX`, `gigaACE`) and sample rate (48 kHz / 96 kHz).
2. Export the profile in `packages/hardware-profiles/src/index.ts`.
3. The validation engine and canvas nodes automatically read port counts and connector definitions from the profile.

---

## License

Private / Internal church audio training resource.
