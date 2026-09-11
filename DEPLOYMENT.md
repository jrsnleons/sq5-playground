# Deployment Guide: FOH SQ-5 Audio Simulator

This guide outlines everything you need to prepare and execute a production deployment of the Allen & Heath SQ-5 and AR2412 audio simulator.

---

## 1. System Architecture & Prerequisites

The simulator is architected as an ultra-fast, deterministic client-side Single Page Application (SPA):
- **Zero Backend Required:** No Node.js server runtime, database, or external microservice is needed in production.
- **Zero Cloud Costs:** The entire application compiles to static HTML5, JavaScript (ES Modules), CSS, and SVG assets, making it eligible for 100% free hosting tiers (Vercel, Netlify, Cloudflare Pages, GitHub Pages).
- **Offline / PWA Ready:** Includes a Web App Manifest (`manifest.json`) and iOS touch icons so audio teams can install it directly to tablet home screens (iPad/Android) or desktops.

---

## 2. Pre-Deployment Preparation Checklist

Before deploying, prepare the following items:

| Item | Requirement / Recommendation | Status / Details |
|---|---|---|
| **Git Repository** | Hosted on GitHub, GitLab, or Bitbucket | Monorepo structured with `apps/*` and `packages/*` |
| **Custom Domain (Optional)** | e.g. `audio.yourchurch.org` or `sq5sim.com` | CNAME or A records pointing to hosting provider |
| **SSL / HTTPS** | Mandatory for AudioContext & PWA features | Auto-provisioned by Vercel, Netlify, Cloudflare, or Let's Encrypt |
| **Node.js Environment** | Node.js `>= 20.x` and npm `>= 10.x` | Required for CI/CD build pipelines |
| **Target Devices** | Desktops, Laptops, and Tablets (width $\ge$ 768px) | Mobile phones are automatically greeted with a pro-audio screen |

---

## 3. Ready-Made Deployment Options

All required configuration files are already included in the repository root:

### Option A: Vercel (Recommended — 1-Click Zero Config)
Vercel is pre-configured via [`vercel.json`](./vercel.json).

1. Log into [vercel.com](https://vercel.com) and click **"Add New Project"**.
2. Select your Git repository.
3. Configure the project:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `apps/foh-sim-web/dist`
4. Click **Deploy**.
5. *(Optional)* Under **Project Settings > Domains**, assign your custom domain (e.g. `sound.yourchurch.org`).

---

### Option B: Netlify
Netlify is pre-configured via [`netlify.toml`](./netlify.toml) and [`apps/foh-sim-web/public/_redirects`](./apps/foh-sim-web/public/_redirects).

1. Log into [netlify.com](https://netlify.com) and choose **"Add new site" > "Import an existing project"**.
2. Link your GitHub repository.
3. Netlify will auto-detect settings from `netlify.toml`:
   - **Build command:** `npm run build`
   - **Publish directory:** `apps/foh-sim-web/dist`
4. Click **Deploy Site**.

---

### Option C: Cloudflare Pages (Global CDN & Unlimited Bandwidth)
Cloudflare Pages provides global edge distribution with zero cold starts.

1. In the Cloudflare Dashboard, navigate to **Compute (Workers) > Pages > Create a project**.
2. Connect your Git repository.
3. Set build settings:
   - **Framework:** `None` or `Vite`
   - **Build command:** `npm run build`
   - **Build output directory:** `apps/foh-sim-web/dist`
   - **Root directory:** `/`
4. Click **Save and Deploy**.

---

### Option D: Docker / Container (Cloud Run, Fly.io, Railway, DigitalOcean, VPS)
A production-ready multi-stage [`Dockerfile`](./Dockerfile) and [`nginx.conf`](./nginx.conf) are provided.

#### Local Container Build & Run:
```bash
# Build the optimized production image
docker build -t foh-sq5-sim .

# Run on port 8080
docker run -d -p 8080:80 --name sq5-simulator foh-sq5-sim
```
Access at `http://localhost:8080`.

#### Deploy to Google Cloud Run:
```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/foh-sq5-sim
gcloud run deploy foh-sq5-sim --image gcr.io/PROJECT_ID/foh-sq5-sim --platform managed --allow-unauthenticated
```

#### Deploy to Fly.io:
```bash
fly launch
fly deploy
```

---

### Option E: GitHub Actions CI/CD
Automated CI checks are configured in [`.github/workflows/ci.yml`](./.github/workflows/ci.yml).
Every push and pull request runs:
1. TypeScript strict typecheck (`tsc --noEmit`)
2. Vitest unit tests (all 26 tests)
3. Vite production bundle compilation

---

## 4. Local Production Verification

Before deploying, you can verify the exact production build locally:

```bash
# 1. Run full validation
npm run typecheck
npm test

# 2. Compile production bundle
npm run build

# 3. Launch production preview server
npm run preview
```
Visit `http://localhost:4173/` in your browser.

---

## 5. Post-Deployment Verification Checklist

Once deployed to your staging or production URL:

1. **Verify HTTPS**: Ensure the padlock icon is displayed (required for browser audio device access and PWA service worker).
2. **Test Direct URL Navigation**: Refresh the browser on sub-views to verify SPA redirects (`/* -> /index.html 200`) work without 404 errors.
3. **Verify iPad / Tablet Installation**:
   - Open Safari on iPad or Chrome on Android Tablet.
   - Tap **Share > Add to Home Screen**.
   - Verify the custom SQ-5 icon appears and launches in standalone landscape mode.
4. **Test Sound System & Stage Workflow**:
   - Verify that Stage Box, Console, IEMs, and PA arrays route audio cleanly.
   - Toggle channel mutes and confirm pre-fade musician IEMs remain active.
   - Test 28-band GEQ Flip mode and interactive FX engines.
