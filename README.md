# SQ-5 Playground 🎛️
### Church AV Ministry Audio Training Sandbox

An interactive web-based sandbox and learning playground created specifically for our church's front-of-house (FOH) tech team and worship production volunteers. 

---

> [!NOTE]
> **Internal Ministry Educational Tool**  
> This project is created **strictly as an internal training and educational playground for our church sound volunteers**. It is **not** an official product, commercial release, or replacement for Allen & Heath SQ-5 hardware or SQ-MixPad software. Its purpose is to provide our volunteer sound engineers with a safe, stress-free space to build confidence, understand digital signal flow, and master mixing fundamentals before stepping behind the physical console during live worship services.

---

## 🎯 Purpose & Goals for Our Church Team

Serving on the church sound team can feel intimidating when learning on a live Sunday morning rig. This playground solves that by letting volunteers:

1. **Understand Physical to Digital Signal Flow**:
   - See how stage microphones, acoustic/electric instruments, and DI boxes plug into the stage box (**AR2412 AudioRack: 24 In / 12 Out**).
   - Understand how digital snakes (**dSNAKE Cat5e**) carry multi-channel audio to the **SQ-5** console.
   - Trace inputs through the console's internal routing matrix to house speakers, streaming feeds, and musician in-ear monitors.

2. **Master Sends-on-Faders & Musician Monitor Mixes**:
   - Safely practice flipping faders into Aux / Mix mode to give vocalists and instrumentalists their personal in-ear monitor (IEM) mixes.
   - Learn the critical difference between **Pre-Fade** (musician monitors) and **Post-Fade** (house/streaming effects) to prevent accidental monitor mix sabotage.

3. **Practice Live Problem Solving & Challenges**:
   - Work through guided training simulations created by church audio leads (e.g., Stage Patching 101, Drum DCA Grouping, Feedback Ringing with 28-band GEQ).
   - Test "what-if" scenarios without creating loud feedback or disrupting worship rehearsals.

4. **Zero-Setup & Safe Experimentation**:
   - Runs 100% in any modern web browser with **zero configuration** required.
   - Real-time audio engine, meters, and fader movements run locally at 60–120 FPS.

---

## 🧩 Playground Features

- **Interactive Stage & Patching Canvas (ReactFlow)**:
  - Drag-and-drop vocal mics, guitars, keys, drum mics, playback laptops, and click tracks into stage zones.
  - Realistic XLR and EtherCon cabling engine with color-coded signal lines (Mics, Instruments, dSNAKE, IEMs, Speakers).
  - Live socket validation prevents unsafe connections (e.g., feeding phantom power into active line outs or looping monitor lines).

- **Digital Console Surface (SQ-5 Workflow)**:
  - 16+1 Fader strips with chromatic LED signal/peak meters, channel selects, mutes, and PAFL solo monitoring.
  - Sends-on-Faders for 12 auxiliary mixes with per-channel Pre/Post toggles.
  - 4-band Parametric EQ (PEQ) with interactive filter curve editing.
  - 28-Band Graphic EQ (GEQ) fader flip mode for practicing monitor feedback elimination.
  - DCA groups (1–8) with bitmask mute flashing and master trims.
  - Safety alert system: Warns volunteers if click tracks or talkback mics are accidentally routed to the house speakers.

- **Interactive Training Challenges & Practice Missions**:
  - Pre-loaded practice scenarios for trainees (*Stage Patching 101*, *IEM Independence*, *GEQ Feedback Ringing*, *Drum DCA Grouping*).
  - Floating briefing card on canvas with live task checklists.
  - Admin Challenge Studio: Audio leads can configure custom console setups and author step-by-step challenges for trainees.

- **Local-First Architecture + Optional Cloud Sync**:
  - 0ms audio and fader latency using local browser state (`localStorage` + `Zustand`).
  - Optional Supabase sync for saving church presets, custom scene snapshots, and team-wide training challenges.
  - Built-in Role-Based Access Control (Guest sandbox, Member volunteer, Admin audio lead).

---

## 🏗️ Repository Architecture

```
sq5-playground/
├── apps/
│   └── foh-sim-web/              # React 18 + Vite 6 + Tailwind CSS v4 training app
├── packages/
│   ├── hardware-profiles/        # Stage box & console definitions (AR2412, SQ-5)
│   └── simulation-core/          # Pure TypeScript signal flow engine & validation rules
├── supabase/
│   └── schema.sql                # Optional cloud sync database schema (PostgreSQL + RLS)
├── DEPLOYMENT.md                 # Deployment runbook (Vercel, Netlify, Cloudflare, Docker)
└── package.json                  # Root npm workspaces configuration
```

---

## 🚀 Quick Start (Running Locally)

### 1. Prerequisites
- Node.js `v20+` or `v22+`
- npm `v10+`

### 2. Installation
```bash
git clone git@github.com:jrsnleons/sq5-playground.git
cd sq5-playground
npm install
```

### 3. Launch Development Server
```bash
npm run dev
```
Open **`http://localhost:5173`** in your browser. The training playground will launch immediately in local mode—no database or external services required.

### 4. Run Automated Tests & Type Checks
```bash
npm run test:run     # Runs all 28 Vitest unit & integration tests
npm run typecheck    # Verifies TypeScript safety across all workspaces
```

### 5. Production Build
```bash
npm run build
```
Production assets will be built to `apps/foh-sim-web/dist`.

---

## 🔒 Environment & Cloud Sync (Optional)

The playground runs fully offline by default. To enable team cloud syncing with Supabase:

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Enter your church team's Supabase project credentials in `.env.local`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Run the SQL schema in `supabase/schema.sql` inside your Supabase project's SQL Editor.

*(Note: `.env`, `.env.local`, and any API keys are strictly gitignored to keep credentials private.)*

---

## 📜 Disclaimer & Licensing

This project is an internal educational training tool built for our church worship ministry. All product names, trademarks, and registered trademarks (such as Allen & Heath, SQ-5, AR2412, dSNAKE, and SQ-MixPad) are property of their respective owners and are used here purely for descriptive, non-commercial volunteer training purposes.
