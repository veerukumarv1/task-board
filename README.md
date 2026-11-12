# Task Board

A small multi-tenant SaaS task board built as a take-home exercise. Seeded organizations manage their own tasks on a Kanban board (**To do** / **In progress** / **Done**) with native drag-and-drop. Users never see or mutate another organization’s data. There is no organization admin portal — organizations are seeded.

## Stack

| Layer | Choice |
| --- | --- |
| Backend | Laravel 13 (PHP 8.3+) |
| Auth | Laravel Sanctum SPA cookie auth (HttpOnly session + CSRF) |
| Database | MySQL (central landlord + one DB per organization) |
| Frontend | React + TypeScript + Vite |
| Styling | Pure SCSS (no UI component library) |
| Backend tests | PHPUnit (unit + feature) |
| Browser tests | Custom Chrome DevTools Protocol harness (Node built-ins only; no Playwright/Puppeteer) |

### Runtime security note

This project targets a patched PHP build because of critical advisories **CVE-2026-109618** and **CVE-2026-109619** (unauthenticated RCE). Use **PHP 8.3.36+ / 8.4.27+ / 8.5.12+**. Development here used **PHP 8.4.27**.

## Product features

- Kanban board with drag-and-drop status updates
- Task create / view / edit / delete (custom confirm dialog)
- Light / dark mode
- Accent color themes (presets + custom color)
- Avatar account menu (name, email, organization, sign out)
- Custom modal selects for status and assignee
- Responsive layout (desktop, tablet, mobile)

## Assumptions

- Multi-tenancy uses a **database per organization**: a central (landlord) DB holds the tenant registry and email→tenant login index; each org gets its own MySQL database for users and tasks.
- Organizations and users are **seeded**; no CRUD for organizations. Seeding creates `task_board_acme` and `task_board_globex` (prefix configurable via `TENANT_DB_PREFIX`).
- Task statuses: `todo`, `in_progress`, `done`.
- Cross-organization access is denied by connection switching (foreign rows are not in the active DB → 404) plus assignee validation against the current tenant DB.

## Demo accounts

Password for all: `password`

| Email | Organization | User |
| --- | --- | --- |
| `alice@acme.test` | Acme Corp | Alice Nguyen |
| `bob@acme.test` | Acme Corp | Bob Martinez |
| `carol@globex.test` | Globex Industries | Carol Okonkwo |
| `dan@globex.test` | Globex Industries | Dan Patel |

## Setup (end-to-end)

You need **two terminals**: API on port **8000**, SPA on port **5173**. Use the demo accounts from the table above to sign in (they are not shown on the login screen).

### Prerequisites

- PHP **8.4.27+** (or another patched 8.3.36+ / 8.4.27+ / 8.5.12+ build), Composer, Node 20+
- MySQL running and reachable
- A MySQL user that can create databases (seeding creates per-org DBs)
- Google Chrome (only for optional browser smoke tests)

### 1. Database

Create the **central** database (tenant DBs are created automatically by `migrate:fresh --seed`):

```sql
CREATE DATABASE task_board CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Edit `backend/.env` with your MySQL credentials and Sanctum/SPA settings:

```env
APP_NAME="Task Board"
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=task_board
DB_USERNAME=root
DB_PASSWORD=your_password
TENANT_DB_PREFIX=task_board

FRONTEND_URL=http://localhost:5173
SANCTUM_STATEFUL_DOMAINS=localhost:5173,127.0.0.1:5173,localhost,127.0.0.1
SESSION_DOMAIN=null
```

Then migrate, seed, and serve:

```bash
php artisan migrate:fresh --seed
php artisan serve
```

This creates central tables, provisions `task_board_acme` / `task_board_globex`, and seeds users + tasks. API: [http://localhost:8000](http://localhost:8000).

If you only need to re-run tenant schema later: `php artisan tenants:migrate`.

See also [backend/README.md](backend/README.md).

### 3. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

The Vite dev server proxies `/api` and `/sanctum` to Laravel so Sanctum session cookies stay same-origin. Leave `VITE_API_URL` unset/empty in local development.

Default accent color is **Ocean** (`#0e7490`). Light/dark follows system preference until changed; both preferences persist in `localStorage`.

See also [frontend/README.md](frontend/README.md).

### 4. Smoke-check

1. Open the SPA and sign in with `alice@acme.test` / `password`.
2. Confirm the Kanban board loads with Acme tasks.
3. Sign out, then sign in as `carol@globex.test` / `password` and confirm a different task set (Globex).

## Tests

### Backend (unit + feature)

```bash
cd backend
php artisan test
```

Coverage includes (~43 PHPUnit tests):
- Auth: login success/validation/failure, unknown email, profile, logout, guest denial, session stores `tenant_id`, login then tenant-scoped API calls
- Task CRUD: list/filter/show/create/update/delete, validation errors
- Tenant isolation: separate DBs, cross-tenant view/update/delete denied, foreign assignee rejected, filtered lists do not leak
- Safety: user provider returns null when no tenant is active (avoids central-DB lookups on session save)

### Frontend (Vitest)

```bash
cd frontend
npm test
```

Coverage includes initials helper, accent hex normalization, ConfirmDialog, SelectField, and UserMenu.

### Browser scenarios (Chrome CDP, no npm browser packages)

With backend and frontend already running:

```bash
node browser-tests/run.mjs
```

This launches a **visible** Chrome window and runs create → view/edit → drag to Done → delete → theme controls → logout on desktop (`1280×800`), tablet (`768×1024`), and mobile (`375×667`).

Optional env vars: `CHROME_PATH`, `FRONTEND_URL`, `CDP_PORT`.

## Key technical decisions

1. **Sanctum SPA cookies** over API tokens for a first-party browser app (HttpOnly session cookie + CSRF). Remember-me is disabled because it cannot carry tenant context.
2. **Database-per-tenant** isolation: central registry + `tenant_user_index` for email login routing; runtime `tenant` connection switched from the session.
3. **Sessions stay on the central DB** so Sanctum cookies keep working across tenant connection switches. Tenancy is bootstrapped early in Sanctum’s stack (before CSRF / session auth) so `Auth::id()` during session save hits the correct DB.
4. **Pure SCSS + CSS variables** for theming (light/dark + accent) without a component library.
5. **Zero-dependency CDP harness** to demonstrate real browser coverage without adding Playwright/Puppeteer.

## AI-assisted workflow

AI tools (Cursor) were used to scaffold and iterate quickly. All tenancy rules, auth wiring, tests, and UI behavior were reviewed, validated with automated tests, and owned as production-minded application code.

## Limitations / next steps

- Organization admin portal (org CRUD, invites)
- Roles/permissions inside an organization
- Login rate limiting (`throttle`) and production security headers (CSP, HSTS, etc.)
- Accessibility: modal focus trap, keyboard alternatives to drag-and-drop, full listbox keyboard support on custom selects
- Audit logging for cross-tenant denial attempts
- Denser browser coverage beyond smoke paths
- Production checklist: `APP_DEBUG=false`, `SESSION_SECURE_COOKIE=true` on HTTPS, MySQL user with `CREATE DATABASE`
