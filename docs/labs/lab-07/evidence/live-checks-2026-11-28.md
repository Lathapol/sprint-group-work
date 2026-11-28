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

- These browser observations were against the release commit/revision listed above. The request details/history pages are the retained browser evidence; no screenshot file was saved during the session.
- The colleague separately reported completing Reviewer/other-Requester denial and claimed-request checks. This record does not have that tester's request IDs, timestamps, or attached evidence, so it does not count those cases as independently verified here.
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
- No direct POST to the withdrawal endpoint was made for request #24; the expected backend denial response is therefore not recorded.
- Reviewer-role denial, broad historical-data comparison, teammate review/sign-offs, and final PDF approval remain outstanding. This evidence addendum does not make the draft ready to submit.

### Reviewer view of claimed request #24

- Signed in as `reviewer1` (`REVIEWER`) and opened `/requests/24` on 2026-11-28. The app showed status `In review`, reviewer `reviewer1`, and the two expected history events.
- The reviewer page exposed `Approve`, `Reject`, and `Return request` controls and no withdrawal control. This records the visible UI; it is not a direct API-role-denial test and no withdrawal POST was sent.

## Automated withdrawal API and preservation evidence

The deployed browser checks above did not send direct withdrawal API requests. The isolated integration tests do exercise those API responses and verify that denied attempts do not mutate the synthetic test records:

- `test/withdrawals.test.cjs`, `TEST-12-02/03`: reviewer withdrawal -> HTTP 403; another requester -> HTTP 404; owner withdrawal after reviewer claim -> HTTP 409. The test checks the request remains `IN_REVIEW` and the history count is unchanged.
- `test/withdrawals.test.cjs`, `TEST-12-01`: successful owner withdrawal returns HTTP 200, retains the original fields, writes exactly one history event, and a repeat withdrawal returns HTTP 409.
- CI run [#46125181878](https://github.com/Lathapol/sprint-group-work/actions/runs/46125181878) passed on commit `56d4b653168b8bd4bd45620c521a3bbcf3c14914`; its job ran `npm test`, Playwright end-to-end tests, and the Docker build.

These are automated isolated-database results, not direct API responses from the deployed database. The broad production before/after comparison, screenshot files, and student sign-offs remain outstanding.
