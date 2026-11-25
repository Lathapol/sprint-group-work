# Product Defect Correction

## 1 Defect Report

| Field | Entry |
| ----- | ----- |
| Issue ID | [#60](https://github.com/bravefe/Software-Engineer-2/issues/60) |
| Product team | Macau678 |
| Branch | `fix/draft-visibility-and-reviewer-timeline-correction` |
| Findings | F-01 draft visibility; F-02 history completeness and role filtering; F-03 UAT wording |
| Severity | F-01 High; F-02 Medium; F-03 Low |
| Expected result | Drafts are visible only to their Requester. Requesters see complete history, including `CREATED` and `SUBMITTED` on direct submit. Reviewers see `SUBMITTED` and review events without `CREATED` or individual `EDITED` entries. A `RESUBMITTED` note combines all edit notes since the latest return. The UAT labels match the website. |
| Actual result | An assigned Reviewer could open a draft. Reviewer history needed role filtering and the resubmission note showed only the latest edit. On direct submit, `CREATED` was absent from both role timelines instead of appearing for the Requester only. UAT instructions used field and status names that do not match the website. |
| Classification | F-01: high-severity confidentiality defect. F-02: medium-severity audit-history defect. F-03: low-severity documentation defect. |

## 2 Triage

| Finding | Fix | Status |
| ------- | --- | ------ |
| F-01 | Filter `DRAFT` from Reviewer request lists and queue rendering. Deny Reviewer access to draft details and history, whether assigned or unassigned. Keep the draft visible to its owner. | Fixed in branch; deployed retest pending |
| F-02 | Write `CREATED` for every create and `SUBMITTED` for direct submit. Filter `CREATED` and individual requester-generated `EDITED` entries from Reviewer history. Combine all edit notes since the latest return in `RESUBMITTED`. | Fixed in branch; deployed retest pending |
| F-03 | Update the UAT wording to use the labels displayed in the web form. This corrects the test documentation; it does not add a separate Quantity field or change the website. | Corrected |

## 3 RED: Failing Regression Test

- **Case:** UAT-TC-03, assigned Reviewer opening a Requester draft; timeline checks in UAT-TC-01 and UAT-TC-04.
- **Observed failure:** The assigned Reviewer could read the draft details. Reviewer timeline responses could include `CREATED` and requester-generated `EDITED` records.
- **Regression coverage:** `tests/server/integration.test.ts` and `tests/e2e/purchase-approval.spec.ts` now cover assigned and unassigned Reviewer draft access, requester history, and Reviewer history.

## 4 GREEN: Fix

- Reviewer list queries exclude `DRAFT` requests; the queue also filters drafts before rendering.
- Direct Reviewer requests for draft details or history return access denied, for both assigned and unassigned Reviewers.
- The Requester continues to see the draft and complete history.
- Reviewer history omits `CREATED` and `EDITED`. After a draft is submitted, Reviewer history shows `SUBMITTED` with `fromStatus: null` and `toStatus: PENDING_REVIEW`.
- Requester history contains `CREATED` followed by `SUBMITTED` for both draft submission and direct submission. Reviewer history hides `CREATED` and begins with `SUBMITTED`.
- The `RESUBMITTED` reason combines every `EDITED` reason since the latest `RETURNED` event in chronological order. The final note from the edit form is included once, even though the form sends it with both the save and resubmit requests.
- The UAT guide now uses the live labels: `Request Title`, `Description`, `Estimated Amount ($)`, `Assign Reviewer`, and `Business Justification`. Put quantity details in `Description`; there is no separate Quantity input. The status badge reads `Pending Review`; `SUBMITTED` is the timeline action.

## 5 Regression Suite

| Command | Result |
| ------- | ------ |
| `npm run test:server` | Pass: 49 passed, 4 TODOs |
| `npm run test:e2e` | Pass: 3 passed, 2 out-of-scope cases skipped |
| Server/client TypeScript checks | Pass |
| `npm run build` | Blocked during Prisma Client generation by Windows `EPERM` renaming its query-engine file |

UAT-TC-03 was rerun automatically with the assigned Reviewer and a different, unassigned Reviewer. Both were denied draft access and neither saw the draft in the queue. Draft-submission Requester history and Reviewer timeline checks passed. The updated integration and E2E regressions also verify that direct submission shows `CREATED` and `SUBMITTED` to the Requester while the Reviewer sees only `SUBMITTED`. Resubmission note aggregation is covered by the updated tests. This local run does not claim an independent partner retest against the deployed release.

## 6 Review, CI and Release

| Step | Evidence |
| ---- | -------- |
| Fix branch, linked Issue | `fix/draft-visibility-and-reviewer-timeline-correction`; Issue [#60](https://github.com/bravefe/Software-Engineer-2/issues/60) |
| Pull request | Not created in this work |
| Deployed release | Not verified; partner UAT retest remains pending |

## 7 Independent Retest by UAT Team

| Field | Entry |
| ----- | ----- |
| Corrected version given to UAT team | Pending release and handoff |
| Original case / steps to rerun | UAT-TC-03 assigned/unassigned Reviewer draft checks; UAT-TC-01 direct submit; UAT-TC-04 return/edit/resubmit and note summary |
| Actual result | Pending independent retest |
| PASS / FAIL | Pending independent retest |
| Affected cases | UAT-TC-01, UAT-TC-03, and UAT-TC-04 |
