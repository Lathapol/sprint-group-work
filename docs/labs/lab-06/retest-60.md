# UAT6 03 independent retest and finding 60 disposition

Finding: https://github.com/Lathapol/sprint-group-work/issues/60. Product: our Workflow and Approval System. This record concerns this finding/case only, not overall Sprint 1 acceptance.

## Provenance and tested release

The partner's user-supplied retest report names **Patcharak Plipat**, test date **23 November 2026**, app https://approvals-389973748230.asia-southeast1.run.app/, source **8bc9448d478464784acb48fce6bbe4c18973946d**, Cloud Run revision **approvals-r45190529393-1**, and reports PASS. Follow-up screenshots were supplied by the user on 24 November. Their own pixels do not independently show tester, execution timestamp or SHA; attribution/version come from the accompanying retest report. Do not confuse receipt date with execution date.

Original report: UAT6-03 FAIL (Low), claimed 404 instead of 403. Preserve it as historical partner finding. The original linked screenshot demonstrated a cross-owner GET denial, without a visible POST claim invocation; a wrong claim-endpoint status was not established.

## Original prerequisite and observed retest

Fresh synthetic record #13 belongs to requester1. Baseline fixture evidence is evidence/fresh-pending-claim-check.json: title UAT6-03 independent rerun fixture 2026-11-23T13:56:33.386Z; PURCHASE; THB 25.50; Pending; no reviewer; justification Synthetic fresh Pending fixture; retain for partner retest of issue 60.

1. **Forbidden operation, partner screenshot E60-POST:** evidence/partner-retest-claim-403.png shows requester2 signed in; actual fetch POST /api/requests/13/claim with application/json and {}. Console logs the full service POST, status **403 Forbidden** and a result object with method POST and status 403. This matches AC-01-04; no successful claim.
2. **Protected state afterward, partner screenshot E60-STATE:** evidence/partner-retest-owner-unchanged.png shows requester1 signed in, the same uniquely titled fixture, **Pending**, PURCHASE, amount **25.5** (numerically THB 25.50), the same justification and reviewer **Unassigned**. It also shows GET /api/requests/13 status **200**. Its console extracts body.request and prints request:null, which does not demonstrate a null record or expose response fields; our API uses data. The visible owner UI supplies the matching business fields.
3. **Private read restriction:** partner report states requester2 direct read of #13 returned **404**, preventing private disclosure. That is the expected GET contract, separate from the POST 403 rule.

Earlier developer before/after checks corroborate unchanged business representation, including after the documentation release. They remain developer evidence and are not represented as the independent partner's execution. These screenshots do not independently prove a database history count; no extra history-count claim is made.

## Product Team disposition

**Resolved — not a reproduced implementation defect; initial evidence/request-method interpretation issue.** Correctly formed requester2 POST returned the specified 403; the owner's visible protected state matched baseline afterward. The expected POST result remains 403 and the private GET remains 404. No application code or acceptance criterion was changed to obtain the pass; no code-fix RED/GREEN chain is claimed. The original partner FAIL and subsequent partner PASS remain traceable.

Finding #60 can close on this evidence. This does not finish UAT6-07/08, our reciprocal UAT on Macau678, final independent Sprint 1 acceptance, instructor-approved controlled exercise if no legitimate defect exists, or the final submission PDF. Those issues remain open.
