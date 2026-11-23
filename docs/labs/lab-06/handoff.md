# Sprint 1 UAT handoff (draft for team review)

## Baseline

- Repository: https://github.com/Lathapol/sprint-group-work
- Source commit: `51b57adc1c51d57e23d047d628cf55966e268ad9` (main, Lab 5 release).
- Cloud Run revision observed 19 Nov 2026: `approvals-r44500910145-1`.
- URL: https://approvals-389973748230.asia-southeast1.run.app
- Confirm `/api/version` matches the full SHA and `/api/health` reports status `ok` at the START and END of each session. Record actual time and version; stop and coordinate if it differs. These are developer-provided baseline observations, not independent results.
- Contract: [Sprint 1 contracts](../../sprints/sprint-1/contracts.md), version 0.1, 5 Nov 2026; [feature scope](../../features.md). Freeze any agreed clarification before testing.

## Accepted-for-test scope

F-01 authentication/role/ownership enforcement; F-02 validated submission and own tracking; F-03 reviewer queue/claim; F-04 assigned reviewer approve/reject and persisted transition history; F-05 persistent storage/setup. FR-01 through FR-12 and their Sprint 1 contract ACs apply. This handoff is a proposed executable mapping, not a new relaxation of the agreed contract.

History storage is Sprint 1. A user-facing history timeline (F-06/FR-13) is Sprint 2, so do not fail Sprint 1 because that future screen is absent. Return/resubmission, search/filtering, second-stage approval and summaries are outside this acceptance.

## Safe accounts and setup

`requester1`, `requester2`: Requesters. `reviewer1`, `reviewer2`: Reviewers. Product Team provides the synthetic passwords via the private course handoff; no secret values belong here or in the final PDF. Confirm private delivery before execution. Separate browser profiles/private windows per actor avoid confusing sessions. Both partner students must participate and record their own identities.

Use unique title prefix `UAT6-<partner>-<case>-<timestamp>`. All amounts are synthetic THB, not actual transactions. Do not alter the pre-existing Lab 5 persistence record #6, final-check record #7 or other testers' records. Each case creates its own records except declared references. Record URLs/IDs immediately. If a prerequisite fails, mark dependent checks BLOCKED; never pass by inference.

## Reset and cleanup

Use a new unique title for each rerun. Logout after each role/session. There is deliberately no Sprint 1 edit/delete operation: do not assume a reset button exists. Retain UAT records and screenshots through grading. Product Team may later perform a scoped database cleanup of ONLY agreed UAT record IDs and dependent history in a transaction, after evidence retention and partner agreement. Never reset/reseed the shared production database during UAT. No production cleanup is authorized by this handoff.

## Execution and evidence

Read [cases](uat-cases.md); record actual observations in execution.csv (both students), not copied expected wording. Capture readable normal and denied operations, URL/ID/state, action, timestamp, tested SHA/revision and before/after protected state. UI actions are primary UAT; API observations and automated tests only support it. For API-support steps, the partner can use browser DevTools on their OWN app session; no tokens/cookies should appear in shared captures.

Case 07 requires an announced Product Team restart window on the SAME database. No restart is scheduled or performed by this draft. Capture state before/after; record BLOCKED if unavailable. Persisted internal history may be verified using a Product Team-provided sanitized database extract correlated with the partner's UI actions; do not claim a nonexistent timeline UI.

Agree partner contact, initial session, deployment freeze, defect reporting destination and retest session before handoff. Never deploy changes affecting their tests without notifying them. Use findings.md and acceptance.md; only the independent UAT Team can record acceptance.

## Follow-up prepared 23 November

See [received results](received-results.md) and [exact partner rerun](partner-retest.md). Fixture #13 was created as a fresh Pending request solely for the issue #60 rerun. Developer checks returned expected 403 and unchanged business data; independent retest remains pending.
