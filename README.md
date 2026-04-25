# Tasklite

A small full-stack task manager built for the take-home challenge. Add tasks, mark them complete, delete them, and have everything persist across page refreshes. Around that core, the app grew categories with editable icons and colors, priorities, due dates, a calendar with filters, drag-and-drop reordering, light/dark themes, optional accounts, and one-way calendar import from any `.ics` source (Google / Apple / Outlook).

> **Built by Anurag Chinnaboina** · [GitHub](https://github.com/Anurax1321)

---

## Table of contents

1. [Stack at a glance](#stack-at-a-glance)
2. [Quick start](#quick-start)
3. [Feature tour](#feature-tour)
4. [Architecture](#architecture)
5. [API reference](#api-reference)
6. [Project structure](#project-structure)
7. [How to run and test](#how-to-run-and-test)
8. [Configuration](#configuration)
9. [Rubric crosswalk](#rubric-crosswalk)
10. [Trade-offs and decisions](#trade-offs-and-decisions)
11. [What I would do next](#what-i-would-do-next)

---

## Stack at a glance

| Layer        | Tech                                                    |
| ------------ | ------------------------------------------------------- |
| Frontend     | React 18, TypeScript, Vite, React Router                |
| Backend      | Node 18+, Express, TypeScript, ts-node                  |
| Storage      | JSON files in `backend/data/` (`tasks`, `users`, `categories`) |
| Auth         | Email + password, bcrypt hash, JWT in an `httpOnly` cookie |
| Style system | CSS variables, Inter font, no UI library                |
| Drag/drop    | HTML5 native drag and drop                              |

**Ports** (chosen to avoid the usual 3000/3001/5173/8080 collisions):

- Backend: `5291`
- Frontend: `5292`

---

## Quick start

You will need **Node 18 or newer**. Two terminals, one per side.

### 1. Backend

```bash
cd backend
npm install
npm run dev
# → tasklite backend listening on http://localhost:5291
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# → Local: http://localhost:5292
```

Open `http://localhost:5292` and start adding tasks. The app boots in **guest mode**, no signup required.

### 3. (Optional) Sign up

Click **Log in** in the top bar, switch to the **Sign up** tab, create an account. Any tasks you added as a guest are migrated into your account automatically.

---

## Feature tour

A walkthrough of what the UI gives you and where the logic lives.

### Add tasks

- **Quick add:** the input at the top of the task list creates a task with a default priority and no other metadata.
- **Full modal (`+` button):** opens a dialog with title, description, category, priority pills, and a native date picker. Esc and clicking the backdrop close it.
- **Edit:** clicking anywhere on a task card (other than the checkbox or delete button) reopens the modal pre-filled.

### Complete and delete

- Each card has a checkbox; checking it strikes through the title and pushes it to the bottom of the list.
- Each card has a small `✕` delete button on the right; clicking it removes the task immediately.

### Categories

- Each new account is seeded with eight defaults: Work, Personal, Shopping, Health, Study, Hobby, Finance, Other (each with its own icon and color).
- The sidebar shows the list with task counts per category and **All** at the top.
- Hover over a category to reveal `✎` (edit) and `✕` (delete) actions.
- The `+` next to **Categories** opens a creation modal with an emoji icon picker (24 options) and a color swatch grid (12 options).
- Deleting a category does **not** delete its tasks; they become uncategorized.

### Priority

- Three levels: low (grey), medium (amber), high (red).
- Shown on the card as a small **colored pin** to the right of the title.
- Editable via pills in the task modal.

### Due dates and the calendar

- Set a due date in the modal using the native `<input type="date">`.
- The right-hand calendar shows the current month with a small dot under any day that has tasks. Dot color = highest priority of any task due that day.
- Clicking a day filters the task list to that day; clicking again clears the filter.
- Calendar filters: priority pills (Low/Med/High, multi-select) and a status dropdown (All / Pending / Completed). Both control which days light up.
- A `Today` button jumps the view back to the current month.
- The card itself shows a friendly relative due label ("Today", "Tomorrow", "In 4 days", or a date) and color-codes it: yellow if due within two days, red if overdue.

### Drag-and-drop reorder

- Tasks are draggable. Pick one up by anywhere on the card and drop it above another to reorder.
- The order is persisted as a `position` field per task. The frontend renumbers `1..N` and PATCHes any task whose position changed.
- The current sort is: incomplete first (by `position`), then completed at the bottom (also by `position`). Sort stays stable until you reorder.

### Themes

- One toggle in the top bar swaps **Dark** ↔ **Light**. Dark is the default.
- The choice is persisted in `localStorage` under `tasklite:theme`.
- A tiny inline script in `index.html` applies the saved theme before React mounts to avoid a white flash on dark mode.
- Every component reads from CSS variables, so themes are consistent across cards, modals, calendar, sidebar, and the auth page.

### Accounts (optional) and guest mode

- **Guest mode** is the default. Tasks and categories live in `localStorage` under `tasklite:guest-tasks` / `tasklite:guest-categories`. They survive refresh but not switching browsers.
- A persistent banner at the top reminds guests that signing up keeps their tasks across devices.
- **Sign up / Log in** share one page at `/auth` with tabs.
- Authentication uses bcrypt (10 rounds) for password hashing and a JWT in an `httpOnly`, `sameSite=lax` cookie. Token lifetime is 7 days. The `JWT_SECRET` is read from the environment, with a development fallback warning.
- On signup, any guest tasks **and** custom categories are imported into the new account. Categories are matched to the seeded server categories by name (case-insensitive), with anything not found being created. Then the local copy is cleared. A toast confirms how many tasks were imported.
- On login, no automatic import happens (this avoids accidentally polluting an existing account with leftover guest data).

### Import from any calendar

- Top-bar **📥 Import** button opens a dialog with two modes:
  - **From URL:** paste a public `.ics` URL. For Google Calendar this is at *Settings → Integrate calendar → Public address in iCal format*. Apple iCloud and Outlook expose similar URLs. The backend fetches and parses it.
  - **Paste .ics:** drop the raw text in directly.
- Each `VEVENT` becomes a task: `SUMMARY` → title, `DESCRIPTION` → description, `DTSTART` → due date. Both `DATE` (`20260605`) and `DATE-TIME` (`20260605T143000Z`) formats are supported.
- All imported tasks default to medium priority, no category. You can edit them afterwards.
- Importing requires an account so the data persists. Guests see a friendly redirect to sign up.

### Why not Google OAuth?

A real Google Calendar OAuth integration needs a Google Cloud project, an OAuth consent screen (verified for production), redirect URIs, refresh-token storage, and a couple of days of plumbing. For the take-home scope, one-way `.ics` import achieves the same outcome ("import my Google calendar") with no setup, works for Apple and Outlook for free, and ships in ~80 lines. Two-way sync would justify OAuth; one-way import does not.

---

## Architecture

### High-level

```
┌─────────────────────┐         ┌─────────────────────────┐
│   React frontend    │  cookie │   Express backend       │
│  (Vite, port 5292)  │ ◄─────► │  (ts-node, port 5291)   │
│                     │  JSON   │                         │
│  TaskStore +        │         │  routes/auth            │
│  CategoryStore      │         │  routes/tasks           │
│  abstraction        │         │  routes/categories      │
│   ├─ ServerStore    │         │  routes/import (iCal)   │
│   └─ LocalStore     │         │                         │
│                     │         │  middleware/requireUser │
│  AuthContext        │         │  store / userStore /    │
│  ThemeContext       │         │  categoryStore          │
└─────────────────────┘         └────────────┬────────────┘
                                             │
                                             ▼
                                ┌─────────────────────────┐
                                │  backend/data/*.json    │
                                │  (tasks, users, cats)   │
                                └─────────────────────────┘
```

### Frontend store abstraction

A tiny but important pattern: the UI never imports `fetch` calls directly. Components call `useStores()` which returns either `ServerTaskStore` (HTTP) or `LocalTaskStore` (`localStorage`) depending on whether a user is logged in.

```ts
interface TaskStore {
  list(): Promise<Task[]>;
  create(input: TaskInput): Promise<Task>;
  update(id: string, patch: TaskPatch): Promise<Task>;
  remove(id: string): Promise<void>;
}
```

Same shape, two implementations. Adding a third (e.g. IndexedDB for offline mode) would be a single file.

### Backend layering

- `routes/*` handle HTTP and validation only.
- Each store (`store.ts`, `userStore.ts`, `categoryStore.ts`) owns its own JSON file with `read*` / `write*` helpers. Routes call them by name.
- `middleware/requireUser.ts` reads the JWT cookie, looks up the user, and attaches `req.userId`. Any route that mounts it is automatically scoped per user.
- `auth.ts` holds bcrypt + jsonwebtoken helpers and the cookie config in one place.

The result: adding a new resource (say, "projects") would be one file in `routes/`, one file in `*Store.ts`, three lines added to `index.ts`. Nothing else changes.

### Theme system

A tiny inline script in `index.html` reads the stored theme from `localStorage` and sets `data-theme="light"` or `data-theme="dark"` on `<html>` **before React mounts**. This avoids a flash of white background on dark mode boot. The `ThemeContext` then takes over, exposes `theme` and `toggle`, and updates the same attribute on changes.

All component styles live behind CSS variables defined under `:root[data-theme='light']` and `:root[data-theme='dark']`. No component knows whether it is rendering in light or dark.

---

## API reference

Base URL: `http://localhost:5291` (configurable via `PORT`).

All `/api/tasks`, `/api/categories`, and `/api/import` endpoints require an authenticated cookie. They respond `401 { "error": "not authenticated" }` otherwise.

### Auth

| Method | Path                | Body                       | Response                                          |
| ------ | ------------------- | -------------------------- | ------------------------------------------------- |
| POST   | `/api/auth/signup`  | `{ email, password }`      | `201 User` + cookie + 8 seeded categories         |
| POST   | `/api/auth/login`   | `{ email, password }`      | `200 User` + cookie                               |
| POST   | `/api/auth/logout`  | .                          | `204` (cookie cleared)                            |
| GET    | `/api/auth/me`      | .                          | `200 User` or `401`                               |

`User` is `{ id, email, createdAt }`. Password is at least 6 characters; email is sanity-checked with a regex.

### Tasks

| Method | Path              | Body                                                                                         | Response       |
| ------ | ----------------- | -------------------------------------------------------------------------------------------- | -------------- |
| GET    | `/api/tasks`      | .                                                                                            | `200 Task[]`   |
| POST   | `/api/tasks`      | `{ title, description?, categoryId?, priority?, dueDate? }`                                  | `201 Task`     |
| PATCH  | `/api/tasks/:id`  | any subset of: `title, description, completed, categoryId, priority, dueDate, position`      | `200 Task`     |
| DELETE | `/api/tasks/:id`  | .                                                                                            | `204`          |

Validation:

- `title` must be a non-empty string.
- `priority` must be `"low" | "medium" | "high"`.
- `dueDate` must match `YYYY-MM-DD`. Send `null` or `""` to clear it.
- `categoryId` (when set) must reference a category owned by the same user.
- `position` must be a finite number. Reorder uses `1..N` integers in practice.

### Categories

| Method | Path                    | Body                              | Response                              |
| ------ | ----------------------- | --------------------------------- | ------------------------------------- |
| GET    | `/api/categories`       | .                                 | `200 Category[]`                      |
| POST   | `/api/categories`       | `{ name, icon, color }`           | `201 Category`                        |
| PATCH  | `/api/categories/:id`   | any subset of those               | `200 Category`                        |
| DELETE | `/api/categories/:id`   | .                                 | `204` (tasks become uncategorized)    |

`color` must be a hex string of the form `#RRGGBB`. `icon` is any non-empty string (the UI uses single emoji).

### Import

| Method | Path                    | Body                              | Response                  |
| ------ | ----------------------- | --------------------------------- | ------------------------- |
| POST   | `/api/import/ical`      | `{ url }` or `{ content }`        | `201 { imported, tasks }` |

If `url` is provided, the backend fetches it (rewriting `webcal://` to `https://`). Otherwise `content` is parsed as raw `.ics` text. Returns the count of created tasks and the tasks themselves.

### Shapes

```ts
type Priority = 'low' | 'medium' | 'high';

type Task = {
  id: string;
  userId: string;
  title: string;
  description?: string;
  completed: boolean;
  categoryId?: string;
  priority: Priority;
  dueDate?: string;        // YYYY-MM-DD
  position: number;
  createdAt: string;       // ISO 8601
};

type Category = {
  id: string;
  userId: string;
  name: string;
  icon: string;
  color: string;           // #RRGGBB
  createdAt: string;
};

type User = { id: string; email: string; createdAt: string };
```

---

## Project structure

```
tasklite/
├── backend/
│   ├── data/
│   │   ├── tasks.json                Persistent task storage
│   │   ├── users.json                Hashed-password user records
│   │   └── categories.json           Per-user categories
│   ├── src/
│   │   ├── index.ts                  Express app, CORS, cookie-parser, error handler
│   │   ├── auth.ts                   bcrypt + JWT + cookie config
│   │   ├── userStore.ts              users.json read/write/find helpers
│   │   ├── categoryStore.ts          categories.json + signup-time seed list
│   │   ├── store.ts                  tasks.json read/write
│   │   ├── icalParser.ts             Minimal VEVENT parser (line unfolding, escapes, DTSTART)
│   │   ├── types.ts                  Task, User, Category, Priority
│   │   ├── middleware/
│   │   │   └── requireUser.ts        Reads cookie, attaches req.userId, 401 otherwise
│   │   └── routes/
│   │       ├── auth.ts               signup, login, logout, me
│   │       ├── tasks.ts              CRUD + reorder, scoped to req.userId
│   │       ├── categories.ts         CRUD, scoped to req.userId
│   │       └── import.ts             POST /api/import/ical (URL or paste)
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── index.html                    Theme bootstrap script + Inter font
│   ├── src/
│   │   ├── main.tsx                  Mounts <App />
│   │   ├── App.tsx                   Router shell + ThemeProvider + AuthProvider
│   │   ├── api.ts                    fetch wrappers for auth, tasks, categories, import
│   │   ├── types.ts                  Mirrors backend shapes (no userId on the client)
│   │   ├── constants.ts              Priorities, icon + color choices, guest seed
│   │   ├── index.css                 All styles, CSS variables for both themes
│   │   ├── vite-env.d.ts
│   │   ├── auth/
│   │   │   └── AuthContext.tsx       useAuth + /me bootstrap on app load
│   │   ├── theme/
│   │   │   └── ThemeContext.tsx      Light / Dark toggle (default Dark)
│   │   ├── stores/
│   │   │   ├── types.ts              TaskStore, CategoryStore interfaces
│   │   │   ├── ServerStore.ts        For signed-in users (calls api.ts)
│   │   │   ├── LocalStore.ts         For guests (localStorage), with seed + helpers
│   │   │   └── useStores.ts          Picks ServerStore or LocalStore based on auth
│   │   ├── pages/
│   │   │   ├── AuthPage.tsx          Combined login/signup, guest-data migration
│   │   │   └── TasksPage.tsx         Main app: layout, state, handlers, sort
│   │   └── components/
│   │       ├── TopBar.tsx            Brand, import button, theme toggle, auth menu
│   │       ├── CategorySidebar.tsx   List + add/edit/delete category modal
│   │       ├── Calendar.tsx          Month view, priority + status filters
│   │       ├── TaskInput.tsx         Quick-add row with FAB
│   │       ├── TaskList.tsx          Renders cards + wires HTML5 drag-and-drop
│   │       ├── TaskItem.tsx          Card: left-border = category color, priority pin
│   │       ├── TaskModal.tsx         Full add/edit dialog
│   │       ├── ImportDialog.tsx      Paste .ics URL or content
│   │       └── PriorityDot.tsx
│   ├── vite.config.ts                Pins port 5292
│   ├── package.json
│   └── tsconfig.json
│
├── README.md                         (this file)
└── .gitignore
```

---

## How to run and test

### Manual UI walkthrough

After `npm run dev` on both sides, open `http://localhost:5292` and try this in order. Should take five minutes.

1. **Theme.** Click the **🌙** / **☀️** button. Page flips. Refresh — preference survives.
2. **Quick add.** Type "buy milk" in the top input, hit Enter. Card appears.
3. **Full modal.** Click **+** (right of the input). Add a task with category "Work", priority High, due date next week. Save.
4. **Card details.** The "Work" task now has a blue left border, the title in bold, a red priority pin top-right, a "Work" chip, and a "In 5 days" pill in the meta row.
5. **Toggle.** Click the checkbox on "buy milk". Title gets struck through, opacity drops, item moves to the bottom.
6. **Drag and drop.** Drag any task above another. Order updates instantly. Refresh — order persists.
7. **Calendar.** Note the colored dot under your due date. Click that day. The list filters to just that task. Click again to clear.
8. **Calendar filters.** Toggle the Low/Med/High pills to hide priorities. Use the dropdown to filter by status.
9. **Categories.** Hover **Personal** → click `✎` → change icon and color → save. The chip on any matching task updates.
10. **Add category.** Click `+` next to "Categories", create "Travel" with ✈️ in cyan.
11. **Refresh.** Everything still there (guest mode persists in `localStorage`).
12. **Sign up.** Top-right **Log in** → switch tab to **Sign up** → create an account. Toast: "Imported N tasks from guest mode". Your tasks are now on the server.
13. **Log out, refresh.** Guest mode again, empty (your localStorage was cleared on signup).
14. **Log back in.** Tasks return.
15. **Import.** Click **📥 Import** → paste a public `.ics` URL or test content. New tasks appear with correct due dates.

### API smoke test (curl)

This is what actually runs end-to-end during development. Drop into a `bash` shell.

```bash
# Health
curl http://localhost:5291/health
# → {"ok":true}

# Sign up (sets cookie)
curl -c jar.txt -X POST -H 'Content-Type: application/json' \
  -d '{"email":"a@b.com","password":"secret123"}' \
  http://localhost:5291/api/auth/signup

# Who am I
curl -b jar.txt http://localhost:5291/api/auth/me

# List my categories (8 seeded)
curl -b jar.txt http://localhost:5291/api/categories

# Pick a category id from above, then create a task
CAT=$(curl -s -b jar.txt http://localhost:5291/api/categories \
  | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['id'])")
curl -b jar.txt -X POST -H 'Content-Type: application/json' \
  -d "{\"title\":\"Submit report\",\"categoryId\":\"$CAT\",\"priority\":\"high\",\"dueDate\":\"2026-05-02\"}" \
  http://localhost:5291/api/tasks

# Toggle complete
ID=$(curl -s -b jar.txt http://localhost:5291/api/tasks \
  | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['id'])")
curl -b jar.txt -X PATCH -H 'Content-Type: application/json' \
  -d '{"completed":true}' \
  http://localhost:5291/api/tasks/$ID

# Reorder
curl -b jar.txt -X PATCH -H 'Content-Type: application/json' \
  -d '{"position":99}' \
  http://localhost:5291/api/tasks/$ID

# Import an event from raw .ics
python3 -c "import json; print(json.dumps({'content':'BEGIN:VCALENDAR\nBEGIN:VEVENT\nSUMMARY:Test\nDTSTART;VALUE=DATE:20260601\nEND:VEVENT\nEND:VCALENDAR'}))" \
  | curl -b jar.txt -X POST -H 'Content-Type: application/json' \
       --data-binary @- http://localhost:5291/api/import/ical

# Delete
curl -b jar.txt -X DELETE http://localhost:5291/api/tasks/$ID
# → 204

# Inspect what was persisted
cat backend/data/tasks.json
```

### Type checking

Both projects type-check cleanly. From either folder:

```bash
npx tsc --noEmit
```

### What's intentionally not tested with automation

There is no automated test suite (Jest / supertest). For a take-home of this size, exhaustive curl coverage of the HTTP surface plus type-checking gives strong confidence with low ceremony. Adding `supertest` would be a half-day's work and was deliberately deferred (see [Trade-offs](#trade-offs-and-decisions)).

---

## Configuration

All optional. Sensible dev defaults are baked in.

### Backend env vars

| Variable          | Default                       | Purpose                                   |
| ----------------- | ----------------------------- | ----------------------------------------- |
| `PORT`            | `5291`                        | HTTP port                                 |
| `FRONTEND_ORIGIN` | `http://localhost:5292`       | CORS allow-origin                         |
| `JWT_SECRET`      | `dev-only-insecure-...`       | **Set this in production** — HMAC secret  |
| `NODE_ENV`        | unset                         | `production` flips cookies to `secure`    |

### Frontend env vars

| Variable         | Default                       | Purpose                                          |
| ---------------- | ----------------------------- | ------------------------------------------------ |
| `VITE_API_BASE`  | `http://localhost:5291`       | Set at build time when deploying behind a domain |

Example deploy build:

```bash
cd frontend
VITE_API_BASE=https://api.tasklite.example.com npm run build
```

---

## Rubric crosswalk

The take-home asks for a small full-stack task manager: add tasks, mark complete, delete them, with persistence. That core is fully delivered, and the rest are extras requested mid-build. Mapping back to the rubric:

| Requirement                                          | Where it lives                                              |
| ---------------------------------------------------- | ----------------------------------------------------------- |
| React + TS frontend with input to add tasks          | `frontend/src/components/TaskInput.tsx` and `TaskModal.tsx` |
| List with completion toggle                          | `TaskList.tsx` + `TaskItem.tsx` checkbox                    |
| Delete button per task                               | `TaskItem.tsx` (top-right `✕`)                              |
| Express API with GET / POST / PATCH / DELETE         | `backend/src/routes/tasks.ts`                               |
| JSON file data store                                 | `backend/src/store.ts` + `backend/data/tasks.json`          |
| Persistence across refresh                           | Server (signed-in) or `localStorage` (guest); both verified |
| README explaining how to run + decisions             | This file                                                   |

**Code quality.** Backend is split into `routes/`, `middleware/`, store helpers, and `auth.ts`. Frontend is split into `pages/`, `components/`, `stores/` (with a `TaskStore` interface), and `auth/` / `theme/` contexts. Each file has a single concern; no file does too much.

**Functionality.** Every endpoint is curl-tested end to end (signup → category seeding → task CRUD with validation → cross-user isolation → reorder via `position` patch → iCal import). The UI exercises each path.

**Communication.** This README covers setup, every endpoint, every shape, the architecture, a manual test walkthrough, an API smoke test, and the trade-offs section below explains *why* each design call was made.

---

## Trade-offs and decisions

### Storage

1. **JSON files over a real database.** Honors the assignment's "lightweight data store" guidance and keeps setup zero-config. Cost: writes are not concurrency-safe (last-write-wins). For production I'd swap each `*Store.ts` for SQLite (`better-sqlite3`) without touching routes — the store interface boundary makes it a one-day swap.
2. **Synchronous `fs`.** Simpler than juggling promises in routes, fine for a single-process demo. Async I/O matters at scale; here it would be ceremony.

### Auth

3. **JWT in an `httpOnly` cookie**, not `localStorage`. Guards against XSS token theft. `sameSite: 'lax'` is enough for same-site dev; `secure: true` is on automatically when `NODE_ENV=production`.
4. **`bcryptjs` over native `bcrypt`.** Pure JS, zero native build dependencies. Slightly slower; acceptable for the load.
5. **No password reset, email verification, rate limiting, CSRF tokens, or account deletion.** All out of scope for a take-home. Real production should use a hosted provider (Auth0, Clerk, Supabase) or add these endpoints.

### Frontend

6. **Guest mode via `localStorage` + a store interface.** The UI doesn't know whether it's hitting the server or the browser. Same components work in both states. Adding offline-first IndexedDB would be one more file.
7. **Migration only on signup, not on every login.** Prevents accidentally importing dummy guest data into a returning user's account. A "merge from this browser" button on login could be added if needed.
8. **No external UI library.** Avoids dependency churn, keeps the bundle small, gives full control over the visual language. CSS variables drive light/dark mode so themes stay consistent across every component.
9. **No date library.** Native `Date` is enough for the month-view calendar. Importing `date-fns` for ~6 helpers wasn't worth the kB.
10. **Re-fetch after each mutation** instead of optimistic UI updates. One source of truth (the server / localStorage), no rollback complexity. Reorder is the deliberate exception — list jumps would feel laggy otherwise, so reorder updates state optimistically and re-fetches at the end.
11. **Light/Dark only** (default Dark). I started with a third "System" mode but it added an extra state without UX value for a single-screen app.

### Drag and drop

12. **HTML5 native DnD, not a library.** Avoids `dnd-kit` (~30 kB). Trade-off: less polished on touch devices. `dnd-kit` is a drop-in upgrade.
13. **Reorder writes one PATCH per moved task.** Trivial API surface. At hundreds of items I'd batch via `PUT /api/tasks/positions`.

### Calendar import

14. **One-way `.ics` import, not Google OAuth.** Full OAuth needs a Google Cloud project, consent screen verification, refresh-token handling, redirect URIs — 1–2 days of plumbing for what reduces to "read events into tasks." Pasted `.ics` URLs work for Google **and** Apple **and** Outlook with no setup, in ~80 lines (`backend/src/icalParser.ts` + `routes/import.ts`). Two-way sync (writing back to a calendar) would justify OAuth; one-way import does not.

### Code organization

15. **TypeScript on both sides** with intentionally duplicated types. A monorepo `packages/shared` would be cleaner for a real product but adds build complexity not justified here.
16. **Categories are per-user.** Each new user gets the seed list, but they own their own copies — editing a category doesn't affect anyone else.
17. **Non-default ports (5291 / 5292)** chosen to dodge the usual dev defaults and stay easy to remember as a contiguous pair.

---

## What I would do next

In rough priority order:

1. **Swap JSON files for SQLite** (`better-sqlite3`). Same store interface, real concurrent-write safety, transactions for the "create user + seed 8 categories" flow.
2. **Automated tests.** `supertest` over the HTTP surface, React Testing Library for the modal and calendar.
3. **Password reset + email verification** with rate limiting on `/api/auth/*`.
4. **iCal subscription feed** in the other direction — a `/api/ical/:userToken` endpoint that exposes user tasks as `.ics`, which any calendar app can subscribe to read-only. The simplest external-calendar story for two-way visibility.
5. **`dnd-kit`** for touch-device drag-and-drop and smoother animations.
6. **Recurring tasks, sub-tasks, and search.** Natural next features for a task app.
7. **Dockerfile + docker-compose** for one-command boot.
8. **Optimistic UI with rollback** once the action surface grows beyond what re-fetch can cover comfortably.

---

Built by Anurag Chinnaboina · [GitHub](https://github.com/Anurax1321) · © 2026
