# F-10 deployed release verification — 25 November 2026

The real Reviewer summary is deployed on the preserved Sprint 2 baseline. This is actual Sprint 3 working progress for Deliverable 2, not a claim that all Sprint 3 work, independent UAT or the assessed PDF is finished.

## Immutable source and deployment

| Item | Actual value |
|---|---|
| Main source | `0877808fb5a8084e040974cb56b16648b274bb04` |
| Identifying annotated tag | [`f10-2026-11-25`](https://github.com/Lathapol/sprint-group-work/tree/f10-2026-11-25) |
| Review chain | Contract #77 -> feature #85 -> release #86, both feature/release approved and merged |
| Deployment run | [45637901908](https://github.com/Lathapol/sprint-group-work/actions/runs/45637901908), success |
| Cloud Run | `vertical-set-514506-g8` / `asia-southeast1` / `approvals` |
| Ready revision | `approvals-r45637901908-1`, Ready, 100% traffic |
| Tested URL | https://approvals-389973748230.asia-southeast1.run.app |
| Canonical service URL | https://approvals-ia5ybuqdoq-as.a.run.app |
| Requested image manifest list | `sha256:7f70f868ccbd6c6788fd64f68db33840a809b3ed86b572211d011de10bc8abab` |
| Resolved revision image manifest | `sha256:dbe993bedb54b17804aa031b0d8a1206cd765f272e925c64ea80deb1a1e3165f` |
| Idempotent migration execution | `approvals-migrate-gz4xd`, completed successfully at `2026-11-25T14:52:20.904708Z` |

`service-release.json`, `revision.json`, `deployment-run.json` and `migration-execution.json` are selected real metadata. Docker log excerpts distinguish the exported image manifest from the manifest list; both digests are retained rather than confused. `/api/version` and revision commit label match this exact main source. Public UI/database/version smoke passed in the workflow and in a separate post-release script execution.

Main quality evidence: **27 Node/API/regression tests passed, 0 failures; all 5 browser tests passed; Docker build passed**. `verification-excerpts.log` retains actual main-run final-actor, access and concurrent-snapshot assertions plus counts. Detailed genuine RED/GREEN remains in [F10 evidence](../F10/README.md). F-10 introduces no schema migration/config/dependency; the existing pipeline's migration step completed before image rollout. The immutable `sprint-2-2026-11-25` tag remains at its original f9a0d2f source.

## Real saved-data continuity

Before release, the old Sprint 2 source f9a0d2f returned 404 for the authenticated Reviewer's new summary endpoint. At `2026-11-25T14:38:19.084Z`, the known retained synthetic requests **#13, #16, #17 and their entire public history arrays** were read and stored in `predeploy.json`. Their history lengths were 1, 3 and 6.

After deployment, fresh authenticated reads compared every request field, nested public actor and history entry to that saved baseline, twice: before and after the new synthetic verification journey. They remained identical. Combined resource/history SHA-256:

`f0bb336f5917a929acbe6d0f48659ee9d3b885c4691bb6bf574b28743c1c17c2`

This proves these controlled saved records/history survived the actual deployed revision. It does not claim a whole-database backup/comparison or that an in-process reload was a container restart. No reset, reseed, existing-record modification or request deletion was performed.

## Independent live API reconciliation — 61 recorded calls, PASS

`live-check.cjs` was executed against the live source above, using existing synthetic accounts. It independently derives expected metrics from authorized `GET /api/requests` and per-terminal-request history resources in JavaScript, without calling the report SQL or aggregation helpers. It selects the latest matching state-changing terminal event using the contract's time/id rule and public actor role. A second full list read must match the first fingerprint before accepting each reconciliation; otherwise that read attempt is retried, up to three attempts. This avoids claiming an inconsistent multi-request oracle as one atomic DB snapshot.

Three stable comparisons passed:

| Actual phase | Total | Current terminal result |
|---|---:|---|
| Before new synthetic request | 17 | Reviewer1 Approved5 / Rejected5 / Total10; unattributed0 |
| New request #18 saved as Pending | 18 | No new terminal decision yet; counts reconcile |
| After reviewer1 claim + approval | 18 | Reviewer1 Approved6 / Rejected5 / Total11; unattributed0 |

Final state buckets: Pending5, InReview2, Returned0, Approved6, Rejected5. Category buckets: Funding1, Purchase10, Travel6, Reimbursement1. Both sum to 18. The 11 attributed decisions reconcile with current Approved+Rejected. These are actual observation-time values, not promised permanent totals.

The new retained synthetic fixture is #18, `F10 live summary 2026-11-25T14:52:51.948Z`, requester1 / reviewer1, Travel, THB18.75, final Approved. Its purpose is count verification; no actual purchase/payment occurred. The total increased by one and the final Reviewer's approved count increased by exactly one. A fresh Reviewer login retrieved the same summary and its owner retrieved the saved Approved request.

Actual role/input checks passed: anonymous summary 401; requester1 403; requester2 with forged `role=REVIEWER` 403; Reviewer unsupported `reviewerId` query 400. Output keys and public Reviewer fields are checked. There is no report mutation endpoint or amount-sum metric. The persisted independent result, real API summaries, known synthetic final request and **61 HTTP method/path/actor/status observations** are in `live-api-verification.json`.

Privacy: the verifier reads shared request/history resources only within the existing Reviewer authorization. It persists aggregate expectations/fingerprints and status metadata, not the full shared list/history payloads. No password, session, cookie, credential hash or database URL is in the evidence. All test sessions ended with logout. No real user is attributed with executing an AI-run check.

## Deployed UI verification — PASS

Five actual in-app-browser captures have complete accessibility text, screenshots and times in `browser-observations.json`:

1. `ui-01-live-summary`: Reviewer screen shows the real total/state/category/final-Reviewer buckets. `ui-comparison.json` records exact DOM cell comparisons with the independently verified API result; every bucket and Reviewer row matches.
2. `ui-02-after-reload`: full reload still shows total18, all bucket values, Reviewer1 6/5/11 and unattributed0. This full-page screenshot was visually inspected and is readable.
3. `ui-03-after-refresh`: Refresh summary retains the correct saved result.
4. `ui-04-requester-no-summary-link`: requester1 has no Decision summary navigation.
5. `ui-05-requester-route-unavailable`: direct Requester `/summary` shows Page unavailable, without metric data. This frontend observation is separate from the real backend 403 checks above; it is not falsely called an HTTP403 page.

Some full-page captures fell back to viewport capture; each observation records the actual mode. Complete text and the full reload capture preserve the whole report. This turn performed the state-changing decision via API and read/compared its real UI; the earlier main CI/local browser suite independently executed a real UI approval and summary delta. No second-monitor/desktop capture was used. Browser ended signed out and its task-created temporary credential file was removed.

## Reproduction and remaining acceptance

The executed verifier and predeploy scripts are retained. They originally ran in a private task directory and wrote its `sprint3-release-evidence` subdirectory. Credentials are provided only via `SEED_PASSWORD`. Do not rerun the baseline script over historical evidence; a deliberate future live verifier rerun creates another synthetic request and must retain separate observations. These scripts are not automatic CI tests. Syntax checks passed; main quality/live results are preserved rather than invented for this documentation change.

Technical implementation, integration, deployment and live verification are complete. Team review of this evidence remains the final issue #73 acknowledgement. Most recorded approval comments are brief; detailed review reasoning, independent two-student UAT or course acceptance is not manufactured by this report. F-09 second approval and F-11 hardening remain planned. Complete current SRS/inventory/System SDS/actual-result matrix (#74), final assessed PDF (#76), and remaining Lab 6/Lab 7/final-product requirements are still outstanding.
