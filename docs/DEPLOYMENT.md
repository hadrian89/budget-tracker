# Deployment Guide

## Overview

| Component | Recommended host | Alternative |
|-----------|-----------------|-------------|
| Backend | Render (free tier) | Railway, Fly.io, VPS |
| Web app | Vercel | Netlify, Render Static |
| Mobile | EAS Build → App Stores | Expo Go (testing only) |
| Database | MongoDB Atlas (free M0) | Self-hosted |

---

## Backend — Render

1. Push `backend/` to a GitHub repository (or a monorepo with the root).

2. In Render → **New Web Service**:
   - **Root directory:** `backend`
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Environment:** Node

3. Add environment variables in Render dashboard:
   ```
   MONGO_URI=mongodb+srv://...
   JWT_SECRET=<strong random string>
   PORT=10000        # Render sets PORT automatically; this is a fallback
   ```

4. Copy the service URL (e.g. `https://walleto-api.onrender.com`).

5. Update CORS in `backend/server.js` if your web domain isn't already in the allowed origins list:
   ```js
   const allowedOrigins = [
     'http://localhost:3000',
     'https://your-webapp.vercel.app',   // add this
   ];
   ```

---

## Web app — Vercel

1. In Vercel → **New Project** → import your repository.

2. **Framework preset:** Create React App  
   **Root directory:** `webapp`

3. Add environment variables in Vercel dashboard:
   ```
   REACT_APP_API_URL=https://walleto-api.onrender.com
   REACT_APP_GOOGLE_CLIENT_ID=<your client id>
   REACT_APP_FACEBOOK_APP_ID=<your app id>
   ```

4. Deploy. Vercel runs `npm run build` automatically.

5. Add your Vercel domain to:
   - **Google Cloud Console** → OAuth → Authorised JavaScript origins
   - **Facebook Developer portal** → Facebook Login → Valid OAuth Redirect URIs

---

## Mobile — EAS Build

EAS (Expo Application Services) builds native binaries in the cloud.

### Setup

```bash
npm install -g eas-cli
eas login
cd mobileapp
eas build:configure   # creates eas.json
```

### Update API URL for production

Edit `mobileapp/src/api/axios.ts`:
```ts
baseURL: 'https://walleto-api.onrender.com',
```

Or use Expo constants to switch by environment:
```ts
import Constants from 'expo-constants';
baseURL: Constants.expoConfig?.extra?.apiUrl ?? 'http://192.168.0.10:5001',
```

And in `app.json`:
```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://walleto-api.onrender.com"
    }
  }
}
```

### Build

```bash
# Android APK (for sideloading / testing)
eas build --platform android --profile preview

# Android AAB (for Play Store)
eas build --platform android --profile production

# iOS IPA (requires Apple Developer account)
eas build --platform ios --profile production
```

### Submit to stores

```bash
eas submit --platform android
eas submit --platform ios
```

---

## MongoDB Atlas setup

1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com).
2. Create a database user (username + strong password).
3. Whitelist `0.0.0.0/0` under Network Access (or restrict to your server's IP).
4. Get the connection string: `mongodb+srv://<user>:<password>@cluster.mongodb.net/budget_tracker`.
5. Paste into `MONGO_URI`.

The application creates collections automatically on first use. No manual migration is required.

---

## Environment checklist

Before going live, verify:

- [ ] `JWT_SECRET` is a cryptographically random string (32+ characters), not the placeholder value
- [ ] `MONGO_URI` points to the production Atlas cluster
- [ ] CORS `allowedOrigins` includes your production web domain
- [ ] Google OAuth credentials have the production domain added
- [ ] Facebook Login has the production domain in allowed origins
- [ ] The mobile app's `baseURL` points to the production backend URL
- [ ] MongoDB Atlas network access allows your server's IP

---

## Free tier limits (as of 2025)

| Service | Free limit |
|---------|-----------|
| MongoDB Atlas M0 | 512 MB storage, shared |
| Render free | Spins down after 15 min idle; cold start ~30 s |
| Vercel free | 100 GB bandwidth/month |
| EAS free | 30 builds/month |

For production traffic, upgrade Render to at least the Starter plan to avoid cold starts.
