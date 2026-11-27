# CR-L7-01 maintenance evidence

Issue #96 tracks the withdrawal change specified in #94 and documented by the reviewed contract in #95. The implementation was merged to `sprint-1-staging` by PR #101 at merge commit `b2e43aa`. The evidence below distinguishes the checks that actually ran from the remaining Lab 7 evidence gaps.

## Contract and review chain

| Stage | Evidence |
|---|---|
| Contract | PR [#100](https://github.com/Lathapol/sprint-group-work/pull/100), based on issue #94 and linked to #95; docs-only contract and impact mapping. |
| Contract review | `Kittakorn-P` approved PR #100 on 2026-11-26 11:23:02 UTC (18:23:02 Asia/Bangkok). The submitted review says “Approve.” |
| Test-first change | Commit [`2361637`](https://github.com/Lathapol/sprint-group-work/commit/236163715d7b3979be7d2d1a2a2f99180ff0da95), `test: specify Lab 7 requester withdrawal contract`. |
| Implementation | Commit [`26ecd06`](https://github.com/Lathapol/sprint-group-work/commit/26ecd060debd1921a929ca12302b8f95f83a46cb), `feat: allow requesters to withdraw pending requests`. |
| Feature review | `Lathapol` approved PR #101 on 2026-11-26 14:49:19 UTC (21:49:19 Asia/Bangkok): “Looks good—CI passes, and withdrawal stays limited to unclaimed requests with history kept. Approved.” |
| Feature integration | PR [#101](https://github.com/Lathapol/sprint-group-work/pull/101) merged to `sprint-1-staging` as `b2e43aa`. |

## CI executions

PR CI run [#47](https://github.com/Lathapol/sprint-group-work/actions/runs/45840358544) checked synthetic merge commit `efbc2c14ac6897f8d288c41429962329ccdbb135` (PR head `26ecd060debd1921a929ca12302b8f95f83a46cb`) before the UI request fix. `npm test` passed, but browser test TEST-12-05 failed because the withdrawal UI sent a `reason` field that the API correctly rejects. This was a regression failure after implementation; it is **not** the required pre-change RED result.

The follow-up commit [`38e08dc`](https://github.com/Lathapol/sprint-group-work/commit/38e08dc54627f1079e48b17c1a6c048b5b4fe9ef), `fix: submit withdrawal without reason`, sends `{}` for withdrawal. PR CI run [#48](https://github.com/Lathapol/sprint-group-work/actions/runs/45842057791) checked synthetic merge commit `4413c050e1e8d24456467ded0eeb4aaa74001702` (PR head `38e08dc54627f1079e48b17c1a6c048b5b4fe9ef`) and completed successfully:

| CI step | Actual result |
|---|---|
| `npm ci` | passed |
| `npx prisma generate` | passed; Prisma Client 6.19.3 |
| `npx prisma migrate deploy` | passed against the CI PostgreSQL service |
| `npm test` | 32 passed, 0 failed, 0 cancelled, 0 skipped, 0 todo |
| `npx prisma db seed` | passed |
| `npm run test:e2e` | 6 passed (9.3s) |
| `docker build --tag approvals:ci .` | passed |

CI used Node.js 24.22.3 / npm 11.19.1 and PostgreSQL 18.7. The `npm test` run covered auth/session, health, F-04 ownership/concurrent claim/decision, F-06 history, F-07 return/edit/resubmit, F-08 filters, F-10 summary, release workflow checks, and CR-L7-01 withdrawal. The withdrawal integration test reported TEST-12-01 through TEST-12-06 passing, covering eligible owner withdrawal, role/owner/body guards, the claim race, list filters, state counts, and decision totals. The browser suite exercised the confirmation flow and reviewer queue using synthetic seeded accounts; this is automated Playwright validation, not a manual human demonstration.

## Test-first RED evidence

The pre-change RED result is recorded by workflow run [#1](https://github.com/Lathapol/sprint-group-work/actions/runs/45943255486), triggered on 2026-11-27 with `workflow_dispatch`. The workflow checked out the preserved test-only commit [`2361637`](https://github.com/Lathapol/sprint-group-work/commit/236163715d7b3979be7d2d1a2a2f99180ff0da95) against its pre-change source and migrations in an isolated CI PostgreSQL database. The run's `lab7-red-2361637` artifact contains the raw output and is available from the run page through 2027-02-25.

The workflow completed successfully because it verified and retained the expected failing test result. Within that workflow, `npm test` built successfully and exited 1: TAP reported 32 tests total, 27 passed, 5 failed, and 0 skipped. The failures were the withdrawal contract assertions against the pre-change source: TEST-12-01 got HTTP 404 instead of 200; TEST-12-02/03 got 404 instead of 403; TEST-12-04 observed race outcomes `[200, 404]` instead of `[200, 409]`; and TEST-12-05/06 got HTTP 400 instead of 200 because the old filter rejected `WITHDRAWN`. These failures demonstrate the missing withdrawal endpoint, guards, conflict behavior, and filter before implementation; they were not caused by setup or build failure.

## Follow-up coverage and PR #102 CI

Issue #96 explicitly calls for no-mutation checks in claimed, returned, and final states. The merged test directly checked the claimed state and repeated withdrawal of a WITHDRAWN request; it did not directly check RETURNED or APPROVED. PR [#102](https://github.com/Lathapol/sprint-group-work/pull/102) adds snapshots of returned/approved records and histories, attempts withdrawal, and asserts HTTP 409 with no changes.

PR CI run [#49](https://github.com/Lathapol/sprint-group-work/actions/runs/45849838613) checked head `6d679fa99e605bbfa7401eb0b56d37cd291f0fdb`. Migration and Prisma generation passed. TEST-12-01 through TEST-12-04 passed, including the new returned/final no-mutation assertions. TEST-12-05/06 failed because the approved-state fixture correctly contributed one reviewer decision while the assertion expected zero; the run counted 30 passing tests and 2 failures (the nested assertion and its parent). Later steps were skipped.

Commit [`5c6cb83`](https://github.com/Lathapol/sprint-group-work/commit/5c6cb83b46d8a691437051cc1da9262a85758ebd) corrects the expected reviewer decision count to one and explicitly expects zero unattributed decisions. PR CI run [#50](https://github.com/Lathapol/sprint-group-work/actions/runs/45851133784) passed on this commit: `npm test` 32 passed / 0 failed / 0 skipped; `npm run test:e2e` 6 passed; migration, Prisma generation, seed and Docker build all passed. The returned/final-state no-mutation checks passed in TEST-12-02/03. The CI evidence now reflects the latest result.
