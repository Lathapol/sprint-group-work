# Current baseline audit and source provenance

25 November 2026; issue #74. This is a current documentary reconciliation, not a rewrite of historical contract/test design or instructor scope approval.

## Sources and scope cross-check

The user supplied Project Deliverable 2 v1: PartD requires the complete SRS, feature inventory, System SDS and all-baseline requirement-to-actual-result matrix with explicit gaps. PartsB/C separately require versioned contracts and actual working progress; PartE requires a self-contained PDF and identified deployed candidate. Updating Markdown does not finish that PDF or independent acceptance.

The original Group Work Specifications was absent in the initial local lookup. A retained course-document copy was subsequently retrieved from partner repository [document/_group_work_specs_v1.pdf at immutable 8f21c3252e72db1a17c9976701582fd21dc73cf5](https://github.com/bravefe/Software-Engineer-2/blob/8f21c3252e72db1a17c9976701582fd21dc73cf5/document/_group_work_specs_v1.pdf). It is a partner-retained copy, not a newly supplied instructor ruling. SHA-256 `ec2476f85df139cab5bd78b937364149baf5b16f5f16adb2a27e1030451cda6b`. Local material retained outside the code repository as `Deliverable 2/materials/group_work_specs_partner_copy.pdf`.

Theme5 (page 6) requires controlled submit/approve/reject/return, permissions, state transitions, history/reporting, explicit assignment/edit/multistage rules; later examples include return/resubmission, extra stages, filtering and decision summaries. The retained F-01..11 plan covers this scope. F-09 remains required and unimplemented; the source does not authorize dropping it. The brief also calls for self-approval/invalid-transition/unrelated-reviewer/requester-review-operation checks; the matrix makes missing dedicated self-ID tests visible. Delivery/AI obligations remain applicable. Lab 7 handout/approved maintenance change is still not supplied and cannot be inferred from this brief.

## Revision and implementation references

| Baseline | Immutable reference and significance |
|---|---|
| Original documents/contracts | 5Nov v0.1 remains in Git; original Sprint 1 contracts unchanged |
| User clarification | 24Nov Q01 same Reviewer on resubmit; Q02 amount>=THB 50,000; not an invented instructor decision |
| Reviewed expansion contracts | #77 reviewed/merged; contract head0df55ad9cb8bcc281cb4000d826cffa608f4ac5b, merge90285f8, before feature implementation |
| Sprint 2 release | f9a0d2f704c868e4a0b2048f4cc85c2bf8949997, tag sprint-2-2026-11-25, revision approvals-r45629268302-1; evidence #84 reviewed/merged |
| Current working Sprint 3 increment | 0877808fb5a8084e040974cb56b16648b274bb04, tag f10-2026-11-25, revision approvals-r45637901908-1; #85/#86 reviewed/merged; evidence #87 approved/merged at 3c40565; #73 closed |
| #74 current docs | v0.3 updates complete SRS/inventory/SDS/matrix. Separate docs PR must be reviewed/merged; this branch does not replace the recorded deployed source |

## Corrections made without lowering targets

- Current five states and implemented Returned/filter/summary behavior replace obsolete "later" descriptions. F-09 waiting state/second actor are still future design, not current schema.
- Actual Node test runner/Supertest/Playwright replace the uninstalled Vitest proposal; no separate component suite is claimed.
- Actual route-handler/Prisma boundaries, no displayName, seed.cjs/four original-state fixtures, same-origin proxy, migration order and deployed pipeline replace draft design assumptions.
- The matrix preserves all 18 FR / 14 BR / 8 NFR and all 40 contract AC, identifying actual file/case/result/version and partial/unrun checks. Contract's proposed separate filter-validation file maps explicitly to actual filters.test.cjs.
- Existing app/redeploy/CI evidence is retained without relabeling an in-process app factory as OS restart, an agent run as human UAT, a CI setup as teammate fresh clone, or an unrelated green suite as performance proof.
- Actual AI assistance/command execution is declared; brief peer approvals are not fabricated into detailed review reasoning.

## Outstanding coverage and acceptance

F-09 all AC; F-11 performance and comprehensive UI/hardening; same-ID self-claim/decision and dedicated approve/reject race; exhaustive original create boundaries; hash/salt/stored-data/log audit; full-history process-restart; teammate clean clone. Current F-10 tests cover current states; future second-stage summary/history integration must run when F-09 exists. These are mapped and still uncovered or partially verified, not waived. Independent full UAT, remaining partner/maintenance dependencies, reviewed final candidate and self-contained final PDF remain separate. See [matrix](../traceability.md) and [owner/date plan](finish-plan.md).

## Documentation verification

For this docs-only update validate exact requirement/AC inventories, test-file/name references, local links, stated source/release values and git diff whitespace. No production code, schema or configuration changes are included. The normal PR CI provides a separate regression check of the docs branch; its results must not overwrite historical R/L2/L3 execution evidence.
