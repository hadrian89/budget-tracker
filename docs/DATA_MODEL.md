# Data Model Reference

Complete field-level documentation for every MongoDB collection.

---

## Users — `users` collection

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `_id` | ObjectId | auto | — | MongoDB default |
| `name` | String | Yes | — | Max 100 chars, trimmed |
| `email` | String | Yes | — | Unique, lowercase, trimmed |
| `password` | String | No | — | bcrypt hash, salt 12; absent for OAuth-only users |
| `googleId` | String | No | — | Sparse index |
| `facebookId` | String | No | — | Sparse index |
| `createdAt` | Date | auto | `Date.now` | |
| `settings.currency` | String | No | `'GBP'` | Display symbol only |
| `settings.dateFormat` | String | No | `'en-GB'` | Locale string: `'en-GB'` \| `'en-US'` \| `'en-CA'` |
| `settings.theme` | String | No | `'light'` | `'light'` \| `'dark'` |
| `settings.gbpToInr` | Number | No | `125.25` | Exchange rate for INR→GBP conversion |
| `lastActivity.lastVisit` | Date | No | — | Updated on every authenticated request |
| `lastActivity.lastUpdate` | Date | No | — | Updated on create/update/delete of transactions or accounts |
| `lastActivity.lastDevice` | String | No | `''` | Parsed from User-Agent / X-Client header |
| `quickAdd` | Array | No | `[]` | Subdocument array, see below |

### quickAdd subdocument

| Field | Type | Required | Default |
|-------|------|----------|---------|
| `_id` | ObjectId | auto | — |
| `label` | String | Yes | — |
| `icon` | String | No | `'📦'` |
| `type` | String | No | `'Expense'` |
| `amount` | Number | No | `null` |
| `category` | String | No | `''` |
| `subcategory` | String | No | `''` |
| `account` | String | No | `''` |
| `notes` | String | No | `''` |

---

## Transactions — `budget_tracker_transactions` collection

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `_id` | ObjectId | auto | — | |
| `userid` | String | No | — | **String** (not ObjectId). Indexed. |
| `Date` | String | No | — | Format: `'YYYY-MM-DD'` |
| `Type` | String | No | — | `'EXPENSE'` \| `'INCOME'` \| `'TRANSFER'` (uppercase) |
| `Account` | String | No | — | Account name (denormalised, not ObjectId ref) |
| `ToAccount` | String | No | `''` | Destination account for TRANSFER |
| `Currency` | String | No | `'GBP'` | |
| `Amount` | Number | No | — | **Signed**: negative for expense, positive for income/transfer |
| `Amount_GBP` | Number | No | — | Mirror of Amount (FX conversion hook) |
| `Category` | String | No | `'Uncategorized'` | Indexed |
| `Subcategory` | String | No | `''` | |
| `Notes` | String | No | `''` | |

**Indexes:** `(userid, Date)`, `(userid, Type)`, `(userid, Category)`

> **Important:** Mixed-case `Type` may exist in legacy data. Always normalise with `$toUpper` in aggregation pipelines.

---

## Accounts — `budget_tracker_accounts` collection

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `_id` | ObjectId | auto | — | |
| `userid` | String | Yes | — | **String**, indexed |
| `name` | String | Yes | — | Used as foreign key in transactions |
| `type` | String | No | — | `'bank'` \| `'cash'` \| `'card'` \| `'investment'` |
| `balance` | Number | No | `0` | Kept current by `applyTransactionBalance()` |
| `currency` | String | No | `'GBP'` | `'GBP'` or `'INR'` are the supported values |
| `color` | String | No | — | Hex colour |
| `icon` | String | No | — | Emoji |
| `isPrimary` | Boolean | No | `false` | No DB uniqueness constraint; client enforces one-at-a-time |
| `createdAt` | Date | auto | `Date.now` | |

---

## Categories — `budget_tracker_categories` collection

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `_id` | ObjectId | auto | — | |
| `name` | String | Yes | — | |
| `color` | String | No | — | Hex colour |
| `icon` | String | No | — | Emoji |
| `subcategories` | [String] | No | `[]` | |
| `userid` | String | No | `null` | `null` for default/system categories |
| `isDefault` | Boolean | No | `false` | Default categories cannot be deleted |
| `monthlyLimit` | Number | No | `null` | Budget cap in GBP; `null` = no limit |
| `createdAt` | Date | auto | — | |
| `updatedAt` | Date | auto | — | |

**Indexes:** `(userid)`, `(isDefault)`

### Default categories (seeded on first request)

| Name | Color | Icon |
|------|-------|------|
| Food and Drinks | `#ef4444` | 🍔 |
| Shopping | `#ec4899` | 🛍️ |
| Vehicle | `#8b5cf6` | 🚗 |
| Leisure | `#f472b6` | 🎉 |
| Transport | `#06b6d4` | 🚌 |
| Bills | `#10b981` | 📄 |
| Housing | `#f59e0b` | 🏠 |
| Health | `#3b82f6` | 💊 |
| Income | `#10b981` | 💰 |
| Other | `#6366f1` | 📦 |

---

## Bills — `bills` collection

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `_id` | ObjectId | auto | — | |
| `userId` | ObjectId | Yes | — | **ObjectId** ref to User (unlike transactions) |
| `name` | String | Yes | — | |
| `amount` | Number | Yes | — | Payment amount |
| `currency` | String | No | `'GBP'` | |
| `category` | String | No | — | |
| `icon` | String | No | — | Emoji |
| `color` | String | No | — | Hex |
| `notes` | String | No | — | |
| `type` | String | No | — | `'bill'` \| `'emi'` \| `'subscription'` |
| `frequency` | String | No | — | `'weekly'` \| `'fortnightly'` \| `'monthly'` \| `'quarterly'` \| `'yearly'` \| `'one-time'` |
| `dueDay` | Number | No | — | Day of month (1–31) |
| `nextDueDate` | Date | No | — | Advanced after each payment |
| `startDate` | Date | No | — | |
| `endDate` | Date | No | — | |
| `totalInstallments` | Number | No | — | EMI: total number of payments |
| `paidInstallments` | Number | No | `0` | EMI: payments made so far |
| `remindDaysBefore` | Number | No | `3` | Days before due date to consider "due soon" |
| `status` | String | No | `'active'` | `'active'` \| `'completed'` \| `'cancelled'` \| `'paused'` |
| `payments` | Array | No | `[]` | Payment history |
| `createdAt` | Date | auto | — | |
| `updatedAt` | Date | auto | — | |

### payments subdocument

| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | auto |
| `paidAt` | Date | Timestamp of payment |
| `amount` | Number | Amount paid |
| `notes` | String | Optional note |

**Indexes:** `(userId, nextDueDate)`, `(userId, status)`

---

## Relationships summary

```
User ──has many──► quickAdd[]          (subdocument, in User doc)
User ──has many──► Transaction         (userid String FK)
User ──has many──► Account             (userid String FK)
User ──has many──► Category (custom)   (userid String FK)
User ──has many──► Bill                (userId ObjectId FK)

Transaction ──references──► Account    (by Account.name string, not ObjectId)
Transaction ──references──► Category   (by Category.name string, not ObjectId)
```

No foreign key constraints are enforced at the database level. Referential integrity is maintained by the application logic (e.g. `applyTransactionBalance` does a case-insensitive name lookup for accounts).
