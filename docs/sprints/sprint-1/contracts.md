# Sprint 1 engineering contracts

Version 0.1, 5 November 2026. Issue #4. Baseline: merged SRS, feature inventory and system SDS. This version defines the contracts and Software Test Specification before implementation. Record later revisions with date, reason and affected IDs.

## Shared behavior

Use the SDS JSON envelopes and error conventions. Derive identity, role and ownership from the authenticated session. Protected routes return 401 for missing or expired sessions, 403 for forbidden roles, and 404 for another Requester's private record. Validate input on the server and return field errors. React forms preserve inputs on validation failure, show pending and failure states, and prevent repeated submissions while busy. Lists show loading, empty and error states. Return only public user fields in request representations.

## F-01 Authentication and access control

FR-01–03, BR-11–12, NFR-01–03. Depends on F-05 schema and seed data.

Login screen submits username and password to POST /api/auth/login. Success returns the public user (ID, username and role) and sets the SDS session cookie. Invalid credentials return a generic 401. GET /api/auth/me returns the same public user. POST /api/auth/logout deletes the current Session, clears the cookie and returns success. The UI returns to login and clears cached private state. Session rows reference User and expire after eight hours by default without renewal. Use bcrypt and the SDS cookie flags. Authorization and record filtering apply server-side.

| Acceptance criterion | Test ID and level | Preconditions and action | Expected result |
| --- | --- | --- | --- |
| AC-01-01 Valid and invalid credentials are handled safely | TEST-01-01 API/DB | Seed both roles. Log in with valid credentials, then with a wrong password and unknown username. | Valid logins set the protected cookie and return the correct role. Both invalid attempts return generic 401 and create no session. Stored passwords are salted bcrypt hashes. |
| AC-01-02 Identity comes from the session | TEST-01-02 API/DB | Call /me with a valid session; try protected routes without a cookie and with an expired cookie. | Valid /me returns only public user fields. Every unauthenticated call returns 401 with no private data. The expired session is deleted. |
| AC-01-03 Logout revokes access | TEST-01-03 UI/API | Log in, log out, then replay the old cookie. | UI returns to login, cookie is cleared, Session row is deleted and replay gets 401. |
| AC-01-04 Roles and ownership are enforced | TEST-01-04 API/DB | Requester A tries a review operation and reads B's detail; Reviewer attempts submission. Include forged role/user inputs. | 403 for wrong role, 404 for B's detail, no private data or mutation. Each seeded user has one role. |

## F-02 Submit and track requests

FR-04–06, BR-01–02, BR-08, NFR-08. Depends on F-01 and F-05.

POST /api/requests accepts title, category, positive THB amount and justification. Category must be Funding, Purchase, Travel or Reimbursement. Trim text and reject blanks. Store amount as a decimal using the SDS schema precision. Return the created request with status 201. The backend supplies requester ID, Pending state and a null reviewer ID. GET /api/requests returns the Requester's own list. GET /api/requests/:id returns the fields, state, reviewer and decision reason for an accessible record. Requesters use a submission form and own list/detail screens. Sprint 1 exposes no edit action or route.

| Acceptance criterion | Test ID and level | Preconditions and action | Expected result |
| --- | --- | --- | --- |
| AC-02-01 Valid submission persists | TEST-02-01 API/DB | Log in as a Requester, submit a valid request and fetch it again. | 201, one stored Pending row owned by that account, no reviewer. List and detail show the saved request. |
| AC-02-02 Invalid fields are rejected | TEST-02-02 Unit/API/UI | Submit blank text, invalid category, zero or negative amount, and an out-of-range amount. | Validation rejects each invalid field; no row is written. Form shows field errors and keeps input. |
| AC-02-03 Submitted requests are read-only | TEST-02-03 API/DB | Seed requests for two Requesters. List as one, then attempt to edit an owned request. | List includes only owned records. Edit fails and stored fields remain unchanged. |

## F-03 Review queue and claim

FR-07–08, FR-12, BR-03–04, BR-06, NFR-06. Depends on F-01, F-02 and the history persistence in F-05.

Reviewers can read all request details. GET /api/requests supports state=PENDING and mine=true for the Queue and Mine tabs. POST /api/requests/:id/claim returns the updated request. Atomically change Pending with null reviewer to In Review with the authenticated Reviewer assigned, and append a history row in the same transaction. Return 404 for unknown ID, 403 for self-claim and 409 for an invalid state or lost race. Show Claim only for Pending requests. On a conflict, refresh and display the current status.

| Acceptance criterion | Test ID and level | Preconditions and action | Expected result |
| --- | --- | --- | --- |
| AC-03-01 Queue and Mine reflect persisted assignment | TEST-03-01 API/DB | Seed Pending and claimed requests; list all and queue, claim a Pending request, then list Mine and fetch detail. | Reviewer can read any detail. Queue contains only Pending records. Claim assigns the caller, moves it to In Review, writes one history row and moves it from Queue to Mine. |
| AC-03-02 Exactly one concurrent claim succeeds | TEST-03-02 concurrent API/DB | Two Reviewers send claim requests for the same Pending record. | One succeeds, one gets 409, and exactly one reviewer and one claim history entry persist. |
| AC-03-03 Forbidden and invalid claims leave data unchanged | TEST-03-03 unit/API/DB | Attempt self-claim in the service with a synthetic same-ID actor, claim a non-Pending request via API, and claim an unknown ID. | Self-claim denied, invalid state gets 409 and missing ID gets 404. No state or history mutation. |

## F-04 Decide requests and record history

FR-09–11, BR-03, BR-05–07, BR-09–10. Depends on F-03 and F-05.

POST /api/requests/:id/approve accepts an optional reason. POST /api/requests/:id/reject requires a nonblank reason. Both return the updated request. Only the assigned Reviewer can decide an In Review request. Return 404 for unknown ID, 403 for an unrelated Reviewer or self-decision, and 409 for a terminal request when attempted by the assigned Reviewer. Atomically persist the outcome and reason and append actor, time, previous state, new state and reason to RequestHistory. History has no mutation route. The Reviewer detail shows decision controls only for their own In Review requests. Requester detail shows the saved outcome and reason.

| Acceptance criterion | Test ID and level | Preconditions and action | Expected result |
| --- | --- | --- | --- |
| AC-04-01 Approve and reject persist outcomes and history | TEST-04-01 API/DB | Assigned Reviewer approves one In Review request and rejects another with a reason. Fetch both as their owner. | Correct terminal states and reasons are retrieved. Each decision appends exactly one matching history row. |
| AC-04-02 Decisions require assignment and valid input | TEST-04-02 unit/API/DB | Try blank rejection reason, an unrelated Reviewer, a decision before claiming, and self-decision with a synthetic same-ID actor. | Field validation rejects blank reason. Unauthorized decisions are denied. No mutation or history entry occurs. |
| AC-04-03 Final decisions are immutable | TEST-04-03 API/DB | Retry a decision on a terminal request, race approve against reject on another, and try to edit/delete history. | Terminal retry gets 409. One racing decision wins. Original outcomes and history remain unchanged by failed operations. |
| AC-04-04 Critical journey works through the UI | TEST-04-04 end-to-end | Requester submits, Reviewer claims and rejects with a reason, then Requester reopens their request. | UI shows the saved final outcome and reason after a fresh login. |

## F-05 Persistence, seed data and setup

NFR-04, NFR-07. PostgreSQL migrations provision User, Session, Request and RequestHistory with foreign keys and the SDS constraints. Pending requests have no reviewer. Claimed and decided requests have exactly one. Use a reproducible seed with two Requesters and two Reviewers and synthetic requests. Read the seed password from environment configuration. GET /api/health reports service readiness without exposing configuration. Document configuration, migrations, seeding and build/test commands.

| Acceptance criterion | Test ID and level | Preconditions and action | Expected result |
| --- | --- | --- | --- |
| AC-05-01 Data survives restart | TEST-05-01 API/DB | Save a request and decisions, stop and restart the backend with the same database, then retrieve it. | Request, reviewer, decision and history persist. |
| AC-05-02 Fresh setup is reproducible | TEST-05-02 manual | Teammate follows README from a fresh clone against a clean local database. | Migrations, seed, app, health check, build and test commands work. No real credentials enter Git. |

## Lab 7 CR-L7-01 impact analysis (proposed, not implemented)

Issue #94 proposes an owner-only withdrawal transition for an unclaimed Pending request. This contract revision records the old/new rule and test design before code changes. The proposed behavior is not present in the referenced implementation; the actual pre-change main/live version and revision must be refreshed and recorded before the future RED run and release.

| Original requirement/rule | Feature and affected contract | New acceptance criteria / STS | Code/data impact to inspect | Unchanged boundary / reason |
| --- | --- | --- | --- | --- |
| FR-04, FR-05, BR-02; Pending starts unassigned and only the owner lists their records | F-02/F-12; SRS sections 4–5; SDS workflow and permissions | AC-12-01, 02; TEST-12-01, 02 | `src/requests.ts`, `web/main.tsx`, `prisma/schema.prisma`, additive RequestState migration | Submission fields, ownership scope and initial state stay unchanged. |
| FR-07, FR-08, BR-03–04; Reviewer queue and atomic claim | F-03/F-12; SRS BR-03/04/15; SDS transition and race | AC-12-03, 04; TEST-12-03, 04 | claim/withdraw guarded update in `src/requests.ts`; RequestHistory transaction | Existing claim behavior remains unchanged; one winner in claim/withdraw race avoids an orphaned assignment or double transition. |
| FR-11, FR-13, BR-10; state changes are append-only and visible | F-05/F-06/F-12; SRS FR-11/19, BR-10/15; SDS history/API projection | AC-12-01, 05; TEST-12-01, 05 | RequestState enum, migration, detail/history projection, `web/main.tsx` | Preserve original request fields and all prior history; no deletion, rewriting or user-provided withdrawal reason. |
| FR-16, BR-11; authorized lists keep scope | F-08/F-12; SRS FR-16; SDS filters, queue and role table | AC-12-05; TEST-12-05 | `src/request-filters.ts` state enum validation, owner/reviewer list rendering and filtering | Queue remains Pending only; requesters remain owner-scoped; reviewers remain read-only. |
| FR-18; counts by state and terminal reviewer decisions | F-10/F-12; SRS FR-18/19; SDS summary | AC-12-06; TEST-12-06 | `src/reports.ts` and summary UI | Withdrawn contributes to state/category totals but not Approved/Rejected reviewer decision totals. No private request text is added. |
| BR-09/15; terminal-state immutability | F-04/F-07/F-12; SRS BR-09/15; SDS transition constraints | AC-12-03; TEST-12-03 | transition guards and final-state UI | Withdrawn cannot be edited, resubmitted, claimed or decided. Existing terminal outcomes remain unchanged. |

The additive database change needs a new enum value and updated state/reviewer constraint. No historical row rewrite or backfill is needed. Before rollout, confirm the migration and old-image compatibility plan: a pre-change binary may not understand a newly stored enum value, so rollout/rollback must not send Withdrawn rows to an incompatible revision. There is no migration in this contract PR.

## F-12 Requester withdrawal of an unclaimed Pending request (CR-L7-01)

**Status:** Proposed contract revision for Lab 7; implementation and deployment are pending. Original behavior is FR-04/FR-05 and BR-02/BR-03: a valid requester submission creates an unassigned Pending request, which has no owner withdrawal action or route. The system retains it in Pending until a Reviewer claims it. The proposed new rule is FR-19/BR-15 in `docs/srs.md`.

**API:** `POST /api/requests/:id/withdraw` with `{}`. Session identity supplies the requester. Success is `200 {data: request}` with state `WITHDRAWN`; no input reason is accepted or needed. Use an atomic conditional update requiring matching `id`, `requesterId`, state `PENDING`, and `reviewerId IS NULL`; in the same database transaction append one history row (`fromState=PENDING`, `toState=WITHDRAWN`, actor=requester, fixed reason `Requester withdrew the request.`). Return 404 for missing/private-to-another-requester records, 403 for a Reviewer role, and 409 for an owned request not eligible for withdrawal. All failures write nothing. Do not reveal whether another requester's ID exists.

**Persistence and behavior:** add `WITHDRAWN` as a RequestState enum value through a forward-only additive migration; update the existing reviewer/state CHECK so both `PENDING` and `WITHDRAWN` require `reviewerId IS NULL` and all other states require an assigned reviewer; do not change `decidedAt` or `decisionReason` as withdrawal is not a Reviewer decision. Retain request fields and all prior history. The new event is append-only. Withdrawn is final. Requesters see it only in their own list/detail/history; Reviewers see it read-only. State filters and the all-state summary include the new enum. Reviewer decision totals remain Approved/Rejected only; withdrawal is not a decision attributed to a Reviewer.

**UI:** show a Withdraw action only to the owning Requester while the visible state is Pending; require an explicit confirmation, disable repeated submission while busy, refresh the detail/list after success, and preserve the current view with a clear message on 409/network failure. Display a Withdrawn status and the history entry. Reviewers receive no withdrawal control. UI visibility is convenience only; server authorization is authoritative.

| Acceptance criterion | Test ID and level | Preconditions and action | Expected result |
| --- | --- | --- | --- |
| AC-12-01 Eligible owner can withdraw once | TEST-12-01 API/DB | Owner submits Pending request; POST withdraw `{}`; fetch detail and history. | 200, state WITHDRAWN, reviewer null, request fields and original event retained, exactly one PENDING->WITHDRAWN event with owner and fixed reason. |
| AC-12-02 Authentication, role and ownership are enforced | TEST-12-02 API/DB | Call without session; call as Reviewer; call as a different Requester. | 401, 403, and non-disclosing 404 respectively; no state/history mutation or private data. |
| AC-12-03 Only unclaimed Pending is eligible; withdrawn is final | TEST-12-03 API/DB | Try owned requests in IN_REVIEW, RETURNED, APPROVED, REJECTED and WITHDRAWN; retry after success. | 409 each time; no state/history change; all existing owner edit, decision and final-state rules remain intact. |
| AC-12-04 Withdraw/claim race is atomic | TEST-12-04 concurrent API/DB | Send owner withdraw and Reviewer claim concurrently for the same eligible request. | Exactly one 200 and one 409. Winner state and actor assignment agree; exactly one corresponding history event; loser creates none. |
| AC-12-05 UI, history and list scope are consistent | TEST-12-05 UI/API | Withdraw as owner, reload; inspect owner list/detail/history and Reviewer All/Queue. | Owner sees Withdrawn and one event after reload; other requester sees no record; Reviewer can read it, Queue omits it, no Reviewer action is shown. |
| AC-12-06 Summary counts state without calling it a decision | TEST-12-06 API/UI | Create a Withdrawn fixture and query Reviewer summary. | WITHDRAWN state/category totals include one; total reconciles; Approved/Rejected reviewer totals and unattributed decisions are unchanged. |

The affected modules and dependencies are listed in the impact matrix above. Existing auth, submission, claim, decision, return/resubmit, filter, history, persistence and summary contracts remain regression scope. Test IDs above are planned; no implementation or test result is claimed by this documentation revision.

## Product Definition of Done

Each contract and test design is versioned before implementation. Requirements trace to acceptance criteria and test IDs. Each completed feature is linked to its Issue and reviewed PR into sprint-1-staging. Record failing-before/passing-after evidence for a meaningful rule test, then verify the integrated release. Record test commands, files, outcomes and exact tested commit. Keep setup reproducible and report incomplete, failed or skipped work. The release PR receives teammate review before merging to main.
