# F-08 actual filtering and search evidence

Issue #71. Design baseline: reviewed contracts PR #77, `docs/sprints/sprint-2/contracts.md`. Branch starts from staging `64715ae` after F-06 #78, F-07 #79 and Lab 6 report #80 merged. Only the dedicated local PostgreSQL18 `approvals_history_test` database was used; no cloud database or service was modified.

## Executed results

| Phase | Source | Command / actual outcome |
|---|---|---|
| API RED | d81325e | `node --test test/filters.test.cjs`: 5 counted tests, 1 pass / 4 fail including failing parent; new state/date/text/ownership filter assertions returned wrong sets. Existing read-only persistence assertion passed. |
| UI RED | d81325e | `playwright test test/browser/filters.spec.ts --reporter=line --timeout=15000`: 1 failed waiting for missing Search title or justification control after valid login. |
| First implementation regression | 519c492 | `npm test`: 20 pass / 2 fail, including parent; final calendar-day query generated unsupported year +010000 in Prisma. Retained in first-regression log/JSON. |
| First browser regression | 519c492 | 3 pass / 1 fail: original workflow's partial Title locator filled the old list search field during navigation; new F-08 scenario passed. first-ui log/JSON retained. |
| Isolated workflow investigation | 519c492 | Original workflow alone passed once, confirming timing sensitivity rather than clean full-suite evidence. workflow-recheck log/JSON retained. |
| API/regression GREEN | f93e156 | `npm test`: build succeeded, 22 tests passed, 0 failed/cancelled/skipped/todo. Includes all existing auth/domain/release/history/return tests plus F-08. |
| Second browser investigation | f93e156 | 3 pass / 1 fail again on the original partial Title locator; second-ui log/JSON retained. No acceptance claimed from these attempts. |
| Full UI/regression GREEN | 07a9720 | `playwright test --reporter=line`: 4 tests passed using 4 workers, no failures/skips. Exact form locator and route heading wait fix test ambiguity without removing the input-retention assertion. No production code changed after API GREEN. |

Each adjacent JSON records the exact tested full SHA, UTC time, command and exit code. The commands above abbreviate the `node node_modules/@playwright/test/cli.js` launcher used locally. Logs retain actual stdout/stderr, including non-failing Vite directive, Prisma configuration and color warnings. No result was inferred from compilation alone.

## AC and real coverage

- **AC-08-01 / TEST-08-01** (`test/filters.test.cjs`): every state/category; case-insensitive trimmed title or justification; empty text; literal percent, underscore and backslash; exact descending IDs. All 32 subsets of state/category/from/to/text are asserted for both owning Requester and reviewer Mine (64 exact set checks). Explicit combined and no-match queries supplement the matrix.
- **AC-08-02 / TEST-08-02** (same API test): start midnight inclusive, last millisecond inclusive, next-day midnight excluded; either date bound, same-day, leap day, first/last four-digit calendar dates with persisted boundary fixtures. Invalid calendars/range/date-time input/empty date, invalid state/category, duplicate scalar parameters, nested values, malformed mine and >200 Unicode code points produce 400 field errors; 200 emoji code points remain valid.
- **AC-08-03 / TEST-08-03**: anonymous 401; unique other-owner text remains invisible; owner/mine/role/id query forgery rejected; Queue state and Mine reviewer predicates AND with filters. Unrelated reviewer Mine remains its own assigned set. Public user projections omit password hashes.
- **AC-08-04**: repeated/fresh-app reads return identical saved matching data with unchanged full request snapshots and no new audit events. This is an in-process fresh app on the same DB, not an OS/container restart or deployment claim.
- **TEST-08-04 UI** (`test/browser/filters.spec.ts`): Requester cannot see other owner's fixture; category/state/date/text submission, no-match, reversed-date input retention, Clear, reviewer All/Queue/Mine and narrowed scopes; Queue state control fixed to Pending; Clear retains active scope; synthetic failed read retains inputs and identical-query retry succeeds. A filtered Pending detail still supports Claim. Existing return/reject/history tests provide cross-feature regression.

`filtered-mine.png` is a real full-page local Playwright screenshot, visually inspected: same-day UTC / Purchase / text filters show only the assigned Returned fixture within Mine. All fixture cleanup is restricted to test-specific UUID names/users. No shared live UAT data was reset or deleted.

## Implementation and edge representation

`src/request-filters.ts` validates supported scalar parameters before querying. Requester ownership and reviewer Mine are separate mandatory AND predicates; neither comes from caller-supplied owner IDs. Prisma parameterizes conditions. Escaping `\`, `%` and `_` before its PostgreSQL contains operator preserves literal text semantics, without SQL interpolation.

Normal upper-day bounds use `< next UTC midnight`. At `to=9999-12-31`, the client cannot encode +010000; the equivalent `<=9999-12-31T23:59:59.999Z` representation is used because the persisted column is TIMESTAMP(3). Boundary fixtures verify first and last supported calendar days. There is no schema change, migration or new index; no unmeasured performance improvement is claimed.

UI Apply sends the current draft; Clear resets values inside the current tab. Queue fixes state to Pending so user controls cannot overwrite its scope. Changing reviewer tab clears the optional state selection and preserves the other filters; Mine always adds the current reviewer's scope. Explicit refresh identity allows retrying an unchanged query and aborts obsolete reads. Field errors, empty/loading results and retained inputs are observable.

## Remaining acceptance

Implementation and local verification are complete. CI/Docker, substantive teammate PR review, integration into an identifiable Sprint 2 main release, live continuity/new-workflow verification and acceptance remain pending. This evidence does not close #71 or imply Sprint 2 is already deployed.
