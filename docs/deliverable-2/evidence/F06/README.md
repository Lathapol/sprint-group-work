# F-06 actual RED and GREEN evidence

Issue #69. Contract approved in PR #77 before feature work; integration baseline 90285f8 (full commit available in Git). No production mutation, application deployment or independent UAT is claimed by this feature PR. Tests use a dedicated local PostgreSQL 18 container/database.

| Phase | Tested source | Actual command | Actual outcome |
|---|---|---|---|
| API RED | 15f2434 (full in red.json) | node --test test/history.test.cjs | 4 counted tests (parent + 3 subtests), 0 passed, 4 failed, 0 skipped. Owner history expected200 but missing endpoint404; safe JSON error assertion absent as expected. |
| UI RED | 15f2434 (full in ui-red.json) | node node_modules/@playwright/test/cli.js test test/browser/history.spec.ts --reporter=line | 1 failed: Request history region/error state absent, not a syntax or fixture failure. |
| API GREEN + existing regression | 0505773 (full in green-regression.json) | npm test | Build passed; 11 tests passed, 0 failed/cancelled/skipped/todo. Same history assertions now pass; auth, requests/concurrency and release tests pass. |
| UI GREEN + original journey | 972a578 (full in ui-green.json) | node node_modules/@playwright/test/cli.js test --reporter=line | 2 passed, 0 failed/skipped. History error/retry, ordered rows, literal HTML-like reason, UTC display and empty state; old submit/claim/reject UI journey also verifies timeline refresh after actions. |

The two first commits preserve tests before implementation. 0505773 adds the endpoint/timeline; 972a578 retains UI screenshot and adds action-refresh assertions. API and UI commands refer to their actual tested commits; later evidence-only commits do not change production code. Logs are unedited actual selected command output; environment variables contain only local test setup and are deliberately not printed as connection strings.

## Acceptance mapping

- AC-06-01 -> TEST-06-01: persisted create/claim/reject, owner and unrelated Reviewer reads, safe actor fields, equal timestamps ordered by ID, exact reasons.
- AC-06-02 -> TEST-06-02: anonymous401, cross-owner404 shaped error/no private data, invalid/missing IDs, no exposed POST/PATCH/PUT/DELETE history mutation, persisted row comparison.
- AC-06-03 -> TEST-06-03 + original journey: real UI History; controlled503 followed by Retry; chronological states; literal img-like rejection text/no image element; empty legacy fixture; timeline refresh after review actions. Implementation also renders Loading history while the read is pending.
- AC-06-04 -> TEST-06-04: second application instance on the SAME isolated database returns identical rows and reads do not append duplicates. This is not a claimed operating-system/container restart; later integrated release evidence must supply any required full restart check.

history-ui.png is captured by the browser test from the real running local application, before removal of its synthetic legacy-empty fixture history. No passwords or session tokens are in the screenshot. It is local developer verification, not the deployed main app or independent partner acceptance.

## Reproduction

Use the dedicated migrated test DB described in README and set DATABASE_URL and TEST_DATABASE_URL to that isolated database (never production). For browser tests provide SEED_PASSWORD privately, run node prisma/seed.cjs, then the exact commands above. npm test builds the app; Playwright starts Express/Vite using playwright.config.ts. Version/timestamps and actual exit codes are in adjacent JSON files. Container port is a local dynamic mapping; discover with docker port rather than assuming a fixed port.

Warnings retained in actual logs: existing Vite/Rolldown React Router use-client directive warning and NO_COLOR/FORCE_COLOR warning did not fail checks. No skipped test is called a pass. Teammate review, CI/Docker check, integration and accepted release are pending at evidence capture.
