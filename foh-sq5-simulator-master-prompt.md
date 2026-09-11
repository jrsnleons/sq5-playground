# FOH SQ-5 Simulator — Master Prompt & Technical Specification

> **Notes on this extract (not part of the prompt itself):**
> - **V1 scope confirmed:** free-play only, matching this spec — guided-training features (Sunday Morning mode, adaptive difficulty, instructor spectate, badges) stay as disabled extension points (§13), not built in V1.
> - **Real church rig confirmed (§16):** the AR2412 and SQ-5 I/O lists are the actual patch sheets from the church. The spreadsheet labels the stagebox "ar2414" — this is a **mislabel**; the unit is a standard Allen & Heath **AR2412** (24 in / 12 out). All I/O inventories have been verified against the physical patch sheets as of September 2025.
> - **Start from Scratch confirmed (§3):** the simulator offers a blank-stage entry point alongside the church preset — same AR2412 + SQ-5 hardware, but no instruments, mics, cables, or patches pre-placed. The user drags items from a palette onto the canvas.
> - **Editability confirmed (§8):** channel names, input assignments, instruments/mics, output destinations, cable routing, and processing defaults are all user-editable. Hardware model swapping (console/stagebox) is reserved for a future admin-only feature and is not exposed in V1.
> - **Photos confirmed (§7):** every node ships with a built-in stock photo by gear type, replaceable with a user-uploaded photo. A small icon/cover is visible on the canvas node; the full-size image appears in the detail/info panel on click. User uploads stored in Supabase Storage.
> - **IEM system confirmed (§16.3):** the rig runs 7 mono IEM mixes through the AR2412 outputs, using Behringer P1 personal monitors for instrumentalists and Xtuga IEM1200 UHF systems for worship leader and backup vocals.
> - **Click & Comms confirmed (§16.2):** click/metronome tracks and player talkback mics are active inputs routed exclusively to IEM mixes, never to FOH or main outputs.
> - **Multiple presets confirmed (§8):** users can save, load, rename, and export multiple rig configurations as named presets.
> - **Persistence RESOLVED:** Supabase from Day 1. PostgreSQL for structured data (presets, shows, profiles, glossary), Supabase Storage for user-uploaded photos (1 GB free), IndexedDB as offline cache with sync-on-reconnect. See §14.
> - **Tech stack FINALIZED (§14):** React 18+ / TypeScript / Vite 6, Zustand + Immer, ReactFlow (Xyflow), Tailwind CSS v4, Supabase (Auth + DB + Storage), Cloudflare Pages deployment, Vite PWA Plugin for offline support.
> - **Auth confirmed (§14.2):** Supabase Auth with email/password + Google OAuth. Two roles: Admin (manages factory preset, users) and Member (uses simulator, saves own presets).
> - **Deployment confirmed:** Cloudflare Pages (free tier, unmetered bandwidth, native SPA routing, custom domain + SSL).
> - **PWA/Offline confirmed (§14.4):** service worker caches app shell; IndexedDB stores offline state; queued mutations sync to Supabase on reconnect.
> - **Build phases confirmed:** Phase 1 (Physical canvas) → Phase 2 (Digital console basics) → Phase 3 (IEM/routing/scenes) → Phase 4 (Presets/photos/polish). Ship each phase as ready.
> - **Dark theme confirmed:** console-style dark UI with colored signal accents matching real SQ-5/MixPad aesthetic.
> - **Help system confirmed:** interactive tooltips on audio terms + collapsible contextual help panel with glossary.
> - Only the block between **"MASTER PROMPT FOR THE AI APP BUILDER"** and **"END OF PROMPT"** below is meant to be pasted into your AI coding tool (Cursor, Claude Code, Codex, Bolt, Lovable, v0, etc.). Everything above and below that block is reference material for you, not for the builder.

---

## Verified Assumptions & Open Hardware Questions

Read these first. They materially affect implementation and are baked into the master prompt that follows.

- **STAGE-BOX MODEL:** The church's patch sheet labels the unit "ar2414." Allen & Heath's catalogue has no AR2414. The unit is a standard **AR2412 AudioRack**: 24 XLR mic/line inputs + 12 XLR line outputs at 48 kHz over dSNAKE. This prompt is written for the AR2412 and instructs the AI to make the stage-box profile data-driven, so the exact model can be corrected without redesigning the app.

- **SQ-5 REFERENCE:** The SQ Firmware Reference Guide V1.6.0 (SQ-5/6/7/SQ-Rack) is the source of truth for channel counts, processing order, routing, scenes, and I/O.

- **SQ-MIXPAD REFERENCE:** The digital tab targets functional parity with SQ-MixPad workflows (channel select, processing pages, routing matrix, sends-on-faders, scenes, meters, RTA), not a copy of proprietary artwork.

- **V1 SCOPE:** Free-play only, desktop web. Guided scenarios and scored challenges are architected as extension points but are not built in V1. Tablet layouts are anticipated but optional.

### Church-Rig Facts Confirmed (Seeded as the Default Preset)

- **Vocal Microphones:** 5 wired mics (Mic 1–5), 1 lapel/lavalier, 2 wireless handhelds (Shure SVX288/PG28 dual system on SQ local inputs).

- **Instruments (all active):** Electric guitar, acoustic guitar, keys, bass guitar — each with its own dedicated mono DI box. ProPresenter PC audio uses a stereo DI.

- **Drums:** Kick, snare top, snare bottom, tom 1, floor tom, hihats, mono overhead (7 channels).

- **Audience mics:** Stereo pair (Audience L + Audience R) — used as ambient/audience capture. Historically labeled "Choir" on the patch sheet; relabeled here.

- **Click tracks:** Two dedicated click/metronome feeds (Click Keys, Click Drums) routed exclusively to musician IEM mixes, never to FOH.

- **Comms/Talkback mics:** Three musician talkback microphones (Comms Keys, Comms Bass, Comms Drums) for player-to-FOH communication, routed to IEM mixes only.

- **IEM system:** 7 mono in-ear monitor mixes — Worship Leader, Backup Vocals, Acoustic Guitar, Keys, Electric Guitar, Bass, Drums. Hardware: Behringer P1 personal monitors for instrumentalists; Xtuga IEM1200 UHF wireless for worship leader and backup vocalists.

- **Playback:** ProPresenter PC (stereo, via stereo DI to SQ local inputs 1–2), 2 wireless handheld receivers (Shure SVX288/PG28 on SQ local inputs 4–5).

- **Outputs (AR2412):** 7 IEM mixes, front fills (daisy-chained pair), subs (daisy-chained pair), array R, array L.

- **Outputs (SQ-5 local):** Recording L/R (to OSEE recorder), Monitor L/R (streaming mix reference monitors), Stream L/R (to Behringer UMC204HD audio interface → USB → dedicated streaming PC).

- **DI box inventory:** 4 mono DI boxes (one each for electric guitar, acoustic guitar, bass guitar, keys) + 1 stereo DI box (for ProPresenter PC audio).

---

## MASTER PROMPT FOR THE AI APP BUILDER

*Paste everything from this banner through the "END OF PROMPT" marker into your AI coding tool (Cursor, Claude Code, Codex, Bolt, Lovable, v0, etc.).*

You are an AI application-building agent. Build a desktop-web training simulator for a church front-of-house (FOH) engineer. The simulator has two primary tabs:

- **Physical Patching:** Instruments and microphones on a stage, through cables and optional DI boxes, into an Allen & Heath AR2412 stage box, and via a dSNAKE (Cat5e / SLink) link to an Allen & Heath SQ-5 console.

- **Digital Console:** Full digital console routing, strip processing, buses, matrices, FX, and scene management faithful to SQ-5 and SQ-MixPad workflows.

Do not invent SQ-5 or SQ-MixPad features that are not documented by Allen & Heath. When unsure, mirror the closest documented behavior and leave a comment; never fabricate parameter ranges, socket counts, or routing rules.

## §1 Product Goals & Success Criteria

- Teach a volunteer or trainee church FOH operator to:

  - (a) Patch physical stage sources correctly through the AR2412 → SQ-5 chain, including DI boxes, click tracks, comms mics, and IEM outputs.

  - (b) Navigate the SQ-5 workflow (I/O patch, channel processing, buses, FX, matrices, DCA, mute groups, scenes) faithfully to the real console.

  - (c) Understand the IEM monitoring system: which mixes feed which musicians, how click and comms channels are routed only to IEMs and never to FOH.

  - (d) Visually identify physical equipment through attached reference photos and understand what each piece of gear looks like in the real world.

- The user can freely explore both tabs, make patches, tweak processing, route to mixes, save scenes, and see the simulation reflect their choices in real time.

- The user can start from a pre-configured church rig preset or build from a blank stage using the same hardware.

- On completion, the app should feel like a plausible practice ground for someone about to operate a real SQ-5 + AR2412 at their church.

## §2 Verified Hardware Assumptions

Treat these as the reference specification. Encode all limits, counts, and ranges as data (see §15) so a corrected hardware profile can replace them without code changes.

### 2.1 Allen & Heath SQ-5 Console (SQ Firmware Reference Guide V1.6.0)

- 48 input channels; 36 total buses; 12 stereo Mixes (Aux or Group via Bus Config); Main LR; PAFL bus.

- 4 FX Send buses + 8 stereo FX return channels (RackExtra FX). FX engines can be Send-Return, Mix-Return, or Insert.

- 3 stereo matrices, splittable to up to 6 mono; 8 DCA groups; 8 Mute groups.

- 16 local Mic/Line XLR inputs (Gain 0 to +60 dB, -20 dB Pad, +48V phantom, all digitally recalled); ST1/ST2 balanced 1/4" TRS stereo; ST3 unbalanced 3.5 mm; Talkback XLR.

- Local outputs: 12 XLR + 2 balanced 1/4" TRS (A/B) + AES XLR stereo + headphone TRS from PAFL.

- SLink port (EtherCon), three switchable modes: dSnake (48 kHz, up to 40 in / 20 out), DX (96 kHz), and gigaACE.

- USB-B audio streaming: 32x32 @ 48 kHz (16x16 @ 96 kHz).

### Output / Mix-Channel Processing Architecture

- **Mix Channel Processing Order:** Mix External In (Polarity/Trim on Ext In) → Insert → PEQ + GEQ (28-band 1/3 oct, 31 Hz–16 kHz, ±12 dB) → Compressor → Delay → Output patch.

- **FX Return Channels:** PEQ + Pan only.

### Processing Parameter Ranges (V1.6.0 Reference Guide)

| **Processing Block** | **Operational Ranges & Options** |
| --- | --- |
| **Preamp** | Gain 0 to +60 dB, Pad -20 dB, Phantom +48V, Trim -24 to +24 dB |
| **HPF** | 20 Hz to 2 kHz, slopes: 12, 18, 24 dB/oct (Butterworth) |
| **Gate** | Attack 50 μs to 300 ms, Hold 10 ms to 5 s, Release 10 ms to 1 s, Threshold -72 to +18 dB, Depth 0 to 60 dB. Sidechain filters: HPF 20 Hz–5 kHz, BPF 120 Hz–10 kHz, LPF 120 Hz–20 kHz |
| **PEQ** | 4 bands 20 Hz to 20 kHz ±15 dB; bands 1 & 4 Shelf/Bell/HPF-LPF; bands 2 & 3 Bell. Width (Q): 1.5 oct to 1/9 oct |
| **Compressor** | Attack 30 μs to 300 ms, Release 50 ms to 2 s, Ratio 1:1 to ∞:1, Threshold -46 to +18 dB, Make-up gain 0 to 18 dB. Peak/RMS detection, Soft-knee option, Parallel compression (-∞ to 0 dB), Sidechain filter matches Gate filter options |
| **Delay** | Input channel: 0.00 to 341.00 ms; Mix channel: 0.00 to 682.00 ms |
| **GEQ** | 28 bands (31 Hz–16 kHz, 1/3 oct) ±12 dB constant Q. Frequencies (28): 31, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1k, 1.25k, 1.6k, 2k, 2.5k, 3.15k, 4k, 5k, 6.3k, 8k, 10k, 12.5k, 16k Hz |
| **Direct Out** | -∞ to +10 dB; tap points: Post-Preamp, Post-HPF, Post-Gate, Post-Insert Return, Post-PEQ, Post-Comp, Post-Delay. Follow options: Follow Fader, Follow Mute, Follow DCA |

### 2.2 Allen & Heath AR2412 Stage Box

- 24 balanced XLR mic/line inputs with remote preamps controllable from console.

- 12 balanced XLR line outputs at 48 kHz.

- dSNAKE connection over EtherCon Cat5e (locking), maximum 100 m cable length.

- Expander port (for daisy-chaining an AB168 or AR84) and dedicated ME Monitor port.

- Maximum of 2 remote dSNAKE expanders connected to the SQ SLink port.

## §3 Simulator Entry Modes

The simulator supports two entry modes, selectable from a launch screen on first load or via the top bar menu at any time.

### 3.1 Church Rig Preset (Default)

Loads the pre-configured church rig defined in §16. All instruments, mics, DI boxes, cables, and patches are pre-placed on the canvas and pre-routed in the digital console. The user can immediately explore, modify, or learn from the existing configuration.

### 3.2 Start from Scratch

Loads the same physical hardware (AR2412 stage box + SQ-5 console) onto the canvas, but with:

- **Empty stage:** No instruments, microphones, DI boxes, monitors, or speakers pre-placed. The canvas shows only the AR2412 and SQ-5 hardware.

- **No cables:** No physical connections between any devices.

- **No digital patches:** All I/O patch grids are blank. No channel names, no bus assignments, no processing applied.

- **Stage Item Palette:** A draggable palette/toolbar is available containing all instrument and equipment types the user can place:
  - Microphones (dynamic, condenser, lavalier, wireless receiver)
  - Instruments (electric guitar, acoustic guitar, bass guitar, keys/keyboard, drum kit pieces)
  - DI boxes (mono passive, mono active, stereo passive, stereo active)
  - Click/metronome sources
  - Comms/talkback mics
  - Speakers (array, sub, fill, monitor wedge)
  - IEM transmitters/receivers
  - Playback sources (PC, laptop, media player)
  - Cables (XLR, 1/4" TS, 1/4" TRS, Cat5e/EtherCon, 3.5 mm)

- The user builds their rig from zero by dragging items onto the stage, naming them, connecting cables, and patching digitally.

### 3.3 Switching Between Modes

- A "Load Preset" action lets the user switch from scratch to the church preset at any time, with a confirmation warning that current work will be replaced.
- A "Clear All" action resets back to scratch mode, with confirmation.
- The user can also save their current scratch configuration as a named preset (see §8).

## §4 Overall App Architecture & Shell Layout

- **Top Bar:** App title, current Show/Scene name, SLink-status pill (AR2412 Connected / Disconnected / Firmware Mismatch), Reset button, Preset selector dropdown, Show/Scene quick menu.

- **Left Rail (Hamburger on narrow screens):** Stage / Console / Meters / Scenes / Setup / Help navigation.

- **Bottom Status Strip:** Persistent status indicators and hover tooltips explaining sound engineering terms (Post-PEQ, dSNAKE, DCA, Pre-fade, etc.).

## §5 Physical Patching Tab — Canvas & Patchbay Interaction

### 5.1 Canvas Model

The Physical Patching tab is an infinite, pannable, zoomable 2D canvas (patchbay/whiteboard), not a fixed page. Implement with SVG (or SVG-over-Canvas hybrid) so every port, device, and cable is a real, hit-testable, accessible node.

- **Pan:** Click-drag empty canvas, hold Space + drag, or middle-mouse drag (optional inertia).

- **Zoom:** Mouse wheel zooms toward cursor; Ctrl/Cmd +/- and pinch gesture support. Zoom range 25% to 300%. Include a "Frame All" shortcut button.

- **Grid:** Subtle dot-grid; optional snap-to-grid; ensure devices never illegally overlap.

- **Minimap (Bottom-Right):** Overview of layout + draggable viewport rectangle for fast navigation when zoomed in.

- **Logical Zones:** Divided by a soft vertical label: *STAGE* on the left (sources, instruments, DI boxes, stage box) and *FOH/CONSOLE* on the right (SQ-5 local sockets, PC/USB playback, active outputs). The dSNAKE Cat5e visibly bridges across these zones.

### 5.2 Devices as Draggable Rack Units

Each device is represented as a rounded rack-panel card with a title bar (name, type icon, drag handle, node photo icon/cover) and realistic hardware faceplate layouts:

- **AR2412:** Top row = 24 female XLR inputs (1–24); bottom row = 12 male XLR outputs (1–12); EtherCon dSNAKE, Expander, and Monitor ports on the right.

- **SQ-5 Rear Panel:** 16 XLR mic inputs, ST1/ST2 TRS, ST3 3.5 mm, 12 XLR + 2 TRS (A/B) outputs, AES XLR out, SLink EtherCon port, USB-B, Talkback XLR, footswitch jack.

- **Microphones:** Discrete icons/cards with male XLR tails. Node photo icon shows what the mic looks like.

- **DI Boxes:** 1/4" input(s) + Thru jack + male XLR output(s). Stereo DI boxes show dual input/output pairs.

- **Speakers / Subs / Fills:** Female XLR input + Link/Thru output for daisy-chaining.

- **IEM Transmitters:** Female XLR input (from stagebox output) + wireless output indicator.

- **Wireless Mic Receivers:** Antenna indicator + male XLR output tail. Display receiver model name.

- **Playback Sources (PC/Laptop):** 3.5 mm or 1/4" TRS output(s). For stereo DI setups, show dual outputs.

- **Click/Metronome Sources:** Output jacks with "click" icon. Visually distinct from instruments.

- **Comms/Talkback Mics:** Small mic icon, male XLR tail. Visually distinct from vocal mics (different color or badge).

- **Port Rendering & Color Coding:** Visual SVG connectors rendered to reflect physical types (XLR 3-pin circular; TRS/TS ring-tip jack; EtherCon squared network jack). Color-coded by signal:

  - Mic/Line: Blue

  - Instrument (Hi-Z/Line): Orange

  - Network / dSNAKE: Green

  - AES Digital: Purple

  - Speaker / Line Out: Grey

  - IEM Feed: Teal

  - Click/Comms (IEM-only): Yellow

  Hovering any port elevates it and displays connection info.

### 5.3 Stage Item Palette

A collapsible side panel (left or bottom) provides a categorized inventory of draggable equipment. Items are organized by category:

- **Vocals & Speech:** Dynamic Mic, Condenser Mic, Lavalier/Lapel, Wireless Receiver
- **Instruments:** Electric Guitar, Acoustic Guitar, Bass Guitar, Keyboard/Keys, individual drum pieces (Kick, Snare, Tom, Floor Tom, Hi-hat, Overhead, etc.)
- **Signal Processing:** Mono DI Box (Passive), Mono DI Box (Active), Stereo DI Box (Passive), Stereo DI Box (Active)
- **Playback & Click:** PC/Laptop Source, Click/Metronome Source
- **Communication:** Comms/Talkback Mic
- **Outputs:** Array Speaker, Subwoofer, Front Fill, Monitor Wedge, IEM Transmitter
- **Cables:** XLR, 1/4" TS, 1/4" TRS, 3.5 mm, Cat5e/EtherCon

Each palette item shows a stock photo thumbnail and name. Drag-and-drop onto the canvas to place.

## §6 Digital Console Tab — SQ-5 / SQ-MixPad Workflow

### 6.1 Global Screen Keys

Screen navigation banner: **Home | I/O | Processing | Routing | FX | Meters | Scenes | Setup | Utility**

Persistent top elements: Selected-channel indicator, current/next Scene names, SLink pill (Connected / dSnake / DX / gigaACE), I/O Port pill (V1: "Not fitted"), master fader, and PAFL LED bar.

### 6.2 Fader-Strip Surface & Channel Strips

- 16 + 1 fader strips × 6 layers (A–F). Each strip includes: Sel, Mute, PAFL, colored LCD scribble-strip label, chromatic-metering LED bar, and peak LED.

- **Drag-and-Drop Strip Assign:** Assign any Input, Mix, FX Send/Return, DCA, Mute Group, MIDI strip, or Main LR onto any physical strip or layer.

- **Layer Buttons A–F:** Quick layer switching; master strip on the right is context-sensitive (LR when no mix selected; selected mix master when a Mix key is active).

- **Mix Keys:** LR, Mix 1–12, FX 1–4. Activating a mix key flips faders into "sends-on-faders" mode with inline Pre/Post/Assign indicators.

- **Documented Button Combinations:**

  - Assign + Sel: Toggle channel assignment to selected mix.

  - Pre Fade + Sel: Toggle pre/post fader tap point.

  - CH to ALL Mix: Interrogate all mix sends for the currently selected channel.

### 6.3 Home Screen

First screen on boot. Displays current/next Scene name, active SLink status, system clock, and links to Brightness, Lock Console, Change User, and Shut Down (Lock and Shut Down simulated as non-destructive no-ops in V1).

### 6.4 I/O Screen — Patching Matrix

Implement complete patch grids matching SQ firmware:

- **Inputs → Input Channel:** Physical sockets (Local, SLink, USB, I/O Port) patched to channels 1–48.

- **Inputs → Mix Ext In:** Sockets to any Mix external input (bypasses channel processing).

- **Outputs → Direct Outs:** Any input channel direct out tapped to any physical socket.

- **Outputs → Mix Outs:** LR / Aux / Group / Matrix to any physical output socket.

- **Outputs → Rack FX:** FX return wet output tapped directly to physical outputs.

- **Outputs → Listen Out:** PAFL / Talkback / Listen bus to physical sockets.

- **Tie Lines:** Direct point-to-point socket patching without internal processing.

### 6.5 FX Screen

- 8 stereo FX engines displaying slot number, loaded FX unit name, and mode: Send-Return (default), Mix-Return, or Insert.

- **FX Library (Factory + User):** RackExtra families: Spatial Modelling Reverb (Classic/Hall/Room/EMT), Stereo Tap Delay, ADT Doubler, Chorus, Symphonic Chorus, Flanger, MOO 12-Stage Phaser, Gated Verb. Add-on RackFX metadata: MultiBD Comp, DynEQ4, De-Esser, Bucket Brigade, Echo, Hypabass.

- Dedicated controls: Wet/dry balance, PEQ on return, PAFL, Mute, and "FX Screen Follow Sel" preference.

### 6.6 Meters Screen

- Overview tabs: Input meters, FX meters, Mix meters, USB streaming meters.

- RTA display: 2 × 31-band 1/3-octave stereo or 61-band 1/6-octave mono analyzer. Tap points: PAFL / Selected Channel / Fixed Bus.

- Chromatic channel metering on strips follows highest-active frequency band by default; fully customizable per V1.6.0.

### 6.7 Scenes Screen (Scene Manager)

- Two operating modes: **All Scenes** (300 slots) and **Cue List** (playlist with insert, reorder, repeat, renumber).

- Per-scene parameters: Name, Crossfade time, Recall Filter (Input/FX, Mix, Other), and contents indicator.

- Side pane for Global Filters and Channel Safes.

- **Scene Storage Scope:** Routing, stereo linking, preamp values, channel processing, mix assigns, levels, pan, mutes, DCAs, strip layouts, names/colors, ganging, FX units, and soft assignments.

- **Show File Scope:** All 300 scenes, cue list, libraries, bus configuration, clock source, sample rates, network bridge, surface preferences. Persisted via Supabase (primary) with IndexedDB offline cache; JSON import/export also supported. See §14.3 for schema and §14.4 for offline strategy.

### 6.8 Setup & Utility Screens

- **Setup Sub-tabs:** Strip Assign, Mixer Config (Input stereo pairing, Mix stereo/mono, Bus Config auxes vs. groups), Soft Controls (8 SoftKeys with color assignments: Mute, PAFL, DCA Spill, Tap Tempo, Scene recall/step, Talkback, MMC/MIDI).

- **Utility Sub-tabs:** Signal Generator (Pink noise, White noise, Sine sweep), Automatic Mic Mixer (AMM - up to 2 × 24 channels / 48 channels total), Diagnostics, Audio Clock synchronization.

## §7 Node Image & Photo System

Every equipment node on the physical patching canvas supports an attached reference image so operators can learn to visually identify real gear.

### 7.1 Stock Photos

- Each equipment **type** (e.g., "Dynamic Microphone," "Mono DI Box," "AR2412 Stage Box," "Behringer P1 IEM") ships with a built-in stock reference photo.
- Stock photos are bundled as static assets in the app build. They are generic representations of the gear category, not brand-specific marketing photos.
- When a new item is placed on the canvas (from the palette or the church preset), it receives the stock photo for its equipment type automatically.

### 7.2 User-Uploaded Photos

- Any node's photo can be replaced with a user-uploaded image (JPEG, PNG, WebP; max 2 MB).
- Upload is accessible via the node's detail/info panel (click or right-click the node → "Change Photo").
- A "Reset to Default" button restores the stock photo.
- Uploaded photos are persisted alongside the preset/show file. *(⚠ persistence rides on whichever storage layer is chosen — see §14)*

### 7.3 Display Behavior

- **Canvas Node (icon/cover):** Each node on the canvas displays a small square thumbnail (icon or cover image) in its title bar or as a badge overlay. This gives a quick visual reference without cluttering the canvas.
- **Detail/Info Panel (full view):** Clicking or selecting a node opens a side panel or modal showing:
  - Full-size photo (stock or user-uploaded)
  - Equipment name and type
  - Make/model (if specified)
  - Connection status and patched destinations
  - Editable fields (name, photo, notes)

### 7.4 Photo Data Model

```typescript
interface NodePhoto {
  source: "stock" | "user";
  stockPhotoId?: string;        // references bundled asset by equipment type
  userPhotoDataUrl?: string;    // base64 data URL for user uploads
  userPhotoFileName?: string;   // original filename for reference
  lastModified?: string;        // ISO 8601 timestamp
}
```

## §8 Editability & Preset Management

### 8.1 Editable Properties

The following properties are user-editable at any time in both Physical and Digital tabs:

| **What** | **Where** | **How** |
| --- | --- | --- |
| **Channel/source names** | Physical tab (node label), Digital tab (scribble strip) | Double-click to inline edit; syncs across both tabs |
| **Input assignments** | Physical tab (drag cable to different socket) | Unplug and re-patch; digital routing updates accordingly |
| **Add/remove instruments & mics** | Physical tab (palette drag-and-drop or right-click → Delete) | Removing a connected source warns about downstream orphaned patches |
| **Add/remove output destinations** | Physical tab (palette) and Digital tab (mix/matrix routing) | Adding a speaker/IEM creates a canvas node; removing warns about orphaned bus assignments |
| **Cable routing** | Physical tab (click-drag between ports) | Re-patching is non-destructive; old cable is removed, new cable replaces |
| **Processing defaults** | Digital tab (channel strip processing) | All PEQ, gate, compressor, delay, GEQ parameters freely editable per channel |
| **Node photos** | Physical tab (node detail panel) | Upload, replace, or reset to stock |
| **Node notes/annotations** | Physical tab (node detail panel) | Free-text notes field per node for operator reminders |

### 8.2 Non-Editable in V1 (Future Admin Feature)

- **Hardware model swapping** (e.g., changing from AR2412 to a different stagebox, or from SQ-5 to SQ-6) is not exposed to regular users. This is reserved for a future admin-only "Rig Builder" feature behind a feature flag `ADMIN_RIG_BUILDER=false`.

### 8.3 Preset Management

Users can save and manage multiple named rig configurations:

- **Save Preset:** Captures the complete state — all physical placements, cable connections, digital routing, processing settings, channel names, node photos, and scene data — into a named preset.
- **Load Preset:** Replaces the current state with a saved preset (with confirmation warning).
- **Rename / Delete Preset:** Standard CRUD operations on saved presets.
- **Export / Import Preset:** JSON file download and upload for sharing presets between browsers or users.
- **Church Rig Preset:** The default preset (§16) is read-only and always available as a "factory reset" option. It cannot be overwritten but can be loaded, modified, and saved under a new name.
- **Preset Metadata:**

```typescript
interface PresetMetadata {
  id: string;
  name: string;
  description?: string;
  createdAt: string;       // ISO 8601
  lastModifiedAt: string;  // ISO 8601
  isFactoryPreset: boolean;
  schemaVersion: number;
}
```

## §9 Domain & State Model

The entire simulation state must be completely deterministic, serializable, and free of unmanaged side effects:

```typescript
interface SimulationState {
  hardware: HardwareProfile;
  entryMode: "church-preset" | "scratch";
  physical: {
    stageItems: StageItem[];     // mics, instruments, DIs, monitors, IEM tx, click sources, comms mics
    sockets: Socket[];           // every physical connector in the world
    cables: Cable[];             // endpointA, endpointB, type
    stageBox: {
      model: "AR2412";
      connectedToSQ: boolean;
      expanderPort?: DeviceConnection;
      monitorPort?: DeviceConnection;
    };
    console: {
      model: "SQ-5";
      slinkMode: "dSnake" | "DX" | "gigaACE";
    };
  };
  digital: {
    ioPatch: IOPatchMatrix;
    channels: InputChannel[48];
    mixes: MixChannel[12];       // aux/group configurable
    mainLR: MixChannel;
    matrices: MatrixChannel[3..6];
    fxEngines: FXEngine[8];
    dcas: DCA[8];
    muteGroups: MuteGroup[8];
    pafl: PAFLBus;
    talkback: TalkbackBus;
    sigGen: SignalGeneratorState;
    softkeys: SoftKey[8];
    stripAssign: LayerAssignments[6];
    ganging: ChannelGang[];
    scene: { currentSceneId: number; nextSceneId: number };
    scenes: Scene[300];
    cueList: Cue[];
    libraries: LibraryCollections;
    show: ShowMetadata;
    session: {
      selectedChannelId: string;
      selectedMixId: string;
      activeScreen: ScreenId;
      layer: "A" | "B" | "C" | "D" | "E" | "F";
    };
  };
  nodePhotos: Record<string, NodePhoto>;  // keyed by stageItem id
  presets: {
    activePresetId: string;
    savedPresets: PresetMetadata[];
  };
}
```

Every object must be JSON-serializable and re-loadable. Include a schemaVersion field for forward compatibility.

## §10 Simulation Behavior (State, Not DSP)

- **Signal Presence Propagation:** A channel is "receiving signal" if:

  - Its source is patched (a connected local SQ socket, or an AR2412 socket validly connected to a stage source with the AR2412 linked to SLink).

  - Channel Mute is OFF.

  - No DCA it belongs to is muting it.

  - At least one destination mix has it assigned. Presence at each node is computed dynamically from upstream states.

- **IEM-Only Channel Routing:** Click and comms channels propagate signal presence only through their assigned IEM aux mixes. The simulator must visually distinguish IEM-only signal paths (e.g., teal trace color) from FOH paths and warn if a click or comms channel is accidentally routed to Main LR, arrays, subs, or fills.

- **Fader & Level Math:** Sum levels in dB, clamped to range [-∞, +10 dB]. No heavy DSP audio rendering required.

- **Patch Continuity:** Unplugging a physical cable marks dependent digital patches as "patched but unavailable" (striped visual styling); reconnecting restores active flow automatically.

- **Scene Recall:** Modifies stored state keys while strictly respecting Global Filters, Recall Filters, Safes, and Ganging rules.

- **DCA / Mute Group Semantics:** Muting a DCA flashes individual member mute buttons and cuts output presence without altering local mute switch states.

## §11 System Validation Rules

### Physical Tab Rules

- **Allowed:** Source → matching cable type → matching destination socket.

- **Warning (Allowed with Warning Flag):** Dynamic mic plugged into a channel with +48V phantom power active; unbalanced 1/4" TS cable connected via adapter; passive DI cable run exceeding 30 meters.

- **Blocked (Rejected with Explicit Reason):**

  - 1/4" TS plug straight into an XLR jack without adapter.

  - Connecting a 3rd dSNAKE remote expander to SLink.

  - Plugging Cat5e into an analog XLR jack.

  - Plugging an instrument requiring a DI box straight into an XLR mic input without a DI.

- **SLink Link Validation:** The AR2412 → SQ-5 signal path is only valid when an EtherCon Cat5e cable connects the AR2412 dSNAKE port to the SQ-5 SLink port.

### Digital Tab Rules

- No routing to disconnected or unlinked devices (rendered with grey stripes).

- Enforce maximum of 2 dSNAKE remote units per SLink port in dSNAKE mode.

- Switching a mix between Aux and Group mode warns about downstream bus reassignments; reallocates keys in order (auxes low-numbered, groups following).

- Splitting a stereo Matrix to mono exposes the secondary mono matrix while preserving existing configuration.

- Activating +48V phantom power on an active live channel triggers a simulated brief mute cool-down period.

- GEQ Fader Flip is only available when a Mix is selected and its GEQ module is inserted.

- FX returns can be strip-assigned, but are hidden unless the corresponding engine is set to Mix-Return.

### IEM & Click/Comms Routing Rules

- **Click channels** (Click Keys, Click Drums) should only be routed to IEM aux mixes. If the user routes a click channel to Main LR or any speaker output, display a prominent warning: "Click/metronome channels are typically routed to IEM mixes only, not to FOH speakers."

- **Comms channels** (Comms Keys, Comms Bass, Comms Drums) follow the same rule: warn if routed to FOH outputs.

- These are warnings, not hard blocks — the user may have a legitimate reason to override.

## §12 UX Principles (SQ-MixPad-Informed, Non-Infringing)

- Follow SQ-MixPad's high information density: bank-of-8 fader overview, sends-on-faders workflow, select-then-edit paradigm, perimeter screen buttons, and master strip on the right.

- Use Allen & Heath's documented naming: Sel, PAFL, Mute, CH to ALL Mix, Assign, Pre Fade, Copy, Paste, Reset, In.

- Do not copy proprietary artwork or graphic assets; emulate clean functional vector controls with SVG and Tailwind styling.

## §13 Extensibility for Future Training Modes

Architect (but leave disabled in V1 via feature flag `MODE_GUIDED=false`) the following training subsystem:

- **ScenarioEngine:** Subscribes to simulation state changes; delivers localized instructions, step verification predicates (pass/fail/pending with diagnostic feedback), progressive hints, mistake penalties (+48V armed on passive mic, invalid patch), scoring algorithms, and step progression.

- **ScenarioAuthoring:** Standardized JSON schema specifying initial rig state, expected physical patches, digital routing configurations, acceptable tolerance bands, and step checkpoints.

- **ProgressStore:** Tracks completed training modules, personal best scores, and user mistake logs.

Architect (but leave disabled in V1 via feature flag `ADMIN_RIG_BUILDER=false`) the following admin subsystem:

- **RigBuilder:** Allows admin users to swap hardware models (console, stagebox), change socket counts, and define custom hardware profiles. Regular users see only the fixed AR2412 + SQ-5 hardware.

## §14 Technical Architecture (Finalized)

### 14.1 Core Stack

| **System Concern** | **Decision & Rationale** |
| --- | --- |
| **Framework** | React 18+ with TypeScript. Rich component ecosystem for complex, nested audio UIs. |
| **Build Tool** | Vite 6. Fast HMR, native TypeScript, optimized production builds. |
| **State Management** | Zustand with Immer middleware. Single normalized store, deterministic and serializable. Lightweight with built-in DevTools. |
| **Signal Graph Core** | Pure TypeScript package (`simulation-core`) with entities and memoized selectors. Zero framework dependencies; fully unit-tested in isolation. |
| **Canvas UI & Cabling** | ReactFlow (Xyflow). Purpose-built for node-based editors with draggable nodes, edges (cables), interactive ports, pan/zoom, and minimap out of the box. Custom SVG edge renderers for realistic cable sag using cubic Bézier curves. |
| **Patch Matrix** | Virtualized grid (e.g., react-window) with sticky header rows and sticky left channel column for fluid 48×48 matrix navigation. |
| **Controls (Faders/Knobs)** | Custom accessible components supporting keyboard arrows, mouse drag, and scroll wheel fine-tuning, with ARIA slider role bindings. |
| **Styling** | Tailwind CSS v4. Utility-first, dark theme by default (console-style dark UI with colored signal accents matching SQ-5/MixPad aesthetic). |
| **Database** | Supabase (PostgreSQL). Auth, DB, Storage, and Realtime in a single service. Free tier: 50K MAU, 500 MB DB, 1 GB file storage. |
| **Auth** | Supabase Auth with email/password + Google OAuth. Two roles: Admin (manages factory preset, users) and Member (uses simulator, saves own presets). |
| **File Storage** | Supabase Storage. User-uploaded equipment photos (max 2 MB each). Stock photos bundled as static WebP assets (≤200 KB each). |
| **Offline / PWA** | Vite PWA Plugin (Workbox service worker). Cache app shell and stock assets; IndexedDB for offline state; queued Supabase mutations sync on reconnect. |
| **Deployment** | Cloudflare Pages. Free tier: unmetered bandwidth, 500 builds/month, native SPA routing via `_redirects`, free custom domain + SSL. |
| **Unit Testing** | Vitest. Fast, Vite-native, TypeScript-first. |
| **E2E Testing** | Playwright. One test per acceptance criterion (AC-1 through AC-16). |
| **Monorepo** | npm workspaces (zero-config). `/apps/foh-sim-web` + `/packages/simulation-core` + `/packages/hardware-profiles`. |
| **Help System** | Interactive tooltips on audio terms + collapsible contextual help panel with glossary populated from Supabase `glossary` table. |
| **Optional Audio** | Web Audio API used strictly for Signal Generator and live RTA visualization behind feature flags. |

### 14.2 Authentication Flow

The first user to sign up is auto-assigned the `admin` role. Subsequent users default to `member`. Admins can promote members via a settings panel.

```
Landing Page
    │
    ├── [Sign In] ──► Supabase Auth (email/pw or Google OAuth)
    │                       │
    │                       ▼
    │               Profile exists?
    │               ├── Yes ──► Load user presets ──► Simulator
    │               └── No  ──► Create profile (role: member) ──► Simulator
    │
    └── (Guest Mode is NOT available in V1)
```

### 14.3 Supabase Schema

#### Tables

```sql
-- Users (managed by Supabase Auth, extended with profile)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Presets (saved rig configurations)
CREATE TABLE presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_factory BOOLEAN NOT NULL DEFAULT false,
  state_json JSONB NOT NULL,          -- full SimulationState snapshot
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Shows (SQ-5 show files — scenes, cue lists, libraries)
CREATE TABLE shows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preset_id UUID NOT NULL REFERENCES presets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  show_json JSONB NOT NULL,           -- 300 scenes, cue list, libraries
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Node photos (metadata — actual files in Supabase Storage)
CREATE TABLE node_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preset_id UUID NOT NULL REFERENCES presets(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,              -- references stageItem.id in the preset
  source TEXT NOT NULL CHECK (source IN ('stock', 'user')),
  stock_photo_id TEXT,                -- references bundled asset filename
  storage_path TEXT,                  -- Supabase Storage path for user uploads
  original_filename TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Glossary terms (for the help/tooltip system)
CREATE TABLE glossary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term TEXT NOT NULL UNIQUE,
  short_definition TEXT NOT NULL,     -- tooltip text
  long_definition TEXT,               -- help panel detail
  category TEXT,                      -- e.g., 'routing', 'processing', 'hardware'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### Row-Level Security (RLS)

```sql
-- Presets: users see their own + factory presets
ALTER TABLE presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own presets and factory presets"
  ON presets FOR SELECT
  USING (user_id = auth.uid() OR is_factory = true);

CREATE POLICY "Users can insert own presets"
  ON presets FOR INSERT
  WITH CHECK (user_id = auth.uid() AND is_factory = false);

CREATE POLICY "Users can update own presets"
  ON presets FOR UPDATE
  USING (user_id = auth.uid() AND is_factory = false);

CREATE POLICY "Users can delete own presets"
  ON presets FOR DELETE
  USING (user_id = auth.uid() AND is_factory = false);

-- Admins can manage factory presets
CREATE POLICY "Admins can manage factory presets"
  ON presets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

#### Storage Buckets

```
equipment-photos/
  ├── stock/                  # Pre-populated stock photos (public read)
  │   ├── dynamic-mic.webp
  │   ├── condenser-mic.webp
  │   ├── mono-di-box.webp
  │   ├── stereo-di-box.webp
  │   ├── ar2412.webp
  │   ├── sq5.webp
  │   ├── behringer-p1.webp
  │   ├── xlr-cable.webp
  │   └── ...
  └── user/{user_id}/         # User uploads (private, scoped by auth)
      ├── {uuid}.webp
      └── ...
```

### 14.4 Offline / PWA Strategy

The app functions as an installable Progressive Web App with full offline capability:

1. **App shell** cached by service worker (Vite PWA Plugin / Workbox). After first load, the simulator works without internet.
2. **Active session state** persisted to IndexedDB via Zustand `persist` middleware — survives browser close and offline periods.
3. **Sync layer** detects online/offline status:
   - **Online:** reads/writes directly to Supabase, mirrors to IndexedDB.
   - **Offline:** reads/writes to IndexedDB only, queues mutations.
   - **Reconnect:** replays queued mutations to Supabase with last-write-wins conflict resolution per preset.
4. **Stock photos** cached by service worker after first load.
5. **User-uploaded photos** cached in IndexedDB as blob URLs for offline access.

### 14.5 Deployment Configuration (Cloudflare Pages)

```
Framework Preset:   Vite
Build Command:      npm run build
Output Directory:   dist
SPA Routing:        public/_redirects containing "/* /index.html 200"
Custom Domain:      Configured via Cloudflare Pages dashboard (free SSL)
```

## §15 Data-Driven Hardware Profiles

Encode console and stage-box capabilities into modular, schema-validated JSON data structures:

```typescript
interface StageBoxProfile {
  id: string;
  displayName: string;
  manufacturer: string;
  stockPhotoId: string;
  sockets: {
    id: string;
    label: string;
    type: "XLR-in" | "XLR-out" | "EtherCon" | "TRS";
    preamp?: boolean;
  }[];
  transport: {
    protocol: "dSnake" | "DX" | "gigaACE";
    sampleRate: 48000 | 96000;
    maxCableMeters: number;
  };
  expansion: {
    monitorPort: boolean;
    expanderPort: boolean;
    maxRemotesUpstream: number;
  };
}

interface ConsoleProfile {
  id: string;
  displayName: string;
  manufacturer: string;
  stockPhotoId: string;
  localSockets: SocketDefinition[];
  slink: {
    modes: ("dSnake" | "DX" | "gigaACE")[];
    portRef: string;
    maxDsnakeRemotes: number; // 2
  };
  ioPort: {
    supportedCards: string[];
    slotCount: number;
  };
  channels: {
    inputs: number;  // 48
    mixes: number;   // 12
    matrices: { stereoMax: number; monoMax: number }; // 3 stereo / 6 mono
    fxSends: number; // 4
    fxReturns: number; // 8
    dca: number;     // 8
    muteGroups: number; // 8
  };
  scenes: {
    perShow: number; // 300
  };
}

interface StageItemProfile {
  id: string;
  category: "mic" | "instrument" | "di-box" | "playback" | "click" | "comms" | "speaker" | "iem" | "cable";
  subcategory: string;       // e.g., "dynamic", "condenser", "passive-mono", "active-stereo"
  displayName: string;
  stockPhotoId: string;
  connectorTypes: ConnectorType[];
  requiresDI?: boolean;
  requiresPhantom?: boolean;
  defaultPhotoAlt: string;   // accessibility alt text
}
```

## §16 Default "Church Rig" Preset

This preset loads by default into the simulator and is preserved as `presets/church-default.json`. It is a read-only factory preset that can be loaded but not overwritten. Users can load it, modify it, and save the result as a new named preset.

### 16.1 Stage Input Inventory — AR2412

| **AR2412 In** | **Source Name** | **Type** | **DI / Connector** | **+48V** | **Routing Category** |
| --- | --- | --- | --- | --- | --- |
| 1 | Audience R | Condenser mic (ambient) | XLR | Config | FOH + Stream |
| 2 | Mic 1 | Vocal mic | XLR | Config | FOH |
| 3 | Mic 2 | Vocal mic | XLR | Config | FOH |
| 4 | Mic 3 | Vocal mic | XLR | Config | FOH |
| 5 | Mic 4 | Vocal mic | XLR | Config | FOH |
| 6 | Mic 5 | Vocal mic | XLR | Config | FOH |
| 7 | Click Keys | Click/metronome feed | XLR | No | IEM only |
| 8 | Click Drums | Click/metronome feed | XLR | No | IEM only |
| 9 | Lapel | Lavalier condenser | XLR / Beltpack RX | Config | FOH |
| 10 | Comms Keys | Talkback mic (keys player) | XLR | No | IEM only |
| 11 | Comms Bass | Talkback mic (bass player) | XLR | No | IEM only |
| 12 | Comms Drums | Talkback mic (drummer) | XLR | No | IEM only |
| 13 | Keys | Keyboard (mono) | Mono DI → XLR | No | FOH + IEM |
| 14 | Electric Guitar | Electric guitar | Mono DI → XLR | No | FOH + IEM |
| 15 | Acoustic Guitar | Acoustic guitar | Mono DI → XLR | No | FOH + IEM |
| 16 | Bass Guitar | Bass guitar | Mono DI → XLR | No | FOH + IEM |
| 17 | Kick | Dynamic mic (in the hole) | XLR | No | FOH + IEM |
| 18 | Snare Top | Dynamic mic | XLR | No | FOH + IEM |
| 19 | Tom 1 | Dynamic mic | XLR | No | FOH + IEM |
| 20 | Snare Bottom | Dynamic mic | XLR | No | FOH + IEM |
| 21 | Floor Tom | Dynamic mic | XLR | No | FOH + IEM |
| 22 | Hihats | Condenser mic | XLR | Yes | FOH + IEM |
| 23 | Overheads | Condenser mic (mono) | XLR | Yes | FOH + IEM |
| 24 | Audience L | Condenser mic (ambient) | XLR | Config | FOH + Stream |

### 16.2 SQ-5 Local Input Inventory

| **SQ Local In** | **Source Name** | **Type** | **Connector** | **Notes** |
| --- | --- | --- | --- | --- |
| 1 | PROPC L | ProPresenter PC audio (Left) | Stereo DI → TRS | Presentation/lyric playback |
| 2 | PROPC R | ProPresenter PC audio (Right) | Stereo DI → TRS | Stereo pair with In 1 |
| 3 | *(unused)* | — | — | — |
| 4 | WIRELESS 1 | Shure SVX288/PG28 Handheld Rx | XLR | Wireless handheld mic |
| 5 | WIRELESS 2 | Shure SVX288/PG28 Handheld Rx | XLR | Wireless handheld mic (pair) |
| 6–10 | *(unused)* | — | — | — |
| 11–12 | *(unused)* | — | — | — |
| 13 | AES | *(nothing connected)* | AES XLR | Available for future use |
| 14 | ST1 L | *(unused)* | TRS | — |
| 15 | ST1 R | *(unused)* | TRS | — |
| 16 | ST2 L/R | *(unused)* | TRS | — |
| — | Talkback Mic | FOH talkback to stage | XLR | Built-in SQ-5 talkback |
| — | Footswitch | *(connected)* | TS jack | Assignable SQ-5 footswitch |

### 16.3 Output Inventory — AR2412

| **AR2412 Out** | **Destination** | **Bus Type** | **Mode** | **Hardware** | **Notes** |
| --- | --- | --- | --- | --- | --- |
| 1 | IEM AG | Aux (mono) | Mono | Behringer P1 | Acoustic guitar player IEM mix |
| 2 | IEM WL | Aux (mono) | Mono | Xtuga IEM1200 UHF | Worship leader IEM mix (wireless) |
| 3 | IEM BACKUP | Aux (mono) | Mono | Xtuga IEM1200 UHF | Backup vocalist IEM mix (wireless) |
| 4 | *(unused)* | — | — | — | Available for future use |
| 5 | IEM KEYS | Aux (mono) | Mono | Behringer P1 | Keys player IEM mix |
| 6 | IEM EG | Aux (mono) | Mono | Behringer P1 | Electric guitar player IEM mix |
| 7 | IEM BASS | Aux (mono) | Mono | Behringer P1 | Bass player IEM mix |
| 8 | IEM DRUMS | Aux (mono) | Mono | Behringer P1 | Drummer IEM mix |
| 9 | Front Fills | Aux or Matrix (mono) | Mono | 2× speakers daisy-chained | Front fill speakers |
| 10 | Subs | Aux (mono) | Mono | 2× subs daisy-chained | Subwoofers |
| 11 | Array R | Matrix (stereo R) | Stereo | Line array (right) | Main PA right |
| 12 | Array L | Matrix (stereo L) | Stereo | Line array (left) | Main PA left |

### 16.4 Output Inventory — SQ-5 Local

| **SQ Local Out** | **Destination** | **Bus Type** | **Mode** | **Hardware** | **Notes** |
| --- | --- | --- | --- | --- | --- |
| 1–6 | *(unused)* | — | — | — | — |
| 7 | Record L | Matrix or Direct Out | Stereo L | OSEE recorder | Backup recording left |
| 8 | Record R | Matrix or Direct Out | Stereo R | OSEE recorder | Backup recording right |
| 9 | Monitor L | Aux or Matrix | Stereo L | Reference monitors | Streaming mix monitoring left |
| 10 | Monitor R | Aux or Matrix | Stereo R | Reference monitors | Streaming mix monitoring right |
| 11 | Stream L | Aux or Matrix | Stereo L | Behringer UMC204HD → USB → Streaming PC | Livestream audio left |
| 12 | Stream R | Aux or Matrix | Stereo R | Behringer UMC204HD → USB → Streaming PC | Livestream audio right |

### 16.5 Click & Comms Routing

Click and comms channels are **IEM-only** — they must never reach FOH speakers or the livestream.

| **Channel** | **Source** | **Routed To** | **Never Routed To** |
| --- | --- | --- | --- |
| Click Keys | Metronome/click feed | IEM KEYS, IEM WL (if needed) | Main LR, Arrays, Subs, Fills, Stream, Record |
| Click Drums | Metronome/click feed | IEM DRUMS | Main LR, Arrays, Subs, Fills, Stream, Record |
| Comms Keys | Talkback mic at keys position | IEM mixes (as configured) | Main LR, Arrays, Subs, Fills, Stream, Record |
| Comms Bass | Talkback mic at bass position | IEM mixes (as configured) | Main LR, Arrays, Subs, Fills, Stream, Record |
| Comms Drums | Talkback mic at drum position | IEM mixes (as configured) | Main LR, Arrays, Subs, Fills, Stream, Record |

### 16.6 DI Box Inventory

| **DI Box** | **Type** | **Connected Source** | **Output To** |
| --- | --- | --- | --- |
| DI 1 (mono) | Mono DI | Electric Guitar | AR2412 In 14 |
| DI 2 (mono) | Mono DI | Acoustic Guitar | AR2412 In 15 |
| DI 3 (mono) | Mono DI | Bass Guitar | AR2412 In 16 |
| DI 4 (mono) | Mono DI | Keys | AR2412 In 13 |
| DI 5 (stereo) | Stereo DI | ProPresenter PC | SQ Local In 1 (L) + In 2 (R) |

### 16.7 Suggested Bus Assignment Plan

The SQ-5 has 12 stereo mixes (configurable as Aux or Group). The church rig uses them as follows:

| **Mix** | **Name** | **Mode** | **Output Destination** | **Notes** |
| --- | --- | --- | --- | --- |
| Mix 1 | IEM WL | Mono Aux | AR2412 Out 2 | Worship leader in-ear mix |
| Mix 2 | IEM BACKUP | Mono Aux | AR2412 Out 3 | Backup vocalist in-ear mix |
| Mix 3 | IEM AG | Mono Aux | AR2412 Out 1 | Acoustic guitar player in-ear mix |
| Mix 4 | IEM KEYS | Mono Aux | AR2412 Out 5 | Keys player in-ear mix |
| Mix 5 | IEM EG | Mono Aux | AR2412 Out 6 | Electric guitar player in-ear mix |
| Mix 6 | IEM BASS | Mono Aux | AR2412 Out 7 | Bass player in-ear mix |
| Mix 7 | IEM DRUMS | Mono Aux | AR2412 Out 8 | Drummer in-ear mix |
| Mix 8 | Subs | Mono Aux | AR2412 Out 10 | Subwoofer feed |
| Mix 9 | Front Fills | Mono Aux | AR2412 Out 9 | Front fill speakers |
| Mix 10 | Stream | Stereo Aux | SQ Local Out 11–12 | Livestream audio |
| Mix 11 | Monitor | Stereo Aux | SQ Local Out 9–10 | Streaming mix reference |
| Mix 12 | Record | Stereo Aux | SQ Local Out 7–8 | Backup recording |

**Main LR** → Matrix 1 (Stereo) → SQ Local or AR2412 Out for Array L/R.

**Matrix Budget:** Arrays on Matrix 1 (stereo). Remaining 2 stereo matrices (or up to 4 mono splits) available for future use. The simulator must enforce the SQ-5's 3 stereo / 6 mono matrix limit.

### 16.8 Subgroup (Group Mode) Plan — Optional

These subgroups are suggested starting points. The user can create, modify, or remove them:

| **Subgroup Name** | **Member Channels** | **Master Routing** |
| --- | --- | --- |
| **DRUMS** (Stereo Group) | Kick, Snare Top, Snare Bottom, Tom 1, Floor Tom, Hihats, Overheads | Main LR |
| **VOCALS** (Stereo Group) | Mic 1–5, Lapel, Wireless 1–2 | Main LR |
| **INSTRUMENTS** (Stereo Group) | Keys, E.Gtr, A.Gtr, Bass Guitar | Main LR |

### 16.9 FX & Inserts (Waves SuperRack over USB)

- Model a Waves SuperRack insert engine hosted over the SQ USB-B interface as an insert send/return path across input channels and subgroups.

- **USB Channel Limit:** SQ USB-B streaming supports 32×32 at 48 kHz (16×16 at 96 kHz). Inserting Waves across every input channel plus 3 stereo groups exceeds the 32-channel USB budget. Track USB pair usage, display warnings when saturated, and encourage group-level inserts (Drums, Vocals, Instruments) as the recommended low-latency architecture.

## §17 Acceptance Criteria & End-to-End Test Cases

Write one Playwright E2E test per Acceptance Criterion, accompanied by comprehensive unit tests for signal-graph derivations and validator predicates:

| **ID** | **Acceptance Criterion Description & Expected Outcome** |
| --- | --- |
| **AC-1** | **Physical patch digital visibility:** Place a vocal mic from palette, patch XLR cable to AR2412 In 2, patch AR2412 dSNAKE to SQ SLink via Cat5e → in I/O → Inputs → Input Channel, SLink socket 2 is selectable and patchable to an Input Channel. |
| **AC-2** | **DI-required source:** A bass guitar 1/4" TS straight into AR2412 In 16 is blocked ("requires a DI box"). Inserting a Mono DI (TS to DI in, XLR to AR2412 In 16) is accepted; the AR2412 socket exposes remote preamp control. |
| **AC-3** | **Two-remote SLink limit:** With one AR2412 connected, adding a second remote audio rack is permitted (2 total); attempting to patch a third remote is refused with "SLink dSnake mode supports up to 2 remotes per port." |
| **AC-4** | **Channel processing order & persistence:** Input 1 Processing displays Preamp / HPF / Gate / Insert / PEQ / Compressor / Pan in exact documented order (Delay located in Preamp). Setting Gain +30, HPF 80 Hz/24 dB, Gate -35 dB, PEQ band 2 (3 kHz, +2 dB, 1 oct), and Comp (-18 dB, 4:1) persists intact through scene save and recall. |
| **AC-5** | **IEM routing:** Route Keys (AR2412 In 13) to IEM KEYS aux mix (Mix 4) at -5 dB pre-fade. Route Click Keys to the same mix. Verify Click Keys signal presence appears only in IEM KEYS, not in Main LR or any speaker output. |
| **AC-6** | **Click/comms FOH warning:** Route Click Drums to Main LR. Verify a prominent warning appears: "Click/metronome channels are typically routed to IEM mixes only, not to FOH speakers." The route is allowed but flagged. |
| **AC-7** | **GEQ Fader Flip:** Selecting Mix 8 (Subs, mono Aux) and pressing GEQ Fader Flip maps bands 1–14 onto physical fader strips on press 1; maps bands 15–28 on press 2; exits on press 3. Moving a fader updates only that GEQ frequency band; pressing Sel resets that band to 0 dB. |
| **AC-8** | **FX Send – Return:** Recall SMR Reverb into FX 1, send Mic 1 (AR2412 In 2) at -10 dB post-fade. FX Return 1 displays PEQ + Pan only. Muting the FX 1 send cuts the wet reverberation path without affecting dry Mic 1 signal. |
| **AC-9** | **Matrix fed from LR for arrays:** Matrix 1 fed by Main LR post-fade at 0 dB, patched to AR2412 Out 11 (Array R) and Out 12 (Array L), produces an active signal path trace. |
| **AC-10** | **Scene recall with Recall Filter:** Store Scene 1 (all channels default), modify only PEQ on Mic 1, store Scene 2, apply Recall Filter "Block PEQ" to Scene 2 — recalling Scene 2 preserves Scene 1's PEQ parameters while all other channels follow Scene 2. |
| **AC-11** | **Invalid / disconnected patch:** Patch a channel from AR2412; unplugging the dSNAKE Cat5e in the Physical tab updates all dependent digital patches to "patched but unavailable" (striped styling) and greys all SLink presence meters until reconnected. |
| **AC-12** | **Node photo system:** Place a mic from palette → verify stock photo appears as icon on canvas node → click node → verify full photo in detail panel → upload custom photo → verify canvas icon updates → "Reset to Default" restores stock photo. |
| **AC-13** | **Start from scratch:** Select "Start from Scratch" → canvas shows only AR2412 and SQ-5 with no other items → palette is available → drag a dynamic mic onto stage → connect XLR to AR2412 In 1 → verify digital patch becomes available. |
| **AC-14** | **Preset management:** Modify the church preset (rename a channel) → save as "My Config" → load church preset again (original names restored) → load "My Config" (renamed channel appears) → export "My Config" as JSON → import JSON on a fresh session → verify state matches. |
| **AC-15** | **Editability — add/remove items:** In church preset, right-click an instrument → Delete → confirm → instrument, its cable, and downstream patches are removed with warning. Drag a new mic from palette → place on stage → connect → verify routing available. |
| **AC-16** | **DCA / Mute Group with IEM:** Route Kick, Snare Top, Snare Bottom, Tom 1, Floor Tom, Hihats, Overheads to DCA 1 "DRUMS." Muting DCA 1 flashes individual member mute buttons and cuts signal presence in both Main LR and IEM DRUMS aux mix. |

## §18 Explicit Constraints for the Coding AI

- Emit clear TODO comments where "Confirmed in docs" is missing, allowing human engineering review before shipping.

- Keep the entire simulation deterministic and serializable — absolutely no unmanaged side-effects escaping the central store.

- Strictly maintain zero external audio DSP dependencies in core state; calculations are algebraic and discrete.

- Node photos must degrade gracefully: if a stock photo asset fails to load, display a typed icon placeholder (mic icon, guitar icon, etc.) with the equipment name.

## §19 Deliverables & Repository Layout

```
/apps/foh-sim-web/
  /src/features/physical/       # Interactive stage canvas, palette, Bézier cable engine
  /src/features/digital/        # SQ screens, fader strips, sends-on-faders, patch matrices
  /src/features/scenes/         # Scene manager, cue list, recall filters, safes
  /src/features/setup/          # Setup screen, strip assignments, preferences
  /src/features/utility/        # AMM, signal generator, diagnostics
  /src/features/presets/        # Preset management, save/load/export/import
  /src/features/photos/         # Node image system, stock photo registry, upload handler
  /src/components/              # Generic faders, rotary encoders, LED meters, matrix cells
  /src/assets/photos/stock/     # Bundled stock reference photos by equipment type
/packages/simulation-core/      # Pure TypeScript domain models, validators, signal graph
/packages/hardware-profiles/    # sq5.json, ar2412.json, ab168.json (extensible stubs)
/tests/                         # Vitest unit test suite + Playwright E2E specs
```

Provide a comprehensive README.md detailing build commands, how to register new stage-box hardware profiles, how to activate the guided-mode training flag, how to manage presets, and test coverage execution.

**□ END OF PROMPT — do not paste anything below this line into your AI builder □**

## §20 Research Notes (Sources of Truth)

If any section of this specification disagrees with these official reference materials, the sources of truth supersede and the application logic should be aligned accordingly.

| **Source Document** | **What It Establishes** |
| --- | --- |
| **SQ Firmware Reference Guide V1.6.0** | Operational overview, physical connections, I/O patching matrices, processing order and parameter ranges, routing architecture, FX RackExtra engines, Scenes/Shows/Libraries, Setup, AMM, block diagrams. |
| **SQ-5 Technical Datasheet** | Canonical socket and bus counts, physical dimensions, latency specs, sample rates, Chromatic Metering behavior, SoftKey layouts. |
| **A & H Support — "SQ Routing"** | Direct-out tap points, mix/matrix source options, and bus assignment logic. |
| **A & H Support — "SQ Working with Processing"** | Definitive processing-block ordering per channel type (Input channels, Mix/Aux/Group outputs, FX Returns). |
| **A & H Support — "SQ Basic Signal Path Diagrams"** | Canonical signal-flow topology across Input → Subgroup → Main LR → Aux → Matrix networks. |
| **SQ-MixPad Product Documentation** | Wired/wireless remote control workflows, offline scene editing, RTA/meters/FX interaction patterns for desktop and mobile. |
| **AR2412 Product Page & Datasheet** | 24 XLR mic/line inputs, 12 XLR line outputs at 48 kHz, dSNAKE protocol, Expander & Monitor ports, plug-and-play topology up to 100 m. |
| **AR2412 Getting Started Guide** | Cat5e STP cable requirements, EtherCon locking connectors, maximum of two dSNAKE remotes per SLink port. |
| **General Audio Engineering / DI References** | Impedance matching, active vs. passive DI selection, balanced vs. unbalanced signal runs, and stage plot standards. |
| **Church Patch Sheets (Sep 2025)** | Actual AR2412 input/output assignments, SQ-5 local I/O assignments, IEM routing, click/comms channel layout, DI inventory, and streaming/recording signal chain as deployed at the church. |