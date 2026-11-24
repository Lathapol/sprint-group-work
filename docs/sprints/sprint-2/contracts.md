# Shared engineering and test rules

Contract version 0.1, 24 November 2026. Drafted before implementation; pending teammate review. Actual new-feature tests have **not run**, and all AC below are planned, not accepted. Requirement references use the existing SRS; historical Sprint 1 contract remains intact.

JSON success envelope `{ data: ... }`; errors `{ error: { code, message, fields? } }`. Existing session/role middleware remains authoritative. Every protected endpoint: anonymous/expired 401, wrong role 403, another Requester's private record 404, unknown ID 404, invalid input 400, state/race conflict 409. Run role/ownership checks before private-data reads or mutations; no passwords/hashes/cookies in resources or logs. Unexpected 500 remains generic.

Use real isolated migrated PostgreSQL for persistence and concurrent API tests; synthetic users/records only. Proposed test files below are targets, not claims those files already exist. Unit runner is the actual Node test runner (`node --test` via npm test), API harness Supertest, UI Playwright. No unimplemented Vitest tooling is claimed.

Each feature DoD: all its AC implemented; meaningful planned unit/API/DB/UI verification actually executed and results/version/counts recorded; RED assertion fails for the intended missing behavior before implementation, same test GREEN afterward; relevant Sprint 1 and cross-feature regression passes; substantive teammate feature PR review and integration; reproducible migrations/setup; accepted main release and live smoke evidence. A proposed test ID is not an executed result.

# Sprint 2 contracts

## F-06 Request history view

FR-11/FR-13, BR-10/BR-11, NFR-01/02/04/08. Depends on F-01/F-04/F-05. Workflow: owner Requester or any Reviewer opens a request, then reads its ordered audit timeline including initial creation, claims, decisions and later return/edit/resubmit events. Other Requesters must learn nothing about its existence or history.

SDS/API: `GET /api/requests/:id/history` returns `{data:[{id,actor:{id,username,role},fromState,toState,reason,createdAt}]}`. Ascending createdAt then id gives deterministic ordering including equal timestamps. Reuse exact detail-view authorization; do not include a session or password hash. No history PATCH/PUT/DELETE route. Existing history/user schema and indexes need no change for F-06 alone. Request list payload does not embed every history row. Select current public actor fields and preserve recorded actor ID/time; one role per account remains fixed.

UI: detail History section with loading, empty (legacy record), error/retry, actor, time, from/to state and optional escaped reason. Existing fields/actions remain accessible. No HTML interpretation of submitted text. UTC ISO values are stored/returned; display timezone clearly. No history input or mutation controls.

| AC | Observable contract | STS / proposed test |
|---|---|---|
| AC-06-01 | Stored transitions shown once in ascending time/id, correct actor and reason; owner and Reviewer retrieve same history | TEST-06-01 API/DB: submit/claim/reject fixtures, fetch history as owner and Reviewer; exact 3 row sequence and actor IDs. target test/history.test.cjs |
| AC-06-02 | Anonymous 401; wrong Requester 404; no private rows/hashes; no exposed history mutation changes data | TEST-06-02 API/DB: two owners, one Reviewer, GET without/with sessions, mutation attempts and before/after row count; target test/history.test.cjs |
| AC-06-03 | UI renders chronology/reason, loading/empty/error states; unsafe text is literal | TEST-06-03 UI: owner detail and Reviewer detail, synthetic HTML-like reason, retry failure and legacy empty fixture; target test/browser/history.spec.ts |
| AC-06-04 | Fresh app instance on SAME database retrieves identical history; no duplicate events from read/reload | TEST-06-04 API/DB: createApp twice sharing isolated DB, compare IDs and business fields/history count; target test/history.test.cjs |

Boundary cases: equal timestamps; null initial fromState; optional approval reason null; missing ID, invalid integer ID; repeated reload; unrelated Reviewer read is allowed by BR-11. Full server-restart proof should supplement an in-process new-instance check where required; do not call the latter an OS/container restart.

## F-07 Return and resubmission

FR-14/15 plus FR-04/06/11/12/13; BR-01/03/05/06/07/08/09/10/11/13; NFR-01/02/04/06/08. Depends on F-06 timeline and existing authentication/claims. User Q-01 decision: retain original reviewer throughout return and resubmit to IN_REVIEW for that same reviewer.

Workflow: assigned Reviewer IN_REVIEW -> RETURNED with required trimmed reason; owner edits allowed fields only while Returned; owner resubmits -> IN_REVIEW. Same reviewer can then approve/reject/return again. RETURNED is not terminal; APPROVED/REJECTED remain terminal. PENDING queue remains unassigned only; resubmitted records appear in same reviewer's Mine, never in Pending Queue. Reviewer may read Returned but cannot decide it until resubmission.

API and transaction design:
- `POST /api/requests/:id/return` body `{reason}`: assigned Reviewer only, nonblank string; atomically guarded IN_REVIEW -> RETURNED, retain reviewerId, set visible decisionReason to return reason, decidedAt null, append actor/time/from/to/reason in same transaction.
- `PATCH /api/requests/:id` owner Requester only; Returned only. Allow title/category/amount/justification; partial edits validate the resulting whole request with the existing positive THB decimal(12,2) rule and fixed category. Reject unknown/protected fields (state/requesterId/reviewerId/reason/history) with 400; do not silently apply them. No effective changes creates no edit history. Effective edit persists fields and one RETURNED -> RETURNED history row with reason Request details updated. This is an edit audit event, not a state transition; UI labels it Edited.
- `POST /api/requests/:id/resubmit` body `{}`: owner only, Returned only, revalidate stored required fields, guarded RETURNED -> IN_REVIEW, retain reviewerId, clear current decisionReason/decidedAt, append resubmission history. Earlier return reason remains in history.
- Cross-owner Requester operations return 404; Reviewer attempts edit/resubmit return 403; unrelated/self Reviewer return 403; wrong state/race 409. Confirm no field/state/history mutation after any rejected operation. Concurrent edit/resubmit serialize by locking the request row inside the transaction before authorization/state validation and write, avoiding post-submit edits.

Data: migration adds RETURNED enum and updates database state/reviewer/history constraints so Returned retains one reviewer. Existing rows/IDs/terminal data survive. Deploy enum compatibility safely before code using the new value; do not reset/reseed production. RequestHistory supports same-state edit rows; no destructive rewrite. No new ownership model or role is introduced.

UI: Return dialog required reason with field feedback and input retention; owner Returned detail has edit form and Save changes / Resubmit actions (resubmit only saved valid data). Prevent double submission while pending. Reviewer sees returned reason/history and saved edited values when back In Review. Surface 409 with refresh and retained unsaved form input; no false success toast.

| AC | Observable contract | STS / proposed test |
|---|---|---|
| AC-07-01 | Assigned return requires reason, one RETURNED transition, same reviewer; blank/whitespace rejected unchanged | TEST-07-01 API/DB + UI: valid/empty/whitespace/unknown reason input; assert state/reason/actor/one history; target test/returns.test.cjs and test/browser/returns.spec.ts |
| AC-07-02 | Only owner edits Returned; validation keeps persisted valid fields and no private leak; terminal/submitted edits denied | TEST-07-02 API/DB: owner/other/Reviewer/anonymous, invalid fields, protected-field injection, all old states, compare before/after rows/history |
| AC-07-03 | Resubmit goes to SAME reviewer, IN_REVIEW, not Pending Queue; earlier reason preserved in immutable history | TEST-07-03 API/DB + UI: return/edit/resubmit, query Queue/Mine/history, same reviewer decides/rejects and owner retrieves fresh |
| AC-07-04 | Edit/resubmit race cannot edit after state leaves Returned; duplicate resubmit has one winner/history; unrelated reviewer cannot decide | TEST-07-04 concurrent API/DB: two sessions/transactions, exact allowed outcomes and persisted fields; state guard checked under row lock |
| AC-07-05 | Old approval/rejection and owner restrictions still work; migrations preserve existing records and reload retains all edited data/history | TEST-07-05 regression/integration: existing Sprint 1 tests plus before/after migration isolated DB and fresh app-instance retrieval |

## F-08 Filtering and search

FR-16, FR-05/07/12, BR-11, NFR-01/02/08; depends on F-02/F-03 and RETURNED state from F-07. Filters never expand role/ownership visibility.

API: extend `GET /api/requests` with existing `state`, Reviewer `mine=true`, plus `category`, `from`, `to`, `q`. All supplied conditions combine with AND and existing authorization predicate. `q` is trimmed case-insensitive literal substring of title OR justification; max 200 Unicode characters, no SQL pattern wildcard interpretation. Empty q means no text filter. Unknown category/state, repeated scalar parameters, nonstring values, malformed boolean and malformed dates/range return 400 field errors. Requester cannot use mine or forged ownership inputs to widen visibility; reject unsupported ownership/role query fields instead of accepting them.

Dates: from/to are valid ISO calendar YYYY-MM-DD; from day starts 00:00 UTC inclusive, to day ends by exclusive next-day 00:00 UTC, filter request.createdAt. Reject non-calendar dates and from>to; either bound may be omitted. Exact same-day boundaries are tested. Preserve existing descending id order; ties deterministic. Query construction uses parameterized Prisma conditions; never interpolate SQL. No data/schema change required initially; add justified indexes only with measured plan evidence.

UI: state/category/date/text controls on requester own list and reviewer All/Queue/Mine. Submit/Clear, loading/empty/error and validation-input retention; show UTC date semantics. Queue scope remains PENDING, Mine retains current Reviewer; controls may narrow these scopes but may not override them. Clear resets filters within current tab scope. Dates/filters do not change record data.

| AC | Observable contract | STS / proposed test |
|---|---|---|
| AC-08-01 | Each filter and meaningful AND combination returns exact persisted matching set/order | TEST-08-01 API/DB: multiple owners/categories/states/dates/text, q in title/justification, literal percent/underscore, mixed-case/trim/empty, exact IDs; target test/filters.test.cjs |
| AC-08-02 | UTC inclusive-day boundaries, one-sided/same-day filters correct; invalid date/range/scalar/category/state rejected | TEST-08-02 unit/API: midnight, last millisecond, next-day exclusion, leap day, invalid Feb30, reversed range; target test/filter-validation.test.cjs |
| AC-08-03 | Every filtered requester result remains own-only; Reviewer Queue/Mine cannot widen; anonymous 401 | TEST-08-03 API/DB: guess other's title/date/id-related input; assert no private row/fields; forged owner/mine handling, wrong type errors |
| AC-08-04 | Filter/Clear/empty/error UI works across roles/tabs, inputs retained on failure; no mutation or lost existing actions | TEST-08-04 UI + Sprint 1/2 regression: filtered saved results, clear within current tab, validation errors, submit/claim/return unaffected; target test/browser/filters.spec.ts |

