# Task Board — Frontend

React + TypeScript + Vite SPA for the Task Board take-home exercise.

For full project setup, assumptions, demo accounts, and testing, see the [root README](../README.md).

## Stack

- React 19 + TypeScript
- Vite (dev proxy to Laravel for `/api` and `/sanctum`)
- Pure SCSS (no UI kit)
- Light/dark mode + accent color themes
- Native HTML5 drag-and-drop Kanban board

## Run

Start the Laravel API first (`php artisan serve` in `../backend`), then:

```bash
npm install
npm run dev
```

App: [http://localhost:5173](http://localhost:5173)

Keep `VITE_API_URL` empty/unset so requests stay same-origin through the Vite proxy (required for Sanctum cookies). Demo logins are listed in the [root README](../README.md) — they are not prefilled on the login form.

## Test

```bash
npm test
```

## Build

```bash
npm run build
npm run preview
```

## Notes

- Laravel API should be running on `http://localhost:8000`
- Theme preferences are stored in `localStorage` (`ttb-theme`, `ttb-accent`)
- Default accent: Ocean `#0e7490`
