# Contributing Guide

## Branching

- `main` — production-ready code, deployed automatically
- Feature branches: `feat/<short-description>` (e.g. `feat/recurring-transactions`)
- Bug fixes: `fix/<description>`
- Docs: `docs/<description>`

Commit directly to `main` for small, safe changes. Use a branch + PR for anything that touches multiple files or could break the build.

## Commit messages

Follow the conventional commits format:

```
<type>: <short description>

Examples:
feat: add recurring transaction support
fix: correct INR balance conversion on dashboard
docs: add API reference for bills endpoint
refactor: extract applyTransactionBalance into utility
chore: update Expo SDK to 55
```

Types: `feat`, `fix`, `docs`, `refactor`, `chore`, `test`, `style`

## Adding a new feature

### Backend endpoint

1. Add route handler in the appropriate `backend/routes/*.js` file.
2. Register it in `backend/server.js` if it's a new router file.
3. Add model fields in `backend/models/*.js` if needed.
4. Update `docs/API_REFERENCE.md` with the new endpoint.
5. Update `LLM_CONTEXT.md` if the feature introduces a new pattern.

### New field on an existing model

1. Add the field in `backend/models/*.js`.
2. Update the route that creates/updates the document to handle the field.
3. Update the web form (`webapp/src/components/` or `webapp/src/pages/`).
4. Update the mobile form (`mobileapp/src/components/` or `mobileapp/src/screens/`).
5. Update `docs/DATA_MODEL.md`.

### New web page

1. Create `webapp/src/pages/NewPage.js` and `NewPage.css`.
2. Add the route in `webapp/src/App.js`.
3. Add a nav link in `webapp/src/components/Sidebar.js`.

### New mobile screen

1. Create `mobileapp/src/screens/NewScreen.tsx`.
2. Register in `mobileapp/src/navigation/index.tsx`.

## Code style

### Backend
- CommonJS (`require` / `module.exports`)
- Async/await with try/catch on every route handler
- Return early on errors (`if (!x) return res.status(400).json(...)`)
- Fire-and-forget helpers (like activity tracking) use `.catch(() => {})` — never `await`

### Web (React)
- Functional components with hooks only
- All colours via CSS custom properties (`var(--primary)`) — no hardcoded hex in JS
- `className` strings stay in JSX, styles in the matching `.css` file
- No `useEffect` with missing dependencies — always complete the dep array or use `useCallback`

### Mobile (React Native / TypeScript)
- TypeScript throughout — `any` only for dynamic API responses
- Styles via `StyleSheet.create()` — no inline style objects with dynamic values except for colours
- No unnamed types — always declare an interface or type alias

## Testing

There is no automated test suite at this time. Before merging:

1. Start the backend (`npm run dev`) and confirm no console errors on startup.
2. Test the affected endpoints with curl or Postman.
3. Test the web UI in a browser (Chrome and one other).
4. Test the mobile UI in Expo Go or a simulator.
5. Verify dark mode still renders correctly if CSS was touched.

## Environment files

Never commit `.env` or `.env.development`. Template files (`.env.example`) are the only env files that should be committed.

## Dependencies

- Discuss before adding new npm packages — keep the bundle lean.
- Prefer packages already used in the project (e.g. Axios, Recharts, React Navigation).
- Lock versions in `package.json` — avoid `*` or `latest`.

## Documentation

Update the relevant docs file whenever you:
- Add or change an API endpoint → `docs/API_REFERENCE.md`
- Add or change a model field → `docs/DATA_MODEL.md`
- Add a new feature → `docs/FEATURES.md`
- Change deployment steps → `docs/DEPLOYMENT.md`
- Introduce a new architectural pattern → `docs/ARCHITECTURE.md` and `LLM_CONTEXT.md`
