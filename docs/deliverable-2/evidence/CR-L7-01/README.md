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

## Test-first evidence limitation

The test-only commit `2361637` precedes the implementation commit in PR #101 history, but no CI run exists for `2361637`. No captured local command/output currently proves the withdrawal assertion failing against the pre-change source at `ab21f35`. Run #47 is not a substitute: the implementation was already present, the API suite passed, and the failure was a UI request-body bug. Do not describe this as a recorded RED phase until the same assertion is executed against the baseline and its actual output is retained.

## Follow-up coverage prepared after CI

Issue #96 explicitly calls for no-mutation checks in claimed, returned, and final states. The merged test directly checked the claimed state and repeated withdrawal of a WITHDRAWN request; it did not directly check RETURNED or APPROVED. A follow-up assertion has been added locally to `test/withdrawals.test.cjs` to snapshot each returned/approved record and its history, attempt withdrawal, and assert HTTP 409 with no changes. This new assertion is not part of CI run #48 and must be run and reviewed in a follow-up test PR.

