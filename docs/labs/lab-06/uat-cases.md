# Executable Sprint 1 UAT cases

Status: draft, not executed. Each case is independent and creates fresh uniquely named synthetic records; steps within a case are sequential. Baseline/accounts/evidence rules: [handoff](handoff.md). The independent team must review case coverage and record any agreed additions before execution. Exact server contract: [Sprint 1 ACs](../../sprints/sprint-1/contracts.md).

## UAT6-01 — Normal approval journey

- Requirement / AC: AC-02-01, AC-03-01, AC-04-01; FR-04–09, FR-12
- Purpose: verify normal approval journey against delivered Sprint 1 scope.
- Role(s): requester1; reviewer1
- Preconditions: baseline healthy, private credentials available, unique prefix; Fresh uniquely titled PURCHASE request; amount 125.50; justification Synthetic lab equipment.
- Evidence ID prefix: UAT6-01-E; record tester, time, full tested SHA/revision, actual input and observed result for every step.

1. **Action:** Sign in as requester1; New request; enter the synthetic data and submit.
   **Expected:** One Pending request appears with exact saved values in own list/detail; record ID.

2. **Action:** Sign out; sign in as reviewer1; Queue; open that ID; Claim request.
   **Expected:** In review; assigned to reviewer1; removed from Pending Queue and available in Mine.

3. **Action:** Approve; optionally enter Within synthetic budget.
   **Expected:** Approved with saved reason if entered; no further decision control.

4. **Action:** Sign out; sign in as requester1; reopen from My requests and reload.
   **Expected:** The same ID, amount 125.50 and Approved outcome persist.

**Actual result / PASS / FAIL / BLOCKED:** not executed; complete execution.csv.

## UAT6-02 — Submission boundaries and read-only data

- Requirement / AC: AC-02-02, AC-02-03; BR-01, BR-08
- Purpose: verify submission boundaries and read-only data against delivered Sprint 1 scope.
- Role(s): requester1
- Preconditions: baseline healthy, private credentials available, unique prefix; Fresh title; valid category PURCHASE; amount variants below; nonblank justification.
- Evidence ID prefix: UAT6-02-E; record tester, time, full tested SHA/revision, actual input and observed result for every step.

1. **Action:** Count/list existing own records; open New request. Try blank title with amount 10.00, then valid title with amount 0, then -1.00, then blank justification.
   **Expected:** Each invalid attempt is rejected, field feedback is visible, inputs retained, and no new request appears. Record each actual outcome separately.

2. **Action:** Correct all fields and submit amount 0.01.
   **Expected:** Exactly one Pending request with amount THB 0.01 is saved.

3. **Action:** Reload its detail and inspect available actions.
   **Expected:** Saved fields unchanged; no Sprint 1 edit action. Record a failure if an exposed edit can change it.

**Actual result / PASS / FAIL / BLOCKED:** not executed; complete execution.csv.

## UAT6-03 — Cross-requester ownership and forbidden review

- Requirement / AC: AC-01-04, AC-02-03; BR-11
- Purpose: verify cross-requester ownership and forbidden review against delivered Sprint 1 scope.
- Role(s): requester1; requester2; reviewer1
- Preconditions: baseline healthy, private credentials available, unique prefix; Create a new Pending record as requester1; record exact detail URL and ID.
- Evidence ID prefix: UAT6-03-E; record tester, time, full tested SHA/revision, actual input and observed result for every step.

1. **Action:** Sign out, then sign in as requester2; inspect My requests.
   **Expected:** Requester1 record is absent.

2. **Action:** Navigate directly to requester1 record URL.
   **Expected:** Access rejected/not found; no private title, amount or justification disclosed.

3. **Action:** In requester2 session, use browser DevTools same-origin fetch to POST /api/requests/<ID>/claim with JSON {} and Content-Type application/json.
   **Expected:** HTTP 403; no successful claim. Capture response without cookies/tokens.

4. **Action:** Sign out; sign in as requester1, reopen same ID; reviewer1 can also check Queue.
   **Expected:** Still Pending, no reviewer assignment and no protected field changed; record before/after evidence.

**Actual result / PASS / FAIL / BLOCKED:** not executed; complete execution.csv.

## UAT6-04 — Rejection reason and requester retrieval

- Requirement / AC: AC-04-02, AC-04-04; BR-07
- Purpose: verify rejection reason and requester retrieval against delivered Sprint 1 scope.
- Role(s): requester1; reviewer1
- Preconditions: baseline healthy, private credentials available, unique prefix; Fresh Pending TRAVEL request, amount 299.50, justification Synthetic conference trip.
- Evidence ID prefix: UAT6-04-E; record tester, time, full tested SHA/revision, actual input and observed result for every step.

1. **Action:** As reviewer1, claim this fresh request, then click Reject with an empty reason; repeat with spaces.
   **Expected:** Each attempt rejected; request remains In review, no terminal outcome persisted.

2. **Action:** Enter Missing synthetic receipt; Reject.
   **Expected:** Rejected with that reason saved.

3. **Action:** Logout; requester1 logs in afresh and opens the same ID.
   **Expected:** Rejected and exact reason visible after reload; amount/title unchanged.

**Actual result / PASS / FAIL / BLOCKED:** not executed; complete execution.csv.

## UAT6-05 — Assigned reviewer and terminal-state restrictions

- Requirement / AC: AC-04-02, AC-04-03; BR-05, BR-09
- Purpose: verify assigned reviewer and terminal-state restrictions against delivered Sprint 1 scope.
- Role(s): requester1; reviewer1; reviewer2
- Preconditions: baseline healthy, private credentials available, unique prefix; Fresh Pending record created by requester1; reviewer1 claims it; note ID.
- Evidence ID prefix: UAT6-05-E; record tester, time, full tested SHA/revision, actual input and observed result for every step.

1. **Action:** As reviewer2, open the same detail; inspect decision controls; use same-origin DevTools POST /api/requests/<ID>/approve with JSON {}.
   **Expected:** Record is readable but reviewer2 has no decision action; API returns 403; state/assignment unchanged.

2. **Action:** As reviewer1, approve, then repeat same POST /approve as reviewer1.
   **Expected:** First decision Approved; repeated decision returns 409. Original outcome, reviewer and reason unchanged after reload.

3. **Action:** As requester1, reopen record.
   **Expected:** Original final outcome displayed; no extra mutation from denied attempts. Product Team supplies sanitized history extract for the ID if needed to check one decision entry.

**Actual result / PASS / FAIL / BLOCKED:** not executed; complete execution.csv.

## UAT6-06 — Authentication and logout boundary

- Requirement / AC: AC-01-01, AC-01-02, AC-01-03; FR-01–03
- Purpose: verify authentication and logout boundary against delivered Sprint 1 scope.
- Role(s): requester1
- Preconditions: baseline healthy, private credentials available, unique prefix; Use only supplied synthetic credentials; choose a deliberately incorrect password not used elsewhere.
- Evidence ID prefix: UAT6-06-E; record tester, time, full tested SHA/revision, actual input and observed result for every step.

1. **Action:** Try requester1 with incorrect password, then unknown UAT6-user with any synthetic wrong input.
   **Expected:** Both rejected with generic message, no authenticated private list.

2. **Action:** Sign in with valid requester1 credentials; open My requests; Sign out; navigate directly to the previous detail URL and reload.
   **Expected:** Login succeeds before logout; afterwards protected data is inaccessible and login is required. No cached private details disclosed.

3. **Action:** In logged-out browser DevTools GET /api/requests.
   **Expected:** HTTP 401 and no private records. This supports the manual logout observation.

**Actual result / PASS / FAIL / BLOCKED:** not executed; complete execution.csv.

## UAT6-07 — State survives fresh session and coordinated restart

- Requirement / AC: AC-05-01, AC-04-01; NFR-04
- Purpose: verify state survives fresh session and coordinated restart against delivered Sprint 1 scope.
- Role(s): requester1; reviewer1; Product Team restart operator
- Preconditions: baseline healthy, private credentials available, unique prefix; Fresh request independently created and rejected with reason UAT6 persistence check. Agree restart time; capture source/revision and ID before restart.
- Evidence ID prefix: UAT6-07-E; record tester, time, full tested SHA/revision, actual input and observed result for every step.

1. **Action:** As requester1, record ID/title/amount/state/reviewer/reason, logout and login again; reopen record.
   **Expected:** All recorded values persist through fresh session.

2. **Action:** During agreed window, Product Team restarts backend on SAME database and records old/new revision and image; partner waits for health readiness.
   **Expected:** Operator identifies restart evidence; UAT Team does not assume the restart happened. If unavailable record BLOCKED for restart step.

3. **Action:** Independent partner reloads the same record; compare every recorded field and sanitized history extract.
   **Expected:** Same business values, reviewer, decision and history persist. Record actual differences or exact match; no new record is substituted.

**Actual result / PASS / FAIL / BLOCKED:** not executed; complete execution.csv.

## UAT6-08 — Claim competition and single assignment

- Requirement / AC: AC-03-02, AC-03-03; BR-04; NFR-06
- Purpose: verify claim competition and single assignment against delivered Sprint 1 scope.
- Role(s): requester1; reviewer1; reviewer2 (two tester browsers)
- Preconditions: baseline healthy, private credentials available, unique prefix; Fresh Pending record; both reviewers open its detail before either claims.
- Evidence ID prefix: UAT6-08-E; record tester, time, full tested SHA/revision, actual input and observed result for every step.

1. **Action:** Coordinate two testers to click Claim request at nearly the same time; record which browser acts first if observable.
   **Expected:** Exactly one reviewer is assigned. Losing browser shows conflict/current state after refresh. Manual timing is recorded, not claimed as proof of a perfectly simultaneous race.

2. **Action:** Both refresh detail, Queue and Mine; retry claim in losing session with same-origin POST /api/requests/<ID>/claim.
   **Expected:** Same single assigned reviewer everywhere; not in Queue, in winner Mine only; repeat claim returns 409; no double assignment. Sanitized history confirms one claim entry.

3. **Action:** Corroborate exact concurrent behavior with existing automated concurrent regression output separately.
   **Expected:** Automated evidence supports, and does not replace, the partners’ manual observations.

**Actual result / PASS / FAIL / BLOCKED:** not executed; complete execution.csv.
