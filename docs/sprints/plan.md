# Three-Sprint Plan and Achieved Status

**Product:** Workflow and Approval System | **Version:** 0.3 | **Updated:** 25 November 2026 | **Issue:** #74

Original allocation from 5 Nov is retained. All baseline requirements are mapped in [traceability](../traceability.md), including missing implementation/verification. Allocating a requirement does not prove completion. Detailed proposed owners/dates/dependencies: [finish plan](../deliverable-2/finish-plan.md).

| Sprint | Goal / dependency order | Current achieved status | Checkpoint |
|---|---|---|---|
| 1 | F-05 schema/setup -> F-01 auth -> F-02 submit/track -> F-03 claim -> F-04 decide/history | Working critical slice preserved. Current UI submit/claim/reject/retrieve and backend access/concurrency pass. Original dedicated self-ID/decision-race, full-history process restart and teammate setup checks remain gaps; full human UAT not asserted. | Deliverable1,8Nov; continued Lab 5/6 evidence |
| 2 | F-06 history -> F-07 return/edit/resubmit -> F-08 filtering | All three implemented/tested/reviewed/deployed under contracts #77; #78/#79/#81 and release #82. Original sprint release remains identifiable; #84 evidence approved/merged. | Deliverable 2,29Nov |
| 3 | F-09 second approval, F-10 summary, F-11 hardening; F-09 integrates with history/return/reporting | Contracts reviewed #77; meaningful F-10 implemented/tested/deployed #85/#86 and evidence #87 merged. F-09 unimplemented; F-11 partial. | Actual working progress29Nov, bounded final completion13Dec |

## Preserved workflow and decisions

Requester submits Pending; Reviewer claims into In Review, then approves/rejects or returns with reason. Owner can edit only Returned and resubmits to SAME Reviewer in In Review, never queue (Q01 user resolution 24 Nov, implemented). The second approval threshold is inclusive >=THB 50,000 (Q02 user resolution 24 Nov, contract only). No required Sprint 2 feature was moved to Sprint 3. F-09 must not be dropped simply because it is absent today.

Sprint 2 release: `sprint-2-2026-11-25` at f9a0d2f704c868e4a0b2048f4cc85c2bf8949997, run 45629268302/revision approvals-r45629268302-1,22 Node / 4 UI tests and43 live calls. Current F-10 progress: `f10-2026-11-25` at 0877808fb5a8084e040974cb56b16648b274bb04, run 45637901908/revision approvals-r45637901908-1,27 Node / 5 UI and61 live calls. [Release evidence](../deliverable-2/README.md). These do not replace independent acceptance or the final assessed PDF.

## Engineering sequence and completion gates

For each feature retain contract/test-design before implementation, semantic RED then GREEN, regression, issue/branch, actual teammate review, staging integration and main release identity. Record actual failed/skipped results and review text. Do not invent substantive feedback from a brief approval. Current documents are v0.3; historical contracts and earlier source remain unchanged in Git.

Before29Nov23:59: review complete SRS/inventory/SDS/result matrix (#74), assess integrated main candidate (#75), and compile self-contained PDF (#76), including every Sprint 2/3 contract, full baseline, selected actual code/test/UI/API/persistence evidence, source/tag/run/revision, coverage gaps and controlled finish plan. The deployment already exists; final submitted freeze and complete PDF remain outstanding.

F-09 AC09-01..04 and F-11 performance/usability/final verification are planned for first pass by 30 Nov, with bounded retest12Dec and final video/release13Dec. Exams1-11Dec reduce availability. The plan still risks substantial F-09 work near the checkpoint; it is disclosed, not called substantially complete by assertion. Team must confirm proposed ownership and track slips explicitly.

## Labs and external dependencies

Lab 5 supplies the Docker/GCP delivery path and actual restart evidence. Lab 6 #60's specific retest passed; full independent acceptance/two-student sessions and outgoing Macau guide/version follow-ups remain separate. Lab 7 needs its actual handout and approved maintenance change to already implemented behavior; none is supplied. Baseline features are not automatically Lab 7 maintenance. See [baseline audit](../deliverable-2/baseline-audit.md), [finish plan](../deliverable-2/finish-plan.md) and Lab 6 records.

## Risks and actions

| Risk | Action |
|---|---|
| F-09 incomplete at checkpoint | Preserve explicit unimplemented AC; implement exact inclusive threshold/distinct actor/races, then history/summary regression; do not hide scope |
| Green tests overstate full requirement coverage | Retain every gap in requirement/AC matrix, especially performance/clean clone/full-history restart and all-form errors |
| Human review/UAT not evidenced | Record actual people/date/source/results; no AI sign-off or invented participation |
| Final docs differ from deployment | Preserve immutable submitted source and bind PDF evidence to actual tag/run/revision; later commits do not silently replace it |
| Exam period and remaining course dependencies | Confirm owners immediately; reserve12-13Dec for bounded integration/retest/evidence, not first implementation of major workflows |
