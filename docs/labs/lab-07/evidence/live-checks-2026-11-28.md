# Lab 7 authenticated live checks - 2026-11-28

## Release identity and health

- App: https://approvals-389973748230.asia-southeast1.run.app
- Release: Cloud Run revision `approvals-r45996592434-1`, commit `ee4652bb05baf5f1b61526de66ce17379ac90dac`.
- Deployment: [Actions run #14](https://github.com/Lathapol/sprint-group-work/actions/runs/45996592434), successful; the app `/api/version` returned `ee4652bb05baf5f1b61526de66ce17379ac90dac` and `/api/health` returned `ok` before the live checks.
- Timestamp convention: the app displayed UTC. This record preserves those exact timestamps.
- Operator/recording: Codex-assisted browser session. Synthetic test accounts `requester1` (REQUESTER) and `reviewer1` (REVIEWER) were used. The user coordinated the account sessions. This is tool-assisted live validation, not a claim that a student independently performed it.
- No resets, reseeds, or deletions were performed. Existing requests #1-#21 were not opened or modified during these checks. The app list showed the synthetic records #22 and #23 alongside the existing records.

## Owner withdrawal - request #22

URL: https://approvals-389973748230.asia-southeast1.run.app/requests/22

| Field | Before | Expected | Actual |
|---|---|---|---|
| Tester/account role | `requester1` / REQUESTER | Owner may withdraw own unclaimed Pending request | Withdrawal recorded by `requester1 (REQUESTER)` |
| State | Pending | Withdrawn | Withdrawn |
| Category | Purchase | Retained | PURCHASE |
| Amount | THB 149.75 | Retained | THB 149.75 |
| Justification | Synthetic Lab 7 owner withdrawal and history retention check. | Retained | Retained exactly |
| Reviewer | Unassigned | Retained | Unassigned |
| History | One Created -> Pending event at 2026-11-28 05:43:07 UTC | Keep prior event and add exactly one withdrawal event | Created -> Pending (05:43:07 UTC); Pending -> Withdrawn by requester1 (05:44:15 UTC), reason `Requester withdrew the request.` |
| Repeat withdrawal | Already Withdrawn | Must not create another withdrawal event | No withdrawal action was available on the Withdrawn detail page; history remained exactly two events. No repeat mutation was sent. |

## Normal submit -> claim -> decision - request #23

URL: https://approvals-389973748230.asia-southeast1.run.app/requests/23

| Timestamp (UTC) | Tester/account role | Expected | Actual |
|---|---|---|---|
| 2026-11-28 05:47:00 | `requester1` / REQUESTER | Submit synthetic request; initial state Pending | Created `Lab7 shared normal workflow live 2026-11-28`, Travel, THB 275, justification `Synthetic Lab 7 normal submit, claim, and decision journey.` Status Pending; reviewer unassigned; Created -> Pending event added. |
| 2026-11-28 05:50:28 | `reviewer1` / REVIEWER | Claim pending request | Status In review; reviewer `reviewer1`; Pending -> In review event added. |
| 2026-11-28 05:50:33 | `reviewer1` / REVIEWER | Make a normal decision | Status Approved; In review -> Approved event added. |

The final history contains exactly the three expected events, in order: Created -> Pending, Pending -> In review, In review -> Approved.

## Scope and limits

- These browser observations were against the release commit/revision listed above. The request details/history pages are the retained browser evidence; screenshots are not saved as repository evidence.
- A before/after export of every pre-existing record was not captured. The checks did not mutate records #1-#21, but this is not a complete database-wide equality proof.
- Both students still need to review the contribution table and confirm or edit the retrospective answers. Keep the submission PDF marked as a review draft until their review and the remaining evidence are complete.

## Additional authenticated checks - 2026-11-28

These observations were added after the checks above, using the same deployed app. Timestamps below are the UTC timestamps displayed in the app.

### Claimed-request withdrawal and cross-requester visibility - request #24

- Test account `requester1` created the synthetic request `Lab 7 claimed-withdrawal denial UAT - 2026-11-28` at `2026-11-28 07:35:01 UTC` (Purchase, THB 1; no real purchase).
- Test account `reviewer1` claimed it at `2026-11-28 07:58:53 UTC`. The detail page showed `In review`, assigned reviewer `reviewer1`, and a Pending -> In review history event.
- After switching back to the owner `requester1`, the request remained `In review` and the page exposed no withdrawal action. The history remained the two expected events (Created -> Pending; Pending -> In review). No withdrawal request was sent, so this verifies the UI restriction, not the backend rejection response.
- Signed in as `requester2` and opened `/requests/24`; the app displayed `Request not found`. This verifies cross-requester detail visibility denial for this synthetic record. It does not test the reviewer-role denial or direct API behavior.

### Existing withdrawn record inspection - request #21

- Signed in as owner `requester1` and inspected `/requests/21`: the page showed `Withdrawn`, Purchase, THB 25, reviewer `Unassigned`.
- History showed exactly two events: Created -> Pending by requester1 at `2026-11-27 13:26:14 UTC`, then Pending -> Withdrawn by requester1 at `2026-11-27 13:26:22 UTC`, with reason `Requester withdrew the request.`
- This is a targeted inspection of request #21 only. It is not a before/after comparison or proof that all historical records are unchanged.

### Evidence limits and remaining work

- The browser views were observed live, but no screenshot files were saved or attached to this repository during these checks.
- At the time of this initial addendum, no direct POST to the withdrawal endpoint had been made for request #24. The later deployed-API recheck below records the denial responses on the current revision.
- Reviewer-role denial API behavior, broad historical-data comparison, teammate review/sign-offs, and final PDF approval remain outstanding. This evidence addendum does not make the draft ready to submit.

### Reviewer view of claimed request #24

- Signed in as `reviewer1` (`REVIEWER`) and opened `/requests/24` on 2026-11-28. The app showed status `In review`, reviewer `reviewer1`, and the two expected history events.
- The reviewer page exposed `Approve`, `Reject`, and `Return request` controls and no withdrawal control. This records the visible UI; it is not a direct API-role-denial test and no withdrawal POST was sent.

## Automated withdrawal API and preservation evidence

The deployed browser checks above did not send direct withdrawal API requests. The isolated integration tests do exercise those API responses and verify that denied attempts do not mutate the synthetic test records:

- `test/withdrawals.test.cjs`, `TEST-12-02/03`: reviewer withdrawal -> HTTP 403; another requester -> HTTP 404; owner withdrawal after reviewer claim -> HTTP 409. The test checks the request remains `IN_REVIEW` and the history count is unchanged.
- `test/withdrawals.test.cjs`, `TEST-12-01`: successful owner withdrawal returns HTTP 200, retains the original fields, writes exactly one history event, and a repeat withdrawal returns HTTP 409.
- CI run [#46125181878](https://github.com/Lathapol/sprint-group-work/actions/runs/46125181878) passed on commit `56d4b653168b8bd4bd45620c521a3bbcf3c14914`; its job ran `npm test`, Playwright end-to-end tests, and the Docker build.

These are automated isolated-database results, not direct API responses from the deployed database. The current-revision deployed API responses are recorded below. A rollout-wide historical comparison, screenshot files, and student sign-offs remain outstanding.

## Post-documentation-deployment read-only rechecks

After PR #110 merged, Actions run [#46129131935](https://github.com/Lathapol/sprint-group-work/actions/runs/46129131935) deployed documentation-only commit `1a514748d930a90a864f180696bea284fc64c289` as revision `approvals-r46129131935-1` with 100% traffic. Deployment smoke passed; `/api/health` returned `ok` and `/api/version` returned the same commit. App UI rechecks used `requester1`; no mutations were performed:

- Request #22 remained Withdrawn (Purchase, THB 149.75, reviewer Unassigned); history still contained exactly Created -> Pending at 05:43:07 UTC and Pending -> Withdrawn at 05:44:15 UTC.
- Request #23 remained Approved (Travel, THB 275, reviewer1); history still contained exactly Created -> Pending at 05:47:00 UTC, Pending -> In review at 05:50:28 UTC, and In review -> Approved at 05:50:33 UTC.
- Request #24 remained In review, assigned to reviewer1, with the same two history events and no withdrawal control.

These are targeted reloads, not a production-wide before/after-rollout comparison. A saved screenshot set and both students' review/sign-offs remain outstanding. Issue [#97](https://github.com/Lathapol/sprint-group-work/issues/97) remains open.

## Current-revision deployed API denial and no-mutation check

On 2026-11-28 at 09:30:43 UTC, authenticated API requests were sent to the deployed app at `https://approvals-389973748230.asia-southeast1.run.app`, revision `approvals-r46129131935-1`, commit `1a514748d930a90a864f180696bea284fc64c289`. The precondition GET confirmed request #24 was still `IN_REVIEW`, owned by `requester1`, and assigned to `reviewer1`. No state-changing operation succeeded.

| Account/role and attempted action | Expected | Actual |
|---|---:|---:|
| Owner `requester1` attempts withdrawal after reviewer claim | HTTP 409 | HTTP 409 `INVALID_TRANSITION` |
| Other requester `requester2` attempts to withdraw #24 | HTTP 404 | HTTP 404 `NOT_FOUND` |
| Reviewer `reviewer1` attempts to withdraw #24 | HTTP 403 | HTTP 403 `FORBIDDEN` |

Before and after the three denied calls, the reviewer-visible request/history snapshot contained 24 requests, with state counts: IN_REVIEW 3, APPROVED 8, WITHDRAWN 2, REJECTED 6, PENDING 5. The script serialized each full reviewer-visible request row in the API's ID-descending order together with its history rows in API order, encoded the JSON as UTF-8, and computed SHA-256. The hash was identical (`42b2d4bc4a72b8b6085017df8554f666b8c955e1580f7794037ba5355c1fc1ea`). A final GET still showed #24 `IN_REVIEW` assigned to `reviewer1`. The sanitized machine-readable record is `deployed-api-denials-2026-11-28.json`.

This demonstrates that these three denied API attempts did not change the currently visible request/history dataset. A separate targeted comparison across revisions #14 and #15 is recorded for synthetic requests #22, #23, and #24 above: their fields, state, assignment, and expected history remained unchanged after deployment. This is controlled selected-record evidence, not a full database-wide equality proof. No complete pre-rollout export was found in retained files; the current Cloud SQL backup list is empty and automatic backups are disabled at the time of this check. No screenshot files are attached; timestamped UI observations and direct API results are transcribed here and summarized in the PDF. Lathapol reported that both students approved the contribution table and retrospective as written on 2026-11-28.

## Rollback compatibility addendum - 2026-11-28

The isolated rollback rehearsal is recorded in `rollback-data-equivalence-2026-11-28.md`. The unmodified pre-withdrawal image (commit `0334c966c396912dfaf2e309e044753f11d4e47c`) logged in but its request list returned HTTP 500 when a WITHDRAWN row existed. A rebuilt enum-compatible image with only the Prisma `RequestState` enum extended was published as `asia-southeast1-docker.pkg.dev/vertical-set-514506-g8/approvals/app:rollback-0334c966c396912dfaf2e309e044753f11d4e47c` at digest `sha256:a01e2edf25c473a1082da316725683128dc91c8635cdb004516945e4b7cfb44a`; pulling that exact digest and testing it against a fresh disposable database returned HTTP 200 for login/list/detail and read the row as WITHDRAWN. Before/after fingerprints of all synthetic `Request` and `RequestHistory` rows were identical: `53F8209CC4A674F322E6AB332C75D01136DC5C37652C2BCD00FC96F48ED9B5CA`. The image labels `com.lathapol.rollback-compatible=true` and the source commit were verified from the pulled image. This validates a compatible rollback image approach in an isolated database. The image is published. Deployment selection/guard changes are prepared locally and pass 5 targeted tests but remain subject to review/merge; no Cloud Run rollback revision was created, so operational rollback readiness remains pending. One rollback-compatible image was added to Artifact Registry. No production Cloud Run service/traffic or database was changed.
