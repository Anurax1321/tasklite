# Tasklite

A small full-stack task manager: add tasks, toggle complete, delete, with persistence.

The brief asked for the four CRUD endpoints and a React UI. This repo also includes optional auth, categories, a calendar view, drag-and-drop, theming, and `.ics` import. Treat those as stretch features; the core add/toggle/delete loop works without an account in guest mode.

Built by Anurag Chinnaboina ([GitHub](https://github.com/Anurax1321) · [LinkedIn](https://www.linkedin.com/in/anuragchinnaboina))

## Stack

| Layer    | Tech                                                  |
|----------|-------------------------------------------------------|
| Frontend | React 18, TypeScript, Vite, React Router              |
| Backend  | Node.js, Express, TypeScript                          |
| Storage  | JSON files in `backend/data/` (per-user via JWT)      |
| Tests    | `node:test` + supertest (backend), Vitest + RTL (FE)  |

## Run locally

```bash
# Terminal 1 - backend (http://localhost:5291)
cd backend
npm install
npm run dev

# Terminal 2 - frontend (http://localhost:5292)
cd frontend
npm install
npm run dev
```

Open `http://localhost:5292`. Without an account you're in guest mode (localStorage). Sign up to persist server-side and migrate guest tasks.

## Tests

```bash
cd backend && npm test     # supertest integration tests
cd frontend && npm test    # Vitest component tests
```

## API

All `/api/tasks` and `/api/categories` endpoints require a session cookie (set by `/api/auth/signup` or `/api/auth/login`).

| Method | Path                | Body                                                    |
|--------|---------------------|---------------------------------------------------------|
| GET    | `/api/tasks`        | -                                                       |
| POST   | `/api/tasks`        | `{ title, description?, categoryId?, priority?, dueDate? }` |
| PATCH  | `/api/tasks/:id`    | any subset of the above + `completed?`, `position?`     |
| DELETE | `/api/tasks/:id`    | -                                                       |
| POST   | `/api/auth/signup`  | `{ email, password }`                                   |
| POST   | `/api/auth/login`   | `{ email, password }`                                   |

`priority` is `low | medium | high`. `dueDate` is `YYYY-MM-DD`.

## Configuration

| Var                  | Default                  | Notes                                          |
|----------------------|--------------------------|------------------------------------------------|
| `PORT`               | `5291`                   | Backend listen port                            |
| `FRONTEND_ORIGIN`    | `http://localhost:5292`  | CORS allowlist                                 |
| `JWT_SECRET`         | dev fallback (warns)     | Required (>=32 chars) when `NODE_ENV=production` |
| `TASKLITE_DATA_DIR`  | `backend/data/`          | Used by tests to isolate state                 |
| `VITE_API_BASE`      | `http://localhost:5291`  | Frontend API base URL                          |

## Trade-offs

1. **JSON files instead of SQLite.** Simpler to inspect, fits the brief. Downside: synchronous writes, last-write-wins on concurrent updates. The store modules are isolated so swapping to SQLite is a one-file change.
2. **Auth is in-scope but minimal.** No email verification, no password reset, no rate limiting. Cookie is httpOnly + sameSite=lax + secure-in-prod.
3. **Guest mode duplicates the API in localStorage** so the brief's core loop works without signup. Trade-off: two storage backends behind one `useStores()` interface.
4. **HTML5 native drag-and-drop** instead of `dnd-kit`. Works on desktop; touch is degraded.
5. **Single CSS file with theme variables.** Fast to ship, will need splitting if the codebase grows.

## What I would do next

- Replace JSON store with SQLite via the existing `store.ts` interface.
- Rate-limit `/api/auth/login` and `/api/auth/signup`.
- Replace HTML5 drag-and-drop with `dnd-kit` for touch support.
- Add focus management to modals (return focus on close, trap Tab).
- Wrap guest-to-user migration in a server-side transaction.
