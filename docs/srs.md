# Software Requirements Specification

**Product:** Workflow and Approval System (university department)
**Version:** 0.4 (CR-L7-01 contract update; proposed change not implemented) | **Date:** 26 November 2026 | **Theme:** 5. Workflow and Approval System

Current implementation reference: main `0877808fb5a8084e040974cb56b16648b274bb04`, tag `f10-2026-11-25`, revision `approvals-r45637901908-1`. This specification includes the whole product, including unimplemented requirements. Implementation is not equivalent to complete verification or independent UAT acceptance; see the [complete result matrix](traceability.md) and [baseline audit](deliverable-2/baseline-audit.md).

## 1. Stakeholder problem and context

A university department receives internal requests for funding, purchases, travel and reimbursement. Today these are handled informally, so nobody can easily see where a request is, who is responsible for it, or why it was approved or rejected.

The product is a web application in which staff submit requests, reviewers pick up and decide them, and every decision is recorded with its reason and history. All data in the product is synthetic.

## 2. Actors

| Actor | Responsibilities |
|---|---|
| Requester | Logs in, submits requests, views and filters their own requests and history, may withdraw an unclaimed Pending request under proposed CR-L7-01, edits Returned requests and resubmits to the same Reviewer. |
| Reviewer | Logs in, reads all requests and history, filters All/Queue/Mine, claims Pending requests, approves/rejects/returns assigned requests, and views the global summary. Distinct second approval remains planned. |

Each account has exactly one role. There is no administrator role in this product.

## 3. Scope and exclusions

**In scope (whole product):** authentication and role-based access; request submission with category and amount; reviewer queue and claiming; approve/reject decisions with reasons; append-only history log and visible chronology; return/edit/resubmission; filtering/search; second approval stage; decision summaries; persistence, reproducible delivery and hardening. F-01 through F-08 and F-10 are implemented/deployed. F-09 is specified but unimplemented; F-11 remains incomplete. No Sprint 2 feature was moved to Sprint 3.

**Exclusions:** self-registration, password recovery, email verification, user administration, multiple roles per account, file attachments, email or other notifications, real payment or budget systems, any external API, multi-department support.

## 4. Functional requirements

| ID | Requirement |
|---|---|
| FR-01 | A user can log in with a username and password and receives an authenticated session. |
| FR-02 | A logged-in user can log out, after which the session no longer grants access. |
| FR-03 | The system can return the identity and role of the currently logged-in user. |
| FR-04 | A Requester can submit a request with title, category, amount and justification; it is created as Pending with no reviewer. |
| FR-05 | A Requester can list their own requests with their current status. |
| FR-06 | A Requester can open one of their own requests and see its status, assigned reviewer, decision and decision reason. |
| FR-07 | A Reviewer can list requests, including a queue view of Pending (unassigned) requests, and open any request read-only. |
| FR-08 | A Reviewer can claim a Pending request, which moves it to In Review and assigns it to them. |
| FR-09 | The assigned Reviewer can approve an In Review request. |
| FR-10 | The assigned Reviewer can reject an In Review request by giving a reason. |
| FR-11 | The system appends a history entry (actor, time, from-state, to-state, reason) for every state transition. |
| FR-12 | A Reviewer can list the requests they have claimed. |
| FR-13 | A request's detail view shows its history log to its Requester and to any Reviewer. |
| FR-14 | The assigned Reviewer can return an In Review request to its Requester with a reason. |
| FR-15 | Only the owner can edit a Returned request and resubmit it directly to In Review with the same Reviewer; the old return reason remains in history. |
| FR-16 | Authorized request lists can be filtered by current state, category and inclusive UTC creation dates and searched by literal case-insensitive title/justification text; all supplied filters combine with AND and cannot widen ownership. |
| FR-17 | Requests at or above THB 50,000.00 require a second approval from a different Reviewer. This requirement is planned and is NOT enforced by the current release. |
| FR-18 | A Reviewer can view global counts by current state and category and terminal decisions attributed to the final decision's Reviewer. One request contributes once; unmatched legacy terminal decisions are explicitly unattributed. All totals come from one database snapshot. |
| FR-19 (CR-L7-01, proposed) | A Requester can withdraw their own unclaimed Pending request. The request remains stored and auditable in a final Withdrawn state. |

## 5. Business rules

| ID | Rule |
|---|---|
| BR-01 | A request must have a non-empty title, a category from the fixed list (Funding, Purchase, Travel, Reimbursement), an amount greater than 0 (in THB) and a non-empty justification; otherwise it is rejected and nothing is stored. |
| BR-02 | A newly submitted request has state Pending and no reviewer. |
| BR-03 | Implemented transitions: Pending -> In Review; In Review -> Approved, Rejected or Returned; Returned -> In Review on owner resubmission. A valid owner edit keeps Returned and is audited. Other transitions fail without mutation. The future second-approval transition in FR-17 is not implemented. Proposed CR-L7-01 adds only Pending -> Withdrawn for its owner while unclaimed; it is not implemented in the referenced baseline. |
| BR-04 | Pending is unassigned. Claim assigns exactly one first Reviewer, retained through return/resubmission. Two simultaneous claims yield one success and one conflict. A future second decision actor under BR-14 will be separate from this first assignment. |
| BR-05 | Only the assigned first Reviewer may currently approve, reject or return an In Review request. An unrelated Reviewer is denied without mutation. Future second-stage authority follows BR-14. |
| BR-06 | A Reviewer cannot claim or decide a request whose Requester is that same user (self-approval is blocked even if roles were ever combined). |
| BR-07 | Rejecting or returning requires a trimmed non-empty reason. A reason is optional when approving. |
| BR-08 | A submitted request cannot be edited by anyone, except that a Returned request can be edited by its Requester (see BR-13). |
| BR-09 | Approved and Rejected are final states. Under proposed CR-L7-01, Withdrawn is also final; that extension is not implemented in the referenced baseline. |
| BR-10 | History entries are append-only: they cannot be edited or deleted through the application. |
| BR-11 | A Requester can see only their own requests. A Reviewer can view all requests read-only, but can claim only Pending requests and can decide only requests they claimed (BR-05). |
| BR-12 | Every account has exactly one role. |
| BR-13 | Only a Returned request may be edited or resubmitted, only by its owner. Resubmit retains the first Reviewer, clears the current reason and returns to In Review, never to the unassigned queue. A no-op edit writes no history. |
| BR-14 | At amount >= THB 50,000.00, the second approval must come from a Reviewer different from the first Reviewer and from the Requester. Planned F-09; current release still finalizes after one approval. |
| BR-15 (CR-L7-01, proposed) | Only the authenticated owner may withdraw their own PENDING request when reviewerId is null. Withdrawal is an atomic PENDING -> WITHDRAWN transition with exactly one append-only history event, is final, and does not delete or rewrite request data. Other states/actors fail without mutation. A concurrent claim and withdrawal permit exactly one transition. |

## 6. Non-functional requirements

| ID | Requirement and measurable target | Verification | Sprint |
|---|---|---|---|
| NFR-01 | Every protected endpoint rejects an unauthenticated request with status 401 and returns no private data. | API test over all protected endpoints | 1 |
| NFR-02 | Forbidden role or ownership access is rejected (403, or 404 where existence must not leak) and returns no private data. | API tests: requester on review operations, cross-requester access, unclaimed reviewer | 1 |
| NFR-03 | Passwords are stored only as salted hashes; no plaintext password appears in the database or logs. | Integration test inspecting stored values | 1 |
| NFR-04 | All request and history data survives a backend restart. | Integration test (restart, re-read) plus manual check | 1 |
| NFR-05 | List endpoints respond in under 500 ms (95th percentile) on a local machine with 1,000 seeded requests. | Timed API test | 3 |
| NFR-06 | Under 2 simultaneous claim attempts on one request, exactly one succeeds and exactly one claim history entry exists. | Concurrent integration test | 1 |
| NFR-07 | A fresh clone can be set up and its tests run using only the README commands. | Fresh-clone dry run by the teammate | 1 |
| NFR-08 | Every form shows a field-level error for each invalid field and keeps the entered values. | UI component test and one end-to-end test | 1 |

## 7. Assumptions

| ID | Assumption |
|---|---|
| A-01 | Demo accounts are seeded: two Requesters and two Reviewers. |
| A-02 | The system serves a single department. |
| A-03 | Amounts are in Thai baht (THB) with no currency conversion. |
| A-04 | Reviewers can see all requests, including those claimed by other Reviewers, but only for reading; they cannot claim or decide them (BR-11, D-14). |
| A-05 | The categories list is fixed and is not editable by users. |
| A-06 | The second approval stage (FR-17, BR-14) applies at or above THB 50,000.00 (Q-02 resolved by user 24 November 2026); implementation remains planned. |

## 8. Resolved decisions

| # | Decision | Resolution |
|---|---|---|
| D-01 | Roles | Requester and Reviewer. One role per account. |
| D-02 | Request categories | Fixed list: Funding, Purchase, Travel, Reimbursement. |
| D-03 | Request fields | Title, category, amount, justification. |
| D-04 | Reviewer assignment | Claim from unassigned Pending queue assigns one first Reviewer; same assignment persists through return/resubmission. Future second actor is separate. |
| D-05 | Self-approval | A claim or decision is rejected if the reviewer is the request's requester. No account has both roles. |
| D-06 | Editing after submission | Locked except for an owner's Returned request, implemented in Sprint 2. |
| D-07 | History | Append-only log entry per transition: actor, time, from-state, to-state, reason. |
| D-08 | Reason | Required on Reject and Return, optional on Approve. Current reason is cleared on resubmit; previous reason remains in history. |
| D-09 | States | Sprint 1 had four states. Current five: Pending, In Review, Returned, Approved, Rejected, with BR-03 transitions. No awaiting-second state exists yet. |
| D-10 | Seed data | Two requesters and two reviewers. |
| D-11 | Stack | Frontend: React, TypeScript, Vite, React Router, Bootstrap. Backend: Node.js, Express, TypeScript. Database: PostgreSQL with Prisma ORM. Testing as implemented: Node.js built-in test runner with Supertest (unit/API/database integration), Playwright (end-to-end). The earlier Vitest proposal was not installed. |
| D-12 | Terminology | "Reviewer" (matches the spec), not "approver". |
| D-13 | Unclaimed or unrelated decision | A reviewer who has not claimed a request cannot approve or reject it (403, no state change). |
| D-14 | Reviewer visibility | Reviewers can view all requests read-only, including those claimed by other Reviewers. They can claim only Pending requests and decide only requests they claimed. |
| D-15 | Returned resubmission | User decision 24 Nov 2026: same Reviewer, In Review. Contract #77 and implementation #79 reviewed/merged; deployed Sprint 2 release. |
| D-16 | Second approval threshold | User decision 24 Nov 2026: at or above THB 50,000.00, including equality. Sprint 3 implementation remains planned. |
| D-17 | Summary attribution | Reviewed F-10 #85: latest matching terminal transition, stable timestamp/ID order, actual Reviewer actor rather than assigned reviewer; missing/invalid legacy actor is unattributed. One SQL statement gives consistent totals. No amounts or private request text are returned. |
| D-18 | Filter semantics | Reviewed F-08 #81: inclusive UTC creation-day range, literal case-insensitive title/justification text, maximum 200 Unicode code points, all filters AND authorized scope. Queue remains Pending; Clear retains current Queue/Mine scope. |

## 9. Question status

| ID | Question | Needed by | Status |
|---|---|---|---|
| Q-01 | After a Returned request is resubmitted, does it go back to the queue or to the same Reviewer? | Sprint 2 contracts | Resolved by user 24 Nov: SAME reviewer, IN_REVIEW |
| Q-02 | What amount threshold triggers the second approval stage? | Sprint 3 contracts | Resolved by user 24 Nov: amount >= THB 50,000.00 |
| Q-03 | Authentication mechanism (session cookie or token, expiry, hashing algorithm). | System SDS (Part C) | Already resolved in System SDS DD-01/02/03: DB session cookie, 8h absolute expiry, bcrypt |

## 10. Revision history

| Version | Date | Change |
|---|---|---|
| 0.1 | 5 Nov 2026 | First draft from Issue #1 decisions D-01 to D-13. |
| 0.2 | 24 Nov 2026 | Record user resolutions Q-01 same reviewer and Q-02 inclusive THB50,000 threshold; acknowledge prior Q-03 design resolution. No new feature implementation/acceptance claimed. Detailed Sprint 2/3 contracts are pending review; full integrated baseline refresh remains #74. |
| 0.3 | 25 Nov 2026 | #74 complete baseline refresh against deployed source: actual Returned workflow, filter/report semantics, current five states and Node runner; preserve all 40 requirement IDs and unimplemented F-09/F-11 targets. Earlier versions remain in Git. |

## 11. Verification and outstanding scope

The assessed baseline remains 40 requirements (18 FR, 14 BR, 8 NFR). CR-L7-01 adds one proposed FR and one proposed BR, bringing the draft contract to 42 requirement entries; these additions are not implemented. The [matrix](traceability.md) records actual tests, evidence/version and gaps, rather than treating planned tests as executed. TEST-12 mappings remain design-only until reviewed implementation and release. In particular FR-17/BR-14 are unimplemented; NFR-05 is unmeasured; NFR-07 lacks a recorded teammate fresh-clone run; NFR-08 is only partially verified. NFR-03 has working bcrypt and public-field tests but no comprehensive stored-password/log audit. NFR-04 has real redeploy continuity evidence, with the separate full-history process-restart exercise still outstanding. These targets have not been weakened or waived.
