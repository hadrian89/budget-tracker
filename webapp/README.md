# Walleto Frontend

React 18 single-page application for Walleto budget tracking.

## Prerequisites

- Node.js 18+
- npm or yarn
- Backend running on http://localhost:5001

## Setup & Run

```bash
cd frontend
npm install
npm start
```

The app will open at **http://localhost:3000**

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start development server |
| `npm run build` | Build for production |
| `npm test` | Run tests |

## Features

- **Authentication** — Register / Login with JWT, persisted in localStorage
- **Dashboard** — Stats cards, monthly bar chart, category donut chart, recent transactions
- **Transactions** — Full CRUD with search/filter, pagination, add/edit modal
- **Dark theme** — Professional dark SaaS design

## Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── api/
│   │   └── axios.js          # Axios instance with auth interceptor
│   ├── components/
│   │   ├── Header.js/.css    # Top navigation bar
│   │   ├── Layout.js/.css    # Sidebar + content wrapper
│   │   ├── PrivateRoute.js   # Auth guard
│   │   ├── Sidebar.js/.css   # Navigation sidebar
│   │   ├── StatCard.js/.css  # Dashboard stat card
│   │   └── TransactionModal.js/.css  # Add/Edit modal
│   ├── context/
│   │   └── AuthContext.js    # Auth state management
│   ├── pages/
│   │   ├── Dashboard.js/.css # Main dashboard page
│   │   ├── Login.js/.css     # Login page
│   │   ├── Register.js       # Register page
│   │   └── Transactions.js/.css  # Transactions page
│   ├── App.js                # Router setup
│   ├── index.js              # React 18 entry point
│   └── index.css             # Global styles + CSS variables
└── package.json
```

## Design System

CSS custom properties defined in `src/index.css`:

```css
--bg-primary:    #0f172a  (page background)
--bg-secondary:  #1e293b  (sidebar, cards)
--accent:        #6366f1  (indigo - primary action color)
--success:       #10b981  (green - income)
--danger:        #ef4444  (red - expenses)
--warning:       #f59e0b  (amber - transfers)
```

## API Configuration

The frontend connects to `http://localhost:5001`. To change this, edit:
`src/api/axios.js` — update `API_BASE_URL`
