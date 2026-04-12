# Walleto — Personal Budget Tracker

A full-stack personal finance application with a React web app, React Native mobile app (Expo), and Node.js/Express/MongoDB backend.

## What it does

Walleto lets users track income, expenses, and transfers across multiple accounts. It categorises spending, visualises trends, manages recurring bills, and sends budget limit alerts — all synced across web and mobile via a shared REST API.

## Repository structure

```
budget-tracker/
├── backend/        Node.js + Express + MongoDB REST API
├── webapp/         React 18 web application (CRA)
├── mobileapp/      React Native + Expo SDK 54 (TypeScript)
└── docs/           Full documentation
```

## Quick start

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18+ |
| npm | 9+ |
| MongoDB | Atlas cluster or local 6+ |
| Expo CLI | Latest (`npm i -g expo-cli`) |

### 1. Backend

```bash
cd backend
cp .env.example .env        # fill in MONGO_URI and JWT_SECRET
npm install
npm run dev                  # starts on http://localhost:5001
```

### 2. Web app

```bash
cd webapp
cp .env.example .env.development   # set REACT_APP_API_URL
npm install
npm start                           # starts on http://localhost:3000
```

### 3. Mobile app

```bash
cd mobileapp
npm install
# Edit src/api/axios.ts — set baseURL to your machine's IP:5001
npx expo start
```

## Documentation index

| Document | Contents |
|----------|----------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design, data flow, key decisions |
| [docs/API_REFERENCE.md](docs/API_REFERENCE.md) | Every endpoint, request/response shapes |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Local setup, environment variables, scripts |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Production deployment (Render, Vercel, EAS) |
| [docs/FEATURES.md](docs/FEATURES.md) | User-facing feature reference |
| [LLM_CONTEXT.md](LLM_CONTEXT.md) | Dense context file for AI assistants |

## Tech stack

**Backend:** Node.js · Express · MongoDB · Mongoose · JWT · bcrypt · express-validator

**Web:** React 18 · React Router v6 · Recharts · Axios · @react-oauth/google

**Mobile:** React Native 0.81.5 · Expo SDK 54 · TypeScript · React Navigation · AsyncStorage

## Key features

- Email/password + Google + Facebook OAuth authentication
- Multi-account management (bank, cash, card, investment) with primary flag
- Income / Expense / Transfer transactions with automatic balance updates
- Category management with custom icons, colours, and monthly budget limits
- Recurring bill tracker (weekly → yearly, EMI, subscriptions) with payment history
- Dashboard with sparkline chart, budget progress bars, and activity tracking
- Analytics with daily series, month-over-month comparison, category breakdown
- Quick Add shortcuts for one-tap common transactions
- CSV export of filtered transactions
- Light / Dark theme
- GBP ↔ INR exchange rate conversion for multi-currency accounts
