# Macau678 retest report for Pai — 24 November 2026

Recipient: Pai / Macau678 Product Team. Related partner issue: [bravefe/Software-Engineer-2 #60](https://github.com/bravefe/Software-Engineer-2/issues/60). Our outgoing finding register is [Lathapol/sprint-group-work #64](https://github.com/Lathapol/sprint-group-work/issues/64); these are different repositories and issue numbers.

Execution: Codex AI-operated browser retest requested by Lathapol, 24 November 2026, approximately 23:47–23:55 Asia/Bangkok (UTC+07:00), including final read-only evidence recapture. Timestamped browser observations are retained. Human review/sign-off: pending. This does not claim that either student manually executed these steps or that both students have fulfilled Lab 6 participation requirements.

## Result and tested release

**F-01 PASS; F-02 PASS for the executed retest scenarios; F-03 PARTIALLY RESOLVED.** The supplied clarification matches the application, but the original published UAT guide still uses obsolete terms/references. Exact deployed SHA/revision evidence remains incomplete. This is a bounded retest report, not unconditional team/release acceptance or a complete rerun of every original case.

| Release item | Actual evidence |
|---|---|
| Tested URL | https://macau678-purchase-approval-gfn7poakkq-as.a.run.app/ |
| Displayed version | `Macau678 Purchase Approval System Version 0.2.2`, observed on the home page |
| Partner-declared source/image tag | `8f21c3252e72db1a17c9976701582fd21dc73cf5` |
| Source verification | This commit exists and its corrected SRS/defect-correction documents were read. The live application did not expose its source SHA; the declared tag was NOT independently bound to the running image. |
| Cloud Run revision | Not supplied and not exposed in the inspected home/health UI. Unverified; please supply deployment metadata. |
| Health | Public health displayed API ok; database connected before testing. |
| Execution method | In-app browser, UI forms and authenticated direct GET navigation to the documented request/history endpoints. No crafted mutation requests, database reset, deployment or production configuration changes. |

The expectations used were Pai's supplied `Retest Request - Lab 6, Issue #60` and the corrected SRS at the declared commit. The previous report is preserved at [macau-outgoing-report.md](macau-outgoing-report.md).

## Original cases covered

| Original case | Executed retest result | Scope |
|---|---|---|
| UAT-TC-03 | PASS for requested privacy/role checks | Owner draft #11; assigned and unassigned reviewer queues, direct detail and history denial; requester2 cross-owner denial; no requester Approve/Reject/Return controls. |
| UAT-TC-01 | PASS for direct-submit / approval / role-history checks | New #12 submitted directly, reviewed and approved; requester retains CREATED, SUBMITTED, APPROVED; reviewer sees SUBMITTED, APPROVED. |
| UAT-TC-04 | PASS for requested return / multiple edits / resubmission-history checks | New #13 returned, saved twice, then final field change saved and resubmitted; requester retains three EDITED records; reviewer sees one ordered summary without duplicate final note. |

These use fresh, clearly labelled synthetic records rather than resetting shared data. Monetary values match the original workflow amounts ($12,500 initially; $18,750 after revision). Unique titles, synthetic descriptions/justifications and quantity values were adapted for isolation: the TC04 retest changed quantity 1 to 2 rather than replaying the old fixture's 2 to 3. No separate Quantity validation is claimed. TC02 rejection and TC05 rejected-record immutability were not rerun in this targeted retest; their previous observations are not presented as fresh results.

## F-01 — Draft privacy — PASS

Fixture: #11 / PR-2026-00011, `UAT retest 2026-11-24 F01 private draft`; owning Requester Alice / requester1; assigned Reviewer Carol / reviewer1. Amount $10.00. Saved as Draft, never submitted.

Steps and actual results:

1. requester1 created and saved #11 as Draft. Owner detail showed title, amount, description, justification, assigned reviewer and CREATED with actor/timestamp. No Approve, Reject or Return controls appeared.
2. Assigned reviewer1 opened Review Queue: #11 absent. Direct `/requests/11` showed `Access denied: draft requests are visible only to their requester`; no private content appeared.
3. Assigned reviewer1 directly opened `/api/requests/11/history` and `/api/requests/11`: both displayed JSON `ACCESS_DENIED` without draft details/history.
4. Unassigned reviewer2 opened Review Queue: no assigned requests, #11 absent. Direct `/requests/11` showed access denied. Direct history and detail API URLs displayed `ACCESS_DENIED` without private data.
5. requester2 opened `/requests/11`: access denied and no private fields. The direct history URL also returned `ACCESS_DENIED`.
6. requester1 signed in again and opened the same draft's history endpoint: CREATED retained, requestId 11, actor Alice / REQUESTER, toStatus DRAFT. Owner pages for pending #12/#13 also exposed no reviewer decision actions.

Expected: only owning Requester can discover/open Draft. Actual: matches all executed assigned/unassigned reviewer, other-owner and owner checks. Numeric HTTP status codes were not captured by this UI/direct-navigation method; no specific 403/404 assertion is made.

Evidence: `01-draft-owner`, `02-assigned-reviewer-queue`, `03-assigned-reviewer-detail-denied`, `04-assigned-reviewer-history-denied`, `05-unassigned-reviewer-queue`, `06-unassigned-reviewer-detail-denied`, `07-unassigned-reviewer-history-denied`, `08-other-requester-detail-denied`, `09-other-requester-history-denied`, `10-owner-draft-history`, `13-tc04-owner-pending`, `14-assigned-reviewer-api-detail-denied`, `26-unassigned-reviewer-api-detail-denied`.

## F-02 — History visibility and revision notes — PASS

### UAT-TC-01 direct submission and approval

Fixture #12 / PR-2026-00012, `UAT retest 2026-11-24 TC01 Office Chair`; requester1 -> reviewer1; $12,500.00.

1. requester1 used Submit for Review directly, without a draft save. Status: Pending Review. Requester timeline: CREATED then SUBMITTED, each with Alice and timestamp; SUBMITTED transition None -> Pending Review.
2. reviewer1 opened #12. Reviewer timeline contained SUBMITTED, None -> Pending Review, and omitted CREATED.
3. reviewer1 approved the synthetic request. Reviewer timeline then contained SUBMITTED and APPROVED, with reviewer/timestamp and the approval note.
4. requester1 signed in again and reopened #12: Approved, $12,500.00; full timeline CREATED -> SUBMITTED -> APPROVED retained with actors and timestamps.

Evidence: `12-tc01-owner-submitted`, `15-tc01-reviewer-submitted`, `16-tc01-reviewer-approved`, `18-tc01-owner-approved`.

### UAT-TC-04 repeated edits and resubmission

Fixture #13 / PR-2026-00013, `UAT retest 2026-11-24 TC04 Office Chair`; requester1 -> reviewer1; initial $12,500.00.

1. requester1 directly submitted #13. reviewer1 returned it with `Retest TC04: revise quantity and estimate; preserve each edit note.` Empty reason initially left Confirm Return disabled.
2. requester1 opened Edit & Resubmit. Save A changed description quantity to 2, note `Retest edit A: quantity changed to 2.` Request stayed Returned; one EDITED entry showed Returned -> Returned, Alice and timestamp.
3. Save B changed amount to $18,750.00, note `Retest edit B: estimate changed to 18750.` A second distinct EDITED entry appeared; both notes retained in order.
4. Final change updated justification, note `Retest edit C: final specification confirmed.` Save & Resubmit completed. Request became Pending Review, $18,750.00, still assigned to Carol.
5. Requester UI and direct history response retained CREATED, SUBMITTED, RETURNED, EDITED A, EDITED B, EDITED C, RESUBMITTED. All EDITED entries had actor, timestamp, Returned -> Returned and their separate note.
6. reviewer1 signed in again. UI and direct history response contained only SUBMITTED, RETURNED, RESUBMITTED: CREATED and individual EDITED entries were absent. The RESUBMITTED reason was exactly:

   `Requester changes since return: Retest edit A: quantity changed to 2. | Retest edit B: estimate changed to 18750. | Retest edit C: final specification confirmed.`

The three notes appear in chronological order; note C occurs once in the combined reason. No final decision was made on #13, preserving Pending Review for partner inspection. This tests one return cycle; a second return-cycle aggregation boundary was not exercised.

Evidence: `13-tc04-owner-pending`, `17-tc04-reviewer-returned`, `19-tc04-owner-edit-A`, `20-tc04-owner-edit-B`, `21-tc04-owner-resubmitted`, `22-tc04-owner-history-json`, `23-tc04-reviewer-resubmitted`, `24-tc04-reviewer-history-json`.

## F-03 — UAT wording — PARTIALLY RESOLVED

**PASS for the supplied clarification against the live UI:** Request Title; Estimated Amount ($); Assign Reviewer; Description; Business Justification. Quantity is description text, with no separate Quantity field. The state badge is Pending Review; SUBMITTED is a timeline event. The mapping allowed the scenarios to execute without inventing a missing input. Screenshot `11-form-wording` records the form; case screenshots record the status label.

The corrected SRS at `8f21c3252e72db1a17c9976701582fd21dc73cf5` identifies FR-02 Request Submission, FR-03 Request Viewing, FR-04 Request Review, FR-05 Request Updates, FR-06 Request History and FR-07 Request Assignment. Its draft privacy and role-history rules match the tested expectations.

**Published original guide still needs correction or a replacement link:** `document/lab-6/UAT_TEST_CASES.md` on `docs/1-uat` still resolves to `c25c40c89df816e1ccab99dc6853d7afbf3c8bc1`, the original handoff. It still lists Item Name / Quantity / Estimated Cost, SUBMITTED as the status badge, FR-03 submission and other mismatched requirement mappings. The release commit's tree does not contain that UAT_TEST_CASES.md path. The correction document and supplied message explain the new wording, but do not demonstrate that the original published guide itself has been updated.

Please update that guide or provide the corrected guide's immutable commit/link. Until then F-03 remains partially resolved; do not mark the old guide corrected based only on the claim in the release note.

Sources read:

- [Original guide at its still-current docs/1-uat commit](https://github.com/bravefe/Software-Engineer-2/blob/c25c40c89df816e1ccab99dc6853d7afbf3c8bc1/document/lab-6/UAT_TEST_CASES.md)
- [Corrected SRS at declared release](https://github.com/bravefe/Software-Engineer-2/blob/8f21c3252e72db1a17c9976701582fd21dc73cf5/document/srs.md)
- [Product defect correction](https://github.com/bravefe/Software-Engineer-2/blob/8f21c3252e72db1a17c9976701582fd21dc73cf5/document/lab-6/defect_correction.md)

## Evidence, retained fixtures and follow-up

All 31 evidence items have matching `.txt` browser observations and `.jpg` screenshots under [evidence/macau-retest-2026-11-24](evidence/macau-retest-2026-11-24). `observations.json` records observation times. Items 01–26 retain the original observation responses, which may be incremental/no-change notices rather than full accessibility text. Some full-page captures of raw JSON or denial pages render narrowly; use the readable UI images (notably 21 and 23) and complete text recaptures 27–31 for the final owner/reviewer history and assigned-reviewer API denials. These capture limitations do not change the actual UI results recorded above. Requester/reviewer emails are synthetic supplied test identities. No passwords, sessions, cookies or authentication tokens are included.

New retained records: #11 Draft / $10; #12 Approved / $12,500; #13 Pending Review after resubmission / $18,750. All belong to requester1 and are assigned to reviewer1. Existing records were not intentionally modified. No reset, reseed or deletion was performed. Test sessions ended signed out.

Please provide:

1. The Cloud Run revision and deployment metadata binding the tested service to source/image tag `8f21c3252e72db1a17c9976701582fd21dc73cf5`.
2. The corrected original UAT guide or immutable replacement link for F-03.
3. Product Team acknowledgement/disposition of these separate retest results.

The executing AI retest is complete for the scope above. Human team review, both students' actual participation records and formal acceptance remain separate requirements. No report delivery to Pai is claimed until it is actually sent or confirmed by the user.
