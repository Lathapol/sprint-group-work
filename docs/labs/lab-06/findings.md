# Findings and disposition records

Status: execution has not started. Findings are not yet received/reported; this is NOT a claim of zero defects.

## Individual finding (copy for each real failure)

Issue ID/link; product owner/team; reporter/team/date; tested source and revision; case/AC reference; preconditions and synthetic record IDs; numbered reproduction steps; specified expected result; actual result; readable evidence ID; severity and user impact; partner notification and outcome.

Critical/major: blocks acceptance and requires correction and independent retest. Minor: fix or obtain explicit independent acceptance as a known limitation. Classify against the agreed contract, not developer preference.

## Incoming triage ledger

| Finding | Case/AC | Classification | Evidence-based reason | Severity/impact | Owner | Fix status/disposition | PR/CI/deployed version | Independent retest |
|---|---|---|---|---|---|---|---|---|

Allowed classifications: accepted defect, duplicate (link original), not-defect (explain contract/evidence), enhancement (identify out-of-scope requirement). Reproduce and clarify before dismissing.

## Correction evidence for each accepted defect

1. Defective source SHA and linked finding.
2. Reproducing test file/name, meaningful assertion/setup, command, actual failing output and counts (RED before implementation fix).
3. Fix SHA and relevant diff; same test command/output and counts GREEN; relevant existing regression command/results.
4. Fix branch from sprint staging, substantive teammate review text, required passing CI, integration, reviewed main release.
5. Deployed source SHA/revision, smoke check observations.
6. Independent named tester, date, original reproduction/affected cases, corrected version, actual results/evidence and closure.

Do not fabricate a bug if none is found. Instructor-approved controlled exercises must identify approval, isolated version and independent retest, separately from the healthy release.
