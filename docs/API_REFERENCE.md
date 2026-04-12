# API Reference

Base URL: `http://localhost:5001` (development) or your deployed backend URL.

All protected endpoints require:
```
Authorization: Bearer <jwt_token>
```

JWT tokens expire after **7 days**.

---

## Authentication — `/api/auth`

### POST `/api/auth/register`
Register a new user.

**Body**
```json
{
  "name": "Alice Smith",
  "email": "alice@example.com",
  "password": "secret123"
}
```
**Response 201**
```json
{
  "message": "User registered successfully",
  "token": "<jwt>",
  "user": { "id", "name", "email", "createdAt", "settings" }
}
```
**Errors:** 400 email already exists, 400 validation failure.

---

### POST `/api/auth/login`
Log in with email and password.

**Body**
```json
{ "email": "alice@example.com", "password": "secret123" }
```
**Response 200**
```json
{
  "token": "<jwt>",
  "user": { "id", "name", "email", "createdAt", "settings" }
}
```
**Errors:** 401 invalid credentials.

---

### POST `/api/auth/google`
Sign in / register via Google OAuth.

**Body**
```json
{ "accessToken": "<google_access_token>" }
```
**Response 200** — same shape as `/login`.

---

### POST `/api/auth/facebook`
Sign in / register via Facebook OAuth.

**Body**
```json
{ "accessToken": "<facebook_access_token>" }
```

---

### GET `/api/auth/me` 🔒
Return the authenticated user's profile.

**Response 200**
```json
{
  "user": { "id", "name", "email", "createdAt", "settings" }
}
```

---

### PUT `/api/auth/profile` 🔒
Update display name and/or email.

**Body** (all fields optional)
```json
{ "name": "Alice B. Smith", "email": "new@example.com" }
```
**Response 200**
```json
{ "message": "Profile updated", "user": { ... } }
```

---

### PUT `/api/auth/password` 🔒
Change the user's password.

**Body**
```json
{
  "currentPassword": "old_password",
  "newPassword": "new_password_min6"
}
```

---

### PUT `/api/auth/settings` 🔒
Update app preferences.

**Body** (all fields optional)
```json
{
  "currency": "GBP",
  "dateFormat": "en-GB",
  "theme": "dark",
  "gbpToInr": 125.25
}
```
**Response 200**
```json
{ "message": "Settings updated", "settings": { ... } }
```

---

### GET `/api/auth/quick-add` 🔒
List the user's Quick Add presets.

**Response 200**
```json
{
  "presets": [
    {
      "_id": "...",
      "label": "Grocery run",
      "icon": "🛒",
      "type": "Expense",
      "amount": 45.00,
      "category": "Food and Drinks",
      "subcategory": "Groceries",
      "account": "Monzo",
      "notes": ""
    }
  ]
}
```

---

### POST `/api/auth/quick-add` 🔒
Create a Quick Add preset.

**Body**
```json
{
  "label": "Coffee",
  "icon": "☕",
  "type": "Expense",
  "amount": 3.50,
  "category": "Food and Drinks",
  "account": "Monzo"
}
```
**Response 200** — `{ "presets": [...] }` (full updated array)

---

### PUT `/api/auth/quick-add/:id` 🔒
Update a Quick Add preset. Body same shape as POST (all fields optional).

**Response 200** — `{ "presets": [...] }`

---

### DELETE `/api/auth/quick-add/:id` 🔒
Delete a Quick Add preset.

**Response 200** — `{ "presets": [...] }`

---

### DELETE `/api/auth/account` 🔒
Permanently delete the authenticated user's account and ALL associated data (transactions, accounts, categories, bills).

**Response 200** — `{ "message": "Account deleted successfully" }`

---

## Transactions — `/api/transactions`

### GET `/api/transactions` 🔒
List transactions with optional filters and pagination.

**Query parameters**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 50 | Records per page (max 10000 for export) |
| `type` | string | — | Filter: `Expense`, `Income`, `Transfer` |
| `category` | string | — | Filter by category name |
| `startDate` | string | — | `YYYY-MM-DD` inclusive start |
| `endDate` | string | — | `YYYY-MM-DD` inclusive end |
| `search` | string | — | Full-text search on Category, Account, Notes |
| `sort` | string | `Date:-1` | Sort field and direction |

**Response 200**
```json
{
  "transactions": [
    {
      "_id": "...",
      "Date": "2025-06-15",
      "Type": "EXPENSE",
      "Account": "Monzo",
      "ToAccount": "",
      "Currency": "GBP",
      "Amount": -42.50,
      "Amount_GBP": -42.50,
      "Category": "Food and Drinks",
      "Subcategory": "Groceries",
      "Notes": "Sainsbury's",
      "userid": "..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 324,
    "pages": 7
  }
}
```

---

### POST `/api/transactions` 🔒
Create a transaction and update the affected account balance(s).

**Body**
```json
{
  "Date": "2025-06-15",
  "Type": "EXPENSE",
  "Account": "Monzo",
  "ToAccount": "",
  "Currency": "GBP",
  "Amount": -42.50,
  "Amount_GBP": -42.50,
  "Category": "Food and Drinks",
  "Subcategory": "Groceries",
  "Notes": "Sainsbury's"
}
```

For `Type: "TRANSFER"`:
- `ToAccount` is **required** and must differ from `Account`
- Both account balances are updated atomically

**Response 201**
```json
{ "message": "Transaction created", "transaction": { ... } }
```

---

### PUT `/api/transactions/:id` 🔒
Update a transaction. Old balance changes are reversed first, then new ones applied.

**Body** — same shape as POST (all fields optional).

**Response 200**
```json
{ "message": "Transaction updated", "transaction": { ... } }
```

---

### DELETE `/api/transactions/:id` 🔒
Delete a transaction and reverse its balance effect.

**Response 200** — `{ "message": "Transaction deleted" }`

---

### GET `/api/transactions/stats` 🔒
Aggregate totals across all the user's transactions.

**Response 200**
```json
{
  "totalIncome": 4800.00,
  "totalExpense": 3200.00,
  "balance": 1600.00,
  "count": 148
}
```

---

## Dashboard — `/api/dashboard`

### GET `/api/dashboard/home` 🔒
Primary dashboard data. All computed for the current calendar month.

**Response 200**
```json
{
  "totalBalance": 8450.00,
  "monthlyIncome": 3200.00,
  "monthlyExpense": 1850.75,
  "monthlyNet": 1349.25,
  "monthLabel": "Jun 2025",
  "gbpToInr": 125.25,
  "accounts": [ { "_id", "name", "type", "balance", "currency", "icon", "color", "isPrimary" } ],
  "cashflowCategories": [
    { "name": "Food and Drinks", "amount": 420.00, "count": 18, "color": "#ef4444" }
  ],
  "recentTransactions": [ { ...transaction } ],
  "sparkline": [
    { "date": "2025-06-09", "value": 85.40 }
  ],
  "budgetStatus": [
    {
      "name": "Food and Drinks",
      "icon": "🍔",
      "color": "#ef4444",
      "limit": 500,
      "spent": 420,
      "pct": 84,
      "over": false
    }
  ],
  "lastActivity": {
    "lastVisit": "2025-06-14T09:22:00.000Z",
    "lastUpdate": "2025-06-13T18:45:00.000Z",
    "lastDevice": "Chrome"
  }
}
```

---

### GET `/api/dashboard/analytics` 🔒
Monthly analytics data.

**Query params:** `month=YYYY-MM` (defaults to current month)

**Response 200**
```json
{
  "monthLabel": "Jun 2025",
  "dailySeries": [
    {
      "date": "2025-06-01",
      "day": 1,
      "income": 0,
      "expense": 45.20,
      "cumIncome": 0,
      "cumExpense": 45.20
    }
  ],
  "cashflow": { "income": 3200.00, "expense": 1850.75, "net": 1349.25 },
  "averages": {
    "dayIncome": 106.67,
    "dayExpense": 61.69,
    "weekIncome": 746.67,
    "weekExpense": 431.80,
    "monthIncome": 3200.00,
    "monthExpense": 1850.75
  },
  "compare": {
    "prevMonth": "May 2025",
    "prevIncome": 2900.00,
    "prevExpense": 1700.00,
    "diffIncome": 300.00,
    "diffExpense": 150.75,
    "pctIncome": 10.34,
    "pctExpense": 8.87
  }
}
```

---

### GET `/api/dashboard/categories` 🔒
Expense breakdown by category for a month.

**Query params:** `month=YYYY-MM`

**Response 200**
```json
{
  "monthLabel": "Jun 2025",
  "totalExpense": 1850.75,
  "totalIncome": 3200.00,
  "categories": [
    { "name": "Food and Drinks", "amount": 420.00, "count": 18, "color": "#ef4444", "pct": "22.7" }
  ]
}
```

---

### GET `/api/dashboard/monthly` 🔒
Income vs expense totals for the last 6 months.

**Response 200**
```json
{
  "monthly": [
    { "monthKey": "2025-01", "name": "Jan 2025", "shortName": "Jan", "income": 3000, "expense": 1700 }
  ]
}
```

---

### GET `/api/dashboard/recent` 🔒
Last 10 transactions.

**Response 200** — `{ "transactions": [...] }`

---

## Accounts — `/api/accounts`

### GET `/api/accounts` 🔒
**Response 200** — `{ "accounts": [...] }`

---

### POST `/api/accounts` 🔒
**Body**
```json
{
  "name": "Monzo",
  "type": "bank",
  "balance": 1250.00,
  "currency": "GBP",
  "color": "#008080",
  "icon": "🏦",
  "isPrimary": true
}
```
**Response 201** — `{ "message": "Account created", "account": { ... } }`

---

### PUT `/api/accounts/:id` 🔒
Update any account field. Body same shape as POST.

**Response 200** — `{ "message": "Account updated", "account": { ... } }`

---

### PUT `/api/accounts/:id/set-primary` 🔒
Toggle `isPrimary`. Only one account should be primary at a time — the client is responsible for unsetting the previous primary before calling this.

**Response 200** — `{ "message": "Primary updated", "account": { ... } }`

---

### DELETE `/api/accounts/:id` 🔒
**Response 200** — `{ "message": "Account deleted" }`

---

## Categories — `/api/categories`

### GET `/api/categories` 🔒
Returns all default categories plus the user's custom ones. Seeds defaults on first call if none exist.

**Response 200**
```json
{
  "categories": [
    {
      "_id": "...",
      "name": "Food and Drinks",
      "color": "#ef4444",
      "icon": "🍔",
      "subcategories": ["Restaurants", "Groceries", "Coffee", "Fast Food"],
      "isDefault": true,
      "monthlyLimit": null
    }
  ]
}
```

---

### POST `/api/categories` 🔒
Create a custom category.

**Body**
```json
{
  "name": "Side Hustle",
  "color": "#10b981",
  "icon": "💻",
  "subcategories": ["Freelance", "Consulting"],
  "monthlyLimit": null
}
```
**Response 201** — `{ "message": "Category created", "category": { ... } }`

---

### PUT `/api/categories/:id` 🔒
Update a category (default or custom). All fields optional.

**Response 200** — `{ "message": "Category updated", "category": { ... } }`

---

### DELETE `/api/categories/:id` 🔒
Only custom categories (non-default) can be deleted.

**Response 200** — `{ "message": "Category deleted" }`

---

### POST `/api/categories/:id/subcategories` 🔒
**Body** — `{ "subcategory": "Street Food" }`

**Response 200** — `{ "message": "Subcategory added", "category": { ... } }`

---

### DELETE `/api/categories/:id/subcategories/:sub` 🔒
**Response 200** — `{ "message": "Subcategory removed", "category": { ... } }`

---

## Bills — `/api/bills`

### GET `/api/bills` 🔒
**Response 200**
```json
{
  "bills": [ { ...bill } ],
  "summary": {
    "totalMonthly": 485.00,
    "overdueCount": 1,
    "dueSoonCount": 2,
    "paidThisMonth": 3
  }
}
```

---

### POST `/api/bills` 🔒
**Body**
```json
{
  "name": "Netflix",
  "amount": 17.99,
  "currency": "GBP",
  "category": "Leisure",
  "icon": "📺",
  "color": "#e50914",
  "type": "subscription",
  "frequency": "monthly",
  "dueDay": 15,
  "remindDaysBefore": 3,
  "status": "active"
}
```
**Response 201** — `{ "message": "Bill created", "bill": { ... } }`

---

### PUT `/api/bills/:id` 🔒
Update any bill field.

---

### DELETE `/api/bills/:id` 🔒
**Response 200** — `{ "message": "Bill deleted" }`

---

### POST `/api/bills/:id/pay` 🔒
Record a bill payment. Automatically advances `nextDueDate` and increments `paidInstallments` for EMIs.

**Body**
```json
{
  "amount": 17.99,
  "notes": "Auto-renew"
}
```
**Response 200**
```json
{
  "message": "Payment recorded",
  "bill": { ...updatedBill }
}
```

---

## Error responses

All endpoints return errors in this shape:

```json
{ "message": "Human-readable error description" }
```

| Status | Meaning |
|--------|---------|
| 400 | Validation error / bad request |
| 401 | Missing or invalid JWT |
| 404 | Resource not found |
| 500 | Server error |
