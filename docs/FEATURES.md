# Feature Reference

Complete guide to every user-facing feature in Walleto.

---

## Authentication

### Email / password
- Register with name, email, and password (min 6 characters).
- Login returns a JWT valid for 7 days.
- Password is bcrypt-hashed (salt factor 12); plaintext is never stored.

### Google OAuth
- One-tap sign-in via Google.
- Automatically links to an existing account if the email matches.
- Available on web and mobile.

### Facebook OAuth
- Same flow as Google. Available on web and mobile.

### Password change
- Requires the current password for verification.
- Settings → Security tab.

### Account deletion
- Permanently deletes all user data: transactions, accounts, categories, bills.
- Requires typing your email address to confirm.
- Settings → Danger Zone tab.

---

## Dashboard

The home screen shows a snapshot of your current financial position.

| Widget | Description |
|--------|-------------|
| Stat cards | Monthly income, monthly expenses, net (income − expenses) |
| Total balance | Sum of all account balances converted to GBP |
| Sparkline | 7-day net cash flow trend chart |
| Managed accounts | Up to 4 accounts with balances |
| Quick Add bar | One-tap shortcuts for common transactions |
| Monthly Flux chart | Income vs expenses bar chart for last 6 months |
| Asset Allocation donut | Spending breakdown by category |
| Budget Limits widget | Progress bars for categories with a monthly limit |
| Activity strip | Last visit time, last data update, device type |
| Recent Movements | Last 8 transactions |

---

## Quick Add

Save transaction templates for recurring entries (e.g. "Grocery run £45", "Coffee £3.50").

- Chips appear on the dashboard for one-tap access.
- Clicking a chip opens the transaction form pre-filled with the preset values.
- Amount is optional in the preset — leave it blank to enter the amount each time.
- Manage presets (add / edit / delete) from the "Manage" button or the "＋" chip.
- Presets are stored per user and sync across web and mobile.

---

## Transactions

### Adding a transaction
Fields:
- **Date** — defaults to today
- **Type** — Expense, Income, or Transfer
- **Account** — selected from your accounts (primary accounts shown first)
- **Amount** — positive number; sign is derived from type
- **Category** — from your category list
- **Subcategory** — optional, from the selected category's subcategories
- **Notes** — free-text

### Transfer type
- Shows two account selectors: From and To.
- Deducts from the source account and credits the destination account.
- The same account cannot be selected for both.

### Editing / deleting
- Edit a transaction to correct any field; account balances are recalculated automatically.
- Deleting reverses the balance effect.

### Search and filters
- Full-text search across Category, Account, and Notes.
- Filter by type (Expense / Income / Transfer).
- Filter by category.
- Filter by date range.
- Filters are combined (AND logic).
- Clear all filters with one click.

### CSV export
- Exports all transactions matching the current filters (up to 10,000).
- Columns: Date, Type, Account, To Account, Category, Subcategory, Amount (GBP), Notes.
- UTF-8 BOM encoding for correct display in Excel.
- Downloaded as `walleto-YYYY-MM-DD.csv`.

### Pagination
- 50 transactions per page on web.

---

## Accounts

Accounts represent your actual financial accounts (bank, cash, card, investment fund).

| Field | Description |
|-------|-------------|
| Name | e.g. "Monzo", "HSBC Savings" |
| Type | bank / cash / card / investment |
| Balance | Current balance (updated automatically by transactions) |
| Currency | GBP or INR (others stored but not converted) |
| Icon | Emoji |
| Colour | Used for visual differentiation |
| Primary | Primary accounts appear first in the transaction form |

### Multi-currency
- INR account balances are converted to GBP using your configured exchange rate (Settings → Preferences → GBP → INR rate) when computing the total balance.
- Transactions are always recorded in GBP.

---

## Categories

### Default categories
Seeded on first use. Cannot be deleted but can be edited (colour, icon, subcategories, monthly limit).

```
Food and Drinks  Shopping  Vehicle  Leisure  Transport
Bills  Housing  Health  Income  Other
```

### Custom categories
Create your own categories with any name, emoji icon, hex colour, and subcategories.

### Monthly budget limits
Set a spending cap per category. The dashboard and categories page show:
- A progress bar (green → yellow at 80% → red when over).
- A badge: "42% of £500" or "⚠ Over".
- Budget status widget on the dashboard lists all capped categories.

### Subcategories
Each category has a list of subcategories (e.g. Food → Restaurants, Groceries, Coffee). Selected in the transaction form after choosing a category.

---

## Analytics

Analytics page provides a deeper view of a selected month.

| Section | Description |
|---------|-------------|
| Month picker | Navigate between months |
| Daily chart | Bar chart of daily income and expense |
| Cashflow summary | Total income, expense, net for the month |
| Averages | Daily, weekly, monthly averages |
| Month comparison | % change vs previous month |
| Category breakdown | Pie chart + list of spending by category |

---

## Bills

Track recurring payments: utility bills, loan EMIs, subscriptions.

### Bill types
- **Bill** — regular recurring payment (rent, electricity)
- **EMI** — fixed-term instalment loan; tracks paid vs total instalments
- **Subscription** — service subscription (Netflix, Spotify)

### Frequencies
weekly / fortnightly / monthly / quarterly / yearly / one-time

### Payment recording
Mark a bill as paid: records the payment, advances `nextDueDate` to the next period, and increments the instalment counter for EMIs.

### Summary bar
At the top of the bills page:
- **Monthly equivalent** — total monthly cost of all active bills normalised from their frequency
- **Overdue** — bills past their due date
- **Due soon** — bills due within `remindDaysBefore` days (default 3)
- **Paid this month** — count of payments made this calendar month

---

## Settings

### Profile
- Update display name and email address.

### Security
- Change password (current password required).
- Password strength indicator.

### Preferences
- **Currency** — display symbol for amounts (GBP, USD, EUR, INR, etc.)
- **Date format** — DD/MM/YYYY, MM/DD/YYYY, or YYYY-MM-DD
- **GBP → INR exchange rate** — used for INR account balance conversion
- **Appearance** — Light or Dark theme

### Theme
- Toggle between Light and Dark mode.
- Also available from the sidebar (moon/sun button) for quick access.
- Preference is saved to your account and persists across sessions and devices.

---

## Dark mode

Every screen and component adapts to dark mode via CSS custom properties (web) and the `Colors` theme constants (mobile).

Toggle from:
- Settings → Preferences → Appearance
- Sidebar → 🌙 Dark Mode button (web)

---

## Activity tracking

Walleto records your last activity metadata non-intrusively:
- **Last visit** — when you last opened the dashboard (without making changes)
- **Last update** — when you last added, edited, or deleted a transaction or account
- **Device** — "Mobile App", "Chrome", "iPhone", etc.

Shown at the bottom of the dashboard.
