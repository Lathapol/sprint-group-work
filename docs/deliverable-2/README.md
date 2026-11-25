# Deliverable 2 checkpoint

Sprint 2 completion and Sprint 3 progress. Due **29 November 2026 23:59 Asia/Bangkok**, 70 points; final product completion target 13 December. Same team, Workflow and Approval System, same repository. Status updated 25 November: contracts #77 and F-06/F-07/F-08 #78/#79/#81 merged; release #82 is deployed at main `f9a0d2f`, tag `sprint-2-2026-11-25`, revision `approvals-r45629268302-1`. Main CI passes 22 API tests and 4 UI tests; 43 live API calls and deployed UI checks passed, including retained-data comparison. See [actual release evidence](evidence/sprint-2-release/README.md). Human evidence acceptance and the remaining Deliverable 2 work are separate.

## Recorded decisions

User decisions received 24 November 2026 (not invented course approval):
- Q-01: a Returned request resubmits to the **same reviewer**, directly to IN_REVIEW; it does not enter the unassigned Pending queue.
- Q-02: amount **at or above THB 50,000.00** needs a second, different reviewer. Equality is included.
- Q-03 was already resolved by System SDS DD-01/02/03: PostgreSQL session cookie, absolute 8-hour expiry and bcrypt.

Complete contracts: [Sprint 2](../sprints/sprint-2/contracts.md), [Sprint 3](../sprints/sprint-3/contracts.md). Their review/merge occurred in #77 before implementation. Actual results: [F-06](evidence/F06/README.md), [F-07](evidence/F07/README.md), [F-08](evidence/F08/README.md). Feature review and accepted main release are separate steps. Do not silently rewrite Sprint 1 contract history.

## Scope and build order

1. Review contract PR; preserve its commit as design baseline.
2. F-06 history view, then F-07 return/edit/resubmit, then F-08 filter/search. All planned Sprint 2 features must finish; no scope moved to Sprint 3 to hide missing work.
3. Reviewed identifiable Sprint 2 release on main, integration/regression and deployed continuity checks.
4. F-10 persisted decision summary is the proposed meaningful Sprint 3 increment for the 29 Nov candidate. F-09 and F-11 contracts are defined now; their complete implementation is scheduled by final deadline.
5. Complete baseline documents/result traceability; reviewed integrated main candidate; final self-contained PDF with actual evidence.

## Rubric / issue map

A (5): #67 continuity/change register.
B (25): #68 contracts, #69 F-06, #70 F-07, #71 F-08.
C (15): #72 all Sprint 3 contracts, #73 F-10 working progress.
D (10): #74 complete SRS, feature inventory, System SDS and actual-result traceability.
E (15): #75 integrated reviewed GCP candidate; #76 PDF and controlled finish plan.

Existing Sprint 1 reference: source 51b57adc1c51d57e23d047d628cf55966e268ad9. Independent case-specific UAT6-03 PASS was recorded at 8bc9448d478464784acb48fce6bbe4c18973946d / approvals-r45190529393-1. Previous documentation-only release 3846a503893d6f5fc0fcfb602e79883fc7eab0d6 / approvals-r45358400560-1 supplied the preserved #13 baseline. Current Sprint 2 release is identified above. These do not mean whole Sprint 1 UAT acceptance is complete.

## Required evidence discipline

For each feature preserve Issue -> contract/test design commit -> genuine failing semantic test (RED) -> implementation -> same assertion GREEN and regression -> substantive teammate review -> integration/release -> deployed evidence. Record actual commands/counts/SHA, not expected output or a syntax/fixture failure. Record failed/skipped checks honestly.

The PDF must include all Sprint 2 and Sprint 3 contracts; complete current SRS/inventory/System SDS; complete requirements-to-actual-test matrix; two meaningful Sprint 2 demonstrations plus Sprint 3 rule/workflow and Sprint 1 continuity; saved-data retrieval, rule rejection and backend forbidden-access evidence; two actual automated test excerpts and two Issue/PR chains; exact tag/SHA/run/revision; safe setup and remaining plan. Links alone are insufficient. Freeze the submitted immutable source so later commits do not replace it.

## Dependencies and truthful status

- Group Work Specifications source document was not found locally in the first lookup. The retained SRS/theme/feature plan controls current preparation; obtain the course document to cross-check mandatory full theme scope before final acceptance.
- Lab 6 #60 resolved; #64 contains OUTGOING findings on Macau678, not a confirmed bug in our own app. Pai responded; targeted retest report/evidence merged in #80: F-01/F-02 pass executed checks, F-03 original guide publication and exact live release metadata remain follow-ups. Human participation/review and final UAT remain tracked separately. See [retest report](../labs/lab-06/macau-retest-report.md).
- Lab 7 handout/approved maintenance change not supplied. Do not relabel planned F-06/F-07/F-08 as an approved maintenance change or claim Lab 7 complete.
- Owner/date plan is proposed for team review, not an agreement on behalf of Kittakorn.
