# State of the Silos

A personal executive dashboard for one owner running several business/personal
areas. One screen shows where every area stands and what needs action today.

See the build brief for the full spec. In short:

- **Two writers, split by field.** An external assistant maintains bulk
  context (numbers, status, constraints, the existence of reports/follow-ups)
  via `POST /api/import`. The owner acts on what's already there (tick done,
  delegate, reprioritize, add notes) via the app UI. Import upserts by stable
  `id` and never touches owner-owned fields on an update — see
  `lib/importUpsert.ts` for the exact rule per field.
- **Today view** (`/today`) is the primary screen: every open follow-up
  across all areas, sorted by priority then oldest `lastTouched`, with a
  pinned block of overdue reports up top.
- **Home** (`/`) shows the BHAG strip and one card per area.
- **Area detail** (`/area/[id]`) shows the full record for one area plus its
  reports and follow-ups (including an archived/done view).

## Stack

Next.js (App Router) + TypeScript + Tailwind, Prisma + Postgres, deployed to
Vercel's free Hobby plan. Auth is a single-password gate implemented in
`middleware.ts` (an HMAC-signed session cookie checked against `APP_PASSWORD`)
— not Vercel's paid Password Protection, and not Vercel Authentication.

## Local development

Requires a Postgres database (local, Supabase, or Vercel Postgres).

```bash
cp .env.example .env   # fill in DATABASE_URL, APP_PASSWORD, IMPORT_SECRET, SESSION_SECRET
npm install
npm run db:migrate     # applies prisma/migrations
npm run db:seed        # loads the section-9 seed payload through the import upsert
npm run dev
```

Visit `http://localhost:3000`, enter `APP_PASSWORD` to get in.

## Deploying to Vercel (Hobby plan)

1. Push this repo to GitHub and import it into a new Vercel project.
2. Provision a Postgres database — Vercel Postgres (Storage tab) or Supabase
   both work — and copy its connection string.
3. In the Vercel project's Environment Variables, set:
   - `DATABASE_URL` — the Postgres connection string
   - `APP_PASSWORD` — the password you'll type on your phone to get in
   - `IMPORT_SECRET` — the bearer token the assistant sends to `/api/import`
   - `SESSION_SECRET` — any long random string (used to sign the session cookie)
4. Deploy. The `build` script runs `prisma generate && next build`; run
   `npx prisma migrate deploy` once (via `vercel env pull` + local run, or a
   one-off `vercel exec`) to apply migrations against the production database.
5. Seed it: `npm run db:seed` locally with `DATABASE_URL` pointed at
   production (or send the section-9 payload to `POST /api/import` with the
   `IMPORT_SECRET` bearer token).

## Import contract

```
POST /api/import
Authorization: Bearer <IMPORT_SECRET>
Content-Type: application/json

{ "meta": {...}, "bhag": {...}, "areas": [ { "id": "...", "reports": [...], "followUps": [...] } ] }
```

Partial payloads are fine — only the areas/items present are upserted. New
items are created with whatever fields are given (including initial owner
fields like `status`/`priority`/`lastTouched`). Existing items only have
their assistant-owned fields refreshed (`state`/`metric`/`constraint`/`lever`
on an area; `owes`/`cadence` on a report; `item`/`nextAction` and — unless the
owner has since delegated it — `waitingOn` on a follow-up); `status`,
`priority`, `notes`, and `lastTouched` are never touched by an update. The
response reports created/updated/untouched counts per entity type.

## Write actions

- **Followed up** — resets a follow-up's `lastTouched` to today (the age
  counter resets to `0d`).
- **Done** — marks a follow-up done; it drops out of Today and the area's
  active list into that area's "Archived / done" section.
- **Delegate** — sets a follow-up to `delegated` and reassigns `waitingOn`;
  from then on, import no longer overwrites `waitingOn` for that item until
  it's un-delegated.
- **Reprioritize** — sets or clears a follow-up's priority rank.
- **Add note** — appends a timestamped note, shown newest-first.
- **Received / Flag** — on a report row, marks it received (also used to
  derive "overdue" from cadence + elapsed time) or manually flags due/overdue.
