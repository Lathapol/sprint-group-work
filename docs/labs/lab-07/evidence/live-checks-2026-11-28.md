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
