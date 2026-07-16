# aashishpandey-be

Backend API for [aashishpandey.com](https://aashishpandey.com), deployed on Render.

## Stack

- Node.js + Express + TypeScript
- MongoDB (Mongoose)
- [Resend](https://resend.com) for contact form emails

## Endpoints

- `GET /api/health` — health check
- `POST /api/contact` — send a contact form message (rate-limited)
- `GET /api/blog` — list published blog posts
- `GET /api/blog/:slug` — get a published blog post
- `GET /api/projects` — list projects
- `GET /api/projects/:slug` — get a project

Write endpoints (creating/editing blog posts and projects) aren't built yet — add
an authenticated admin route or a small CLI/seed script once content management
is actually needed.

## Local development

```bash
cp .env.example .env
npm install
npm run dev
```

The server runs on `http://localhost:4000` by default. `MONGODB_URI` and
`RESEND_API_KEY` are optional locally — without them, DB-backed routes return
empty results and contact submissions are just logged to the console instead
of emailed.

## Deploying to Render

- Build command: `npm run build`
- Start command: `npm start`
- Set `MONGODB_URI`, `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`,
  and `CLIENT_ORIGIN` (the deployed frontend URL) as environment variables.
