# Hear My Song 🎵

A music sharing app built with React, Vite, and Spotify integration.

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- A Spotify Developer account and app (see [Spotify Developer Dashboard](https://developer.spotify.com/dashboard))
- A Supabase project for notes storage

### Environment Setup

1. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

2. Fill in your credentials:

```bash
# Spotify Configuration
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
VITE_SPOTIFY_REDIRECT_URI=http://127.0.0.1:5173/callback
VITE_PLAYLIST_ID=your_playlist_id

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Configure your Spotify app:
   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Create a new app or select an existing one
   - Add `http://127.0.0.1:5173/callback` to the "Redirect URIs" in your app settings
   - Copy your Client ID and Client Secret to the `.env` file

### Installation

Install the project dependencies:

```bash
npm install
```

### Running Locally

You need to run both the frontend and backend servers. You can run them together:

```bash
npm run dev:all
```

Or run them separately in different terminals:

**Terminal 1 - Frontend:**
```bash
npm run dev
```

**Terminal 2 - Backend:**
```bash
npm run server
```

**Important:** Always access the app using `http://127.0.0.1:5173` (not `localhost`) to match the OAuth redirect URI configuration.

The app will be available at `http://127.0.0.1:5173` and the token exchange server will run on `http://127.0.0.1:3001`.

---

## Architecture

This app uses a **single codebase** that works identically in development and production. The Express server handles both API routes and serves the React frontend.

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    Single Express Server                    │
│                                                              │
│  Development Mode:                                          │
│  ├── Vite dev server (port 5173) → React frontend          │
│  └── Express server (port 3001) → API routes only          │
│                                                              │
│  Production Mode (Railway):                                  │
│  ├── Express builds React → npm run build → dist/          │
│  └── Express serves:                                         │
│      ├── /api/* → API routes (notes, Spotify token)         │
│      └── /* → Static files from dist/ (React app)           │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

- **Frontend**: React app built with Vite (`src/`)
- **Backend**: Express.js API server (`server.js`)
- **Database**: Supabase (PostgreSQL + Storage for voice notes)
- **Authentication**: Spotify OAuth 2.0 with PKCE

### Development vs Production

**Development:**
- Vite dev server runs separately on port 5173 (hot reload, fast refresh)
- Express server runs on port 3001 (API routes only)
- Frontend makes API calls to `http://127.0.0.1:3001`

**Production (Railway):**
- Single Express server handles everything
- `npm run build` creates production bundle in `dist/`
- Express serves static files from `dist/` and handles API routes
- All requests go to the same origin (no CORS issues)

### Why This Architecture?

- ✅ **Single codebase** - no separate dev/prod code
- ✅ **Simple deployment** - one service on Railway
- ✅ **No CORS issues** - frontend and backend on same origin
- ✅ **Easy local development** - Vite dev server for fast iteration

---

## Deployment

This app is deployed on [Railway](https://railway.app), which runs the Express server that serves both the API and the React frontend.

### Prerequisites

- GitHub repository with your code
- Railway account (sign in with GitHub)
- Spotify Developer app configured
- Supabase project set up

### Deployment Steps

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Connect to Railway**:
   - Go to [railway.app](https://railway.app) and sign in with GitHub
   - Click **"New Project"** → **"Deploy from GitHub repo"**
   - Select your repository
   - Railway will automatically detect Node.js and start building

3. **Configure Spotify Redirect URIs**:
   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Add **both** redirect URIs to your app settings:
     - `http://127.0.0.1:5173/callback` (for local development)
     - `https://your-app.railway.app/callback` (you'll get this URL after Railway deployment)
   - Save changes

4. **Add Environment Variables in Railway**:
   In Railway project settings → Variables, add:
   ```
   NODE_ENV=production
   VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   VITE_SPOTIFY_REDIRECT_URI=https://your-app.railway.app/callback
   VITE_PLAYLIST_ID=your_playlist_id
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   
   **Note:** Replace `your-app.railway.app` with your actual Railway URL (you'll see this after the first deployment).

5. **Update Spotify with Production URL**:
   - After Railway provides your URL, update the Spotify redirect URI if you used a placeholder
   - Update `VITE_SPOTIFY_REDIRECT_URI` in Railway to match your actual URL

6. **Deploy**:
   - Railway automatically builds (`npm run build`) and starts the server (`npm run start`)
   - Your app will be live at `https://your-app.railway.app`

### How Railway Deployment Works

1. **Build Phase**: Railway runs `npm run build` which:
   - Compiles React app with Vite
   - Creates production bundle in `dist/` folder

2. **Start Phase**: Railway runs `npm run start` which:
   - Sets `NODE_ENV=production`
   - Starts Express server
   - Server serves static files from `dist/` and handles API routes

3. **Runtime**: Single Express server handles all requests:
   - `/api/*` → API routes (notes, Spotify token exchange)
   - `/*` → React app (served from `dist/`)

### Spotify Redirect URI Configuration

Spotify allows multiple redirect URIs per app. This means you can register both:
- `http://127.0.0.1:5173/callback` (local development)
- `https://your-app.railway.app/callback` (production)

Spotify will accept OAuth redirects to **any** registered URI. The actual redirect used depends on your environment variable:
- **Local dev**: `.env` file has `VITE_SPOTIFY_REDIRECT_URI=http://127.0.0.1:5173/callback`
- **Production**: Railway has `VITE_SPOTIFY_REDIRECT_URI=https://your-app.railway.app/callback`

This allows seamless switching between local development and production without changing Spotify settings.

---

## Troubleshooting

**OAuth Error: Invalid redirect URI**
- Verify the redirect URI in Spotify dashboard matches exactly (including http vs https, trailing slashes)
- Check that `VITE_SPOTIFY_REDIRECT_URI` in Railway environment variables matches one of the registered URIs in Spotify
- Check Railway logs to see the actual redirect_uri being sent

**API Routes Return 500 Error**
- Check Railway logs: Railway dashboard → Your project → Deployments → Latest deployment → View logs
- Ensure all environment variables are set correctly in Railway
- Verify Supabase credentials are correct

**Build Fails on Railway**
- Check Railway build logs for specific errors
- Ensure all dependencies are in `package.json` (not just devDependencies)
- Verify `dist/` folder is created after build (check build logs)

**Static Files Not Loading**
- Verify `dist/` folder exists after build phase (check Railway build logs)
- Check that `NODE_ENV=production` is set in Railway environment variables
- Verify Express is serving static files (check server logs)

**Supabase Connection Errors**
- Verify your Supabase URL and anon key are correct in Railway environment variables
- Check that your Supabase database tables and storage buckets are set up (see `SUPABASE_SETUP.md`)
- Verify network connectivity from Railway to Supabase
