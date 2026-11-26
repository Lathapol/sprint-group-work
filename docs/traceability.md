# Requirements and Actual-Result Traceability

**Version:** 0.4 | **Date:** 26 November 2026 | **Issue:** #74; Lab 7 CR-L7-01 proposed contract

One complete matrix below covers all **40 baseline requirements: 18 FR, 14 BR, 8 NFR**. Requirement IDs and targets are retained, including unimplemented/unverified work. Actual test keys resolve to exact files and test names in section2. AC/TEST IDs refer to the preserved [Sprint 1](sprints/sprint-1/contracts.md), [Sprint 2](sprints/sprint-2/contracts.md) and [Sprint 3](sprints/sprint-3/contracts.md) contracts; ranges are inclusive. Section3 separately states implementation and executed verification for every AC. A green unrelated test is not coverage. The Lab 7 addition below is proposed only; TEST-12-01..06 have no implementation or execution result yet.

## 1. Complete requirement matrix

R = main `0877808fb5a8084e040974cb56b16648b274bb04`, tag `f10-2026-11-25`, [run 45637901908](https://github.com/Lathapol/sprint-group-work/actions/runs/45637901908): **27 Node/API/regression reported tests (parents/subtests included), 5 browser tests, zero failures**, Docker build passed. These are retained results, not a new run for this documentation change. L2/L3 identify actual deployment checks below. PASS means the specified actual assertion passed; partial/unrun items are explicitly retained.

| Requirement | Feature/responsibility | Sprint | AC or NFR verification | Planned test | Actual file/test key or measurement | Executed result and version / remaining gap |
|---|---|---|---|---|---|---|
| FR-01 | F-01 | 1 | AC-01-01 | TEST-01-01 valid/invalid login | A | PASS R valid both roles, generic invalid, no session on failure; hash audit separate |
| FR-02 | F-01 | 1 | AC-01-03 | TEST-01-03 logout/replay | A,W | PASS R cookie cleared, row deleted, replay401, UI sign-out/relogin |
| FR-03 | F-01 | 1 | AC-01-02 | TEST-01-02 session identity | A | PASS R exact public user and expired session denial/deletion |
| FR-04 | F-02 | 1 | AC-02-01..02 | TEST-02-01..02 submit/validate | D,W,T/TEST-07-02 | PASS R persisted Pending/unassigned and invalid amount; exhaustive create-field boundary set not separately executed |
| FR-05 | F-02 | 1 | AC-02-01,03 | TEST-02-01,03 own list | F/TEST-08-03,W | PASS R own-only exact sets and saved UI retrieval |
| FR-06 | F-02 | 1 | AC-02-01,03 | TEST-02-01,03 owner detail | D,W | PASS R wrong owner404; saved final state/assignment/reason retrieved |
| FR-07 | F-03 | 1 | AC-03-01 | TEST-03-01 Reviewer All/Queue | F/TEST-08-03,FU,H/TEST-06-01 | PASS R All/Queue and both Reviewers' read visibility; L2 |
| FR-08 | F-03 | 1 | AC-03-01..03 | TEST-03-01..03 claim | D,FU | PASS R assignment and concurrent200/409; dedicated self-ID case gap |
| FR-09 | F-04 | 1 | AC-04-01..03 | TEST-04-01..03 approve | T/TEST-07-03,TU,S/TEST-10-04 | PASS R real approval after resubmit; L3 create/claim/approve/retrieve |
| FR-10 | F-04 | 1 | AC-04-01..02 | TEST-04-01..02 reject/reason | D,W,T/TEST-07-03 | PASS R blank reason400, assigned reject and persisted reason |
| FR-11 | F-04,F-06,F-07 | 1,2 | AC-04-01,AC-06-01,AC-07-01..04 | TEST-04-01,06-01,07-01..04 | D,H,T | PASS R exact events/actors, no duplicate resubmit; L2/L3 retained histories |
| FR-12 | F-03 | 1 | AC-03-01 | TEST-03-01 Mine | F/TEST-08-03,FU,T/TEST-07-03 | PASS R exact Mine scope including returned/resubmitted same Reviewer |
| FR-13 | F-06 | 2 | AC-06-01..04 | TEST-06-01..04 history | H,HU | PASS R chronology/safe actors/ownership/retry/empty/fresh-app; L2/L3 |
| FR-14 | F-07 | 2 | AC-07-01 | TEST-07-01 assigned return | T/TEST-07-01,TU | PASS R reason/state/assignment/history and denied invalid actors; L2 |
| FR-15 | F-07 | 2 | AC-07-02..05 | TEST-07-02..05 edit/resubmit | T,TU | PASS R owner-only edit, same-reviewer resubmit, serialization and fresh retrieval; L2 |
| FR-16 | F-08 | 2 | AC-08-01..04 | TEST-08-01..04 filters | F,FU | PASS R exact scope/filter sets, literal text/UTC bounds/retry; L2 |
| FR-17 | F-09 | 3 | AC-09-01..04 | TEST-09-01..04 >=THB 50,000 second stage | No implementation/test file | NOT IMPLEMENTED / NOT RUN; current R still one-stage at high amounts |
| FR-18 | F-10 | 3 | AC-10-01..04 | TEST-10-01..04 summary | S,SU | PASS R real zero/count/final-actor/concurrency/access assertions; L3 independent live reconciliation; future F-09 fixture unrun |
| FR-19 (proposed CR-L7-01) | F-12 | Lab 7 | AC-12-01..06 | TEST-12-01..06 withdrawal and regression | Planned only | NOT IMPLEMENTED / NOT RUN; docs-only contract pending teammate review |
| BR-01 | F-02,F-07 | 1,2 | AC-02-02,AC-07-02 | TEST-02-02,07-02 validation/no write | D,W,T/TEST-07-02 | PASS tested R cases; partial exhaustive original create-field/decimal boundary coverage |
| BR-02 | F-02 | 1 | AC-02-01 | TEST-02-01 Pending/unassigned | D,H/TEST-06-01 | PASS R initial state/reviewer/event; L3 saved initial record |
| BR-03 | F-03,F-04,F-07,F-09 | 1,2,3 | AC-03-01,AC-04-01..03,AC-07-01..05,AC-09-01 | TEST-03-01,04-01..03,07-01..05,09-01 | D,T,TU | PASS R implemented five-state transitions/invalid states; planned F-09 transition absent |
| BR-04 | F-03,F-07 | 1,2 | AC-03-01..02,AC-07-03 | TEST-03-01..02,07-03 | D,T/TEST-07-03 | PASS R single assignment/concurrent claim/same-reviewer resubmit |
| BR-05 | F-04,F-07,F-09 | 1,2,3 | AC-04-02,AC-07-01,04,AC-09-02 | TEST-04-02,07-01,04,09-02 | D,T | PASS R unrelated actor403 and assigned operations; future second actor absent |
| BR-06 | F-03,F-04,F-09 | 1,3 | AC-03-03,AC-04-02,AC-09-02 | TEST-03-03,04-02,09-02 self-ID negatives | Guard in src/requests.ts and DB CHECK; D tests unrelated actor, not self | IMPLEMENTED current no-self guard; dedicated same-ID claim/decision NOT RUN; future F-09 absent |
| BR-07 | F-04,F-07 | 1,2 | AC-04-02,AC-07-01 | TEST-04-02,07-01 reason | D,W,T/TEST-07-01,TU | PASS R blank/trimmed reasons and Returned CHECK |
| BR-08 | F-02,F-07 | 1,2 | AC-02-03,AC-07-02,05 | TEST-02-03,07-02,05 | T/TEST-07-02,05 | PASS R only owner Returned editable; other states unchanged |
| BR-09 | F-04,F-07 | 1,2 | AC-04-03,AC-07-05 | TEST-04-03,07-05 final immutability | D,T/TEST-07-05 | PASS R terminal retry/state-edit denial; dedicated approve-vs-reject race remains unrun |
| BR-10 | F-04,F-06,F-07 | 1,2 | AC-04-01,03,AC-06-02,AC-07-02..04 | TEST-04-01,03,06-02,07-02..04 | H/TEST-06-02,T | PASS R exposed history mutations404, failed operations unchanged, effective edit audited; application-level append-only |
| BR-11 | F-01,F-03,F-06..08 | 1,2 | AC-01-04,AC-03-01,AC-06-02,AC-08-03 | TEST-01-04,03-01,06-02,08-03 | D,H,F | PASS R own-only/Reviewer read/forbidden mutations; L2 |
| BR-12 | F-01,F-10 | 1,3 | AC-01-02,04,AC-10-03 | TEST-01-02,04,10-03 role authority | A,S/TEST-10-03 | PASS R single database role, forged role cannot elevate; no combined-role feature |
| BR-13 | F-07 | 2 | AC-07-02..04 | TEST-07-02..04 owner Returned only | T,TU | PASS R ownership, allowed fields, no-op, row-lock race, same-reviewer resubmit |
| BR-14 | F-09 | 3 | AC-09-01..04 | TEST-09-01..04 distinct second actor | No implementation/test file | NOT IMPLEMENTED / NOT RUN, equality at50,000 remains mandatory |
| BR-15 (proposed CR-L7-01) | F-12 | Lab 7 | AC-12-01..06 | TEST-12-01..06 owner withdrawal, races, scope, summary | Planned only | NOT IMPLEMENTED / NOT RUN; docs-only contract pending teammate review |
| NFR-01 | F-01..04,F-06..10 | 1,2,3 | AC-01-02,AC-06-02,AC-07-01..02,AC-08-03,AC-10-03 | Anonymous/expired endpoint API checks | A,D,H,T,F,S | PASS R covered routes; L2/L3 direct API401. Future F-09 endpoints must join matrix |
| NFR-02 | F-01..04,F-06..10 | 1,2,3 | AC-01-04,AC-06-02,AC-07-01..04,AC-08-03,AC-10-03 | Wrong role/owner/no private fields | D,H,T,F,S | PASS R tested roles/ownership/forged inputs; self-ID verification gap under BR-06; L2/L3 |
| NFR-03 | F-01,F-05,F-11 | 1,3 | AC-01-01; complete hash/database/log audit | TEST-01-01 + final audit | A tests bcrypt login and exact public fields; seed hashes password | PARTIAL R: no comprehensive stored-seed-hash/salt/no-plaintext-log audit; not inferred from green login |
| NFR-04 | F-05,F-06,F-07,F-10,F-11 | 1,2,3 | AC-05-01,AC-06-04,AC-07-05,AC-11-03 | TEST-05-01 actual restart/re-read full request/history | P,H/TEST-06-04,T/TEST-07-05,L2,L3 | PARTIAL: Lab 5 real restart request evidence; R fresh in-process app; actual deploy preserves full controlled histories. Full-history OS-process restart exercise not recorded |
| NFR-05 | F-11 | 3 | AC-11-01 p95<500ms/1,000 requests | TEST-11-01 measured samples | Planned test/performance/list-performance.cjs absent | NOT RUN; no latency/p95 compliance claim |
| NFR-06 | F-03,F-11 | 1,3 | AC-03-02 | TEST-03-02 two concurrent claims | D | PASS R exactly200/409 and one claim event; F-09 second-stage race separate |
| NFR-07 | F-05,F-11 | 1,3 | AC-05-02,AC-11-03 teammate clean setup | TEST-05-02,11-03 fresh clone/README | CI migrates/builds/tests; no teammate dry-run record | NOT VERIFIED by required human method; CI is supporting evidence only |
| NFR-08 | F-02,F-07,F-08,F-11 | 1,2,3 | AC-02-02,AC-07-02,AC-08-04,AC-11-02 | TEST-02-02,07-02,08-04,11-02 every-form UI | W,TU,FU; no separate component suite | PARTIAL R selected amount/date/input-retention/retry checks pass. Every invalid field/form, busy/409 permutations and component-level coverage not complete |

## 2. Actual-test and evidence index

TEST-12-01..06 are design IDs in the Lab 7 contract, not actual test files/results. They are intentionally absent from the actual-test index until implemented.

Each key is an actual file/test name at R, not a fabricated TEST-ID implementation. Sprint 1 planned IDs are mapped onto the existing broader tests rather than renamed retrospectively.

| Key | Actual file and exact test name / subtests |
|---|---|
| A | `test/auth.test.cjs` -> `login, current user, session expiry and logout against PostgreSQL`. Also `public version reports the release commit without database access` and `health reports database readiness without exposing database errors` support delivery. |
| D | `test/requests.test.cjs` -> `request ownership, concurrent claim and final decision`. Valid submission, zero amount, wrong owner/role, concurrent claim, unrelated decision, blank rejection, final retry, exact3 events. Does not execute synthetic self-ID or approve/reject race. |
| W | `test/browser/workflow.spec.ts` -> `requester submits and retrieves a reviewer rejection`: invalid amount/input retention; submit/claim/blank reject/reject/relogin/retrieve. |
| H | `test/history.test.cjs` -> `F-06 persisted history chronology, safe actors and ownership`; `TEST-06-01: owner and both reviewers retrieve one ordered event per transition`; `TEST-06-02: protected history is private and read-only`; `TEST-06-04: a fresh app instance reads identical stored events without duplicates`. |
| HU | `test/browser/history.spec.ts` -> `TEST-06-03: history renders safe reasons and retries a failed read`. |
| T | `test/returns.test.cjs` -> `F-07 return edit and same-reviewer resubmission`; `TEST-07-01: assigned return persists reason and invalid returns change nothing`; `TEST-07-02: Returned edits are owner-only, validated and audited once`; `TEST-07-03: resubmit retains reviewer and reason history, and supports a final decision`; `TEST-07-04: duplicate resubmission and edit/resubmit races serialize`; `TEST-07-05: non-Returned states cannot be edited or resubmitted`. |
| TU | `test/browser/returns.spec.ts` -> `TEST-07-03 UI: returned edits resubmit to the same reviewer and retain history`. |
| F | `test/filters.test.cjs` -> `F-08 filters preserve exact persisted matches and authorization`; `TEST-08-01: state category text AND combinations and literal wildcard characters`; `TEST-08-02: calendar dates and inclusive UTC days, one-sided and leap-day boundaries`; `TEST-08-03: ownership before filters; reviewer scopes AND filters; no forged owner selectors`; `TEST-08-04 persistence: reads do not mutate requests/history; fresh app returns same results`. TEST-08-02 lives here, not the contract's proposed separate filter-validation.test.cjs. |
| FU | `test/browser/filters.spec.ts` -> `TEST-08-04 UI: filters and clear retain authorized All Queue Mine scopes`. |
| S | `test/summary.test.cjs` -> `F-10 persisted global summary, final actors and snapshot reconciliation`; `TEST-10-01: actual empty schema has all zero enum buckets, then exact persisted counts`; `TEST-10-02: latest matching final actor, no duplicate count, explicit unattributed legacy`; `TEST-10-03: session role is authoritative; anonymous/expired/requester denied`; `TEST-10-04: real return/edit/resubmit/final decision and concurrent snapshots reconcile`. Private actual migrated schema, not a mocked database. |
| SU | `test/browser/summary.spec.ts` -> `TEST-10-04 UI: real decision counts, reload, loading empty and retry`. Real create/claim/approve/API/reload assertions; controlled presentation-only empty/failure responses are explicitly mocked. Real empty DB belongs to S, not live deployment. |
| P | [Lab 5 restart/redeploy record](labs/lab-05/release-persistence.md), actual before/after JSON and screenshots; request continuity, not a complete pre/post history-array restart comparison. |
| L2 | [Sprint 2 release](deliverable-2/evidence/sprint-2-release/README.md), f9a0d2f704c868e4a0b2048f4cc85c2bf8949997 / sprint-2-2026-11-25 / run 45629268302 / approvals-r45629268302-1:22 Node+4 browser,43 live calls and8 UI captures; original retained #13 preserved. |
| L3 | [F10 release](deliverable-2/evidence/F10-release/README.md), R / approvals-r45637901908-1:61 live calls, independent stable-inventory count reconciliation in3 phases,5 UI captures; fresh login saved #18 and complete #13/#16/#17 resources/history unchanged across release. `verification-excerpts.log` retains actual main CI output. |

Genuine preimplementation RED/GREEN remains versioned: [F06](deliverable-2/evidence/F06/README.md) RED15f2434, API GREEN0505773/UI972a578; [F07](deliverable-2/evidence/F07/README.md) REDf1fac68/UI71a1008, GREEN66c5d54, state checks a86ea85; [F08](deliverable-2/evidence/F08/README.md) REDd81325e, first implementation519c492 had real maximum-date failures, fixed f93e156, UI regression07a9720; [F10](deliverable-2/evidence/F10/README.md) REDc2367f2, implementation a089d15, clean regression7b26ca2. Logs retain intermediate failures rather than hiding them. These historical short SHAs resolve through retained logs/Git; they are not all the current deployed version.

`test/release.test.cjs` checks migration-before-rollout, schema-preserving existing-image rollback and invalid tags using a stub gcloud. These are not real GCP deployment tests; L2/L3 supply that separate evidence. Historical UAT6-03 is case-specific PASS at 8bc9448/approvals-r45190529393-1, not blanket independent acceptance of R.

## 3. Every AC: implemented versus executed verification

PASS below is scoped to the named assertions and evidence, with exceptions stated. Core Sprint 2 AC are implemented/tested/reviewed/deployed; cross-cutting every-form and full-process persistence targets remain separate NFR gaps. Original preimplementation contracts are preserved, not silently rewritten to match test files.

| AC | Implemented? | Executed verification at R (unless historical evidence specified) |
|---|---|---|
| AC-01-01 | Yes | A PASS valid/invalid and cookie; stored salt/hash/log audit incomplete (NFR-03) |
| AC-01-02 | Yes | A and H/T/F/S PASS covered protected paths/session expiry |
| AC-01-03 | Yes | A/W PASS session deletion/replay and UI sign-out |
| AC-01-04 | Yes | D/H/T/F/S PASS tested role/owner/forgery; no combined roles |
| AC-02-01 | Yes | D/W PASS Pending/unassigned/persisted owner retrieval |
| AC-02-02 | Yes | PARTIAL verification D/W/T: invalid amount/edit validation pass; exhaustive create boundary/every-field UI suite absent |
| AC-02-03 | Yes, Returned exception added in Sprint 2 | F/T PASS ownership and non-Returned edit denial |
| AC-03-01 | Yes | D/F/FU/T PASS claim, All/Queue/Mine and saved assignment |
| AC-03-02 | Yes | D PASS one200/one409/one event |
| AC-03-03 | Yes | PARTIAL verification: D's competing claim supplies a409; dedicated missing-ID claim and synthetic self-ID assertions absent (history missing-ID reads do not cover claim) |
| AC-04-01 | Yes | D/H/T/TU/S PASS persisted rejection/approval and exact events |
| AC-04-02 | Yes | PARTIAL verification: blank/unrelated/preclaim denial PASS; dedicated self-ID assertion absent |
| AC-04-03 | Yes | PARTIAL verification: D/H/T terminal retry/history mutation denial PASS; dedicated concurrent approve-versus-reject not executed |
| AC-04-04 | Yes | W PASS original full rejection/retrieval journey |
| AC-05-01 | Yes | PARTIAL method: Lab 5 real restart request continuity, L2/L3 full-history redeploy and R fresh-app reads PASS; full-history process-restart exercise absent |
| AC-05-02 | Setup exists | NOT RUN by teammate fresh-clone method; CI supporting evidence only |
| AC-06-01 | Yes | H/TEST-06-01 PASS exact sequence/tie ordering/actors; L2/L3 |
| AC-06-02 | Yes | H/TEST-06-02 PASS401/404/public fields/no mutation routes |
| AC-06-03 | Yes | HU PASS safe text/chronology/empty/retry; selected role detail views |
| AC-06-04 | Yes | H/TEST-06-04 PASS same-DB fresh app, no duplicate reads (not OS restart) |
| AC-07-01 | Yes | T/TEST-07-01,TU PASS required/trimmed reason, actor/state/event and DB CHECK |
| AC-07-02 | Yes | T/TEST-07-02,05 PASS owner-only edit, validation/protected fields/all other-state denial |
| AC-07-03 | Yes | T/TEST-07-03,TU PASS same Reviewer, Mine/not Queue, saved edits/reason history/final outcome |
| AC-07-04 | Yes | T/TEST-07-04 PASS duplicate/racing resubmit/edit and unrelated decision denial |
| AC-07-05 | Yes | Original regression/T PASS; local before/after migration evidence in F07; L2/L3 retained saved data/history |
| AC-08-01 | Yes | F/TEST-08-01 PASS64 exact AND scope/filter subsets and literals |
| AC-08-02 | Yes | F/TEST-08-02 PASS UTC/leap/0001..9999/invalid and duplicate query boundaries |
| AC-08-03 | Yes | F/TEST-08-03 PASS authorized scope/forged selectors/anonymous denial |
| AC-08-04 | Yes | F/TEST-08-04,FU and W/TU PASS Clear/retry/input retention/read immutability/existing actions |
| AC-09-01 | No | NOT RUN;49,999.99/50,000.00/50,000.01 first-stage behavior remains to implement |
| AC-09-02 | No | NOT RUN; distinct non-owner second actor/negative roles/input |
| AC-09-03 | No | NOT RUN; competing second decisions/one final event |
| AC-09-04 | No | NOT RUN; second-stage UI and cross-feature history/return/summary regression |
| AC-10-01 | Yes | S/TEST-10-01 PASS actual empty DB/known nonzero totals, L3 independent reconciliation |
| AC-10-02 | Yes for current workflow | S/TEST-10-02,04 PASS exact final actor/ties/no duplicates/legacy/concurrent snapshots; planned future F09 fixture NOT RUN |
| AC-10-03 | Yes | S/TEST-10-03 PASS401/403/forged scopes/public shape; L3 direct backend evidence |
| AC-10-04 | Yes | SU PASS real decision/API count delta/reload; empty/failure presentation controlled separately; L3 live UI |
| AC-11-01 | No measured result | NOT RUN; raw1,000-fixture timing protocol/result absent |
| AC-11-02 | Partial | W/TU/FU/SU selected failures/input retention PASS; comprehensive every-field/form/busy suite absent |
| AC-11-03 | Partial | R regression27+5 PASS; teammate clean setup/full-history process restart and remaining domain gaps NOT RUN |

## 4. Coverage gaps and next verification

No requirement has been removed merely because its implementation/test is absent. Remaining actions: F-09 all four AC; F-11 p95/raw samples; same-ID self-claim/self-decision and approve/reject race; exhaustive original create boundaries; hash/salt/stored-data/log audit; full-history real process restart; teammate fresh clone; every-form errors/input retention/busy409 verification; future F09-summary integration and independent acceptance on the final candidate. Proposed owners, dependencies and target dates are in the [finish plan](deliverable-2/finish-plan.md). No blanket "uncovered requirements: none" or whole-product acceptance claim is made.
