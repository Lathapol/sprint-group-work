# F-07 actual return and resubmission evidence

Issue #70. Reviewed contract baseline: PR #77; dependent F-06 merged in PR #78 before this feature branch. Only a dedicated local PostgreSQL18 database was migrated/tested. No production deployment or independent UAT is claimed.

| Phase | Source | Actual command | Actual result |
|---|---|---|---|
| API RED | f1fac68 (full red.json) | node --test test/returns.test.cjs | 6 counted tests: 0 pass, 6 fail, no skips; new return endpoint404 instead of200, missing edit/resubmit endpoint404 instead of state conflict. |
| UI RED | 71a1008 (full ui-red.json) | node node_modules/@playwright/test/cli.js test test/browser/returns.spec.ts --reporter=line --timeout=15000 | 1 failed waiting for missing Return request button after successful setup/claim. Semantic missing UI, not broken fixture or syntax. |
| Build/API/regression GREEN | 66c5d54 (full green-regression.json) | npm test | Build succeeded, 17 tests passed, 0 failed/cancelled/skipped/todo; includes original auth/domain/concurrency/release and F-06. |
| UI GREEN/regression | 66c5d54 (full ui-green.json) | node node_modules/@playwright/test/cli.js test --reporter=line | 3 passed, none failed/skipped: original submit/claim/reject; safe history/retry; full return/edit/resubmit/approve/owner retrieval. |
| Additional state/backstop coverage | a86ea85 (full green-state-coverage.json) | node --test test/returns.test.cjs | 6 passed, 0 failed/skipped; adds explicit Pending/In Review/Approved/Rejected denial and direct database return-reason check. No production code changed after GREEN. |

Logs are actual output; adjacent JSON records exact tested commit/time/exit code. No connection string or password is printed as evidence. The backend/app instance check is not presented as an OS/container restart or deployment.

## AC / test mapping

- AC-07-01 -> TEST-07-01: assigned Reviewer return preserves reviewer, trimmed reason, null decidedAt and one history event. Empty/whitespace/non-string reasons, anonymous/wrong-role/unrelated return and duplicate return rejected without mutations. DB CHECK independently rejects Returned without reason.
- AC-07-02 -> TEST-07-02: owner-only partial edits, private other owner404, Reviewer403, anonymous401; protected fields/invalid values/array rejected; no effective edit updates neither timestamps nor history; effective edit records one same-state audit row.
- AC-07-03 -> TEST-07-03 and UI: edit/resubmit to SAME reviewer; In Review and Mine, not Pending Queue; old return reason preserved in history; final decision and fresh owner retrieval work. Resubmit cannot forge reviewer.
- AC-07-04 -> concurrent TEST-07-04: two resubmits yield200/409 with one event; edit/resubmit row lock permits only serial outcomes; no edit after submitted state. Unrelated reviewer cannot make final decision.
- AC-07-05 -> TEST-07-05, full existing suite and migration snapshot: Pending/In Review/Approved/Rejected deny edits/resubmit unchanged; old journeys and history pass; four existing synthetic requests and histories matched exactly across the two additive migrations. New app instance reads saved state/history; full release/restart verification remains for integration.

returned-cycle.png was captured from the real local browser test; it shows saved revised amount and complete history. Fixture cleanup touches only each test's unique local records. Existing seed records and production/UAT records remain separate.

## Migration and rollback limits

Two distinct migrations commit RETURNED enum addition before the CHECK uses that value. Existing reviewer_matches_state constraint already requires a reviewer for non-Pending states. New request_return_reason ensures a nonblank current reason on Returned. No table drop, row rewrite, reset or production reseed.

For deployment use the existing migration job before switching traffic; generate Prisma client from the new schema during build. A PostgreSQL enum addition is additive, not an automatically reversible DROP. After real Returned rows exist, do not roll back to a pre-F-07 binary whose generated enum/UI cannot read them; use a compatible F-07 image or reviewed roll-forward. This feature PR does not perform any cloud migration.

## UI clarification for teammate review

Return uses the existing inline decision-reason panel shared with Reject, rather than introducing a separate modal. Required reason, field feedback, input retention and pending-action protection satisfy the behavior AC; this presentation clarification is recorded explicitly rather than silently replacing contract history. Owner Save changes must complete before Resubmit; a409 retains unsaved inputs and offers an explicit refresh to the latest request.

Existing Vite directive and color-environment warnings remain non-failing. Full CI/Docker, substantive teammate review, integration and accepted main release/live evidence are still pending; this is implemented/tested, not yet accepted/deployed.
