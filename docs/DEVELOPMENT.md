# Development Guide

## Prerequisites

- **Node.js** 18 or later
- **npm** 9 or later
- **MongoDB** — Atlas free cluster recommended (or local mongod)
- **Expo CLI** — `npm install -g expo-cli` (for mobile only)
- **Expo Go** app on your phone for quick mobile testing

---

## Backend setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/budget_tracker?retryWrites=true&w=majority
JWT_SECRET=change_me_to_a_long_random_string
PORT=5001
```

```bash
npm run dev     # nodemon — hot reload
npm start       # production (no hot reload)
```

The server logs all requests in development mode. MongoDB connection is confirmed with "MongoDB Connected" on startup.

---

## Web app setup

```bash
cd webapp
npm install
```

Create `webapp/.env.development`:

```env
REACT_APP_API_URL=http://localhost:5001
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
REACT_APP_FACEBOOK_APP_ID=your_facebook_app_id
```

`REACT_APP_API_URL` must be reachable from the browser. When testing mobile on the same network, replace `localhost` with your machine's LAN IP (e.g. `192.168.0.10:5001`).

```bash
npm start       # development server on :3000
npm run build   # production bundle → build/
```

---

## Mobile app setup

```bash
cd mobileapp
npm install
```

Edit `mobileapp/src/api/axios.ts` and set `baseURL` to your machine's LAN IP:

```ts
const api = axios.create({
  baseURL: 'http://192.168.0.10:5001',   // replace with your IP
  ...
});
```

> **Why not localhost?** The Expo Go app runs on a physical device. `localhost` would refer to the device itself, not your dev machine.

```bash
npx expo start         # opens Expo DevTools
npx expo start --ios   # iOS simulator
npx expo start --android  # Android emulator (requires Android Studio)
```

Scan the QR code with Expo Go on your phone.

---

## Environment variables reference

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for signing JWTs — use a long random string in production |
| `PORT` | No | Defaults to 5001 |

### Web app (`webapp/.env.development`)

| Variable | Required | Description |
|----------|----------|-------------|
| `REACT_APP_API_URL` | Yes | Backend base URL |
| `REACT_APP_GOOGLE_CLIENT_ID` | No | Google OAuth client ID (from Google Cloud Console) |
| `REACT_APP_FACEBOOK_APP_ID` | No | Facebook App ID (from Meta Developer portal) |

---

## OAuth setup (optional)

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project → APIs & Services → Credentials
3. Create OAuth 2.0 Client ID (Web application)
4. Add `http://localhost:3000` to Authorised JavaScript origins
5. Copy the Client ID into `REACT_APP_GOOGLE_CLIENT_ID`

### Facebook OAuth
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create an App → Facebook Login → Web
3. Set Site URL to `http://localhost:3000`
4. Copy App ID into `REACT_APP_FACEBOOK_APP_ID`

---

## Project scripts

| Directory | Command | Effect |
|-----------|---------|--------|
| `backend` | `npm run dev` | Start with nodemon hot reload |
| `backend` | `npm start` | Start without hot reload |
| `webapp` | `npm start` | Dev server |
| `webapp` | `npm run build` | Production build |
| `mobileapp` | `npx expo start` | Expo development server |
| `mobileapp` | `npx expo build:android` | Android APK (legacy) |
| `mobileapp` | `eas build` | EAS cloud build (recommended) |

---

## Database seeding

Default categories are seeded automatically on the first `GET /api/categories` call for any user. No manual seeding step is required.

---

## Useful tips

**Checking the API:**
```bash
# Test login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Use the returned token
export TOKEN=<paste token here>

curl http://localhost:5001/api/dashboard/home \
  -H "Authorization: Bearer $TOKEN"
```

**MongoDB queries (mongosh):**
```js
use budget_tracker
db.budget_tracker_transactions.find({ userid: "<userId>" }).count()
db.users.findOne({ email: "alice@example.com" })
```

**Clearing a user's data for testing:**
```js
const uid = "your_user_id"
db.budget_tracker_transactions.deleteMany({ userid: uid })
db.budget_tracker_accounts.deleteMany({ userid: uid })
```

---

## Code conventions

- **Backend:** CommonJS (`require`/`module.exports`), async/await throughout, no `try`/`catch` nesting beyond one level.
- **Web:** React functional components with hooks only. CSS custom properties for all colours (no hardcoded hex in JS).
- **Mobile:** TypeScript with strict mode. All screens are functional components. Styles via `StyleSheet.create`.
- **Naming:** camelCase for variables/functions, PascalCase for components/models.
- **Dates:** Always stored as `YYYY-MM-DD` strings in transactions (simplifies range queries without timezone issues).
