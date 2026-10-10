# WeCare.AI Deployment & PWA Guide

This guide details how to deploy **WeCare.AI** with the **Backend on Render** and the **Frontend on Vercel**, including installation as a Progressive Web App (PWA) on mobile devices.

---

## 1. Backend Deployment (Render)

Render hosts the FastAPI backend with ASGI (`uvicorn`) and automated health checks.

### Option A: 1-Click Blueprint (Recommended)
1. Push your repository to GitHub.
2. In the [Render Dashboard](https://dashboard.render.com), click **New +** > **Blueprint**.
3. Select your GitHub repository. Render will automatically detect [`render.yaml`](file:///c:/Users/dhanu/Downloads/wecare-ai/render.yaml).
4. Fill in secret environment variables:
   - `GROQ_API_KEY`: *(Optional)* Your Groq API key from [console.groq.com](https://console.groq.com)
5. Click **Apply**. Render will build and deploy the service.

### Option B: Manual Web Service
1. In the Render Dashboard, click **New +** > **Web Service**.
2. Connect your repository.
3. Configure the following fields:
   - **Name**: `wecare-ai-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install --upgrade pip setuptools wheel && pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path**: `/api/health`
4. Under **Environment Variables**, add:
   | Variable | Value | Notes |
   |---|---|---|
   | `PYTHON_VERSION` | `3.11.9` | **Critical**: locks stable Python version for pre-built wheels |
   | `ENVIRONMENT` | `production` | Production mode |
   | `CORS_ORIGINS` | `*` | Or specify your Vercel URL once deployed |
   | `CORS_ORIGIN_REGEX` | `^https?://.*` | Allows any Vercel domain / preview deployments |
   | `GROQ_API_KEY` | `gsk_...` | Optional: for Groq AI clinical assessment |
5. Click **Create Web Service**. Note down your Render backend URL (e.g. `https://wecare-ai-backend.onrender.com`).

---

## 2. Frontend Deployment (Vercel)

Vercel hosts the React + Vite frontend with global CDN caching and SPA client-side routing.

### Step-by-Step Vercel Deployment:
1. In the [Vercel Dashboard](https://vercel.com/dashboard), click **Add New...** > **Project**.
2. Select your repository.
3. In the configuration screen:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select `frontend` (or leave as root; both [`frontend/vercel.json`](file:///c:/Users/dhanu/Downloads/wecare-ai/frontend/vercel.json) and root [`vercel.json`](file:///c:/Users/dhanu/Downloads/wecare-ai/vercel.json) are provided).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Under **Environment Variables**, add:
   | Variable | Value |
   |---|---|
   | `VITE_API_BASE_URL` | `https://wecare-ai-backend.onrender.com` *(Replace with your Render URL)* |
   | `VITE_USE_MOCK_API` | `false` |
5. Click **Deploy**. Vercel will build and launch your production frontend (e.g. `https://wecare-ai.vercel.app`).

---

## 3. Mobile PWA Installation (iOS & Android)

WeCare.AI includes a Progressive Web App manifest ([`manifest.webmanifest`](file:///c:/Users/dhanu/Downloads/wecare-ai/frontend/public/manifest.webmanifest)), service worker offline caching ([`sw.js`](file:///c:/Users/dhanu/Downloads/wecare-ai/frontend/public/sw.js)), and mobile navigation bar.

### On Android (Chrome / Edge):
1. Navigate to your Vercel frontend URL in Chrome.
2. Tap the **Install WeCare.AI** banner or the three dots menu (**⋮**) > **Add to Home screen** / **Install app**.
3. WeCare.AI will install as a native standalone app with custom icon, splash screen, and standalone orientation.

### On iOS (Safari):
1. Open your Vercel frontend URL in Safari.
2. Tap the **Share** button (box with an arrow pointing up at the bottom).
3. Scroll down and tap **Add to Home Screen**.
4. Confirm name **WeCare.AI** and tap **Add**.
5. Launch from your home screen — the app opens full screen with safe-area support, glassmorphism UI, and no browser URL bar.

---

## 4. Mobile UX Features Included

- **Persistent Mobile Bottom Bar**: 5 quick-access tabs (Home, Queue, New Intake FAB, Acuity Alerts with unread badge, Patient Records).
- **Responsive Tables**: Automatically collapses complex clinical queue tables into touch-friendly cards on screens `< 768px`.
- **Top Alert Banner**: Responsive mobile notifications for high-risk patient queue updates.
- **Offline Shell**: Service Worker caches all shell assets for instant launch even with intermittent hospital Wi-Fi.
