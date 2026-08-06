# Helios Towers Supply Chain Handbook — Vercel Deployment Guide

This beginner-friendly guide walks through deploying the Helios Towers Supply Chain Handbook to Vercel and configuring Supabase for production.

---

## 1. Prerequisites

Before starting, ensure you have:
1. Access to your **GitHub repository** (`https://github.com/BENEDICT255/helios-supply-chain-handbook`).
2. A free or team account on **[Vercel](https://vercel.com)**.
3. Your live **Supabase Project URL** and **`anon` `public` API key**.

---

## 2. Deploying to Vercel Step-by-Step

### Step 1: Import Project to Vercel
1. Log in to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** → **Project**.
3. Select **Continue with GitHub** and search for `helios-supply-chain-handbook`.
4. Click **Import**.

### Step 2: Configure Environment Variables
In the **Environment Variables** section on Vercel, add the following 3 variables:

| Variable Name | Environment | Value | Description |
|---------------|-------------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Dev | `https://your-project.supabase.co` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Dev | `eyJhbG...` | Your Supabase Anon Key |
| `NEXT_PUBLIC_SITE_URL` | Production | `https://your-app-name.vercel.app` | Production domain for QR codes & Auth |

> [!CAUTION]
> Do NOT set `SUPABASE_SERVICE_ROLE_KEY` with `NEXT_PUBLIC_` prefix. The service role key must never be exposed to browser code.

### Step 3: Deploy
1. Keep the Framework Preset as **Next.js**.
2. Click **Deploy**.
3. Wait 1–2 minutes while Vercel builds the project.
4. Once deployment finishes, Vercel will provide your production URL (e.g. `https://helios-supply-chain-handbook.vercel.app`).

---

## 3. Post-Deployment Supabase Configuration

### Step 1: Add Redirect URL in Supabase
1. Go to your **Supabase Dashboard** → **Authentication** → **URL Configuration**.
2. Set **Site URL** to your Vercel deployment URL (e.g. `https://helios-supply-chain-handbook.vercel.app`).
3. Under **Redirect URLs**, click **Add URL** and add:
   - `https://helios-supply-chain-handbook.vercel.app/**`
   - `https://helios-supply-chain-handbook.vercel.app/admin/login`

### Step 2: Update `NEXT_PUBLIC_SITE_URL` in Vercel
1. In Vercel, go to **Settings** → **Environment Variables**.
2. Set `NEXT_PUBLIC_SITE_URL` to your exact Vercel production domain.
3. Redeploy your latest build (go to **Deployments** → click `...` next to latest build → **Redeploy**).

---

## 4. Post-Deployment Verification

1. **Test Public Site**: Visit `https://helios-supply-chain-handbook.vercel.app`. Verify homepage, delivery timelines, procurement process, FAQs, and contact page load properly.
2. **Test Admin Login**: Visit `https://helios-supply-chain-handbook.vercel.app/admin/login`. Sign in with your admin credentials.
3. **Test QR Code**: Go to `/admin/site-information/qr-code`. Verify the target URL displays your production Vercel domain and scan the generated QR code using a mobile phone.
4. **Test Excel Workflow**: Test Excel export and upload on production to confirm SheetJS works in Vercel serverless functions.
