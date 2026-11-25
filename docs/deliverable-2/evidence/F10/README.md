# F-10 actual decision-summary evidence

Issue #73, reviewed Sprint 3 baseline contracts in PR #77. Implementation starts from staging `cf0070d`, after deployed/tagged Sprint 2 and merged release evidence #84. The F-10 edge clarifications were recorded in `docs/sprints/sprint-3/contracts.md` at the same pre-implementation test commit and remain proposed for feature review. No production deployment or independent UAT is claimed.

## Actual commands and results

| Phase | Tested source | Actual result |
|---|---|---|
| Baseline build / semantic API RED | c2367f2 | `npm run build` succeeds; `node --test test/summary.test.cjs` counts 5 tests, 0 pass / 5 fail including parent. Missing summary route returns 404 instead of the specified 200/401; fixture/migration setup succeeds. |
| Semantic UI RED | c2367f2 | `playwright test test/browser/summary.spec.ts --reporter=line --timeout=15000`: 1 failed waiting for the missing Decision summary navigation after a real request submission and Reviewer login. |
| First build/API/regression GREEN | a089d15 | `npm test`: build succeeds; 27 tests pass, 0 fail/cancel/skip/todo. Retained as first-green-regression log/JSON, including concurrent Supertest transient-listener warnings. |
| Browser/regression GREEN | a089d15 | `playwright test --reporter=line`: all 5 tests pass using 5 workers, including original journey, history, return/edit/resubmit, filters and new decision summary. |
| Clean harness build/API/regression GREEN | 7b26ca2 | `npm test`: build succeeds; 27 pass, 0 fail/cancel/skip/todo. Concurrent test now opens one actual HTTP listener and closes it explicitly, removing lazy listen/close warnings rather than suppressing them. Production code is unchanged from a089d15. |

Each adjacent JSON records full tested source SHA, UTC time, command and actual exit status. Local browser commands used the `node node_modules/@playwright/test/cli.js` launcher. Logs retain actual Vite directive and color warnings; passing output is not synthesized. Environment observed: Node v24.14.0, PostgreSQL 18.6, Prisma client 6.19.3, Windows host.

## Meaningful API/database verification

`test/summary.test.cjs` creates a unique `summary_<uuid>` schema on the dedicated local test database and applies the real three migrations there. This permits an actual empty-request database test without truncating/reseeding the shared local test schema or production. Only the generated test schema is dropped afterward. No new application migration, index, role, secret or environment variable is required.

- **AC-10-01 / TEST-10-01:** Empty persisted requests return total 0, every current state/category bucket with 0, no reviewer rows and 0 unattributed decisions. Populated fixture assertions in TEST-10-02 check seven requests exactly: Pending1, InReview1, Returned1, Approved2, Rejected2; Funding1, Purchase4, Travel1, Reimbursement1.
- **AC-10-02 / TEST-10-02:** The final actor is derived from the latest matching state-changing terminal history event, ordered createdAt/id descending. Tied times choose the greater ID; duplicate decision history counts one request, mismatched terminal events and same-state audit rows do not replace the final actor. Fixtures deliberately make final actor differ from assigned reviewer: final Reviewer receives one Approved, first Reviewer one Rejected. One missing-history terminal request and one malformed Requester-actor record produce unattributed2, with no invented Reviewer identity. A fresh app and repeated reads return identical results and leave complete request/history snapshots unchanged.
- **AC-10-03 / TEST-10-03:** Anonymous and expired sessions 401; Requester 403 even with forged role/query/body; Reviewer unsupported query filters 400; a forged GET body does not change Reviewer identity or global scope. POST/PATCH/DELETE summary endpoints are absent. Exact output keys/public reviewer projection are asserted; no titles, justifications, amounts, password hashes or sessions are returned.
- **AC-10-02 / TEST-10-04:** A real create/claim/return/edit/resubmit/approve API cycle contributes exactly one final Approved to its deciding Reviewer. Then ten requests are actually claimed/approved concurrently while 20 real summary reads run. Every observed snapshot reconciles state and category totals to total, and attributed+unattributed terminal totals to current Approved+Rejected. Final total18, first Reviewer approved11, unattributed2. All operations use real PostgreSQL transactions/HTTP, not a mocked database.

The fixture with a final actor different from the first assignee exercises the reporting rule needed by future F-09. It does not implement or claim execution of an actual second-approval workflow.

## UI verification

`test/browser/summary.spec.ts` performs an actual UI request submission and a claim/approval by a unique synthetic Reviewer. That Reviewer's summary row is absent before the decision and shows Approved1/Rejected0/Total1 afterward and after reload. Global count cells are compared against the exact real server response forwarded unchanged to that UI load, avoiding incorrect fixed expectations while other browser tests run in parallel.

Requester navigation is absent and the direct UI summary route is unavailable. Loading (held response), empty/zero presentation (explicit valid empty-response fixture), controlled read error and Retry are also exercised. The empty UI fixture and injected failure are presentation tests; actual empty-database behavior is independently verified by the real-schema API test above. No zero/failure response fixture is labelled as a production observation.

`summary.png` is the actual local browser screenshot after the real approval, visually inspected. Its captured concurrent local dataset has total11: state3/3/2/1/2 and category1/7/2/1 reconcile, while the two Reviewer rows account for all three terminal requests. These are observed test-time counts, not fixed or live-production statistics. Cleanup removes only each test's uniquely named request/reviewer/session fixtures.

## Design and remaining acceptance

`src/reports.ts` executes one parameterized PostgreSQL statement using a current-request CTE and one selected terminal actor per request. All aggregates therefore share one statement snapshot. Enum-derived buckets include zero counts; Reviewer rows are stable by actor ID. Session/Reviewer middleware runs before the query. GET has no caller-supplied identity/scope, mutation or amount-sum metric.

UI `/summary` is Reviewer-only, with total/state/category/final-reviewer count tables, explicit unattributed decisions, loading/empty/error/retry/refresh. Existing request-list actions and filters remain covered by regression tests.

Implementation and local verification are complete. CI/Docker, teammate review of implementation/clarifications, main integration, actual GCP release and live verification remain pending. F-09 second approval and F-11 hardening remain planned; complete baseline/traceability and the Deliverable 2 PDF still require work. The published Sprint 2 tag `sprint-2-2026-11-25` remains the continuity reference.
