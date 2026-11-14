# Phase Ready learners app

A Vue 3 and TypeScript course app with server-rendered pages, public phase and lesson overviews, authenticated lesson readers, learner progress, and admin tools. Vite builds the Vue browser app and a standalone Node HTTP server.

## Run locally

Use Node.js 22.17 or newer within Node 22, or Node 24, and a PostgreSQL database dedicated to this project.

1. Run `npm install`.
2. Copy `.env.example` to `.env` and set `DB_URL`.
3. Run `npm run db:setup`.
4. Run `npm run dev` and open the URL printed by Vite.

The setup command creates roles, users, sessions, authentication attempt counters, phases, lessons, and lesson progress. It runs in a transaction, preserves existing rows, and can be rerun. Database setup runs explicitly, never as part of a page request. No schema or data migration is required for the Vue conversion.

Sign up at `/signup`, then grant your existing account the admin role:

```powershell
npm run user:admin -- your-email@example.com
```

There are no default accounts or shared passwords. Regular signup always creates a learner.

## Vue project structure

| File or directory | Purpose |
| --- | --- |
| `src/pages/` | Vue page components for each existing URL |
| `src/lib/*.vue` | Shared layout, landing page, dialogs, icons, and editors |
| `src/App.vue` | Flash messages, site shell, and active page |
| `src/app.ts` | Creates a fresh Vue app for each request and for browser hydration |
| `src/entry-client.ts` | Makes the server-rendered page interactive in the browser |
| `src/server/routes.ts` | Explicit URL registry, including dynamic IDs and legacy redirects |
| `src/server/routes/` | Page loaders, form actions, and API handlers |
| `src/server/render.ts` | Matches routes, checks form origins, runs session middleware, and renders Vue |
| `src/server/http.ts` | Request context, cookies, redirects, form errors, and HTTP errors |
| `src/server/production.ts` | Standalone production Node server and static assets |
| `src/lib/server/` | Database models, controllers, sessions, authorization, and validation |
| `src/routes/*.css` | Existing shared site and portal styles |

Vue components use `<script setup lang="ts">`, `defineProps`, `ref`, and `computed`. Templates use `v-if`, `v-for`, `v-model`, `:attribute`, and `@event`. The site shell places page content in a Vue slot. `usePageHead` shares the page title between server rendering and browser hydration.

Navigation uses normal links and native forms. Pages work on direct visits and form validation works without JavaScript. Vue adds the interactive search, category filters, saved-pillar toggles, navigation menu, and native dialogs. Form submissions render their safe values and errors on the server or redirect after success.

Server code is imported only by the server entry. The browser receives only the page data returned after permission checks; private environment variables, password hashes, and raw sessions are never serialized. Lesson HTML is sanitized on the server before it reaches the reader's `v-html` binding.

## Routes and behavior

| Route | Methods | Access and behavior |
| --- | --- | --- |
| `/` | GET | Landing page with pillar search, previews, and course links |
| `/api/me` | GET | Safe login state and current-user fields |
| `/phases` | GET | Public phase overviews |
| `/phases/[id]` | GET | Public phase and lesson overviews |
| `/signup` | GET, POST | Registration with email/password confirmations |
| `/login` | GET, POST | Validates credentials and creates a session |
| `/logout` | GET, POST | GET confirms; POST revokes the session |
| `/dashboard` | GET | Learner progress; admins redirect to `/admin` |
| `/users` | GET | Admin account list |
| `/users/[id]/edit` and `/users/[id]/update` | GET, POST | Own account or admin; authorized role changes only |
| `/users/[id]/delete` | POST | Admin deletion of another account and its sessions |
| `/lessons` | GET | Public lesson overviews grouped by phase |
| `/lessons/upload-video` | GET, POST | Admin lesson creation |
| `/lessons/[id]` | GET, POST | Protected reader; `?/complete` and `?/reopen` actions |
| `/lessons/[id]/edit` and `/lessons/[id]/update` | GET, POST | Admin lesson editing |
| `/lessons/[id]/delete` | POST | Admin lesson deletion |
| `/admin` | GET | Admin dashboard |
| `/admin/phases` | GET, POST | Admin phase management using `?/create` and `?/update` |

The former `/podcasts` URLs redirect to matching `/lessons` URLs with HTTP 307, preserving POST bodies and methods. Destination routes independently enforce permissions.

Learners explicitly mark lessons complete or incomplete. Opening a lesson records its last visit, and the dashboard resumes the most recently opened unfinished lesson, falling back to course order. Progress persists across sessions. Admin previews do not record learner progress. Deleting a lesson or account also removes associated progress.

## Content and validation

Create phases through `/admin/phases`, then add lessons. Full Markdown and video links are available only after login. The editor accepts text or one `.md` file up to 256 KB, plus an optional HTTP(S) direct video URL. A file replaces the text field. `marked` renders Markdown and `sanitize-html` removes unsafe markup. Lesson titles and slugs are unique within a phase, with database constraints protecting concurrent writes.

Validation retains safe form values and field errors, never passwords. Emails are normalized, new passwords require at least 12 characters and at most 72 UTF-8 bytes, and bcrypt hashes passwords at cost 12. Existing shorter passwords can still log in. Account ownership and role changes are checked on the server. Admins cannot delete themselves or change their own role through account editing.

Responses distinguish validation (400), forbidden access (403), missing resources (404), unsupported methods (405), conflicts (409), throttling (429), oversized form bodies (413), and database outages (503). Login failures do not disclose whether an email exists. Login/signup attempts use PostgreSQL counters with limits of 10 per email and 40 per client address per 15 minutes.

## Sessions and private configuration

Session cookies remain HttpOnly and SameSite=Lax, with Secure enabled in production. Only SHA-256 hashes of random tokens are stored in PostgreSQL. Login rotates tokens, logout revokes them, and roles are reread on subsequent requests. Login sessions last 30 days; guest flash sessions last 15 minutes. Ordinary anonymous requests do not create sessions. Flash messages are escaped, bounded, and consumed once. Session and form responses use `Cache-Control: private, no-store`.

Every state-changing form request must supply the same origin as the server's public URL. The server rejects cross-origin submissions before running controllers. Set `ORIGIN` correctly behind a hosting proxy. The server does not trust arbitrary forwarded client-address headers for throttling.

Private configuration is read from `.env` on the server. Shell variables take precedence. `DB_URL` is required only when a request actually uses the database. Set `ENABLE_SQL_LOGGING=true` for development query timings and row counts; SQL, parameters, passwords, and connection strings are not logged.

For external Render PostgreSQL hosts, the client enables verified TLS when the URL does not specify an SSL mode. Use the provider's recommended connection settings for other hosts. Local commands should use Render's External Database URL; internal URLs are for services in the same region.

## Production

```sh
npm ci
npm run build
npm start
```

The build creates `build/client/` for browser assets and `build/server/production.js` for the Node server. `npm start` reads the private `.env` file if present. `npm run preview` starts this same production server after a build. The default port is 3000, overridable with `PORT`; `HOST` defaults to `0.0.0.0`.

The build script explicitly selects production mode, even when a local `.env` sets `NODE_ENV=development`. After building, run `npm run test:production` to smoke-test the standalone server without connecting to a database.

On Render, use build command `npm ci && npm run build` and start command `npm start`. Set `DB_URL` and `ORIGIN` to the service's public URL. Run database setup against the target database before using the app. `.node-version` selects Node 22; if the service has a `NODE_VERSION` override, use a supported version.

## Verification

```sh
npm run check
npm run build
npm test
```

`vue-tsc` checks Vue templates and TypeScript. The existing middleware and validation suites cover sessions, permissions, flash messages, and form rules. HTTP integration tests run the Vue server with an isolated in-memory PostgreSQL engine (PGlite), executing the actual schema and SQL without changing production data. They cover public/private data boundaries, account flows, lesson uploads and sanitization, progress, duplicate submissions, failures, cross-origin protection, and legacy redirects.
