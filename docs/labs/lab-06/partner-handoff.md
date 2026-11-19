# Partner handoff intake: Macau678

Received from the user's screenshot, 19 November 2026. This is handoff intake, not executed independent UAT.

- Product: Macau678 Purchase Approval System.
- Repository: https://github.com/bravefe/Software-Engineer-2
- Handoff branch: docs/1-uat; observed documentation commit c25c40c89df816e1ccab99dc6853d7afbf3c8bc1.
- Cases: document/lab-6/UAT_TEST_CASES.md (five supplied cases plus reviewer checklist).
- Declared tested-product baseline: f9d653882a40278394a1b007f98fdc5b7955ad34, Version 0.2. This differs from the handoff documentation commit; live source/revision has not been verified.
- App URL transcribed from screenshot: https://macau678-purchase-approval-108410136777.asia-southeast1.run.app/
- Preflight GET of that transcription returned HTTP 404 on 19 November. Confirm exact URL with user/partner before attributing an availability defect to the product. No UAT case is marked PASS.
- Private credentials supplied in screenshot; password intentionally not copied to Git or reports.
- Screenshot's role headings appear swapped. Partner's written handoff specifies requester1@macau678.com = REQUESTER and reviewer1@macau678.com = REVIEWER. Actual signed-in role verification remains pending.
- Partner members (confirmed by user): Punnapob Wirojwongchai, 67070503425; Patcharak Plipat, 67070503427.
- Live deployed revision and coordinated sessions remain pending.

## Supplied cases to execute as independent testers

| Case | Category |
|---|---|
| UAT-TC-01 | Normal purchase submission and approval, full visible audit history |
| UAT-TC-02 | Empty/whitespace reason denial for Reject and Return |
| UAT-TC-03 | Forbidden role and cross-user/assignment access |
| UAT-TC-04 | Return, edit, resubmit; saved fields and timeline |
| UAT-TC-05 | Rejected terminal request cannot be edited, including direct URL |

Execute the partner's requirements, not our app's state machine: their return/edit/history UI belongs to their declared Sprint 1 scope even though ours differs.

Potential setup clarification: only one Requester and one Reviewer are supplied. TC-03 Part B requires a real record owned by another Requester; request a second safe requester account and known target record to complete that step. A nonexistent random ID does not prove cross-owner protection. TC-03 Part A's returned/draft visibility expectation should be confirmed against their assignment contract before classifying a defect.

Our own smoke tests/AI-assisted preflight are supporting checks, not proof both students performed independent manual UAT. Record each student's real execution and evidence. No external message, defect report or acceptance has been sent or recorded by this intake.
