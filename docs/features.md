# Feature Inventory

**Product:** Workflow and Approval System | **Version:** 0.4 | **Date:** 26 November 2026 | **Issue:** #74; Lab 7 CR-L7-01 contract update

Whole-product inventory. IDs and sprint allocation are retained. Current implementation: main `0877808fb5a8084e040974cb56b16648b274bb04`, tag `f10-2026-11-25`, revision `approvals-r45637901908-1`. Implemented, tested, reviewed and independently accepted are separate statuses.

| ID | Feature/responsibility | Requirements | Depends on | Sprint | Current status |
|---|---|---|---|---|---|
| F-01 | Login/logout/current user, sessions, roles and ownership | FR-01..03; BR-11..12; NFR-01..03 | F-05 | 1 | Implemented/deployed; auth and domain access tests pass. Complete hash/log audit remains a gap. |
| F-02 | Submit validated request and track own records | FR-04..06; BR-01..02,08; NFR-08 | F-01,F-05 | 1 | Implemented/deployed; original UI journey still passes. All-form field-error verification incomplete. |
| F-03 | Reviewer All/Queue/Mine, claim and assignment | FR-07..08,12; BR-03..04,06; NFR-06 | F-01,F-02 | 1 | Implemented/deployed; claim concurrency verified. Dedicated same-ID self-claim negative test still needed. |
| F-04 | Assigned approve/reject with reasons and atomic history | FR-09..11; BR-03,05..07,09..10 | F-03 | 1 | Implemented/deployed; final outcomes/forbidden actors tested. Dedicated self-decision and approve-versus-reject race verification still needed. |
| F-05 | Persistence, schema/migrations, synthetic seed, setup and delivery | NFR-04,07 | none | 1 | Implemented/deployed; actual redeploy continuity verified. Complete-history process-restart exercise and teammate fresh clone not recorded. |
| F-06 | Safe visible history chronology and retry | FR-13; BR-10..11; NFR-01..02,04 | F-04 | 2 | #69/#78 reviewed/merged/deployed; TEST-06-01..04 API/UI pass. Evidence #84 approved/merged. |
| F-07 | Return with reason, owner Returned edit and same-reviewer resubmit | FR-14..15; BR-03,05,07..08,10,13; NFR-01..02,08 | F-04,F-06 | 2 | #70/#79 reviewed/merged/deployed; TEST-07-01..05 API plus selected UI pass, migration/races verified. Exhaustive UI conflict/busy permutations remain F-11. |
| F-08 | Scope-preserving state/category/UTC date/literal-text filters | FR-16; BR-11; NFR-01..02,08 | F-02,F-03 | 2 | #71/#81 reviewed/merged/deployed; TEST-08-01..04 API/UI pass, including 64 exact scope/filter combinations and date extremes. |
| F-09 | Second approval at amount >=THB 50,000, distinct Reviewer | FR-17; BR-03,05..06,09..10,14; NFR-01..02,06 | F-04,F-07 | 3 | Contract reviewed #77; NOT implemented. No waiting state, second actor columns or TEST-09 suite exists. Current high amounts still finalize after one approval. |
| F-10 | Global consistent summary, final decision actor and legacy unattributed counts | FR-18; BR-10..12; NFR-01..02,04 | F-04,F-06,F-07 | 3 | #73/#85/#86 reviewed/merged/deployed; TEST-10-01..04 API/UI pass; 61 live calls and independent reconciliation pass. Evidence #87 approved/merged; #73 closed. Future F-09 integration remains planned. |
| F-11 | Performance, comprehensive usability/failure handling, final regression/setup | NFR-03..08 (remaining hardening/verification) | all | 3 | Contract reviewed #77; PARTIAL. Regression green. Performance, all-form UI checks, hash/log audit, full-history restart and teammate setup remain planned. |
| F-12 (CR-L7-01) | Requester withdrawal of own unclaimed Pending request, retained audit history | FR-19; BR-03,09,10,11,15; AC-12-01..06 | F-01,F-02,F-03,F-05 | Lab 7 maintenance change to Sprint 1 behavior | Proposed only; docs/contract PR under teammate review; not implemented or deployed. |

## Contracts and releases

- [Sprint 1 contracts](sprints/sprint-1/contracts.md): F-01..05; implementation in `src/app.ts`, `src/requests.ts`, `prisma/`, `web/main.tsx`. Proposed Lab 7 F-12 impact and test contract is appended there; no source implementation yet. [Lab 5 persistence](labs/lab-05/release-persistence.md) and current regression preserve earlier evidence.
- [Sprint 2 contracts](sprints/sprint-2/contracts.md), reviewed #77 before implementation: F-06..08 in requests/routes, filters, Returned migrations and UI. [Sprint 2 release](deliverable-2/evidence/sprint-2-release/README.md): `sprint-2-2026-11-25`, source `f9a0d2f704c868e4a0b2048f4cc85c2bf8949997`, run 45629268302, 22 Node / 4 browser tests, 43 live API calls. No Sprint 2 work moved to Sprint 3.
- [Sprint 3 contracts](sprints/sprint-3/contracts.md), reviewed #77: F-09..11. F-10 implementation `src/reports.ts` and UI; [deployed evidence](deliverable-2/evidence/F10-release/README.md) at current reference above, 27 Node / 5 browser tests, 61 live calls. F-09 absent and F-11 incomplete.

The [complete matrix](traceability.md) maps every requirement and AC to actual tests/results or explicit gaps. The [finish plan](deliverable-2/finish-plan.md) records proposed owners/dates/dependencies; these are not commitments invented on behalf of the teammate. Full UAT acceptance remains separate. Earlier inventory versions remain in Git.
