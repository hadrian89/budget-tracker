# Walleto — LLM Context File

This document is written for AI assistants (Claude, GPT, Gemini, etc.) to build a complete mental model of the Walleto budget tracker codebase before answering questions or making changes. Read the whole file before acting.

---

## What this app is

Walleto is a personal finance tracker. Users log income, expenses, and transfers across multiple bank/cash accounts. The app tracks spending by category, manages recurring bills, visualises trends, and alerts on budget limits. There is a React web app, a React Native mobile app (Expo), and a shared Node.js/Express/MongoDB REST API.

---

## Repository layout

```
budget-tracker/
├── backend/                   # Node.js + Express + MongoDB
│   ├── config/db.js           # Mongoose connection
│   ├── middleware/auth.js      # JWT verification → req.user, req.userId
│   ├── models/
│   │   ├── User.js
│   │   ├── Transaction.js
│   │   ├── Account.js
│   │   ├── Category.js
│   │   └── Bill.js
│   ├── routes/
│   │   ├── auth.js            # /api/auth/*
│   │   ├── transactions.js    # /api/transactions/*
│   │   ├── dashboard.js       # /api/dashboard/*
│   │   ├── accounts.js        # /api/accounts/*
│   │   ├── categories.js      # /api/categories/*
│   │   └── bills.js           # /api/bills/*
│   ├── utils/activity.js      # trackVisit(), trackUpdate()
│   └── server.js              # Express bootstrap, CORS, routes
│
├── webapp/src/
│   ├── api/axios.js           # Axios instance, JWT interceptor
│   ├── context/AuthContext.js # Auth state, updateUser applies theme
│   ├── components/
│   │   ├── Layout.js          # Sidebar + <Outlet>
│   │   ├── Sidebar.js         # Nav links + dark mode toggle
│   │   ├── TransactionModal.js # Add/edit transaction; accepts prefill prop
│   │   ├── StatCard.js
│   │   ├── MonthPicker.js
│   │   └── PrivateRoute.js
│   ├── pages/
│   │   ├── Dashboard.js       # Home; quick add chips; budget widget
│   │   ├── Transactions.js    # CRUD list; CSV export; search/filters
│   │   ├── Analytics.js       # Monthly analytics, charts
│   │   ├── CategoriesPage.js  # Category CRUD; monthly limits; donut chart
│   │   ├── AccountsPage.js    # Account CRUD; GBP total with INR conversion
│   │   ├── BillsPage.js       # Bill CRUD; pay action; summary bar
│   │   └── SettingsPage.js    # Profile, security, preferences, danger zone
│   ├── App.js                 # Router; GoogleOAuthProvider; AuthProvider
│   └── index.css              # CSS variables :root (light) + [data-theme="dark"]
│
└── mobileapp/src/
    ├── api/axios.ts           # Axios; X-Client: mobile header; AsyncStorage
    ├── context/AuthContext.tsx
    ├── constants/theme.ts     # Colors, Radius, Shadow constants
    ├── navigation/index.tsx   # Bottom tabs + stack navigator
    ├── components/
    │   ├── AddTransactionModal.tsx
    │   ├── Charts.tsx
    │   ├── MonthPicker.tsx
    │   └── StatCard.tsx
    └── screens/
        ├── DashboardScreen.tsx
        ├── TransactionsScreen.tsx
        ├── AnalyticsScreen.tsx
        ├── CategoriesScreen.tsx
        ├── AccountsScreen.tsx
        ├── BillsScreen.tsx
        ├── SettingsScreen.tsx
        └── auth/{Login,Register}Screen.tsx
```

---

## Data models (what matters most)

### User (`backend/models/User.js`)
```js
{
  name, email, password,           // password is bcrypt (salt 12)
  googleId, facebookId,            // sparse, for OAuth
  settings: {
    currency,                      // display symbol, default 'GBP'
    dateFormat,                    // locale string, default 'en-GB'
    theme,                         // 'light' | 'dark'
    gbpToInr,                      // default 125.25, used for INR→GBP conversion
  },
  lastActivity: { lastVisit, lastUpdate, lastDevice },
  quickAdd: [{ label, icon, type, amount, category, subcategory, account, notes }]
}
```

### Transaction (`backend/models/Transaction.js`)
```js
{
  userid,                          // String, NOT ObjectId — matches req.userId (string from JWT)
  Date,                            // 'YYYY-MM-DD' string
  Type,                            // 'EXPENSE' | 'INCOME' | 'TRANSFER' (uppercase in DB)
  Account,                         // account name string (not ObjectId)
  ToAccount,                       // only for TRANSFER
  Currency,                        // usually 'GBP'
  Amount,                          // signed number (negative for expense)
  Amount_GBP,                      // same as Amount (future FX ready)
  Category,                        // category name, default 'Uncategorized'
  Subcategory, Notes
}
// Indexes: (userid,Date), (userid,Type), (userid,Category)
```

### Account (`backend/models/Account.js`)
```js
{
  userid,                          // String
  name,                            // used as foreign key in transactions
  type,                            // 'bank'|'cash'|'card'|'investment'
  balance,                         // kept current by applyTransactionBalance
  currency,                        // 'GBP' | 'INR'
  color, icon,
  isPrimary                        // primary accounts shown first in tx form
}
```

### Category (`backend/models/Category.js`)
```js
{
  name, color, icon,
  subcategories: [String],
  userid,                          // null for default categories
  isDefault,                       // true = system-seeded, cannot delete
  monthlyLimit                     // Number | null
}
// Default categories seeded on first GET /api/categories if none exist
```

### Bill (`backend/models/Bill.js`)
```js
{
  userId,                          // ObjectId (ref User) — note: ObjectId, unlike transactions
  name, amount, currency,
  type,                            // 'bill'|'emi'|'subscription'
  frequency,                       // 'weekly'|'fortnightly'|'monthly'|'quarterly'|'yearly'|'one-time'
  dueDay,                          // 1-31
  nextDueDate,
  totalInstallments, paidInstallments,  // EMI only
  remindDaysBefore,                // default 3
  status,                          // 'active'|'completed'|'cancelled'|'paused'
  payments: [{ paidAt, amount, notes }]
}
```

---

## Critical implementation details

### Transaction userid type
Transaction.userid is stored as a **String** (from `req.userId`, which is `jwt.payload.userId.toString()`). Bill.userId is an **ObjectId**. These are inconsistent — always match accordingly in queries.

### Balance update mechanism
`applyTransactionBalance(userId, tx, direction)` in `routes/transactions.js`:
- direction `+1` = apply, `-1` = reverse
- INCOME → `Account.balance += direction * abs(amount)`
- EXPENSE → `Account.balance -= direction * abs(amount)`
- TRANSFER → source debited, destination credited
- On UPDATE: reverse old first, then apply new
- On DELETE: reverse only
- Account lookup is case-insensitive by name

### Type normalisation in aggregations
Transactions in MongoDB may have mixed-case `Type` values (legacy data). Every aggregation stage that filters by type uses:
```js
{ $addFields: { _typeNorm: { $toUpper: '$Type' } } }
```
then matches on `_typeNorm`. Never filter raw `Type` directly in aggregation.

### Amount sign convention
- `Amount` is **signed**: negative for EXPENSE, positive for INCOME/TRANSFER
- `Amount_GBP` mirrors `Amount`
- `Math.abs()` is applied whenever displaying or aggregating amounts
- The UI always sends signed amounts in the payload

### JWT flow
1. Login/register/OAuth → `jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })`
2. Auth middleware extracts token → `req.userId = decoded.userId` (string), `req.user = await User.findById(userId)`
3. Axios interceptors on web and mobile auto-inject `Authorization: Bearer <token>`
4. 401 response → clearAuth() → redirect to /login

### Dark mode (web)
- CSS custom properties in `:root` for light mode
- `[data-theme="dark"]` block overrides all surface/text/shadow variables
- Applied via `document.documentElement.setAttribute('data-theme', theme)`
- Triggered on mount (from localStorage user) and in `AuthContext.updateUser()`
- Sidebar has a quick toggle button that calls PUT /api/auth/settings + updateUser()

### Theme on mobile
Mobile does NOT have dark mode yet. Only the web implements `[data-theme]`. The mobile `Colors` constant is hardcoded light theme.

### GBP/INR conversion
- Only INR accounts are converted to GBP for the dashboard total balance
- Formula: `balance_gbp = balance_inr / gbpToInr`
- `gbpToInr` default is 125.25, stored in `user.settings`
- Transactions are always stored in GBP regardless of account currency

### Quick Add presets
- Stored as a subdocument array on User (`user.quickAdd`)
- Routes: GET/POST/PUT/DELETE `/api/auth/quick-add`
- The web Dashboard passes a `prefill` prop to `TransactionModal` that spreads preset values into the initial form state
- `prefill` shape: `{ Type, Category, Account, Amount, Notes }`

### CSV export
- Entirely client-side in `webapp/src/pages/Transactions.js`
- Fetches up to 10,000 rows with active filters
- Builds UTF-8 BOM CSV string, creates Blob, triggers download via temporary `<a>`
- No backend endpoint

### CORS
`server.js` maintains a `ALLOWED_ORIGINS` array. Requests with no origin (mobile apps, Postman) are always allowed. Add new web domains here.

### Activity tracking
`utils/activity.js` exports:
- `trackVisit(userId, req)` — updates `lastVisit` + parses `X-Client` header and User-Agent for device name
- `trackUpdate(userId)` — updates `lastUpdate`
Both are fire-and-forget (`.catch(() => {})`). They are called AFTER the response is sent to avoid blocking.

### Device detection
The mobile Axios instance sends `X-Client: mobile`. `parseDevice()` checks this header first. If absent, it parses the User-Agent string for browser/OS names.

### Default categories seeding
`GET /api/categories` checks `Category.findOne({ isDefault: true })`. If null, inserts 10 default categories. This means every new installation auto-seeds on first category fetch.

### Bill nextDueDate advancement
When `POST /api/bills/:id/pay` is called, the route calculates `nextDueDate` by adding the frequency interval to the current `nextDueDate` (not today), ensuring payments don't drift.

---

## Web routing

```
/login           → Login.js        (public)
/register        → Register.js     (public)
/ (Layout)       → PrivateRoute wraps all below
  /dashboard          → Dashboard.js
  /categories-page    → CategoriesPage.js
  /analytics          → Analytics.js
  /transactions       → Transactions.js
  /accounts           → AccountsPage.js
  /bills              → BillsPage.js
  /settings           → SettingsPage.js
* → redirect /dashboard
```

## Mobile navigation

```
TabNavigator (bottom tabs)
  Dashboard     → DashboardScreen
  Categories    → CategoriesScreen
  Analytics     → AnalyticsScreen
  Transactions  → TransactionsScreen
  Accounts      → AccountsScreen
  Bills         → BillsScreen

StackNavigator (modal)
  Settings      → SettingsScreen (opened from Dashboard header icon)
```

---

## Key files to read for common tasks

| Task | Files |
|------|-------|
| Add a new API endpoint | `backend/routes/<route>.js`, `backend/server.js` (register route) |
| Add a new field to transactions | `backend/models/Transaction.js`, `webapp/src/components/TransactionModal.js`, `mobileapp/src/components/AddTransactionModal.tsx` |
| Change how balances are calculated | `backend/routes/transactions.js` → `applyTransactionBalance()` |
| Add a new dashboard widget | `backend/routes/dashboard.js` → `/home` route, `webapp/src/pages/Dashboard.js` + `Dashboard.css` |
| Add a new setting | `backend/models/User.js` → `settings`, `backend/routes/auth.js` → `allowed` array in PUT /settings, `webapp/src/pages/SettingsPage.js` → `PreferencesTab`, `mobileapp/src/screens/SettingsScreen.tsx` |
| Fix a dark-mode style | `webapp/src/index.css` → `[data-theme="dark"]` block, or the individual page's CSS file |
| Add a mobile screen | `mobileapp/src/screens/`, `mobileapp/src/navigation/index.tsx` |
| Change category defaults | `backend/routes/categories.js` → `DEFAULT_CATEGORIES` array |

---

## Common gotchas

1. **userid vs userId**: Transactions use lowercase `userid` (String). Bills use camelCase `userId` (ObjectId). Always check before writing queries.

2. **Type case**: The DB has mixed-case Type values. Always normalise with `{ $toUpper: '$Type' }` in aggregations, or `tx.Type?.toUpperCase()` in JavaScript.

3. **Amount sign**: The UI sends negative amounts for expenses. When displaying, always use `Math.abs()`. When aggregating sums, use `{ $abs: '$_amount' }`.

4. **Date format**: Dates in transactions are `YYYY-MM-DD` strings. Range queries work as string comparisons (`$gte`, `$lte`) because the format is lexicographically sortable.

5. **TransactionModal prefill**: The `prefill` prop only applies when adding a new transaction (`!transaction`). It is spread into the initial form state via `{ ...initialForm, Date: nowDate(), ...(prefill || {}) }`.

6. **Mobile baseURL**: The mobile Axios instance hardcodes the backend URL. It must be changed when deploying — there is no env file for mobile by default.

7. **CORS**: Adding a new web domain requires updating `ALLOWED_ORIGINS` in `backend/server.js`, or setting `ALLOWED_ORIGINS` in the backend's environment variables (comma-separated).

8. **Primary accounts**: Only the client enforces "one primary at a time". The DB has no unique constraint on `isPrimary: true`. The PUT `/accounts/:id/set-primary` route does not clear other primaries — the web and mobile clients do this manually before calling the route.

9. **Bill userId type**: Bills use `userId` as an ObjectId ref, not a plain string. Queries must use `mongoose.Types.ObjectId(req.userId)` or rely on Mongoose casting.

10. **Quick Add amount**: `amount` in a quick-add preset is optional. `null` means "prompt the user at add time". The `prefill` object passed to TransactionModal sets `Amount: p.amount ? String(p.amount) : ''`.

---

## API base paths summary

| Resource | Base path |
|----------|-----------|
| Auth + settings + presets | `/api/auth` |
| Transactions | `/api/transactions` |
| Dashboard data | `/api/dashboard` |
| Accounts | `/api/accounts` |
| Categories | `/api/categories` |
| Bills | `/api/bills` |
| Health check | `/api/health` |

---

## Design system tokens

### Web (CSS variables, `index.css`)
```css
/* Surfaces */    --bg  --surface  --surface-lowest  --surface-low
                  --surface-container  --surface-high  --surface-highest
/* Text */        --on-bg  --on-surface  --on-surface-variant  --outline  --outline-variant
/* Brand */       --primary (#5b5b5f)  --primary-dim  --tertiary (#b60051)
/* Status */      --error (#b31b25)
/* Radii */       --radius-card(32)  --radius-xl(24)  --radius-lg(16)
                  --radius-md(12)  --radius-sm(8)  --radius-full(9999)
/* Shadows */     --shadow-card  --shadow-float  --shadow-sm
```

Dark mode overrides all surface, text, and shadow tokens under `[data-theme="dark"]`.

### Mobile (TypeScript constants, `constants/theme.ts`)
```ts
Colors.primary = '#2c2f30'
Colors.income  = '#00875a'
Colors.expense = '#b60051'
Colors.accent  = '#5b5b5f'
Colors.error   = '#b31b25'
Radius.card = 24, Radius.md = 12, Radius.full = 999
Shadow.sm, Shadow.md, Shadow.lg (shadowColor, shadowOffset, shadowOpacity, shadowRadius, elevation)
```
