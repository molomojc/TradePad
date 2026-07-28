# TradePad - Live Coin & Launch Archive Integration

This document outlines the architecture, database changes, and configuration instructions for TradePad's DexScreener-integrated coin tracking platform.

---

## 🛠 Database Setup

To support live tracking, run the SQL migrations in `pastcoins.sql` on your Supabase project.

1. Go to your **Supabase Dashboard** -> **SQL Editor**.
2. Copy the contents of `pastcoins.sql` and run them.
3. This adds static fields (`mint_address`, `pair_address`, etc.) to the `launches` table and creates the `launch_market_data` caching table with proper Row Level Security (RLS) policies.

---

## ⚙ Configuration & Environment

The backend server reads from `.env` in the project root. Make sure the following keys are set:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key # Required for background writes
PORT=8787
APP_URL=http://localhost:5173
```

---

## 🚀 Running the App

### 1. Run the Backend API & Background Sync
The backend API server includes:
* Endpoint `GET /api/launches/:id/market` to proxy DexScreener data.
* A background scheduler that refreshes data every 2 minutes for all launches containing a `mint_address` and updates Supabase.

Start the backend:
```bash
node server/index.js
```

### 2. Run the Frontend (Vite)
Start the frontend development server:
```bash
npm run dev
```

---

## 📈 How It Works (Data Flow)

1. **Admin Creation:** When an admin creates a launch in the dashboard, they input the `mint_address` (e.g. Pump.fun / Solana contract address).
2. **Background Sync:** The Express server polls Supabase every 2 minutes, requests latest token info from the DexScreener API `https://api.dexscreener.com/latest/dex/tokens/{mint_address}`, and saves the results in `launch_market_data`.
3. **Frontend Display:** Previous launches query the database for both static launch info and live cached data. If the server is in stub mode, it falls back to rich pre-configured mock data.
