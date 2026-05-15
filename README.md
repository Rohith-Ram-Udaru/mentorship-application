# MENTORFLOW X

MENTORFLOW X is a privacy-first mentorship operating system for mentor/mentee pairings, observers, 1:1 sessions, immutable feedback, KRAs, KPIs, KPI history, health scoring, activity timelines, and organization-level analytics.

## Setup

1. Install dependencies:
   ```bash
   npm run install:all
   ```
2. Create `server/.env`:
   ```env
   PORT=5000
   SQLITE_PATH=./data/mentorflow.sqlite
   JWT_SECRET=replace_with_a_long_random_secret
   CLIENT_ORIGIN=http://localhost:5173
   ```
3. Optional demo data:
   ```bash
   npm run seed
   ```
4. Run locally:
   ```bash
   npm run dev
   ```

Frontend: `http://localhost:5173`  
Backend API: `http://localhost:5000/api`

## Demo Users

After seeding, all demo accounts use password `Password123!`.

- `mentor@mentorflow.test`
- `mentee@mentorflow.test`
- `observer@mentorflow.test`
- `coach@mentorflow.test`

## Tech Stack And Rationale

- React + Vite for a fast SPA development loop.
- Tailwind CSS, ShadCN-style primitives, Framer Motion, Lucide icons, and Recharts for a polished enterprise UI.
- Node.js + Express for a clear API surface.
- SQLite via Node's built-in `node:sqlite` module for durable local storage with no cloud database dependency.
- JWT + bcrypt for stateless authenticated requests and non-reversible password storage.
- Zod for request validation with explicit, actionable errors.

## Architecture

The repository is split into `client` and `server`.

- `server/src/config/db.js`: SQLite connection and schema migrations.
- `server/src/middleware`: authentication, role, pairing membership, visibility, and error handling.
- `server/src/controllers`: request handlers grouped by domain.
- `server/src/services`: SQLite repositories, authorization, analytics, health score, timeline, and seed logic.
- `server/src/routes`: API route composition.
- `server/src/validators`: Zod schemas.
- `client/src/pages`: routed application views.
- `client/src/components`: ShadCN-style UI primitives and domain components.
- `client/src/services`: Axios API client and domain calls.
- `client/src/context`: auth and theme state.

Authorization is enforced at the API layer for list, detail, search, filters, pagination, and direct URLs. Observers are read-only and never receive pair-only sessions or feedback.

## AI Usage

This codebase was AI-assisted. The assistant generated the first full-stack implementation from the problem statement, master context, and architecture requirements, then reviewed and adjusted the authorization, validation, privacy, and build behavior. Human review is still recommended before production use, especially around security hardening and deployment configuration.

## Assumptions

- Pairings can be created by any authenticated coordinator-like user, but only mentor/mentee participants can later mutate pairing-owned content.
- Observers can view KRAs/KPIs and observer-visible sessions/feedback, but cannot mutate anything.
- Feedback body edits and visibility edits are intentionally unsupported to preserve sender trust.
- Ended pairings are read-only.

## Trade-Offs

- No invitation flow, calendar integration, realtime sockets, notifications, attachments, or mentor discovery, matching the stated non-required scope.
- The ShadCN layer is implemented as local, reusable Tailwind primitives rather than invoking the generator for every component.
- Organization analytics are scoped to the authenticated user's accessible pairings, avoiding an unrequested admin role.

## Future Scope

- Organization tenancy and admin governance.
- SSO/SAML and audit-log exports.
- Calendar sync and reminders.
- Comment threads on action items.
- Advanced risk modeling for drift alerts.
- Accessibility audit and automated end-to-end tests.

## Docker

Set `JWT_SECRET` in your shell or `.env`, then run:

```bash
docker compose up --build
```
