# Task Board — Backend

Laravel 13 API for the Task Board take-home exercise.

For full project setup, assumptions, demo accounts, and end-to-end testing, see the [root README](../README.md).

## Stack

- Laravel 13 + PHP 8.3+
- Laravel Sanctum (SPA cookie auth)
- MySQL (central landlord DB + one database per organization)
- PHPUnit feature/unit tests (including tenant isolation)

## Tenancy model

- **Central DB** (`DB_DATABASE`): `tenants`, `tenant_user_index`, sessions/cache/jobs
- **Tenant DBs** (`task_board_{slug}` by default): `users`, `tasks`
- Central migrations live in `database/migrations/`; per-tenant schema in `database/migrations/tenant/`
- Login looks up the email in `tenant_user_index`, switches the `tenant` connection, then authenticates against that org’s `users` table (no remember-me cookie)
- Sanctum stack bootstraps tenancy from the session **before** CSRF / `AuthenticateSession`, so session save never queries `users` on the central DB
- The MySQL user needs privilege to `CREATE DATABASE` (seeding provisions each tenant DB)

## Run

From this directory (MySQL central DB already created — see [root README](../README.md)):

```bash
composer install
cp .env.example .env   # then set DB_* + FRONTEND_URL / SANCTUM_STATEFUL_DOMAINS
php artisan key:generate
php artisan migrate:fresh --seed   # also creates task_board_acme / task_board_globex
php artisan serve                  # http://localhost:8000
```

Keep the frontend (`npm run dev` in `../frontend`) running at the same time for the SPA.

Re-run tenant migrations only:

```bash
php artisan tenants:migrate
```

## Important `.env` values

```env
APP_NAME="Task Board"
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=task_board
DB_USERNAME=root
DB_PASSWORD=
TENANT_DB_PREFIX=task_board
FRONTEND_URL=http://localhost:5173
SANCTUM_STATEFUL_DOMAINS=localhost:5173,127.0.0.1:5173,localhost,127.0.0.1
SESSION_DOMAIN=null
```

## Tests

```bash
php artisan test
```

Includes auth, task CRUD/validation, and database-per-tenant isolation (~43 tests). See the [root README](../README.md) for the full matrix (Vitest + CDP).

## Main API surface

| Method | Path | Notes |
| --- | --- | --- |
| `POST` | `/api/login` | Session login |
| `POST` | `/api/logout` | Logout |
| `GET` | `/api/user` | Current user + organization |
| `GET` | `/api/users` | Same-organization users |
| `GET/POST` | `/api/tasks` | List / create |
| `GET/PUT/DELETE` | `/api/tasks/{id}` | Show / update / delete |

Use `/sanctum/csrf-cookie` before login from the SPA.
