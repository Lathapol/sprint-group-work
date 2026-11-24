# Macau678 UAT report for Pai

Date: 24 November 2026, Asia/Bangkok (UTC+07:00).
Recipient: Pai / Macau678 Product Team.
Execution: Codex AI-assisted user-facing browser checks requested by Lathapol. This report does not claim Lathapol and Kittakorn both manually executed or signed the cases. Human team review/participation remains required for Lab 6.

## Overall outcome

FOLLOW-UP REQUIRED. Approval, mandatory rejection/return reasons, return/edit/resubmit, cross-requester read denial and rejected-record edit protection worked in the observed UI. Three supplied-case expectations require contract/handoff clarification. No final independent team acceptance is issued by this report.

App: https://macau678-purchase-approval-1084101367777.asia-southeast1.run.app/
Repository: https://github.com/bravefe/Software-Engineer-2
Displayed app version: Version 0.2.
Declared baseline from partner handoff: f9d653882a40278394a1b007f98fdc5b7955ad34.
Handoff read: docs/1-uat, document/lab-6/UAT_TEST_CASES.md, documentation commit c25c40c89df816e1ccab99dc6853d7afbf3c8bc1.
Contract cross-check: document/srs.md at declared baseline f9d653882a40278394a1b007f98fdc5b7955ad34.
Limitation: exact live deployed SHA/revision was NOT exposed/independently verified during these UI checks. Please confirm it before using this report as exact-release acceptance evidence. The declared source is a reference, not a proven live-source assertion.

## Case results against the supplied handoff

| Case | Result | Actual observation |
|---|---|---|
| UAT-TC-01 Normal approval | FAIL against complete handoff expectation; core journey worked | Request #2 submitted and approved, owner retrieved saved $12,500. Timeline showed SUBMITTED then APPROVED, without the separate CREATED entry the handoff requires. See F-02. |
| UAT-TC-02 Mandatory reason | PASS for observed UI checks | #3 Reject and #4 Return: empty and three-space reasons kept confirm buttons disabled. Valid reasons produced Rejected and Returned respectively. |
| UAT-TC-03 Ownership/role | FAIL Part A; Parts B/C observed checks passed | Assigned reviewer1 could read requester1 draft #5 before submission, contrary to Part A. requester2 was denied owner #2; Requester access to reviewer queue was denied; no reviewer decision controls on owner request pages. See F-01. API-level forged action tests were not performed. |
| UAT-TC-04 Return/edit/resubmit | FAIL against complete timeline expectation; core journey worked | #4 returned, edit form prefilled, revised amount $18,750 saved, then Pending Review. Timeline SUBMITTED -> RETURNED -> EDITED -> RESUBMITTED, without the separate initial CREATED required by the handoff. See F-02. |
| UAT-TC-05 Rejected immutability | PASS for supplied UI steps | Owner #3 had no Edit action. /requests/3/edit displayed Editing Not Allowed, only RETURNED requests can be edited. Reopening detail showed same Rejected state, fields and reason. |

A FAIL against an explicit supplied-case expectation is retained even where the domain workflow worked. It is not automatically a confirmed implementation defect: the Product Team must reconcile the supplied handoff with its SRS and intended permissions.

## Synthetic records retained for reproduction

All records were created through the UI as requester1 (Alice Requester), assigned to reviewer1 (Carol Reviewer). Existing record #1 was not modified. Passwords/cookies are omitted. Test-only amounts are displayed by the app as dollars, not real transactions.

- #2 / PR-2026-00002: UAT6-Lathapol-TC01 Office Chair 2026-11-24; amount $12,500; description Office Chair - Ergonomic; synthetic quantity 2. AI-assisted UAT.; justification Required for the new team members joining next month.; final Approved. SUBMITTED 14:00:22 and APPROVED 14:01:47, 24 November as displayed in this browser session.
- #3 / PR-2026-00003: UAT6-Lathapol-TC02 rejection 2026-11-24; amount $12,500; description Synthetic office chair quantity 2; rejection boundary test.; justification Synthetic UAT; no real purchase.; final Rejected; reason Budget exceeded for this quarter. Decision displayed 14:02:35.
- #4 / PR-2026-00004: initially UAT6-Lathapol-TC04 return cycle 2026-11-24, $12,500. Return reason Please revise the quantity and cost estimate. Returned at 14:03:05. Owner edit form preserved initial fields. Updated title UAT6-Lathapol-TC04 Office Chair Updated 2026-11-24; amount $18,750; description Office Chair - Ergonomic (Updated); synthetic quantity 3.; justification Updated: Required for 3 new team members joining next month. Cost revised.; notes UAT return edit resubmit check. EDITED 14:05:07; RESUBMITTED 14:05:08; final Pending Review.
- #5 / PR-2026-00005: UAT6-Lathapol-TC03 private draft 2026-11-24; $10; description Synthetic draft ownership check; justification Synthetic test only; Draft, Submission Date Not yet submitted. CREATED displayed 14:01:17. Retained as Draft for Product Team reproduction.

## F-01 Reviewer reads a pre-submission draft

Owner/product: Macau678. Reporter: Codex AI-assisted UI check requested by Lathapol. Case: UAT-TC-03 Part A; referenced ownership AC-10 in supplied handoff, plus repository SRS FR-03/FR-07/BR-09.

Reproduction:
1. Sign in as requester1; create a synthetic request assigned to reviewer1; Save as Draft (do not submit). Existing fixture #5 can be reused.
2. Sign out, sign in as reviewer1.
3. Open Review Queue. #5 appeared under Past Decisions with status Draft.
4. Open /requests/5 directly.

Expected by supplied UAT: access denied or dashboard redirect; draft exclusively belongs to requester.
Actual: Carol Reviewer (REVIEWER) could read Alice Requester's draft title, $10 amount, description, justification and CREATED timeline; Submission Date was Not yet submitted. No decision controls appeared and no mutation was attempted. Owner list later still showed the same Draft and $10.
Evidence E-M03A: browser AX observation and displayed screenshot of reviewer reading draft #5, 24 November; exact visible labels above. Screenshot was displayed in the testing conversation; no separate persisted image file is claimed in this report.
Impact/severity: provisional MAJOR if drafts are contractually private, because pre-submission content is disclosed to a non-owner. If assignment is intended to grant read access even before submission, this may instead be a minor UAT documentation defect. Product Team must confirm the contract; repository SRS allows assigned-reviewer viewing without explicitly resolving draft-stage confidentiality. This is not an allegation that arbitrary/unassigned reviewers can access it; that was not tested.
Disposition: OPEN, Product Team triage/clarification requested. Do not silently relabel a failing agreed privacy requirement as an enhancement.

## F-02 Direct-submit history differs from case expectation

Cases: UAT-TC-01 and UAT-TC-04, handoff AC-11; SRS FR-06 and BR-08.
Reproduction: requester1 creates and immediately Submits for Review without Save as Draft; reviewer1 approves (#2), or returns and owner edits/resubmits (#4); reopen detail and read full Audit History Timeline.
Expected by supplied handoff: at minimum CREATED -> SUBMITTED -> APPROVED, or CREATED -> SUBMITTED -> RETURNED -> EDITED/RESUBMITTED.
Actual: direct-submit #2 timeline starts SUBMITTED (None -> Pending Review) then APPROVED. #4 starts SUBMITTED then RETURNED, EDITED and RESUBMITTED. Separate CREATED is present on saved-draft #5, demonstrating the difference between creation routes. Timestamps and actors were present for the displayed events.
Evidence E-M01 and E-M04: exact visible timeline sequences and record IDs above, observed after reload/relogin where noted.
Impact/severity: provisional MINOR documentation/event-granularity discrepancy; creation time/actor and submission are represented, but handoff explicitly demands an additional event. Confirm whether combined create/submit is allowed by the accepted Sprint 1 contract. Do not claim a missing persisted DB row merely from the UI; only displayed events were checked.
Disposition: OPEN, Product Team to explain intended contract or correct history behavior/cases with agreed justification.

## F-03 Handoff field names and requirement references differ from SRS/UI

Supplied inputs require Item Name, Quantity, Estimated Cost and Justification, and label submission FR-03. Live form uses Request Title, Estimated Amount ($), Assign Reviewer, Description and Business Justification, with no separate Quantity input. Baseline SRS FR-02 specifies title/description/amount/justification, while its FR-03 is Request Viewing. The form matches that SRS more closely than the supplied UAT template.
Adaptation actually used: item identifier in unique Request Title; synthetic quantity in Description; expected numeric amounts entered as $12,500/$18,750. No native Quantity validation was tested or claimed. Live UI says Pending Review where case prose says SUBMITTED; timeline action SUBMITTED is visible.
Severity: MINOR handoff/documentation clarification. Update executable cases and SRS/AC references after confirming the agreed baseline, without changing agreed requirements just to make a failure disappear.
Disposition: OPEN; request corrected test instructions and rerun any affected assertions.

## Other observed checks and limitations

E-M02: Reject and Return each displayed A reason is required before submitting and a disabled confirm button for empty/three-space input; valid reasons completed the actions. These are UI validation observations, not proof of server-side reason enforcement via crafted requests.
E-M03B: requester2 (Bob Requester) signed in successfully with the supplied safe test-account setup. Direct /requests/2 displayed Access denied: cannot view history of another user's request; no private fields shown. Owner later retrieved same Approved record and $12,500.
E-M03C: requester2 /reviewer/queue displayed Access Denied and You do not have permission to access this page. Owner detail pages had no Approve/Reject/Return actions. Direct crafted decision POSTs were not exercised.
E-M05: /requests/3/edit displayed Editing Not Allowed and Only requests in RETURNED status can be edited. Current status is Rejected. Owner detail after this remained Rejected, with original amount/description/justification and Budget exceeded for this quarter reason.
E-M06: Sign Out returned to login; navigating to protected /requests/2 while logged out redirected to login. All test sessions ended signed out.

No other users' real data was requested. Only synthetic records #2-#5 were created/changed; they are retained for grading/retest. Do not reset the shared database to clean them during another team's testing.

## Request to Pai

Please confirm the exact live release SHA and Cloud Run revision, triage F-01 through F-03 against the agreed Sprint 1 contract, and confirm whether assigned reviewers may read unsubmitted drafts. Provide corrected UAT instructions or a corrected release as appropriate, with issue IDs and reasons for each disposition. We can rerun affected checks after that clarification. This report is AI-assisted evidence for human review, not a fabricated two-student execution or final acceptance sign-off.
