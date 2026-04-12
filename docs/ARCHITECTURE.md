# Architecture

## System overview

```
┌─────────────────────────────────────────────────────────┐
│                        Clients                          │
│                                                         │
│   ┌──────────────┐         ┌──────────────────────┐    │
│   │  React Web   │         │  React Native Mobile  │    │
│   │  (Port 3000) │         │   (Expo Go / APK)    │    │
│   └──────┬───────┘         └──────────┬────────────┘    │
└──────────┼──────────────────────────── ┼────────────────┘
           │  HTTP + JWT Bearer           │  HTTP + JWT Bearer
           │  X-Client: web              │  X-Client: mobile
           ▼                             ▼
┌──────────────────────────────────────────────────────────┐
│               Node.js / Express API (Port 5001)          │
│                                                          │
│  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌──────────┐  │
│  │   Auth   │ │Transactions│ │Dashboard │ │  Bills   │  │
│  │  Routes  │ │  Routes   │ │  Routes  │ │  Routes  │  │
│  └──────────┘ └───────────┘ └──────────┘ └──────────┘  │
│                                                          │
│  ┌──────────────┐  ┌───────────────┐  ┌─────────────┐  │
│  │ Auth         │  │ Activity      │  │ Balance     │  │
│  │ Middleware   │  │ Tracker       │  │ Updater     │  │
│  └──────────────┘  └───────────────┘  └─────────────┘  │
└─────────────────────────────┬────────────────────────────┘
                              │ Mongoose ODM
                              ▼
                    ┌─────────────────┐
                    │  MongoDB Atlas  │
                    │                 │
                    │  Users          │
                    │  Transactions   │
                    │  Accounts       │
                    │  Categories     │
                    │  Bills          │
                    └─────────────────┘
```

## Data models

### User
Stores authentication credentials, app settings, activity metadata, and quick-add presets.

```
User {
  _id          ObjectId
  name         String (required)
  email        String (unique, lowercase)
  password     String (bcrypt, salt 12) — absent for OAuth users
  googleId     String (sparse)
  facebookId   String (sparse)
  createdAt    Date

  settings {
    currency   String  default: 'GBP'
    dateFormat String  default: 'en-GB'
    theme      String  default: 'light'   — 'light' | 'dark'
    gbpToInr   Number  default: 125.25
  }

  lastActivity {
    lastVisit   Date
    lastUpdate  Date
    lastDevice  String   — 'Mobile App' | 'Chrome' | 'iPhone' | etc.
  }

  quickAdd [{
    _id         ObjectId (auto)
    label       String (required)
    icon        String  default: '📦'
    type        String  default: 'Expense'
    amount      Number | null
    category    String
    subcategory String
    account     String
    notes       String
  }]
}
```

### Transaction
One row per financial event. `Type` is stored uppercase; `Amount` is signed (negative for expenses).

```
Transaction {
  _id          ObjectId
  userid       String (indexed)
  Date         String  'YYYY-MM-DD'
  Type         String  'EXPENSE' | 'INCOME' | 'TRANSFER'
  Account      String  (account name, not ObjectId)
  ToAccount    String  (used for TRANSFER type only)
  Currency     String  default: 'GBP'
  Amount       Number  (signed: negative for expense)
  Amount_GBP   Number  (same as Amount until FX is implemented)
  Category     String  default: 'Uncategorized'
  Subcategory  String
  Notes        String
}
Indexes: (userid, Date), (userid, Type), (userid, Category)
```

### Account
A user's financial account. Balance is maintained in real time by `applyTransactionBalance`.

```
Account {
  _id        ObjectId
  userid     String (indexed)
  name       String (required)
  type       String  'bank' | 'cash' | 'card' | 'investment'
  balance    Number  default: 0
  currency   String  default: 'GBP'
  color      String
  icon       String  emoji
  isPrimary  Boolean default: false
  createdAt  Date
}
```

### Category
Default categories are seeded globally (isDefault: true). User-created categories are scoped to userid.

```
Category {
  _id           ObjectId
  name          String (required)
  color         String  hex
  icon          String  emoji
  subcategories [String]
  userid        String | null
  isDefault     Boolean default: false
  monthlyLimit  Number | null   — budget cap in GBP
  createdAt     Date
  updatedAt     Date
}
Indexes: (userid), (isDefault)
```

### Bill
Recurring payment tracker. `nextDueDate` is updated after each payment.

```
Bill {
  _id                ObjectId
  userId             ObjectId (ref: User)
  name               String (required)
  amount             Number (required)
  currency           String default: 'GBP'
  category           String
  icon               String emoji
  color              String hex
  notes              String
  type               String  'bill' | 'emi' | 'subscription'
  frequency          String  'weekly'|'fortnightly'|'monthly'|'quarterly'|'yearly'|'one-time'
  dueDay             Number  1-31
  nextDueDate        Date
  startDate          Date
  endDate            Date
  totalInstallments  Number  (EMI)
  paidInstallments   Number  (EMI)
  remindDaysBefore   Number  default: 3
  status             String  'active'|'completed'|'cancelled'|'paused'
  payments [{
    paidAt   Date
    amount   Number
    notes    String
  }]
  createdAt Date
  updatedAt Date
}
Indexes: (userId, nextDueDate), (userId, status)
```

## Authentication flow

```
Client                          Server
  │                               │
  ├─ POST /api/auth/login ────────►│
  │   { email, password }         │ validate → comparePassword (bcrypt)
  │◄───────────────────────────── ┤ jwt.sign({ userId }, secret, 7d)
  │   { token, user }             │
  │                               │
  │ Store token in                │
  │ localStorage / AsyncStorage   │
  │                               │
  ├─ GET /api/anything ───────────►│
  │   Authorization: Bearer <tok> │ auth middleware: jwt.verify
  │   X-Client: web | mobile      │ attach req.user, req.userId
  │◄───────────────────────────── ┤ response
  │                               │
  │ 401 response                  │
  ├──────────────────────────────►│ clearAuth() → redirect /login
```

**OAuth:** Client obtains an access token from Google/Facebook, POSTs it to the backend which validates it against the provider's API, then finds or creates a user record and returns a Walleto JWT. No OAuth tokens are stored server-side.

## Transaction balance update

Every write (create, update, delete) on a transaction calls `applyTransactionBalance`:

```
applyTransactionBalance(userId, transaction, direction)
  direction: +1 = apply, -1 = reverse

  INCOME:   Account.balance += direction * abs(amount)
  EXPENSE:  Account.balance -= direction * abs(amount)
  TRANSFER: Account.balance    -= direction * abs(amount)  (debit source)
            ToAccount.balance  += direction * abs(amount)  (credit dest)

On UPDATE:
  1. reverse old transaction  (direction = -1)
  2. apply new transaction    (direction = +1)

On DELETE:
  1. reverse deleted transaction (direction = -1)
```

## Dashboard aggregation

`GET /api/dashboard/home` runs these queries in parallel:

1. `Account.find` → total balance (INR accounts converted via `gbpToInr`)
2. `Transaction.aggregate` → current month income + expense totals
3. `Transaction.aggregate` → top-8 expense categories
4. `Transaction.find` → 5 most recent transactions
5. `Transaction.aggregate` → 7-day daily net for sparkline
6. `Category.find` where `monthlyLimit != null` → budget status

Activity tracking fires non-blocking after response is sent.

## Device detection

The mobile app injects `X-Client: mobile` in every request header. `parseDevice(ua, clientHeader)` in `utils/activity.js` checks this first, then falls back to User-Agent parsing for browser detection.

## Theme system (web)

CSS custom properties are defined in `:root` (light) and overridden under `[data-theme="dark"]`. Theme is stored in `user.settings.theme`, applied via `document.documentElement.setAttribute('data-theme', theme)` in `AuthContext.updateUser()` and on mount.

## Multi-currency

Only GBP and INR are handled. Non-GBP account balances (INR) are converted to GBP for dashboard total balance using `user.settings.gbpToInr` (default 125.25). Transaction amounts are always stored in GBP in `Amount_GBP`.

## Quick Add presets

Stored as a subdocument array on the User model. Each preset is a transaction template (type, category, account, optional default amount). Clicking a chip on the Dashboard pre-fills the TransactionModal via a `prefill` prop.

## CSV export (web)

Client-side only. Fetches up to 10,000 transactions with current active filters, builds a UTF-8 BOM CSV string, creates a Blob, and triggers a download via a temporary `<a>` element. No server-side streaming endpoint.
