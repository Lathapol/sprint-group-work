# Shared engineering and test rules

Contract version 0.1, 24 November 2026. Drafted before implementation; pending teammate review. Actual new-feature tests have **not run**, and all AC below are planned, not accepted. Requirement references use the existing SRS; historical Sprint 1 contract remains intact.

JSON success envelope `{ data: ... }`; errors `{ error: { code, message, fields? } }`. Existing session/role middleware remains authoritative. Every protected endpoint: anonymous/expired 401, wrong role 403, another Requester's private record 404, unknown ID 404, invalid input 400, state/race conflict 409. Run role/ownership checks before private-data reads or mutations; no passwords/hashes/cookies in resources or logs. Unexpected 500 remains generic.

Use real isolated migrated PostgreSQL for persistence and concurrent API tests; synthetic users/records only. Proposed test files below are targets, not claims those files already exist. Unit runner is the actual Node test runner (`node --test` via npm test), API harness Supertest, UI Playwright. No unimplemented Vitest tooling is claimed.

Each feature DoD: all its AC implemented; meaningful planned unit/API/DB/UI verification actually executed and results/version/counts recorded; RED assertion fails for the intended missing behavior before implementation, same test GREEN afterward; relevant Sprint 1 and cross-feature regression passes; substantive teammate feature PR review and integration; reproducible migrations/setup; accepted main release and live smoke evidence. A proposed test ID is not an executed result.

# Sprint 3 contracts

All remaining baseline features F-09/F-10/F-11 are specified below. F-10 is proposed meaningful working progress for Deliverable 2; F-09/F-11 remain planned until actual implementation/verification. No empty screen or unexecuted test counts as checkpoint progress.

## F-09 Second-stage approval

FR-17, BR-03/04/05/06/09/10/11/14; NFR-01/02/04/06/08. Depends on F-04/F-07. User Q-02: **amount >= THB 50,000.00** triggers a second, different reviewer. Below threshold remains the original single-reviewer flow.

Workflow/API: first assigned Reviewer uses existing approve. Below 50,000 -> APPROVED as before. At/above 50,000 -> AWAITING_SECOND_APPROVAL, record firstApprovedAt and first approval history; not terminal, no decidedAt. A different Reviewer, also not the Requester, may POST `/api/requests/:id/second-approve` optional reason or `/second-reject` required nonblank reason; guarded waiting -> APPROVED/REJECTED in one transaction. Initial reviewerId continues to identify the first claiming Reviewer; secondReviewerId is the final second actor. No new second-claim step: eligible reviewers choose a waiting request and the database guard permits only one terminal outcome. First reviewer cannot approve/reject their own second stage, even with forged identity. Anonymous 401, Requester 403, ineligible/self Reviewer 403, wrong state/lost race 409, unknown ID404; no unauthorized state/history mutation. Return/edit in second stage is not added; earlier first stage may return under F-07.

Data: migration adds AWAITING_SECOND_APPROVAL enum, firstApprovedAt nullable, secondReviewerId nullable relation/index, consistency checks. Existing terminal rows stay unchanged. Above-threshold amount is immutable once waiting because editing remains Returned-only. Decimal comparisons exactly 49,999.99 / 50,000.00 / 50,000.01, no binary-float boundary rounding. On a returned/resubmitted first-stage record clear first/second-approval markers until first approve succeeds. Atomic terminal update and append-only final history retain both identities and times. Migration preserves old requests and constraints.

UI: distinguish Awaiting second approval from Approved, show first and final reviewer identities, threshold semantics, waiting queue/tab and eligible second actions. First reviewer sees read-only waiting status; Requester cannot decide and cannot edit waiting records. Existing Pending Queue and Mine retain their defined scopes. Approval cannot be reported as final before second success.

| AC | Observable contract | STS / proposed test |
|---|---|---|
| AC-09-01 | 49,999.99 single-stage; 50,000.00 and 50,000.01 require second, cannot appear final early | TEST-09-01 unit/API/DB with exact decimal fixtures and persisted first/time/history; target test/second-approval.test.cjs |
| AC-09-02 | Only different non-owner Reviewer completes second approve/reject; negative roles/input unchanged | TEST-09-02 API/DB: first/self/owner/anonymous denial, blank rejection, public fields only; backend identity from session |
| AC-09-03 | Competing second decisions yield one success and one conflict, one final history and immutable terminal data | TEST-09-03 concurrent API/DB: synthetic three-reviewer fixture for two eligible competitors; reload compare actor/times/counts |
| AC-09-04 | UI shows waiting then true terminal result; original below-threshold journey/return/edit, summaries and history remain correct | TEST-09-04 UI/regression: two reviewers, requester retrieval, F-06/07/10 cross-feature assertions; target test/browser/second-approval.spec.ts |

## F-10 Decision summary

FR-18, FR-07, BR-11, NFR-01/02/04/08. Depends on persisted F-04 decisions/history. This meaningful Sprint 3 domain reporting workflow is the proposed checkpoint implementation after Sprint 2 integration, not merely a stub screen.

API: `GET /api/reports/summary`, Reviewer only. Return `{data:{total,byState:[{state,count}],byCategory:[{category,count}],byReviewer:[{reviewer:{id,username},approved,rejected,total}],unattributedDecisions}}`. byState covers all current RequestState values including zero counts; byCategory covers fixed enum values. total is current persisted request count, and each of state/category totals sums to total. byReviewer counts terminal requests by the final decision actor from the persisted terminal RequestHistory entry (not merely the first assigned reviewer). Each terminal request counted once, latest matching final event chosen deterministically; approved+rejected totals reconcile with terminal states including explicit unattributed legacy count. Do not fabricate an actor for legacy missing history. Reviewer rows ordered by stable ID. No amount sums or real financial accounting is implied by count metrics.

Compute related counts under one consistent database snapshot (repeatable-read transaction or equivalent single-query snapshot) so concurrent claims/decisions do not produce contradictory totals. Initial F-10 needs no new schema; use parameterized aggregate/relation queries over Request/RequestHistory and public actor fields. F-09 future final actor semantics already accounted for. No new mutation endpoint or role. Requester 403, anonymous/expired401; no individual private fields/hashes/session values returned. UI Reviewer Summary screen shows count labels, no-data zeroes, loading/error/retry. No Requester navigation; backend denial still tested. No filters are introduced to this initial reporting contract.

| AC | Observable contract | STS / proposed test |
|---|---|---|
| AC-10-01 | Exact zero/nonzero state/category totals reconcile with seeded persisted records | TEST-10-01 API/DB: empty DB then known Pending/Returned/In Review/Approved/Rejected counts; exact totals and zero buckets; target test/summary.test.cjs |
| AC-10-02 | Final decision reviewer counts are exact, no double count; terminal/overall invariants hold with cross-feature edits and concurrency | TEST-10-02 API/DB: return/resubmit/approve/reject, repeated read, concurrent transition, future second-stage fixture when implemented; assert final actor and reconciliation |
| AC-10-03 | Anonymous401/Requester403; safe Reviewer output only; no identity forged through query/body | TEST-10-03 API/DB access restriction assertion and no forbidden data; included selected access excerpt for checkpoint |
| AC-10-04 | Reviewer UI shows actual counts after a real domain decision and reload, empty/error/retry clear | TEST-10-04 UI: create/claim/decide, open Summary, compare known deltas and saved results; target test/browser/summary.spec.ts |

## F-11 Hardening and usability

NFR-05 and NFR-08 plus NFR-01/02/04/06/07; cross-cuts all features. Maintain real rule validation and ownership rather than weakening tests to achieve a green run. UI must retain invalid input with field errors, show non-destructive load/failure/empty states, prevent repeated submits while busy and surface concurrency conflicts without false success. Only justified bug/performance changes enter reviewed branches. UI/API conventions stay consistent; data layer needs no change unless a measured issue justifies an additive migration/index.

Performance STS: local built application and real isolated PostgreSQL with 1,000 synthetic requests across two owners, both reviewers, relevant states/categories. Measure authorized list GETs as each role separately; document CPU/RAM/OS, Node/PostgreSQL versions, transport/setup and source. Exclude seed/login/setup from timing. 20 warm-up requests then 100 sequential measured requests per list scenario; include HTTP/database/serialization, report p50/p95/max and all samples. p95 is sorted sample at ceil(0.95*n)-1; assert <500 ms for each scenario (not an average across roles). Record dataset ownership distribution and filtered/unfiltered workloads. A failed target remains failed; optimize/retest on new commit without relaxing it. This is a local target, not an unsupported GCP latency promise.

| AC | Observable contract | STS / proposed test |
|---|---|---|
| AC-11-01 | Local lists on 1,000 fixtures meet NFR-05 p95 <500ms under stated protocol | TEST-11-01 timed API measurement with raw samples/environment/source; target test/performance/list-performance.cjs and documented command; not run yet |
| AC-11-02 | Invalid forms retain all input, per-field errors, failed requests show retry and no false saved-state result | TEST-11-02 UI with invalid inputs, controlled request failures and busy double-action checks across submit/edit/decide; target test/browser/usability.spec.ts |
| AC-11-03 | Full domain/access/concurrency regression and fresh setup pass; failures/skips disclosed and traced to defects | TEST-11-03 existing/new unit/API/UI suite plus teammate clean-clone setup and non-production same-DB restart verification; exact commands/counts/source retained |

Feature-level DoD extends shared DoD: retain actual performance samples when claiming the target, pending UAT and approved maintenance dependencies, and the 13 December controlled finish plan. A green unrelated test or passing documentation PR does not satisfy these AC.
