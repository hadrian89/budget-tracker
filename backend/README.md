# Walleto Backend

Node.js + Express + MongoDB REST API for Walleto budget tracking application.

## Prerequisites

- Node.js 18+
- npm or yarn
- MongoDB Atlas connection (already configured in `.env`)

## Setup & Run

```bash
cd backend
npm install
npm run dev
```

The server will start on **http://localhost:5001**

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with nodemon (auto-reload on changes) |
| `npm start` | Start in production mode |

## Environment Variables (`.env`)

```
MONGO_URI=mongodb+srv://...
JWT_SECRET=Walleto_jwt_secret_2024
PORT=5001
```

## API Endpoints

### Auth
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login and get JWT | Public |
| GET | `/api/auth/me` | Get current user | Private |

### Transactions
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/transactions` | List transactions (paginated, filterable) | Private |
| POST | `/api/transactions` | Create transaction | Private |
| PUT | `/api/transactions/:id` | Update transaction | Private |
| DELETE | `/api/transactions/:id` | Delete transaction | Private |
| GET | `/api/transactions/stats` | Get totals (income, expense, balance) | Private |

#### Transaction Query Params
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `type` - Filter by type: EXPENSE, INCOME, TRANSFER
- `category` - Filter by category name
- `startDate` - Filter from date (YYYY-MM-DD)
- `endDate` - Filter to date (YYYY-MM-DD)
- `search` - Search in category, subcategory, account

### Dashboard
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/dashboard/monthly` | Last 6 months income vs expense | Private |
| GET | `/api/dashboard/categories` | Top 8 categories by spend | Private |
| GET | `/api/dashboard/recent` | Last 10 transactions | Private |

## Project Structure

```
backend/
├── config/
│   └── db.js           # MongoDB connection
├── middleware/
│   └── auth.js         # JWT auth middleware
├── models/
│   ├── User.js         # User model
│   └── Transaction.js  # Transaction model (maps to 'wallets' collection)
├── routes/
│   ├── auth.js         # Authentication routes
│   ├── transactions.js # CRUD transaction routes
│   └── dashboard.js    # Dashboard aggregation routes
├── .env                # Environment variables
├── server.js           # Express app entry point
└── package.json
```

## Authentication

All private routes require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

Tokens expire after 7 days.
