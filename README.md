# CPE 334 Sprint 1 Group Work

Sprint 1 establishes the product baseline and releases one tested workflow through the UI, backend, and database. The assigned theme is Workflow and Approval System. See the [proposed Sprint 1 scope](docs/sprints/sprint-1/proposed-scope.md) and check it against the course group specification before finalizing the feature contracts.

## Engineering documents

- A: docs/srs.md
- B: docs/features.md and docs/traceability.md
- C: docs/system-sds.md
- D: docs/sprints/plan.md
- E: docs/sprints/sprint-1/ for feature contracts and test specifications
- F: Record release verification, demonstrations and review evidence for the submission PDF.

## Git workflow

1. Link the issue to its feature and contract. Commit the Sprint 1 contract and test design before implementing the feature.
2. Branch from sprint-1-staging. Open a pull request back into that branch and have the other teammate review it.
3. Verify the integrated increment and open a reviewed release pull request from sprint-1-staging into main. Record the released commit and its local build and test results.

## Local database setup

Install Node.js and PostgreSQL. Create an empty PostgreSQL database named
`approvals` and give your local database user permission to create tables in
it. Copy `.env.example` to `.env` and set `DATABASE_URL` and a synthetic
`SEED_PASSWORD`. URL-encode special characters in the database password.

Run these commands from the repository root.

```sh
npm ci
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```

The seed creates two Requesters (`requester1`, `requester2`) and two Reviewers
(`reviewer1`, `reviewer2`) using the configured synthetic password. It also adds a synthetic request in each Sprint 1 state with corresponding history. Re-running it leaves those requests and their decisions intact. Use a
disposable local database for demo data. Keep your `.env` out of Git.

## Run the authentication API

After database setup, run the following from the repository root.

```sh
npm run build
npm start
```

The API defaults to port 3000. Send JSON to POST /api/auth/login with username
and password. Send the issued cookie to GET /api/auth/me or to
POST /api/auth/logout with an empty JSON object. To run the integration test,
set TEST_DATABASE_URL to a separate PostgreSQL database with the migration
applied, then run npm test.

## Run the web interface

With the API listening on port 3000, run npm run dev:web in a second terminal
and open the URL printed by Vite. Sign in using one of the seeded accounts.

For the browser test, migrate and seed the separate test database with the
same SEED_PASSWORD you pass to the test runner. Keep ports 3000 and 4173 free.
Run npx playwright install chromium, npm run build, and npm run test:e2e.
The test runner starts both servers and removes its own sample request.


## Sprint 2 return and resubmission

After applying committed migrations and regenerating the Prisma client, an assigned Reviewer can return an In Review request with a required reason. Its owner can edit the returned title/category/amount/justification, Save changes, then Resubmit to the SAME reviewer (In Review, not the unassigned Queue). Earlier return reasons and edit/resubmit history remain visible. Other owners and roles cannot edit it; final Approved/Rejected records remain locked.

New API paths: POST /api/requests/:id/return, PATCH /api/requests/:id, POST /api/requests/:id/resubmit. Partial edits accept only title/category/amount/justification; resubmit accepts {}. Validation and role/session/ownership rules remain server-side. No new secret or environment variable is needed.

Development: apply `npx prisma migrate deploy` to your isolated local DB, `npx prisma generate`, then `npm test` and the documented seeded Playwright checks. Cloud releases run the existing migration job before deployment; do not reset/reseed a shared production database. RETURNED enum addition is not safely undone by dropping the value. Once Returned data exists, roll back only to a compatible image or roll forward with a reviewed fix, not a pre-F-07 client unable to understand Returned records.

Feature/test design: docs/sprints/sprint-2/contracts.md. Actual RED/GREEN and migration evidence: docs/deliverable-2/evidence/F07. A feature branch is not a claim the assessed main release has deployed it.
## Sprint 2 filter and search (F-08)

`GET /api/requests` accepts `state`, `category`, `from`, `to`, `q` and Reviewer-only `mine=true|false`. Supplied conditions combine with AND within existing authorization. `q` searches title or justification as a trimmed case-insensitive literal substring, maximum 200 Unicode code points; `%`, `_` and backslash are literal characters. Empty text removes text filtering.

Dates are calendar `YYYY-MM-DD`, include complete UTC days and filter creation time. Either bound is optional. Invalid dates/ranges/enum values, repeated or nested parameters and unsupported ownership selectors return 400 with field errors. Requester ownership and reviewer Mine remain mandatory server predicates. No new schema, migration or environment variable is required for F-08.

List controls provide Apply/Clear and preserve values after errors. Clear retains the active All/Queue/Mine scope; Queue fixes state to Pending. Released in tag `sprint-2-2026-11-25`; reviewed live evidence is recorded in #84. Actual test evidence and edge-date handling: [F-08 results](docs/deliverable-2/evidence/F08/README.md).

## Sprint 3 decision summary candidate (F-10)

Reviewers can open Decision summary at `/summary`. `GET /api/reports/summary` returns global current request counts by state/category and current terminal decisions by the final history Reviewer, plus explicit unattributed decisions for legacy/malformed history. Zero buckets are included and all counts share one PostgreSQL statement snapshot. Requesters receive 403, anonymous/expired sessions 401; report query filters are unsupported. No schema/setup/environment change is required. This feature is locally implemented/tested and awaits review/integration/deployment; see [actual F-10 evidence](docs/deliverable-2/evidence/F10/README.md).
