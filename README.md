# Phase Ready learners app

A SvelteKit 3 course app with public phase/lesson overviews, authenticated lessons,
and admin tools for phases, lessons, and user accounts.

## Run locally

Use Node.js 22.17 or newer within Node 22, or Node 24, and a PostgreSQL database dedicated to this project.

1. Run `npm install`.
2. Copy `.env.example` to `.env` and set `DB_URL`.
3. Run `npm run db:setup`.
4. Run `npm run dev`.

Setup creates `roles`, `users`, `sessions`, `auth_attempts`, `phases`, `lessons`,
and `lesson_progress`.
It runs in a transaction, preserves existing rows, and can be rerun. It also adds
`video_url` to older lesson tables. Existing emails must be unique regardless of
capitalization. Tables start without accounts or course material.

For Render, copy the **External Database URL** when running on your computer.
The PostgreSQL client enables verified TLS for external Render hosts when the
URL does not specify an SSL mode. Use the provider's recommended connection
settings for other hosts. See [Render's connection instructions](https://render.com/docs/postgresql-creating-connecting).
The internal Render URL is for services in the same account and region.

Environment variables are private and declared in `src/env.ts`. Never commit
`.env`. The setup/admin commands read the root `.env`; shell variables take
precedence. Database setup runs explicitly rather than on requests.

## Deploy on Render

Create a Node Web Service using build command `npm ci && npm run build` and start
command `npm start` (equivalent to `node build/index.js`). The Node adapter builds
the production server into `build/`. Set `DB_URL` and set `ORIGIN` to the site's
public URL, such as `https://your-service.onrender.com`, for form submissions.
Run `npm run db:setup` against the target database before using the app.

`.node-version` selects the latest Node 22 release on Render. SvelteKit requires
at least Node 22.17. If the service already defines a `NODE_VERSION` environment
variable, change it to `22` or remove it: Render gives that variable precedence
over the repository file. See [Render's Node version settings](https://render.com/docs/node-version).

## Create your admin account

Sign up at `/signup`, then run this command locally with your own account's email:

```powershell
npm run user:admin -- your-email@example.com
```

Refresh the dashboard to see admin tools. This command grants the existing
account the admin role. There are no default accounts or shared test passwords.
Regular signup always creates a learner; role IDs are looked up by name.

## Routes

SvelteKit uses files in `src/routes` instead of an Express router. The adapted
handlers live in `src/lib/server/controllers`.

| Route | Methods | Access and behavior |
| --- | --- | --- |
| `/` | GET | Landing page with working course/login links |
| `/api/me` | GET | Safe login status and current-user fields; no password or token |
| `/phases` | GET | Public phase overviews |
| `/phases/[id]` | GET | Public phase and lesson overviews |
| `/signup` | GET, POST | Registration with email/password confirmation |
| `/login` | GET, POST | Validates credentials and creates a session |
| `/logout` | GET, POST | GET shows confirmation; POST revokes the session and returns home |
| `/dashboard` | GET | Learner progress dashboard; admins redirect to `/admin` |
| `/users` | GET | Admin account list |
| `/users/[id]/edit` | GET, POST | Own account or admin; edits name/email and authorized role changes |
| `/users/[id]/update` | GET, POST | Same editor and update action, preserving the original POST URL |
| `/users/[id]/delete` | POST | Admin deletion of another account; revokes its sessions |
| `/lessons` | GET | Public lesson overviews, ordered within phases |
| `/lessons/upload-video` | GET, POST | Admin lesson creation, Markdown text/file and optional video URL |
| `/lessons/[id]` | GET, POST | Authenticated reader; learner `?/complete` and `?/reopen` actions |
| `/lessons/[id]/edit` | GET, POST | Admin lesson editor |
| `/lessons/[id]/update` | GET, POST | Same editor/update action at the original-style POST URL |
| `/lessons/[id]/delete` | POST | Admin lesson deletion |
| `/admin` | GET | Admin dashboard for course and account management |
| `/admin/phases` | GET, POST | Admin phase creation and editing |

All former `/podcasts` routes redirect to matching `/lessons` routes:
`/podcasts`, `/podcasts/upload-video`, and
`/podcasts/[id]/edit|update|delete`. Redirects use HTTP 307 to preserve POST
bodies and methods. The destination still checks permissions.

The original account routes now check ownership: logging in alone does not let
a learner edit another user's account. Admin pages/actions check roles on the
server, and logout/deletion use POST rather than changing data on GET requests.
Admins cannot delete their own account, including through a direct POST.

The supplied Express form controllers are consolidated in
`src/lib/server/controllers/accounts.ts`. Their behavior maps as follows:

| Original controller | SvelteKit equivalent |
| --- | --- |
| `showLoginForm`, `showRegistrationForm` | `/login` and `/signup` page components with `guestOnly` loads |
| `processLogin`, `processRegistration`, `processLogout` | `login`, `signup`, `logout` actions |
| `showDashboard` | `dashboard` load in `controllers/phases.ts` and its page |
| `showAllUsers` | `listUsers` load and `/users` page |
| `showEditAccountForm`, `processEditAccount` | `loadAccount` and `editAccount` |
| `processDeleteAccount` | `removeAccount` POST handler |

Validation errors render beside their forms with safe values retained. Duplicate
email checks use the database constraint, covering concurrent submissions. Login
awaits session creation directly, with no arbitrary delay. Logs and browser page
data exclude password hashes and raw session records. Account updates consistently
use `role_name`. Admins can change another user's role; everyone sees their own
role as read-only, and the server rejects attempts to change it.

The registration EJS views map to `/signup`, `/users/[id]/edit`, and `/users`.
Signup retains email/password confirmation and the current 12-character password
minimum. Account editing includes cancel/dashboard links and an update confirmation;
the admin user list confirms deletions and prevents deleting one's own account.
These pages retain the existing portal styling and server-side permission checks.

The original login/dashboard EJS views are represented by Svelte page components
using the project's existing portal/card/form styling. Login posts to `/login`,
retains the email on errors, supports password managers, and links to `/signup`.
Its credential checks do not apply signup complexity rules or an email minimum
length, so existing accounts with valid shorter passwords can still log in.
The dashboard shows name, email, and account creation date, plus account editing
and a POST logout form. Dates are formatted server-side in America/Chicago time
for stable rendering. Admin controls are shown only to admins, and their target
routes enforce authorization independently. The old `/register` link now points
to the project's `/signup` route. Express header/footer includes are supplied by
the SvelteKit root layout.

Learners land at `/dashboard` after login; admins land at `/admin`. The learner
dashboard shows overall and per-phase progress, completed lessons, and a Continue
learning card. Opening a lesson records the learner's last visit. Continue learning
resumes the most recently opened unfinished lesson, falling back to the first
unfinished lesson in phase/lesson display order. An empty course and a fully
completed course have their own messages. Adding new lessons updates the total.

Learners explicitly select **Mark lesson complete** on a lesson page, and can
undo it with **Mark as incomplete**. Watching or opening a lesson does not complete
it automatically. Progress persists across sessions in `lesson_progress`, keyed
by user and lesson; the server takes the user ID from the session. Repeating a
completion preserves its original timestamp. Deleting a user or lesson also
deletes its associated progress. Admins preview lessons without recording learner
progress. Rerun `npm run db:setup` against an existing database before using this
feature to create the new table without removing existing data.

## Course content

The original podcast list, upload, and edit views are adapted as course lesson
pages with the existing portal cards and forms. `/lessons` groups public overviews
by phase and offers logged-in learners a Start lesson link. Full Markdown content
and optional video playback appear only on the protected lesson page. Admins see
add/edit/delete controls, with confirmations for updates and deletions and links
back to the lesson list. Server guards enforce the same permissions.

Create phases through `/admin/phases`, then add lessons. Phase and lesson order
start at zero; ID breaks ties. Phase overviews and lesson descriptions are public.
Full Markdown and video links are loaded only after a server-side login check.

The lesson form accepts text or one `.md` file up to 256 KB. A selected file
replaces the text field. Enter title, overview, phase, and order in the form;
front matter is not parsed. File contents are stored as text in `lessons.content`.
The reader renders Markdown with [marked](https://github.com/markedjs/marked)
and sanitizes the HTML with [sanitize-html](https://github.com/apostrophecms/sanitize-html).

`video_url` stores an optional HTTP(S) link. This is a direct, browser-playable
video URL, not a video file upload or a YouTube embed. Blank values remove the
video link. Actual video hosting and private storage/signed playback links are
separate from this app.

Lesson slugs are regenerated on edits and are unique within their phase. Model
queries use SQL parameters, and updates set `updated_at` explicitly. Database
failures are reported rather than disguised as an empty course or a missing row.

The original podcast controller is adapted in `controllers/lessons.ts`:

| Original controller | Lesson equivalent |
| --- | --- |
| `showPodcastForm` | `loadLessonForm` and the lesson editor page |
| `processPodcast` | `writeLesson` on `/lessons/upload-video` |
| `showAllPodcasts` | `listLessons` and the public lesson overview page |
| `showEditPodcastForm` | `loadLessonForm` on `/lessons/[id]/edit` |
| `processEditPodcast` | `writeLesson` on `/lessons/[id]/update` |
| `processDeletePodcast` | `removeLesson` POST handler |

Creating a lesson returns to the creation form; editing returns to that lesson's
editor, which links to the reader. Success messages are shown once. Duplicate
titles are checked case-insensitively within the selected phase, excluding the
current lesson during edits. The same title may appear in different phases.
The database constraint also catches slug collisions and concurrent submissions;
both receive a title error with form values retained. Permission checks happen
before loading private records or writing. Express template/style helpers,
relative redirects, and raw debug logs are replaced by Svelte components, absolute
route paths, and structured form errors.

## Validation and error handling

The adapted validators are in `src/lib/server/middleware/validation`:

- `forms.ts`: registration, login, and account updates.
- `lessons.ts`: lesson validation replacing podcast validation.
- `shared.ts`: safe FormData/object parsing and field errors.

They accept FormData or an object and return either
`{ success: true, data, errors: {} }` or
`{ success: false, data: null, errors }`. Actions use
[SvelteKit's form-action validation](https://svelte.dev/docs/kit/form-actions#Validation-errors)
to return field errors without reflecting passwords.

Rules are shared with the database models through `forms/user-validation.js`
and `lessons/lesson-validation.js`. Names are 1–225 characters; lesson titles
are 1–225 characters with a usable slug. Overview and lesson content are required.
Emails are trimmed/lowercased. Passwords retain their exact whitespace; new
passwords need at least 12 characters and at most 72 UTF-8 bytes. Login supports
older, shorter passwords. Passwords are hashed with bcrypt at cost 12.

Known repeated fields, uploaded files in text fields, malformed integers,
confirmation mismatches, and unsupported video URL protocols are rejected.
Unknown fields are not forwarded to models. Signup ignores caller-supplied roles.
Account role changes require admin authorization before validation allows them.

Responses distinguish validation (400), forbidden access (403), missing resources
(404), duplicate email/slug (409), throttled attempts (429), and database outages
(503). Login failures use the same message for an unknown email or wrong password.
Signup/login attempts are limited per action to 10 per normalized email and 40
per client address within a 15-minute window, using PostgreSQL counters.

## Sessions and middleware

`src/hooks.server.ts` adapts Express middleware using
[SvelteKit server hooks](https://svelte.dev/docs/kit/hooks). It restores sessions,
prepares request locals, and protects canonical `/admin` route IDs. Controllers
also check authorization before reading protected data or making changes.

Session cookies are HttpOnly and SameSite=Lax, with Secure enabled outside
development. Only SHA-256 hashes of random session tokens are stored in the
database. Login rotates the token; logout revokes it. Authenticated sessions last
30 days, and guest flash sessions last 15 minutes. Roles are re-read from the
database, so changes take effect on subsequent requests.
If database revocation fails during logout, browser state is still cleared and
HTTP 503 is returned; the app does not report that server revocation succeeded.

`startSession`/`endSession` in `src/lib/server/sessions.ts` handle login/logout.
`requireLogin(event)` and `requireRole('admin')(event)` are reusable guards.
Remote functions must guard their own operations, since a caller's URL does not
authorize access to data.

Flash helpers preserve the original behavior, with asynchronous calls:

```ts
await event.locals.flash('success', 'Lesson saved.');
const errors = await event.locals.flash('error'); // Read and clear one type.
const messages = await event.locals.flash(); // Read and clear all types.
```

Flash messages stay server-side until consumed and render as escaped text.
Each is limited to 500 characters and 10 messages per type. Ordinary anonymous
requests do not create sessions. Data preloading is disabled so hovering links
cannot consume flash messages before navigation.

The root server layout shares year, environment, query parameters, pathname,
login state, safe current-user fields, and flash messages. It never sends session
IDs or password hashes. Session responses use `Cache-Control: private, no-store`.
CSS imports and `<svelte:head>` replace the Express HTML asset helpers.

Set `ENABLE_SQL_LOGGING=true` for development query timings/row counts. SQL,
parameters, connection strings, and passwords are not logged.

## Verification

```sh
npm run check
npm run build
npm test
```

Individual suites: `test:middleware`, `test:validation`, and `test:routes`.
Middleware unit tests use a database double. Route integration tests start a real
SvelteKit HTTP server backed by an isolated in-memory PostgreSQL engine
([PGlite](https://github.com/electric-sql/pglite)). They execute actual schema,
account/session, phase/lesson, and throttling SQL without connecting to Render or
changing production data. They cover successful flows, access checks, error
responses, Markdown uploads/sanitization, deletion, logout, and legacy redirects.

Build output uses adapter-auto. Select a deployment adapter appropriate to your
hosting provider before publishing the app.
