# aashishpandey-be

Backend API for [aashishpandey.com](https://aashishpandey.com), deployed on Render.
Powers the public site (contact form, blog) and a password-free, DB-backed
admin CMS for writing and publishing blog posts.

## Stack

- Node.js + Express + TypeScript, Zod for request validation
- MongoDB (Mongoose), `bufferCommands: false` so queries fail fast instead of
  hanging when Mongo isn't reachable
- JWT bearer sessions backed by a revocable `Session` collection (no cookies)
- [Resend](https://resend.com) for contact-form and password-reset emails
- [Cloudinary](https://cloudinary.com) for the admin media library
- Google OAuth (`google-auth-library`) as an alternative admin sign-in

## Public endpoints

- `GET /api/health` — health check
- `POST /api/contact` — send a contact form message (rate-limited)
- `GET /api/blog`, `GET /api/blog/:slug` — published posts only
- `GET /api/categories` — category list, for blog filter pills
- `GET /api/projects`, `GET /api/projects/:slug` — legacy/unused; the frontend's
  case studies are static now, kept only in case they're repurposed later

## Admin endpoints (`/api/admin/*`)

Auth is a real `User` collection, not a shared password. First-run: whoever
completes the "set up your account" form at `/admin/login` becomes the
founding admin; everyone after that needs an existing admin's approval (via
Google sign-in only — there's no local self-serve signup).

- Public: `auth/bootstrap-status`, `auth/bootstrap`, `auth/login`,
  `auth/forgot-password`, `auth/reset-password`, `auth/google`,
  `auth/google/callback`
- Authenticated (bearer token, requires an active `Session`): `auth/me`,
  `auth/logout`, `auth/logout-all`
- User management: `users` (list/approve/reject/delete)
- Blog CMS: `blog` (CRUD), `blog/:id/autosave`, `blog/:id/revisions` +
  restore, `categories` (CRUD), `media` (list/upload to Cloudinary/delete)
- `submissions` — read-only contact form entries

## Local development

```bash
cp .env.example .env
npm install
npm run dev
```

The server runs on `http://localhost:4000` by default. See `.env.example` for
the full list of variables and what each one does. Without `MONGODB_URI` set,
the server runs in a fail-fast no-DB mode (fine for frontend/UI work, not for
exercising the CMS or auth end-to-end — use a real Mongo instance or the
staging deploy for that). Without `RESEND_API_KEY`, contact and
password-reset emails are logged to the console instead of sent. Without
`CLOUDINARY_*`, media upload fails but everything else in the CMS works.

## Deploying to Render

- Build command: `npm install && npm run build` (the Render-inferred default
  of just `npm install` will NOT compile TypeScript — `node dist/index.js`
  fails if you leave it unset)
- Start command: `node dist/index.js`
- `app.set("trust proxy", 1)` is required and already set in `src/app.ts` —
  Render sits behind a reverse proxy, and `express-rate-limit` throws on every
  rate-limited request without it
- Set all variables from `.env.example` as environment variables. `BOOTSTRAP_SECRET`
  in particular should be set *before* a public deploy goes live — otherwise
  the founding-admin account is up for grabs to whoever visits `/admin/login`
  first
